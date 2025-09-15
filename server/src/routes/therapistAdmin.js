const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { authorize } = require('../middleware/authorize');
const { sendEmail } = require('../services/emailService');

// Mock data for now - in production this would come from database
let pendingTherapists = [];
let approvedTherapists = [];
let therapistInvitations = [];

// Get pending therapists
router.get('/pending', authorize(['ADMIN']), async (req, res) => {
    try {
        res.json({
            success: true,
            data: pendingTherapists
        });
    } catch (error) {
        console.error('Error fetching pending therapists:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch pending therapists'
        });
    }
});

// Get approved therapists
router.get('/approved', authorize(['ADMIN']), async (req, res) => {
    try {
        res.json({
            success: true,
            data: approvedTherapists
        });
    } catch (error) {
        console.error('Error fetching approved therapists:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch approved therapists'
        });
    }
});

// Get therapist statistics
router.get('/statistics', authorize(['ADMIN']), async (req, res) => {
    try {
        const stats = {
            total: pendingTherapists.length + approvedTherapists.length,
            pending: pendingTherapists.length,
            approved: approvedTherapists.length,
            active: approvedTherapists.filter(t => t.status === 'active').length
        };
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching therapist statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics'
        });
    }
});

// Send invitation to therapist
router.post('/invite', authorize(['ADMIN']), async (req, res) => {
    try {
        const { email, firstName, lastName, message, specializations, expectedTherapistType } = req.body;
        
        // Validate required fields
        if (!email || !firstName || !lastName) {
            return res.status(400).json({
                success: false,
                error: 'Email, first name, and last name are required'
            });
        }
        
        // Generate unique invitation token
        const invitationToken = crypto.randomBytes(32).toString('hex');
        
        // Create invitation record
        const invitation = {
            id: crypto.randomUUID(),
            email,
            firstName,
            lastName,
            message: message || `שלום ${firstName},\n\nמוזמנת להצטרף לפלטפורמת LUMA כמטפלת מקצועית.\n\nהפלטפורמה שלנו מספקת כלים מתקדמים לניהול לקוחות, תיאום פגישות ומעקב אחר התקדמות הטיפול.\n\nלחצי על הקישור המצורף כדי להתחיל את תהליך ההרשמה:\n[קישור ההרשמה יתווסף אוטומטית]\n\nנשמח לראותך חלק מהקהילה המקצועית שלנו!\n\nבברכה,\nצוות LUMA`,
            specializations: specializations || [],
            expectedTherapistType: expectedTherapistType || '',
            token: invitationToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            status: 'pending',
            createdAt: new Date(),
            createdBy: req.user.id
        };
        
        // Store invitation
        therapistInvitations.push(invitation);
        
        // Send invitation email
        const registrationLink = `${process.env.CLIENT_URL || 'http://localhost:8000'}/therapist/register?token=${invitationToken}`;
        const emailContent = invitation.message.replace('[קישור ההרשמה יתווסף אוטומטית]', registrationLink);
        
        try {
            await sendEmail({
                to: email,
                subject: 'הזמנה להצטרפות לפלטפורמת LUMA',
                html: `
                    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #1976d2;">הזמנה להצטרפות לפלטפורמת LUMA</h2>
                        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            ${emailContent.replace(/\n/g, '<br>')}
                        </div>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${registrationLink}" 
                               style="background: #1976d2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                התחל הרשמה
                            </a>
                        </div>
                        <p style="color: #666; font-size: 12px;">
                            הקישור תקף למשך 7 ימים. אם לא התחלת את תהליך ההרשמה, תוכל להתעלם ממייל זה.
                        </p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error('Error sending invitation email:', emailError);
            // Don't fail the request if email fails
        }
        
        res.json({
            success: true,
            message: 'Invitation sent successfully',
            data: {
                invitationId: invitation.id,
                expiresAt: invitation.expiresAt
            }
        });
        
    } catch (error) {
        console.error('Error sending invitation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send invitation'
        });
    }
});

// Approve therapist
router.post('/:id/approve', authorize(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find therapist in pending list
        const therapistIndex = pendingTherapists.findIndex(t => t._id === id);
        if (therapistIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Therapist not found'
            });
        }
        
        const therapist = pendingTherapists[therapistIndex];
        
        // Move to approved list
        const approvedTherapist = {
            ...therapist,
            status: 'active',
            approvedAt: new Date(),
            approvedBy: req.user.id
        };
        
        approvedTherapists.push(approvedTherapist);
        pendingTherapists.splice(therapistIndex, 1);
        
        // Send approval email
        try {
            await sendEmail({
                to: therapist.email,
                subject: 'שמתך אושרה - ברוכה הבאה לLUMA!',
                html: `
                    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #4caf50;">שמתך אושרה בהצלחה! 🎉</h2>
                        <p>שלום ${therapist.firstName},</p>
                        <p>אנו שמחים להודיעשמתך לפלטפורמת LUMA אושרה בהצלחה!</p>
                        <p>כעת תוכלי להתחבר למערכת ולהתחיל לנהל את הלקוחות שלך.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.CLIENT_URL || 'http://localhost:8000'}/login" 
                               style="background: #4caf50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                התחברי למערכת
                            </a>
                        </div>
                        <p>בברכה,<br>צוות LUMA</p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error('Error sending approval email:', emailError);
        }
        
        res.json({
            success: true,
            message: 'Therapist approved successfully',
            data: approvedTherapist
        });
        
    } catch (error) {
        console.error('Error approving therapist:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to approve therapist'
        });
    }
});

// Reject therapist
router.post('/:id/reject', authorize(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        
        // Find therapist in pending list
        const therapistIndex = pendingTherapists.findIndex(t => t._id === id);
        if (therapistIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Therapist not found'
            });
        }
        
        const therapist = pendingTherapists[therapistIndex];
        
        // Remove from pending list
        pendingTherapists.splice(therapistIndex, 1);
        
        // Send rejection email
        try {
            await sendEmail({
                to: therapist.email,
                subject: 'עדכון לגבי הרשמתך לLUMA',
                html: `
                    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #f44336;">עדכון לגבי הרשמתך</h2>
                        <p>שלום ${therapist.firstName},</p>
                        <p>תודה על התעניינותך בפלטפורמת LUMA.</p>
                        <p>לאחר בדיקה מעמיקה, החלטנו שלא לאשר את הרשמתך כרגע.</p>
                        ${reason ? `<p><strong>סיבה:</strong> ${reason}</p>` : ''}
                        <p>אנו מעודדים אותך לנסות שוב בעתיד.</p>
                        <p>בברכה,<br>צוות LUMA</p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error('Error sending rejection email:', emailError);
        }
        
        res.json({
            success: true,
            message: 'Therapist rejected successfully'
        });
        
    } catch (error) {
        console.error('Error rejecting therapist:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reject therapist'
        });
    }
});

// Update therapist status
router.patch('/:id/status', authorize(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        // Find therapist in approved list
        const therapist = approvedTherapists.find(t => t._id === id);
        if (!therapist) {
            return res.status(404).json({
                success: false,
                error: 'Therapist not found'
            });
        }
        
        // Update status
        therapist.status = status;
        therapist.updatedAt = new Date();
        
        res.json({
            success: true,
            message: 'Therapist status updated successfully',
            data: therapist
        });
        
    } catch (error) {
        console.error('Error updating therapist status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update therapist status'
        });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../services/emailService');

// Mock data for invitations
let therapistInvitations = [];

// Get invitation by token
router.get('/invitation/:token', async (req, res) => {
    try {
        const { token } = req.params;
        
        // Find invitation
        const invitation = therapistInvitations.find(inv => inv.token === token);
        if (!invitation) {
            return res.status(404).json({
                success: false,
                error: 'Invalid or expired invitation'
            });
        }
        
        // Check if invitation is expired
        if (new Date() > invitation.expiresAt) {
            return res.status(400).json({
                success: false,
                error: 'Invitation has expired'
            });
        }
        
        res.json({
            success: true,
            data: {
                email: invitation.email,
                firstName: invitation.firstName,
                lastName: invitation.lastName,
                specializations: invitation.specializations,
                expectedTherapistType: invitation.expectedTherapistType
            }
        });
        
    } catch (error) {
        console.error('Error fetching invitation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch invitation'
        });
    }
});

// Register new therapist
router.post('/register', async (req, res) => {
    try {
        const {
            invitationToken,
            firstName,
            lastName,
            idNumber,
            gender,
            phone,
            email,
            address,
            dateOfBirth,
            password,
            therapistType,
            specializations,
            services,
            experience,
            education,
            certifications,
            languages,
            aboutMe,
            paymentMethod,
            bankDetails,
            billingAddress
        } = req.body;
        
        // Validate invitation token
        if (invitationToken) {
            const invitation = therapistInvitations.find(inv => inv.token === invitationToken);
            if (!invitation) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid invitation token'
                });
            }
            
            if (new Date() > invitation.expiresAt) {
                return res.status(400).json({
                    success: false,
                    error: 'Invitation has expired'
                });
            }
        }
        
        // Validate required fields
        if (!firstName || !lastName || !email || !password || !therapistType) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Generate email verification token
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        
        // Create therapist object
        const therapist = {
            _id: crypto.randomUUID(),
            firstName,
            lastName,
            idNumber,
            gender,
            phone,
            email: email.toLowerCase(),
            address,
            dateOfBirth,
            password: hashedPassword,
            therapistType,
            specializations: specializations || [],
            services: services || [],
            experience: parseInt(experience) || 0,
            education: education || [],
            certifications: certifications || [],
            languages: languages || [],
            aboutMe,
            paymentMethod,
            bankDetails,
            billingAddress,
            status: 'pending_verification',
            emailVerified: false,
            emailVerificationToken,
            createdAt: new Date(),
            invitationToken
        };
        
        // In a real app, save to database
        // For now, we'll store in memory
        global.pendingTherapists = global.pendingTherapists || [];
        global.pendingTherapists.push(therapist);
        
        // Send verification email
        try {
            const verificationLink = `${process.env.CLIENT_URL || 'http://localhost:8000'}/therapist/verify-email?token=${emailVerificationToken}`;
            
            await sendEmail({
                to: email,
                subject: 'אמתי את כתובת המייל שלך - LUMA',
                html: `
                    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #1976d2;">ברוכה הבאה לLUMA! 🎉</h2>
                        <p>שלום ${firstName},</p>
                        <p>תודה על הרשמתך לפלטפורמת LUMA כמטפלת מקצועית.</p>
                        <p>כדי להשלים את ההרשמה, אנא אמתי את כתובת המייל שלך על ידי לחיצה על הקישור למטה:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verificationLink}" 
                               style="background: #1976d2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                אמתי כתובת מייל
                            </a>
                        </div>
                        <p>לאחר האימות, הפרופיל שלך יועבר לאישור הסופר אדמין.</p>
                        <p>אם לא הרשמת לחשבון זה, תוכלי להתעלם ממייל זה.</p>
                        <p>בברכה,<br>צוות LUMA</p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error('Error sending verification email:', emailError);
            // Don't fail the request if email fails
        }
        
        res.json({
            success: true,
            message: 'Registration successful. Please check your email to verify your account.',
            data: {
                therapistId: therapist._id,
                email: therapist.email
            }
        });
        
    } catch (error) {
        console.error('Error registering therapist:', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed'
        });
    }
});

// Verify email
router.post('/verify-email', async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Verification token is required'
            });
        }
        
        // Find therapist with this token
        const therapists = global.pendingTherapists || [];
        const therapist = therapists.find(t => t.emailVerificationToken === token);
        
        if (!therapist) {
            return res.status(400).json({
                success: false,
                error: 'Invalid verification token'
            });
        }
        
        // Update therapist status
        therapist.emailVerified = true;
        therapist.status = 'pending_approval';
        therapist.emailVerifiedAt = new Date();
        
        // Move to pending approval list
        global.pendingTherapists = global.pendingTherapists || [];
        global.approvedTherapists = global.approvedTherapists || [];
        
        // Remove from pending verification
        const index = global.pendingTherapists.findIndex(t => t._id === therapist._id);
        if (index > -1) {
            global.pendingTherapists.splice(index, 1);
        }
        
        // Add to pending approval
        global.pendingTherapists.push(therapist);
        
        res.json({
            success: true,
            message: 'Email verified successfully. Your profile is now pending admin approval.'
        });
        
    } catch (error) {
        console.error('Error verifying email:', error);
        res.status(500).json({
            success: false,
            error: 'Email verification failed'
        });
    }
});

module.exports = router;

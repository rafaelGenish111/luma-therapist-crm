const express = require('express');
const router = express.Router();
const TreatmentSession = require('../models/TreatmentSession');
const Client = require('../models/Client');
const { auth } = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// @route   GET /api/treatment-sessions/client/:clientId
// @desc    קבלת כל הפגישות של לקוח ספציפי
// @access  Private
router.get('/client/:clientId', auth, authorize(['manage_own_clients']), async (req, res) => {
    try {
        const { clientId } = req.params;
        const { page = 1, limit = 20, sort = '-sessionDate' } = req.query;

        // וידוא שהלקוח שייך למטפל
        const client = await Client.findOne({
            _id: clientId,
            therapist: req.user.id
        });

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'לקוח לא נמצא'
            });
        }

        const sessions = await TreatmentSession.find({
            client: clientId,
            therapist: req.user.id,
            isActive: true
        })
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('therapist', 'firstName lastName')
            .exec();

        const total = await TreatmentSession.countDocuments({
            client: clientId,
            therapist: req.user.id,
            isActive: true
        });

        res.json({
            success: true,
            data: {
                sessions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בטעינת פגישות',
            error: error.message
        });
    }
});

// @route   GET /api/treatment-sessions/:sessionId
// @desc    קבלת פגישה ספציפית
// @access  Private
router.get('/:sessionId', auth, authorize(['manage_own_clients']), async (req, res) => {
    try {
        const session = await TreatmentSession.findOne({
            _id: req.params.sessionId,
            therapist: req.user.id,
            isActive: true
        })
            .populate('client', 'fullName idNumber')
            .populate('therapist', 'firstName lastName');

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'פגישה לא נמצאה'
            });
        }

        res.json({
            success: true,
            data: session
        });

    } catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בטעינת פגישה',
            error: error.message
        });
    }
});

// @route   POST /api/treatment-sessions
// @desc    יצירת פגישה חדשה
// @access  Private
router.post('/', auth, authorize(['manage_own_clients']), async (req, res) => {
    try {
        const {
            clientId,
            sessionDate,
            sessionType,
            description,
            nextSessionNotes,
            mood,
            progress
        } = req.body;

        // בדיקת שדות חובה
        if (!clientId || !sessionType || !description) {
            return res.status(400).json({
                success: false,
                message: 'חסרים שדות חובה: לקוח, סוג פגישה ותיאור'
            });
        }

        // וידוא שהלקוח שייך למטפל
        const client = await Client.findOne({
            _id: clientId,
            therapist: req.user.id
        });

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'לקוח לא נמצא'
            });
        }

        // יצירת פגישה חדשה
        const session = new TreatmentSession({
            client: clientId,
            therapist: req.user.id,
            sessionDate: sessionDate || new Date(),
            sessionType,
            description,
            nextSessionNotes,
            mood,
            progress
        });

        await session.save();

        // העלאת הפגישה עם populate
        const populatedSession = await TreatmentSession.findById(session._id)
            .populate('client', 'firstName lastName nationalId')
            .populate('therapist', 'firstName lastName');

        res.status(201).json({
            success: true,
            data: populatedSession,
            message: 'פגישה נוצרה בהצלחה'
        });

    } catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה ביצירת פגישה',
            error: error.message
        });
    }
});

// @route   PUT /api/treatment-sessions/:sessionId
// @desc    עדכון פגישה
// @access  Private
router.put('/:sessionId', auth, authorize(['manage_own_clients']), async (req, res) => {
    try {
        const session = await TreatmentSession.findOne({
            _id: req.params.sessionId,
            therapist: req.user.id,
            isActive: true
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'פגישה לא נמצאה'
            });
        }

        // עדכון השדות שנשלחו
        const updateFields = [
            'sessionDate', 'sessionType', 'sessionDescription', 'sessionGoals',
            'nextSessionNotes', 'duration', 'mood', 'progress', 'tags',
            'clientSatisfaction', 'therapistNotes'
        ];

        updateFields.forEach(field => {
            if (req.body[field] !== undefined) {
                session[field] = req.body[field];
            }
        });

        session.lastModifiedBy = req.user.id;
        await session.save();

        const populatedSession = await TreatmentSession.findById(session._id)
            .populate('client', 'fullName idNumber')
            .populate('therapist', 'firstName lastName');

        res.json({
            success: true,
            data: populatedSession,
            message: 'פגישה עודכנה בהצלחה'
        });

    } catch (error) {
        console.error('Update session error:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בעדכון פגישה',
            error: error.message
        });
    }
});

// @route   DELETE /api/treatment-sessions/:sessionId
// @desc    מחיקת פגישה (soft delete)
// @access  Private
router.delete('/:sessionId', auth, authorize(['manage_own_clients']), async (req, res) => {
    try {
        const session = await TreatmentSession.findOne({
            _id: req.params.sessionId,
            therapist: req.user.id,
            isActive: true
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'פגישה לא נמצאה'
            });
        }

        session.isActive = false;
        session.lastModifiedBy = req.user.id;
        await session.save();

        res.json({
            success: true,
            message: 'פגישה נמחקה בהצלחה'
        });

    } catch (error) {
        console.error('Delete session error:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה במחיקת פגישה',
            error: error.message
        });
    }
});

// @route   GET /api/treatment-sessions/client/:clientId/stats
// @desc    קבלת סטטיסטיקות לקוח
// @access  Private
router.get('/client/:clientId/stats', auth, authorize(['manage_own_clients']), async (req, res) => {
    try {
        const { clientId } = req.params;

        // וידוא שהלקוח שייך למטפל
        const client = await Client.findOne({
            _id: clientId,
            therapist: req.user.id
        });

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'לקוח לא נמצא'
            });
        }

        const stats = await TreatmentSession.getSessionStats(clientId);
        const progressSummary = await TreatmentSession.getProgressSummary(clientId, 5);

        res.json({
            success: true,
            data: {
                stats: stats[0] || {
                    totalSessions: 0,
                    avgDuration: 0,
                    lastSessionDate: null,
                    sessionTypes: []
                },
                recentProgress: progressSummary
            }
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בטעינת סטטיסטיקות',
            error: error.message
        });
    }
});

// @route   GET /api/treatment-sessions/meta/labels
// @desc    קבלת תוויות בעברית לטפסים
// @access  Private
router.get('/meta/labels', auth, (req, res) => {
    res.json({
        success: true,
        data: {
            sessionTypes: {
                intake: 'אינטייק',
                followup: 'פגישת מעקב',
                assessment: 'הערכה',
                therapy: 'טיפול',
                summary: 'סיכום',
                emergency: 'חירום',
                consultation: 'ייעוץ',
                other: 'אחר'
            },
            moods: {
                excellent: 'מצוין',
                good: 'טוב',
                neutral: 'נייטרלי',
                difficult: 'קשה',
                very_difficult: 'קשה מאוד'
            },
            progress: {
                significant_improvement: 'שיפור משמעותי',
                improvement: 'שיפור',
                stable: 'יציב',
                slight_decline: 'ירידה קלה',
                decline: 'ירידה'
            }
        }
    });
});

module.exports = router;

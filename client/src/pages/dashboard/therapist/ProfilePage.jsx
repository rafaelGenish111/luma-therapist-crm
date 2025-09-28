import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    Avatar,
    IconButton,
    Card,
    CardContent,
    Divider,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    PhotoCamera as PhotoCameraIcon,
    Delete as DeleteIcon,
    Facebook as FacebookIcon,
    Instagram as InstagramIcon,
    LinkedIn as LinkedInIcon,
    Twitter as TwitterIcon,
    YouTube as YouTubeIcon,
    Language as LanguageIcon,
    WhatsApp as WhatsAppIcon,
    Work as WorkIcon,
    School as SchoolIcon,
    Star as StarIcon,
    Launch as LaunchIcon
} from '@mui/icons-material';
import { useAuth } from '../../../context/AuthContext';
import { getTherapistProfile, updateTherapistProfile, uploadProfileImage, deleteProfileImage, uploadClinicImage, deleteClinicImage } from '../../../services/therapistService';

import Footer from '../../../components/common/Footer';

const HEALTH_DECLARATION_URL = '/health-declaration'; // ניתן לשנות לכתובת מלאה אם צריך

function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
}

const ProfilePage = () => {
    const { user, updateUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [imageDialog, setImageDialog] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [copied, setCopied] = useState(false);
    const [previewClinicImage, setPreviewClinicImage] = useState(null);
    const declarationLink = window.location.origin + HEALTH_DECLARATION_URL;

    // שעות עבודה
    const workingDays = [
        { key: 'sunday', label: 'ראשון' },
        { key: 'monday', label: 'שני' },
        { key: 'tuesday', label: 'שלישי' },
        { key: 'wednesday', label: 'רביעי' },
        { key: 'thursday', label: 'חמישי' },
        { key: 'friday', label: 'שישי' },
        { key: 'saturday', label: 'שבת' }
    ];

    // שפות
    const languages = ['עברית', 'אנגלית', 'ערבית', 'רוסית', 'צרפתית', 'ספרדית', 'גרמנית', 'אחר'];

    // מקצועות
    const professions = [
        'פסיכולוגית', 'פסיכולוגית קלינית', 'פסיכולוגית חינוכית', 'פסיכולוגית התפתחותית',
        'עובדת סוציאלית', 'עובדת סוציאלית קלינית',
        'מטפלת זוגית', 'מטפלת משפחתית',
        'מטפלת באמנות', 'מטפלת בתנועה', 'מטפלת במוזיקה', 'מטפלת בדרמה',
        'מטפלת הוליסטית', 'רפלקסולוגית', 'קוסמטיקאית',
        'מטפלת ברפואה משלימה',
        'יועצת חינוכית', 'יועצת זוגית',
        'מאמנת אישית', 'מאמנת עסקית',
        'אחר'
    ];

    useEffect(() => {
        loadProfile();
    }, []);

    // Cleanup blob URLs when component unmounts
    useEffect(() => {
        return () => {
            if (previewClinicImage) {
                URL.revokeObjectURL(previewClinicImage);
            }
        };
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            setError('');

            // בדיקת התחברות
            console.log('Current user:', user);
            console.log('Access token exists:', !!localStorage.getItem('accessToken'));

            if (!user) {
                console.log('User not authenticated');
                setError('נדרש להתחבר למערכת');
                return;
            }

            const response = await getTherapistProfile();
            console.log('Profile response:', response);
            console.log('Profile response type:', typeof response);
            console.log('Profile response data:', response);

            // אם התגובה היא מערך ריק או undefined, ננסה לטעון שוב או להציג הודעת שגיאה
            if (!response || (Array.isArray(response) && response.length === 0)) {
                console.log('Profile data is empty or undefined');
                setError('לא נמצאו נתוני פרופיל - ייתכן שהפרופיל לא הוגדר עדיין');
                return;
            }

            setProfile(response);
        } catch (error) {
            console.error('Profile load error:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response,
                data: error.response?.data
            });

            if (error.message && error.message.includes('Unauthorized')) {
                setError('נדרש להתחבר מחדש למערכת');
            } else if (error.message) {
                setError(error.message);
            } else {
                setError('שגיאה בטעינת הפרופיל: ' + (error.message || 'שגיאה לא ידועה'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError('');
            setSuccess('');
            console.log('ProfilePage - Starting save process...');

            // שלח את כל השדות כולל clinicImage, homeSummary, businessName
            const response = await updateTherapistProfile({
                ...profile,
                clinicImage: profile.clinicImage || '',
                homeSummary: profile.homeSummary || '',
                businessName: profile.businessName || ''
            });

            console.log('ProfilePage - Save response:', response);
            setProfile(response.data);
            setEditMode(false);
            setSuccess('פרופיל עודכן בהצלחה');
            setPreviewClinicImage(null); // איפוס תצוגה מקדימה

            // עדכון המשתמש ב-AuthContext
            if (updateUser) {
                console.log('ProfilePage - Updating user in AuthContext...');
                updateUser(response.data);
            }

            console.log('ProfilePage - Save completed successfully');
        } catch (error) {
            console.error('ProfilePage - Save error:', error);
            setError(error.error || 'שגיאה בעדכון הפרופיל');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditMode(false);
        loadProfile(); // טעינה מחדש מהשרת
    };

    const handleImageUpload = async (fileParam) => {
        const fileToUpload = fileParam || selectedImage;
        if (!fileToUpload) return;

        try {
            setUploading(true);
            setError('');
            setSuccess('');

            // בדיקת התחברות לפני העלאה
            const token = localStorage.getItem('accessToken');
            console.log('ProfilePage - Token exists:', !!token);
            console.log('ProfilePage - User:', user);

            if (!token) {
                throw new Error('נדרש להתחבר מחדש למערכת');
            }

            const response = await uploadProfileImage(fileToUpload);
            console.log('Upload response in ProfilePage:', response);

            // בדיקה שהתגובה תקינה
            if (!response || !response.data) {
                throw new Error('תגובה לא תקינה מהשרת');
            }

            const updatedProfile = {
                ...profile,
                profileImage: response.data.profileImage,
                profileImagePublicId: response.data.profileImagePublicId,
                profileImageProvider: response.data.provider
            };
            setProfile(updatedProfile);

            // עדכון המשתמש ב־AuthContext (רק את השדות הקיימים)
            updateUser({
                ...user,
                profileImage: response.data.profileImage,
                profileImagePublicId: response.data.profileImagePublicId
            });

            setImageDialog(false);
            setSelectedImage(null);
            setSuccess('תמונת פרופיל הועלתה בהצלחה');
        } catch (error) {
            console.error('ProfilePage - Image upload error:', error);
            if (error.message && error.message.includes('401')) {
                setError('ההתחברות פגה. אנא התחבר מחדש');
            } else if (error.message && error.message.includes('Unauthorized')) {
                setError('ההתחברות פגה. אנא התחבר מחדש');
            } else {
                setError(error.message || 'שגיאה בהעלאת תמונה');
            }
        } finally {
            setUploading(false);
        }
    };

    const handleImageDelete = async () => {
        try {
            setUploading(true);
            setError('');
            setSuccess('');

            await deleteProfileImage();
            const updatedProfile = {
                ...profile,
                profileImage: null,
                profileImagePublicId: null
            };
            setProfile(updatedProfile);

            // עדכון המשתמש ב־AuthContext
            updateUser({
                ...user,
                profileImage: null,
                profileImagePublicId: null
            });

            setSuccess('תמונת פרופיל נמחקה בהצלחה');
        } catch (error) {
            setError(error.error || 'שגיאה במחיקת תמונה');
        } finally {
            setUploading(false);
        }
    };

    const handleImageSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            // בדיקת סוג הקובץ
            if (!file.type.startsWith('image/')) {
                setError('אנא בחר קובץ תמונה בלבד');
                return;
            }

            // בדיקת גודל הקובץ (5MB מקסימום)
            if (file.size > 5 * 1024 * 1024) {
                setError('גודל הקובץ לא יכול לעלות על 5MB');
                return;
            }

            setSelectedImage(file);
            // העלאה אוטומטית מיד לאחר בחירה
            handleImageUpload(file);
        }
    };

    const handleInputChange = (field, value) => {
        setProfile(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSocialMediaChange = (platform, value) => {
        setProfile(prev => ({
            ...prev,
            socialMedia: {
                ...prev.socialMedia,
                [platform]: value
            }
        }));
    };

    const handleWorkingHoursChange = (day, field, value) => {
        setProfile(prev => ({
            ...prev,
            workingHours: {
                ...prev.workingHours,
                [day]: {
                    ...prev.workingHours[day],
                    [field]: value
                }
            }
        }));
    };

    const handleCopy = () => {
        copyToClipboard(declarationLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClinicImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // בדיקת סוג הקובץ
        if (!file.type.startsWith('image/')) {
            setError('אנא בחר קובץ תמונה בלבד');
            return;
        }

        // בדיקת גודל הקובץ (5MB מקסימום)
        if (file.size > 5 * 1024 * 1024) {
            setError('גודל הקובץ לא יכול לעלות על 5MB');
            return;
        }

        try {
            setUploading(true);
            setError('');
            setSuccess('');

            const res = await uploadClinicImage(file);
            setProfile(prev => ({ ...prev, clinicImage: res.url }));
            setSuccess('התמונה הועלתה בהצלחה');

            // ניקוי ה-preview URL הישן
            if (previewClinicImage) {
                URL.revokeObjectURL(previewClinicImage);
            }
            setPreviewClinicImage(null);
        } catch (error) {
            console.error('Clinic image upload error:', error);
            if (error.message && error.message.includes('401')) {
                setError('ההתחברות פגה. אנא התחבר מחדש');
            } else if (error.message && error.message.includes('Unauthorized')) {
                setError('ההתחברות פגה. אנא התחבר מחדש');
            } else {
                setError('שגיאה בהעלאת תמונה: ' + (error.message || 'שגיאה לא ידועה'));
            }

            // ניקוי ה-preview URL במקרה של שגיאה
            if (previewClinicImage) {
                URL.revokeObjectURL(previewClinicImage);
                setPreviewClinicImage(null);
            }
        } finally {
            setUploading(false);
        }
    };

    const handleClinicImageDelete = async () => {
        try {
            setUploading(true);
            setError('');
            await deleteClinicImage();
            setProfile(prev => ({ ...prev, clinicImage: '' }));
            setSuccess('התמונה נמחקה');
        } catch {
            setError('שגיאה במחיקת תמונה');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (!profile && !loading) {
        return (
            <Container maxWidth="lg">
                {error ? (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                        {error.includes('לא נמצאו נתוני פרופיל') && (
                            <Box sx={{ mt: 2 }}>
                                <Button
                                    variant="contained"
                                    onClick={loadProfile}
                                    sx={{ mr: 1 }}
                                >
                                    נסה שוב
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => {
                                        // יצירת פרופיל חדש עם נתונים בסיסיים
                                        const newProfile = {
                                            firstName: user?.firstName || '',
                                            lastName: user?.lastName || '',
                                            email: user?.email || '',
                                            phone: user?.phone || '',
                                            businessName: user?.businessName || '',
                                            professionalDescription: '',
                                            specializations: [],
                                            website: {
                                                isActive: false,
                                                domain: '',
                                                theme: {}
                                            }
                                        };
                                        setProfile(newProfile);
                                        setEditing(true);
                                    }}
                                >
                                    צור פרופיל חדש
                                </Button>
                            </Box>
                        )}
                    </Alert>
                ) : (
                    <Alert severity="info">
                        טוען פרופיל...
                    </Alert>
                )}
            </Container>
        );
    }

    return (
        <Box>
            <Box p={4}>
                <Container maxWidth="lg" sx={{ py: 4 }}>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                            <Typography variant="h4" component="h1">
                                פרופיל אישי
                            </Typography>
                            {!editMode ? (
                                <Button
                                    variant="contained"
                                    startIcon={<EditIcon />}
                                    onClick={() => setEditMode(true)}
                                >
                                    עריכה
                                </Button>
                            ) : (
                                <Box>
                                    <Button
                                        variant="outlined"
                                        startIcon={<CancelIcon />}
                                        onClick={handleCancel}
                                        sx={{ mr: 1 }}
                                    >
                                        ביטול
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={<SaveIcon />}
                                        onClick={handleSave}
                                        disabled={saving}
                                    >
                                        {saving ? <CircularProgress size={20} /> : 'שמירה'}
                                    </Button>
                                </Box>
                            )}
                        </Box>

                        <Grid container spacing={3}>
                            {/* תמונת פרופיל */}
                            <Grid item xs={12} md={3}>
                                <Card>
                                    <CardContent sx={{ textAlign: 'center' }}>
                                        <Box position="relative" display="inline-block">
                                            <Avatar
                                                src={profile.profileImage &&
                                                    !profile.profileImage.startsWith('blob:') ?
                                                    (profile.profileImage.startsWith('/uploads/') ?
                                                        `http://localhost:5000${profile.profileImage}` :
                                                        profile.profileImage) :
                                                    undefined}
                                                sx={{ width: 150, height: 150, mb: 2 }}
                                            />
                                            {editMode && (
                                                <Box position="absolute" bottom={0} right={0}>
                                                    <input
                                                        accept="image/*"
                                                        style={{ display: 'none' }}
                                                        id="profile-image-input"
                                                        type="file"
                                                        onChange={handleImageSelect}
                                                    />
                                                    <label htmlFor="profile-image-input">
                                                        <IconButton
                                                            color="primary"
                                                            component="span"
                                                            sx={{ bgcolor: 'white' }}
                                                        >
                                                            <PhotoCameraIcon />
                                                        </IconButton>
                                                    </label>
                                                </Box>
                                            )}
                                        </Box>
                                        {editMode && profile.profileImage && (
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                startIcon={<DeleteIcon />}
                                                onClick={handleImageDelete}
                                                disabled={uploading}
                                                size="small"
                                            >
                                                מחיקת תמונה
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* פרטים אישיים */}
                            <Grid item xs={12} md={9}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="שם פרטי"
                                            value={profile.firstName || ''}
                                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                                            disabled={!editMode}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="שם משפחה"
                                            value={profile.lastName || ''}
                                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                                            disabled={!editMode}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="טלפון"
                                            value={profile.phone || ''}
                                            onChange={(e) => handleInputChange('phone', e.target.value)}
                                            disabled={!editMode}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="אימייל"
                                            value={profile.email || ''}
                                            disabled
                                            helperText="אימייל לא ניתן לשינוי"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="תאריך לידה"
                                            type="date"
                                            value={profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : ''}
                                            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                            disabled={!editMode}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>מקצוע</InputLabel>
                                            <Select
                                                value={profile.profession || ''}
                                                onChange={(e) => handleInputChange('profession', e.target.value)}
                                                disabled={!editMode}
                                                label="מקצוע"
                                            >
                                                {professions.map(prof => (
                                                    <MenuItem key={prof} value={prof}>{prof}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* תיאורים */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h5" component="h2" mb={3}>
                            תיאורים
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="תיאור מקצועי"
                                    multiline
                                    rows={4}
                                    value={profile.professionalDescription || ''}
                                    onChange={(e) => handleInputChange('professionalDescription', e.target.value)}
                                    disabled={!editMode}
                                    helperText="תיאור קצר על המקצוע והשירותים שלך"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="סיפור אישי"
                                    multiline
                                    rows={4}
                                    value={profile.personalStory || ''}
                                    onChange={(e) => handleInputChange('personalStory', e.target.value)}
                                    disabled={!editMode}
                                    helperText="סיפור אישי על הדרך שלך למקצוע"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="עליי"
                                    multiline
                                    rows={3}
                                    value={profile.aboutMe || ''}
                                    onChange={(e) => handleInputChange('aboutMe', e.target.value)}
                                    disabled={!editMode}
                                    helperText="טקסט קצר על עצמך"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="תקציר/ברכה לדף הבית"
                                    multiline
                                    rows={3}
                                    value={profile.homeSummary || ''}
                                    onChange={(e) => handleInputChange('homeSummary', e.target.value)}
                                    disabled={!editMode}
                                    helperText="הטקסט שיוצג בדף הבית באתר האישי שלך"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Box mb={2}>
                                    <Typography variant="subtitle1">תמונת קליניקה לדף הבית</Typography>
                                    {((profile.clinicImage && !profile.clinicImage.startsWith('blob:') && !previewClinicImage) || previewClinicImage) && (
                                        <Box position="relative" display="inline-block">
                                            <img src={previewClinicImage || profile.clinicImage} alt="קליניקה" style={{ maxWidth: 220, borderRadius: 8, marginBottom: 8 }} />
                                            {editMode && profile.clinicImage && !previewClinicImage && (
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    size="small"
                                                    onClick={handleClinicImageDelete}
                                                    sx={{ position: 'absolute', top: 8, left: 8 }}
                                                    disabled={uploading}
                                                >
                                                    מחק תמונה
                                                </Button>
                                            )}
                                        </Box>
                                    )}
                                    {editMode && (
                                        <>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleClinicImageUpload}
                                                style={{ marginTop: 8 }}
                                            />
                                            <input
                                                type="text"
                                                placeholder="או הדבק כאן קישור לתמונה (URL)"
                                                value={profile.clinicImage || ''}
                                                onChange={e => handleInputChange('clinicImage', e.target.value)}
                                                style={{ width: '100%', marginTop: 8 }}
                                            />
                                        </>
                                    )}
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* רשתות חברתיות */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h5" component="h2" mb={3}>
                            רשתות חברתיות וקישורים
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="קישור וואטסאפ"
                                    value={profile.whatsappLink || ''}
                                    onChange={(e) => handleInputChange('whatsappLink', e.target.value)}
                                    disabled={!editMode}
                                    helperText="פורמט: https://wa.me/972501234567"
                                    InputProps={{
                                        startAdornment: <WhatsAppIcon sx={{ mr: 1, color: 'green' }} />
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="פייסבוק"
                                    value={profile.socialMedia?.facebook || ''}
                                    onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                                    disabled={!editMode}
                                    InputProps={{
                                        startAdornment: <FacebookIcon sx={{ mr: 1, color: 'blue' }} />
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="אינסטגרם"
                                    value={profile.socialMedia?.instagram || ''}
                                    onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                                    disabled={!editMode}
                                    InputProps={{
                                        startAdornment: <InstagramIcon sx={{ mr: 1, color: 'purple' }} />
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="לינקדאין"
                                    value={profile.socialMedia?.linkedin || ''}
                                    onChange={(e) => handleSocialMediaChange('linkedin', e.target.value)}
                                    disabled={!editMode}
                                    InputProps={{
                                        startAdornment: <LinkedInIcon sx={{ mr: 1, color: 'blue' }} />
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="טוויטר"
                                    value={profile.socialMedia?.twitter || ''}
                                    onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
                                    disabled={!editMode}
                                    InputProps={{
                                        startAdornment: <TwitterIcon sx={{ mr: 1, color: 'lightblue' }} />
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="יוטיוב"
                                    value={profile.socialMedia?.youtube || ''}
                                    onChange={(e) => handleSocialMediaChange('youtube', e.target.value)}
                                    disabled={!editMode}
                                    InputProps={{
                                        startAdornment: <YouTubeIcon sx={{ mr: 1, color: 'red' }} />
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="אתר אישי"
                                    value={profile.socialMedia?.website || ''}
                                    onChange={(e) => handleSocialMediaChange('website', e.target.value)}
                                    disabled={!editMode}
                                    InputProps={{
                                        startAdornment: <LanguageIcon sx={{ mr: 1 }} />
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="קישור Calendly"
                                    value={profile.calendlyUrl || ''}
                                    onChange={(e) => handleInputChange('calendlyUrl', e.target.value)}
                                    disabled={!editMode}
                                    helperText="קישור לקביעת פגישות ב-Calendly"
                                    placeholder="https://calendly.com/your-username"
                                />
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* שעות עבודה */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h5" component="h2" mb={3}>
                            שעות עבודה
                        </Typography>
                        <Grid container spacing={2}>
                            {workingDays.map(day => (
                                <Grid item xs={12} key={day.key}>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={profile.workingHours?.[day.key]?.isWorking || false}
                                                    onChange={(e) => handleWorkingHoursChange(day.key, 'isWorking', e.target.checked)}
                                                    disabled={!editMode}
                                                />
                                            }
                                            label={day.label}
                                            sx={{ minWidth: 80 }}
                                        />
                                        {profile.workingHours?.[day.key]?.isWorking && (
                                            <>
                                                <TextField
                                                    label="מתחיל"
                                                    type="time"
                                                    value={profile.workingHours[day.key]?.start || ''}
                                                    onChange={(e) => handleWorkingHoursChange(day.key, 'start', e.target.value)}
                                                    disabled={!editMode}
                                                    InputLabelProps={{ shrink: true }}
                                                    sx={{ width: 120 }}
                                                />
                                                <TextField
                                                    label="מסתיים"
                                                    type="time"
                                                    value={profile.workingHours[day.key]?.end || ''}
                                                    onChange={(e) => handleWorkingHoursChange(day.key, 'end', e.target.value)}
                                                    disabled={!editMode}
                                                    InputLabelProps={{ shrink: true }}
                                                    sx={{ width: 120 }}
                                                />
                                            </>
                                        )}
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>

                    {/* שפות */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h5" component="h2" mb={3}>
                            שפות
                        </Typography>
                        <FormControl fullWidth>
                            <InputLabel>שפות דיבור</InputLabel>
                            <Select
                                multiple
                                value={profile.languages || ['עברית']}
                                onChange={(e) => handleInputChange('languages', e.target.value)}
                                disabled={!editMode}
                                label="שפות דיבור"
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value) => (
                                            <Chip key={value} label={value} />
                                        ))}
                                    </Box>
                                )}
                            >
                                {languages.map((language) => (
                                    <MenuItem key={language} value={language}>
                                        {language}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Paper>

                    {/* פרטי עסק */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h5" component="h2" mb={3}>
                            פרטי עסק
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="שם עסק"
                                    value={profile.businessName || ''}
                                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                                    disabled={!editMode}
                                    helperText="השם שיוצג באתר האישי (אם קיים)"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="טלפון עסקי"
                                    value={profile.businessPhone || ''}
                                    onChange={(e) => handleInputChange('businessPhone', e.target.value)}
                                    disabled={!editMode}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="אימייל עסקי"
                                    value={profile.businessEmail || ''}
                                    onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                                    disabled={!editMode}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="תעריף שעתי"
                                    type="number"
                                    value={profile.hourlyRate || ''}
                                    onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                                    disabled={!editMode}
                                    InputProps={{
                                        endAdornment: <Typography variant="body2">₪</Typography>
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="רחוב"
                                    value={profile.businessAddress?.street || ''}
                                    onChange={(e) => handleInputChange('businessAddress', {
                                        ...profile.businessAddress,
                                        street: e.target.value
                                    })}
                                    disabled={!editMode}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="עיר"
                                    value={profile.businessAddress?.city || ''}
                                    onChange={(e) => handleInputChange('businessAddress', {
                                        ...profile.businessAddress,
                                        city: e.target.value
                                    })}
                                    disabled={!editMode}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="מיקוד"
                                    value={profile.businessAddress?.zipCode || ''}
                                    onChange={(e) => handleInputChange('businessAddress', {
                                        ...profile.businessAddress,
                                        zipCode: e.target.value
                                    })}
                                    disabled={!editMode}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="מדינה"
                                    value={profile.businessAddress?.country || 'ישראל'}
                                    onChange={(e) => handleInputChange('businessAddress', {
                                        ...profile.businessAddress,
                                        country: e.target.value
                                    })}
                                    disabled={!editMode}
                                />
                            </Grid>
                        </Grid>
                    </Paper>

                    <div style={{ marginTop: 24 }}>
                        <h3>הצהרת בריאות תקינה</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="text" value={declarationLink} readOnly style={{ width: 300, direction: 'ltr' }} />
                            <button onClick={handleCopy}>{copied ? 'הועתק!' : 'העתק קישור'}</button>
                        </div>
                        <small>שלחי ללקוחות למילוי הצהרת בריאות לפני טיפול</small>
                    </div>

                    <Box mb={2}>
                        <Typography variant="subtitle1" fontWeight={600} mb={1}>האתר האישי שלך</Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                            <input
                                type="text"
                                value={`${window.location.origin}/website/${profile._id}`}
                                readOnly
                                style={{ width: 320, direction: 'ltr', fontSize: 14 }}
                            />
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                    copyToClipboard(`${window.location.origin}/website/${profile._id}`);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                }}
                            >
                                {copied ? 'הועתק!' : 'העתק קישור'}
                            </Button>
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<LaunchIcon />}
                                onClick={() => {
                                    window.open(`${window.location.origin}/website/${profile._id}`, '_blank');
                                }}
                            >
                                עבור לאתר
                            </Button>
                        </Box>
                        <Typography variant="caption" color="text.secondary">שלחי ללקוחות כדי שיכירו אותך ויקבעו תור</Typography>
                    </Box>
                </Container>
            </Box>
            <Footer variant="therapist" />
        </Box>
    );
};

export default ProfilePage; 
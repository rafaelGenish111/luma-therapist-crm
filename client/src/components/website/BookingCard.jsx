import React, { useState } from 'react';
import {
    Card,
    CardContent,
    CardActions,
    Typography,
    Button,
    Box,
    Chip,
    Alert
} from '@mui/material';
import {
    CalendarToday as CalendarIcon,
    Email as EmailIcon,
    AccessTime as TimeIcon
} from '@mui/icons-material';
import BookingModal from './BookingModal';

const BookingCard = ({ therapist }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [showCalendly, setShowCalendly] = useState(false);

    const hasCalendly = therapist.calendlyUrl && therapist.calendlyUrl.trim() !== '';
    const hasEmail = therapist.businessEmail || therapist.email;

    const handleBookingClick = () => {
        if (hasCalendly) {
            setShowCalendly(true);
        }
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setShowCalendly(false);
    };

    // אם אין אפשרויות קביעת תור
    if (!hasCalendly && !hasEmail) {
        return (
            <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
                <CardContent>
                    <Alert severity="info">
                        <Typography variant="body2">
                            לקביעת תור, אנא צרו קשר ישירות עם המטפל.
                        </Typography>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card sx={{
                mb: 3,
                border: '1px solid #e0e0e0',
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
            }}>
                <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <CalendarIcon color="primary" />
                        <Typography variant="h5" component="h2" fontWeight={600}>
                            קביעת תור
                        </Typography>
                    </Box>

                    <Typography variant="body1" color="text.secondary" mb={2}>
                        קבע/י תור לטיפול עם {therapist.firstName} {therapist.lastName}
                    </Typography>

                    {/* אפשרויות קביעת תור */}
                    <Box display="flex" flexDirection="column" gap={1} mb={2}>
                        {hasCalendly && (
                            <Box display="flex" alignItems="center" gap={1}>
                                <CalendarIcon color="success" fontSize="small" />
                                <Typography variant="body2">
                                    קביעת תור אונליין דרך Calendly
                                </Typography>
                                <Chip
                                    label="זמין"
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                />
                            </Box>
                        )}

                        {hasEmail && (
                            <Box display="flex" alignItems="center" gap={1}>
                                <EmailIcon color="primary" fontSize="small" />
                                <Typography variant="body2">
                                    קביעת תור במייל
                                </Typography>
                                <Chip
                                    label="זמין"
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                />
                            </Box>
                        )}
                    </Box>

                    {/* שעות עבודה */}
                    {therapist.workingHours && (
                        <Box mb={2}>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <TimeIcon color="action" fontSize="small" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    שעות עבודה:
                                </Typography>
                            </Box>
                            <Box display="flex" flexWrap="wrap" gap={0.5}>
                                {Object.entries(therapist.workingHours).map(([day, hours]) => {
                                    if (hours.isWorking) {
                                        const dayLabels = {
                                            sunday: 'ראשון',
                                            monday: 'שני',
                                            tuesday: 'שלישי',
                                            wednesday: 'רביעי',
                                            thursday: 'חמישי',
                                            friday: 'שישי',
                                            saturday: 'שבת'
                                        };
                                        return (
                                            <Chip
                                                key={day}
                                                label={`${dayLabels[day]} ${hours.start}-${hours.end}`}
                                                size="small"
                                                variant="outlined"
                                                color="default"
                                            />
                                        );
                                    }
                                    return null;
                                })}
                            </Box>
                        </Box>
                    )}

                    {/* מידע נוסף */}
                    {therapist.hourlyRate && (
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            <strong>תעריף:</strong> {therapist.hourlyRate} ₪ לשעה
                        </Typography>
                    )}

                    {therapist.languages && therapist.languages.length > 0 && (
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            <strong>שפות:</strong> {therapist.languages.join(', ')}
                        </Typography>
                    )}
                </CardContent>

                <CardActions sx={{ p: 3, pt: 0 }}>
                    <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        onClick={handleBookingClick}
                        startIcon={hasCalendly ? <CalendarIcon /> : <EmailIcon />}
                        sx={{
                            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
                            }
                        }}
                    >
                        {hasCalendly ? 'קביעת תור אונליין' : 'קביעת תור במייל'}
                    </Button>
                </CardActions>
            </Card>

            {/* מודאל קביעת תור */}
            <BookingModal
                open={modalOpen}
                onClose={handleCloseModal}
                therapist={therapist}
                calendlyUrl={therapist.calendlyUrl}
            />
        </>
    );
};

export default BookingCard;



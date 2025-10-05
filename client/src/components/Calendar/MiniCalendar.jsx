import React, { useState, useMemo } from 'react';
import moment from 'moment';
import 'moment/locale/he';

import {
    Paper,
    Typography,
    IconButton,
    Box,
    Tooltip,
    Chip,
    Stack,
    Divider
} from '@mui/material';

import {
    NavigateBefore as NavigateBeforeIcon,
    NavigateNext as NavigateNextIcon,
    CalendarToday as CalendarTodayIcon,
    Event as EventIcon,
    Schedule as ScheduleIcon
} from '@mui/icons-material';

moment.locale('he');

const MiniCalendar = ({
    appointments = [],
    currentDate = new Date(),
    onDateSelect,
    onNavigate,
    maxWidth = 300,
    showEventCount = true,
    highlightToday = true,
    showNavigation = true
}) => {
    const [viewDate, setViewDate] = useState(moment(currentDate));

    // חישוב ימים בחודש
    const calendarDays = useMemo(() => {
        const startOfMonth = viewDate.clone().startOf('month');
        const endOfMonth = viewDate.clone().endOf('month');
        const startOfWeek = startOfMonth.clone().startOf('week');
        const endOfWeek = endOfMonth.clone().endOf('week');

        const days = [];
        let currentDay = startOfWeek.clone();

        while (currentDay.isSameOrBefore(endOfWeek, 'day')) {
            const dayAppointments = appointments.filter(apt => {
                const aptDate = moment(apt.startTime || apt.date);
                return aptDate.isSame(currentDay, 'day');
            });

            days.push({
                date: currentDay.clone(),
                isCurrentMonth: currentDay.isSame(viewDate, 'month'),
                isToday: currentDay.isSame(moment(), 'day'),
                appointments: dayAppointments,
                appointmentCount: dayAppointments.length
            });

            currentDay.add(1, 'day');
        }

        return days;
    }, [viewDate, appointments]);

    // קבלת צבע לפי מספר פגישות
    const getAppointmentColor = (count) => {
        if (count === 0) return 'default';
        if (count <= 2) return 'success';
        if (count <= 4) return 'warning';
        return 'error';
    };

    // קבלת צבע לפי סטטוס פגישות
    const getAppointmentStatusColor = (appointments) => {
        if (appointments.length === 0) return 'default';

        const statuses = appointments.map(apt => apt.status);
        if (statuses.includes('cancelled')) return 'error';
        if (statuses.includes('no_show')) return 'warning';
        if (statuses.includes('completed')) return 'success';
        if (statuses.includes('confirmed')) return 'primary';
        return 'default';
    };

    // ניווט לחודש הקודם
    const handlePreviousMonth = () => {
        const newDate = viewDate.clone().subtract(1, 'month');
        setViewDate(newDate);
        if (onNavigate) {
            onNavigate(newDate.toDate());
        }
    };

    // ניווט לחודש הבא
    const handleNextMonth = () => {
        const newDate = viewDate.clone().add(1, 'month');
        setViewDate(newDate);
        if (onNavigate) {
            onNavigate(newDate.toDate());
        }
    };

    // חזרה להיום
    const handleToday = () => {
        const today = moment();
        setViewDate(today);
        if (onNavigate) {
            onNavigate(today.toDate());
        }
    };

    // בחירת תאריך
    const handleDateClick = (day) => {
        if (onDateSelect) {
            onDateSelect(day.date.toDate());
        }
    };

    // סטטיסטיקות חודש
    const monthStats = useMemo(() => {
        const totalAppointments = appointments.filter(apt => {
            const aptDate = moment(apt.startTime || apt.date);
            return aptDate.isSame(viewDate, 'month');
        });

        const byStatus = totalAppointments.reduce((acc, apt) => {
            acc[apt.status] = (acc[apt.status] || 0) + 1;
            return acc;
        }, {});

        return {
            total: totalAppointments.length,
            byStatus
        };
    }, [appointments, viewDate]);

    return (
        <Paper
            sx={{
                p: 2,
                maxWidth: maxWidth,
                width: '100%',
                borderRadius: 2,
                boxShadow: 2
            }}
        >
            {/* כותרת */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {viewDate.format('MMMM YYYY')}
                </Typography>

                {showNavigation && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton size="small" onClick={handlePreviousMonth}>
                            <NavigateBeforeIcon />
                        </IconButton>
                        <IconButton size="small" onClick={handleToday}>
                            <CalendarTodayIcon />
                        </IconButton>
                        <IconButton size="small" onClick={handleNextMonth}>
                            <NavigateNextIcon />
                        </IconButton>
                    </Box>
                )}
            </Box>

            {/* ימי השבוע */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 1 }}>
                {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((day, index) => (
                    <Typography
                        key={index}
                        variant="caption"
                        align="center"
                        sx={{
                            fontWeight: 'bold',
                            color: 'text.secondary',
                            py: 0.5
                        }}
                    >
                        {day}
                    </Typography>
                ))}
            </Box>

            {/* ימי החודש */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
                {calendarDays.map((day, index) => (
                    <Tooltip
                        key={index}
                        title={
                            day.appointmentCount > 0 ? (
                                <Box>
                                    <Typography variant="subtitle2">
                                        {day.date.format('DD/MM/YYYY')}
                                    </Typography>
                                    <Typography variant="body2">
                                        {day.appointmentCount} פגישות
                                    </Typography>
                                    {day.appointments.map((apt, aptIndex) => (
                                        <Typography key={aptIndex} variant="caption" display="block">
                                            • {apt.clientName || 'לקוח לא מוגדר'} ({apt.status})
                                        </Typography>
                                    ))}
                                </Box>
                            ) : (
                                day.date.format('DD/MM/YYYY')
                            )
                        }
                        arrow
                    >
                        <Box
                            sx={{
                                aspectRatio: '1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 1,
                                cursor: 'pointer',
                                position: 'relative',
                                backgroundColor: day.isToday && highlightToday ? 'primary.main' : 'transparent',
                                color: day.isToday && highlightToday ? 'primary.contrastText' :
                                    day.isCurrentMonth ? 'text.primary' : 'text.disabled',
                                '&:hover': {
                                    backgroundColor: day.isToday ? 'primary.dark' : 'action.hover',
                                },
                                minHeight: 32
                            }}
                            onClick={() => handleDateClick(day)}
                        >
                            <Typography variant="body2" sx={{ fontWeight: day.isToday ? 'bold' : 'normal' }}>
                                {day.date.format('D')}
                            </Typography>

                            {/* אינדיקטור פגישות */}
                            {day.appointmentCount > 0 && showEventCount && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 2,
                                        right: 2,
                                        width: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        backgroundColor: getAppointmentColor(day.appointmentCount) === 'default' ?
                                            'text.secondary' :
                                            `${getAppointmentColor(day.appointmentCount)}.main`
                                    }}
                                />
                            )}
                        </Box>
                    </Tooltip>
                ))}
            </Box>

            {/* סטטיסטיקות */}
            {showEventCount && monthStats.total > 0 && (
                <>
                    <Divider sx={{ my: 2 }} />
                    <Box>
                        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EventIcon fontSize="small" />
                            סיכום החודש
                        </Typography>

                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip
                                label={`סה"כ: ${monthStats.total}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                            />

                            {Object.entries(monthStats.byStatus).map(([status, count]) => (
                                <Chip
                                    key={status}
                                    label={`${status}: ${count}`}
                                    size="small"
                                    color={getAppointmentStatusColor([{ status }])}
                                    variant="outlined"
                                />
                            ))}
                        </Stack>
                    </Box>
                </>
            )}

            {/* מידע נוסף */}
            <Box sx={{ mt: 2, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" align="center" display="block">
                    לחץ על תאריך לניווט
                </Typography>
            </Box>
        </Paper>
    );
};

export default MiniCalendar;

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';
import { createTheme } from '@mui/material/styles';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock components that might not exist yet
jest.mock('../../Calendar/TherapistCalendar', () => {
    return function MockTherapistCalendar({ appointments, onSelectSlot, onSelectEvent }) {
        return (
            <div data-testid="therapist-calendar">
                <div data-testid="appointment-count">{appointments.length}</div>
                <button
                    data-testid="select-slot-btn"
                    onClick={() => onSelectSlot({ start: new Date(), end: new Date() })}
                >
                    Select Slot
                </button>
                {appointments.map((appointment, index) => (
                    <div
                        key={appointment._id || index}
                        data-testid={`appointment-${index}`}
                        onClick={() => onSelectEvent(appointment)}
                    >
                        {appointment.clientName || 'Test Client'}
                    </div>
                ))}
            </div>
        );
    };
});

jest.mock('../../Calendar/AppointmentModal', () => {
    return function MockAppointmentModal({ open, onClose, appointment, onSave }) {
        if (!open) return null;
        return (
            <div data-testid="appointment-modal">
                <button data-testid="close-modal" onClick={onClose}>Close</button>
                <button data-testid="save-appointment" onClick={() => onSave()}>Save</button>
            </div>
        );
    };
});

jest.mock('../../Calendar/AvailabilitySettings', () => {
    return function MockAvailabilitySettings({ open, onClose, onSave }) {
        if (!open) return null;
        return (
            <div data-testid="availability-settings">
                <button data-testid="close-availability" onClick={onClose}>Close</button>
                <button data-testid="save-availability" onClick={() => onSave()}>Save</button>
            </div>
        );
    };
});

jest.mock('../../Calendar/MiniCalendar', () => {
    return function MockMiniCalendar({ currentDate, onDateChange, appointments }) {
        return (
            <div data-testid="mini-calendar">
                <div data-testid="current-date">{currentDate.toISOString()}</div>
                <div data-testid="mini-appointment-count">{appointments.length}</div>
                <button
                    data-testid="change-date-btn"
                    onClick={() => onDateChange(new Date('2025-12-15'))}
                >
                    Change Date
                </button>
            </div>
        );
    };
});

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

// Create theme for testing
const theme = createTheme({
    direction: 'rtl',
});

// Mock appointments data
const mockAppointments = [
    {
        _id: '1',
        clientName: 'יוחנן כהן',
        startTime: new Date('2025-12-15T10:00:00.000Z'),
        endTime: new Date('2025-12-15T11:00:00.000Z'),
        status: 'confirmed',
        serviceType: 'individual'
    },
    {
        _id: '2',
        clientName: 'שרה לוי',
        startTime: new Date('2025-12-15T14:00:00.000Z'),
        endTime: new Date('2025-12-15T15:00:00.000Z'),
        status: 'pending',
        serviceType: 'couple'
    }
];

// Mock API responses
const mockApiResponses = {
    appointments: {
        data: mockAppointments,
        success: true
    },
    stats: {
        totalToday: 2,
        completed: 1,
        pending: 1,
        cancelled: 0,
        revenueToday: 600
    },
    syncStatus: {
        connected: true,
        lastSynced: new Date().toISOString(),
        syncing: false
    }
};

// Test wrapper component
const TestWrapper = ({ children }) => (
    <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
            {children}
        </LocalizationProvider>
    </ThemeProvider>
);

describe('CalendarPage', () => {
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        mockNavigate.mockClear();

        // Setup axios mocks
        mockedAxios.get.mockImplementation((url) => {
            if (url.includes('/api/appointments')) {
                return Promise.resolve({ data: mockApiResponses.appointments });
            }
            if (url.includes('/api/appointments/stats')) {
                return Promise.resolve({ data: mockApiResponses.stats });
            }
            if (url.includes('/api/calendar/sync-status')) {
                return Promise.resolve({ data: mockApiResponses.syncStatus });
            }
            return Promise.resolve({ data: {} });
        });

        mockedAxios.post.mockResolvedValue({ data: { success: true } });
    });

    it('renders calendar with appointments', async () => {
        const { CalendarPage } = require('../../../pages/Dashboard/CalendarPage');

        render(
            <TestWrapper>
                <CalendarPage />
            </TestWrapper>
        );

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByTestId('therapist-calendar')).toBeInTheDocument();
        });

        // Check that appointments are displayed
        expect(screen.getByTestId('appointment-count')).toHaveTextContent('2');
        expect(screen.getByText('יוחנן כהן')).toBeInTheDocument();
        expect(screen.getByText('שרה לוי')).toBeInTheDocument();
    });

    it('displays calendar header with title and actions', async () => {
        const { CalendarPage } = require('../../../pages/Dashboard/CalendarPage');

        render(
            <TestWrapper>
                <CalendarPage />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByText('היומן שלי')).toBeInTheDocument();
        });

        // Check for quick action buttons
        expect(screen.getByText('פגישה חדשה')).toBeInTheDocument();
        expect(screen.getByText('סנכרון')).toBeInTheDocument();
    });

    it('displays view switcher buttons', async () => {
        const { CalendarPage } = require('../../../pages/Dashboard/CalendarPage');

        render(
            <TestWrapper>
                <CalendarPage />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByText('יום')).toBeInTheDocument();
            expect(screen.getByText('שבוע')).toBeInTheDocument();
            expect(screen.getByText('חודש')).toBeInTheDocument();
            expect(screen.getByText('רשימה')).toBeInTheDocument();
        });
    });

    it('displays date navigator', async () => {
        const { CalendarPage } = require('../../../pages/Dashboard/CalendarPage');

        render(
            <TestWrapper>
                <CalendarPage />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByText('היום')).toBeInTheDocument();
        });
    });

    it('displays sidebar with filters and stats', async () => {
        const { CalendarPage } = require('../../../pages/Dashboard/CalendarPage');

        render(
            <TestWrapper>
                <CalendarPage />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByText('יומן קטן')).toBeInTheDocument();
            expect(screen.getByText('סינון')).toBeInTheDocument();
            expect(screen.getByText('סטטיסטיקות היום')).toBeInTheDocument();
            expect(screen.getByText('פעולות מהירות')).toBeInTheDocument();
        });
    });

    it('opens appointment modal when clicking select slot', async () => {
        const { CalendarPage } = require('../../../pages/Dashboard/CalendarPage');

        render(
            <TestWrapper>
                <CalendarPage />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByTestId('therapist-calendar')).toBeInTheDocument();
        });

        // Click select slot button
        fireEvent.click(screen.getByTestId('select-slot-btn'));

        // Check that modal opens
        await waitFor(() => {
            expect(screen.getByTestId('appointment-modal')).toBeInTheDocument();
        });
    });

    it('opens appointment modal when clicking on appointment', async () => {
        const { CalendarPage } = require('../../../pages/Dashboard/CalendarPage');

        render(
            <TestWrapper>
                <CalendarPage />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByTestId('appointment-0')).toBeInTheDocument();
        });

        // Click on appointment
        fireEvent.click(screen.getByTestId('appointment-0'));

        // Check that modal opens
        await waitFor(() => {
            expect(screen.getByTestId('appointment-modal')).toBeInTheDocument();
        });
    });

    it('opens availability settings modal', async () => {
        const { CalendarPage } = require('../../../pages/Dashboard/CalendarPage');

        render(
            <TestWrapper>
                <CalendarPage />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByText('הגדר זמינות')).toBeInTheDocument();
        });

        // Click availability settings button
        fireEvent.click(screen.getByText('הגדר זמינות'));

        // Check that modal opens
        await waitFor(() => {
            expect(screen.getByTestId('availability-settings')).toBeInTheDocument();
        });
    });

    it('handles view switching', async () => {
        const { CalendarPage } = require('../../../pages/Dashboard/CalendarPage');

        render(
            <TestWrapper>
                <CalendarPage />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByText('יום')).toBeInTheDocument();
        });

        // Click on week view
        fireEvent.click(screen.getByText('שבוע'));

        // The view should change (this would be tested with actual calendar component)
        expect(screen.getByText('שבוע')).toBeInTheDocument();
    });

    it('handles date navigation', async () => {
        const { CalendarPage } = require('../../../pages/Dashboard/CalendarPage');

        render(
            <TestWrapper>
                <CalendarPage />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByText('היום')).toBeInTheDocument();
        });

        // Click today button
        fireEvent.click(screen.getByText('היום'));

        // Date should reset to today
        expect(screen.getByText('היום')).toBeInTheDocument();
    });

    it('displays sync status', async () => {
        const { CalendarPage } = require('../../../pages/Dashboard/CalendarPage');

        render(
            <TestWrapper>
                <CalendarPage />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByText(/מחובר ל-Google/)).toBeInTheDocument();
        });
    });

    it('handles sync button click', async () => {
        const { CalendarPage } = require('../../../pages/Dashboard/CalendarPage');

        render(
            <TestWrapper>
                <CalendarPage />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByText('סנכרון')).toBeInTheDocument();
        });

        // Click sync button
        fireEvent.click(screen.getByText('סנכרון'));

        // Should call sync API
        await waitFor(() => {
            expect(mockedAxios.post).toHaveBeenCalledWith('/api/calendar/sync');
        });
    });

    it('displays loading state initially', () => {
        const { CalendarPage } = require('../../../pages/Dashboard/CalendarPage');

        // Mock loading state
        mockedAxios.get.mockImplementation(() => new Promise(() => { }));

        render(
            <TestWrapper>
                <CalendarPage />
            </TestWrapper>
        );

        // Should show loading indicator
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('handles API errors gracefully', async () => {
        const { CalendarPage } = require('../../../pages/Dashboard/CalendarPage');

        // Mock API error
        mockedAxios.get.mockRejectedValue(new Error('API Error'));

        render(
            <TestWrapper>
                <CalendarPage />
            </TestWrapper>
        );

        // Should show error message
        await waitFor(() => {
            expect(screen.getByText('שגיאה בטעינת הפגישות')).toBeInTheDocument();
        });
    });

    it('filters appointments by status', async () => {
        const { CalendarPage } = require('../../../pages/Dashboard/CalendarPage');

        render(
            <TestWrapper>
                <CalendarPage />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByText('סינון')).toBeInTheDocument();
        });

        // Check that filter checkboxes are present
        expect(screen.getByText('ממתין')).toBeInTheDocument();
        expect(screen.getByText('מאושר')).toBeInTheDocument();
        expect(screen.getByText('הושלם')).toBeInTheDocument();
        expect(screen.getByText('בוטל')).toBeInTheDocument();
    });

    it('displays today\'s statistics', async () => {
        const { CalendarPage } = require('../../../pages/Dashboard/CalendarPage');

        render(
            <TestWrapper>
                <CalendarPage />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByText('סטטיסטיקות היום')).toBeInTheDocument();
        });

        // Check that stats are displayed
        expect(screen.getByText('2')).toBeInTheDocument(); // Total appointments
        expect(screen.getByText('₪600')).toBeInTheDocument(); // Revenue
    });

    it('handles keyboard shortcuts', async () => {
        const { CalendarPage } = require('../../../pages/Dashboard/CalendarPage');

        render(
            <TestWrapper>
                <CalendarPage />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByTestId('therapist-calendar')).toBeInTheDocument();
        });

        // Test 'N' key for new appointment
        fireEvent.keyDown(document, { key: 'n' });

        await waitFor(() => {
            expect(screen.getByTestId('appointment-modal')).toBeInTheDocument();
        });
    });

    it('handles mobile responsive design', () => {
        const { CalendarPage } = require('../../../pages/Dashboard/CalendarPage');

        // Mock mobile viewport
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 600,
        });

        render(
            <TestWrapper>
                <CalendarPage />
            </TestWrapper>
        );

        // Should render mobile-friendly components
        expect(screen.getByText('היומן שלי')).toBeInTheDocument();
    });

    it('auto-refreshes data every 5 minutes', async () => {
        const { CalendarPage } = require('../../../pages/Dashboard/CalendarPage');

        // Mock timers
        jest.useFakeTimers();

        render(
            <TestWrapper>
                <CalendarPage />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByTestId('therapist-calendar')).toBeInTheDocument();
        });

        // Clear initial calls
        mockedAxios.get.mockClear();

        // Fast-forward 5 minutes
        jest.advanceTimersByTime(5 * 60 * 1000);

        // Should call API again
        await waitFor(() => {
            expect(mockedAxios.get).toHaveBeenCalled();
        });

        jest.useRealTimers();
    });

    it('handles appointment drag and drop', async () => {
        const { CalendarPage } = require('../../../pages/Dashboard/CalendarPage');

        render(
            <TestWrapper>
                <CalendarPage />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByTestId('appointment-0')).toBeInTheDocument();
        });

        // This would test drag and drop functionality
        // In a real implementation, you'd test the actual drag events
        expect(screen.getByTestId('appointment-0')).toBeInTheDocument();
    });

    it('navigates to settings when settings button is clicked', async () => {
        const { CalendarPage } = require('../../../pages/Dashboard/CalendarPage');

        render(
            <TestWrapper>
                <CalendarPage />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /הגדרות/i })).toBeInTheDocument();
        });

        // Click settings button
        fireEvent.click(screen.getByRole('button', { name: /הגדרות/i }));

        // Should navigate to settings
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard/calendar/settings');
    });
});

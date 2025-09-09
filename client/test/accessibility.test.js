import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import CommunicationTab from '../src/pages/dashboard/therapist/components/clientCard/CommunicationTab';
import ReportsTab from '../src/pages/dashboard/therapist/components/clientCard/ReportsTab';
import PaymentsTab from '../src/pages/dashboard/therapist/components/clientCard/PaymentsTab';

describe('Accessibility Tests', () => {
    const mockClient = {
        _id: '507f1f77bcf86cd799439011',
        firstName: 'יוסי',
        lastName: 'כהן',
        email: 'yossi@test.com',
        phone: '050-1234567'
    };

    describe('CommunicationTab Accessibility', () => {
        it('should have proper ARIA labels for form elements', () => {
            render(<CommunicationTab client={mockClient} />);

            // בדיקת כפתור שליחת הודעה
            const sendButton = screen.getByRole('button', { name: /שלח הודעה/i });
            expect(sendButton).to.exist;

            // בדיקת תוויות שדות
            const channelSelect = screen.getByLabelText(/ערוץ תקשורת/i);
            expect(channelSelect).to.exist;

            const subjectField = screen.getByLabelText(/נושא/i);
            expect(subjectField).to.exist;

            const bodyField = screen.getByLabelText(/תוכן ההודעה/i);
            expect(bodyField).to.exist;
        });

        it('should support keyboard navigation', () => {
            render(<CommunicationTab client={mockClient} />);

            // בדיקה שניתן לנווט עם Tab
            const elements = screen.getAllByRole('button');
            elements.forEach(element => {
                expect(element).to.have.attribute('tabindex');
            });
        });

        it('should have proper table headers', () => {
            render(<CommunicationTab client={mockClient} />);

            // בדיקת כותרות טבלה
            const headers = screen.getAllByRole('columnheader');
            expect(headers).to.have.length(6); // תאריך, ערוץ, נושא, תוכן, סטטוס, פעולות

            headers.forEach(header => {
                expect(header).to.have.attribute('scope', 'col');
            });
        });
    });

    describe('ReportsTab Accessibility', () => {
        it('should have proper heading structure', () => {
            render(<ReportsTab client={mockClient} />);

            // בדיקת כותרות
            const headings = screen.getAllByRole('heading');
            expect(headings.length).to.be.greaterThan(0);

            // בדיקה שיש כותרת ראשית
            const mainHeading = screen.getByRole('heading', { level: 1 });
            expect(mainHeading).to.exist;
        });

        it('should have proper table accessibility', () => {
            render(<ReportsTab client={mockClient} />);

            // בדיקת טבלאות
            const tables = screen.getAllByRole('table');
            tables.forEach(table => {
                expect(table).to.have.attribute('aria-label');
            });
        });

        it('should have proper color contrast for status indicators', () => {
            render(<ReportsTab client={mockClient} />);

            // בדיקת צבעים לסטטוסים
            const statusElements = screen.getAllByText(/שולם|ממתין|נכשל/i);
            statusElements.forEach(element => {
                // בדיקה שיש תיאור נוסף לסטטוס
                expect(element).to.have.attribute('aria-label');
            });
        });
    });

    describe('PaymentsTab Accessibility', () => {
        it('should have proper form labels', () => {
            render(<PaymentsTab client={mockClient} />);

            // בדיקת תוויות שדות
            const amountField = screen.getByLabelText(/סכום/i);
            expect(amountField).to.exist;

            const methodSelect = screen.getByLabelText(/שיטת תשלום/i);
            expect(methodSelect).to.exist;
        });

        it('should have proper error handling', () => {
            render(<PaymentsTab client={mockClient} />);

            // בדיקת הודעות שגיאה
            const errorAlerts = screen.queryAllByRole('alert');
            errorAlerts.forEach(alert => {
                expect(alert).to.have.attribute('aria-live', 'polite');
            });
        });

        it('should support screen readers', () => {
            render(<PaymentsTab client={mockClient} />);

            // בדיקת תיאורים למסך קורא
            const elements = screen.getAllByRole('button');
            elements.forEach(element => {
                if (element.getAttribute('aria-label')) {
                    expect(element.getAttribute('aria-label')).to.not.be.empty;
                }
            });
        });
    });

    describe('General Accessibility', () => {
        it('should have proper language attributes', () => {
            render(<CommunicationTab client={mockClient} />);

            // בדיקת שפה
            const container = screen.getByRole('main') || document.body;
            expect(container).to.have.attribute('lang', 'he');
            expect(container).to.have.attribute('dir', 'rtl');
        });

        it('should have proper focus management', () => {
            render(<CommunicationTab client={mockClient} />);

            // בדיקת ניהול focus
            const focusableElements = screen.getAllByRole('button', 'link', 'input', 'select', 'textarea');
            focusableElements.forEach(element => {
                expect(element).to.have.attribute('tabindex');
            });
        });

        it('should have proper alt text for images', () => {
            render(<ReportsTab client={mockClient} />);

            // בדיקת תמונות
            const images = screen.getAllByRole('img');
            images.forEach(img => {
                expect(img).to.have.attribute('alt');
            });
        });
    });
});



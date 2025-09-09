import api from './api';

const esignService = {
    // Request OTP for digital signature
    requestOtp: async (payload, channel) => {
        const response = await api.post('/esign/otp/start', {
            payload: JSON.stringify(payload),
            channel
        });
        return response.data;
    },

    // Verify OTP and create signed document
    verifyOtp: async (payload, code) => {
        const response = await api.post('/esign/otp/verify', {
            payload: JSON.stringify(payload),
            code
        });
        return response.data;
    },

    // Download signed document
    downloadDocument: async (documentId) => {
        const response = await api.get(`/esign/download/${documentId}`, {
            responseType: 'blob'
        });
        return response.data;
    },

    // Verify document integrity
    verifyIntegrity: async (documentId) => {
        const response = await api.post('/esign/verify-integrity', {
            signedDocumentId: documentId
        });
        return response.data;
    },

    // Get signed documents history
    getHistory: async (page = 1, limit = 10) => {
        const response = await api.get('/esign/history', {
            params: { page, limit }
        });
        return response.data;
    },

    // Helper function to download file with proper filename
    downloadSignedDocument: async (documentId, filename) => {
        try {
            const blob = await esignService.downloadDocument(documentId);

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename || `signed_document_${documentId}.pdf`;

            // Trigger download
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            return true;
        } catch (error) {
            console.error('Download failed:', error);
            throw error;
        }
    },

    // Helper function to verify and display integrity status
    checkDocumentIntegrity: async (documentId) => {
        try {
            const result = await esignService.verifyIntegrity(documentId);

            if (result.valid) {
                return {
                    valid: true,
                    message: 'המסמך תקין ולא שונה מאז החתימה',
                    details: result.details
                };
            } else {
                return {
                    valid: false,
                    message: 'זוהה שינוי במסמך או בעיה בשלמותו',
                    details: result.details
                };
            }
        } catch (error) {
            console.error('Integrity check failed:', error);
            return {
                valid: false,
                message: 'שגיאה בבדיקת שלמות המסמך',
                error: error.message
            };
        }
    }
};

export default esignService;

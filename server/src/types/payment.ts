export interface Payment {
    _id: string;
    therapistId: string;
    clientId: string;
    sessionId?: string;
    amount: number;
    currency: 'ILS';
    status: 'pending' | 'paid' | 'failed' | 'expired' | 'canceled';
    paymentMethod?: 'credit' | 'bit' | 'paybox' | 'gpay' | 'apay';
    paymentLinkId: string;
    provider: 'tranzila' | 'cardcom' | 'mock';
    providerTxnId?: string;
    metadata?: Record<string, any>;
    expiresAt: Date;
    description?: string;
    checkoutUrl?: string;
    callbackData?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreatePaymentRequest {
    therapistId: string;
    clientId: string;
    sessionId?: string;
    amount: number;
    currency?: 'ILS';
    description?: string;
}

export interface CreatePaymentResponse {
    paymentLink: string;
    checkoutUrl: string;
    paymentLinkId: string;
}

export interface PaymentDetailsResponse {
    therapistName: string;
    therapistLogo?: string;
    amount: number;
    currency: string;
    description?: string;
    status: string;
    expiresAt: Date;
    isExpired: boolean;
}

export interface PaymentCallbackData {
    paymentLinkId: string;
    status: 'paid' | 'failed';
    providerTxnId?: string;
    metadata?: Record<string, any>;
}

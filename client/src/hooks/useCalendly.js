import { useState, useEffect, useCallback } from 'react';
import {
    getTherapistCalendlyState,
    getTherapistCalendlyConnectUrl,
    saveTherapistCalendlyEmbedConfig,
    disconnectTherapistCalendly
} from '../api/calendlyClient';
import { CalendlySetupStatus, CalendlyHelpers } from '../types/calendly';

/**
 * Custom hook for managing Calendly integration state
 * @param {Object} options - Hook configuration options
 * @returns {Object} Calendly state and actions
 */
export function useCalendly(options = {}) {
    const { autoLoad = true, onError, onSuccess } = options;

    const [state, setState] = useState({
        // Data state
        calendlyState: null,

        // Loading states
        loading: false,
        connecting: false,
        saving: false,
        disconnecting: false,

        // Error state
        error: null,

        // Computed states
        setupStatus: CalendlySetupStatus.NOT_STARTED,
        isConnected: false,
        isActive: false,
        hasError: false,
        schedulingUrl: null
    });

    /**
     * Update computed states based on calendly data
     */
    const updateComputedStates = useCallback((calendlyData) => {
        if (!calendlyData) return {};

        const setupStatus = calendlyData.setupStatus || CalendlySetupStatus.NOT_STARTED;
        const isConnected = calendlyData.connected || false;
        const isActive = CalendlyHelpers.isActive(setupStatus);
        const hasError = CalendlyHelpers.hasError(setupStatus);
        const schedulingUrl = calendlyData.schedulingLink || null;

        return {
            setupStatus,
            isConnected,
            isActive,
            hasError,
            schedulingUrl
        };
    }, []);

    /**
     * Load Calendly state from server
     */
    const loadState = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const response = await getTherapistCalendlyState();
            const calendlyData = response.data;

            setState(prev => ({
                ...prev,
                calendlyState: calendlyData,
                loading: false,
                ...updateComputedStates(calendlyData)
            }));

            if (onSuccess) {
                onSuccess('load', calendlyData);
            }

            return calendlyData;
        } catch (error) {
            console.error('Failed to load Calendly state:', error);

            setState(prev => ({
                ...prev,
                loading: false,
                error: error.message
            }));

            if (onError) {
                onError('load', error);
            }

            throw error;
        }
    }, [updateComputedStates, onSuccess, onError]);

    /**
     * Get connect URL and redirect to Calendly OAuth
     */
    const connect = useCallback(async (options = {}) => {
        setState(prev => ({ ...prev, connecting: true, error: null }));

        try {
            const response = await getTherapistCalendlyConnectUrl(options);
            const connectData = response.data;

            setState(prev => ({
                ...prev,
                connecting: false,
                setupStatus: connectData.setupStatus || CalendlySetupStatus.IN_PROGRESS
            }));

            if (onSuccess) {
                onSuccess('connect', connectData);
            }

            // Redirect to Calendly OAuth
            if (connectData.redirectUrl) {
                window.location.href = connectData.redirectUrl;
            }

            return connectData;
        } catch (error) {
            console.error('Failed to get connect URL:', error);

            setState(prev => ({
                ...prev,
                connecting: false,
                error: error.message
            }));

            if (onError) {
                onError('connect', error);
            }

            throw error;
        }
    }, [onSuccess, onError]);

    /**
     * Save embed configuration
     */
    const saveEmbedConfig = useCallback(async (config) => {
        setState(prev => ({ ...prev, saving: true, error: null }));

        try {
            const response = await saveTherapistCalendlyEmbedConfig(config);
            const updatedData = response.data;

            setState(prev => ({
                ...prev,
                calendlyState: { ...prev.calendlyState, ...updatedData },
                saving: false,
                ...updateComputedStates(updatedData)
            }));

            if (onSuccess) {
                onSuccess('save', updatedData);
            }

            return updatedData;
        } catch (error) {
            console.error('Failed to save embed config:', error);

            setState(prev => ({
                ...prev,
                saving: false,
                error: error.message
            }));

            if (onError) {
                onError('save', error);
            }

            throw error;
        }
    }, [updateComputedStates, onSuccess, onError]);

    /**
     * Disconnect from Calendly
     */
    const disconnect = useCallback(async (options = {}) => {
        setState(prev => ({ ...prev, disconnecting: true, error: null }));

        try {
            const response = await disconnectTherapistCalendly(options);
            const disconnectData = response.data;

            setState(prev => ({
                ...prev,
                calendlyState: null,
                disconnecting: false,
                setupStatus: CalendlySetupStatus.NOT_STARTED,
                isConnected: false,
                isActive: false,
                hasError: false,
                schedulingUrl: null
            }));

            if (onSuccess) {
                onSuccess('disconnect', disconnectData);
            }

            return disconnectData;
        } catch (error) {
            console.error('Failed to disconnect:', error);

            setState(prev => ({
                ...prev,
                disconnecting: false,
                error: error.message
            }));

            if (onError) {
                onError('disconnect', error);
            }

            throw error;
        }
    }, [onSuccess, onError]);

    /**
     * Refresh state from server
     */
    const refresh = useCallback(() => {
        return loadState();
    }, [loadState]);

    /**
     * Clear error state
     */
    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    // Auto-load on mount
    useEffect(() => {
        if (autoLoad) {
            loadState().catch(() => {
                // Error already handled in loadState
            });
        }
    }, [autoLoad, loadState]);

    return {
        // Data
        calendlyState: state.calendlyState,

        // Computed states
        setupStatus: state.setupStatus,
        isConnected: state.isConnected,
        isActive: state.isActive,
        hasError: state.hasError,
        schedulingUrl: state.schedulingUrl,

        // Loading states
        loading: state.loading,
        connecting: state.connecting,
        saving: state.saving,
        disconnecting: state.disconnecting,

        // Error
        error: state.error,

        // Actions
        loadState,
        connect,
        saveEmbedConfig,
        disconnect,
        refresh,
        clearError,

        // Helpers
        isReady: !state.loading && state.calendlyState !== null,
        canConnect: !state.loading && !state.connecting && !state.isConnected,
        canDisconnect: !state.disconnecting && state.isConnected
    };
}

export default useCalendly;

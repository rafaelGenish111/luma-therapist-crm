import React, { useState } from 'react';
import useCalendly from '../hooks/useCalendly';
import {
    CalendlySetupStatus,
    CalendlyHelpers,
    setupStatusLabels,
    setupStatusColors,
    defaultEmbedConfig
} from '../types/calendly';

/**
 * Calendly Setup Component
 * Provides UI for managing Calendly integration
 */
const CalendlySetup = ({ onStatusChange }) => {
    const [embedConfig, setEmbedConfig] = useState(defaultEmbedConfig);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const {
        calendlyState,
        setupStatus,
        isConnected,
        isActive,
        hasError,
        schedulingUrl,
        loading,
        connecting,
        saving,
        disconnecting,
        error,
        connect,
        saveEmbedConfig,
        disconnect,
        refresh,
        clearError,
        canConnect,
        canDisconnect
    } = useCalendly({
        autoLoad: true,
        onSuccess: (action, data) => {
            console.log(`Calendly ${action} successful:`, data);
            if (onStatusChange) {
                onStatusChange(action, data);
            }
        },
        onError: (action, error) => {
            console.error(`Calendly ${action} failed:`, error);
        }
    });

    // Update local embed config when calendly state changes
    React.useEffect(() => {
        if (calendlyState?.embedConfig) {
            setEmbedConfig(prev => ({
                ...prev,
                ...calendlyState.embedConfig
            }));
        }
    }, [calendlyState]);

    const handleConnect = async () => {
        try {
            await connect({
                returnUrl: '/dashboard/calendly?connected=true'
            });
        } catch (error) {
            // Error handled by hook
        }
    };

    const handleSaveConfig = async () => {
        try {
            await saveEmbedConfig({
                embedConfig,
                schedulingLink: schedulingUrl
            });
        } catch (error) {
            // Error handled by hook
        }
    };

    const handleDisconnect = async () => {
        if (window.confirm('האם אתה בטוח שברצונך לנתק את Calendly?')) {
            try {
                await disconnect({ keepConfig: true });
            } catch (error) {
                // Error handled by hook
            }
        }
    };

    const getStatusColor = () => {
        return setupStatusColors[setupStatus] || 'gray';
    };

    const getStatusLabel = () => {
        return setupStatusLabels[setupStatus] || 'לא ידוע';
    };

    if (loading) {
        return (
            <div className="calendly-setup loading">
                <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="mr-3">טוען הגדרות Calendly...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="calendly-setup">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <h2 className="text-xl font-semibold text-gray-900 ml-3">
                            אינטגרציה עם Calendly
                        </h2>
                        <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getStatusColor()}-100 text-${getStatusColor()}-800`}
                        >
                            {getStatusLabel()}
                        </span>
                    </div>

                    <button
                        onClick={refresh}
                        disabled={loading}
                        className="text-gray-400 hover:text-gray-600 p-2"
                        title="רענן מצב"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>

                {schedulingUrl && (
                    <div className="mt-4 p-3 bg-green-50 rounded-md">
                        <p className="text-sm text-green-700">
                            קישור לקביעת פגישות:
                            <a
                                href={schedulingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium underline mr-1"
                            >
                                {schedulingUrl}
                            </a>
                        </p>
                    </div>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                    <div className="flex">
                        <svg className="w-5 h-5 text-red-400 ml-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div className="mr-3">
                            <h3 className="text-sm font-medium text-red-800">שגיאה</h3>
                            <p className="mt-1 text-sm text-red-700">{error}</p>
                            <button
                                onClick={clearError}
                                className="mt-2 text-sm text-red-600 underline hover:text-red-500"
                            >
                                סגור
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Connection Status */}
            {CalendlyHelpers.notStarted(setupStatus) && (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">התחבר ל-Calendly</h3>
                    <p className="text-gray-600 mb-4">
                        התחבר לחשבון Calendly שלך כדי לאפשר ללקוחות לקבוע פגישות ישירות דרך האתר שלך.
                    </p>

                    <button
                        onClick={handleConnect}
                        disabled={!canConnect || connecting}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {connecting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                                מתחבר...
                            </>
                        ) : (
                            'התחבר ל-Calendly'
                        )}
                    </button>
                </div>
            )}

            {/* Configuration */}
            {(isConnected || isActive) && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">הגדרות תצוגה</h3>
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="text-sm text-blue-600 hover:text-blue-500"
                        >
                            {showAdvanced ? 'הסתר הגדרות מתקדמות' : 'הצג הגדרות מתקדמות'}
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Height */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                גובה הווידג׳ט (פיקסלים)
                            </label>
                            <input
                                type="number"
                                min="400"
                                max="1200"
                                value={embedConfig.height}
                                onChange={(e) => setEmbedConfig(prev => ({
                                    ...prev,
                                    height: parseInt(e.target.value) || 630
                                }))}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>

                        {/* Colors */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    צבע ראשי
                                </label>
                                <input
                                    type="color"
                                    value={embedConfig.primaryColor}
                                    onChange={(e) => setEmbedConfig(prev => ({
                                        ...prev,
                                        primaryColor: e.target.value
                                    }))}
                                    className="mt-1 block w-full h-10 border-gray-300 rounded-md"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    צבע טקסט
                                </label>
                                <input
                                    type="color"
                                    value={embedConfig.textColor}
                                    onChange={(e) => setEmbedConfig(prev => ({
                                        ...prev,
                                        textColor: e.target.value
                                    }))}
                                    className="mt-1 block w-full h-10 border-gray-300 rounded-md"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    צבע רקע
                                </label>
                                <input
                                    type="color"
                                    value={embedConfig.backgroundColor}
                                    onChange={(e) => setEmbedConfig(prev => ({
                                        ...prev,
                                        backgroundColor: e.target.value
                                    }))}
                                    className="mt-1 block w-full h-10 border-gray-300 rounded-md"
                                />
                            </div>
                        </div>

                        {/* Advanced Settings */}
                        {showAdvanced && (
                            <div className="space-y-4 pt-4 border-t border-gray-200">
                                <div className="space-y-3">
                                    {[
                                        { key: 'hideEventTypeDetails', label: 'הסתר פרטי סוגי אירועים' },
                                        { key: 'hideGdprBanner', label: 'הסתר הודעת GDPR' },
                                        { key: 'hideCalendlyFooter', label: 'הסתר כותרת תחתונה של Calendly' },
                                        { key: 'branding', label: 'הצג מיתוג' },
                                        { key: 'inlineEmbed', label: 'הטמעה מוטבעת' },
                                        { key: 'popupWidget', label: 'ווידג׳ט קופץ' }
                                    ].map(({ key, label }) => (
                                        <div key={key} className="flex items-center">
                                            <input
                                                id={key}
                                                type="checkbox"
                                                checked={embedConfig[key]}
                                                onChange={(e) => setEmbedConfig(prev => ({
                                                    ...prev,
                                                    [key]: e.target.checked
                                                }))}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor={key} className="mr-2 block text-sm text-gray-900">
                                                {label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <button
                                onClick={handleSaveConfig}
                                disabled={saving}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                            >
                                {saving ? 'שומר...' : 'שמור הגדרות'}
                            </button>

                            {canDisconnect && (
                                <button
                                    onClick={handleDisconnect}
                                    disabled={disconnecting}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    {disconnecting ? 'מנתק...' : 'נתק Calendly'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendlySetup;

/**
 * Calendly Client API
 * Functions for therapist Calendly integration
 */

export async function getTherapistCalendlyState() {
    const res = await fetch('/api/therapist/calendly/state', {
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load Calendly state');
    }

    return res.json();
}

export async function getTherapistCalendlyConnectUrl(options = {}) {
    const { returnUrl = '/dashboard/calendly' } = options;

    const res = await fetch('/api/therapist/calendly/connect', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ returnUrl }),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create Calendly connect url');
    }

    return res.json(); // { data: { redirectUrl, state, setupStatus, expiresAt } }
}

export async function saveTherapistCalendlyEmbedConfig(payload) {
    const res = await fetch('/api/therapist/calendly/embed-config', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save Calendly embed config');
    }

    return res.json();
}

export async function disconnectTherapistCalendly(options = {}) {
    const { keepConfig = true } = options;

    const res = await fetch('/api/therapist/calendly/disconnect', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ keepConfig }),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to disconnect Calendly');
    }

    return res.json();
}

export async function getTherapistCalendlyEventTypes() {
    const res = await fetch('/api/therapist/calendly/event-types', {
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load Calendly event types');
    }

    return res.json();
}

export async function updateTherapistCalendlySettings(settings) {
    const res = await fetch('/api/therapist/calendly/settings', {
        method: 'PUT',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(settings),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update Calendly settings');
    }

    return res.json();
}

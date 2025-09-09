import { useState } from 'react';

export default function CalendlyEmbedWizard({ initialLink, initialConfig, onSave }) {
    const [mode, setMode] = useState(initialConfig?.mode || 'inline'); // inline|popup|badge
    const [url, setUrl] = useState(initialLink || initialConfig?.url || '');
    const [primaryColor, setPrimaryColor] = useState(initialConfig?.primaryColor || '#3b82f6');
    const [textColor, setTextColor] = useState(initialConfig?.textColor || '#111827');
    const [showGdprNotice, setShowGdprNotice] = useState(
        typeof initialConfig?.showGdprNotice === 'boolean' ? initialConfig.showGdprNotice : true
    );

    const handleSave = () => onSave({ mode, url, primaryColor, textColor, showGdprNotice });

    return (
        <div className="space-y-4">
            <div>
                <label className="font-medium">כתובת השילוב (Scheduling Link)</label>
                <input className="input w-full" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://calendly.com/your-username" />
            </div>
            <div className="flex gap-3">
                <label><input type="radio" checked={mode === 'inline'} onChange={() => setMode('inline')} /> Inline</label>
                <label><input type="radio" checked={mode === 'popup'} onChange={() => setMode('popup')} /> Popup</label>
                <label><input type="radio" checked={mode === 'badge'} onChange={() => setMode('badge')} /> Badge</label>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="font-medium">צבע ראשי</label>
                    <input type="color" className="input w-full" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
                </div>
                <div>
                    <label className="font-medium">צבע טקסט</label>
                    <input type="color" className="input w-full" value={textColor} onChange={e => setTextColor(e.target.value)} />
                </div>
            </div>
            <label className="flex items-center gap-2">
                <input type="checkbox" checked={showGdprNotice} onChange={e => setShowGdprNotice(e.target.checked)} />
                הסתר הודעת GDPR
            </label>

            <div className="flex justify-end">
                <button className="btn btn-primary" onClick={handleSave}>שמור</button>
            </div>
        </div>
    );
}



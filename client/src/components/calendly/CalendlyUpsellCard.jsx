export default function CalendlyUpsellCard({ onUpgrade }) {
    return (
        <div className="card p-4 rounded-xl shadow">
            <h2 className="text-xl font-bold mb-2">פגישות אונליין – ב־3 קליקים</h2>
            <ul className="list-disc pr-6 mb-4">
                <li>שילוב ביומן הפנימי והאתר האישי</li>
                <li>אישור/ביטול אוטומטי למפגשים</li>
                <li>חיסכון אדיר בזמן תיאומים</li>
            </ul>
            <button className="btn btn-primary" onClick={onUpgrade}>שדרג/י לתוכנית Premium/Extended</button>
        </div>
    );
}



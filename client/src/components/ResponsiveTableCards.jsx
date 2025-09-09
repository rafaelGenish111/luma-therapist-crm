import React from "react";
import "./responsive-table.css";

/**
 * columns: [{ key: "name", label: "שם" }, { key: "email", label: "אימייל" }, ...]
 * rows: [{ id: "1", name: "...", email: "...", phone: "...", plan: "..." }, ...]
 * actions?: (row) => ReactNode  // כפתורי פעולה (עריכה/מחיקה) – אופציונלי
 * onRowClick?: (row) => void  // פונקציה שתיקרא בלחיצה על שורה – אופציונלי
 */
export default function ResponsiveTableCards({ columns = [], rows = [], actions, onRowClick }) {
    if (!Array.isArray(columns) || !Array.isArray(rows)) return null;

    const getStatusClass = (value, key) => {
        if (key === 'status') {
            if (value === 'לקוח קיים' || value === 'מופעל' || value === 'פעיל') return 'status-active';
            if (value === 'לקוח פוטנציאלי' || value === 'מכובה') return 'status-pending';
            if (value === 'לא רלוונטי' || value === 'לא פעיל') return 'status-inactive';
        }
        return '';
    };

    return (
        <div className="rt-root" dir="rtl" aria-live="polite">
            {/* Desktop / Tablet table */}
            <div className="rt-table-wrapper" role="region" aria-label="טבלת מטפלות מאושרות">
                <table className="rt-table">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th key={col.key} scope="col">{col.label}</th>
                            ))}
                            {actions && <th scope="col" className="rt-actions-head">פעולות</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr
                                key={row.id ?? row._id ?? JSON.stringify(row)}
                                onClick={() => {
                                    console.log('Table row clicked');
                                    onRowClick && onRowClick(row);
                                }}
                                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                                className={onRowClick ? 'rt-clickable-row' : ''}
                            >
                                {columns.map((col) => (
                                    <td key={col.key} data-label={col.label}>
                                        {row[col.key] ?? "-"}
                                    </td>
                                ))}
                                {actions && <td className="rt-actions-cell">{actions(row)}</td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile cards */}
            <ul className="rt-cards" aria-label="רשימת מטפלות במובייל">
                {rows.map((row) => (
                    <li
                        className={`rt-card ${onRowClick ? 'rt-clickable-card' : ''}`}
                        key={row.id ?? row._id ?? JSON.stringify(row)}
                        tabIndex={0}
                        onClick={() => {
                            console.log('Card clicked');
                            onRowClick && onRowClick(row);
                        }}
                        style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                    >
                        <div className="rt-card-grid">
                            {columns.map((col) => (
                                <div className="rt-field" key={col.key}>
                                    <span className="rt-label">{col.label}</span>
                                    <span className={`rt-value ${getStatusClass(row[col.key], col.key)}`}>
                                        {row[col.key] ?? "-"}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {actions && <div className="rt-card-actions">{actions(row)}</div>}
                    </li>
                ))}
            </ul>
        </div>
    );
}

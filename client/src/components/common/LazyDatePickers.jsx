import React from 'react';

// טוען את ה-DateTimePicker בעצלנות ומציב אותו בתוך Suspense כדי למנוע שגיאת React
const InnerDateTimePicker = React.lazy(async () => {
    const mod = await import('@mui/x-date-pickers');
    return { default: mod.DateTimePicker };
});

export function LazyDateTimePicker(props) {
    return (
        <React.Suspense fallback={null}>
            <InnerDateTimePicker {...props} />
        </React.Suspense>
    );
}



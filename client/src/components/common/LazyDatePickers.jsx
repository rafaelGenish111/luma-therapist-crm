import React from 'react';

export const LazyDateTimePicker = React.lazy(async () => {
    const mod = await import('@mui/x-date-pickers');
    return { default: mod.DateTimePicker };
});



import React from 'react';

const LazyRBC = React.lazy(async () => {
    const mod = await import('react-big-calendar');
    return { default: mod.Calendar };
});

export default function BigCalendarLazy(props) {
    return (
        <React.Suspense fallback={null}>
            <LazyRBC {...props} />
        </React.Suspense>
    );
}



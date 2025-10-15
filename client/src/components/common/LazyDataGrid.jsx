import React from 'react';

const Inner = React.lazy(async () => {
    const mod = await import('@mui/x-data-grid');
    return { default: mod.DataGrid };
});

export default function LazyDataGrid(props) {
    return (
        <React.Suspense fallback={null}>
            <Inner {...props} />
        </React.Suspense>
    );
}



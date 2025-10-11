import React, { useMemo, useState, useCallback } from 'react';
import { Box, Button, Chip, Stack, TextField, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../../services/api';
import { format } from 'date-fns';

const statusColor = (status) => {
    switch (status) {
        case 'pending': return 'warning';
        case 'confirmed': return 'primary';
        case 'completed': return 'success';
        case 'cancelled': return 'error';
        case 'no_show': return 'default';
        default: return 'default';
    }
};

const paymentColor = (paymentStatus) => {
    switch (paymentStatus) {
        case 'paid': return 'success';
        case 'refunded': return 'info';
        default: return 'warning'; // unpaid/other
    }
};

const AppointmentsListView = ({ appointments = [], onEdit, onDelete, onRefresh }) => {
    const [search, setSearch] = useState('');
    const [savingRowId, setSavingRowId] = useState(null);

    const rows = useMemo(() => {
        return appointments
            .filter((apt) => {
                const name = `${apt.client?.firstName || ''} ${apt.client?.lastName || ''}`.toLowerCase();
                const notes = (apt.notes || '').toLowerCase();
                const term = search.toLowerCase();
                return !term || name.includes(term) || notes.includes(term);
            })
            .map((apt) => ({
                id: apt._id,
                date: apt.startTime ? new Date(apt.startTime) : (apt.date ? new Date(apt.date) : null),
                time: apt.startTime ? new Date(apt.startTime) : (apt.date ? new Date(apt.date) : null),
                endTime: apt.endTime ? new Date(apt.endTime) : (apt.startTime ? new Date(new Date(apt.startTime).getTime() + (apt.duration || 60) * 60000) : null),
                client: `${apt.client?.firstName || ''} ${apt.client?.lastName || ''}`.trim() || '—',
                service: apt.serviceType || '—',
                duration: apt.duration || 60,
                status: apt.status,
                paymentStatus: apt.paymentStatus,
                paymentAmount: apt.paymentAmount ?? apt.price ?? 0,
                _apt: apt
            }));
    }, [appointments, search]);

    const columns = [
        {
            field: 'date', headerName: 'תאריך', flex: 1, minWidth: 130,
            valueFormatter: (params) => (params.value ? format(params.value, 'dd/MM/yyyy') : '—')
        },
        {
            field: 'time', headerName: 'שעה', flex: 1, minWidth: 110,
            valueFormatter: (params) => (params.value ? format(params.value, 'HH:mm') : '—')
        },
        {
            field: 'endTime', headerName: 'סיום', flex: 1, minWidth: 110,
            valueFormatter: (params) => (params.value ? format(params.value, 'HH:mm') : '—')
        },
        { field: 'client', headerName: 'לקוח', flex: 1.4, minWidth: 160 },
        { field: 'service', headerName: 'שירות', flex: 1, minWidth: 140 },
        { field: 'duration', headerName: 'משך (דק׳)', type: 'number', flex: 0.8, minWidth: 120 },
        {
            field: 'status', headerName: 'סטטוס', flex: 1, minWidth: 140, editable: true, type: 'singleSelect',
            valueOptions: [
                { value: 'pending', label: 'ממתין' },
                { value: 'confirmed', label: 'מאושר' },
                { value: 'completed', label: 'הושלם' },
                { value: 'cancelled', label: 'בוטל' },
                { value: 'no_show', label: 'לא הגיע' }
            ],
            renderCell: (params) => (
                <Chip label={params.value} color={statusColor(params.value)} size="small" />
            )
        },
        {
            field: 'payment', headerName: 'תשלום', flex: 1.2, minWidth: 160,
            renderCell: (params) => (
                <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={params.row.paymentStatus || 'unpaid'} color={paymentColor(params.row.paymentStatus)} size="small" />
                    <Typography variant="caption">₪{Number(params.row.paymentAmount || 0).toFixed(0)}</Typography>
                </Stack>
            )
        },
        {
            field: 'paymentStatus', headerName: 'סטטוס תשלום', flex: 1, minWidth: 150, editable: true, type: 'singleSelect',
            valueOptions: [
                { value: 'unpaid', label: 'לא שולם' },
                { value: 'paid', label: 'שולם' },
                { value: 'refunded', label: 'הוחזר' }
            ]
        },
        {
            field: 'paymentAmount', headerName: 'סכום (₪)', type: 'number', flex: 0.8, minWidth: 120, editable: true
        },
        {
            field: 'actions', headerName: 'פעולות', sortable: false, flex: 1, minWidth: 160,
            renderCell: (params) => (
                <Stack direction="row" spacing={1}>
                    <Button size="small" variant="outlined" onClick={() => onEdit?.(params.row._apt)}>ערוך</Button>
                    <Button size="small" color="error" onClick={() => onDelete?.(params.row._apt?._id)}>מחק</Button>
                </Stack>
            )
        }
    ];

    const processRowUpdate = useCallback(async (newRow, oldRow) => {
        try {
            setSavingRowId(newRow.id);
            const changed = {};
            if (newRow.status !== oldRow.status) changed.status = newRow.status;
            if (newRow.paymentStatus !== oldRow.paymentStatus) changed.paymentStatus = newRow.paymentStatus;
            if (Number(newRow.paymentAmount) !== Number(oldRow.paymentAmount)) changed.paymentAmount = Number(newRow.paymentAmount || 0);

            if (Object.keys(changed).length > 0) {
                await api.put(`/appointments/${newRow.id}`, changed);
                await onRefresh?.();
            }
            return newRow;
        } catch (e) {
            console.error('Failed to update row', e);
            throw e;
        } finally {
            setSavingRowId(null);
        }
    }, [onRefresh]);

    return (
        <Box sx={{ height: '70vh', display: 'flex', flexDirection: 'column', gap: 1 }}>
            <TextField
                size="small"
                placeholder="חיפוש לפי לקוח/הערות"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ maxWidth: 300, alignSelf: 'flex-start' }}
            />
            <DataGrid
                rows={rows}
                columns={columns}
                disableRowSelectionOnClick
                initialState={{
                    sorting: { sortModel: [{ field: 'date', sort: 'asc' }] },
                    pagination: { paginationModel: { pageSize: 20, page: 0 } }
                }}
                pageSizeOptions={[10, 20, 50]}
                localeText={{ noRowsLabel: 'אין פגישות להצגה' }}
                processRowUpdate={processRowUpdate}
                onProcessRowUpdateError={(err) => console.error(err)}
                loading={!!savingRowId}
                sx={{ direction: 'rtl', '& .MuiDataGrid-columnHeaders': { fontWeight: 600 } }}
            />
        </Box>
    );
};

export default AppointmentsListView;



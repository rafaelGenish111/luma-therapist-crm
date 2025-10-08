import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Checkbox,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Avatar,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  Search,
  FilterList,
  Download,
  Print,
  MoreVert,
  Edit,
  Cancel,
  Visibility,
  CheckCircle,
  AccessTime,
  Cancel as CancelIcon,
  LocationOn,
  VideoCall,
  Home,
  AttachMoney,
  Sort,
} from '@mui/icons-material';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { debounce } from 'lodash';
import AppointmentCard from './AppointmentCard';

const AppointmentsListView = ({
  appointments = [],
  loading = false,
  onAppointmentClick,
  onEditAppointment,
  onCancelAppointment,
  onBulkAction,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('startTime');
  const [selected, setSelected] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState(null);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchTerm(value);
    }, 300),
    []
  );

  // Filter and sort appointments
  const filteredAndSortedAppointments = useMemo(() => {
    let filtered = appointments.filter(appointment => {
      // Search filter
      const matchesSearch = !searchTerm ||
        appointment.client?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.client?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.serviceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.notes?.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;

      // Service filter
      const matchesService = serviceFilter === 'all' || appointment.serviceType === serviceFilter;

      // Payment filter
      const matchesPayment = paymentFilter === 'all' || appointment.paymentStatus === paymentFilter;

      // Date range filter
      let matchesDate = true;
      if (dateRange !== 'all') {
        const appointmentDate = new Date(appointment.startTime);
        const today = new Date();
        
        switch (dateRange) {
          case 'today':
            matchesDate = appointmentDate >= startOfDay(today) && appointmentDate <= endOfDay(today);
            break;
          case 'week':
            const weekStart = startOfDay(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000));
            matchesDate = appointmentDate >= weekStart;
            break;
          case 'month':
            const monthStart = startOfDay(new Date(today.getFullYear(), today.getMonth(), 1));
            matchesDate = appointmentDate >= monthStart;
            break;
          case 'past':
            matchesDate = appointmentDate < startOfDay(today);
            break;
          default:
            matchesDate = true;
        }
      }

      return matchesSearch && matchesStatus && matchesService && matchesPayment && matchesDate;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];

      if (orderBy === 'startTime') {
        aValue = new Date(a.startTime);
        bValue = new Date(b.startTime);
      } else if (orderBy === 'client') {
        aValue = `${a.client?.firstName || ''} ${a.client?.lastName || ''}`.trim();
        bValue = `${b.client?.firstName || ''} ${b.client?.lastName || ''}`.trim();
      }

      if (order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [appointments, searchTerm, statusFilter, serviceFilter, dateRange, paymentFilter, order, orderBy]);

  // Pagination
  const paginatedAppointments = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredAndSortedAppointments.slice(start, start + rowsPerPage);
  }, [filteredAndSortedAppointments, page, rowsPerPage]);

  // Handlers
  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const newSelected = paginatedAppointments.map(appointment => appointment._id);
      setSelected(newSelected);
    } else {
      setSelected([]);
    }
  };

  const handleSelect = (appointmentId) => {
    const selectedIndex = selected.indexOf(appointmentId);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, appointmentId);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleBulkAction = (action) => {
    if (onBulkAction) {
      onBulkAction(action, selected);
    }
    setSelected([]);
    setBulkMenuAnchor(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setServiceFilter('all');
    setDateRange('all');
    setPaymentFilter('all');
  };

  // Get status color and icon
  const getStatusConfig = (status) => {
    switch (status) {
      case 'confirmed':
        return { color: '#4CAF50', icon: CheckCircle, label: 'מאושר' };
      case 'pending':
        return { color: '#FF9800', icon: AccessTime, label: 'ממתין' };
      case 'cancelled':
        return { color: '#F44336', icon: CancelIcon, label: 'בוטל' };
      case 'completed':
        return { color: '#9E9E9E', icon: CheckCircle, label: 'הושלם' };
      default:
        return { color: '#757575', icon: AccessTime, label: status || 'לא מוגדר' };
    }
  };

  const getPaymentColor = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid':
        return '#4CAF50';
      case 'partially_paid':
        return '#FF9800';
      case 'unpaid':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getLocationIcon = (location) => {
    switch (location) {
      case 'online':
        return <VideoCall sx={{ fontSize: 16 }} />;
      case 'home':
        return <Home sx={{ fontSize: 16 }} />;
      case 'clinic':
      default:
        return <LocationOn sx={{ fontSize: 16 }} />;
    }
  };

  // Export functions
  const exportToCSV = () => {
    const headers = ['תאריך', 'שעה', 'לקוח', 'שירות', 'משך', 'סטטוס', 'תשלום', 'מיקום'];
    const csvContent = [
      headers.join(','),
      ...filteredAndSortedAppointments.map(apt => [
        format(parseISO(apt.startTime), 'dd/MM/yyyy', { locale: he }),
        format(parseISO(apt.startTime), 'HH:mm', { locale: he }),
        `${apt.client?.firstName || ''} ${apt.client?.lastName || ''}`,
        apt.serviceType || '',
        `${apt.duration || 60} דק'`,
        getStatusConfig(apt.status).label,
        apt.paymentAmount > 0 ? `${apt.paymentAmount} ₪` : '',
        apt.location === 'online' ? 'אונליין' : apt.location === 'home' ? 'בית' : 'קליניקה'
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `appointments_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <Paper sx={{ height: '100%', p: 2 }}>
        <Skeleton variant="rectangular" width="100%" height={400} />
      </Paper>
    );
  }

  // Mobile view - cards
  if (isMobile) {
    return (
      <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom>
            רשימת פגישות ({filteredAndSortedAppointments.length})
          </Typography>
          
          {/* Search */}
          <TextField
            fullWidth
            size="small"
            placeholder="חיפוש פגישות..."
            value={searchTerm}
            onChange={(e) => debouncedSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {/* Filters */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 100, flex: 1 }}>
              <InputLabel>סטטוס</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="סטטוס"
              >
                <MenuItem value="all">הכל</MenuItem>
                <MenuItem value="confirmed">מאושר</MenuItem>
                <MenuItem value="pending">ממתין</MenuItem>
                <MenuItem value="cancelled">בוטל</MenuItem>
                <MenuItem value="completed">הושלם</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 100, flex: 1 }}>
              <InputLabel>תאריך</InputLabel>
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                label="תאריך"
              >
                <MenuItem value="all">הכל</MenuItem>
                <MenuItem value="today">היום</MenuItem>
                <MenuItem value="week">השבוע</MenuItem>
                <MenuItem value="month">החודש</MenuItem>
                <MenuItem value="past">עבר</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" onClick={clearFilters}>
              נקה סינונים
            </Button>
            <Button size="small" startIcon={<Download />} onClick={exportToCSV}>
              ייצא CSV
            </Button>
          </Box>
        </Box>

        {/* Cards List */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
          {paginatedAppointments.length === 0 ? (
            <Alert severity="info" sx={{ m: 2 }}>
              לא נמצאו פגישות התואמות לסינון
            </Alert>
          ) : (
            paginatedAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment._id}
                appointment={appointment}
                onView={onAppointmentClick}
                onEdit={onEditAppointment}
                onCancel={onCancelAppointment}
                compact
                sx={{ mb: 1 }}
              />
            ))
          )}
        </Box>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={filteredAndSortedAppointments.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="שורות לעמוד:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} מתוך ${count}`}
        />
      </Paper>
    );
  }

  // Desktop view - table
  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            רשימת פגישות ({filteredAndSortedAppointments.length})
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {selected.length > 0 && (
              <>
                <Chip label={`${selected.length} נבחרו`} color="primary" />
                <Button
                  size="small"
                  onClick={(e) => setBulkMenuAnchor(e.currentTarget)}
                >
                  פעולות קבוצתיות
                </Button>
              </>
            )}
            <Button size="small" startIcon={<Download />} onClick={exportToCSV}>
              ייצא CSV
            </Button>
            <Button size="small" startIcon={<Print />} onClick={() => window.print()}>
              הדפס
            </Button>
          </Box>
        </Box>

        {/* Search and Filters */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="חיפוש פגישות..."
            value={searchTerm}
            onChange={(e) => debouncedSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
          />

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>סטטוס</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="סטטוס"
            >
              <MenuItem value="all">הכל</MenuItem>
              <MenuItem value="confirmed">מאושר</MenuItem>
              <MenuItem value="pending">ממתין</MenuItem>
              <MenuItem value="cancelled">בוטל</MenuItem>
              <MenuItem value="completed">הושלם</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>שירות</InputLabel>
            <Select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              label="שירות"
            >
              <MenuItem value="all">הכל</MenuItem>
              <MenuItem value="individual">אישי</MenuItem>
              <MenuItem value="couple">זוגי</MenuItem>
              <MenuItem value="family">משפחתי</MenuItem>
              <MenuItem value="group">קבוצתי</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>תאריך</InputLabel>
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              label="תאריך"
            >
              <MenuItem value="all">הכל</MenuItem>
              <MenuItem value="today">היום</MenuItem>
              <MenuItem value="week">השבוע</MenuItem>
              <MenuItem value="month">החודש</MenuItem>
              <MenuItem value="past">עבר</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>תשלום</InputLabel>
            <Select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              label="תשלום"
            >
              <MenuItem value="all">הכל</MenuItem>
              <MenuItem value="paid">שולם</MenuItem>
              <MenuItem value="partially_paid">חלקי</MenuItem>
              <MenuItem value="unpaid">לא שולם</MenuItem>
            </Select>
          </FormControl>

          <Button size="small" onClick={clearFilters}>
            נקה סינונים
          </Button>
        </Box>
      </Box>

      {/* Table */}
      <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selected.length > 0 && selected.length < paginatedAppointments.length}
                  checked={paginatedAppointments.length > 0 && selected.length === paginatedAppointments.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'startTime'}
                  direction={orderBy === 'startTime' ? order : 'asc'}
                  onClick={() => handleSort('startTime')}
                >
                  תאריך ושעה
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'client'}
                  direction={orderBy === 'client' ? order : 'asc'}
                  onClick={() => handleSort('client')}
                >
                  לקוח
                </TableSortLabel>
              </TableCell>
              <TableCell>שירות</TableCell>
              <TableCell>משך</TableCell>
              <TableCell>סטטוס</TableCell>
              <TableCell>תשלום</TableCell>
              <TableCell>מיקום</TableCell>
              <TableCell>פעולות</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedAppointments.map((appointment) => {
              const isSelected = selected.indexOf(appointment._id) !== -1;
              const statusConfig = getStatusConfig(appointment.status);
              const StatusIcon = statusConfig.icon;

              return (
                <TableRow
                  key={appointment._id}
                  hover
                  selected={isSelected}
                  onClick={() => onAppointmentClick && onAppointmentClick(appointment)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleSelect(appointment._id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {format(parseISO(appointment.startTime), 'dd/MM/yyyy', { locale: he })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(parseISO(appointment.startTime), 'HH:mm', { locale: he })}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                        {appointment.client?.firstName?.[0] || '?'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {appointment.client?.firstName} {appointment.client?.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {appointment.client?.phone}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {appointment.serviceType || 'שירות כללי'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {appointment.duration || 60} דק'
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={<StatusIcon sx={{ fontSize: 16 }} />}
                      label={statusConfig.label}
                      size="small"
                      sx={{ 
                        bgcolor: statusConfig.color,
                        color: 'white',
                        fontSize: '0.75rem'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {appointment.paymentAmount > 0 && (
                      <Chip
                        label={`${appointment.paymentAmount} ₪`}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          borderColor: getPaymentColor(appointment.paymentStatus),
                          color: getPaymentColor(appointment.paymentStatus),
                          fontSize: '0.75rem'
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {getLocationIcon(appointment.location)}
                      <Typography variant="caption">
                        {appointment.location === 'online' ? 'אונליין' : 
                         appointment.location === 'home' ? 'בית' : 'קליניקה'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAnchorEl(e.currentTarget);
                      }}
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={filteredAndSortedAppointments.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 20, 50, 100]}
        labelRowsPerPage="שורות לעמוד:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} מתוך ${count}`}
      />

      {/* Action Menus */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => { setAnchorEl(null); onAppointmentClick && onAppointmentClick(paginatedAppointments.find(a => a._id === selected[0])); }}>
          <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
          <ListItemText>צפייה</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setAnchorEl(null); onEditAppointment && onEditAppointment(paginatedAppointments.find(a => a._id === selected[0])); }}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText>עריכה</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setAnchorEl(null); onCancelAppointment && onCancelAppointment(paginatedAppointments.find(a => a._id === selected[0])); }} sx={{ color: 'error.main' }}>
          <ListItemIcon><Cancel fontSize="small" /></ListItemIcon>
          <ListItemText>ביטול</ListItemText>
        </MenuItem>
      </Menu>

      {/* Bulk Actions Menu */}
      <Menu
        anchorEl={bulkMenuAnchor}
        open={Boolean(bulkMenuAnchor)}
        onClose={() => setBulkMenuAnchor(null)}
      >
        <MenuItem onClick={() => handleBulkAction('confirm')}>
          <ListItemIcon><CheckCircle fontSize="small" /></ListItemIcon>
          <ListItemText>אשר נבחרים</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleBulkAction('cancel')}>
          <ListItemIcon><Cancel fontSize="small" /></ListItemIcon>
          <ListItemText>בטל נבחרים</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleBulkAction('export')}>
          <ListItemIcon><Download fontSize="small" /></ListItemIcon>
          <ListItemText>ייצא נבחרים</ListItemText>
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default AppointmentsListView;

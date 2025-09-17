import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    CircularProgress,
    Alert,
    IconButton,
    Chip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PaymentIcon from '@mui/icons-material/Payment';
import ScheduleIcon from '@mui/icons-material/Schedule';
import FolderIcon from '@mui/icons-material/Folder';
import MessageIcon from '@mui/icons-material/Message';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { Psychology as PsychologyIcon } from '@mui/icons-material';

import clientService from '../../../services/clientService';
import PersonalInfoTab from './components/clientCard/PersonalInfoTab';
import ReferralDescriptionTab from './components/clientCard/ReferralDescriptionTab';
import PaymentsTab from './components/clientCard/PaymentsTab';
import AppointmentsTab from './components/clientCard/AppointmentsTab';
import DocumentsTab from './components/clientCard/DocumentsTab';
import CommunicationTab from './components/clientCard/CommunicationTab';
import ReportsTab from './components/clientCard/ReportsTab';
import TreatmentFlowTab from './components/clientCard/TreatmentFlowTab';

function TabPanel({ children, value, index, ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`client-tabpanel-${index}`}
            aria-labelledby={`client-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export default function ClientCard() {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        if (clientId) {
            loadClient();
        }
    }, [clientId]);

    const loadClient = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await clientService.getClient(clientId);
            setClient(response.data);
        } catch (err) {
            console.error('Error loading client:', err);
            setError('שגיאה בטעינת פרטי הלקוח');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'success';
            case 'new':
                return 'warning';
            case 'completed':
                return 'info';
            case 'inactive':
                return 'error';
            default:
                return 'default';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'active':
                return 'פעיל';
            case 'new':
                return 'חדש';
            case 'completed':
                return 'הושלם';
            case 'inactive':
                return 'לא פעיל';
            default:
                return status || 'לא מוגדר';
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={3}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (!client) {
        return (
            <Box p={3}>
                <Alert severity="warning">לקוח לא נמצא</Alert>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box display="flex" alignItems="center" gap={2}>
                    <IconButton onClick={() => navigate('/dashboard/clients')} color="primary">
                        <ArrowBackIcon />
                    </IconButton>
                    <Box flex={1}>
                        <Typography variant="h4" gutterBottom>
                            {clientService.formatClientName(client)}
                        </Typography>
                        <Box display="flex" gap={2} alignItems="center">
                            <Chip
                                label={getStatusLabel(client.clientStatus || client.status)}
                                color={getStatusColor(client.clientStatus || client.status)}
                                size="small"
                            />
                            {client.nationalId && (
                                <Typography variant="body2" color="text.secondary">
                                    ת.ז.: {client.nationalId}
                                </Typography>
                            )}
                            {client.phone && (
                                <Typography variant="body2" color="text.secondary">
                                    טלפון: {clientService.formatClientPhone(client.phone)}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Paper>

            {/* Tabs */}
            <Paper>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{ px: 2 }}
                    >
                        <Tab
                            icon={<PersonIcon />}
                            label="פרטים אישיים"
                            id="client-tab-0"
                            aria-controls="client-tabpanel-0"
                        />
                        <Tab
                            icon={<DescriptionIcon />}
                            label="תיאור כללי"
                            id="client-tab-1"
                            aria-controls="client-tabpanel-1"
                        />

                        <Tab
                            icon={<ScheduleIcon />}
                            label="פגישות"
                            id="client-tab-2"
                            aria-controls="client-tabpanel-2"
                        />
                        <Tab
                            icon={<PaymentIcon />}
                            label="תשלומים"
                            id="client-tab-3"
                            aria-controls="client-tabpanel-3"
                        />
                        <Tab
                            icon={<FolderIcon />}
                            label="מסמכים"
                            id="client-tab-4"
                            aria-controls="client-tabpanel-4"
                        />
                        <Tab
                            icon={<MessageIcon />}
                            label="תקשורת"
                            id="client-tab-5"
                            aria-controls="client-tabpanel-5"
                        />
                        <Tab
                            icon={<AssessmentIcon />}
                            label="דוחות"
                            id="client-tab-6"
                            aria-controls="client-tabpanel-6"
                        />
                        <Tab
                            icon={<PsychologyIcon />}
                            label="היסטוריית טיפול"
                            id="client-tab-7"
                            aria-controls="client-tabpanel-7"
                        />
                    </Tabs>
                </Box>

                <TabPanel value={tabValue} index={0}>
                    <PersonalInfoTab client={client} onClientUpdate={loadClient} />
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <ReferralDescriptionTab client={client} onClientUpdate={loadClient} />
                </TabPanel>



                <TabPanel value={tabValue} index={2}>
                    <AppointmentsTab client={client} />
                </TabPanel>

                <TabPanel value={tabValue} index={3}>
                    <PaymentsTab client={client} />
                </TabPanel>

                <TabPanel value={tabValue} index={4}>
                    <DocumentsTab client={client} />
                </TabPanel>

                <TabPanel value={tabValue} index={5}>
                    <CommunicationTab client={client} />
                </TabPanel>

                <TabPanel value={tabValue} index={6}>
                    <ReportsTab client={client} />
                </TabPanel>

                <TabPanel value={tabValue} index={7}>
                    <TreatmentFlowTab client={client} />
                </TabPanel>
            </Paper>
        </Box>
    );
}
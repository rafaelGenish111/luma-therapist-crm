import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, Button, CircularProgress, useTheme, useMediaQuery } from '@mui/material';
import ResponsiveTableCards from '../../components/ResponsiveTableCards';
import '../../components/responsive-table.css';
import ClientList from './components/ClientList';
import Footer from '../../../components/common/Footer';
import api, { clientsApi, articlesApi, galleryApi, therapistsApi } from '../../../services/api';
import healthDeclarationService from '../../../services/healthDeclarationService';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
    const [clients, setClients] = useState([]);
    const [articles, setArticles] = useState([]);
    const [gallery, setGallery] = useState([]);
    const [metrics, setMetrics] = useState({ activeClients: 0, articles: 0, galleryImages: 0 });
    const [declarations, setDeclarations] = useState([]);
    const [loading, setLoading] = useState(true);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [clientsRes, articlesRes, galleryRes, declarationsRes, metricsRes] = await Promise.all([
                    clientsApi.getAll(),
                    articlesApi.getAll(),
                    galleryApi.getAll(),
                    healthDeclarationService.getAll(),
                    therapistsApi.getMetrics()
                ]);
                setClients(clientsRes.data.data || []);
                setArticles(articlesRes.data.data || []);
                setGallery(galleryRes.data.data || []);
                setDeclarations(declarationsRes.data.data || []);
                setMetrics(metricsRes.data.data || { activeClients: 0, articles: 0, galleryImages: 0 });
            } catch (err) {
                // אפשר להציג הודעת שגיאה
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        // רענון תקופתי של המונים
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const activeClientsCount = metrics.activeClients ?? (clients.filter(c => (c?.status === 'לקוח קיים') && (c?.isActive !== false)).length);

    return (
        <Box>
            <Box
                p={isMobile ? 2 : 4}
                sx={{
                    '@media (max-width: 480px)': {
                        padding: '1rem'
                    }
                }}
            >
                <Typography
                    variant={isMobile ? "h5" : "h4"}
                    mb={isMobile ? 1 : 2}
                    sx={{
                        '@media (max-width: 480px)': {
                            fontSize: '1.3rem'
                        }
                    }}
                >
                    ברוכה הבאה ללוח הבקרה
                </Typography>

                <Grid container spacing={isMobile ? 1 : 2} mb={isMobile ? 2 : 4}>
                    <Grid item xs={6} sm={6} md={3}>
                        <Paper elevation={2} sx={{
                            p: isMobile ? 1.5 : 3,
                            textAlign: 'center',
                            '@media (max-width: 480px)': {
                                padding: '1rem'
                            }
                        }}>
                            <Typography variant={isMobile ? "body2" : "h6"}>לקוחות פעילים</Typography>
                            <Typography
                                variant={isMobile ? "h4" : "h3"}
                                color="primary"
                                sx={{
                                    '@media (max-width: 480px)': {
                                        fontSize: '1.5rem'
                                    }
                                }}
                            >
                                {activeClientsCount}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={6} sm={6} md={3}>
                        <Paper elevation={2} sx={{
                            p: isMobile ? 1.5 : 3,
                            textAlign: 'center',
                            '@media (max-width: 480px)': {
                                padding: '1rem'
                            }
                        }}>
                            <Typography variant={isMobile ? "body2" : "h6"}>מאמרים</Typography>
                            <Typography
                                variant={isMobile ? "h4" : "h3"}
                                color="primary"
                                sx={{
                                    '@media (max-width: 480px)': {
                                        fontSize: '1.5rem'
                                    }
                                }}
                            >
                                {metrics.articles ?? articles.length}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={6} sm={6} md={3}>
                        <Paper elevation={2} sx={{
                            p: isMobile ? 1.5 : 3,
                            textAlign: 'center',
                            '@media (max-width: 480px)': {
                                padding: '1rem'
                            }
                        }}>
                            <Typography variant={isMobile ? "body2" : "h6"}>תמונות בגלריה</Typography>
                            <Typography
                                variant={isMobile ? "h4" : "h3"}
                                color="primary"
                                sx={{
                                    '@media (max-width: 480px)': {
                                        fontSize: '1.5rem'
                                    }
                                }}
                            >
                                {metrics.galleryImages ?? gallery.length}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={6} sm={6} md={3}>
                        <Paper elevation={2} sx={{
                            p: isMobile ? 1.5 : 3,
                            textAlign: 'center',
                            '@media (max-width: 480px)': {
                                padding: '1rem'
                            }
                        }}>
                            <Typography variant={isMobile ? "body2" : "h6"}>הצהרות בריאות</Typography>
                            <Typography
                                variant={isMobile ? "h4" : "h3"}
                                color="primary"
                                sx={{
                                    '@media (max-width: 480px)': {
                                        fontSize: '1.5rem'
                                    }
                                }}
                            >
                                {declarations.length}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>

                <Typography
                    variant={isMobile ? "h6" : "h5"}
                    mb={isMobile ? 1 : 2}
                    sx={{
                        '@media (max-width: 480px)': {
                            fontSize: '1.1rem'
                        }
                    }}
                >
                    לקוחות אחרונים
                </Typography>

                {loading ? (
                    <Box display="flex" justifyContent="center" p={4}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <ClientList clients={clients.slice(0, 5)} />
                )}

                <Box mt={isMobile ? 2 : 4}>
                    <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        mb={1}
                        flexDirection={isMobile ? "column" : "row"}
                        gap={isMobile ? 1 : 0}
                    >
                        <Typography
                            variant={isMobile ? "h6" : "h5"}
                            sx={{
                                '@media (max-width: 480px)': {
                                    fontSize: '1.1rem'
                                }
                            }}
                        >
                            הצהרות בריאות אחרונות
                        </Typography>
                        <Button
                            component={Link}
                            to="/dashboard/health-declarations"
                            variant="outlined"
                            size={isMobile ? "small" : "small"}
                            sx={{
                                '@media (max-width: 480px)': {
                                    width: '100%'
                                }
                            }}
                        >
                            נהל הצהרות
                        </Button>
                    </Box>
                    <Paper elevation={2} sx={{
                        p: isMobile ? 1 : 2,
                        overflow: 'auto'
                    }}>
                        <ResponsiveTableCards
                            columns={[
                                { key: "fullName", label: "שם לקוחה" },
                                { key: "phone", label: "טלפון" },
                                { key: "status", label: "סטטוס" },
                                { key: "createdAt", label: "תאריך" }
                            ]}
                            rows={declarations.slice(0, 5).map(dec => ({
                                id: dec._id,
                                fullName: dec.fullName,
                                phone: dec.phone,
                                status: dec.status === 'pending' ? 'ממתינה' : dec.status === 'approved' ? 'מאושרת' : 'נדחתה',
                                createdAt: new Date(dec.createdAt).toLocaleDateString('he-IL')
                            }))}
                        />
                    </Paper>
                </Box>
            </Box>
            <Footer variant="therapist" />
        </Box>
    );
};

export default DashboardPage; 
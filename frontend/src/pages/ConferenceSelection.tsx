import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, CircularProgress,
  AppBar, Toolbar, Container, Stack, Button, Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import api from '../api';

export default function ConferenceSelection() {
  const navigate = useNavigate();
  const [conferences, setConferences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [canCreate, setCanCreate] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [confRes, chairRes] = await Promise.all([
          api.get('/conferences'),
          api.get('/conferences/my-chair-status'),
        ]);
        setConferences(confRes.data);
        setCanCreate(chairRes.data.isChair || confRes.data.length === 0);
      } catch (error) {
        console.error('Failed to load conferences', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleLogout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userRole');
    navigate('/login', { replace: true });
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Oxford Blue AppBar */}
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
          <SchoolIcon sx={{ mr: 1.5, color: '#C5A059' }} />
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              letterSpacing: '-0.01em',
            }}
          >
            Conferences
          </Typography>
          <Button
            startIcon={<PersonIcon />}
            onClick={() => navigate('/profile')}
            sx={{
              color: 'rgba(255,255,255,0.85)',
              fontWeight: 500,
              mr: 0.5,
              '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.06)' },
            }}
          >
            Profile
          </Button>
          <Box sx={{ width: '1px', height: 24, bgcolor: 'rgba(255,255,255,0.15)', mx: 1 }} />
          <Button
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 500,
              '&:hover': { color: '#fff', bgcolor: 'rgba(163,38,56,0.15)' },
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 5, mb: 5 }}>
        {/* Header area */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={4}
          sx={{
            animation: 'fadeInUp 350ms cubic-bezier(0.25, 0.1, 0.25, 1.0) both',
            '@keyframes fadeInUp': {
              from: { opacity: 0, transform: 'translateY(12px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Your Conferences
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Select a conference to access your dashboard
            </Typography>
          </Box>
          {canCreate && (
            <Button
              id="create-conference-btn"
              variant="contained"
              color="secondary"
              startIcon={<AddIcon />}
              onClick={() => navigate('/admin/conferences/new')}
              sx={{ py: 1.1, px: 3 }}
            >
              New Conference
            </Button>
          )}
        </Stack>

        {/* Content */}
        {loading ? (
          <Stack alignItems="center" mt={10}>
            <CircularProgress sx={{ color: 'secondary.main' }} />
            <Typography variant="body2" color="text.secondary" mt={2}>
              Loading conferences…
            </Typography>
          </Stack>
        ) : conferences.length === 0 ? (
          <Box
            textAlign="center"
            mt={10}
            sx={{
              animation: 'fadeInUp 400ms cubic-bezier(0.25, 0.1, 0.25, 1.0) both',
              animationDelay: '100ms',
              '@keyframes fadeInUp': {
                from: { opacity: 0, transform: 'translateY(12px)' },
                to: { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            <SchoolIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h5" color="text.secondary">
              No conferences available yet.
            </Typography>
            <Typography variant="body2" color="text.tertiary" mt={1}>
              Create your first conference to get started.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {conferences.map((conf, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={conf.id}>
                <Card
                  id={`conference-card-${conf.id}`}
                  sx={{
                    cursor: 'pointer',
                    borderRadius: 3,
                    transition: 'all 250ms cubic-bezier(0.25, 0.1, 0.25, 1.0)',
                    border: '1px solid',
                    borderColor: 'divider',
                    animation: 'fadeInUp 400ms cubic-bezier(0.25, 0.1, 0.25, 1.0) both',
                    animationDelay: `${index * 60}ms`,
                    '@keyframes fadeInUp': {
                      from: { opacity: 0, transform: 'translateY(12px)' },
                      to: { opacity: 1, transform: 'translateY(0)' },
                    },
                    '&:hover': {
                      borderColor: 'secondary.main',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.025)',
                      transform: 'translateY(-3px)',
                    },
                  }}
                  onClick={() => navigate(`/conferences/${conf.id}/dashboard`)}
                >
                  {/* Accent top bar */}
                  <Box sx={{ height: 4, bgcolor: 'primary.main' }} />
                  <CardContent sx={{ p: 3 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: 'text.primary',
                        mb: 1,
                        fontFamily: '"Merriweather", "Georgia", serif',
                      }}
                    >
                      {conf.title || `Conference #${conf.id}`}
                    </Typography>

                    {conf.acronym && (
                      <Chip
                        label={conf.acronym}
                        size="small"
                        sx={{
                          bgcolor: 'primary.main',
                          color: '#fff',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          height: 22,
                          mb: 1.5,
                        }}
                      />
                    )}

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2, lineHeight: 1.6 }}
                    >
                      {conf.description || 'Click to view details and access your dashboard.'}
                    </Typography>

                    {conf.location && (
                      <Stack direction="row" alignItems="center" spacing={0.5} mb={1}>
                        <LocationOnIcon sx={{ fontSize: 14, color: 'text.tertiary' }} />
                        <Typography variant="caption" color="text.tertiary">
                          {conf.location}
                        </Typography>
                      </Stack>
                    )}

                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'secondary.main', mt: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Open Dashboard
                      </Typography>
                      <ArrowForwardIcon sx={{ fontSize: 14 }} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}

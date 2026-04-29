import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Stack, Alert, Button } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import api from '../api';

export default function DashboardRouter() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    async function resolveRole() {
      try {
        const response = await api.get(`/conferences/${id}/my-role`);
        const role = response.data.role;
        
        localStorage.setItem('userRole', role);
        
        switch (role) {
          case 'AUTHOR':
            navigate(`/conferences/${id}/author`, { replace: true });
            break;
          case 'REVIEWER':
            navigate(`/conferences/${id}/reviewer`, { replace: true });
            break;
          case 'CHAIR':
            navigate(`/conferences/${id}/chair`, { replace: true });
            break;
          default:
            setError(true);
        }
      } catch (err) {
        console.error('Role resolution failed', err);
        setError(true);
      }
    }
    
    if (id) {
      resolveRole();
    }
  }, [id, navigate]);

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{ bgcolor: 'background.default' }}
      >
        <Stack
          spacing={2.5}
          alignItems="center"
          sx={{
            animation: 'fadeInUp 350ms cubic-bezier(0.25, 0.1, 0.25, 1.0) both',
            '@keyframes fadeInUp': {
              from: { opacity: 0, transform: 'translateY(12px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          <Alert severity="error" sx={{ maxWidth: 400 }}>
            You do not have access to this conference.
          </Alert>
          <Button
            variant="contained"
            onClick={() => navigate('/conferences', { replace: true })}
          >
            Return to Conference List
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ bgcolor: 'background.default' }}
    >
      <Stack
        spacing={2}
        alignItems="center"
        sx={{
          animation: 'fadeInUp 350ms cubic-bezier(0.25, 0.1, 0.25, 1.0) both',
          '@keyframes fadeInUp': {
            from: { opacity: 0, transform: 'translateY(12px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        <SchoolIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <CircularProgress sx={{ color: 'secondary.main' }} />
        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
          Loading your dashboard…
        </Typography>
      </Stack>
    </Box>
  );
}

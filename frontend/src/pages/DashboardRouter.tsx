 import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Stack, Alert, Button } from '@mui/material';
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Stack spacing={2} alignItems="center">
          <Alert severity="error">You do not have access to this conference.</Alert>
          <Button variant="contained" onClick={() => navigate('/conferences', { replace: true })}>
            Return to Conference List
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Stack spacing={2} alignItems="center">
        <CircularProgress />
        <Typography>Loading your dashboard...</Typography>
      </Stack>
    </Box>
  );
}

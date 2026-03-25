import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import api from '../api';
import type { AuthResponse } from '../types';

export default function Login() {
  const navigate = useNavigate();

  async function handleLogin(role: 'AUTHOR' | 'CHAIR') {
    try {
        const email = role === 'AUTHOR' ? 'author@test.com' : 'chair@test.com';
        const response = await api.post<AuthResponse>('/auth/login', { email, password: 'test' });
        
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('userRole', role);
        
        if (role === 'AUTHOR') {
            navigate('/author');
        } else {
            navigate('/chair');
        }
    } catch (error) {
        console.error('Login failed:', error);
    }
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ bgcolor: 'grey.100' }}
    >
      <Card sx={{ minWidth: 400, p: 3 }}>
        <CardContent>
          <Typography variant="h4" textAlign="center" gutterBottom>
            Conference CMS
          </Typography>
          <Typography variant="body1" textAlign="center" color="text.secondary" mb={4}>
            Select your role to continue
          </Typography>
          <Stack spacing={2}>
            <Button
              variant="contained"
              size="large"
              startIcon={<PersonIcon />}
              onClick={() => handleLogin('AUTHOR')}
            >
              Login as Author
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<AdminPanelSettingsIcon />}
              onClick={() => handleLogin('CHAIR')}
            >
              Login as Chair
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

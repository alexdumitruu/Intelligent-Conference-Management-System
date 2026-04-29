import { useState } from 'react';
import { Box, Button, Card, CardContent, Typography, TextField, Alert, Stack, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import type { AuthResponse } from '../types';
import SchoolIcon from '@mui/icons-material/School';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post<AuthResponse>('/auth/login', { email, password });
      localStorage.setItem('accessToken', response.data.accessToken);
      navigate('/conferences');
    } catch (error) {
      setError('Invalid email or password. Please try again.');
    }
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{
        bgcolor: 'background.default',
        background: 'linear-gradient(135deg, #F8F9FA 0%, #F0F4F8 50%, #E8EDF2 100%)',
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 440,
          p: 0,
          borderRadius: 3,
          overflow: 'hidden',
          animation: 'fadeInUp 350ms cubic-bezier(0.25, 0.1, 0.25, 1.0) both',
          '@keyframes fadeInUp': {
            from: { opacity: 0, transform: 'translateY(16px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        {/* Oxford Blue Header Band */}
        <Box
          sx={{
            bgcolor: 'primary.main',
            py: 4,
            px: 4,
            textAlign: 'center',
          }}
        >
          <SchoolIcon sx={{ fontSize: 40, color: '#C5A059', mb: 1 }} />
          <Typography
            variant="h5"
            sx={{
              color: '#FFFFFF',
              fontWeight: 700,
              letterSpacing: '-0.01em',
            }}
          >
            Conference CMS
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'rgba(255,255,255,0.65)', mt: 0.5 }}
          >
            Intelligent Conference Management System
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="body1"
            textAlign="center"
            color="text.secondary"
            mb={3}
            sx={{ fontWeight: 500 }}
          >
            Sign in to your account
          </Typography>

          <form onSubmit={handleLogin}>
            <Stack spacing={2.5}>
              <TextField
                id="login-email"
                fullWidth
                label="Email"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <TextField
                id="login-password"
                fullWidth
                label="Password"
                type="password"
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Stack>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              id="login-submit"
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              sx={{ mt: 3, py: 1.3 }}
            >
              Sign In
            </Button>

            <Divider sx={{ my: 3, color: 'text.disabled', fontSize: '0.8125rem' }}>
              New here?
            </Divider>

            <Button
              id="login-register"
              variant="outlined"
              size="large"
              fullWidth
              color="secondary"
              sx={{ py: 1.3 }}
              onClick={() => navigate('/register')}
            >
              Create an Account
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

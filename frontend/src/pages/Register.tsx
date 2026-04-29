import { useState } from 'react';
import { Box, Button, Card, CardContent, Typography, TextField, Alert, Stack, Link } from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import api from '../api';
import SchoolIcon from '@mui/icons-material/School';

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/register', { email, password, firstName, lastName });
      localStorage.setItem('accessToken', res.data.accessToken);
      navigate('/conferences');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
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
          maxWidth: 480,
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
            py: 3.5,
            px: 4,
            textAlign: 'center',
          }}
        >
          <SchoolIcon sx={{ fontSize: 36, color: '#C5A059', mb: 0.5 }} />
          <Typography
            variant="h5"
            sx={{
              color: '#FFFFFF',
              fontWeight: 700,
              letterSpacing: '-0.01em',
            }}
          >
            Create Your Account
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'rgba(255,255,255,0.65)', mt: 0.5 }}
          >
            Join the Conference Management System
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleRegister}>
            <Stack spacing={2.5}>
              <Stack direction="row" spacing={2}>
                <TextField
                  id="register-first-name"
                  fullWidth
                  label="First Name"
                  variant="outlined"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  autoComplete="given-name"
                />
                <TextField
                  id="register-last-name"
                  fullWidth
                  label="Last Name"
                  variant="outlined"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  autoComplete="family-name"
                />
              </Stack>
              <TextField
                id="register-email"
                fullWidth
                label="Email"
                type="email"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <TextField
                id="register-password"
                fullWidth
                label="Password"
                type="password"
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </Stack>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              id="register-submit"
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              sx={{ mt: 3, mb: 2.5, py: 1.3 }}
            >
              Sign Up
            </Button>

            <Typography textAlign="center" variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link
                component={RouterLink}
                to="/login"
                underline="hover"
                sx={{
                  color: 'primary.main',
                  fontWeight: 600,
                  '&:hover': { color: 'secondary.main' },
                }}
              >
                Sign in
              </Link>
            </Typography>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

import { useState } from 'react';
import { Box, Button, Card, CardContent, Typography, TextField, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import type { AuthResponse } from '../types';

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
      sx={{ bgcolor: 'grey.100' }}
    >
      <Card sx={{ minWidth: 400, p: 3 }}>
        <CardContent>
          <Typography variant="h4" textAlign="center" gutterBottom>
            Conference CMS
          </Typography>
          <Typography variant="body1" textAlign="center" color="text.secondary" mb={4}>
            Sign in to your account
          </Typography>
          
          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email"
              variant="outlined"
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              variant="outlined"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            
            {error && (
              <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              sx={{ mt: 3 }}
            >
              Login
            </Button>
            <Button
              variant="outlined"
              size="large"
              fullWidth
              sx={{ mt: 2 }}
              onClick={() => navigate('/register')}
            >
              Register
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

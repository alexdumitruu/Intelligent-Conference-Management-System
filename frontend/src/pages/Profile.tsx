import { useState, useEffect } from 'react';
import { Box, Button, Card, CardContent, Typography, TextField, Alert, Stack } from '@mui/material';
import api from '../api';

export default function Profile() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [message, setMessage] = useState({ text: '', severity: 'success' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const response = await api.get('/users/profile');
      setEmail(response.data.email || '');
      setFirstName(response.data.firstName || '');
      setLastName(response.data.lastName || '');
      setAffiliation(response.data.affiliation || '');
    } catch (error) {
      console.error('Failed to load profile', error);
      setMessage({ text: 'Failed to load profile data (Backend endpoint may be missing).', severity: 'warning' });
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', severity: 'success' });
    try {
      await api.patch('/users/profile', { email, firstName, lastName, affiliation });
      setMessage({ text: 'Profile updated successfully!', severity: 'success' });
    } catch (error: any) {
      setMessage({ text: error.response?.data?.message || 'Update failed.', severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Box p={4} maxWidth={600} mx="auto">
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            My Profile
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Update your academic affiliation and contact details.
          </Typography>

          <form onSubmit={handleUpdateProfile}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </Stack>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <TextField
                fullWidth
                label="Academic Affiliation"
                placeholder="e.g. University of Example"
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
                helperText="Affiliation is used to auto-detect institutional Conflicts of Interest."
              />
            </Stack>

            {message.text && (
              <Alert severity={message.severity as any} sx={{ mt: 2 }}>
                {message.text}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              sx={{ mt: 3 }}
              disabled={isLoading}
            >
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

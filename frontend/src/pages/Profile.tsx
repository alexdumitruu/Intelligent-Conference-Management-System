import { useState, useEffect } from 'react';
import { Box, Button, Card, CardContent, Typography, TextField, Alert, Stack, Divider } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import BadgeIcon from '@mui/icons-material/Badge';
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
    <Box maxWidth={600} mx="auto">
      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {/* Header */}
        <Box
          sx={{
            bgcolor: 'primary.main',
            py: 3,
            px: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <BadgeIcon sx={{ color: '#C5A059', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700 }}>
              My Profile
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              Update your academic details and contact information
            </Typography>
          </Box>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleUpdateProfile}>
            <Stack spacing={2.5}>
              <Stack direction="row" spacing={2}>
                <TextField
                  id="profile-first-name"
                  fullWidth
                  label="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                <TextField
                  id="profile-last-name"
                  fullWidth
                  label="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </Stack>
              <TextField
                id="profile-email"
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Divider sx={{ my: 1 }}>
                <Typography variant="caption" color="text.disabled">
                  Academic Info
                </Typography>
              </Divider>

              <TextField
                id="profile-affiliation"
                fullWidth
                label="Academic Affiliation"
                placeholder="e.g. University of Example"
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
                helperText={
                  <Typography
                    component="span"
                    variant="caption"
                    sx={{
                      fontFamily: '"Merriweather", "Georgia", serif',
                      fontStyle: 'italic',
                      color: 'text.tertiary',
                    }}
                  >
                    Affiliation is used to auto-detect institutional Conflicts of Interest.
                  </Typography>
                }
              />
            </Stack>

            {message.text && (
              <Alert severity={message.severity as any} sx={{ mt: 2.5 }}>
                {message.text}
              </Alert>
            )}

            <Button
              id="profile-save"
              type="submit"
              variant="contained"
              color="secondary"
              startIcon={<SaveIcon />}
              sx={{ mt: 3, py: 1.2 }}
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

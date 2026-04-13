import { useState } from 'react';
import { Box, Button, Card, CardContent, Typography, TextField, Stack, Alert, FormControlLabel, Switch } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function CreateConference() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [acronym, setAcronym] = useState('');
  const [isDoubleBlind, setIsDoubleBlind] = useState(false);
  const [submissionDeadline, setSubmissionDeadline] = useState('');
  const [reviewDeadline, setReviewDeadline] = useState('');
  const [discussionDeadline, setDiscussionDeadline] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await api.post('/conferences', {
        name,
        acronym,
        isDoubleBlind,
        submissionDeadline,
        reviewDeadline,
        discussionDeadline
      });
      navigate('/conferences');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create conference.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Box p={4} maxWidth={600} mx="auto">
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Create New Conference
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Set up the conference parameters and strict progression deadlines.
          </Typography>

          <form onSubmit={handleCreate}>
            <Stack spacing={3}>
              <TextField 
                label="Conference Name" 
                fullWidth 
                required 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
              <TextField 
                label="Acronym (e.g. NeurIPS 2026)" 
                fullWidth 
                required 
                value={acronym} 
                onChange={(e) => setAcronym(e.target.value)} 
              />
              
              <FormControlLabel
                control={<Switch checked={isDoubleBlind} onChange={(e) => setIsDoubleBlind(e.target.checked)} />}
                label="Enable Double-Blind Reviewing"
              />

              <TextField
                label="Submission Deadline"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                required
                value={submissionDeadline}
                onChange={(e) => setSubmissionDeadline(e.target.value)}
              />
              <TextField
                label="Review Deadline"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                required
                value={reviewDeadline}
                onChange={(e) => setReviewDeadline(e.target.value)}
              />
              <TextField
                label="Discussion Deadline"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                required
                value={discussionDeadline}
                onChange={(e) => setDiscussionDeadline(e.target.value)}
              />
              
              {error && <Alert severity="error">{error}</Alert>}

              <Button type="submit" variant="contained" size="large" disabled={isLoading}>
                Create Conference
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

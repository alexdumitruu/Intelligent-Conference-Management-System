import { useState } from 'react';
import { Box, Button, Card, CardContent, Typography, TextField, Stack, Alert, FormControlLabel, Switch } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function CreateConference() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [acronym, setAcronym] = useState('');
  const [location, setLocation] = useState('');
  const [isDoubleBlind, setIsDoubleBlind] = useState(false);
  const [submissionDeadline, setSubmissionDeadline] = useState('');
  const [biddingDeadline, setBiddingDeadline] = useState('');
  const [reviewDeadline, setReviewDeadline] = useState('');
  const [discussionDeadline, setDiscussionDeadline] = useState('');
  const [conferenceStartDate, setConferenceStartDate] = useState('');
  const [conferenceEndDate, setConferenceEndDate] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const dateFields = [
      { value: submissionDeadline, label: 'Submission Deadline' },
      { value: biddingDeadline, label: 'Bidding Deadline' },
      { value: reviewDeadline, label: 'Review Deadline' },
      { value: discussionDeadline, label: 'Discussion Deadline' },
      { value: conferenceStartDate, label: 'Conference Start Date' },
      { value: conferenceEndDate, label: 'Conference End Date' },
    ];
    const missing = dateFields.filter(f => !f.value).map(f => f.label);
    if (missing.length > 0) {
      setError(`Please fill in: ${missing.join(', ')}`);
      setIsLoading(false);
      return;
    }

    try {
      await api.post('/conferences', {
        title,
        acronym,
        location,
        isDoubleBlind,
        submissionDeadline,
        biddingDeadline,
        reviewDeadline,
        discussionDeadline,
        conferenceStartDate,
        conferenceEndDate
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
                label="Conference Title" 
                fullWidth 
                required 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
              />
              <TextField 
                label="Acronym (e.g. NeurIPS 2026)" 
                fullWidth 
                required 
                value={acronym} 
                onChange={(e) => setAcronym(e.target.value)} 
              />
              <TextField label="Location" fullWidth required value={location} onChange={(e) => setLocation(e.target.value)} />
              
              <FormControlLabel
                control={<Switch checked={isDoubleBlind} onChange={(e) => setIsDoubleBlind(e.target.checked)} />}
                label="Enable Double-Blind Reviewing"
              />

              <TextField label="Submission Deadline" type="datetime-local" fullWidth InputLabelProps={{ shrink: true }} value={submissionDeadline} onChange={(e) => setSubmissionDeadline(e.target.value)} />
              <TextField label="Bidding Deadline" type="datetime-local" fullWidth InputLabelProps={{ shrink: true }} value={biddingDeadline} onChange={(e) => setBiddingDeadline(e.target.value)} />
              <TextField label="Review Deadline" type="datetime-local" fullWidth InputLabelProps={{ shrink: true }} value={reviewDeadline} onChange={(e) => setReviewDeadline(e.target.value)} />
              <TextField label="Discussion Deadline" type="datetime-local" fullWidth InputLabelProps={{ shrink: true }} value={discussionDeadline} onChange={(e) => setDiscussionDeadline(e.target.value)} />
              <TextField label="Conference Start Date" type="datetime-local" fullWidth InputLabelProps={{ shrink: true }} value={conferenceStartDate} onChange={(e) => setConferenceStartDate(e.target.value)} />
              <TextField label="Conference End Date" type="datetime-local" fullWidth InputLabelProps={{ shrink: true }} value={conferenceEndDate} onChange={(e) => setConferenceEndDate(e.target.value)} />
              
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

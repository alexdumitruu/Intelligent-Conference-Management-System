import { useState } from 'react';
import {
  Box, Button, Card, CardContent, Typography, TextField,
  Stack, Alert, FormControlLabel, Switch, Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EventIcon from '@mui/icons-material/Event';
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
        title, acronym, location, isDoubleBlind,
        submissionDeadline, biddingDeadline, reviewDeadline,
        discussionDeadline, conferenceStartDate, conferenceEndDate
      });
      navigate('/conferences');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create conference.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Box maxWidth={640} mx="auto">
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
          <AddCircleOutlineIcon sx={{ color: '#C5A059', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700 }}>
              Create New Conference
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              Set up conference parameters and submission timeline
            </Typography>
          </Box>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleCreate}>
            <Stack spacing={2.5}>
              {/* General Info */}
              <TextField
                id="conf-title"
                label="Conference Title"
                fullWidth
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  id="conf-acronym"
                  label="Acronym (e.g. NeurIPS 2026)"
                  fullWidth
                  required
                  value={acronym}
                  onChange={(e) => setAcronym(e.target.value)}
                />
                <TextField
                  id="conf-location"
                  label="Location"
                  fullWidth
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </Stack>

              <FormControlLabel
                control={
                  <Switch
                    checked={isDoubleBlind}
                    onChange={(e) => setIsDoubleBlind(e.target.checked)}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Enable Double-Blind Reviewing
                  </Typography>
                }
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: isDoubleBlind ? 'success.light' : 'transparent',
                  border: '1px solid',
                  borderColor: isDoubleBlind ? 'secondary.main' : 'divider',
                  transition: 'border-color 100ms ease, background-color 100ms ease',
                }}
              />

              {/* Timeline Section */}
              <Divider sx={{ my: 0.5 }}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <EventIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                  <Typography variant="caption" color="text.disabled">
                    Timeline &amp; Deadlines
                  </Typography>
                </Stack>
              </Divider>

              <Stack direction="row" spacing={2}>
                <TextField
                  id="conf-submission-deadline"
                  label="Submission Deadline"
                  type="datetime-local"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={submissionDeadline}
                  onChange={(e) => setSubmissionDeadline(e.target.value)}
                />
                <TextField
                  id="conf-bidding-deadline"
                  label="Bidding Deadline"
                  type="datetime-local"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={biddingDeadline}
                  onChange={(e) => setBiddingDeadline(e.target.value)}
                />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField
                  id="conf-review-deadline"
                  label="Review Deadline"
                  type="datetime-local"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={reviewDeadline}
                  onChange={(e) => setReviewDeadline(e.target.value)}
                />
                <TextField
                  id="conf-discussion-deadline"
                  label="Discussion Deadline"
                  type="datetime-local"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={discussionDeadline}
                  onChange={(e) => setDiscussionDeadline(e.target.value)}
                />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField
                  id="conf-start-date"
                  label="Conference Start Date"
                  type="datetime-local"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={conferenceStartDate}
                  onChange={(e) => setConferenceStartDate(e.target.value)}
                />
                <TextField
                  id="conf-end-date"
                  label="Conference End Date"
                  type="datetime-local"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={conferenceEndDate}
                  onChange={(e) => setConferenceEndDate(e.target.value)}
                />
              </Stack>

              {error && <Alert severity="error">{error}</Alert>}

              <Button
                id="conf-create-submit"
                type="submit"
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{ py: 1.3 }}
              >
                Create Conference
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

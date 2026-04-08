import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Stack, Typography, Rating, Box
} from '@mui/material';
import api from '../api';

interface ReviewFormDialogProps {
  open: boolean;
  onClose: () => void;
  paperId: number | null;
  conferenceId: number | string | undefined;
}

export default function ReviewFormDialog({ open, onClose, paperId, conferenceId }: ReviewFormDialogProps) {
  const [score, setScore] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [contentAuthor, setContentAuthor] = useState('');
  const [contentChair, setContentChair] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!score || !confidence) return;
    setIsSubmitting(true);
    try {
      await api.post(`/reviews/${paperId}`, {
        score,
        confidence,
        contentAuthor,
        contentChair
      });
      onClose();
    } catch (error) {
      console.error('Failed to submit review', error);
      alert('Failed to submit review. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Submit Paper Review</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Box>
            <Typography component="legend">Evaluation Score (1-10)</Typography>
            <Rating
              max={10}
              value={score}
              onChange={(_, newValue) => setScore(newValue)}
            />
          </Box>
          <Box>
            <Typography component="legend">Confidence Level (1-5)</Typography>
            <Rating
              max={5}
              value={confidence}
              onChange={(_, newValue) => setConfidence(newValue)}
            />
          </Box>
          <TextField
            label="Feedback for Authors"
            multiline
            rows={4}
            fullWidth
            value={contentAuthor}
            onChange={(e) => setContentAuthor(e.target.value)}
          />
          <TextField
            label="Confidential Feedback for Chair"
            multiline
            rows={3}
            fullWidth
            value={contentChair}
            onChange={(e) => setContentChair(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting}>
          Submit Review
        </Button>
      </DialogActions>
    </Dialog>
  );
}

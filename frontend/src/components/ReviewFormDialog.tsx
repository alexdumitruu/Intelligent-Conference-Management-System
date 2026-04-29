import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Stack, Typography, Rating, Box, Divider, Alert
} from '@mui/material';
import RateReviewIcon from '@mui/icons-material/RateReview';
import api from '../api';

const serifFont = '"Merriweather", "Georgia", serif';

interface ReviewFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  paperId: number | null;
  conferenceId: number | string | undefined;
}

export default function ReviewFormDialog({ open, onClose, onSuccess, paperId, conferenceId }: ReviewFormDialogProps) {
  const [score, setScore] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [contentAuthor, setContentAuthor] = useState('');
  const [contentChair, setContentChair] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  function resetForm() {
    setScore(null);
    setConfidence(null);
    setContentAuthor('');
    setContentChair('');
    setError('');
  }

  async function handleSubmit() {
    if (!score || !confidence) return;
    setIsSubmitting(true);
    setError('');
    try {
      await api.post(`/reviews/${paperId}`, {
        score,
        confidence,
        contentAuthor,
        contentChair
      });
      resetForm();
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to submit review', error);
      const msg = error.response?.data?.message || 'Failed to submit review. Try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <RateReviewIcon sx={{ color: 'secondary.main' }} />
        Submit Paper Review
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          {/* Score Section */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}
            >
              Evaluation Score (1–10)
            </Typography>
            <Rating
              max={10}
              value={score}
              onChange={(_, newValue) => setScore(newValue)}
              size="large"
            />
            {score && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                {score}/10
              </Typography>
            )}
          </Box>

          {/* Confidence Section */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}
            >
              Confidence Level (1–5)
            </Typography>
            <Rating
              max={5}
              value={confidence}
              onChange={(_, newValue) => setConfidence(newValue)}
              size="large"
            />
            {confidence && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                {confidence}/5
              </Typography>
            )}
          </Box>

          <Divider />

          {/* Feedback for Authors */}
          <TextField
            id="review-feedback-authors"
            label="Feedback for Authors"
            multiline
            rows={4}
            fullWidth
            value={contentAuthor}
            onChange={(e) => setContentAuthor(e.target.value)}
            placeholder="Provide constructive feedback visible to the paper authors…"
            InputProps={{ sx: { fontFamily: serifFont, lineHeight: 1.8 } }}
          />

          {/* Confidential Feedback */}
          <TextField
            id="review-feedback-chair"
            label="Confidential Feedback for Chair"
            multiline
            rows={3}
            fullWidth
            value={contentChair}
            onChange={(e) => setContentChair(e.target.value)}
            placeholder="Private notes for the conference chair only…"
            InputProps={{ sx: { fontFamily: serifFont, lineHeight: 1.8 } }}
            helperText={
              <Typography
                component="span"
                variant="caption"
                sx={{ fontStyle: 'italic', color: 'text.tertiary' }}
              >
                This feedback will only be visible to the conference chair.
              </Typography>
            }
          />

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting || !score || !confidence}
          sx={{ minWidth: 140 }}
        >
          Submit Review
        </Button>
      </DialogActions>
    </Dialog>
  );
}

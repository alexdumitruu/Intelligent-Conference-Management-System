import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Alert, Typography } from '@mui/material';
import api from '../api';

interface RoleAssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  conferenceId: string;
}

export default function RoleAssignmentDialog({ open, onClose, conferenceId }: RoleAssignmentDialogProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleAssign() {
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      await api.post(`/conferences/${conferenceId}/roles`, {
        email,
        roleType: 'REVIEWER'
      });
      setSuccess(`User ${email} has been assigned as a REVIEWER.`);
      setEmail('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign role.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Assign Reviewers</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Invite registered users to review papers for this conference by providing their email address.
        </Typography>
        
        <TextField
          label="User Email Address"
          fullWidth
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          margin="normal"
        />

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={handleAssign} variant="contained" disabled={isLoading || !email}>
          Assign Sub-Reviewer
        </Button>
      </DialogActions>
    </Dialog>
  );
}

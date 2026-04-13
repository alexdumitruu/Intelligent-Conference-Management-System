import { useState, useEffect } from 'react';
import {
  Box, Tabs, Tab, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, ToggleButton,
  ToggleButtonGroup, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Snackbar, Alert
} from '@mui/material';
import { useParams } from 'react-router-dom';
import api from '../api';
import ReviewFormDialog from '../components/ReviewFormDialog';

export default function ReviewerDashboard() {
  const { id } = useParams<{ id: string }>();
  const [tabIndex, setTabIndex] = useState(0);

  const [biddingPapers, setBiddingPapers] = useState<any[]>([]);
  const [assignedPapers, setAssignedPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [selectedPaperId, setSelectedPaperId] = useState<number | null>(null);
  const [conflictReason, setConflictReason] = useState('');

  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  useEffect(() => {
    async function loadPapers() {
      setLoading(true);
      try {
        if (tabIndex === 0) {
          const res = await api.get(`/conferences/${id}/bidding-papers`);
          setBiddingPapers(res.data);
        } else {
          const res = await api.get(`/conferences/${id}/assigned-papers`);
          setAssignedPapers(res.data);
        }
      } catch (error) {
        console.error('Failed to load papers', error);
        setSnackbar({ open: true, message: 'Failed to load papers', severity: 'error' });
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      loadPapers();
    }
  }, [id, tabIndex]);

  async function handleBidChange(paperId: number, newBid: string | null) {
    if (!newBid) return;
    try {
      await api.post(`/conferences/${id}/bids`, { paperId, bidType: newBid });
      setSnackbar({ open: true, message: 'Bid successfully saved!', severity: 'success' });
    } catch (error) {
      console.error('Failed to save bid', error);
      setSnackbar({ open: true, message: 'Failed to save bid', severity: 'error' });
    }
  }

  async function handleConflictSubmit() {
    if (!conflictReason.trim()) return;
    try {
      await api.post(`/conferences/${id}/conflicts`, { paperId: selectedPaperId, reason: conflictReason });
      setSnackbar({ open: true, message: 'Conflict explicitly declared.', severity: 'success' });
      setConflictDialogOpen(false);
      setConflictReason('');
    } catch (error) {
      console.error('Failed to submit conflict', error);
      setSnackbar({ open: true, message: 'Failed to submit conflict', severity: 'error' });
    }
  }

  async function handleRetractConflict(paperId: number) {
    try {
      await api.delete(`/conferences/${id}/conflicts/${paperId}`);
      setSnackbar({ open: true, message: 'Conflict retracted successfully.', severity: 'success' });
    } catch (error: any) {
      console.error('Failed to retract conflict', error);
      setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to retract conflict.', severity: 'error' });
    }
  }

  async function handleDownloadPdf(paperId: number) {
    try {
      const response = await api.get(`/conferences/${id}/papers/${paperId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `paper-${paperId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed', error);
      setSnackbar({ open: true, message: 'Failed to securely download PDF.', severity: 'error' });
    }
  }

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabIndex} onChange={(_, nv) => setTabIndex(nv)}>
          <Tab label="Bidding & Conflicts" />
          <Tab label="My Assigned Reviews" />
        </Tabs>
      </Box>

      {tabIndex === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Abstract</TableCell>
                <TableCell align="center">Bid</TableCell>
                <TableCell align="center">Conflict</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {biddingPapers.map((paper) => (
                <TableRow key={paper.id}>
                  <TableCell>{paper.title}</TableCell>
                  <TableCell>{paper.abstract}</TableCell>
                  <TableCell align="center">
                    <ToggleButtonGroup
                      exclusive
                      size="small"
                      onChange={(_, newVal) => handleBidChange(paper.id, newVal)}
                    >
                      <ToggleButton value="YES" color="success">YES</ToggleButton>
                      <ToggleButton value="MAYBE" color="warning">MAYBE</ToggleButton>
                      <ToggleButton value="NO" color="error">NO</ToggleButton>
                    </ToggleButtonGroup>
                  </TableCell>
                  <TableCell align="center">
                    <Button 
                      color="error" 
                      variant="outlined"
                      size="small"
                      sx={{ mr: 1 }}
                      onClick={() => {
                        setSelectedPaperId(paper.id);
                        setConflictDialogOpen(true);
                      }}
                    >
                      Declare
                    </Button>
                    <Button
                      color="secondary"
                      variant="outlined"
                      size="small"
                      onClick={() => handleRetractConflict(paper.id)}
                    >
                      Retract
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tabIndex === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assignedPapers.map((paper) => (
                <TableRow key={paper.id}>
                  <TableCell>{paper.title}</TableCell>
                  <TableCell align="center">
                    <Button 
                      variant="outlined"
                      size="small"
                      sx={{ mr: 1 }}
                      onClick={() => handleDownloadPdf(paper.id)}
                    >
                      Download PDF
                    </Button>
                    <Button 
                      variant="contained"
                      size="small"
                      onClick={() => {
                        setSelectedPaperId(paper.id);
                        setReviewDialogOpen(true);
                      }}
                    >
                      Submit Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={conflictDialogOpen} onClose={() => setConflictDialogOpen(false)}>
        <DialogTitle>Declare Conflict of Interest</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for conflict"
            fullWidth
            variant="outlined"
            value={conflictReason}
            onChange={(e) => setConflictReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConflictDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConflictSubmit} color="error" variant="contained">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
      
      <ReviewFormDialog 
        open={reviewDialogOpen} 
        onClose={() => setReviewDialogOpen(false)} 
        paperId={selectedPaperId} 
        conferenceId={id} 
      />

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity as 'success' | 'error'}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

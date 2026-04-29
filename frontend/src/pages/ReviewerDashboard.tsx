import { useState, useEffect, useCallback } from 'react';
import {
  Box, Tabs, Tab, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, ToggleButton,
  ToggleButtonGroup, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Snackbar, Alert, Typography, Stack, Chip
} from '@mui/material';
import { useParams } from 'react-router-dom';
import DownloadIcon from '@mui/icons-material/Download';
import RateReviewIcon from '@mui/icons-material/RateReview';
import GavelIcon from '@mui/icons-material/Gavel';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../api';
import ReviewFormDialog from '../components/ReviewFormDialog';

const serifFont = '"Merriweather", "Georgia", serif';

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

  const [rebuttalDialogOpen, setRebuttalDialogOpen] = useState(false);
  const [activeRebuttalText, setActiveRebuttalText] = useState('');

  const loadPapers = useCallback(async () => {
    setLoading(true);
    try {
      if (tabIndex === 1) {
        const res = await api.get(`/conferences/${id}/matching/papers`);
        setBiddingPapers(res.data);
      } else {
        const res = await api.get(`/conferences/${id}/matching/assigned-papers`);
        setAssignedPapers(res.data);
      }
    } catch (error) {
      console.error('Failed to load papers', error);
      setSnackbar({ open: true, message: 'Failed to load papers', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [id, tabIndex]);

  useEffect(() => {
    if (id) {
      loadPapers();
    }
  }, [id, loadPapers]);

  async function handleBidChange(paperId: number, newBid: string | null) {
    if (!newBid) return;
    try {
      await api.post(`/conferences/${id}/matching/bids`, { paperId, bidType: newBid });
      setSnackbar({ open: true, message: 'Bid successfully saved!', severity: 'success' });
    } catch (error) {
      console.error('Failed to save bid', error);
      setSnackbar({ open: true, message: 'Failed to save bid', severity: 'error' });
    }
  }

  async function handleConflictSubmit() {
    if (!conflictReason.trim()) return;
    try {
      await api.post(`/conferences/${id}/matching/conflicts`, { paperId: selectedPaperId, reason: conflictReason });
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
      await api.delete(`/conferences/${id}/matching/conflicts/${paperId}`);
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

  function getStatusChipSx(status: string) {
    switch (status) {
      case 'ACCEPTED':
        return { bgcolor: '#FDFBF7', color: '#8B6914', border: '1px solid #C5A059', fontWeight: 600 };
      case 'REJECTED':
        return { bgcolor: '#FDF5F6', color: '#A32638', border: '1px solid #A32638', fontWeight: 600 };
      case 'DISCUSSION':
        return { bgcolor: '#FFFBEB', color: '#92400E', border: '1px solid #D97706', fontWeight: 600 };
      case 'UNDER_REVIEW':
        return { bgcolor: '#F0F4F8', color: '#002147', border: '1px solid #002147', fontWeight: 600 };
      default:
        return { fontWeight: 500 };
    }
  }

  return (
    <Box>
      {/* Page Header */}
      <Box mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
          Reviewer Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Review assigned papers, place bids, and declare conflicts of interest
        </Typography>
      </Box>

      {/* Tabs */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          mb: 3,
          bgcolor: 'background.paper',
          borderRadius: '8px 8px 0 0',
        }}
      >
        <Tabs value={tabIndex} onChange={(_, nv) => setTabIndex(nv)}>
          <Tab
            icon={<RateReviewIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="My Assigned Reviews"
          />
          <Tab
            icon={<GavelIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Bidding & Conflicts"
          />
        </Tabs>
      </Box>

      {/* ── Bidding Tab ── */}
      {tabIndex === 1 && (
        <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
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
              {biddingPapers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No papers available for bidding.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                biddingPapers.map((paper) => (
                  <TableRow key={paper.id}>
                    <TableCell>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontFamily: serifFont, fontWeight: 700 }}
                      >
                        {paper.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: serifFont,
                          lineHeight: 1.8,
                          color: 'text.secondary',
                          maxWidth: 350,
                        }}
                      >
                        {paper.abstract}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <ToggleButtonGroup
                        exclusive
                        size="small"
                        onChange={(_, newVal) => handleBidChange(paper.id, newVal)}
                        sx={{
                          '& .MuiToggleButton-root': {
                            px: 2,
                            py: 0.5,
                          },
                        }}
                      >
                        <ToggleButton
                          value="YES"
                          sx={{
                            '&.Mui-selected': {
                              bgcolor: '#FDFBF7',
                              color: '#8B6914',
                              borderColor: '#C5A059',
                              '&:hover': { bgcolor: '#FAF5EB' },
                            },
                          }}
                        >
                          Yes
                        </ToggleButton>
                        <ToggleButton
                          value="MAYBE"
                          sx={{
                            '&.Mui-selected': {
                              bgcolor: '#FFFBEB',
                              color: '#92400E',
                              borderColor: '#D97706',
                              '&:hover': { bgcolor: '#FFF7DB' },
                            },
                          }}
                        >
                          Maybe
                        </ToggleButton>
                        <ToggleButton
                          value="NO"
                          sx={{
                            '&.Mui-selected': {
                              bgcolor: '#FDF5F6',
                              color: '#A32638',
                              borderColor: '#A32638',
                              '&:hover': { bgcolor: '#FBECED' },
                            },
                          }}
                        >
                          No
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button 
                          color="error" 
                          variant="outlined"
                          size="small"
                          startIcon={<WarningAmberIcon />}
                          onClick={() => {
                            setSelectedPaperId(paper.id);
                            setConflictDialogOpen(true);
                          }}
                        >
                          Declare
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleRetractConflict(paper.id)}
                        >
                          Retract
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── Assigned Reviews Tab ── */}
      {tabIndex === 0 && (
        <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Paper Title</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assignedPapers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                    <RateReviewIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography color="text.secondary">
                      No papers assigned for review yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                assignedPapers.map((paper) => (
                  <TableRow key={paper.id}>
                    <TableCell>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontFamily: serifFont, fontWeight: 700 }}
                      >
                        {paper.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={paper.status?.replace('_', ' ') || 'N/A'}
                        size="small"
                        sx={getStatusChipSx(paper.status)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button 
                          variant="outlined"
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownloadPdf(paper.id)}
                        >
                          PDF
                        </Button>
                        {(!paper.currentUserReview || paper.currentUserReview.score === 0) && paper.status === 'UNDER_REVIEW' && (
                          <Button 
                            variant="contained"
                            size="small"
                            startIcon={<RateReviewIcon />}
                            onClick={() => {
                              setSelectedPaperId(paper.id);
                              setReviewDialogOpen(true);
                            }}
                          >
                            Review
                          </Button>
                        )}
                        {['DISCUSSION', 'ACCEPTED', 'REJECTED'].includes(paper.status) && paper.rebuttalText && (
                          <Button
                            variant="outlined"
                            color="warning"
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => {
                              setActiveRebuttalText(paper.rebuttalText);
                              setRebuttalDialogOpen(true);
                            }}
                          >
                            Rebuttal
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── Conflict Dialog ── */}
      <Dialog open={conflictDialogOpen} onClose={() => setConflictDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon sx={{ color: 'error.main' }} />
          Declare Conflict of Interest
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Please describe the nature of your conflict of interest with this paper.
          </Typography>
          <TextField
            autoFocus
            label="Reason for conflict"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={conflictReason}
            onChange={(e) => setConflictReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setConflictDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConflictSubmit}
            color="error"
            variant="contained"
            disabled={!conflictReason.trim()}
          >
            Declare Conflict
          </Button>
        </DialogActions>
      </Dialog>
      
      <ReviewFormDialog 
        open={reviewDialogOpen} 
        onClose={() => setReviewDialogOpen(false)} 
        onSuccess={() => {
          loadPapers();
          setSnackbar({ open: true, message: 'Thank you for reviewing, await rebuttal', severity: 'success' });
        }}
        paperId={selectedPaperId} 
        conferenceId={id} 
      />

      {/* ── Rebuttal Dialog ── */}
      <Dialog open={rebuttalDialogOpen} onClose={() => setRebuttalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VisibilityIcon sx={{ color: 'warning.main' }} />
          Author Rebuttal
        </DialogTitle>
        <DialogContent dividers>
          <Typography
            variant="body1"
            sx={{
              whiteSpace: 'pre-wrap',
              fontFamily: serifFont,
              lineHeight: 1.8,
              py: 1,
            }}
          >
            {activeRebuttalText}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setRebuttalDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ── */}
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

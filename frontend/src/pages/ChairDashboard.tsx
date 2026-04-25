import { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, Select, MenuItem, Chip, Stack, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Rating
} from '@mui/material';
import { useParams } from 'react-router-dom';
import api from '../api';
import CitationReportViewer from '../components/CitationReportViewer';
import RoleAssignmentDialog from '../components/RoleAssignmentDialog';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['BIDDING'],
  BIDDING: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['DISCUSSION'],
  DISCUSSION: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: [],
  REJECTED: [],
};

const ALL_STATUSES = ['DRAFT', 'SUBMITTED', 'BIDDING', 'UNDER_REVIEW', 'DISCUSSION', 'ACCEPTED', 'REJECTED'];

export default function ChairDashboard() {
  const { id } = useParams<{ id: string }>();
  const [masterDatas, setMasterDatas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [citationReportOpen, setCitationReportOpen] = useState(false);
  const [activeReport, setActiveReport] = useState<any>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [activePaperId, setActivePaperId] = useState<number | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [activeHistory, setActiveHistory] = useState<any[]>([]);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [reviewsData, setReviewsData] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [rebuttalDialogOpen, setRebuttalDialogOpen] = useState(false);
  const [activeRebuttalText, setActiveRebuttalText] = useState('');

  async function loadMasterTable() {
    setLoading(true);
    try {
      const res = await api.get(`/conferences/${id}/papers/master-table`);
      setMasterDatas(res.data);
    } catch (error) {
      console.error('Failed to load master table', error);
      setSnackbar({ open: true, message: 'Failed to load master table data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      loadMasterTable();
    }
  }, [id]);

  async function handleRunGreedyMatcher() {
    try {
      const res = await api.post(`/conferences/${id}/auto-assign`);
      const { reviewsCreated, papersTransitioned } = res.data;
      setSnackbar({ open: true, message: `Matcher complete: ${reviewsCreated} reviews created, ${papersTransitioned} papers transitioned.`, severity: 'success' });
      loadMasterTable();
    } catch (error: any) {
      console.error('Matcher failed', error);
      const msg = error.response?.data?.message || 'Failed to run greedy matcher.';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    }
  }

  async function handleStatusChange(paperId: number, currentStatus: string, targetStatus: string) {
    try {
      const isForwardTransition = (STATUS_TRANSITIONS[currentStatus] || []).includes(targetStatus);

      if (targetStatus === 'ACCEPTED' || targetStatus === 'REJECTED') {
        if (isForwardTransition) {
          await api.post(`/conferences/${id}/papers/${paperId}/decision`, { decision: targetStatus });
        } else {
          await api.patch(`/conferences/${id}/papers/${paperId}/force-status`, { targetStatus });
        }
      } else if (isForwardTransition) {
        await api.patch(`/conferences/${id}/papers/${paperId}/status`, { targetStatus });
      } else {
        await api.patch(`/conferences/${id}/papers/${paperId}/force-status`, { targetStatus });
      }

      setMasterDatas((prev) => 
        prev.map((p) => p.id === paperId ? { ...p, status: targetStatus } : p)
      );
      setSnackbar({ open: true, message: `Status ${isForwardTransition ? 'advanced' : 'forced back'} to ${targetStatus}.`, severity: 'success' });
    } catch (error: any) {
      console.error('Status change failed', error);
      const msg = error.response?.data?.message || 'Status change failed.';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    }
  }

  async function handleViewReviews(paperId: number) {
    setReviewsLoading(true);
    setReviewsOpen(true);
    try {
      const res = await api.get(`/reviews/${paperId}/chair`);
      setReviewsData(res.data);
    } catch {
      setReviewsData([]);
    } finally {
      setReviewsLoading(false);
    }
  }

  async function handleViewCitationReport(paperId: number) {
    setActivePaperId(paperId);
    const paper = masterDatas.find(p => p.id === paperId);
    if (paper && paper.citationReports && paper.citationReports.length > 0) {
      setActiveReport(paper.citationReports[0]);
    } else {
      setActiveReport(null);
    }
    setCitationReportOpen(true);
  }

  function handleViewHistory(paperId: number) {
    const paper = masterDatas.find(p => p.id === paperId);
    if (paper && paper.paperHistories) {
      setActiveHistory(paper.paperHistories);
      setHistoryDialogOpen(true);
    }
  }

  async function handleVerifyRegex() {
    if (!activePaperId) return;
    setLoading(true);
    try {
      await api.post(`/conferences/${id}/papers/${activePaperId}/citations/verify-regex`);
      setSnackbar({ open: true, message: 'Regex verification complete.', severity: 'success' });
      setCitationReportOpen(false);
      loadMasterTable();
    } catch (e) {
      setSnackbar({ open: true, message: 'Regex Verification Failed', severity: 'error' });
    } finally { setLoading(false); }
  }

  async function handleVerifyGrobid() {
    if (!activePaperId) return;
    setLoading(true);
    try {
      await api.post(`/conferences/${id}/papers/${activePaperId}/citations/verify-ai-stored`);
      setSnackbar({ open: true, message: 'GROBID verification complete.', severity: 'success' });
      setCitationReportOpen(false);
      loadMasterTable();
    } catch (e) {
      setSnackbar({ open: true, message: 'GROBID Verification Failed', severity: 'error' });
    } finally { setLoading(false); }
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
      <Stack direction="row" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Chair Master Table</Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={() => setRoleDialogOpen(true)}>
            Manage Roles
          </Button>
          <Button variant="contained" color="secondary" onClick={handleRunGreedyMatcher}>
            Run Matcher
          </Button>
        </Stack>
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Paper Info</TableCell>
              <TableCell>Authors</TableCell>
              <TableCell>Review Status / Scores</TableCell>
              <TableCell>Citation Status</TableCell>
              <TableCell align="center">Paper State</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {masterDatas.map((paper) => (
              <TableRow key={paper.id}>
                <TableCell>
                  <Typography variant="subtitle2">{paper.title}</Typography>
                  <Chip label={paper.status} size="small" sx={{ mr: 1, mb: 1 }} />
                  <br />
                  <Button variant="text" size="small" onClick={() => handleDownloadPdf(paper.id)}>
                    PDF
                  </Button>
                  <Button variant="text" size="small" onClick={() => handleViewHistory(paper.id)}>
                    History
                  </Button>
                </TableCell>
                <TableCell>
                  {paper.authors?.map((a: any) => (
                    <Typography key={a.id} variant="body2">{a.user?.firstName} {a.user?.lastName}</Typography>
                  ))}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">Reviews: {paper.reviews?.length || 0}</Typography>
                  <Typography variant="body2">
                    Scores: {paper.reviews?.map((r: any) => r.score).join(', ') || 'N/A'}
                  </Typography>
                  <Button size="small" variant="outlined" sx={{ mt: 0.5 }} onClick={() => handleViewReviews(paper.id)}>
                    View Reviews
                  </Button>
                  {['DISCUSSION', 'ACCEPTED', 'REJECTED'].includes(paper.status) && paper.rebuttalText && (
                    <Button 
                      size="small" 
                      variant="outlined" 
                      color="warning" 
                      sx={{ mt: 0.5, ml: 1 }} 
                      onClick={() => {
                        setActiveRebuttalText(paper.rebuttalText);
                        setRebuttalDialogOpen(true);
                      }}
                    >
                      View Rebuttal
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="outlined" size="small" onClick={() => handleViewCitationReport(paper.id)}>
                    View Report
                  </Button>
                </TableCell>
                <TableCell align="center">
                  <Select
                    size="small"
                    value={paper.status}
                    onChange={(e) => handleStatusChange(paper.id, paper.status, e.target.value as string)}
                  >
                    {ALL_STATUSES.map((s: string) => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={citationReportOpen} onClose={() => setCitationReportOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Citation Report</DialogTitle>
        <DialogContent>
          {activeReport ? (
            <CitationReportViewer report={activeReport} />
          ) : (
            <Box mt={2} textAlign="center">
              <Typography mb={3}>No Citation Report found. Trigger extraction explicitly:</Typography>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button variant="outlined" onClick={handleVerifyRegex} disabled={loading}>
                  Run Static Regex Match
                </Button>
                <Button variant="contained" color="secondary" onClick={handleVerifyGrobid} disabled={loading}>
                  Run GROBID AI Match
                </Button>
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCitationReportOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Status Audit Trail</DialogTitle>
        <DialogContent dividers>
          {activeHistory.length === 0 ? (
            <Typography>No history logs available.</Typography>
          ) : (
            <Stack spacing={2}>
              {activeHistory.map((hist, i) => (
                <Box key={i} p={2} border={1} borderColor="grey.300" borderRadius={2}>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(hist.timestamp).toLocaleString()}
                  </Typography>
                  <Typography variant="body1">
                    <strong>{hist.previousState}</strong> &rarr; <strong>{hist.newState}</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Triggered by: {hist.user?.firstName} {hist.user?.lastName} (ID: {hist.user?.id})
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {id && (
        <RoleAssignmentDialog 
          open={roleDialogOpen} 
          onClose={() => setRoleDialogOpen(false)} 
          conferenceId={id} 
        />
      )}

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity as 'success' | 'error'}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Reviews Dialog */}
      <Dialog open={reviewsOpen} onClose={() => setReviewsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Reviews (Chair View)</DialogTitle>
        <DialogContent dividers>
          {reviewsLoading ? (
            <Box textAlign="center" py={3}><CircularProgress /></Box>
          ) : reviewsData.length === 0 ? (
            <Typography color="text.secondary">No reviews submitted yet.</Typography>
          ) : (
            <Stack spacing={3}>
              {reviewsData.map((r: any, i: number) => (
                <Box key={r.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Reviewer {i + 1}{r.user ? ` — ${r.user.firstName} ${r.user.lastName}` : ''}
                  </Typography>
                  <Stack direction="row" spacing={3} mb={1}>
                    <Box>
                      <Typography variant="caption">Score</Typography>
                      <Rating value={r.score} max={10} readOnly size="small" />
                    </Box>
                    <Box>
                      <Typography variant="caption">Confidence</Typography>
                      <Rating value={r.confidence} max={5} readOnly size="small" />
                    </Box>
                  </Stack>
                  <Typography variant="body2" gutterBottom sx={{ whiteSpace: 'pre-wrap' }}>
                    <strong>Feedback for Authors:</strong> {r.contentAuthors || 'None'}
                  </Typography>
                  <Alert severity="info" sx={{ mt: 1 }}>
                    <strong>Confidential (Chair only):</strong> {r.contentChair || 'None'}
                  </Alert>
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Rebuttal Dialog */}
      <Dialog open={rebuttalDialogOpen} onClose={() => setRebuttalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Author Rebuttal</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {activeRebuttalText}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRebuttalDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


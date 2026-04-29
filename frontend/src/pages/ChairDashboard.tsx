import { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, Select, MenuItem, Chip, Stack, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Rating, Divider
} from '@mui/material';
import { useParams } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/People';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import DownloadIcon from '@mui/icons-material/Download';
import HistoryIcon from '@mui/icons-material/History';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
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

const serifFont = '"Merriweather", "Georgia", serif';

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
    case 'BIDDING':
      return { bgcolor: '#F0F4F8', color: '#4A5568', border: '1px solid #CBD5E0', fontWeight: 600 };
    default:
      return { fontWeight: 500 };
  }
}

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
      {/* Page Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Chair Master Table
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Manage paper lifecycle, review assignments, and citation verification
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            id="manage-roles-btn"
            variant="outlined"
            startIcon={<PeopleIcon />}
            onClick={() => setRoleDialogOpen(true)}
          >
            Manage Roles
          </Button>
          <Button
            id="run-matcher-btn"
            variant="contained"
            color="secondary"
            startIcon={<AutoFixHighIcon />}
            onClick={handleRunGreedyMatcher}
          >
            Run Matcher
          </Button>
        </Stack>
      </Stack>

      {/* Master Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <CircularProgress sx={{ color: 'secondary.main' }} />
                </TableCell>
              </TableRow>
            ) : masterDatas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">
                    No papers submitted to this conference yet.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              masterDatas.map((paper) => (
                <TableRow key={paper.id}>
                  {/* Paper Info */}
                  <TableCell sx={{ minWidth: 220 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontFamily: serifFont, fontWeight: 700, color: 'text.primary', mb: 0.5 }}
                    >
                      {paper.title}
                    </Typography>
                    <Chip
                      label={paper.status.replace('_', ' ')}
                      size="small"
                      sx={{ ...getStatusChipSx(paper.status), mr: 0.5, mb: 1 }}
                    />
                    <Stack direction="row" spacing={0.5} mt={0.5}>
                      <Button
                        variant="text"
                        size="small"
                        startIcon={<DownloadIcon sx={{ fontSize: 14 }} />}
                        onClick={() => handleDownloadPdf(paper.id)}
                        sx={{ fontSize: '0.75rem', px: 1, minWidth: 'auto' }}
                      >
                        PDF
                      </Button>
                      <Button
                        variant="text"
                        size="small"
                        startIcon={<HistoryIcon sx={{ fontSize: 14 }} />}
                        onClick={() => handleViewHistory(paper.id)}
                        sx={{ fontSize: '0.75rem', px: 1, minWidth: 'auto' }}
                      >
                        History
                      </Button>
                    </Stack>
                  </TableCell>

                  {/* Authors */}
                  <TableCell>
                    {paper.authors?.map((a: any) => (
                      <Typography
                        key={a.id}
                        variant="body2"
                        sx={{ fontFamily: serifFont, color: 'text.secondary' }}
                      >
                        {a.user?.firstName} {a.user?.lastName}
                      </Typography>
                    ))}
                  </TableCell>

                  {/* Review Status */}
                  <TableCell sx={{ minWidth: 200 }}>
                    <Typography variant="body2" color="text.secondary">
                      Reviews: <strong>{paper.reviews?.length || 0}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Scores: <strong>{paper.reviews?.map((r: any) => r.score).join(', ') || 'N/A'}</strong>
                    </Typography>
                    <Stack direction="row" spacing={0.5} mt={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
                        onClick={() => handleViewReviews(paper.id)}
                        sx={{ fontSize: '0.75rem' }}
                      >
                        Reviews
                      </Button>
                      {['DISCUSSION', 'ACCEPTED', 'REJECTED'].includes(paper.status) && paper.rebuttalText && (
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="warning"
                          onClick={() => {
                            setActiveRebuttalText(paper.rebuttalText);
                            setRebuttalDialogOpen(true);
                          }}
                          sx={{ fontSize: '0.75rem' }}
                        >
                          Rebuttal
                        </Button>
                      )}
                    </Stack>
                  </TableCell>

                  {/* Citation Status */}
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<FactCheckIcon sx={{ fontSize: 14 }} />}
                      onClick={() => handleViewCitationReport(paper.id)}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      View Report
                    </Button>
                  </TableCell>

                  {/* Paper State Selector */}
                  <TableCell align="center">
                    <Select
                      size="small"
                      value={paper.status}
                      onChange={(e) => handleStatusChange(paper.id, paper.status, e.target.value as string)}
                      sx={{
                        minWidth: 140,
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        '& .MuiSelect-select': { py: 0.8 },
                      }}
                    >
                      {ALL_STATUSES.map((s: string) => (
                        <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Citation Report Dialog ── */}
      <Dialog open={citationReportOpen} onClose={() => setCitationReportOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FactCheckIcon sx={{ color: 'primary.main' }} />
          Citation Report
        </DialogTitle>
        <DialogContent>
          {activeReport ? (
            <CitationReportViewer report={activeReport} />
          ) : (
            <Box mt={2} textAlign="center">
              <Typography mb={3} color="text.secondary">
                No Citation Report found. Trigger extraction explicitly:
              </Typography>
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
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCitationReportOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── History Dialog ── */}
      <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon sx={{ color: 'primary.main' }} />
          Status Audit Trail
        </DialogTitle>
        <DialogContent dividers>
          {activeHistory.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              No history logs available.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {activeHistory.map((hist, i) => (
                <Box
                  key={i}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                  }}
                >
                  <Typography variant="caption" color="text.tertiary">
                    {new Date(hist.timestamp).toLocaleString()}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
                    <Chip
                      label={hist.previousState?.replace('_', ' ')}
                      size="small"
                      sx={getStatusChipSx(hist.previousState)}
                    />
                    <ArrowForwardIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                    <Chip
                      label={hist.newState?.replace('_', ' ')}
                      size="small"
                      sx={getStatusChipSx(hist.newState)}
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary" mt={1} display="block">
                    By: {hist.user?.firstName} {hist.user?.lastName}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
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

      {/* ── Reviews Dialog ── */}
      <Dialog open={reviewsOpen} onClose={() => setReviewsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VisibilityIcon sx={{ color: 'primary.main' }} />
          Reviews (Chair View)
        </DialogTitle>
        <DialogContent dividers>
          {reviewsLoading ? (
            <Box textAlign="center" py={4}>
              <CircularProgress sx={{ color: 'secondary.main' }} />
            </Box>
          ) : reviewsData.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              No reviews submitted yet.
            </Typography>
          ) : (
            <Stack spacing={2.5}>
              {reviewsData.map((r: any, i: number) => (
                <Box
                  key={r.id}
                  sx={{
                    p: 2.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    sx={{ color: 'primary.main', fontWeight: 600 }}
                  >
                    Reviewer {i + 1}{r.user ? ` — ${r.user.firstName} ${r.user.lastName}` : ''}
                  </Typography>
                  <Stack direction="row" spacing={4} mb={1.5}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Score</Typography>
                      <Rating value={r.score} max={10} readOnly size="small" />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Confidence</Typography>
                      <Rating value={r.confidence} max={5} readOnly size="small" />
                    </Box>
                  </Stack>
                  <Typography
                    variant="body2"
                    gutterBottom
                    sx={{
                      whiteSpace: 'pre-wrap',
                      fontFamily: serifFont,
                      lineHeight: 1.8,
                    }}
                  >
                    <strong>Feedback for Authors:</strong> {r.contentAuthors || 'None'}
                  </Typography>
                  <Alert
                    severity="info"
                    sx={{
                      mt: 1.5,
                      bgcolor: '#F0F4F8',
                      '& .MuiAlert-icon': { color: '#002147' },
                    }}
                  >
                    <strong>Confidential (Chair only):</strong>{' '}
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{ fontFamily: serifFont, lineHeight: 1.8 }}
                    >
                      {r.contentChair || 'None'}
                    </Typography>
                  </Alert>
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setReviewsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

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
    </Box>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box, Typography, CircularProgress,
  Alert, Stack, TextField, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip,
  Autocomplete, Avatar, Tooltip, Rating, Snackbar
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useParams } from 'react-router-dom';
import api from '../api';

interface CoAuthor {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  affiliation?: string;
}

export default function AuthorDashboard() {
  const { id } = useParams<{ id: string }>();
  const [papers, setPapers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newSubmissionOpen, setNewSubmissionOpen] = useState(false);
  
  // Submission State
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customAbstract, setCustomAbstract] = useState('');
  const [keywords, setKeywords] = useState('');
  const [topics, setTopics] = useState('');

  // Co-author State
  const [coAuthors, setCoAuthors] = useState<CoAuthor[]>([]);
  const [coAuthorSearch, setCoAuthorSearch] = useState('');
  const [coAuthorResults, setCoAuthorResults] = useState<CoAuthor[]>([]);
  const [coAuthorSearchLoading, setCoAuthorSearchLoading] = useState(false);

  // Reviews State
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [reviewsData, setReviewsData] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Rebuttal State
  const [rebuttalOpen, setRebuttalOpen] = useState(false);
  const [activePaperId, setActivePaperId] = useState<number | null>(null);
  const [rebuttalText, setRebuttalText] = useState('');
  
  // UI State
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (id) loadMyPapers();
  }, [id]);

  // Debounced co-author search
  useEffect(() => {
    if (coAuthorSearch.trim().length < 2) {
      setCoAuthorResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setCoAuthorSearchLoading(true);
      try {
        const res = await api.get(`/users/search?q=${encodeURIComponent(coAuthorSearch.trim())}`);
        // Filter out users already added as co-authors
        const filtered = res.data.filter(
          (u: CoAuthor) => !coAuthors.some(ca => ca.id === u.id)
        );
        setCoAuthorResults(filtered);
      } catch (err) {
        console.error('Co-author search failed', err);
      } finally {
        setCoAuthorSearchLoading(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [coAuthorSearch, coAuthors]);

  async function loadMyPapers() {
    setIsLoading(true);
    try {
      const res = await api.get(`/conferences/${id}/papers/mine`);
      setPapers(res.data);
    } catch (err) {
      console.error('Failed to load papers', err);
    } finally {
      setIsLoading(false);
    }
  }

  function resetSubmissionForm() {
    setUploadSuccess(false);
    setUploadLoading(false);
    setErrorMessage('');
    setCustomTitle('');
    setCustomAbstract('');
    setKeywords('');
    setTopics('');
    setCoAuthors([]);
    setCoAuthorSearch('');
    setCoAuthorResults([]);
  }

  function openNewSubmission() {
    resetSubmissionForm();
    setNewSubmissionOpen(true);
  }

  function closeNewSubmission() {
    setNewSubmissionOpen(false);
    resetSubmissionForm();
  }

  async function handleFileUpload(file: File) {
    setUploadLoading(true);
    setErrorMessage('');
    let createdPaperId: number | null = null;
    try {
      const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k !== '');
      const topicArray = topics.split(',').map(t => t.trim()).filter(t => t !== '');
      
      const paperRes = await api.post(`/conferences/${id}/papers`, 
        { 
          title: customTitle.trim() || file.name, 
          abstract: customAbstract.trim() || 'No abstract provided',
          keywords: keywordArray,
          topics: topicArray,
          coAuthorIds: coAuthors.map(ca => ca.id)
        }
      );
      createdPaperId = paperRes.data.id;

      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post(`/conferences/${id}/papers/${createdPaperId}/submit`, formData);
      if (response.status === 200 || response.status === 201) {
        setUploadSuccess(true);
        loadMyPapers();
      }
    } catch (error: any) {
      console.error('Upload failed:', error);
      const msg = error.response?.data?.message || 'Upload failed. Please try again.';
      if (createdPaperId) {
        try {
          await api.delete(`/conferences/${id}/papers/${createdPaperId}`);
        } catch (cleanupErr) {
          console.error('Draft cleanup failed:', cleanupErr);
        }
      }
      setErrorMessage(msg);
    } finally {
      setUploadLoading(false);
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        handleFileUpload(acceptedFiles[0]);
      }
    },
  });

  async function handleRebuttalSubmit() {
    if (!rebuttalText.trim() || !activePaperId) return;
    try {
      await api.post(`/conferences/${id}/papers/${activePaperId}/rebuttal`, { rebuttalText });
      setRebuttalOpen(false);
      setRebuttalText('');
      setSnackbar({
        open: true,
        message: 'Thank you for your rebuttal. The committee will review it and notify you of the final decision shortly.',
        severity: 'success'
      });
      loadMyPapers(); // Refresh status after rebuttal
    } catch (err) {
      console.error('Failed to submit rebuttal', err);
      setSnackbar({
        open: true,
        message: 'Failed to submit rebuttal. Please try again later.',
        severity: 'error'
      });
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'DISCUSSION': return 'warning';
      case 'ACCEPTED': return 'success';
      case 'REJECTED': return 'error';
      case 'UNDER_REVIEW': return 'info';
      default: return 'default';
    }
  }

  async function handleViewReviews(paperId: number) {
    setReviewsLoading(true);
    setReviewsOpen(true);
    try {
      const res = await api.get(`/reviews/${paperId}/author`);
      setReviewsData(res.data);
    } catch {
      setReviewsData([]);
    } finally {
      setReviewsLoading(false);
    }
  }

  function getAuthorNames(paper: any): string {
    if (!paper.authors || paper.authors.length === 0) return '—';
    return paper.authors
      .sort((a: any, b: any) => a.authorOrder - b.authorOrder)
      .map((a: any) => a.user ? `${a.user.firstName} ${a.user.lastName}` : `User #${a.userId}`)
      .join(', ');
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" mb={3}>
        <Typography variant="h4">My Submissions</Typography>
        <Button variant="contained" onClick={openNewSubmission}>
          New Submission
        </Button>
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Abstract</TableCell>
              <TableCell>Authors</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : papers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No submissions yet.
                </TableCell>
              </TableRow>
            ) : (
              papers.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.title}</TableCell>
                  <TableCell>{p.abstract?.substring(0, 50)}...</TableCell>
                  <TableCell>{getAuthorNames(p)}</TableCell>
                  <TableCell align="center">
                    <Chip label={p.status} color={getStatusColor(p.status) as any} size="small" />
                  </TableCell>
                  <TableCell align="center">
                    {p.status === 'DISCUSSION' && !p.rebuttalText && (
                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="warning"
                        onClick={() => {
                          setActivePaperId(p.id);
                          setRebuttalOpen(true);
                        }}
                      >
                        Submit Rebuttal
                      </Button>
                    )}
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleViewReviews(p.id)}
                      sx={{ ml: 1 }}
                    >
                      View Reviews
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* New Submission Dialog */}
      <Dialog open={newSubmissionOpen} onClose={closeNewSubmission} maxWidth="sm" fullWidth>
        <DialogTitle>Submit New Paper</DialogTitle>
        <DialogContent dividers>
          {uploadLoading ? (
            <Stack alignItems="center" spacing={2} py={6}>
              <CircularProgress size={60} />
              <Typography color="text.secondary">Processing PDF with GROBID...</Typography>
            </Stack>
          ) : uploadSuccess ? (
            <Stack alignItems="center" spacing={2} py={6}>
              <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main' }} />
              <Typography variant="h6" color="success.main">Paper submitted successfully!</Typography>
              <Button variant="outlined" onClick={openNewSubmission}>
                Submit Another Paper
              </Button>
            </Stack>
          ) : (
            <>
              <TextField
                fullWidth
                label="Custom Paper Title (optional)"
                variant="outlined"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                sx={{ mb: 3, mt: 1 }}
                helperText="If left blank, the uploaded PDF filename will be used as the title."
              />
              <TextField
                fullWidth
                label="Abstract"
                variant="outlined"
                multiline
                rows={4}
                value={customAbstract}
                onChange={(e) => setCustomAbstract(e.target.value)}
                sx={{ mb: 3 }}
                helperText="Provide a brief summary of your paper."
              />
              <TextField
                fullWidth
                label="Keywords (comma-separated)"
                variant="outlined"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                sx={{ mb: 3 }}
                helperText="e.g., machine learning, neural networks"
              />
              <TextField
                fullWidth
                label="Topics (comma-separated)"
                variant="outlined"
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                sx={{ mb: 3 }}
                helperText="e.g., NLP, Computer Vision"
              />

              {/* Co-Author Section */}
              <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonAddIcon fontSize="small" /> Co-Authors (optional)
              </Typography>
              <Autocomplete
                freeSolo
                options={coAuthorResults}
                getOptionLabel={(option) => 
                  typeof option === 'string' ? option : `${option.firstName} ${option.lastName} (${option.email})`
                }
                loading={coAuthorSearchLoading}
                inputValue={coAuthorSearch}
                onInputChange={(_, value) => setCoAuthorSearch(value)}
                onChange={(_, value) => {
                  if (value && typeof value !== 'string') {
                    setCoAuthors([...coAuthors, value]);
                    setCoAuthorSearch('');
                    setCoAuthorResults([]);
                  }
                }}
                renderOption={(props, option) => (
                  <li {...props} key={typeof option === 'string' ? option : option.id}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 28, height: 28, fontSize: 14 }}>
                        {typeof option !== 'string' ? option.firstName?.[0] : '?'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2">
                          {typeof option !== 'string' ? `${option.firstName} ${option.lastName}` : option}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {typeof option !== 'string' ? option.email : ''}
                        </Typography>
                      </Box>
                    </Stack>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search by email"
                    placeholder="Type an email to search..."
                    variant="outlined"
                    size="small"
                    helperText="Search for registered users by email to add as co-authors"
                  />
                )}
                sx={{ mb: 2 }}
              />
              {coAuthors.length > 0 && (
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 3 }}>
                  {coAuthors.map((ca) => (
                    <Tooltip key={ca.id} title={ca.email}>
                      <Chip
                        avatar={<Avatar>{ca.firstName?.[0]}</Avatar>}
                        label={`${ca.firstName} ${ca.lastName}`}
                        onDelete={() => setCoAuthors(coAuthors.filter(c => c.id !== ca.id))}
                        sx={{ mb: 1 }}
                      />
                    </Tooltip>
                  ))}
                </Stack>
              )}


              <Alert severity="warning" sx={{ mb: 2 }}>
                <strong>Double-Blind Conference:</strong> You must remove your name and affiliation from the PDF before uploading.
              </Alert>

              <Box
                {...getRootProps()}
                sx={{
                  border: '2px dashed',
                  borderColor: isDragActive ? 'primary.main' : 'grey.400',
                  borderRadius: 2,
                  p: 6,
                  textAlign: 'center',
                  cursor: 'pointer',
                  bgcolor: isDragActive ? 'action.hover' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                <input {...getInputProps()} />
                <CloudUploadIcon sx={{ fontSize: 48, color: 'grey.500', mb: 2 }} />
                <Typography variant="body1">
                  {isDragActive ? 'Drop your PDF here...' : 'Drag & drop a PDF, or click to select'}
                </Typography>
                <Typography variant="caption" color="text.secondary">Only .pdf files accepted</Typography>
              </Box>
              {errorMessage && <Alert severity="error" sx={{ mt: 2 }}>{errorMessage}</Alert>}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeNewSubmission}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Rebuttal Dialog */}
      <Dialog open={rebuttalOpen} onClose={() => setRebuttalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Rebuttal</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" mb={2} sx={{ mt: 1 }}>
            Please provide your counter-arguments or clarifications for the reviewers.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={5}
            label="Rebuttal Text"
            value={rebuttalText}
            onChange={(e) => setRebuttalText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRebuttalOpen(false)}>Cancel</Button>
          <Button onClick={handleRebuttalSubmit} variant="contained" color="warning" disabled={!rebuttalText.trim()}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reviews Dialog */}
      <Dialog open={reviewsOpen} onClose={() => setReviewsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reviews</DialogTitle>
        <DialogContent dividers>
          {reviewsLoading ? (
            <Box textAlign="center" py={3}><CircularProgress /></Box>
          ) : reviewsData.length === 0 ? (
            <Typography color="text.secondary">No reviews submitted yet.</Typography>
          ) : (
            <Stack spacing={3}>
              {reviewsData.map((r: any, i: number) => (
                <Box key={r.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>Reviewer {i + 1}</Typography>
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
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {r.contentAuthors || 'No comments.'}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Global Snackbar */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity as 'success' | 'error'} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box, Typography, CircularProgress,
  Alert, Stack, TextField, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useParams } from 'react-router-dom';
import api from '../api';

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
  const [keywords, setKeywords] = useState('');
  const [topics, setTopics] = useState('');

  // Rebuttal State
  const [rebuttalOpen, setRebuttalOpen] = useState(false);
  const [activePaperId, setActivePaperId] = useState<number | null>(null);
  const [rebuttalText, setRebuttalText] = useState('');

  useEffect(() => {
    if (id) loadMyPapers();
  }, [id]);

  async function loadMyPapers() {
    setIsLoading(true);
    try {
      const res = await api.get(`/conferences/${id}/papers`);
      // Note: If backend endpoint returns all papers globally, filtering might be required.
      // Expected to only return papers authored by the user making the request.
      setPapers(res.data);
    } catch (err) {
      console.error('Failed to load papers', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFileUpload(file: File) {
    setUploadLoading(true);
    setErrorMessage('');
    try {
      const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k !== '');
      const topicArray = topics.split(',').map(t => t.trim()).filter(t => t !== '');
      
      const paperRes = await api.post(`/conferences/${id}/papers`, 
        { 
          title: customTitle.trim() || file.name, 
          abstract: 'Uploaded via frontend',
          keywords: keywordArray,
          topics: topicArray
        }
      );
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.patch(`/conferences/${id}/papers/${paperRes.data.id}/submit`, formData);
      if (response.status === 200 || response.status === 201) {
        setUploadSuccess(true);
        loadMyPapers();
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setErrorMessage('Upload failed. Please try again.');
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
      loadMyPapers(); // Refresh status after rebuttal
    } catch (err) {
      console.error('Failed to submit rebuttal', err);
      alert('Failed to submit rebuttal');
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

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" mb={3}>
        <Typography variant="h4">My Submissions</Typography>
        <Button variant="contained" onClick={() => setNewSubmissionOpen(true)}>
          New Submission
        </Button>
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Abstract</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : papers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No submissions yet.
                </TableCell>
              </TableRow>
            ) : (
              papers.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.title}</TableCell>
                  <TableCell>{p.abstract?.substring(0, 50)}...</TableCell>
                  <TableCell align="center">
                    <Chip label={p.status} color={getStatusColor(p.status) as any} size="small" />
                  </TableCell>
                  <TableCell align="center">
                    {p.status === 'DISCUSSION' && (
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* New Submission Dialog */}
      <Dialog open={newSubmissionOpen} onClose={() => {
        setNewSubmissionOpen(false);
        setUploadSuccess(false);
        setErrorMessage('');
      }} maxWidth="sm" fullWidth>
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
          <Button onClick={() => setNewSubmissionOpen(false)}>Close</Button>
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
    </Box>
  );
}


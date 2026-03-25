import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box, Card, CardContent, Typography, CircularProgress,
  Alert, AppBar, Toolbar, Button, Stack, TextField
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function AuthorDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [customTitle, setCustomTitle] = useState('');

  async function handleFileUpload(file: File) {
    setIsLoading(true);
    setErrorMessage('');
    try {
        const paper = await api.post('/conferences/1/papers', 
        { title: customTitle.trim() || file.name, abstract: 'Uploaded via frontend' });
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.patch(`/conferences/1/papers/${paper.data.id}/submit`, formData);
        if (response.status === 200) {
            setUploadSuccess(true);
        }
    } catch (error) {
        console.error('Upload failed:', error);
        setErrorMessage('Upload failed. Please try again.');
    } finally {
        setIsLoading(false);
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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Author Dashboard
          </Typography>
          <Button color="inherit" onClick={() => { localStorage.clear(); navigate('/'); }}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box display="flex" justifyContent="center" alignItems="center" mt={8}>
        <Card sx={{ maxWidth: 600, width: '100%', p: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Submit Your Paper
            </Typography>

            {isLoading ? (
              <Stack alignItems="center" spacing={2} py={6}>
                <CircularProgress size={60} />
                <Typography color="text.secondary">
                  Processing PDF with GROBID...
                </Typography>
              </Stack>
            ) : uploadSuccess ? (
              <Stack alignItems="center" spacing={2} py={6}>
                <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main' }} />
                <Typography variant="h6" color="success.main">
                  Paper submitted successfully!
                </Typography>
              </Stack>
            ) : (
              <>
                <TextField
                  fullWidth
                  label="Custom Paper Title (optional)"
                  variant="outlined"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  sx={{ mb: 3 }}
                  helperText="If left blank, the uploaded PDF filename will be used as the title."
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
                <Typography variant="caption" color="text.secondary">
                  Only .pdf files accepted
                </Typography>
              </Box>
              </>
            )}

            {errorMessage && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errorMessage}
              </Alert>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

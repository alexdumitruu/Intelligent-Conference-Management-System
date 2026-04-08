import { useState, useEffect } from 'react';
import {
  Grid, Card, CardContent, Typography, List, ListItemButton,
  ListItemText, Button, CircularProgress, Stack,
} from '@mui/material';
import api from '../api';
import type { Paper, CitationReport } from '../types';
import CitationReportViewer from '../components/CitationReportViewer';

export default function ChairDashboard() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedPaperId, setSelectedPaperId] = useState<number | null>(null);
  const [report, setReport] = useState<CitationReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadPapers();
  }, []);

  useEffect(() => {
    if (selectedPaperId) {
      loadReport(selectedPaperId);
    }
  }, [selectedPaperId]);

  async function loadReport(paperId: number) {
    setIsLoading(true);
    try {
      const response = await api.get<CitationReport[]>(`/conferences/1/papers/${paperId}/citations`);
      if (response.data && response.data.length > 0) {
        setReport(response.data.find(r => r.extractionMethod === 'AI') || response.data[0]);
      } else {
        setReport(null);
      }
    } catch (error) {
      console.error('Failed to load report:', error);
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadPapers() {
    const response = await api.get<Paper[]>('/conferences/1/papers');
    setPapers(response.data);
  }

  async function handleVerifyAi(paperId: number) {
    setIsLoading(true);
    try {
      const response = await api.post(`/conferences/1/papers/${paperId}/citations/verify-ai-stored`);
      setReport(response.data);
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card sx={{ height: '80vh', overflow: 'auto' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Submitted Papers
            </Typography>
            <List>
              {papers.map((paper) => (
                <ListItemButton
                  key={paper.id}
                  selected={selectedPaperId === paper.id}
                  onClick={() => setSelectedPaperId(paper.id)}
                >
                  <ListItemText
                    primary={paper.title}
                    secondary={`${paper.status} • Uploaded: ${new Date(paper.updatedAt).toLocaleDateString()}`}
                  />
                </ListItemButton>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 8 }}>
        <Card sx={{ height: '80vh', overflow: 'auto' }}>
          <CardContent>
            {!selectedPaperId ? (
              <Typography color="text.secondary" textAlign="center" mt={10}>
                Select a paper from the list to view its citation report
              </Typography>
            ) : isLoading ? (
              <Stack alignItems="center" spacing={2} mt={10}>
                <CircularProgress size={60} />
                <Typography color="text.secondary">Running AI verification...</Typography>
              </Stack>
            ) : report ? (
              <CitationReportViewer report={report} />
            ) : (
              <Stack alignItems="center" spacing={2} mt={10}>
                <Typography color="text.secondary">
                  No report yet for this paper.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => handleVerifyAi(selectedPaperId)}
                >
                  Run AI Citation Verification
                </Button>
              </Stack>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}


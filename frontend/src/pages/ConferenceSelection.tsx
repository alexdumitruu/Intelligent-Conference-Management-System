import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Grid, Typography, CircularProgress, AppBar, Toolbar, Container, Stack, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function ConferenceSelection() {
  const navigate = useNavigate();
  const [conferences, setConferences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [canCreate, setCanCreate] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [confRes, chairRes] = await Promise.all([
          api.get('/conferences'),
          api.get('/conferences/my-chair-status'),
        ]);
        setConferences(confRes.data);
        setCanCreate(chairRes.data.isChair || confRes.data.length === 0);
      } catch (error) {
        console.error('Failed to load conferences', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">Select Conference</Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4 }}>
        {canCreate && (
          <Box display="flex" justifyContent="flex-end" mb={3}>
            <Button variant="contained" color="primary" onClick={() => navigate('/admin/conferences/new')}>
              + Create Conference
            </Button>
          </Box>
        )}
        {loading ? (
          <Stack alignItems="center" mt={10}>
            <CircularProgress />
          </Stack>
        ) : conferences.length === 0 ? (
          <Box textAlign="center" mt={10}>
            <Typography variant="h5" color="text.secondary">
              No conferences available yet.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {conferences.map((conf) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={conf.id}>
                <Card 
                  sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
                  onClick={() => navigate(`/conferences/${conf.id}/dashboard`)}
                >
                  <CardContent>
                    <Typography variant="h6">{conf.title || `Conference #${conf.id}`}</Typography>
                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                      {conf.description || conf.acronym || 'Click to view details'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}

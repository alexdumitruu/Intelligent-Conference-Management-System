import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Grid, Typography, CircularProgress, AppBar, Toolbar, Container, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function ConferenceSelection() {
  const navigate = useNavigate();
  const [conferences, setConferences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConferences() {
      try {
        const response = await api.get('/conferences');
        setConferences(response.data);
      } catch (error) {
        console.error('Failed to load conferences', error);
      } finally {
        setLoading(false);
      }
    }
    loadConferences();
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">Select Conference</Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4 }}>
        {loading ? (
          <Stack alignItems="center" mt={10}>
            <CircularProgress />
          </Stack>
        ) : (
          <Grid container spacing={3}>
            {conferences.map((conf) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={conf.id}>
                <Card 
                  sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
                  onClick={() => navigate(`/conferences/${conf.id}/dashboard`)}
                >
                  <CardContent>
                    <Typography variant="h6">{conf.name || `Conference #${conf.id}`}</Typography>
                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                      {conf.theme || 'Click to view details'}
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

import {
  Box, Typography, Accordion, AccordionSummary, AccordionDetails,
  Chip, Stack, Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ErrorIcon from '@mui/icons-material/Error';
import VerifiedIcon from '@mui/icons-material/Verified';
import type { CitationReport } from '../types';

interface CitationReportViewerProps {
  report: CitationReport;
}

export default function CitationReportViewer({ report }: CitationReportViewerProps) {
  const trustScore = report.totalCitations > 0
    ? Math.round((report.verifiedCitations / report.totalCitations) * 100)
    : 0;

  function getTrustScoreColor(): string {
    if (trustScore >= 75) return 'success.main';
    if (trustScore >= 35) return 'warning.main';
    return 'error.main';
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Citation Verification Report
      </Typography>

      <Chip
        label={report.extractionMethod}
        color={report.extractionMethod === 'AI' ? 'secondary' : 'default'}
        size="small"
        sx={{ mb: 2 }}
      />

      <Stack direction="row" spacing={4} mb={3}>
        <Box textAlign="center">
          <Typography variant="h3" fontWeight="bold" color={getTrustScoreColor()}>
            {trustScore}%
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            Trust Score
          </Typography>
          {report.threshold !== undefined && (
            <Typography variant="caption" display="block" color="text.secondary">
              (Score Threshold: &gt; {report.threshold})
            </Typography>
          )}
        </Box>
        <Box textAlign="center">
          <Typography variant="h4">{report.totalCitations}</Typography>
          <Typography variant="caption" color="text.secondary">Total</Typography>
        </Box>
        <Box textAlign="center">
          <Typography variant="h4" color="success.main">{report.verifiedCitations}</Typography>
          <Typography variant="caption" color="text.secondary">Verified</Typography>
        </Box>
        <Box textAlign="center">
          <Typography variant="h4" color="error.main">{report.flaggedErrors.length}</Typography>
          <Typography variant="caption" color="text.secondary">Flagged</Typography>
        </Box>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Accordion defaultExpanded={report.flaggedErrors.length > 0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <ErrorIcon color="error" sx={{ mr: 1 }} />
          <Typography>Flagged Citations ({report.flaggedErrors.length})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {report.flaggedErrors.length === 0 ? (
            <Typography color="text.secondary">No issues found.</Typography>
          ) : (
            <Stack spacing={1}>
              {report.flaggedErrors.map((error, index) => (
                <Box key={index} sx={{ p: 1.5, bgcolor: 'error.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2">
                    [{error.citationNumber}] {error.referenceText || 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="error.main">
                    {error.reason}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <VerifiedIcon color="success" sx={{ mr: 1 }} />
          <Typography>Verified Citations ({report.verifiedCitations})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography color="text.secondary">
            {report.verifiedCitations} out of {report.totalCitations} references were successfully verified via Crossref.
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

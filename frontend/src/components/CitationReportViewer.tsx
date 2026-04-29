import {
  Box, Typography, Accordion, AccordionSummary, AccordionDetails,
  Chip, Stack, Divider, LinearProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ErrorIcon from '@mui/icons-material/Error';
import VerifiedIcon from '@mui/icons-material/Verified';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import type { CitationReport } from '../types';

const serifFont = '"Merriweather", "Georgia", serif';

interface CitationReportViewerProps {
  report: CitationReport;
}

export default function CitationReportViewer({ report }: CitationReportViewerProps) {
  const trustScore = report.totalCitations > 0
    ? Math.round((report.verifiedCitations / report.totalCitations) * 100)
    : 0;

  function getTrustScoreColor(): string {
    if (trustScore >= 75) return '#C5A059';
    if (trustScore >= 35) return '#D97706';
    return '#A32638';
  }

  function getTrustScoreBg(): string {
    if (trustScore >= 75) return '#FDFBF7';
    if (trustScore >= 35) return '#FFFBEB';
    return '#FDF5F6';
  }

  function getTrustLabel(): string {
    if (trustScore >= 75) return 'High Trust';
    if (trustScore >= 35) return 'Moderate Trust';
    return 'Low Trust';
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <FactCheckIcon sx={{ color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
          Citation Verification Report
        </Typography>
      </Stack>

      <Chip
        label={report.extractionMethod === 'AI' ? 'GROBID AI' : 'Regex'}
        size="small"
        sx={{
          mb: 3,
          fontWeight: 600,
          bgcolor: report.extractionMethod === 'AI' ? 'primary.main' : 'transparent',
          color: report.extractionMethod === 'AI' ? '#fff' : 'text.secondary',
          border: report.extractionMethod === 'AI' ? 'none' : '1px solid #CBD5E0',
        }}
      />

      {/* Trust Score Card */}
      <Box
        sx={{
          p: 3,
          borderRadius: 2,
          bgcolor: getTrustScoreBg(),
          border: '1px solid',
          borderColor: getTrustScoreColor(),
          mb: 3,
        }}
      >
        <Stack direction="row" spacing={4} alignItems="center">
          {/* Trust Score */}
          <Box textAlign="center" sx={{ minWidth: 100 }}>
            <Typography
              variant="h3"
              sx={{ fontWeight: 700, color: getTrustScoreColor(), lineHeight: 1 }}
            >
              {trustScore}%
            </Typography>
            <Typography variant="caption" sx={{ color: getTrustScoreColor(), fontWeight: 600, mt: 0.5, display: 'block' }}>
              {getTrustLabel()}
            </Typography>
            {report.threshold !== undefined && (
              <Typography variant="caption" color="text.secondary" display="block">
                Threshold: &gt; {report.threshold}
              </Typography>
            )}
          </Box>

          {/* Progress Bar */}
          <Box sx={{ flexGrow: 1 }}>
            <LinearProgress
              variant="determinate"
              value={trustScore}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'rgba(0,0,0,0.06)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: getTrustScoreColor(),
                  borderRadius: 4,
                },
              }}
            />
          </Box>

          {/* Stats */}
          <Stack direction="row" spacing={3}>
            <Box textAlign="center">
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {report.totalCitations}
              </Typography>
              <Typography variant="caption" color="text.secondary">Total</Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#C5A059' }}>
                {report.verifiedCitations}
              </Typography>
              <Typography variant="caption" color="text.secondary">Verified</Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#A32638' }}>
                {report.flaggedErrors.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">Flagged</Typography>
            </Box>
          </Stack>
        </Stack>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Flagged Citations */}
      <Accordion defaultExpanded={report.flaggedErrors.length > 0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <ErrorIcon sx={{ mr: 1, color: '#A32638' }} />
          <Typography sx={{ fontWeight: 600 }}>
            Flagged Citations ({report.flaggedErrors.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {report.flaggedErrors.length === 0 ? (
            <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No issues found — all citations verified successfully.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {report.flaggedErrors.map((error, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    bgcolor: '#FDF5F6',
                    borderRadius: 1.5,
                    borderLeft: '3px solid #A32638',
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontFamily: serifFont, fontWeight: 700, color: 'text.primary' }}
                  >
                    [{error.citationNumber}] {error.referenceText || 'N/A'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#A32638', fontWeight: 500, mt: 0.5, display: 'block' }}>
                    {error.reason}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Verified Citations */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <VerifiedIcon sx={{ mr: 1, color: '#C5A059' }} />
          <Typography sx={{ fontWeight: 600 }}>
            Verified Citations ({report.verifiedCitations})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography
            color="text.secondary"
            sx={{ fontFamily: serifFont, lineHeight: 1.8 }}
          >
            {report.verifiedCitations} out of {report.totalCitations} references were successfully verified via Crossref.
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

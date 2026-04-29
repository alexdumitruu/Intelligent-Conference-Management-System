import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import App from './App';

/* ============================================================
   Modern Academic Scholar — MUI Theme
   Oxford Blue + Subdued Gold + Muted Crimson
   ============================================================ */
const theme = createTheme({
  palette: {
    primary: {
      main: '#002147',
      light: '#1A3A5C',
      dark: '#000B1A',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#C5A059',
      light: '#D4B87A',
      dark: '#A68539',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#A32638',
      light: '#FDF5F6',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#D97706',
      light: '#FFFBEB',
    },
    success: {
      main: '#C5A059',
      light: '#FDFBF7',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#002147',
      light: '#F0F4F8',
    },
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A202C',
      secondary: '#4A5568',
      disabled: '#718096',
    },
    divider: '#E2E8F0',
    action: {
      hover: 'rgba(0, 33, 71, 0.04)',
      selected: 'rgba(0, 33, 71, 0.08)',
      focus: 'rgba(197, 160, 89, 0.12)',
    },
  },

  typography: {
    fontFamily: '"Inter", "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 14,
    h1: { fontSize: '2.25rem', fontWeight: 700, lineHeight: 1.25 },
    h2: { fontSize: '1.875rem', fontWeight: 700, lineHeight: 1.25 },
    h3: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.25 },
    h4: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.25 },
    h5: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.25 },
    h6: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.25 },
    subtitle1: { fontSize: '1rem', fontWeight: 500, lineHeight: 1.5 },
    subtitle2: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.5 },
    body1: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.5 },
    body2: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.5, color: '#718096' },
    button: { fontWeight: 600, textTransform: 'none' as const, letterSpacing: '0.01em' },
  },

  shape: {
    borderRadius: 8,
  },

  shadows: [
    'none',
    '0 1px 2px 0 rgba(0,0,0,0.05)',                                                          // 1
    '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',                       // 2
    '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',                       // 3
    '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.025)',                    // 4
    '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.025)',                    // 5
    '0 10px 15px -3px rgba(0,0,0,0.07), 0 4px 6px -2px rgba(0,0,0,0.04)',                     // 6
    '0 10px 15px -3px rgba(0,0,0,0.07), 0 4px 6px -2px rgba(0,0,0,0.04)',                     // 7
    '0 20px 25px -5px rgba(0,0,0,0.07), 0 10px 10px -5px rgba(0,0,0,0.03)',                   // 8
    '0 20px 25px -5px rgba(0,0,0,0.07), 0 10px 10px -5px rgba(0,0,0,0.03)',                   // 9
    '0 20px 25px -5px rgba(0,0,0,0.08), 0 10px 10px -5px rgba(0,0,0,0.04)',                   // 10
    '0 20px 25px -5px rgba(0,0,0,0.08), 0 10px 10px -5px rgba(0,0,0,0.04)',                   // 11
    '0 20px 25px -5px rgba(0,0,0,0.08), 0 10px 10px -5px rgba(0,0,0,0.04)',                   // 12
    '0 20px 25px -5px rgba(0,0,0,0.08), 0 10px 10px -5px rgba(0,0,0,0.04)',                   // 13
    '0 20px 25px -5px rgba(0,0,0,0.08), 0 10px 10px -5px rgba(0,0,0,0.04)',                   // 14
    '0 20px 25px -5px rgba(0,0,0,0.08), 0 10px 10px -5px rgba(0,0,0,0.04)',                   // 15
    '0 25px 50px -12px rgba(0,0,0,0.15)',                                                      // 16
    '0 25px 50px -12px rgba(0,0,0,0.15)',                                                      // 17
    '0 25px 50px -12px rgba(0,0,0,0.15)',                                                      // 18
    '0 25px 50px -12px rgba(0,0,0,0.15)',                                                      // 19
    '0 25px 50px -12px rgba(0,0,0,0.15)',                                                      // 20
    '0 25px 50px -12px rgba(0,0,0,0.15)',                                                      // 21
    '0 25px 50px -12px rgba(0,0,0,0.15)',                                                      // 22
    '0 25px 50px -12px rgba(0,0,0,0.15)',                                                      // 23
    '0 25px 50px -12px rgba(0,0,0,0.15)',                                                      // 24
  ],

  components: {
    /* ── AppBar ── */
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: '#002147',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        },
      },
    },

    /* ── Button ── */
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          textTransform: 'none' as const,
          transition: 'all 250ms cubic-bezier(0.25, 0.1, 0.25, 1.0)',
          '&:focus-visible': {
            boxShadow: '0 0 0 3px rgba(197, 160, 89, 0.4)',
          },
        },
        contained: {
          boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
          },
        },
      },
    },

    /* ── Card ── */
    MuiCard: {
      defaultProps: { elevation: 2 },
      styleOverrides: {
        root: {
          borderRadius: 12,
          transition: 'box-shadow 250ms cubic-bezier(0.25, 0.1, 0.25, 1.0), transform 250ms cubic-bezier(0.25, 0.1, 0.25, 1.0)',
        },
      },
    },

    /* ── Paper ── */
    MuiPaper: {
      defaultProps: { elevation: 2 },
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },

    /* ── TextField ── */
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1)',
            '&.Mui-focused': {
              boxShadow: '0 0 0 3px rgba(197, 160, 89, 0.4)',
            },
            '& fieldset': {
              borderColor: '#E2E8F0',
              transition: 'border-color 150ms ease',
            },
            '&:hover fieldset': {
              borderColor: '#CBD5E0',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#C5A059',
              borderWidth: '2px',
            },
          },
        },
      },
    },

    /* ── Dialog ── */
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.07), 0 10px 10px -5px rgba(0,0,0,0.03)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '1.125rem',
          color: '#002147',
        },
      },
    },

    /* ── Chip ── */
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 6,
        },
      },
    },

    /* ── Table ── */
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#002147',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '0.8125rem',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 150ms ease',
          '&:hover': {
            backgroundColor: 'rgba(0, 33, 71, 0.02)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #EDF2F7',
          padding: '14px 16px',
        },
      },
    },

    /* ── Tabs ── */
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#C5A059',
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          textTransform: 'none' as const,
          fontSize: '0.9375rem',
          '&.Mui-selected': {
            color: '#002147',
          },
        },
      },
    },

    /* ── Rating ── */
    MuiRating: {
      styleOverrides: {
        iconFilled: {
          color: '#C5A059',
        },
        iconHover: {
          color: '#D4B87A',
        },
      },
    },

    /* ── Alert ── */
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        standardSuccess: {
          backgroundColor: '#FDFBF7',
          color: '#8B6914',
          '& .MuiAlert-icon': { color: '#C5A059' },
        },
        standardError: {
          backgroundColor: '#FDF5F6',
          color: '#A32638',
          '& .MuiAlert-icon': { color: '#A32638' },
        },
      },
    },

    /* ── Toolbar ── */
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '56px',
          '@media (min-width:600px)': {
            minHeight: '64px',
          },
        },
      },
    },

    /* ── CssBaseline ── */
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F8F9FA',
        },
      },
    },

    /* ── Switch (Gold accent) ── */
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: '#C5A059',
            '& + .MuiSwitch-track': {
              backgroundColor: '#C5A059',
            },
          },
        },
      },
    },

    /* ── ToggleButton ── */
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none' as const,
          fontWeight: 600,
          borderRadius: 6,
        },
      },
    },

    /* ── Accordion ── */
    MuiAccordion: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid #E2E8F0',
          borderRadius: '8px !important',
          '&:before': { display: 'none' },
          '&:not(:last-child)': { marginBottom: 8 },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          '&.Mui-expanded': {
            borderBottom: '1px solid #EDF2F7',
          },
        },
      },
    },

    /* ── Snackbar ── */
    MuiSnackbar: {
      defaultProps: {
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
      },
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);

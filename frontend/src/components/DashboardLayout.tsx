import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Stack,
} from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';

interface DashboardLayoutProps {
  title: string;
  color?: 'primary' | 'secondary' | 'default' | 'inherit';
}

export default function DashboardLayout({
  title,
}: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userRole');
    navigate('/login', { replace: true });
  }

  const isActive = (path: string) => location.pathname === path;

  const navButtonSx = (path: string) => ({
    color: 'rgba(255,255,255,0.85)',
    fontWeight: isActive(path) ? 700 : 500,
    fontSize: '0.875rem',
    position: 'relative' as const,
    px: 2,
    py: 1,
    borderRadius: 1,
    transition: 'all 250ms cubic-bezier(0.25, 0.1, 0.25, 1.0)',
    '&::after': {
      content: '""',
      position: 'absolute' as const,
      bottom: 0,
      left: '50%',
      transform: isActive(path) ? 'translateX(-50%) scaleX(1)' : 'translateX(-50%) scaleX(0)',
      width: '70%',
      height: '2px',
      backgroundColor: '#C5A059',
      borderRadius: '2px',
      transition: 'transform 250ms cubic-bezier(0.25, 0.1, 0.25, 1.0)',
    },
    '&:hover': {
      color: '#FFFFFF',
      backgroundColor: 'rgba(255,255,255,0.06)',
      '&::after': {
        transform: 'translateX(-50%) scaleX(1)',
      },
    },
  });

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Oxford Blue AppBar with gold accent underline on active nav */}
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
          {/* Brand / Page Title */}
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              fontSize: '1.125rem',
              letterSpacing: '-0.01em',
              color: '#FFFFFF',
            }}
          >
            {title}
          </Typography>

          {/* Navigation */}
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Button
              startIcon={<HomeIcon sx={{ fontSize: '1.1rem' }} />}
              onClick={() => navigate('/conferences')}
              sx={navButtonSx('/conferences')}
            >
              Conferences
            </Button>
            <Button
              startIcon={<PersonIcon sx={{ fontSize: '1.1rem' }} />}
              onClick={() => navigate('/profile')}
              sx={navButtonSx('/profile')}
            >
              Profile
            </Button>

            {/* Logout Divider + Button */}
            <Box
              sx={{
                width: '1px',
                height: 24,
                bgcolor: 'rgba(255,255,255,0.15)',
                mx: 1,
              }}
            />
            <Button
              startIcon={<LogoutIcon sx={{ fontSize: '1.1rem' }} />}
              onClick={handleLogout}
              sx={{
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 500,
                fontSize: '0.875rem',
                px: 2,
                py: 1,
                borderRadius: 1,
                transition: 'all 250ms cubic-bezier(0.25, 0.1, 0.25, 1.0)',
                '&:hover': {
                  color: '#FFFFFF',
                  backgroundColor: 'rgba(163, 38, 56, 0.15)',
                },
              }}
            >
              Logout
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Content Area */}
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            animation: 'fadeInUp 350ms cubic-bezier(0.25, 0.1, 0.25, 1.0) both',
            '@keyframes fadeInUp': {
              from: { opacity: 0, transform: 'translateY(12px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          <Outlet />
        </Box>
      </Container>
    </Box>
  );
}

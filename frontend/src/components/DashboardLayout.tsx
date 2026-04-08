import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
} from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';

interface DashboardLayoutProps {
  title: string;
  color?: 'primary' | 'secondary' | 'default' | 'inherit';
}

export default function DashboardLayout({
  title,
  color = 'primary',
}: DashboardLayoutProps) {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userRole');
    navigate('/login', { replace: true });
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100' }}>
      <AppBar position="static" color={color}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
        <Outlet />
      </Container>
    </Box>
  );
}

// Modern Collapsible Sidebar Component - Babar Style with Theodora Branding
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton,
  Tooltip, Typography, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, Button, Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon, Class as ClassIcon, LibraryBooks as LibraryBooksIcon,
  Assessment as AssessmentIcon, Security as SecurityIcon, BarChart as BarChartIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon
} from '@mui/icons-material';
import { useAuth } from '../../features/auth/contexts/AuthContext';

const Sidebar = ({ onExpandChange, isMobile = false, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const sidebarWidth = 240;

  useEffect(() => {
    if (onExpandChange) onExpandChange(true);
  }, [onExpandChange]);

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { text: 'My Classes', icon: <ClassIcon />, path: '/admin/classes' },
    { text: 'Content Library', icon: <LibraryBooksIcon />, path: '/admin/content' },
    { text: 'Results', icon: <AssessmentIcon />, path: '/admin/results' },
    { text: 'Analytics', icon: <BarChartIcon />, path: '/admin/analytics' },
    { text: 'Integrity Monitor', icon: <SecurityIcon />, path: '/admin/cheat-activity' },
  ];

  const handleLogoutConfirm = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {

    } finally {
      setLogoutDialogOpen(false);
    }
  };

  return (
    <>
      <Box
        sx={{
          width: sidebarWidth,
          height: isMobile ? '100vh' : 'calc(100vh - 32px)',
          bgcolor: '#ffffff',
          color: '#1f2937',
          position: isMobile ? 'relative' : 'fixed',
          left: isMobile ? 0 : 16,
          top: isMobile ? 0 : 16,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1200,
          overflow: 'hidden',
          borderRadius: isMobile ? 0 : 1,
          border: isMobile ? 'none' : '1px solid #e5e7eb',
          boxShadow: isMobile ? 'none' : '2px 0 8px rgba(0,0,0,0.05)',
        }}
      >
        {/* Logo */}
        <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 64, borderBottom: '1px solid #e5e7eb' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
            {/* Theodora Logo */}
            <Box 
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <Typography 
                variant="h5" 
                sx={{ 
                  fontFamily: '"Poppins", "Inter", sans-serif',
                  fontWeight: 900, 
                  fontSize: '26px', 
                  background: 'linear-gradient(135deg, #000000 0%, #374151 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.5px',
                  textTransform: 'uppercase',
                  textShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: -4,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, #000000, transparent)',
                    borderRadius: '2px',
                  }
                }}
              >
                THEODORAQ
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Menu Items */}
        <List sx={{ px: 1.5, flexGrow: 1, overflowY: 'auto' }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: '6px',
                    minHeight: 44,
                    justifyContent: 'initial',
                    px: 2,
                    bgcolor: isActive ? '#000000' : 'transparent',
                    color: isActive ? '#ffffff' : '#6b7280',
                    '&:hover': {
                      bgcolor: isActive ? '#1f2937' : 'rgba(0,0,0,0.04)',
                      color: isActive ? '#ffffff' : '#000000',
                    },
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 0, mr: 2, justifyContent: 'center', color: 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} sx={{ '& .MuiTypography-root': { fontSize: '0.8125rem', fontWeight: 500 } }} />
                  {item.badge && (
                    <Box sx={{ bgcolor: isActive ? '#ffffff' : '#000000', color: isActive ? '#000000' : '#ffffff', px: 1, py: 0.25, borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                      {item.badge}
                    </Box>
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Divider sx={{ borderColor: '#e5e7eb' }} />

        {/* Get Help & Logout */}
        <List sx={{ px: 1.5, py: 1 }}>
          <ListItem disablePadding>
            <ListItemButton onClick={() => window.open('https://help.theodora.com', '_blank')} sx={{ borderRadius: '8px', minHeight: 44, justifyContent: 'initial', px: 2, color: '#6b7280', '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', color: '#1f2937' } }}>
              <ListItemIcon sx={{ minWidth: 0, mr: 2, justifyContent: 'center', color: 'inherit' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </ListItemIcon>
              <ListItemText primary="Get Help" sx={{ '& .MuiTypography-root': { fontSize: '0.8125rem', fontWeight: 500 } }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => setLogoutDialogOpen(true)} sx={{ borderRadius: '8px', minHeight: 44, justifyContent: 'initial', px: 2, color: '#6b7280', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.05)', color: '#ef4444' } }}>
              <ListItemIcon sx={{ minWidth: 0, mr: 2, justifyContent: 'center', color: 'inherit' }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" sx={{ '& .MuiTypography-root': { fontSize: '0.8125rem', fontWeight: 500 } }} />
            </ListItemButton>
          </ListItem>
        </List>

        <Divider sx={{ borderColor: '#e5e7eb' }} />
      </Box>

      {/* Logout Dialog */}
      <Dialog open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)} PaperProps={{ sx: { borderRadius: '12px', minWidth: '400px' } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>Confirm Logout</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to logout? You will need to login again to access your account.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setLogoutDialogOpen(false)} sx={{ color: '#6b7280' }}>Cancel</Button>
          <Button onClick={handleLogoutConfirm} variant="contained" sx={{ bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}>
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Sidebar;

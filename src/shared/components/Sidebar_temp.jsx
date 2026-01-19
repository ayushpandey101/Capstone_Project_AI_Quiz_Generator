// Modern Collapsible Sidebar Component - Babar Style with Theodora Branding
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton,
  Tooltip, Typography, Avatar, TextField, InputAdornment, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, Button, Menu, MenuItem, Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon, Class as ClassIcon, LibraryBooks as LibraryBooksIcon,
  Assessment as AssessmentIcon, Security as SecurityIcon, BarChart as BarChartIcon,
  Settings as SettingsIcon, Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon, MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useAuth } from '../../features/auth/contexts/AuthContext';

const Sidebar = ({ onExpandChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const collapsedWidth = 72;
  const expandedWidth = 280;

  useEffect(() => {
    if (onExpandChange) onExpandChange(isExpanded);
  }, [isExpanded, onExpandChange]);

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { text: 'My Classes', icon: <ClassIcon />, path: '/admin/classes', badge: '2' },
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

  const getInitials = (name) => {
    if (!name) return 'T';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
  };

  const avatarUrl = user?.profilePicture 
    ? (user.profilePicture.startsWith('http') ? user.profilePicture : `http://localhost:5000${user.profilePicture}`)
    : null;

  return (
    <>
      <Box
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        sx={{
          width: isExpanded ? expandedWidth : collapsedWidth,
          height: '100vh',
          bgcolor: '#ffffff',
          color: '#1f2937',
          position: 'fixed',
          left: 0,
          top: 0,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1200,
          overflow: 'hidden',
          borderRight: '1px solid #e5e7eb',
          boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
        }}
      >
        {/* Logo */}
        <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: isExpanded ? 'space-between' : 'center', minHeight: 64, borderBottom: '1px solid #e5e7eb' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
            {/* Theodora Logo */}
            <Box 
              sx={{ 
                width: 36, 
                height: 36, 
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                flexShrink: 0, 
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '10px',
                  padding: '2px',
                  background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                }
              }}
            >
              <Typography 
                sx={{ 
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 900, 
                  fontSize: '22px', 
                  color: '#fff',
                  letterSpacing: '-1px',
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                T
              </Typography>
            </Box>
            {isExpanded && (
              <Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 800, 
                    fontSize: '18px', 
                    whiteSpace: 'nowrap',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.5px'
                  }}
                >
                  Theodora
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontSize: '0.65rem', 
                    color: '#6b7280',
                    fontWeight: 600,
                    letterSpacing: '0.5px'
                  }}
                >
                  Quiz Platform
                </Typography>
              </Box>
            )}
          </Box>
          {isExpanded && (
            <IconButton size="small" onClick={() => setIsExpanded(false)} sx={{ color: '#6b7280' }}>
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        {/* Menu Items */}
        <List sx={{ px: 1.5, flexGrow: 1, overflowY: 'auto' }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Tooltip key={item.text} title={!isExpanded ? item.text : ''} placement="right" arrow>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => navigate(item.path)}
                    sx={{
                      borderRadius: '8px',
                      minHeight: 44,
                      justifyContent: isExpanded ? 'initial' : 'center',
                      px: 2,
                      bgcolor: isActive ? ('rgba(139, 92, 246, 0.08)') : 'transparent',
                      color: isActive ? '#8b5cf6' : ('#6b7280'),
                      '&:hover': {
                        bgcolor: isActive ? ('rgba(139, 92, 246, 0.12)') : ('rgba(0,0,0,0.04)'),
                        color: isActive ? '#8b5cf6' : ('#1f2937'),
                      },
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 0, mr: isExpanded ? 2 : 0, justifyContent: 'center', color: 'inherit' }}>
                      {item.icon}
                    </ListItemIcon>
                    {isExpanded && (
                      <>
                        <ListItemText primary={item.text} sx={{ '& .MuiTypography-root': { fontSize: '0.8125rem', fontWeight: 500 } }} />
                        {item.badge && (
                          <Box sx={{ bgcolor: 'rgba(0,0,0,0.06)', color: '#6b7280', px: 1, py: 0.25, borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                            {item.badge}
                          </Box>
                        )}
                      </>
                    )}
                  </ListItemButton>
                </ListItem>
              </Tooltip>
            );
          })}
        </List>

        <Divider sx={{ borderColor: '#e5e7eb' }} />

        {/* Settings & Logout */}
        <List sx={{ px: 1.5, py: 1 }}>
          <Tooltip title={!isExpanded ? 'Settings' : ''} placement="right" arrow>
            <ListItem disablePadding>
              <ListItemButton onClick={() => navigate('/admin/profile')} sx={{ borderRadius: '8px', minHeight: 44, justifyContent: isExpanded ? 'initial' : 'center', px: 2, color: '#6b7280', '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', color: '#1f2937' } }}>
                <ListItemIcon sx={{ minWidth: 0, mr: isExpanded ? 2 : 0, justifyContent: 'center', color: 'inherit' }}>
                  <SettingsIcon />
                </ListItemIcon>
                {isExpanded && <ListItemText primary="Settings" sx={{ '& .MuiTypography-root': { fontSize: '0.8125rem', fontWeight: 500 } }} />}
              </ListItemButton>
            </ListItem>
          </Tooltip>
          <Tooltip title={!isExpanded ? 'Logout' : ''} placement="right" arrow>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setLogoutDialogOpen(true)} sx={{ borderRadius: '8px', minHeight: 44, justifyContent: isExpanded ? 'initial' : 'center', px: 2, color: '#6b7280', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.05)', color: '#ef4444' } }}>
                <ListItemIcon sx={{ minWidth: 0, mr: isExpanded ? 2 : 0, justifyContent: 'center', color: 'inherit' }}>
                  <LogoutIcon />
                </ListItemIcon>
                {isExpanded && <ListItemText primary="Logout" sx={{ '& .MuiTypography-root': { fontSize: '0.8125rem', fontWeight: 500 } }} />}
              </ListItemButton>
            </ListItem>
          </Tooltip>
        </List>

        <Divider sx={{ borderColor: '#e5e7eb' }} />

        {/* Theme Toggle */}
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: isExpanded ? 'space-between' : 'center', gap: 0.5, bgcolor: '#f9fafb', borderRadius: '8px', p: 0.5 }}>
            <IconButton onClick={() => setfalse(!false)} size="small" sx={{ color: !'#64748b', bgcolor: !'transparent', boxShadow: !'none', borderRadius: '6px', minWidth: isExpanded ? 'auto' : 40, px: isExpanded ? 1.5 : 0 }}>
              <LightModeIcon fontSize="small" />
              {isExpanded && <Typography sx={{ ml: 1, fontSize: '0.75rem', fontWeight: 500 }}>Light</Typography>}
            </IconButton>
            {isExpanded && (
              <IconButton onClick={() => setfalse(!false)} size="small" sx={{ color: '#64748b', bgcolor: 'transparent', boxShadow: 'none', borderRadius: '6px', px: 1.5 }}>
                <DarkModeOutlinedIcon fontSize="small" />
                <Typography sx={{ ml: 1, fontSize: '0.75rem', fontWeight: 500 }}>Dark</Typography>
              </IconButton>
            )}
          </Box>
        </Box>

        <Divider sx={{ borderColor: '#e5e7eb' }} />

        {/* User Profile */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }} onClick={isExpanded ? undefined : () => navigate('/admin/profile')}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }} onClick={isExpanded ? () => navigate('/admin/profile') : undefined}>
            <Avatar src={avatarUrl} sx={{ width: 36, height: 36, bgcolor: '#8b5cf6', fontSize: '0.875rem', fontWeight: 600, flexShrink: 0 }}>
              {getInitials(user?.name)}
            </Avatar>
            {isExpanded && (
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name || 'User'}
                </Typography>
                <Typography sx={{ fontSize: '0.6875rem', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email || 'user@example.com'}
                </Typography>
              </Box>
            )}
          </Box>
          {isExpanded && (
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); }} sx={{ color: '#6b7280' }}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* User Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} PaperProps={{ sx: { mt: 1, ml: 1, minWidth: 180, borderRadius: '8px' } }}>
        <MenuItem onClick={() => { navigate('/admin/profile'); setAnchorEl(null); }}>
          <ListItemIcon><Avatar sx={{ width: 24, height: 24 }} /></ListItemIcon>
          <ListItemText primary="Profile" />
        </MenuItem>
        <MenuItem onClick={() => { navigate('/admin/profile'); setAnchorEl(null); }}>
          <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { setLogoutDialogOpen(true); setAnchorEl(null); }} sx={{ color: '#ef4444' }}>
          <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: '#ef4444' }} /></ListItemIcon>
          <ListItemText primary="Logout" />
        </MenuItem>
      </Menu>

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

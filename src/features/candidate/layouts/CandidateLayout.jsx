// Candidate Layout Component
import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, Toolbar, Typography, List, ListItem, 
  ListItemButton, ListItemText, Drawer, Button, IconButton,
  Menu, MenuItem, Divider, ListItemIcon, Avatar, Dialog,
  DialogTitle, DialogContent, DialogContentText, DialogActions, useMediaQuery, useTheme,
  TextField, InputAdornment, Badge, Tooltip
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ClassIcon from '@mui/icons-material/Class';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationBell from '../../../shared/components/NotificationBell';
import { useAuth } from '../../auth/contexts/AuthContext';

const sidebarWidth = 240;
const leftGap = 16;

const CandidateLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogoutClick = () => {
    handleMenuClose();
    setLogoutDialogOpen(true);
  };

  const handleLogoutConfirm = async () => {
    setLogoutDialogOpen(false);
    await logout();
    navigate('/');
  };

  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false);
  };

  const handleProfileClick = () => {
    handleMenuClose();
    navigate('/candidate/profile');
  };

  const menuItems = [
    { text: 'Dashboard', path: '/candidate/dashboard', icon: <DashboardIcon /> },
    { text: 'My Classes', path: '/candidate/my-classes', icon: <ClassIcon /> },
    { text: 'Join a Class', path: '/candidate/join-class', icon: <AddCircleIcon /> },
    { text: 'Learning Hub', path: '/candidate/learning-hub', icon: <SchoolIcon /> },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  const Sidebar = () => (
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
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: '#e5e7eb' }} />

      {/* Get Help & Logout */}
      <List sx={{ px: 1.5, py: 1 }}>
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton 
            onClick={() => handleNavigation('/candidate/help')} 
            sx={{ 
              borderRadius: '6px', 
              minHeight: 44, 
              justifyContent: 'initial', 
              px: 2, 
              color: '#6b7280', 
              '&:hover': { 
                bgcolor: 'rgba(0,0,0,0.04)', 
                color: '#000000' 
              } 
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: 2, justifyContent: 'center', color: 'inherit' }}>
              <HelpOutlineIcon />
            </ListItemIcon>
            <ListItemText primary="Get Help" sx={{ '& .MuiTypography-root': { fontSize: '0.8125rem', fontWeight: 500 } }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => setLogoutDialogOpen(true)} sx={{ borderRadius: '6px', minHeight: 44, justifyContent: 'initial', px: 2, color: '#6b7280', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.05)', color: '#ef4444' } }}>
            <ListItemIcon sx={{ minWidth: 0, mr: 2, justifyContent: 'center', color: 'inherit' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" sx={{ '& .MuiTypography-root': { fontSize: '0.8125rem', fontWeight: 500 } }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f3f4f6' }}>
      
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: sidebarWidth,
            border: 'none',
          },
        }}
      >
        <Sidebar />
      </Drawer>

      {/* Desktop Static Sidebar */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Sidebar />
      </Box>

      {/* Right Side Content with Top Navbar */}
      <Box
        sx={{
          flexGrow: 1,
          ml: { xs: 0, md: `${sidebarWidth + leftGap}px` },
          minWidth: 0,
          width: { xs: '100%', md: `calc(100% - ${sidebarWidth + leftGap}px)` },
          display: 'flex',
          flexDirection: 'column',
          p: { xs: 1, sm: 2 },
        }}
      >
        {/* Top Navbar */}
        <Box
          sx={{
            height: { xs: 56, sm: 64 },
            bgcolor: 'background.paper',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            px: { xs: 1.5, sm: 3 },
            gap: { xs: 1, sm: 2 },
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            mb: 2,
          }}
        >
          {/* Hamburger Menu Button - Mobile Only */}
          {isMobile && (
            <IconButton
              onClick={handleDrawerToggle}
              size="medium"
              sx={{
                color: '#000000',
                mr: 1,
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.04)',
                },
              }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Search Bar */}
          <TextField
            placeholder="Search classes, assignments..."
            size="small"
            sx={{
              display: { xs: 'none', md: 'block' },
              width: { md: 300, lg: 400 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                bgcolor: '#f3f4f6',
                fontSize: '0.875rem',
                '& fieldset': {
                  borderColor: 'transparent',
                },
                '&:hover fieldset': {
                  borderColor: '#d1d5db',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#000000',
                  borderWidth: '1px',
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 20, color: '#6b7280' }} />
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ flexGrow: 1 }} />

          {/* Right Side - User Menu */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 0.5, sm: 1.5 },
            ml: 'auto'
          }}>
            {/* Notifications */}
            <NotificationBell />

            {/* User Avatar with Name and Arrow */}
            <Box 
              onClick={handleMenuOpen}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: { xs: 0.75, sm: 1.5 },
                cursor: 'pointer',
                p: { xs: 0.5, sm: 0.75 },
                pl: { xs: 0.75, sm: 2 },
                pr: { xs: 0.5, sm: 1.5 },
                minWidth: { xs: 'auto', sm: 180 },
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
                transition: 'all 0.2s'
              }}
            >
              <Avatar
                src={user?.profilePicture?.startsWith('http') ? user.profilePicture : `http://localhost:5000${user?.profilePicture}`}
                sx={{
                  width: { xs: 28, sm: 32 },
                  height: { xs: 28, sm: 32 },
                  bgcolor: '#000000',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                {user?.name?.charAt(0) || 'U'}
              </Avatar>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: 'text.primary',
                  flex: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                {user?.name || 'User'}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  color: 'text.secondary',
                  transition: 'transform 0.2s',
                  transform: Boolean(anchorEl) ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Box>
            </Box>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem disabled>
              <Typography variant="body2" color="textSecondary">
                {user?.email}
              </Typography>
            </MenuItem>
            <MenuItem onClick={handleProfileClick}>
              <PersonIcon fontSize="small" sx={{ mr: 1 }} />
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogoutClick}>
              <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>

        {/* Main Content Area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            bgcolor: 'background.paper',
            borderRadius: 1,
            overflowX: 'hidden',
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={handleLogoutCancel}
        PaperProps={{ sx: { borderRadius: '12px', minWidth: '400px' } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Confirm Logout</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to logout? You will need to login again to access your account.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={handleLogoutCancel} sx={{ color: '#6b7280' }}>Cancel</Button>
          <Button onClick={handleLogoutConfirm} variant="contained" sx={{ bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}>
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CandidateLayout;

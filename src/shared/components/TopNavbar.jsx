// Modern Top Navbar Component
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  IconButton, 
  TextField,
  InputAdornment,
  Badge, 
  Avatar, 
  Menu, 
  MenuItem, 
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import { useAuth } from '../../features/auth/contexts/AuthContext';
import NotificationBell from './NotificationBell';

const TopNavbar = ({ onMenuClick, isMobile = false }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogoutConfirm = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {

    } finally {
      setLogoutDialogOpen(false);
    }
  };

  const handleLogoutClick = () => {
    handleMenuClose();
    setLogoutDialogOpen(true);
  };

  const handleProfileClick = () => {
    handleMenuClose();
    navigate('/admin/profile');
  };

  // Fuzzy string matching helper
  const fuzzyMatch = (str, pattern) => {
    const strLower = str.toLowerCase();
    const patternLower = pattern.toLowerCase();
    
    // Exact match
    if (strLower.includes(patternLower)) return 100;
    
    // Calculate similarity score
    let score = 0;
    let patternIdx = 0;
    
    for (let i = 0; i < strLower.length && patternIdx < patternLower.length; i++) {
      if (strLower[i] === patternLower[patternIdx]) {
        score += 10;
        patternIdx++;
      }
    }
    
    // Bonus for matching all characters
    if (patternIdx === patternLower.length) score += 50;
    
    return score;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // Define search categories with keywords and routes
    const searchCategories = [
      { 
        keywords: ['dashboard', 'home', 'overview', 'main', 'dashbord', 'dasboard'],
        route: '/admin/dashboard',
        withQuery: false
      },
      { 
        keywords: ['class', 'classes', 'course', 'courses', 'clas', 'clases', 'klass'],
        route: '/admin/classes',
        withQuery: true
      },
      { 
        keywords: ['content', 'library', 'quiz', 'quizzes', 'material', 'contnt', 'librry', 'quizes'],
        route: '/admin/content',
        withQuery: true
      },
      { 
        keywords: ['result', 'results', 'score', 'scores', 'grade', 'grades', 'rezult', 'rsults'],
        route: '/admin/results',
        withQuery: true
      },
      { 
        keywords: ['analytics', 'analysis', 'stats', 'statistics', 'report', 'reports', 'analytiks', 'analitcs'],
        route: '/admin/analytics',
        withQuery: false
      },
      { 
        keywords: ['integrity', 'cheat', 'monitor', 'security', 'proctoring', 'integirty', 'cheet'],
        route: '/admin/cheat-activity',
        withQuery: false
      },
      { 
        keywords: ['profile', 'account', 'settings', 'preferences', 'profil', 'acount'],
        route: '/admin/profile',
        withQuery: false
      },
      { 
        keywords: ['student', 'students', 'candidate', 'candidates', 'user', 'users', 'studnt', 'candiate'],
        route: '/admin/classes',
        withQuery: true
      },
      { 
        keywords: ['assignment', 'assignments', 'homework', 'task', 'tasks', 'asignment', 'asignments'],
        route: '/admin/classes',
        withQuery: true
      },
      { 
        keywords: ['submission', 'submissions', 'submitted', 'submisison', 'submited'],
        route: '/admin/results',
        withQuery: true
      }
    ];

    // Find best matching category
    let bestMatch = { score: 0, category: null };
    
    searchCategories.forEach(category => {
      category.keywords.forEach(keyword => {
        const score = fuzzyMatch(keyword, query);
        if (score > bestMatch.score) {
          bestMatch = { score, category };
        }
      });
    });

    // Navigate to best match or default to classes with search
    if (bestMatch.score > 30) {
      const targetRoute = bestMatch.category.withQuery 
        ? `${bestMatch.category.route}?search=${encodeURIComponent(query)}`
        : bestMatch.category.route;
      navigate(targetRoute);
      setSearchQuery(''); // Clear search after navigation
    } else {
      // Default: search in classes
      navigate(`/admin/classes?search=${encodeURIComponent(query)}`);
      setSearchQuery('');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
  };

  const avatarUrl = user?.profilePicture 
    ? (user.profilePicture.startsWith('http') ? user.profilePicture : `http://localhost:5000${user.profilePicture}`)
    : null;

  return (
    <>
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
        }}
      >
        {/* Hamburger Menu Button - Mobile Only */}
        {isMobile && (
          <IconButton
            onClick={onMenuClick}
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

        {/* Search Bar - Left Side */}
        <Box 
          component="form"
          onSubmit={handleSearch}
          sx={{ 
            width: { xs: '100%', sm: 400 }, 
            mr: 'auto',
            display: { xs: 'none', md: 'block' }
          }}
        >
          <TextField
            fullWidth
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                bgcolor: 'action.hover',
                height: 40,
                fontSize: '0.875rem',
                '& fieldset': {
                  borderColor: 'transparent',
                },
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
                '&.Mui-focused': {
                  bgcolor: 'background.paper',
                  '& fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: '2px',
                  },
                },
              },
              '& input::placeholder': {
                opacity: 0.7,
                fontSize: '0.875rem',
              },
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch(e);
              }
            }}
          />
        </Box>

        {/* Right Side Actions - Wrapped together to stay on right */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: { xs: 0.5, sm: 1.5 },
          ml: 'auto'
        }}>
          {/* Notifications */}
          <NotificationBell />
        
          {/* User Avatar with Name */}
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
            src={avatarUrl}
            sx={{
              width: { xs: 28, sm: 32 },
              height: { xs: 28, sm: 32 },
              bgcolor: '#000000',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            {getInitials(user?.name)}
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

        {/* User Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              mt: 1.5,
              minWidth: 200,
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {user?.name || 'User'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {user?.email || 'user@example.com'}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={handleProfileClick}>
            <ListItemIcon>
              <Avatar sx={{ width: 24, height: 24 }} />
            </ListItemIcon>
            <ListItemText primary="My Profile" />
          </MenuItem>
          <MenuItem onClick={() => { navigate('/admin/profile'); handleMenuClose(); }}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogoutClick} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </MenuItem>
        </Menu>
      </Box>

      {/* Logout Confirmation Dialog */}
      <Dialog 
        open={logoutDialogOpen} 
        onClose={() => setLogoutDialogOpen(false)} 
        PaperProps={{ 
          sx: { 
            borderRadius: '12px', 
            minWidth: '400px' 
          } 
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Confirm Logout</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to logout? You will need to login again to access your account.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setLogoutDialogOpen(false)} sx={{ color: '#6b7280' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleLogoutConfirm} 
            variant="contained" 
            sx={{ 
              bgcolor: '#ef4444', 
              '&:hover': { bgcolor: '#dc2626' } 
            }}
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TopNavbar;

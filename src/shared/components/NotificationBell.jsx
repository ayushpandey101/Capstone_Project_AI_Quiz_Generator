import React, { useState, useEffect, useRef } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  ListItemText,
  Avatar,
  ListItemAvatar,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useAuth } from '../../features/auth/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { deduplicateRequest } from '../../utils/requestCache';

const NotificationBell = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const intervalRef = useRef(null);
  const isInitialFetchRef = useRef(true);

  const open = Boolean(anchorEl);

  // Fetch personal notifications with deduplication
  useEffect(() => {
    if (!token) return;

    // Initial fetch
    fetchNotifications();

    // Visibility change handler - only poll when page is visible
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Stop polling when page is hidden
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Resume polling when page becomes visible
        fetchNotifications();
        startPolling();
      }
    };

    const startPolling = () => {
      if (intervalRef.current) return; // Prevent multiple intervals
      // Poll every 30 seconds (reduced from 10s to minimize API calls)
      intervalRef.current = setInterval(fetchNotifications, 30000);
    };

    // Start polling if page is visible
    if (!document.hidden) {
      startPolling();
    }

    // Listen for custom event to refresh notifications
    const handleRefreshNotifications = () => {
      fetchNotifications();
    };

    window.addEventListener('refreshNotifications', handleRefreshNotifications);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener('refreshNotifications', handleRefreshNotifications);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [token, user]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification) => {
    handleClose();
    
    // Immediately remove notifications from this class (optimistic update)
    setNotifications(prev => prev.filter(n => n.classId !== notification.classId));
    setNotificationCount(prev => Math.max(0, prev - notifications.filter(n => n.classId === notification.classId).length));
    
    // Navigate to the specific message in the class
    const route = user?.role === 'admin' 
      ? `/admin/classes/${notification.classId}?tab=messages&messageId=${notification.messageId}`
      : `/candidate/class/${notification.classId}?messageId=${notification.messageId}`;
    
    navigate(route);

    // Mark all messages in this class as read (like WhatsApp/Telegram)
    try {
      await fetch(
        `http://localhost:5000/api/classes/${notification.classId}/messages/read-all`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Trigger immediate refetch to update UI
      setTimeout(() => {
        fetchNotifications();
      }, 500);
    } catch (error) {
      // Error marking class messages as read
    }
  };

  // Extract fetchNotifications so it can be called from handleNotificationClick
  const fetchNotifications = async () => {
    if (!token) return;

    try {
      // Use deduplication with 3 second cache to prevent rapid duplicate calls
      const result = await deduplicateRequest(
        `notifications-${user?.id}`,
        async () => {
          const response = await fetch('http://localhost:5000/api/messages/notifications', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            // Don't throw on rate limit errors, just return empty data
            if (response.status === 429) {
              return { data: { notifications: [], count: 0 } };
            }
            throw new Error(`HTTP ${response.status}`);
          }
          
          return response.json();
        },
        3000 // Cache for 3 seconds
      );
      
      setNotifications(result.data.notifications || []);
      setNotificationCount(result.data.count || 0);
    } catch (error) {
      // Error fetching notifications - silently handled
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // Display "99+" if count exceeds 99
  const displayCount = notificationCount > 99 ? '99+' : notificationCount;

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        size="small"
        sx={{
          bgcolor: 'action.hover',
          '&:hover': {
            bgcolor: 'action.selected',
          },
        }}
      >
        <Badge badgeContent={displayCount} color="error">
          {notificationCount > 0 ? <NotificationsActiveIcon /> : <NotificationsIcon />}
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: { xs: 340, sm: 380 },
            maxHeight: { xs: '80vh', sm: 500 },
            mt: 1.5,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        TransitionProps={{
          timeout: 200,
        }}
      >
        <Box sx={{ 
          px: { xs: 2, sm: 2.5 }, 
          py: 1.75, 
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Notifications
          </Typography>
          {notificationCount > 0 && (
            <Box sx={{ 
              bgcolor: 'error.main', 
              color: 'white',
              px: 1, 
              py: 0.25, 
              borderRadius: 1,
              minWidth: 24,
              textAlign: 'center',
            }}>
              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem', lineHeight: 1.5 }}>
                {displayCount}
              </Typography>
            </Box>
          )}
        </Box>
        
        <Divider />

        {notifications.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            py: { xs: 4, sm: 5 }, 
            px: 3,
          }}>
            <Box sx={{
              width: { xs: 56, sm: 64 },
              height: { xs: 56, sm: 64 },
              borderRadius: '50%',
              bgcolor: 'action.hover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              mb: 2,
            }}>
              <NotificationsIcon sx={{ fontSize: { xs: 28, sm: 32 }, color: 'action.active' }} />
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary' }}>
              No new notifications
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              You're all caught up!
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: { xs: 'calc(80vh - 60px)', sm: 440 }, overflowY: 'auto' }}>
            {notifications.map((notification, index) => (
              <MenuItem
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                  py: { xs: 1.5, sm: 2 },
                  px: { xs: 2, sm: 2.5 },
                  borderBottom: index < notifications.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  alignItems: 'flex-start',
                  transition: 'background-color 0.15s ease',
                  cursor: 'pointer',
                }}
              >
                <ListItemAvatar sx={{ minWidth: { xs: 48, sm: 56 } }}>
                  <Avatar
                    src={
                      notification.sender.profilePicture
                        ? `http://localhost:5000${notification.sender.profilePicture}`
                        : undefined
                    }
                    sx={{ 
                      width: { xs: 36, sm: 40 }, 
                      height: { xs: 36, sm: 40 },
                      bgcolor: '#000000',
                      fontSize: '0.875rem',
                    }}
                  >
                    {notification.sender.name.charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: { xs: '0.8125rem', sm: '0.875rem' } }} noWrap>
                      {notification.sender.name}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: 'text.disabled',
                      fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                      flexShrink: 0,
                    }}>
                      {getTimeAgo(notification.createdAt)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ 
                    color: 'text.secondary', 
                    fontWeight: 500,
                    fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                  }}>
                    {notification.isEveryone ? 'Mentioned @everyone' : 'Mentioned you'} · {notification.className}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.primary',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                      lineHeight: 1.4,
                      mt: 0.5,
                    }}
                  >
                    {notification.content}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Box>
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;

import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Card,
  CardContent,
  IconButton,
  Chip,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Collapse,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ClickAwayListener,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import ReplyIcon from '@mui/icons-material/Reply';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { deduplicateRequest } from '../../../utils/requestCache';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useAuth } from '../../auth/contexts/AuthContext';

// Helper function to render message content with highlighted mentions and clickable links
const renderMessageContent = (content) => {
  const mentionRegex = /@(\w+)/g;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  // Combine both patterns
  const combinedRegex = /(@\w+)|(https?:\/\/[^\s]+)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(content)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {content.substring(lastIndex, match.index)}
        </span>
      );
    }

    if (match[1]) {
      // It's a mention
      parts.push(
        <span
          key={`mention-${match.index}`}
          style={{
            color: '#1976d2',
            fontWeight: 'bold',
          }}
        >
          {match[1]}
        </span>
      );
    } else if (match[2]) {
      // It's a URL
      parts.push(
        <a
          key={`link-${match.index}`}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#0288d1',
            fontWeight: '500',
            textDecoration: 'underline',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {match[2]}
        </a>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(
      <span key={`text-${lastIndex}`}>
        {content.substring(lastIndex)}
      </span>
    );
  }

  return parts.length > 0 ? parts : content;
};

// Memoize individual message component to prevent unnecessary re-renders
const MessageCard = memo(({ 
  message, 
  isReply, 
  canDelete, 
  isExpanded, 
  onToggleExpand, 
  onReply, 
  onDelete,
  isHighlighted = false,
  messageRef = null
}) => {
  const hasReplies = message.replies && message.replies.length > 0;

  return (
    <Card
      ref={messageRef}
      sx={{
        mb: { xs: 1.5, sm: 2 },
        ml: isReply ? { xs: 2, sm: 3, md: 4 } : 0,
        bgcolor: isHighlighted ? 'rgba(25, 118, 210, 0.08)' : 'background.paper',
        border: isHighlighted ? '2px solid' : (message.isImportant ? '2px solid' : '1px solid'),
        borderColor: isHighlighted ? 'primary.main' : (message.isImportant ? 'error.main' : 'divider'),
        transition: 'all 0.3s ease',
        boxShadow: isHighlighted ? 4 : 1,
        bgcolor: isReply ? 'action.hover' : 'background.paper',
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'start', gap: { xs: 1, sm: 1.5 }, flex: 1, minWidth: 0 }}>
            <Avatar 
              src={message.senderId?.profilePicture ? 
                (message.senderId.profilePicture.startsWith('http') ? 
                  message.senderId.profilePicture : 
                  `http://localhost:5000${message.senderId.profilePicture}`) 
                : undefined}
              sx={{ 
                bgcolor: message.senderType === 'admin' ? 'primary.main' : 'secondary.main',
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 },
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}
            >
              {message.senderId?.name?.charAt(0) || '?'}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  {message.senderId?.name || 'Unknown'}
                </Typography>
                {message.senderType === 'admin' && (
                  <Chip 
                    label="Teacher" 
                    size="small" 
                    color="primary" 
                    sx={{ height: { xs: 18, sm: 20 }, fontSize: { xs: '0.6rem', sm: '0.75rem' } }} 
                  />
                )}
                {message.isImportant && (
                  <Chip
                    icon={<AnnouncementIcon sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }} />}
                    label="Important"
                    size="small"
                    color="error"
                    sx={{ height: { xs: 18, sm: 20 }, fontSize: { xs: '0.6rem', sm: '0.75rem' } }}
                  />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                {new Date(message.createdAt).toLocaleString()}
              </Typography>
              
              <Typography 
                variant="body1" 
                sx={{ 
                  mt: 1, 
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                {renderMessageContent(message.content)}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
            {!isReply && (
              <IconButton 
                size="small" 
                onClick={() => onReply(message)} 
                title="Reply"
                sx={{ 
                  width: { xs: 32, sm: 36 },
                  height: { xs: 32, sm: 36 }
                }}
              >
                <ReplyIcon fontSize="small" />
              </IconButton>
            )}
            {canDelete && (
              <IconButton
                size="small"
                color="error"
                onClick={() => onDelete(message._id)}
                title="Delete"
                sx={{ 
                  width: { xs: 32, sm: 36 },
                  height: { xs: 32, sm: 36 }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>

        {hasReplies && (
          <Button
            size="small"
            onClick={() => onToggleExpand(message._id)}
            startIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ 
              mt: 1,
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            {message.replies.length} {message.replies.length === 1 ? 'Reply' : 'Replies'}
          </Button>
        )}
      </CardContent>

      {hasReplies && (
        <Collapse in={isExpanded}>
          <Box sx={{ p: 2, pt: 0 }}>
            {message.replies.map((reply) => (
              <MessageCard
                key={reply._id}
                message={reply}
                isReply={true}
                canDelete={canDelete}
                isExpanded={false}
                onToggleExpand={onToggleExpand}
                onReply={onReply}
                onDelete={onDelete}
              />
            ))}
          </Box>
        </Collapse>
      )}
    </Card>
  );
});

MessageCard.displayName = 'MessageCard';

const MessagesTab = ({ classId, highlightMessageId }) => {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [expandedMessages, setExpandedMessages] = useState(new Set());
  const [lastFetchTime, setLastFetchTime] = useState(Date.now());
  const highlightedMessageRef = useRef(null);
  const messageBoxRef = useRef(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  
  // Mention autocomplete states
  const [classMembers, setClassMembers] = useState([]);
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textFieldRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);

  const isAdmin = user?.role === 'admin';

  // Fetch class settings
  useEffect(() => {
    const fetchClassSettings = async () => {
      if (!token || !classId) return;
      
      try {
        const response = await fetch(`http://localhost:5000/api/classes/${classId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          setClassSettings({
            messagingEnabled: result.data.messagingEnabled !== false,
            allowStudentMessages: result.data.allowStudentMessages !== false
          });
        }
      } catch (error) {
        // Error fetching class settings
      }
    };

    fetchClassSettings();
  }, [classId, token]);

  // Fetch class members for mentions
  useEffect(() => {
    const fetchMembers = async () => {
      if (!token || !classId) return;
      
      try {
        const response = await fetch(`http://localhost:5000/api/classes/${classId}/members`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          setClassMembers([
            { name: 'everyone', mentionTag: 'everyone', type: 'everyone' },
            ...result.data
          ]);
        }
      } catch (error) {

      }
    };

    fetchMembers();
  }, [classId, token]);

  const fetchMessages = useCallback(async (skipLoading = false) => {
    if (!skipLoading) setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:5000/api/classes/${classId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const result = await response.json();
      const newData = result.data || [];
      
      // Only update if data has changed
      setMessages(prev => {
        const prevIds = prev.map(m => m._id).sort().join(',');
        const newIds = newData.map(m => m._id).sort().join(',');
        return prevIds === newIds ? prev : newData;
      });
      
      setLastFetchTime(Date.now());
    } catch (error) {
      if (!skipLoading) setError(error.message);
    } finally {
      if (!skipLoading) setIsLoading(false);
    }
  }, [classId, token]);

  useEffect(() => {
    if (token && classId) {
      fetchMessages();
      
      let interval;
      
      // Visibility change handler - only poll when page is visible
      const handleVisibilityChange = () => {
        if (document.hidden) {
          // Stop polling when page is hidden
          if (interval) clearInterval(interval);
        } else {
          // Resume polling when page becomes visible
          fetchMessages(true);
          if (interval) clearInterval(interval);
          // Poll for new messages every 30 seconds (reduced from 15s)
          interval = setInterval(() => fetchMessages(true), 30000);
        }
      };
      
      // Start polling if page is visible
      if (!document.hidden) {
        interval = setInterval(() => fetchMessages(true), 30000);
      }
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        if (interval) clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [classId, token, fetchMessages]);

  // Scroll to highlighted message when component loads or highlightMessageId changes
  useEffect(() => {
    if (highlightMessageId && messages.length > 0 && highlightedMessageRef.current) {
      setTimeout(() => {
        highlightedMessageRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 500);
    }
  }, [highlightMessageId, messages]);

  // Clear notifications when messages tab is opened or becomes visible
  useEffect(() => {
    const markAllAsRead = async () => {
      if (!token || !classId || !user?.id) return;
      
      try {
        await fetch(
          `http://localhost:5000/api/classes/${classId}/messages/read-all`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        // Trigger immediate notification refresh
        window.dispatchEvent(new Event('refreshNotifications'));
      } catch (error) {
        // Error marking messages as read
      }
    };

    // Mark all messages as read when this component is mounted/visible
    markAllAsRead();

    // Also mark as read when the page becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        markAllAsRead();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [classId, token, user?.id]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim()) return;

    const parentMessageId = replyTo?._id;
    const messageContent = newMessage;
    const messageIsImportant = isImportant && !replyTo;

    try {
      const response = await fetch(`http://localhost:5000/api/classes/${classId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: messageContent,
          messageType: replyTo ? 'reply' : (isAdmin ? 'announcement' : 'question'),
          isImportant: messageIsImportant,
          parentMessageId: parentMessageId || null,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();
      const newMsg = result.data;

      // Optimistically update UI
      if (parentMessageId) {
        // It's a reply - add to parent message's replies array
        setMessages(prevMessages => {
          return prevMessages.map(msg => {
            if (msg._id === parentMessageId) {
              return {
                ...msg,
                replies: [...(msg.replies || []), newMsg]
              };
            }
            return msg;
          });
        });
        // Expand the parent message to show the new reply
        setExpandedMessages(prev => {
          const newExpanded = new Set(prev);
          newExpanded.add(parentMessageId);
          return newExpanded;
        });
      } else {
        // It's a new top-level message - add to beginning
        setMessages(prevMessages => [newMsg, ...prevMessages]);
      }

      setNewMessage('');
      setIsImportant(false);
      setReplyTo(null);
      setShowMentionList(false);
    } catch (error) {
      setError(error.message);
    }
  }, [newMessage, classId, token, isImportant, replyTo, isAdmin]);

  // Handle mention input
  const handleMessageChange = (e) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    
    setNewMessage(value);
    setCursorPosition(position);
    setAnchorEl(e.target);

    // Check if we're typing a mention
    const textBeforeCursor = value.substring(0, position);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1 && lastAtSymbol === position - 1) {
      // Just typed @, show all members
      setMentionFilter('');
      setShowMentionList(true);
    } else if (lastAtSymbol !== -1 && position > lastAtSymbol) {
      // Check if there's a space after @
      const textAfterAt = textBeforeCursor.substring(lastAtSymbol + 1);
      if (!textAfterAt.includes(' ')) {
        // Still typing the mention
        setMentionFilter(textAfterAt);
        setShowMentionList(true);
      } else {
        setShowMentionList(false);
      }
    } else {
      setShowMentionList(false);
    }
  };

  // Handle mention selection
  const handleMentionSelect = (member) => {
    const textBeforeCursor = newMessage.substring(0, cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1) {
      const textAfter = newMessage.substring(cursorPosition);
      const mentionTag = `@${member.mentionTag} `;
      const newText = textBeforeCursor.substring(0, lastAtSymbol) + mentionTag + textAfter;
      
      setNewMessage(newText);
      setShowMentionList(false);
      
      // Focus back on text field
      setTimeout(() => {
        if (textFieldRef.current) {
          const input = textFieldRef.current.querySelector('textarea');
          if (input) {
            input.focus();
            const newPos = lastAtSymbol + mentionTag.length;
            input.setSelectionRange(newPos, newPos);
          }
        }
      }, 0);
    }
  };

  // Filter members based on mention input
  const filteredMembers = useMemo(() => {
    if (!mentionFilter) return classMembers;
    const filter = mentionFilter.toLowerCase();
    return classMembers.filter(member => 
      member.name.toLowerCase().includes(filter) ||
      member.mentionTag.toLowerCase().includes(filter)
    );
  }, [classMembers, mentionFilter]);

  const handleDeleteMessage = useCallback((messageId) => {
    setMessageToDelete(messageId);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!messageToDelete) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/classes/${classId}/messages/${messageToDelete}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      fetchMessages();
    } catch (error) {
      setError(error.message);
    } finally {
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
    }
  }, [messageToDelete, classId, token, fetchMessages]);

  const cancelDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setMessageToDelete(null);
  }, []);

  const toggleExpand = useCallback((messageId) => {
    setExpandedMessages(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(messageId)) {
        newExpanded.delete(messageId);
      } else {
        newExpanded.add(messageId);
      }
      return newExpanded;
    });
  }, []);

  const handleReply = useCallback((message) => {
    setReplyTo(message);
    // Scroll to message box
    setTimeout(() => {
      messageBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, []);

  const handleKeyDown = (e) => {
    // Desktop: Enter = send, Shift+Enter = new line
    if (e.key === 'Enter' && !e.shiftKey && window.innerWidth >= 768) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const memoizedMessages = useMemo(() => {
    return messages.map((message) => (
      <MessageCard
        key={message._id}
        message={message}
        isReply={false}
        canDelete={isAdmin || (message.senderId?._id === user?.id)}
        isExpanded={expandedMessages.has(message._id)}
        onToggleExpand={toggleExpand}
        onReply={handleReply}
        onDelete={handleDeleteMessage}
        isHighlighted={message._id === highlightMessageId}
        messageRef={message._id === highlightMessageId ? highlightedMessageRef : null}
      />
    ));
  }, [messages, isAdmin, user?.id, expandedMessages, toggleExpand, handleReply, handleDeleteMessage, highlightMessageId]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Post Message Section */}
      <Paper ref={messageBoxRef} sx={{ p: { xs: 1.5, sm: 2 }, mb: 3 }}>
          <Typography 
            variant="h6" 
            gutterBottom 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
          >
            {isAdmin ? <AnnouncementIcon /> : <QuestionAnswerIcon />}
            {replyTo ? `Reply to ${replyTo.senderId?.name}` : isAdmin ? 'Post Announcement' : 'Ask a Question'}
          </Typography>

          {replyTo && (
            <Box sx={{ 
              p: { xs: 1, sm: 1.5 }, 
              bgcolor: 'primary.light', 
              borderLeft: 4,
              borderColor: 'primary.main',
              borderRadius: 1, 
              mb: 2 
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">
                    Replying to {replyTo.senderId?.name}:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                    {replyTo.content.substring(0, 100)}
                    {replyTo.content.length > 100 ? '...' : ''}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={() => setReplyTo(null)} title="Cancel Reply">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          )}

        <Box sx={{ position: 'relative' }}>
          <TextField
            ref={textFieldRef}
            fullWidth
            multiline
            minRows={2}
            maxRows={6}
            placeholder={`${isAdmin ? 'Type your announcement' : 'Ask your question'}... (Type @ to mention${window.innerWidth >= 768 ? ', Enter to send, Shift+Enter for new line' : ''})`}
            value={newMessage}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            sx={{ mb: 2 }}
          />

          {/* Mention Autocomplete Dropdown */}
          {showMentionList && filteredMembers.length > 0 && (
            <ClickAwayListener onClickAway={() => setShowMentionList(false)}>
              <Paper
                sx={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 0,
                  right: 0,
                  mb: 1,
                  maxHeight: 200,
                  overflow: 'auto',
                  zIndex: 1000,
                  boxShadow: 3,
                }}
              >
                <List dense>
                  {filteredMembers.map((member, index) => (
                    <ListItem
                      key={member._id || member.mentionTag}
                      button
                      onClick={() => handleMentionSelect(member)}
                      sx={{
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={member.type !== 'everyone' && member.profilePicture ? 
                            (member.profilePicture.startsWith('http') ? 
                              member.profilePicture : 
                              `http://localhost:5000${member.profilePicture}`) 
                            : undefined}
                          sx={{ 
                            bgcolor: member.type === 'admin' ? 'primary.main' : 
                                     member.type === 'everyone' ? 'success.main' : 'secondary.main',
                            width: 32,
                            height: 32,
                          }}
                        >
                          {member.name.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={member.name}
                        secondary={`@${member.mentionTag}${member.type === 'admin' ? ' (Teacher)' : ''}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </ClickAwayListener>
          )}
        </Box>

        {isAdmin && !replyTo && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <Checkbox
              checked={isImportant}
              onChange={(e) => setIsImportant(e.target.checked)}
              size="small"
            />
            <Typography variant="body2" color="text.secondary">
              Mark as important
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mt: 1 }}>
          <Button
            variant="contained"
            endIcon={<SendIcon />}
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
          >
            {replyTo ? 'Send Reply' : 'Post'}
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
            Press Enter to send • Shift+Enter for new line
          </Typography>
        </Box>
      </Paper>

      {/* Messages Section Header */}
      <Divider sx={{ mb: 3 }}>
        <Chip 
          label={`${messages.length} ${messages.length === 1 ? 'Message' : 'Messages'}`}
          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
        />
      </Divider>

      {/* Messages List */}
      {messages.length === 0 ? (
        <Paper sx={{ p: { xs: 2, sm: 3, md: 4 }, textAlign: 'center' }}>
          <Typography color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            No messages yet. {isAdmin ? 'Post an announcement to get started!' : 'Ask a question to get help!'}
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: { xs: 1.5, sm: 2 }
        }}>
          {memoizedMessages}
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDelete}
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxWidth: 400,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Delete Message
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete this message? This action will also remove all replies to this message and cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={cancelDelete} 
            variant="outlined"
            sx={{ 
              textTransform: 'none',
              borderColor: 'divider',
              color: 'text.primary',
              '&:hover': {
                borderColor: 'text.primary',
                bgcolor: 'action.hover',
              },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDelete} 
            variant="contained"
            color="error"
            sx={{ 
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none',
              },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default memo(MessagesTab);

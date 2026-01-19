import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, Tabs, Tab, Paper, List, ListItem, ListItemText, Button, Chip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PeopleIcon from '@mui/icons-material/People';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../../auth/contexts/AuthContext';
import Loader from '../../../components/Loader';
import MessagesTab from '../../admin/components/MessagesTab';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`candidate-class-tabpanel-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
};

const CandidateClassDetailsPage = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token, user } = useAuth();
  
  // Get messageId from URL if present (for notification navigation)
  const messageId = searchParams.get('messageId');
  
  // Initialize tab based on messageId
  const [currentTab, setCurrentTab] = useState(messageId ? 1 : 0);
  const [classData, setClassData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);

  // Reset state when classId changes
  useEffect(() => {
    setClassData(null);
    setAssignments([]);
    setIsLoading(true);
    // Reset tab unless messageId is present
    if (!messageId) {
      setCurrentTab(0);
    }
  }, [classId, messageId]);
  
  // If messageId is present in URL, switch to Messages tab
  useEffect(() => {
    if (messageId) {
      setCurrentTab(1); // Messages tab index
    }
  }, [messageId]);

  // Clear notifications when switching to Messages tab
  useEffect(() => {
    const clearNotifications = async () => {
      if (currentTab === 1 && token && classId) {
        // Small delay to ensure MessagesTab is fully rendered
        setTimeout(async () => {
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
            // Error clearing notifications
          }
        }, 300);
      }
    };

    clearNotifications();
  }, [currentTab, classId, token]);

  useEffect(() => {
    const fetchClassDetails = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/api/classes/${classId}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch class details');
        }
        
        const result = await response.json();
        setClassData(result.data);
      } catch (error) {
        // Error fetching class details
      } finally {
        setIsLoading(false);
      }
    };

    const fetchAssignments = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/candidate/assignments/${classId}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch assignments');
        }
        
        const result = await response.json();
        setAssignments(result.data || []);
      } catch (error) {
        // Error fetching assignments
      }
    };

    if (token && classId) {
      fetchClassDetails();
      fetchAssignments();
    }
  }, [classId, token]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 4 }}>
        <Loader />
      </Box>
    );
  }

  if (!classData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          Class not found or you are not enrolled in this class.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', p: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          {classData.title}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          Course Code: {classData.courseCode}
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: { xs: 1, sm: 0 } }}>
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)} variant="scrollable" scrollButtons="auto">
          <Tab label="Assignments" />
          {classData.messagingEnabled !== false && <Tab label="Messages" />}
        </Tabs>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, mr: { xs: 0, sm: 2 }, mb: 1 }}>
          {classData.showRosterToCandidates && (
            <Button
              variant="outlined"
              startIcon={<PeopleIcon />}
              onClick={() => navigate(`/candidate/class/${classId}/roster`)}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              View Roster
            </Button>
          )}
          {classData.showLeaderboardToCandidates && (
            <Button
              variant="contained"
              startIcon={<LeaderboardIcon />}
              onClick={() => navigate(`/candidate/class/${classId}/leaderboard`)}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Leaderboard
            </Button>
          )}
        </Box>
      </Box>

      <TabPanel value={currentTab} index={0}>
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {assignments.length === 0 ? (
            <Paper sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
              <Typography color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                No assignments available yet.
              </Typography>
            </Paper>
          ) : (
            <List sx={{ p: 0 }}>
              {assignments.map((assignment) => {
                const userSubmission = assignment.submissions?.find(
                  (sub) => sub.candidateId === user?.id
                );
                const isCompleted = !!userSubmission;

                return (
                  <ListItem
                    key={assignment._id}
                    sx={{
                      mb: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'stretch', sm: 'center' },
                      gap: { xs: 2, sm: 0 },
                      p: { xs: 2, sm: 2 },
                      '&:hover': {
                        boxShadow: 2,
                        borderColor: 'primary.main',
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>{assignment.quizId?.title || 'Untitled Quiz'}</Typography>
                          {isCompleted && (
                            <Chip
                              icon={<CheckCircleIcon />}
                              label="Completed"
                              color="success"
                              size="small"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                            Assigned: {new Date(assignment.assignedDate).toLocaleDateString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                            Due: {new Date(assignment.dueDate).toLocaleDateString()}
                          </Typography>
                          {isCompleted && userSubmission && (
                            <Typography variant="body2" color="success.main" sx={{ mt: 1, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                              Score: {userSubmission.score}/{userSubmission.totalQuestions} ({Math.round((userSubmission.score / userSubmission.totalQuestions) * 100)}%)
                            </Typography>
                          )}
                        </>
                      }
                    />
                    <Button
                      variant={isCompleted ? 'outlined' : 'contained'}
                      startIcon={isCompleted ? <CheckCircleIcon /> : <PlayArrowIcon />}
                      onClick={() => navigate(`/candidate/assignment/${assignment._id}`)}
                      disabled={isCompleted}
                      sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 120 } }}
                    >
                      {isCompleted ? 'Completed' : 'Start Quiz'}
                    </Button>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        {classData.messagingEnabled !== false ? (
          <MessagesTab classId={classId} highlightMessageId={messageId} />
        ) : (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" color="text.secondary">
              Messaging has been disabled for this class.
            </Typography>
          </Box>
        )}
      </TabPanel>
    </Box>
  );
};

export default CandidateClassDetailsPage;

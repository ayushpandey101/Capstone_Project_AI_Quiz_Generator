import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Box, Typography, Tabs, Tab, CircularProgress } from '@mui/material';
import Roster from '../components/Roster';
import AssignmentsTab from '../components/AssignmentsTab';
import QuizTab from '../components/QuizTab';
import ResultsTab from '../components/ResultsTab';
import ClassAnalytics from '../components/ClassAnalytics';
import ClassSettingsTab from '../components/ClassSettingsTab';
import IntegrityMonitorTab from '../components/IntegrityMonitorTab';
import MessagesTab from '../components/MessagesTab';
import { useAuth } from '../../auth/contexts/AuthContext';
import Loader from '../../../components/Loader';

// Define our tabs
const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`class-tabpanel-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const ClassDetails = () => {
  const { classId } = useParams();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();
  
  // Get messageId from URL if present (for notification navigation)
  const messageId = searchParams.get('messageId');
  
  // Get the tab from URL parameters (e.g., ?tab=results)
  const getInitialTab = () => {
    const tabParam = searchParams.get('tab');
    const tabMap = {
      'roster': 0,
      'assignments': 1,
      'quizzes': 2,
      'results': 3,
      'analytics': 4,
      'integrity': 5,
      'messages': 6,
      'settings': 7
    };
    return tabMap[tabParam] || 0; // Default to Roster (0) if no valid tab param
  };

  const [currentTab, setCurrentTab] = useState(getInitialTab());
  
  // State for loading and class data
  const [classData, setClassData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Fetch class details function
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
      } finally {
      setIsLoading(false);
    }
  };

  // Fetch class details on component mount
  useEffect(() => {
    if (token && classId) {
      fetchClassDetails();
    }
  }, [classId, token]);

  // Clear notifications when switching to Messages tab (tab index 6)
  useEffect(() => {
    const clearNotifications = async () => {
      if (currentTab === 6 && token && classId) {
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

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 4 }}>
        <Loader />
      </Box>
    );
  }

  // Error state - data failed to load
  if (!classData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          Error: Class not found or you are not authorized to view this class.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* 1. Class Header - Using real data */}
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography 
          variant="h4"
          sx={{ 
            fontSize: { xs: '1.5rem', sm: '2rem' },
            fontWeight: 'bold',
            mb: 0.5
          }}
        >
          {classData.title}
        </Typography>
        <Typography 
          variant="subtitle1" 
          color="text.secondary" 
          gutterBottom
          sx={{
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}
        >
          Course Code: {classData.courseCode}
        </Typography>
      </Box>

      {/* 2. Navigation Tabs */}
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        overflowX: 'auto',
        '&::-webkit-scrollbar': {
          height: 4,
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: 2,
        },
      }}>
        <Tabs 
          value={currentTab} 
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            minHeight: { xs: 40, sm: 48 },
            '& .MuiTab-root': {
              minHeight: { xs: 40, sm: 48 },
              fontSize: { xs: '0.813rem', sm: '0.875rem' },
              minWidth: { xs: 80, sm: 100 },
              px: { xs: 1.5, sm: 2 },
            },
          }}
        >
          <Tab label="Roster" />
          <Tab label="Assignments" />
          <Tab label="Quizzes" />
          <Tab label="Results" />
          <Tab label="Analytics" />
          <Tab label="Integrity Monitor" />
          <Tab label="Messages" />
          <Tab label="Settings" />
        </Tabs>
      </Box>

      {/* 3. Tab Content - Passing real data as props */}
      <TabPanel value={currentTab} index={0}>
        <Roster 
          students={classData.students} 
          inviteCode={classData.inviteCode}
          classId={classData._id}
          onStudentRemoved={fetchClassDetails}
        />
      </TabPanel>
      <TabPanel value={currentTab} index={1}>
        <AssignmentsTab classId={classId} />
      </TabPanel>
      <TabPanel value={currentTab} index={2}>
        <QuizTab classId={classId} />
      </TabPanel>
      <TabPanel value={currentTab} index={3}>
        <ResultsTab 
          key={`results-${currentTab === 3 ? Date.now() : 'cached'}`}
          classId={classId} 
          className={classData?.title} 
          courseCode={classData?.courseCode} 
        />
      </TabPanel>
      <TabPanel value={currentTab} index={4}>
        <ClassAnalytics classId={classId} token={token} />
      </TabPanel>
      <TabPanel value={currentTab} index={5}>
        <IntegrityMonitorTab classId={classId} />
      </TabPanel>
      <TabPanel value={currentTab} index={6}>
        <MessagesTab classId={classId} highlightMessageId={messageId} />
      </TabPanel>
      <TabPanel value={currentTab} index={7}>
        <ClassSettingsTab classData={classData} onClassUpdated={fetchClassDetails} />
      </TabPanel>
    </Box>
  );
};

export default ClassDetails;


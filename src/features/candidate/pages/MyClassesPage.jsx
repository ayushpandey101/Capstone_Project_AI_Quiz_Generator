import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/contexts/AuthContext';
import { 
  Box, Typography, Grid, Card, CardContent, Button, Chip, CircularProgress, Alert 
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import Loader from '../../../components/Loader';

/**
 * My Classes Page for Candidates
 * Shows all classes the candidate has joined
 */
function MyClassesPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch classes where the candidate is enrolled
  useEffect(() => {
    const fetchMyClasses = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:5000/api/candidate/my-classes', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch classes');
        }

        setClasses(data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (token && user) {
      fetchMyClasses();
    }
  }, [token, user]);

  return (
    <Box sx={{ width: '100%' }}>
      {/* Page Header */}
      <Box sx={{ mb: { xs: 3, sm: 4 } }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 'bold', 
            mb: 0.5,
            fontSize: { xs: '1.5rem', sm: '2rem' }
          }}
        >
          My Classes
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
        >
          Your enrolled classes
        </Typography>
      </Box>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <Loader />
        </Box>
      ) : classes.length === 0 ? (
        // Empty State
        <Card 
          sx={{ 
            p: { xs: 8, sm: 12 }, 
            textAlign: 'center',
            bgcolor: 'background.paper',
            border: '2px dashed',
            borderColor: 'divider',
          }}
        >
          <SchoolIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" gutterBottom color="text.secondary">
            No classes yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Join your first class to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddCircleIcon />}
            onClick={() => navigate('/candidate/join-class')}
            sx={{ 
              bgcolor: '#000000',
              '&:hover': { bgcolor: '#1f2937' }
            }}
          >
            Join Class
          </Button>
        </Card>
      ) : (
        // Classes Grid
        <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
          {classes.map((classItem) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={classItem._id}>
              <Card 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  height: '100%',
                  borderRadius: 2,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '1px solid',
                  borderColor: 'divider',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 8,
                    borderColor: 'primary.main',
                  },
                }}
                onClick={() => navigate(`/candidate/class/${classItem._id}`)}
              >
                <CardContent sx={{ flexGrow: 1, p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box sx={{ 
                      p: 1, 
                      bgcolor: '#f3f4f6', 
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <SchoolIcon sx={{ fontSize: 20, color: '#374151' }} />
                    </Box>
                    <Chip 
                      label="Enrolled"
                      size="small"
                      sx={{ 
                        bgcolor: '#dcfce7',
                        color: '#166534',
                        fontWeight: 600,
                        height: 20,
                        fontSize: '0.7rem',
                      }}
                    />
                  </Box>

                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      fontSize: { xs: '0.95rem', sm: '1rem' }
                    }}
                  >
                    {classItem.title}
                  </Typography>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      minHeight: 36,
                      fontSize: '0.8125rem'
                    }}
                  >
                    {classItem.description || 'No description'}
                  </Typography>

                  <Box sx={{ mb: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Chip
                      label={classItem.courseCode}
                      size="small"
                      sx={{ 
                        bgcolor: '#f3f4f6',
                        color: '#374151',
                        fontWeight: 600,
                        fontFamily: 'monospace',
                        height: 24,
                        fontSize: '0.7rem',
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PeopleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {classItem.students?.length || 0} students
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarTodayIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {new Date(classItem.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Typography>
                    </Box>
                  </Box>

                  <Button 
                    fullWidth
                    variant="contained"
                    endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/candidate/class/${classItem._id}`);
                    }}
                    sx={{ 
                      bgcolor: '#000000',
                      '&:hover': { bgcolor: '#1f2937' },
                      fontWeight: 600,
                      py: 1,
                      fontSize: '0.8125rem'
                    }}
                  >
                    View Assignments
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

export default MyClassesPage;

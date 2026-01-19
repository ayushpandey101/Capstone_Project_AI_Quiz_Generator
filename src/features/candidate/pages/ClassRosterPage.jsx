import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/contexts/AuthContext';
import { 
  Box, Typography, Button, Paper, Grid, Avatar,
  List, ListItem, ListItemAvatar, ListItemText
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PeopleIcon from '@mui/icons-material/People';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import PersonIcon from '@mui/icons-material/Person';
import Loader from '../../../components/Loader';

/**
 * Class Roster Page for Candidates
 * Shows all students enrolled in the class (if enabled by admin)
 */
function ClassRosterPage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [classData, setClassData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClassRoster = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:5000/api/candidate/class/${classId}/roster`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch class roster');
        }

        setClassData(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (token && classId) {
      fetchClassRoster();
    }
  }, [token, classId]);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
        {/* Back Button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/candidate/class/${classId}`)}
          sx={{
            color: '#000000',
            mb: { xs: 3, sm: 4 },
            '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
          }}
        >
          Back to Assignments
        </Button>

        {/* Loading State */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
            <Loader />
          </Box>
        ) : error ? (
          // Error State
          <Paper 
            elevation={0}
            sx={{ 
              p: 8, 
              textAlign: 'center',
              border: '2px solid',
              borderColor: '#fecaca',
              borderRadius: 2
            }}
          >
            <ErrorOutlineIcon sx={{ fontSize: 64, color: '#f87171', mb: 2 }} />
            <Typography variant="h5" fontWeight="600" gutterBottom sx={{ color: '#1f2937' }}>
              Unable to View Roster
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {error}
            </Typography>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(`/candidate/class/${classId}/assignments`)}
              variant="contained"
              sx={{
                bgcolor: '#000000',
                '&:hover': { bgcolor: '#1f2937' }
              }}
            >
              Back to Assignments
            </Button>
          </Paper>
        ) : (
          <>
            {/* Page Header */}
            <Box sx={{ mb: { xs: 3, sm: 4 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box 
                  sx={{ 
                    p: 1.5, 
                    background: 'linear-gradient(135deg, #000000 0%, #374151 100%)',
                    borderRadius: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <PeopleIcon sx={{ fontSize: 24, color: '#ffffff' }} />
                </Box>
                <Typography variant="h4" fontWeight="600" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                  Class Roster
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ ml: { xs: 0, sm: 7 }, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                {classData?.students?.length || 0} student{classData?.students?.length !== 1 ? 's' : ''} enrolled in {classData?.title}
              </Typography>
            </Box>

            {/* Class Info Card */}
            <Paper 
              elevation={0}
              sx={{ 
                p: { xs: 3, sm: 4 }, 
                mb: 3, 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2
              }}
            >
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Course Code
                  </Typography>
                  <Typography variant="body2" fontWeight="600" sx={{ fontFamily: 'monospace' }}>
                    {classData?.courseCode}
                  </Typography>
                </Grid>
                {classData?.semester && (
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Semester
                    </Typography>
                    <Typography variant="body2" fontWeight="600">
                      {classData.semester}
                    </Typography>
                  </Grid>
                )}
                {classData?.academicYear && (
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Academic Year
                    </Typography>
                    <Typography variant="body2" fontWeight="600">
                      {classData.academicYear}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>

            {/* Students List */}
            <Paper 
              elevation={0}
              sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'hidden'
              }}
            >
              <Box 
                sx={{ 
                  px: 3, 
                  py: 2, 
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: '#f3f4f6'
                }}
              >
                <Typography variant="h6" fontWeight="600" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  Enrolled Students
                </Typography>
              </Box>
              
              {classData?.students?.length === 0 ? (
                <Box sx={{ p: 12, textAlign: 'center' }}>
                  <PeopleIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 3 }} />
                  <Typography variant="body2" color="text.secondary">
                    No students enrolled yet
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {[...(classData?.students || [])]
                    .sort((a, b) => {
                      const regA = a.registrationNumber || '';
                      const regB = b.registrationNumber || '';
                      
                      if (!regA && !regB) {
                        return (a.name || '').localeCompare(b.name || '');
                      }
                      if (!regA) return 1;
                      if (!regB) return -1;
                      
                      const matchA = regA.match(/^(\d*)([A-Za-z]+)(\d*)$/);
                      const matchB = regB.match(/^(\d*)([A-Za-z]+)(\d*)$/);
                      
                      if (matchA && matchB) {
                        const [, yearA, branchA, numA] = matchA;
                        const [, yearB, branchB, numB] = matchB;
                        
                        const yearCompare = parseInt(yearA || '0') - parseInt(yearB || '0');
                        if (yearCompare !== 0) return yearCompare;
                        
                        const branchCompare = branchA.localeCompare(branchB);
                        if (branchCompare !== 0) return branchCompare;
                        
                        return parseInt(numA || '0') - parseInt(numB || '0');
                      }
                      
                      return regA.localeCompare(regB);
                    })
                    .map((student, index) => (
                    <ListItem 
                      key={student._id || index}
                      divider
                      sx={{
                        py: 2,
                        px: 3,
                        '&:hover': {
                          bgcolor: 'rgba(0,0,0,0.02)'
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar 
                          sx={{ 
                            width: 44, 
                            height: 44,
                            bgcolor: '#000000',
                            fontSize: '1rem',
                            fontWeight: 600
                          }}
                        >
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body1" fontWeight="600" sx={{ fontSize: { xs: '0.9375rem', sm: '1rem' } }}>
                            {student.name}
                          </Typography>
                        }
                        secondary={
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontFamily: 'monospace', fontSize: { xs: '0.8125rem', sm: '0.875rem' }, mt: 0.5 }}
                          >
                            {student.registrationNumber}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </>
        )}
      </Box>
    </Box>
  );
}

export default ClassRosterPage;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/contexts/AuthContext';
import { 
  Box, Typography, Button, Paper, Grid, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TrophyIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Loader from '../../../components/Loader';

function ClassLeaderboardPage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:5000/api/candidate/class/${classId}/leaderboard`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch leaderboard');
        }

        setLeaderboardData(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (token && classId) {
      fetchLeaderboard();
    }
  }, [token, classId]);

  const getRankDisplay = (rank) => {
    if (rank === 1) return { icon: '🥇', color: '#000000', bgColor: '#fef3c7' };
    if (rank === 2) return { icon: '🥈', color: '#000000', bgColor: '#f3f4f6' };
    if (rank === 3) return { icon: '🥉', color: '#000000', bgColor: '#fed7aa' };
    return { icon: null, color: '#000000', bgColor: '#ffffff' };
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
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
              Unable to View Leaderboard
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
                  <TrophyIcon sx={{ fontSize: 24, color: '#ffffff' }} />
                </Box>
                <Typography variant="h4" fontWeight="600" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                  Class Leaderboard
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ ml: { xs: 0, sm: 7 }, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                Rankings based on overall performance in {leaderboardData?.classTitle}
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
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Course Code
                  </Typography>
                  <Typography variant="body2" fontWeight="600" sx={{ fontFamily: 'monospace' }}>
                    {leaderboardData?.courseCode}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Total Students
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    {leaderboardData?.rankings?.length || 0}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Candidate Rank
                  </Typography>
                  <Typography variant="body2" fontWeight="700" color="#000000">
                    #{leaderboardData?.currentUserRank || 'N/A'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Your Avg Score
                  </Typography>
                  <Typography variant="body2" fontWeight="700" color="#000000">
                    {leaderboardData?.currentUserScore !== undefined ? leaderboardData.currentUserScore.toFixed(1) + '%' : 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Leaderboard List */}
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
                  Rankings
                </Typography>
              </Box>
              
              {leaderboardData?.rankings?.length === 0 ? (
                <Box sx={{ p: 12, textAlign: 'center' }}>
                  <TrendingUpIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 3 }} />
                  <Typography variant="body2" color="text.secondary">
                    No rankings available yet
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <Table sx={{ minWidth: { xs: 600, md: 'auto' } }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, width: 80 }}>Rank</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Student</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Completed</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Avg Score</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {leaderboardData?.rankings?.map((student) => {
                        const rankStyle = getRankDisplay(student.rank);
                        const isCurrentUser = student.userId === user?._id;
                        
                        return (
                          <TableRow 
                            key={student.userId}
                            sx={{
                              bgcolor: isCurrentUser ? '#eff6ff' : 'inherit',
                              borderLeft: isCurrentUser ? '4px solid #3b82f6' : 'none',
                              '&:hover': {
                                bgcolor: isCurrentUser ? '#dbeafe' : 'rgba(0,0,0,0.02)'
                              }
                            }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {rankStyle.icon ? (
                                  <Typography sx={{ fontSize: '1.5rem' }}>{rankStyle.icon}</Typography>
                                ) : (
                                  <Typography fontWeight="700" sx={{ color: rankStyle.color }}>
                                    #{student.rank}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography 
                                    variant="body2" 
                                    fontWeight="600"
                                    sx={{ color: isCurrentUser ? '#1e40af' : '#1f2937' }}
                                  >
                                    {student.name}
                                  </Typography>
                                  {isCurrentUser && (
                                    <Chip 
                                      label="You" 
                                      size="small" 
                                      sx={{ 
                                        height: 20, 
                                        fontSize: '0.65rem',
                                        bgcolor: '#3b82f6',
                                        color: '#ffffff'
                                      }} 
                                    />
                                  )}
                                </Box>
                                <Typography 
                                  variant="caption" 
                                  color="text.secondary"
                                  sx={{ fontFamily: 'monospace', mt: 0.5, display: 'block' }}
                                >
                                  {student.registrationNumber}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" fontWeight="600">
                                {student.completedAssignments}/{student.totalAssignments}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography 
                                variant="body1" 
                                fontWeight="700"
                                sx={{
                                  color: student.averageScore >= 80 ? '#16a34a' :
                                         student.averageScore >= 60 ? '#ca8a04' :
                                         '#dc2626'
                                }}
                              >
                                {student.averageScore.toFixed(1)}%
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Paper>
          </>
        )}
      </Box>
    </Box>
  );
}

export default ClassLeaderboardPage;

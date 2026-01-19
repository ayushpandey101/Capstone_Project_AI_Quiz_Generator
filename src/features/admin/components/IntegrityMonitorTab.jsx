import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import { useAuth } from '../../auth';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import TabIcon from '@mui/icons-material/Tab';
import SecurityIcon from '@mui/icons-material/Security';
import VideocamIcon from '@mui/icons-material/Videocam';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import PeopleIcon from '@mui/icons-material/People';
import FaceIcon from '@mui/icons-material/Face';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

const IntegrityMonitorTab = ({ classId }) => {
  const { token } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [cheatData, setCheatData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [violationDialogOpen, setViolationDialogOpen] = useState(false);
  const [selectedViolations, setSelectedViolations] = useState(null);
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    suspiciousSubmissions: 0,
    cleanSubmissions: 0,
    averageTabSwitches: 0,
  });

  // Fetch assignments when component mounts
  useEffect(() => {
    if (classId) {
      fetchAssignments(classId);
    }
  }, [classId]);

  const fetchAssignments = async (classId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/assignments/class/${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setAssignments(result.data);
      }
    } catch (err) {
      setError('Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  // Fetch cheat activity when assignment is selected
  useEffect(() => {
    if (selectedAssignment) {
      fetchCheatActivity(selectedAssignment);
    } else {
      setCheatData([]);
    }
  }, [selectedAssignment]);

  const fetchCheatActivity = async (assignmentId) => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/assignments/${assignmentId}/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      
      if (result.success) {
        // The API returns data.submissions, not data directly
        const submissions = result.data?.submissions || [];
        setCheatData(submissions);
        
        // Calculate statistics
        const totalSubs = submissions.length;
        const suspicious = submissions.filter(
          s => ((s.tabSwitchCount || 0) > 1 || ((s.tabSwitchCount || 0) + (s.escCount || 0)) > 3 || (s.escCount || 0) > 1)
        ).length;
        const clean = totalSubs - suspicious;
        const avgTabSwitches = totalSubs > 0
          ? (submissions.reduce((sum, s) => sum + (s.tabSwitchCount || 0), 0) / totalSubs).toFixed(1)
          : 0;

        setStats({
          totalSubmissions: totalSubs,
          suspiciousSubmissions: suspicious,
          cleanSubmissions: clean,
          averageTabSwitches: avgTabSwitches,
        });
      }
    } catch (err) {
      setError('Failed to fetch integrity monitoring data');
    } finally {
      setLoading(false);
    }
  };

  const getSuspiciousLevel = (submission) => {
    // Calculate all proctoring violations
    const proctoringData = submission.proctoringData || {};
    const tabSwitches = (submission.tabSwitchCount || 0) + (proctoringData.tabSwitches || 0);
    const escKeyPresses = proctoringData.escKeyPresses || 0;
    const multipleFaces = proctoringData.multipleFacesDetected || 0;
    const phoneDetected = proctoringData.phoneDetected || 0;
    const voiceDetected = proctoringData.voiceDetected || 0;
    const noFace = proctoringData.noFaceDetected || 0;
    const lookingAway = proctoringData.lookingAwayDetected || 0;
    const suspiciousObjects = proctoringData.suspiciousObjectDetected || 0;
    const fullscreenExits = proctoringData.fullscreenExits || 0;
    
    const totalViolations = tabSwitches + escKeyPresses + multipleFaces + phoneDetected + voiceDetected + 
                           noFace + lookingAway + suspiciousObjects + fullscreenExits +
                           (proctoringData.copyAttempts || 0) + (proctoringData.pasteAttempts || 0) +
                           (proctoringData.rightClickAttempts || 0) + (proctoringData.devToolsAttempts || 0);

    // Critical violations that immediately flag as high risk
    if (multipleFaces > 0 || phoneDetected > 0 || voiceDetected > 1) {
      return { level: 'high', color: 'error', label: 'High Risk' };
    }
    
    // High risk: Many violations
    if (tabSwitches > 5 || escKeyPresses > 3 || totalViolations > 8 || fullscreenExits > 2) {
      return { level: 'high', color: 'error', label: 'High Risk' };
    } 
    // Medium risk: Some violations
    else if (tabSwitches > 1 || escKeyPresses > 1 || totalViolations > 3 || noFace > 2 || lookingAway > 3) {
      return { level: 'medium', color: 'warning', label: 'Flagged' };
    } 
    // Low risk: Clean or minimal activity
    else {
      return { level: 'low', color: 'success', label: 'Clean' };
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <SecurityIcon sx={{ mr: 1, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Academic Integrity Monitor
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Monitor exam integrity and detect suspicious activities during quiz submissions. Tab switches &gt; 1 or ESC exits are flagged for review.
      </Alert>

      {/* Assignment Filter */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <FormControl fullWidth sx={{ minWidth: { xs: '100%', sm: 300 } }}>
          <InputLabel>Select Assignment</InputLabel>
          <Select
            value={selectedAssignment}
            label="Select Assignment"
            onChange={(e) => setSelectedAssignment(e.target.value)}
            sx={{
              '& .MuiSelect-select': {
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }
            }}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {assignments.map((assignment) => (
              <MenuItem key={assignment._id} value={assignment._id}>
                {assignment.quizId?.title || assignment.quizTitle || 'Untitled Quiz'}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Statistics Cards */}
      {selectedAssignment && !loading && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Submissions
                </Typography>
                <Typography variant="h4">{stats.totalSubmissions}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: 'rgba(244, 67, 54, 0.1)' }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Flagged
                </Typography>
                <Typography variant="h4" color="error">
                  {stats.suspiciousSubmissions}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: 'rgba(76, 175, 80, 0.1)' }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Clean
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.cleanSubmissions}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Avg Tab Switches
                </Typography>
                <Typography variant="h4">{stats.averageTabSwitches}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Integrity Monitor Table */}
      {!loading && selectedAssignment && cheatData.length > 0 && (
        <TableContainer 
          component={Paper}
          sx={{ 
            overflowX: 'auto',
            '&::-webkit-scrollbar': {
              height: 6,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: 3,
            },
          }}
        >
          <Table sx={{ minWidth: { xs: 800, md: 'auto' } }}>
            <TableHead>
              <TableRow>
                <TableCell><strong>Student Name</strong></TableCell>
                <TableCell><strong>Registration No.</strong></TableCell>
                <TableCell><strong>Score</strong></TableCell>
                <TableCell><strong>Tab Switches</strong></TableCell>
                <TableCell><strong>AI Violations</strong></TableCell>
                <TableCell><strong>Integrity Status</strong></TableCell>
                <TableCell><strong>Submitted At</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cheatData.map((submission, index) => {
                const suspiciousInfo = getSuspiciousLevel(submission);
                const isSuspicious = suspiciousInfo.level !== 'low';
                
                return (
                  <TableRow
                    key={index}
                    sx={{
                      backgroundColor: isSuspicious
                        ? suspiciousInfo.level === 'high'
                          ? 'rgba(244, 67, 54, 0.1)'
                          : 'rgba(255, 152, 0, 0.08)'
                        : 'inherit',
                      '&:hover': {
                        backgroundColor: isSuspicious
                          ? suspiciousInfo.level === 'high'
                            ? 'rgba(244, 67, 54, 0.15)'
                            : 'rgba(255, 152, 0, 0.15)'
                          : 'action.hover',
                      },
                    }}
                  >
                    <TableCell>{submission.candidateId?.name || 'N/A'}</TableCell>
                    <TableCell>{submission.candidateId?.registrationNumber || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${(submission.score || 0).toFixed(1)}%`}
                        color={submission.score >= 70 ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TabIcon fontSize="small" />
                        <strong>{(submission.tabSwitchCount || 0) + (submission.proctoringData?.tabSwitching || 0)}</strong>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {submission.proctoringData ? (
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: 0.5,
                            cursor: 'pointer',
                            '&:hover': { opacity: 0.8 }
                          }}
                          onClick={() => {
                            setSelectedViolations({
                              candidateName: submission.candidateName,
                              data: submission.proctoringData
                            });
                            setViolationDialogOpen(true);
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <VideocamIcon fontSize="small" color={
                              (submission.proctoringData.totalViolations || 0) > 8 ? 'error' :
                              (submission.proctoringData.totalViolations || 0) > 4 ? 'warning' : 'success'
                            } />
                            <strong>{submission.proctoringData.totalViolations || 0} total</strong>
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                            {submission.proctoringData.multipleFacesDetected > 0 && `👥 ${submission.proctoringData.multipleFacesDetected} `}
                            {submission.proctoringData.noFaceDetected > 0 && `❌ ${submission.proctoringData.noFaceDetected} `}
                            {submission.proctoringData.lookingAwayDetected > 0 && `👀 ${submission.proctoringData.lookingAwayDetected} `}
                            {submission.proctoringData.phoneDetected > 0 && `📱 ${submission.proctoringData.phoneDetected} `}
                            {submission.proctoringData.voiceDetected > 0 && `🔊 ${submission.proctoringData.voiceDetected} `}
                            {submission.proctoringData.suspiciousObjectDetected > 0 && `📄 ${submission.proctoringData.suspiciousObjectDetected} `}
                            {submission.proctoringData.tabSwitches > 0 && `🔄 ${submission.proctoringData.tabSwitches} `}
                            {submission.proctoringData.fullscreenExits > 0 && `⛔ ${submission.proctoringData.fullscreenExits} `}
                          </Typography>
                          <Typography variant="caption" color="primary" sx={{ fontSize: '0.7rem', fontStyle: 'italic' }}>
                            Click for details
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">N/A</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={suspiciousInfo.label}
                        color={suspiciousInfo.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(submission.submittedAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* No Data State */}
      {!loading && selectedAssignment && cheatData.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No submissions found for this assignment.
          </Typography>
        </Paper>
      )}

      {/* No Selection State */}
      {!selectedAssignment && !loading && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Please select an assignment to view integrity monitoring data.
          </Typography>
        </Paper>
      )}

      {/* Violation Details Dialog */}
      <Dialog 
        open={violationDialogOpen} 
        onClose={() => setViolationDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon color="error" />
            <Typography variant="h6">
              Proctoring Violations - {selectedViolations?.candidateName}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedViolations && (
            <List>
              {/* Multiple Faces */}
              <ListItem>
                <ListItemIcon>
                  <PeopleIcon color={selectedViolations.data.multipleFacesDetected > 0 ? 'error' : 'disabled'} />
                </ListItemIcon>
                <ListItemText 
                  primary="Multiple Faces Detected" 
                  secondary={`${selectedViolations.data.multipleFacesDetected || 0} times - More than one person appeared in camera`}
                />
              </ListItem>
              <Divider />
              
              {/* No Face */}
              <ListItem>
                <ListItemIcon>
                  <FaceIcon color={selectedViolations.data.noFaceDetected > 0 ? 'error' : 'disabled'} />
                </ListItemIcon>
                <ListItemText 
                  primary="No Face Detected" 
                  secondary={`${selectedViolations.data.noFaceDetected || 0} times - Candidate left camera view or covered face`}
                />
              </ListItem>
              <Divider />

              {/* Looking Away */}
              <ListItem>
                <ListItemIcon>
                  <VisibilityOffIcon color={selectedViolations.data.lookingAwayDetected > 0 ? 'warning' : 'disabled'} />
                </ListItemIcon>
                <ListItemText 
                  primary="Looking Away" 
                  secondary={`${selectedViolations.data.lookingAwayDetected || 0} times - Candidate looking away from screen`}
                />
              </ListItem>
              <Divider />
              
              {/* Phone Detected */}
              <ListItem>
                <ListItemIcon>
                  <PhoneAndroidIcon color={selectedViolations.data.phoneDetected > 0 ? 'error' : 'disabled'} />
                </ListItemIcon>
                <ListItemText 
                  primary="Phone Detected" 
                  secondary={`${selectedViolations.data.phoneDetected || 0} times - Phone or mobile device detected in frame`}
                />
              </ListItem>
              <Divider />

              {/* Voice/Audio */}
              <ListItem>
                <ListItemIcon>
                  <RecordVoiceOverIcon color={selectedViolations.data.voiceDetected > 0 ? 'error' : 'disabled'} />
                </ListItemIcon>
                <ListItemText 
                  primary="Voice Detected" 
                  secondary={`${selectedViolations.data.voiceDetected || 0} times - Talking or suspicious audio detected`}
                />
              </ListItem>
              <Divider />

              {/* Suspicious Objects */}
              <ListItem>
                <ListItemIcon>
                  <WarningIcon color={selectedViolations.data.suspiciousObjectDetected > 0 ? 'warning' : 'disabled'} />
                </ListItemIcon>
                <ListItemText 
                  primary="Suspicious Objects" 
                  secondary={`${selectedViolations.data.suspiciousObjectDetected || 0} times - Papers, books, or notes detected`}
                />
              </ListItem>
              <Divider />
              
              {/* Tab Switching */}
              <ListItem>
                <ListItemIcon>
                  <SwapHorizIcon color={selectedViolations.data.tabSwitches > 0 ? 'error' : 'disabled'} />
                </ListItemIcon>
                <ListItemText 
                  primary="Tab Switching" 
                  secondary={`${selectedViolations.data.tabSwitches || 0} times - Switched to another tab or window`}
                />
              </ListItem>
              <Divider />

              {/* Fullscreen Exits */}
              <ListItem>
                <ListItemIcon>
                  <TabIcon color={selectedViolations.data.fullscreenExits > 0 ? 'error' : 'disabled'} />
                </ListItemIcon>
                <ListItemText 
                  primary="Fullscreen Exits" 
                  secondary={`${selectedViolations.data.fullscreenExits || 0} times - Exited fullscreen mode`}
                />
              </ListItem>
              <Divider />

              {/* ESC Key Presses */}
              <ListItem>
                <ListItemIcon>
                  <WarningIcon color={selectedViolations.data.escKeyPresses > 0 ? 'warning' : 'disabled'} />
                </ListItemIcon>
                <ListItemText 
                  primary="ESC Key Pressed" 
                  secondary={`${selectedViolations.data.escKeyPresses || 0} times - Attempted to exit with ESC key`}
                />
              </ListItem>
              <Divider />

              {/* Copy/Paste */}
              <ListItem>
                <ListItemIcon>
                  <SecurityIcon color={(selectedViolations.data.copyAttempts + selectedViolations.data.pasteAttempts) > 0 ? 'warning' : 'disabled'} />
                </ListItemIcon>
                <ListItemText 
                  primary="Copy/Paste Attempts" 
                  secondary={`${(selectedViolations.data.copyAttempts || 0) + (selectedViolations.data.pasteAttempts || 0)} times - Tried to copy or paste text`}
                />
              </ListItem>
              <Divider />

              {/* Right Click */}
              <ListItem>
                <ListItemIcon>
                  <SecurityIcon color={selectedViolations.data.rightClickAttempts > 0 ? 'warning' : 'disabled'} />
                </ListItemIcon>
                <ListItemText 
                  primary="Right Click Attempts" 
                  secondary={`${selectedViolations.data.rightClickAttempts || 0} times - Right-click attempts`}
                />
              </ListItem>
              <Divider />

              {/* DevTools */}
              <ListItem>
                <ListItemIcon>
                  <SecurityIcon color={selectedViolations.data.devToolsAttempts > 0 ? 'error' : 'disabled'} />
                </ListItemIcon>
                <ListItemText 
                  primary="DevTools Attempts" 
                  secondary={`${selectedViolations.data.devToolsAttempts || 0} times - Tried to open developer tools`}
                />
              </ListItem>
              <Divider />

              {/* Network Issues */}
              <ListItem>
                <ListItemIcon>
                  <WarningIcon color={selectedViolations.data.networkIssues > 0 ? 'warning' : 'disabled'} />
                </ListItemIcon>
                <ListItemText 
                  primary="Network Issues" 
                  secondary={`${selectedViolations.data.networkIssues || 0} times - Internet connection lost`}
                />
              </ListItem>
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViolationDialogOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IntegrityMonitorTab;


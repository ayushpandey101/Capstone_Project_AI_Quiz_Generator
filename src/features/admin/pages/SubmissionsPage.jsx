// src/pages/SubmissionsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../../auth/contexts/AuthContext';
import Loader from '../../../components/Loader';

const SubmissionsPage = () => {
  const [submissionData, setSubmissionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { assignmentId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubmissions = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(`http://localhost:5000/api/assignments/${assignmentId}/submissions`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch submissions');
        }

        const result = await response.json();
        setSubmissionData(result.data);
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (token && assignmentId) {
      fetchSubmissions();
    }
  }, [assignmentId, token]);

  // Calculate statistics
  const calculateStats = (submissions) => {
    if (!submissions || submissions.length === 0) return null;
    
    const scores = submissions.map(s => s.score);
    const average = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
    const highest = Math.max(...scores).toFixed(2);
    const lowest = Math.min(...scores).toFixed(2);
    
    return { average, highest, lowest };
  };

  const stats = submissionData?.submissions ? calculateStats(submissionData.submissions) : null;

  const handleDeleteClick = (e, submission) => {
    e.stopPropagation();
    setSelectedSubmission(submission);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/assignments/${assignmentId}/submissions/${selectedSubmission._id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete submission');
      }

      // Remove the deleted submission from the local state
      setSubmissionData(prev => ({
        ...prev,
        submissions: prev.submissions.filter(sub => sub._id !== selectedSubmission._id)
      }));

      setSnackbar({
        open: true,
        message: 'Submission deleted successfully. Candidate can now retake the exam.',
        severity: 'success'
      });

    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to delete submission',
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedSubmission(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedSubmission(null);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Loader />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          Back to Assignments
        </Button>
      </Box>
    );
  }

  if (!submissionData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Assignment not found</Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Back to Assignments
        </Button>
      </Box>
    );
  }

  const submissions = submissionData.submissions || [];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        Back to Assignments
      </Button>

      <Typography variant="h4" gutterBottom>
        Quiz Submissions
      </Typography>

      {/* Assignment Info */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
        <Typography variant="h6" gutterBottom>
          {submissionData.quizTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Class: {submissionData.classTitle} ({submissionData.courseCode})
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Due Date: {new Date(submissionData.dueDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Time Limit: {submissionData.timeLimit} minutes
        </Typography>
      </Paper>

      {/* Statistics */}
      {stats && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Statistics
          </Typography>
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Submissions
              </Typography>
              <Typography variant="h5">
                {submissions.length}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Average Score
              </Typography>
              <Typography variant="h5" color="primary">
                {stats.average}%
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Highest Score
              </Typography>
              <Typography variant="h5" color="success.main">
                {stats.highest}%
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Lowest Score
              </Typography>
              <Typography variant="h5" color="error.main">
                {stats.lowest}%
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Submissions Table */}
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Click on a candidate's row to see a detailed report.
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Candidate Name</strong></TableCell>
              <TableCell><strong>Registration Number</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Submitted At</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Activity</strong></TableCell>
              <TableCell align="right"><strong>Score</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {submissions.length > 0 ? (
              submissions.map((sub, index) => {
                const isSuspicious = sub.tabSwitchCount > 3 || !sub.wasFullscreen;
                return (
                  <TableRow 
                    key={index} 
                    hover
                    onClick={() => navigate(`/admin/submission/${assignmentId}/${sub._id}`)}
                    sx={{ 
                      cursor: 'pointer',
                      backgroundColor: isSuspicious ? 'rgba(255, 152, 0, 0.08)' : 'inherit',
                      '&:hover': {
                        backgroundColor: isSuspicious ? 'rgba(255, 152, 0, 0.15)' : 'action.hover',
                      }
                    }}
                  >
                    <TableCell>
                      {sub.candidateId?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {sub.candidateId?.registrationNumber || '-'}
                    </TableCell>
                    <TableCell>
                      {sub.candidateId?.email || '-'}
                    </TableCell>
                    <TableCell>
                      {new Date(sub.submittedAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>
                      {sub.isLateSubmission ? (
                        <Chip
                          label="Late"
                          color="warning"
                          size="small"
                        />
                      ) : (
                        <Chip
                          label="On Time"
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {isSuspicious ? (
                        <Chip
                          label={`⚠️ ${sub.tabSwitchCount} switches`}
                          color="error"
                          size="small"
                        />
                      ) : (
                        <Chip
                          label="Clean"
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {!sub.wasFullscreen && (
                        <Chip
                          label="No Fullscreen"
                          color="error"
                          size="small"
                          sx={{ ml: 0.5 }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${sub.score.toFixed(2)}%`}
                        color={sub.score >= 70 ? 'success' : sub.score >= 50 ? 'warning' : 'error'}
                        size="medium"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Delete submission (allow retake)">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={(e) => handleDeleteClick(e, sub)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Box sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No submissions found for this assignment yet.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Submissions will appear here once candidates complete the quiz.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Submission?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the submission for{' '}
            <strong>{selectedSubmission?.candidateId?.name}</strong>?
            <br /><br />
            This will allow the candidate to retake the exam. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SubmissionsPage;


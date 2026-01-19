// src/components/AssignmentsTab.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Alert,
  IconButton,
  Tooltip,
  Snackbar,
} from "@mui/material";
import { useAuth } from "../../auth/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import AssessmentIcon from "@mui/icons-material/Assessment";
import VisibilityIcon from "@mui/icons-material/Visibility";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import EditIcon from "@mui/icons-material/Edit";
import EditNoteIcon from "@mui/icons-material/EditNote";
import EditAssignmentDialog from "./EditAssignmentDialog";
import Loader from "../../../components/Loader";
import DeleteIcon from "@mui/icons-material/Delete";

const AssignmentsTab = ({ classId }) => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Submissions dialog state
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [isSubmissionsDialogOpen, setIsSubmissionsDialogOpen] = useState(false);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignmentToEdit, setAssignmentToEdit] = useState(null);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Delete submission state
  const [deleteSubmissionDialogOpen, setDeleteSubmissionDialogOpen] =
    useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState(null);
  const [isDeletingSubmission, setIsDeletingSubmission] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch assignments for this class
  const fetchAssignments = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(
        `http://localhost:5000/api/assignments/class/${classId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch assignments");
      }

      const result = await response.json();
      setAssignments(result.data || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token && classId) {
      fetchAssignments();
    }
  }, [classId, token]);

  // Fetch submissions for a specific assignment
  const fetchSubmissions = async (assignmentId) => {
    setIsLoadingSubmissions(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/assignments/${assignmentId}/submissions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch submissions");
      }

      const result = await response.json();
      setSubmissions(result.data.submissions || []);
      // Store the complete assignment data including _id
      setSelectedAssignment({ ...result.data, _id: assignmentId });
    } catch (error) {

    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  // Handle opening submissions dialog
  const handleViewSubmissions = async (assignment) => {
    setIsSubmissionsDialogOpen(true);
    await fetchSubmissions(assignment._id);
  };

  // Handle closing submissions dialog
  const handleCloseDialog = () => {
    setIsSubmissionsDialogOpen(false);
    setSelectedAssignment(null);
    setSubmissions([]);
  };

  // Handle opening edit dialog
  const handleEditClick = (assignment) => {
    setAssignmentToEdit(assignment);
    setEditDialogOpen(true);
  };

  // Handle successful edit
  const handleEditSuccess = (updatedAssignment) => {
    // Refresh assignments list
    fetchAssignments();
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!assignmentToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/assignments/${assignmentToDelete._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete assignment");
      }

      // Refresh assignments list
      fetchAssignments();
      setDeleteDialogOpen(false);
      setAssignmentToDelete(null);
    } catch (err) {

    } finally {
      setIsDeleting(false);
    }
  };

  // Handle delete button click
  const handleDeleteClick = (assignment) => {
    setAssignmentToDelete(assignment);
    setDeleteDialogOpen(true);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate average score
  const calculateAverageScore = (submissions) => {
    if (submissions.length === 0) return 0;
    const total = submissions.reduce((sum, sub) => sum + sub.score, 0);
    return (total / submissions.length).toFixed(2);
  };

  // Handle delete submission click
  const handleDeleteSubmissionClick = (e, submission) => {
    e.stopPropagation();
    setSubmissionToDelete(submission);
    setDeleteSubmissionDialogOpen(true);
  };

  // Handle delete submission confirm
  const handleDeleteSubmissionConfirm = async () => {
    if (!submissionToDelete || !selectedAssignment) return;

    setIsDeletingSubmission(true);
    try {

      const response = await fetch(
        `http://localhost:5000/api/assignments/${selectedAssignment._id}/submissions/${submissionToDelete._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete submission");
      }

      // Remove the deleted submission from local state
      setSubmissions((prev) =>
        prev.filter((sub) => sub._id !== submissionToDelete._id)
      );

      // Refresh assignments to update submission count
      fetchAssignments();

      setSnackbar({
        open: true,
        message: 'Submission deleted successfully. Candidate can now retake the exam.',
        severity: 'success'
      });

      setDeleteSubmissionDialogOpen(false);
      setSubmissionToDelete(null);
    } catch (err) {

      setSnackbar({
        open: true,
        message: err.message || 'Failed to delete submission',
        severity: 'error'
      });
    } finally {
      setIsDeletingSubmission(false);
    }
  };

  const handleDeleteSubmissionCancel = () => {
    setDeleteSubmissionDialogOpen(false);
    setSubmissionToDelete(null);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Sort assignments by date of posting (createdAt) descending
  const sortedAssignments = [...assignments].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "300px",
        }}
      >
        <Loader />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (assignments.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <AssessmentIcon
            sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
          />
          <Typography variant="h6" color="text.secondary">
            No assignments yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Create a quiz from the Content Library and assign it to this class.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Assignments
      </Typography>

      <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
        <Table sx={{ minWidth: { xs: 800, md: "auto" } }}>
          <TableHead>
            <TableRow>
              <TableCell align="left">
                <strong>Quiz Title</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Subgroup</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Weightage</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Due Date</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Time Limit</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Submissions</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Avg Score</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Actions</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedAssignments.map((assignment) => {
              const submissionCount = assignment.submissions?.length || 0;
              const avgScore =
                submissionCount > 0
                  ? calculateAverageScore(assignment.submissions)
                  : "-";
              const isOverdue = new Date(assignment.dueDate) < new Date();

              return (
                <TableRow key={assignment._id} hover>
                  <TableCell align="left">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body1">
                        {assignment.quizId?.title || "Unknown Quiz"}
                      </Typography>
                      <Tooltip title="Edit quiz in Content Library">
                        <IconButton
                          size="small"
                          onClick={() =>
                            navigate(
                              `/admin/content/edit/${assignment.quizId?._id}`
                            )
                          }
                        >
                          <EditNoteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      {assignment.subgroup ? (
                        <Box
                          sx={{
                            px: 1,
                            py: 0.25,
                            borderRadius: 0.5,
                            background: "#222",
                            color: "#fff",
                            fontWeight: 600,
                            fontSize: "0.75rem",
                            fontFamily: "inherit",
                            border: "1px solid #222",
                            minWidth: assignment.subgroup.includes(",")
                              ? 80
                              : 50,
                            textAlign: "center",
                          }}
                        >
                          {assignment.subgroup.includes(",")
                            ? assignment.subgroup
                                .split(",")
                                .map((b) => b.trim())
                                .join(", ")
                            : assignment.subgroup}
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            px: 1,
                            py: 0.25,
                            borderRadius: 0.5,
                            background: "#000000",
                            color: "#fff",
                            fontFamily: "inherit",
                            fontWeight: 600,
                            fontSize: "0.75rem",
                            minWidth: 50,
                            textAlign: "center",
                          }}
                        >
                          ALL
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={
                        assignment.weightageType === "percentage"
                          ? `${assignment.weightage || 0}%`
                          : `${assignment.weightage || 0} marks`
                      }
                      size="small"
                      sx={{
                        fontWeight: 600,
                        minWidth: 60,
                        height: 24,
                        fontSize: "0.75rem",
                        bgcolor: "#000000",
                        color: "#ffffff",
                        "& .MuiChip-label": { px: 1 },
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1,
                      }}
                    >
                      {formatDate(assignment.dueDate)}
                      {isOverdue && (
                        <Chip label="Overdue" color="error" size="small" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    {assignment.timeLimit} mins
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={submissionCount}
                      color={submissionCount > 0 ? "success" : "default"}
                      size="small"
                      sx={{ height: 24, fontSize: "0.75rem", minWidth: 32 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {avgScore !== "-" ? `${avgScore}%` : "-"}
                  </TableCell>
                  <TableCell align="center">
                    <Box
                      sx={{
                        display: "flex",
                        gap: 0.25,
                        alignItems: "center",
                        justifyContent: "center",
                        flexWrap: "nowrap",
                      }}
                    >
                      <Tooltip title="Edit assignment">
                        <IconButton
                          size="small"
                          onClick={() => handleEditClick(assignment)}
                          sx={{ p: 0.5 }}
                        >
                          <EditIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<VisibilityIcon sx={{ fontSize: 16 }} />}
                        onClick={() => handleViewSubmissions(assignment)}
                        disabled={submissionCount === 0}
                        sx={{
                          minWidth: "auto",
                          px: 0.75,
                          py: 0.25,
                          fontSize: "0.75rem",
                          lineHeight: 1.5,
                          "& .MuiButton-startIcon": { mr: 0.5 },
                        }}
                      >
                        Quick View
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
                        onClick={() =>
                          navigate(
                            `/admin/assignment/${assignment._id}/submissions`
                          )
                        }
                        disabled={submissionCount === 0}
                        sx={{
                          minWidth: "auto",
                          px: 0.75,
                          py: 0.25,
                          fontSize: "0.75rem",
                          lineHeight: 1.5,
                          bgcolor: "#000000",
                          "&:hover": { bgcolor: "#1f2937" },
                          "& .MuiButton-startIcon": { mr: 0.5 },
                        }}
                      >
                        Full View
                      </Button>
                      <Tooltip title="Delete assignment">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDeleteClick(assignment)}
                          sx={{ p: 0.5 }}
                        >
                          <DeleteIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Submissions Dialog */}
      <Dialog
        open={isSubmissionsDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedAssignment && (
            <Box>
              <Typography variant="h6">Submissions</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedAssignment.quizTitle} - {selectedAssignment.courseCode}
              </Typography>
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          {isLoadingSubmissions ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                p: 4,
                minHeight: "200px",
              }}
            >
              <Loader />
            </Box>
          ) : submissions.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="body1" color="text.secondary">
                No submissions yet
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Student Name</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Email</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Score</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Status</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Submitted At</strong>
                    </TableCell>
                    <TableCell align="center" sx={{ width: 80 }}>
                      <strong>Actions</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {submissions.map((submission, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {submission.candidateId?.name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        {submission.candidateId?.email || "-"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${submission.score.toFixed(2)}%`}
                          color={
                            submission.score >= 70
                              ? "success"
                              : submission.score >= 50
                              ? "warning"
                              : "error"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {submission.isLateSubmission ? (
                          <Chip label="Late" color="warning" size="small" />
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
                        {new Date(submission.submittedAt).toLocaleString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Delete submission (allow retake)">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={(e) =>
                              handleDeleteSubmissionClick(e, submission)
                            }
                            sx={{ p: 0.5 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {selectedAssignment && submissions.length > 0 && (
            <Box
              sx={{
                mt: 3,
                p: 2,
                bgcolor: "background.default",
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                <strong>Statistics:</strong>
              </Typography>
              <Typography variant="body2">
                Total Submissions: {submissions.length}
              </Typography>
              <Typography variant="body2">
                Average Score: {calculateAverageScore(submissions)}%
              </Typography>
              <Typography variant="body2">
                Highest Score:{" "}
                {Math.max(...submissions.map((s) => s.score)).toFixed(2)}%
              </Typography>
              <Typography variant="body2">
                Lowest Score:{" "}
                {Math.min(...submissions.map((s) => s.score)).toFixed(2)}%
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <EditAssignmentDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        assignment={assignmentToEdit}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: "error.main" }}>
          Delete Assignment
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Warning:</strong> This action cannot be undone.
            </Typography>
          </Alert>
          <Typography variant="body1">
            Are you sure you want to delete the assignment for "
            {assignmentToDelete?.quizId?.title}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This will permanently remove the assignment and all associated
            submissions.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} /> : null}
          >
            {isDeleting ? "Deleting..." : "Delete Assignment"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Submission Confirmation Dialog */}
      <Dialog open={deleteSubmissionDialogOpen} onClose={handleDeleteSubmissionCancel}>
        <DialogTitle>Delete Submission?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the submission for{' '}
            <strong>{submissionToDelete?.candidateId?.name}</strong>?
            <br /><br />
            This will allow the candidate to retake the exam. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteSubmissionCancel} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteSubmissionConfirm} color="error" variant="contained" autoFocus>
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

export default AssignmentsTab;

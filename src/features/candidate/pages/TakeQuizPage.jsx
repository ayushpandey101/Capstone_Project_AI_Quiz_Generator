import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Paper, Radio, RadioGroup,
  FormControlLabel, FormControl, TextField, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Snackbar, Card, CardContent, Stack, Chip, Divider, Grid
} from '@mui/material';
import { useAuth } from '../../auth/contexts/AuthContext';
import Loader from '../../../components/Loader';
import ProctoringSys from '../../../utils/ProctoringSys';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import QuizIcon from '@mui/icons-material/Quiz';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VideocamIcon from '@mui/icons-material/Videocam';
import WarningIcon from '@mui/icons-material/Warning';

const TakeQuizPage = () => {
  const { assignmentId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  // Core State
  const [quiz, setQuiz] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [quizStartTime, setQuizStartTime] = useState(null); // Track when quiz actually started
  
  // Proctoring State
  const [showProctoringDialog, setShowProctoringDialog] = useState(false);
  const [proctoringActive, setProctoringActive] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [violationCount, setViolationCount] = useState(0);
  const cameraVideoRef = useRef(null);
  
  // Quiz Flow State
  const [quizStarted, setQuizStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Refs
  const proctoringSysRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const hasSubmittedRef = useRef(false);
  const quizContainerRef = useRef(null);

  // LocalStorage key for this specific quiz attempt
  const getStorageKey = () => `quiz_state_${assignmentId}`;

  // Save quiz state to localStorage
  const saveQuizState = useCallback(() => {
    if (!quizStarted || hasSubmittedRef.current) return;
    
    const state = {
      answers,
      currentQuestionIndex,
      quizStartTime,
      violationCount,
      violations: proctoringSysRef.current?.getViolations() || {},
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(state));
    } catch (error) {

    }
  }, [answers, currentQuestionIndex, quizStartTime, violationCount, quizStarted, assignmentId]);

  // Load quiz state from localStorage
  const loadQuizState = useCallback(() => {
    try {
      const savedState = localStorage.getItem(getStorageKey());
      if (savedState) {
        const state = JSON.parse(savedState);
        return state;
      }
    } catch (error) {

    }
    return null;
  }, [assignmentId]);

  // Clear quiz state from localStorage
  const clearQuizState = useCallback(() => {
    try {
      localStorage.removeItem(getStorageKey());
    } catch (error) {

    }
  }, [assignmentId]);

  // Auto-save state whenever it changes
  useEffect(() => {
    if (quizStarted && !hasSubmittedRef.current) {
      saveQuizState();
    }
  }, [answers, currentQuestionIndex, violationCount, quizStarted, saveQuizState]);

  // Fetch Quiz Data and restore state if exists
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`/api/candidate/assignment/${assignmentId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to load quiz' }));
          
          if (response.status === 403) {
            setWarningMessage(errorData.message || 'You are not authorized to access this quiz');
            setTimeout(() => navigate(-1), 3000);
            setIsLoading(false);
            return;
          }
          
          throw new Error(errorData.message || 'Failed to fetch quiz');
        }
        
        const result = await response.json();
        
        if (result.success) {
          setQuiz(result.data);
          
          // Check for saved state
          const savedState = loadQuizState();
          
          if (savedState && result.data.timeLimit) {
            // Resume quiz from saved state
            const elapsedSeconds = Math.floor((Date.now() - savedState.quizStartTime) / 1000);
            const totalTimeInSeconds = result.data.timeLimit * 60;
            const remaining = Math.max(0, totalTimeInSeconds - elapsedSeconds);
            
            // Restore state
            setAnswers(savedState.answers || {});
            setCurrentQuestionIndex(savedState.currentQuestionIndex || 0);
            setQuizStartTime(savedState.quizStartTime);
            setTimeLeft(remaining);
            setViolationCount(savedState.violationCount || 0);
            setQuizStarted(true);
            
            // Show message that quiz was restored
            setWarningMessage('Quiz resumed from where you left off. Timer is still running!');
            setTimeout(() => setWarningMessage(''), 4000);
            
            // Enter fullscreen when resuming quiz
            setTimeout(() => {
              enterFullscreen();
            }, 500);
            
            // If time is up, auto-submit
            if (remaining === 0) {
              setTimeout(() => {
                handleAutoSubmit();
              }, 500);
            }
          } else if (result.data.timeLimit) {
            // New quiz attempt
            setTimeLeft(result.data.timeLimit * 60);
          }
          
          setIsLoading(false);
        } else {
          throw new Error(result.message || 'Failed to fetch quiz');
        }
      } catch (error) {
        setWarningMessage(error.message || 'Failed to load quiz');
        setTimeout(() => navigate(-1), 3000);
        setIsLoading(false);
      }
    };

    if (token && assignmentId) {
      fetchQuiz();
    }
  }, [assignmentId, token, navigate, loadQuizState]);

  const cleanupProctoring = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    if (proctoringSysRef.current) {
      proctoringSysRef.current.stopMonitoring();
      proctoringSysRef.current = null;
    }
    
    if (cameraVideoRef.current?.srcObject) {
      const tracks = cameraVideoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      cameraVideoRef.current.srcObject = null;
    }
    
    setProctoringActive(false);
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
        else if (document.msExitFullscreen) await document.msExitFullscreen();
      }
    } catch (error) {
      // Silent fail
    }
  }, []);

  // Updated Submit Handler with proper backend sync and localStorage cleanup
  const handleSubmitClick = async () => {
    if (hasSubmittedRef.current || isSubmitting) return;
    
    // Validate all questions answered if timer exists
    if (quiz.timeLimit && timeLeft !== null) {
      const totalQuestions = quiz.questions.length;
      const answeredQuestions = Object.keys(answers).length;
      
      if (answeredQuestions < totalQuestions) {
        setWarningMessage('Please answer all questions before submitting.');
        setTimeout(() => setWarningMessage(''), 5000);
        return;
      }
    }

    setIsSubmitting(true);
    hasSubmittedRef.current = true;

    try {
      // 1. Capture violations with small delay to ensure all detections complete
      await new Promise(resolve => setTimeout(resolve, 100));
      const rawViolations = proctoringSysRef.current?.getViolations() || {};
      
      // 2. Prepare submission payload matching backend expectations
      const submissionData = {
        answers: answers,
        tabSwitchCount: rawViolations.tabSwitches || 0,
        escCount: rawViolations.escKeyPresses || 0,
        wasFullscreen: proctoringActive,
        proctoringData: {
          tabSwitches: rawViolations.tabSwitches || 0,
          fullscreenExits: rawViolations.fullscreenExits || 0,
          escKeyPresses: rawViolations.escKeyPresses || 0,
          copyAttempts: rawViolations.copyAttempts || 0,
          pasteAttempts: rawViolations.pasteAttempts || 0,
          rightClickAttempts: rawViolations.rightClickAttempts || 0,
          devToolsAttempts: rawViolations.devToolsAttempts || 0,
          cameraViolations: rawViolations.cameraViolations || 0,
          networkIssues: rawViolations.networkIssues || 0,
          noFaceDetected: rawViolations.noFaceDetected || 0,
          multipleFacesDetected: rawViolations.multipleFacesDetected || 0,
          lookingAwayDetected: rawViolations.lookingAwayDetected || 0,
          phoneDetected: rawViolations.phoneDetected || 0,
          voiceDetected: rawViolations.voiceDetected || 0,
          suspiciousObjectDetected: rawViolations.suspiciousObjectDetected || 0,
          timestamps: [new Date()]
        }
      };

      // 3. Send to backend
      const response = await fetch(`/api/candidate/submit-quiz/${assignmentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submissionData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // 4. Clear localStorage after successful submission
        clearQuizState();
        
        // 5. Cleanup proctoring
        cleanupProctoring();
        await exitFullscreen();
        
        // Navigate to classes page
        setTimeout(() => {
          navigate('/candidate/my-classes', { replace: true });
        }, 100);
      } else {
        throw new Error(result.message || 'Submission failed on server');
      }
    } catch (error) {
      // Save current state before cleanup in case of network error
      saveQuizState();
      
      // Cleanup on error
      cleanupProctoring();
      await exitFullscreen().catch(() => {});
      
      // Re-enable submission
      hasSubmittedRef.current = false;
      setIsSubmitting(false);
      setWarningMessage(`Submission Error: ${error.message}. Your progress is saved. Please try again when online.`);
      setTimeout(() => setWarningMessage(''), 7000);
    }
  };

  const handleAutoSubmit = useCallback(async () => {
    if (hasSubmittedRef.current) return;
    
    // Get saved state for submission
    const savedState = loadQuizState();
    const submissionAnswers = savedState?.answers || answers;
    const submissionViolations = savedState?.violations || proctoringSysRef.current?.getViolations() || {};
    
    hasSubmittedRef.current = true;
    setIsSubmitting(true);
    
    try {
      const submissionData = {
        answers: submissionAnswers,
        tabSwitchCount: submissionViolations.tabSwitches || 0,
        escCount: submissionViolations.escKeyPresses || 0,
        wasFullscreen: proctoringActive,
        proctoringData: {
          tabSwitches: submissionViolations.tabSwitches || 0,
          fullscreenExits: submissionViolations.fullscreenExits || 0,
          escKeyPresses: submissionViolations.escKeyPresses || 0,
          copyAttempts: submissionViolations.copyAttempts || 0,
          pasteAttempts: submissionViolations.pasteAttempts || 0,
          rightClickAttempts: submissionViolations.rightClickAttempts || 0,
          devToolsAttempts: submissionViolations.devToolsAttempts || 0,
          cameraViolations: submissionViolations.cameraViolations || 0,
          networkIssues: submissionViolations.networkIssues || 0,
          noFaceDetected: submissionViolations.noFaceDetected || 0,
          multipleFacesDetected: submissionViolations.multipleFacesDetected || 0,
          lookingAwayDetected: submissionViolations.lookingAwayDetected || 0,
          phoneDetected: submissionViolations.phoneDetected || 0,
          voiceDetected: submissionViolations.voiceDetected || 0,
          suspiciousObjectDetected: submissionViolations.suspiciousObjectDetected || 0,
          timestamps: [new Date()]
        }
      };

      const response = await fetch(`/api/candidate/submit-quiz/${assignmentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submissionData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        clearQuizState();
        cleanupProctoring();
        await exitFullscreen();
        navigate('/candidate/my-classes', { replace: true });
      } else {
        throw new Error(result.message || 'Auto-submission failed');
      }
    } catch (error) {
      // If offline or error, keep state saved for retry
      setWarningMessage('Time is up! Attempting to submit. If offline, your answers are saved and will submit when you reconnect.');
      
      // Retry submission when back online
      const retrySubmit = () => {
        if (navigator.onLine && !hasSubmittedRef.current) {
          handleAutoSubmit();
        }
      };
      
      window.addEventListener('online', retrySubmit, { once: true });
      
      setTimeout(() => {
        cleanupProctoring();
        exitFullscreen().catch(() => {});
      }, 3000);
    }
  }, [answers, assignmentId, token, navigate, loadQuizState, clearQuizState, cleanupProctoring, exitFullscreen, proctoringActive]);

  // Re-enter fullscreen on navigation if user exits accidentally
  const handlePrevious = async () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      
      if (proctoringActive && !document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
        await enterFullscreen();
      }
    }
  };

  const handleNext = async () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      
      if (proctoringActive && !document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
        await enterFullscreen();
      }
    }
  };

  // Setup Camera Preview
  useEffect(() => {
    if (proctoringActive && proctoringSysRef.current && cameraVideoRef.current) {
      const videoEl = proctoringSysRef.current.getVideoElement();
      if (videoEl?.srcObject) {
        cameraVideoRef.current.srcObject = videoEl.srcObject;
        cameraVideoRef.current.play().catch(() => {});
      }
    }
  }, [proctoringActive]);

  // Timer Countdown - runs continuously based on elapsed time
  useEffect(() => {
    if (!quizStarted || timeLeft === null || hasSubmittedRef.current) return;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          if (!hasSubmittedRef.current) {
            // Auto-submit when time expires
            setTimeout(() => handleAutoSubmit(), 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerIntervalRef.current);
  }, [quizStarted, handleAutoSubmit]);

  // Periodic state save (every 5 seconds as backup)
  useEffect(() => {
    if (!quizStarted || hasSubmittedRef.current) return;
    
    const saveInterval = setInterval(() => {
      saveQuizState();
    }, 5000);
    
    return () => clearInterval(saveInterval);
  }, [quizStarted, saveQuizState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupProctoring();
    };
  }, [cleanupProctoring]);

  // Handle page visibility and beforeunload (save state when leaving)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && quizStarted && !hasSubmittedRef.current) {
        saveQuizState();
      }
    };

    const handleBeforeUnload = (e) => {
      if (quizStarted && !hasSubmittedRef.current) {
        saveQuizState();
        e.preventDefault();
        e.returnValue = 'Quiz in progress. Your answers will be saved.';
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [quizStarted, saveQuizState]);

  // Enter Fullscreen Helper
  const enterFullscreen = async () => {
    try {
      const elem = quizContainerRef.current || document.documentElement;
      if (elem.requestFullscreen) await elem.requestFullscreen();
      else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
      else if (elem.msRequestFullscreen) await elem.msRequestFullscreen();
    } catch (error) {
      // Silent fail
    }
  };

  const handleGrantProctoringPermission = async () => {
    setShowProctoringDialog(false);
    const procSys = new ProctoringSys({
      enableCamera: true,
      enableFullscreen: true,
      enableTabTracking: true,
      maxTabSwitches: 3
    });

    try {
      const initResult = await procSys.initialize();
      if (initResult.success) {
        proctoringSysRef.current = procSys;
        
        procSys.setWarningCallback((msg) => {
          setWarningMessage(msg);
          setTimeout(() => setWarningMessage(''), 4000);
        });
        
        procSys.setViolationCallback((type, msg, violations) => {
          const total = Object.values(violations).reduce((acc, val) => {
            return typeof val === 'number' ? acc + val : acc;
          }, 0);
          setViolationCount(total);
        });
        
        procSys.startMonitoring();
        setProctoringActive(true);
        
        // Set quiz start time if not already set (new quiz)
        if (!quizStartTime) {
          const startTime = Date.now();
          setQuizStartTime(startTime);
        }
        
        setQuizStarted(true);
        setTimeout(() => enterFullscreen(), 300);
      } else {
        navigate(-1);
      }
    } catch (error) {
      navigate(-1);
    }
  };

  const handleStartNonProctoredQuiz = () => {
    // Set quiz start time if not already set (new quiz)
    if (!quizStartTime) {
      const startTime = Date.now();
      setQuizStartTime(startTime);
    }
    
    setQuizStarted(true);
    setTimeout(() => enterFullscreen(), 150);
  };

  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render question based on type
  const renderQuestion = (question) => {
    const currentAnswer = answers[question._id] || '';

    switch (question.type) {
      case 'mcq':
      case 'true_false':
        return (
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={currentAnswer}
              onChange={(e) => setAnswers({...answers, [question._id]: e.target.value})}
            >
              {question.options.map((opt, idx) => (
                <Paper
                  key={idx}
                  variant="outlined"
                  sx={{
                    mb: 2,
                    p: 1,
                    border: '1px solid',
                    borderColor: currentAnswer === opt ? 'primary.main' : 'grey.300',
                    bgcolor: currentAnswer === opt ? 'primary.50' : 'transparent',
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'grey.50' }
                  }}
                >
                  <FormControlLabel
                    value={opt}
                    control={<Radio />}
                    label={<Typography variant="body1">{opt}</Typography>}
                    sx={{ width: '100%', m: 0, p: 1.5 }}
                  />
                </Paper>
              ))}
            </RadioGroup>
          </FormControl>
        );
      
      case 'short_answer':
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            value={currentAnswer}
            onChange={(e) => setAnswers({...answers, [question._id]: e.target.value})}
            placeholder="Type your answer here..."
            variant="outlined"
          />
        );
      
      default:
        return <Typography>Unsupported question type</Typography>;
    }
  };

  if (isLoading) return <Loader />;
  
  if (!quiz) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', p: 3 }}>
        <Card sx={{ maxWidth: 500, width: '100%', textAlign: 'center', p: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {warningMessage || 'Quiz not found or access denied'}
          </Alert>
          <Button variant="contained" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </Card>
      </Box>
    );
  }

  if (!quizStarted) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', p: 2 }}>
        <Card sx={{ maxWidth: 600, width: '100%', borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <QuizIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" fontWeight={700} gutterBottom>{quiz.title}</Typography>
              <Typography color="text.secondary">{quiz.description}</Typography>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 6 }}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                  <AccessTimeIcon sx={{ color: 'primary.main', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">Time Limit</Typography>
                  <Typography variant="h6" fontWeight={600}>{quiz.timeLimit} min</Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                  <QuizIcon sx={{ color: 'primary.main', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">Questions</Typography>
                  <Typography variant="h6" fontWeight={600}>{quiz.questions.length}</Typography>
                </Paper>
              </Grid>
            </Grid>
            
            <Button 
              fullWidth 
              variant="contained" 
              size="large" 
              onClick={quiz.proctoringEnabled ? () => setShowProctoringDialog(true) : handleStartNonProctoredQuiz}
              sx={{ fontWeight: 600 }}
            >
              Start Quiz
            </Button>
          </CardContent>
        </Card>

        <Dialog open={showProctoringDialog} fullWidth maxWidth="sm" sx={{ zIndex: 99999 }}>
          <DialogTitle sx={{ textAlign: 'center', pt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <VideocamIcon sx={{ fontSize: 50, color: 'primary.main', mb: 1 }} />
            Camera Access Required
          </DialogTitle>
          <DialogContent sx={{ px: 3 }}>
            <Typography variant="body1" color="text.secondary" paragraph>
              This quiz uses AI proctoring to ensure exam integrity. We need access to your camera and microphone.
            </Typography>
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>What we monitor:</Typography>
              <Typography variant="body2" component="div">
                • Face detection and multiple people<br />
                • Tab switches and window focus<br />
                • Phone or suspicious objects<br />
                • Audio/voice detection
              </Typography>
            </Alert>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => navigate(-1)} color="inherit">Cancel</Button>
            <Button variant="contained" onClick={handleGrantProctoringPermission}>Enable & Start</Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];

  return (
    <Box ref={quizContainerRef} sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', pb: 15 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ position: 'sticky', top: 0, zIndex: 100, p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
          <Typography variant="h6" fontWeight={700} color={timeLeft < 60 ? 'error.main' : 'primary.main'}>
            <AccessTimeIcon sx={{ mr: 0.5, verticalAlign: 'middle' }} />
            {formatTime(timeLeft)}
          </Typography>
          <Chip 
            label={`Question ${currentQuestionIndex + 1} / ${quiz.questions.length}`} 
            color="primary" 
            size="medium"
          />
          {proctoringActive && (
            <Chip 
              icon={<WarningIcon />} 
              label={`${violationCount} Violations`} 
              color="warning" 
              size="small" 
            />
          )}
        </Stack>
        <LinearProgress 
          variant="determinate" 
          value={((currentQuestionIndex + 1) / quiz.questions.length) * 100} 
          sx={{ mt: 2, height: 6, borderRadius: 3 }} 
        />
      </Paper>

      {/* Camera Preview - Hidden on mobile */}
      {proctoringActive && (
        <Paper 
          elevation={6} 
          sx={{ 
            display: { xs: 'none', md: 'block' },
            position: 'fixed', 
            bottom: 100, 
            right: 20, 
            width: 240, 
            height: 180, 
            zIndex: 9999, 
            overflow: 'hidden', 
            borderRadius: 2, 
            bgcolor: 'black', 
            border: '3px solid',
            borderColor: 'success.main'
          }}
        >
          <video 
            ref={cameraVideoRef} 
            autoPlay 
            muted 
            playsInline 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              bgcolor: 'rgba(0,0,0,0.8)',
              color: 'white',
              px: 1.5,
              py: 0.75,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'red',
                animation: 'pulse 2s infinite'
              }}
            />
            <Typography variant="caption">Recording</Typography>
          </Box>
        </Paper>
      )}

      {/* Main Content */}
      <Box sx={{ maxWidth: 900, mx: 'auto', p: 3, mt: 2 }}>
        <Card elevation={2}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ mb: 3 }}>
              <Chip
                label={currentQuestion.type === 'mcq' ? 'Multiple Choice' : 
                      currentQuestion.type === 'true_false' ? 'True/False' : 
                      'Short Answer'}
                size="small"
                sx={{ mb: 2 }}
              />
              <Typography variant="h5" fontWeight={600} gutterBottom>
                Question {currentQuestionIndex + 1}
              </Typography>
              <Typography variant="h6" color="text.primary" sx={{ lineHeight: 1.6 }}>
                {currentQuestion.text}
              </Typography>
              
              {currentQuestion.image && (
                <Box sx={{ mt: 2, mb: 3 }}>
                  <img
                    src={currentQuestion.image}
                    alt="Question"
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0'
                    }}
                  />
                </Box>
              )}
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            {/* Answer Area */}
            {renderQuestion(currentQuestion)}
          </CardContent>
        </Card>
      </Box>

      {/* Navigation */}
      <Paper elevation={4} sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, p: 2, zIndex: 100 }}>
        <Stack direction="row" spacing={2} maxWidth={900} mx="auto">
          <Button 
            fullWidth 
            variant="outlined" 
            startIcon={<NavigateBeforeIcon />} 
            disabled={currentQuestionIndex === 0} 
            onClick={handlePrevious}
            sx={{ minHeight: 48 }}
          >
            Previous
          </Button>
          {currentQuestionIndex === quiz.questions.length - 1 ? (
            <Button 
              fullWidth 
              variant="contained" 
              color="success" 
              endIcon={isSubmitting ? null : <CheckCircleIcon />}
              onClick={handleSubmitClick} 
              disabled={isSubmitting}
              sx={{ minHeight: 48, fontWeight: 600 }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </Button>
          ) : (
            <Button 
              fullWidth 
              variant="contained" 
              endIcon={<NavigateNextIcon />} 
              onClick={handleNext}
              sx={{ minHeight: 48 }}
            >
              Next
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Warning Snackbar */}
      <Snackbar 
        open={!!warningMessage} 
        autoHideDuration={5000} 
        onClose={() => setWarningMessage('')} 
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ top: '80px !important', zIndex: 99999 }}
      >
        <Alert 
          onClose={() => setWarningMessage('')} 
          severity="warning" 
          variant="filled"
          sx={{ width: '100%', fontWeight: 600 }}
        >
          {warningMessage}
        </Alert>
      </Snackbar>

      {/* Loading Overlay */}
      {isSubmitting && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999
          }}
        >
          <Card elevation={8} sx={{ p: 4, textAlign: 'center', minWidth: 300 }}>
            <Typography variant="h6" gutterBottom>Submitting Quiz...</Typography>
            <LinearProgress sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Please wait while we process your submission
            </Typography>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default TakeQuizPage;
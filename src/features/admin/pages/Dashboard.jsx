import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  alpha,
  TextField,
  InputAdornment,
  Chip,
  LinearProgress,
  Paper,
  Avatar,
  AvatarGroup,
} from '@mui/material';
import { useAuth } from '../../auth/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/People';
import ClassIcon from '@mui/icons-material/Class';
import QuizIcon from '@mui/icons-material/Quiz';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Loader from '../../../components/Loader';

const QuickActionCard = ({ title, description, icon, color = 'primary', onClick, count }) => {
  return (
    <Card 
      sx={{ 
        width: '100%',
        height: '220px',
        background: '#ffffff',
        border: '1px solid',
        borderColor: 'grey.200',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          borderColor: 'primary.main',
        }
      }}
    >
      <CardActionArea 
        onClick={onClick}
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          '&:hover .action-arrow': {
            transform: 'translateX(4px)',
          }
        }}
      >
        <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
              <Box sx={{ 
                p: 1.2, 
                borderRadius: 1.5, 
                bgcolor: color === 'primary' ? 'primary.main' : color === 'success' ? 'secondary.main' : 'primary.light',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {React.cloneElement(icon, { sx: { fontSize: 26 } })}
              </Box>
              {count !== undefined && (
                <Chip 
                  label={count} 
                  size="small" 
                  sx={{ 
                    bgcolor: 'grey.100',
                    color: 'text.primary',
                    fontWeight: 'bold',
                    height: '26px',
                    fontSize: '0.875rem',
                    px: 1.2,
                    border: '1px solid',
                    borderColor: 'grey.200',
                  }} 
                />
              )}
            </Box>
            
            <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.05rem', mb: 1, lineHeight: 1.3, color: 'text.primary' }}>
              {title}
            </Typography>
            
            <Typography 
              variant="body2" 
              sx={{ 
                fontSize: '0.875rem',
                lineHeight: 1.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                minHeight: '42px',
                color: 'text.secondary',
              }}
            >
              {description}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'primary.main', mt: 1.5 }}>
            <Typography variant="body2" fontWeight="600" sx={{ fontSize: '0.875rem' }}>
              Get Started
            </Typography>
            <ArrowForwardIcon 
              className="action-arrow"
              sx={{ ml: 0.5, fontSize: 16, transition: 'transform 0.3s' }} 
            />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

const Dashboard = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (token) {
      fetchStats();
    }
  }, [token]);

  const fetchStats = async () => {
    if (!token) return;
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/admin/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Loader />
      </Box>
    );
  }

  const quickActions = [
    {
      title: 'Manage Classes',
      description: 'Create, edit, and organize your classes. Add students and assign quizzes.',
      icon: <ClassIcon />,
      color: 'primary',
      count: stats?.classCount || 0,
      onClick: () => navigate('/admin/classes')
    },
    {
      title: 'View Results',
      description: 'Check student quiz results, performance metrics, and detailed reports.',
      icon: <AssessmentIcon />,
      color: 'success',
      count: stats?.studentCount || 0,
      onClick: () => navigate('/admin/analytics')
    },
    {
      title: 'Quiz Library',
      description: 'Browse, create, and manage quizzes. Generate AI-powered assessments.',
      icon: <QuizIcon />,
      color: 'warning',
      count: stats?.quizCount || 0,
      onClick: () => navigate('/admin/content')
    },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/admin/classes?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header Section */}
      <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ 
          color: 'primary.main',
          fontSize: { xs: '1.5rem', sm: '2rem' }
        }}>
          Hi {user?.name?.split(' ')[0] || 'there'}! Ready to teach?
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{
          fontSize: { xs: '0.875rem', sm: '1rem' }
        }}>
          Manage your classes, students, and quizzes all in one place
        </Typography>
      </Box>

      {/* Search Bar */}
      <Box 
        component="form"
        onSubmit={handleSearch}
        sx={{ mb: 2.5, display: { xs: 'block', md: 'none' } }}
      >
        <TextField
          fullWidth
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: 'background.paper',
              '&:hover fieldset': {
                borderColor: 'primary.main',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main',
              },
            }
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSearch(e);
            }
          }}
        />
      </Box>

      {/* Quick Actions Grid */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: 'primary.main' }}>
          Quick Actions
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', width: '100%' }}>
        {quickActions.map((action, index) => (
          <Box key={index} sx={{ 
            flex: { 
              xs: '1 1 100%',
              sm: '1 1 calc(50% - 8px)',
              md: '1 1 calc(33.333% - 11px)'
            },
            minWidth: { xs: '100%', sm: 280 },
            maxWidth: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.333% - 11px)' }
          }}>
            <QuickActionCard {...action} />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default Dashboard;


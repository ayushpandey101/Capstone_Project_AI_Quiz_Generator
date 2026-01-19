import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import connectDB from './config/database.js';
import configureGoogleOAuth from './config/passport.js';
import authRoutes from './routes/authRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import classRoutes from './routes/classRoutes.js';
import candidateRoutes from './routes/candidateRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import learningRoutes from './routes/learningRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { protect } from './middleware/authMiddleware.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import Class from './models/Class.js';
import Quiz from './models/Quiz.js';
import Assignment from './models/Assignment.js';

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Configure Google OAuth
configureGoogleOAuth();

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://accounts.google.com", "https://apis.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      frameSrc: ["'self'", "https://accounts.google.com"],
      connectSrc: ["'self'", "https://accounts.google.com", "http://localhost:5000"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin images
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }, // Allow Google OAuth popups
}));
app.use(compression()); // Compress all responses
app.use(mongoSanitize()); // Prevent MongoDB injection attacks

// Apply general rate limiter to all routes
app.use('/api/', generalLimiter);

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5000',
  'https://accounts.google.com',
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies to be sent
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(cors(corsOptions));

// Add additional headers for Google OAuth and CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Payload size limits - Use smaller limits for most routes
app.use(express.json({ limit: '10mb' })); // Reduced from 50mb
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session configuration (required for passport)
if (!process.env.SESSION_SECRET) {
  console.error('⚠️  WARNING: SESSION_SECRET not set in environment variables!');
  process.exit(1); // Force exit in production if secret not set
}

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict', // CSRF protection
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from uploads directory with CORS headers
app.use('/uploads', cors(corsOptions), express.static(path.join(__dirname, '../public/uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/messages', messageRoutes); // Global message routes (notifications)
app.use('/api/classes', messageRoutes); // Class-specific message routes
app.use('/api/candidate', candidateRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/learning', learningRoutes);

// Dashboard Stats Route
// @route   GET /api/admin/dashboard/stats
// @desc    Get high-level stats for the admin dashboard
app.get('/api/admin/dashboard/stats', protect, async (req, res) => {
  try {
    const adminId = req.user?.id || req.user?._id;

    // 1. Get Class Count
    const classCount = await Class.countDocuments({ adminId, isActive: true });

    // 2. Get Quiz Count
    const quizCount = await Quiz.countDocuments({ adminId });

    // 3. Get total unique Candidates
    // (This query finds all classes, gets all their 'students' arrays, and counts the unique IDs)
    const classes = await Class.find({ adminId, isActive: true }).select('students');
    const studentSet = new Set();
    classes.forEach(cls => {
      cls.students.forEach(studentId => {
        studentSet.add(studentId.toString());
      });
    });
    const studentCount = studentSet.size;

    // 4. Send all stats
    res.status(200).json({
      success: true,
      data: {
        classCount,
        quizCount,
        studentCount,
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Candidate Dashboard Route
// @route   GET /api/candidate/dashboard
// @desc    Get all upcoming assignments for a Candidate
app.get('/api/candidate/dashboard', protect, async (req, res) => {
  try {
    const candidateId = req.user?.id || req.user?._id;
    const candidateRole = req.user?.role;

    // Security check: Only Candidates can use this endpoint
    if (candidateRole !== 'candidate') {
      return res.status(403).json({
        success: false,
        message: 'Only candidates can view this',
      });
    }

    // 1. Find all classes the candidate is in
    const classes = await Class.find({ students: candidateId, isActive: true }).select('_id');
    const classIds = classes.map(cls => cls._id);

    // 2. Find all assignments for those classes
    const assignments = await Assignment.find({
      classId: { $in: classIds }, // $in operator matches any value in the array
      dueDate: { $gte: new Date() } // $gte = "greater than or equal to" today (upcoming)
    })
    .populate('quizId', 'title questions') // Get quiz title and questions
    .populate('classId', 'title courseCode') // Get class title and course code
    .sort({ dueDate: 1 }); // Sort by due date (1 = ascending)

    // 3. Filter out assignments that the candidate has already submitted
    const unsubmittedAssignments = assignments.filter(assignment => {
      const hasSubmitted = assignment.submissions.some(
        sub => sub.candidateId.toString() === candidateId.toString()
      );
      return !hasSubmitted;
    });

    res.status(200).json({
      success: true,
      data: unsubmittedAssignments,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TheodoraQ API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me',
        googleAuth: 'GET /api/auth/google',
      },
      quiz: {
        generate: 'POST /api/quiz/generate',
        getAll: 'GET /api/quiz',
        getById: 'GET /api/quiz/:id',
        delete: 'DELETE /api/quiz/:id',
      },
      classes: {
        create: 'POST /api/classes',
        getAll: 'GET /api/classes',
        join: 'POST /api/classes/join',
        getById: 'GET /api/classes/:id',
        update: 'PUT /api/classes/:id',
        delete: 'DELETE /api/classes/:id',
      },
      candidate: {
        myClasses: 'GET /api/candidate/my-classes',
      },
      assignments: {
        create: 'POST /api/assignments',
        getAll: 'GET /api/assignments',
        getByClass: 'GET /api/assignments/class/:classId',
        delete: 'DELETE /api/assignments/:id',
      },
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});



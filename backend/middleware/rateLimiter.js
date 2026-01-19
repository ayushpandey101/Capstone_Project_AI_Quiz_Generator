import rateLimit from 'express-rate-limit';

// General API rate limiter - 300 requests per 15 minutes (increased from 100)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs (increased for polling)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => req.method === 'OPTIONS', // Skip OPTIONS requests
  // Ensure CORS headers are set even when rate limited
  handler: (req, res) => {
    const origin = req.headers.origin;
    const allowedOrigins = ['http://localhost:5173', 'http://localhost:5000'];
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.'
    });
  }
});

// Auth rate limiter - 10 login/signup attempts per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per windowMs (increased from 5)
  message: 'Too many authentication attempts, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skip: (req) => req.method === 'OPTIONS', // Skip OPTIONS requests
  // Ensure headers are set even when rate limited
  handler: (req, res) => {
    const origin = req.headers.origin;
    const allowedOrigins = ['http://localhost:5173', 'http://localhost:5000'];
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again after 15 minutes.'
    });
  }
});

// Quiz submission rate limiter - Prevent rapid-fire submissions
export const quizSubmissionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Max 10 submissions per minute
  message: 'Too many quiz submissions, please wait before submitting again.',
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload rate limiter - Prevent abuse
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Max 50 uploads per hour
  message: 'Too many file uploads, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Search/API call limiter - For external API calls
export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Max 20 searches per minute per user
  message: 'Too many search requests, please wait a moment.',
  standardHeaders: true,
  legacyHeaders: false,
});

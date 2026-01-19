// backend/routes/learningRoutes.js
import express from 'express';
import {
  searchResources,
  getResourceById,
  getRecommendations,
  updateProgress,
  toggleLike,
  getSubjects,
  getMyProgress,
  createResource,
  updateResource,
  deleteResource,
  autoGenerate,
  saveGeneratedResource,
  getArchivedResources
} from '../controllers/learningController.js';
import { protect } from '../middleware/authMiddleware.js';
import { searchLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * GET /api/learning/search
 * Search learning resources with filters
 */
router.get('/search', searchLimiter, searchResources);

/**
 * GET /api/learning/recommendations
 * Get personalized learning recommendations
 */
router.get('/recommendations', getRecommendations);

/**
 * GET /api/learning/subjects
 * Get all available subjects
 */
router.get('/subjects', getSubjects);

/**
 * GET /api/learning/my-progress
 * Get student's learning progress
 */
router.get('/my-progress', getMyProgress);

/**
 * GET /api/learning/archived
 * Get archived (removed) resources
 */
router.get('/archived', getArchivedResources);

/**
 * POST /api/learning/auto-generate
 * Auto-generate resources from web search - Rate limited
 */
router.post('/auto-generate', searchLimiter, autoGenerate);

/**
 * POST /api/learning/save-generated
 * Save auto-generated resource to database
 */
router.post('/save-generated', saveGeneratedResource);

/**
 * POST /api/learning
 * Create a new learning resource (Admin only)
 */
router.post('/', createResource);

/**
 * GET /api/learning/:id
 * Get a single learning resource
 */
router.get('/:id', getResourceById);

/**
 * PUT /api/learning/:id
 * Update a learning resource (Admin only)
 */
router.put('/:id', updateResource);

/**
 * DELETE /api/learning/:id
 * Delete a learning resource (Admin only)
 */
router.delete('/:id', deleteResource);

/**
 * PUT /api/learning/:id/progress
 * Update progress for a resource
 */
router.put('/:id/progress', updateProgress);

/**
 * POST /api/learning/:id/like
 * Like/unlike a resource
 */
router.post('/:id/like', toggleLike);

export default router;

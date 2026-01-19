import express from 'express';
import {
  getClassMessages,
  postMessage,
  deleteMessage,
  markMessageAsRead,
  markAllClassMessagesAsRead,
  getUnreadMessageCount,
  getClassMembers,
  getPersonalNotifications,
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All message routes require authentication
router.use(protect);

/**
 * GET /api/messages/notifications
 * Get personal notifications (mentions) for user
 */
router.get('/notifications', getPersonalNotifications);

/**
 * GET /api/classes/:classId/messages
 * Get all messages for a class
 */
router.get('/:classId/messages', getClassMessages);

/**
 * GET /api/classes/:classId/messages/unread/count
 * Get unread message count for user
 */
router.get('/:classId/messages/unread/count', getUnreadMessageCount);

/**
 * GET /api/classes/:classId/members
 * Get class members for mentions
 */
router.get('/:classId/members', getClassMembers);

/**
 * POST /api/classes/:classId/messages
 * Post a new message (announcement or question)
 */
router.post('/:classId/messages', postMessage);

/**
 * DELETE /api/classes/:classId/messages/:messageId
 * Delete a message
 */
router.delete('/:classId/messages/:messageId', deleteMessage);

/**
 * PUT /api/classes/:classId/messages/read-all
 * Mark all messages in a class as read
 */
router.put('/:classId/messages/read-all', markAllClassMessagesAsRead);

/**
 * PUT /api/classes/:classId/messages/:messageId/read
 * Mark a message as read
 */
router.put('/:classId/messages/:messageId/read', markMessageAsRead);

export default router;

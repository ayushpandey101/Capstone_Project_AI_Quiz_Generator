/**
 * Message Controller
 * Handles class messaging, announcements, and Q&A
 */

import Message from '../models/Message.js';
import Class from '../models/Class.js';
import User from '../models/User.js';

// Helper function to parse mentions from message content
const parseMentions = (content) => {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]); // Extract username
  }
  
  return mentions;
};

/**
 * Get all messages for a class
 * GET /api/classes/:classId/messages
 */
export const getClassMessages = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user?.id || req.user?._id;

    // Verify user has access to this class
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    // Check if user is admin (owner) or student (enrolled)
    const isAdmin = classData.adminId.toString() === userId.toString();
    const isStudent = classData.students.some(
      (studentId) => studentId.toString() === userId.toString()
    );

    if (!isAdmin && !isStudent) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this class',
      });
    }

    // Fetch messages with sender details
    const messages = await Message.find({ classId })
      .populate('senderId', 'name email registrationNumber profilePicture')
      .sort({ createdAt: -1 })
      .lean();

    // Organize messages into threads (parent messages with replies)
    const messageMap = new Map();
    const topLevelMessages = [];

    messages.forEach((msg) => {
      messageMap.set(msg._id.toString(), { ...msg, replies: [] });
    });

    messages.forEach((msg) => {
      if (msg.parentMessageId) {
        const parentId = msg.parentMessageId.toString();
        const parent = messageMap.get(parentId);
        if (parent) {
          parent.replies.push(messageMap.get(msg._id.toString()));
        }
      } else {
        topLevelMessages.push(messageMap.get(msg._id.toString()));
      }
    });

    res.status(200).json({
      success: true,
      data: topLevelMessages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * Post a new message (announcement or question)
 * POST /api/classes/:classId/messages
 */
export const postMessage = async (req, res) => {
  try {
    const { classId } = req.params;
    const { content, messageType, isImportant, parentMessageId } = req.body;
    const userId = req.user?.id || req.user?._id;
    const userRole = req.user?.role;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required',
      });
    }

    // Verify class exists
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    // Check access
    const isAdmin = classData.adminId.toString() === userId.toString();
    const isStudent = classData.students.some(
      (studentId) => studentId.toString() === userId.toString()
    );

    if (!isAdmin && !isStudent) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this class',
      });
    }

    // Only admins can post announcements and mark as important
    const finalMessageType = isAdmin && messageType === 'announcement' 
      ? 'announcement' 
      : parentMessageId 
        ? 'reply' 
        : 'question';

    // Parse mentions from content
    const mentionUsernames = parseMentions(content);
    const mentions = [];
    
    if (mentionUsernames.includes('everyone')) {
      mentions.push({ username: 'everyone', type: 'everyone' });
    }
    
    // Get all class members to resolve mentions
    const adminUser = await User.findById(classData.adminId);
    const students = await User.find({ _id: { $in: classData.students } });
    const allMembers = [adminUser, ...students].filter(Boolean);
    
    // Resolve user mentions
    for (const username of mentionUsernames) {
      if (username !== 'everyone') {
        const mentionedUser = allMembers.find(
          member => member.name.toLowerCase().replace(/\s+/g, '_') === username.toLowerCase() ||
                    member.name.toLowerCase() === username.toLowerCase()
        );
        if (mentionedUser) {
          mentions.push({
            userId: mentionedUser._id,
            username: mentionedUser.name,
            type: 'user'
          });
        }
      }
    }

    const newMessage = new Message({
      classId,
      senderId: userId,
      senderType: isAdmin ? 'admin' : 'candidate',
      content: content.trim(),
      messageType: finalMessageType,
      isImportant: isAdmin ? !!isImportant : false,
      parentMessageId: parentMessageId || null,
      mentions: mentions,
    });

    await newMessage.save();
    await newMessage.populate('senderId', 'name email registrationNumber profilePicture');

    res.status(201).json({
      success: true,
      message: 'Message posted successfully',
      data: newMessage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * Delete a message
 * DELETE /api/classes/:classId/messages/:messageId
 */
export const deleteMessage = async (req, res) => {
  try {
    const { classId, messageId } = req.params;
    const userId = req.user?.id || req.user?._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Verify class
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    // Only message sender or class admin can delete
    const isAdmin = classData.adminId.toString() === userId.toString();
    const isMessageSender = message.senderId.toString() === userId.toString();

    if (!isAdmin && !isMessageSender) {
      return res.status(403).json({
        success: false,
        message: 'You cannot delete this message',
      });
    }

    // Delete the message and all its replies
    await Message.deleteMany({
      $or: [{ _id: messageId }, { parentMessageId: messageId }],
    });

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * Mark all messages in a class as read for user
 * PUT /api/classes/:classId/messages/read-all
 */
export const markAllClassMessagesAsRead = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user?.id || req.user?._id;

    // Verify user has access to this class
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    const isAdmin = classData.adminId.toString() === userId.toString();
    const isStudent = classData.students.some(
      (studentId) => studentId.toString() === userId.toString()
    );

    if (!isAdmin && !isStudent) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this class',
      });
    }

    // Mark all messages in this class as read for the user
    await Message.updateMany(
      {
        classId,
        senderId: { $ne: userId },
        readBy: { $ne: userId },
      },
      {
        $addToSet: { readBy: userId }
      }
    );

    res.status(200).json({
      success: true,
      message: 'All messages marked as read',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * Mark message as read
 * PUT /api/classes/:classId/messages/:messageId/read
 */
export const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.id || req.user?._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Add user to readBy array if not already there
    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
      await message.save();
    }

    res.status(200).json({
      success: true,
      message: 'Message marked as read',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * Get personal notifications for user (mentions and @everyone)
 * GET /api/messages/notifications
 */
export const getPersonalNotifications = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    // Find all classes user has access to
    const userClasses = await Class.find({
      $or: [
        { adminId: userId },
        { students: userId },
      ],
    }).select('_id className');

    const classIds = userClasses.map(c => c._id);

    // Find messages by user to get replies to their messages
    const userMessages = await Message.find({
      classId: { $in: classIds },
      senderId: userId,
    }).select('_id');

    const userMessageIds = userMessages.map(m => m._id);

    // Find messages where:
    // 1. User is mentioned (@username or @everyone)
    // 2. Someone replied to user's message
    const notifications = await Message.find({
      classId: { $in: classIds },
      senderId: { $ne: userId },
      readBy: { $ne: userId },
      $or: [
        { 'mentions.userId': userId },
        { 'mentions.type': 'everyone' },
        { parentMessageId: { $in: userMessageIds } }, // Replies to user's messages
      ],
    })
      .populate('senderId', 'name email profilePicture')
      .populate('classId', 'className')
      .populate('parentMessageId', 'content senderId')
      .sort({ createdAt: -1 })
      .limit(50);

    // Format notifications with class info
    const formattedNotifications = notifications.map(msg => {
      const isReply = msg.messageType === 'reply' && msg.parentMessageId;
      return {
        _id: msg._id,
        messageId: isReply ? msg.parentMessageId._id : msg._id,
        classId: msg.classId._id,
        className: msg.classId.className,
        sender: {
          _id: msg.senderId._id,
          name: msg.senderId.name,
          profilePicture: msg.senderId.profilePicture,
        },
        content: msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content,
        messageType: msg.messageType,
        createdAt: msg.createdAt,
        isEveryone: msg.mentions.some(m => m.type === 'everyone'),
        isReply: isReply,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        notifications: formattedNotifications,
        count: formattedNotifications.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * Get unread message count for user
 * GET /api/classes/:classId/messages/unread/count
 */
export const getUnreadMessageCount = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user?.id || req.user?._id;

    // Verify user has access to this class
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    const isAdmin = classData.adminId.toString() === userId.toString();
    const isStudent = classData.students.some(
      (studentId) => studentId.toString() === userId.toString()
    );

    if (!isAdmin && !isStudent) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this class',
      });
    }

    // Count messages where:
    // 1. User is mentioned (@username or @everyone)
    // 2. Message is not sent by the user
    // 3. User has not read the message
    const unreadCount = await Message.countDocuments({
      classId,
      senderId: { $ne: userId },
      readBy: { $ne: userId },
      $or: [
        { 'mentions.userId': userId },
        { 'mentions.type': 'everyone' },
      ],
    });

    res.status(200).json({
      success: true,
      data: { unreadCount },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * Get class members for mentions
 * GET /api/classes/:classId/members
 */
export const getClassMembers = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user?.id || req.user?._id;

    const classData = await Class.findById(classId)
      .populate('adminId', 'name email profilePicture')
      .populate('students', 'name email registrationNumber profilePicture');

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    const isAdmin = classData.adminId._id.toString() === userId.toString();
    const isStudent = classData.students.some(
      (student) => student._id.toString() === userId.toString()
    );

    if (!isAdmin && !isStudent) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this class',
      });
    }

    const members = [
      {
        _id: classData.adminId._id,
        name: classData.adminId.name,
        email: classData.adminId.email,
        profilePicture: classData.adminId.profilePicture,
        type: 'admin',
        mentionTag: classData.adminId.name.toLowerCase().replace(/\s+/g, '_'),
      },
      ...classData.students.map(student => ({
        _id: student._id,
        name: student.name,
        email: student.email,
        registrationNumber: student.registrationNumber,
        profilePicture: student.profilePicture,
        type: 'candidate',
        mentionTag: student.name.toLowerCase().replace(/\s+/g, '_'),
      })),
    ];

    res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

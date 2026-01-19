/**
 * Message Model
 * For class announcements and Q&A between admin and students
 */

import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderType: {
      type: String,
      enum: ['admin', 'candidate'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    messageType: {
      type: String,
      enum: ['announcement', 'question', 'reply'],
      default: 'announcement',
    },
    parentMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null, // null for top-level messages
    },
    isImportant: {
      type: Boolean,
      default: false, // Admins can mark announcements as important
    },
    mentions: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      username: String,
      type: {
        type: String,
        enum: ['everyone', 'user'],
        default: 'user',
      },
    }],
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Index for faster queries
messageSchema.index({ classId: 1, createdAt: -1 });
messageSchema.index({ parentMessageId: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;

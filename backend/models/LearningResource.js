// backend/models/LearningResource.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const learningResourceSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['video', 'article', 'tutorial', 'reference', 'practice', 'quiz-explanation'],
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  topics: [{
    type: String,
    trim: true,
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  },
  content: {
    type: String,
    required: true, // This could be the actual content, URL, or markdown text
  },
  contentType: {
    type: String,
    enum: ['url', 'text', 'markdown', 'video-url', 'pdf-url'],
    default: 'text',
  },
  thumbnailUrl: {
    type: String,
    default: '',
  },
  tags: [{
    type: String,
    trim: true,
  }],
  estimatedTime: {
    type: Number, // in minutes
    default: 15,
  },
  relatedQuizzes: [{
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isPublic: {
    type: Boolean,
    default: true, // Public resources can be viewed by all students
  },
  views: {
    type: Number,
    default: 0,
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  archivedBy: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    archivedAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

// Indexes for efficient searching
learningResourceSchema.index({ title: 'text', description: 'text', topics: 'text', tags: 'text' });
learningResourceSchema.index({ subject: 1, difficulty: 1 });
learningResourceSchema.index({ category: 1 });
learningResourceSchema.index({ createdBy: 1 }); // Index for privacy filtering
learningResourceSchema.index({ isPublic: 1 }); // Index for public/private filtering
learningResourceSchema.index({ createdBy: 1, category: 1 }); // Compound index for user's resources
learningResourceSchema.index({ subject: 1, difficulty: 1, category: 1 }); // Compound for filtered searches

const LearningResource = mongoose.model('LearningResource', learningResourceSchema);

export default LearningResource;

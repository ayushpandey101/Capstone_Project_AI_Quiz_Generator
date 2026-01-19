// backend/models/StudentProgress.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const studentProgressSchema = new Schema({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  learningResource: {
    type: Schema.Types.ObjectId,
    ref: 'LearningResource',
    required: true,
  },
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed'],
    default: 'not-started',
  },
  progressPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  timeSpent: {
    type: Number, // in minutes
    default: 0,
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
  notes: {
    type: String,
    default: '',
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
}, {
  timestamps: true,
});

// Ensure a student can only have one progress entry per resource
studentProgressSchema.index({ student: 1, learningResource: 1 }, { unique: true });

const StudentProgress = mongoose.model('StudentProgress', studentProgressSchema);

export default StudentProgress;

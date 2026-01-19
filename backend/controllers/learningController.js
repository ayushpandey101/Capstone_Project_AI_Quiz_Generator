// backend/controllers/learningController.js
import LearningResource from '../models/LearningResource.js';
import StudentProgress from '../models/StudentProgress.js';
import Quiz from '../models/Quiz.js';
import { 
  autoGenerateResources, 
  extractTopics, 
  determineDifficulty, 
  estimateTime 
} from '../utils/contentFetcher.js';

export const searchResources = async (req, res) => {
  try {
    const { 
      query, 
      category, 
      subject, 
      difficulty, 
      tags,
      page = 1,
      limit = 12 
    } = req.query;

    const filter = { isPublic: true };
    
    // Text search
    if (query) {
      filter.$text = { $search: query };
    }
    
    // Category filter
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    // Subject filter
    if (subject && subject !== 'all') {
      filter.subject = subject;
    }
    
    // Difficulty filter
    if (difficulty && difficulty !== 'all') {
      filter.difficulty = difficulty;
    }
    
    // Tags filter
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      filter.tags = { $in: tagArray };
    }

    const skip = (page - 1) * limit;
    
    const resources = await LearningResource.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email')
      .lean();

    const total = await LearningResource.countDocuments(filter);

    // Get progress for each resource for the current student
    const userId = req.user._id;
    const resourceIds = resources.map(r => r._id);
    const progressRecords = await StudentProgress.find({
      student: userId,
      learningResource: { $in: resourceIds }
    }).lean();

    const progressMap = {};
    progressRecords.forEach(p => {
      progressMap[p.learningResource.toString()] = p;
    });

    // Attach progress to resources
    const resourcesWithProgress = resources.map(resource => ({
      ...resource,
      progress: progressMap[resource._id.toString()] || null
    }));

    res.json({
      success: true,
      data: {
        resources: resourcesWithProgress,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalResources: total,
          hasMore: skip + resources.length < total
        }
      }
    });
  } catch (error) {
    console.error('Search resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search resources',
      error: error.message
    });
  }
};

export const getResourceById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const resource = await LearningResource.findById(id)
      .populate('createdBy', 'name email')
      .populate('relatedQuizzes', 'title description');

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Increment views
    resource.views += 1;
    await resource.save();

    // Get student's progress
    const progress = await StudentProgress.findOne({
      student: req.user._id,
      learningResource: id
    });

    res.json({
      success: true,
      data: {
        resource,
        progress
      }
    });
  } catch (error) {
    console.error('Get resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resource',
      error: error.message
    });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's saved resources only
    const userSavedResources = await LearningResource.find({ 
      createdBy: userId
    })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email')
      .lean();

    // Get student's completed and in-progress resources for progress tracking
    const studentProgress = await StudentProgress.find({ student: userId })
      .populate('learningResource')
      .lean();

    const completedSubjects = new Set();
    const inProgressTopics = new Set();
    
    studentProgress.forEach(progress => {
      if (progress.learningResource) {
        if (progress.status === 'completed') {
          completedSubjects.add(progress.learningResource.subject);
        }
        progress.learningResource.topics?.forEach(topic => {
          inProgressTopics.add(topic);
        });
      }
    });

    // Get weak areas from quiz submissions (you can extend this)
    // For now, recommend resources based on subjects and topics
    
    const recommendations = await LearningResource.find({
      isPublic: true,
      $or: [
        { subject: { $in: Array.from(completedSubjects) } },
        { topics: { $in: Array.from(inProgressTopics) } }
      ]
    })
      .limit(10)
      .sort({ views: -1, createdAt: -1 })
      .populate('createdBy', 'name email')
      .lean();

    // Get popular resources
    const popularResources = await LearningResource.find({ isPublic: true })
      .sort({ views: -1, likes: -1 })
      .limit(6)
      .populate('createdBy', 'name email')
      .lean();

    // Get recent resources
    const recentResources = await LearningResource.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('createdBy', 'name email')
      .lean();

    res.json({
      success: true,
      data: {
        personalized: userSavedResources, // User's own saved resources
        popular: popularResources,
        recent: recentResources
      }
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommendations',
      error: error.message
    });
  }
};

export const updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, progressPercentage, timeSpent, notes, rating } = req.body;
    const userId = req.user._id;

    // Check if resource exists
    const resource = await LearningResource.findById(id);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Find or create progress record
    let progress = await StudentProgress.findOne({
      student: userId,
      learningResource: id
    });

    if (!progress) {
      progress = new StudentProgress({
        student: userId,
        learningResource: id
      });
    }

    // Update fields
    if (status !== undefined) progress.status = status;
    if (progressPercentage !== undefined) progress.progressPercentage = progressPercentage;
    if (timeSpent !== undefined) progress.timeSpent += timeSpent;
    if (notes !== undefined) progress.notes = notes;
    if (rating !== undefined) progress.rating = rating;
    
    progress.lastAccessedAt = new Date();
    
    if (status === 'completed' && !progress.completedAt) {
      progress.completedAt = new Date();
      progress.progressPercentage = 100;
    }

    await progress.save();

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update progress',
      error: error.message
    });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const resource = await LearningResource.findById(id);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    const likeIndex = resource.likes.indexOf(userId);
    
    if (likeIndex > -1) {
      // Unlike
      resource.likes.splice(likeIndex, 1);
    } else {
      // Like
      resource.likes.push(userId);
    }

    await resource.save();

    res.json({
      success: true,
      data: {
        liked: likeIndex === -1,
        likesCount: resource.likes.length
      }
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle like',
      error: error.message
    });
  }
};

export const getSubjects = async (req, res) => {
  try {
    const subjects = await LearningResource.distinct('subject', { isPublic: true });
    res.json({
      success: true,
      data: subjects.sort()
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subjects',
      error: error.message
    });
  }
};

export const getMyProgress = async (req, res) => {
  try {
    const userId = req.user._id;

    const allProgress = await StudentProgress.find({ student: userId })
      .populate('learningResource')
      .sort({ lastAccessedAt: -1 })
      .lean();

    const stats = {
      total: allProgress.length,
      completed: allProgress.filter(p => p.status === 'completed').length,
      inProgress: allProgress.filter(p => p.status === 'in-progress').length,
      totalTimeSpent: allProgress.reduce((sum, p) => sum + p.timeSpent, 0)
    };

    res.json({
      success: true,
      data: {
        stats,
        progress: allProgress
      }
    });
  } catch (error) {
    console.error('Get my progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch progress',
      error: error.message
    });
  }
};

export const createResource = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can create learning resources'
      });
    }

    const resourceData = {
      ...req.body,
      createdBy: req.user._id
    };

    const resource = new LearningResource(resourceData);
    await resource.save();

    res.status(201).json({
      success: true,
      data: resource
    });
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create resource',
      error: error.message
    });
  }
};

export const updateResource = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update learning resources'
      });
    }

    const { id } = req.params;
    const resource = await LearningResource.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    res.json({
      success: true,
      data: resource
    });
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update resource',
      error: error.message
    });
  }
};

export const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await LearningResource.findById(id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Check if user owns the resource or is admin
    if (resource.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own resources'
      });
    }

    // Permanently delete the resource
    await LearningResource.findByIdAndDelete(id);
    
    // Also delete associated progress records
    await StudentProgress.deleteMany({ learningResource: id });

    res.json({
      success: true,
      message: 'Resource deleted successfully'
    });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete resource',
      error: error.message
    });
  }
};

export const getArchivedResources = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all resources archived by this user
    const archivedResources = await LearningResource.find({
      'archivedBy.userId': userId
    })
      .sort({ 'archivedBy.archivedAt': -1 })
      .limit(50);

    // Filter to only show the ones archived by this specific user
    const filtered = archivedResources.filter(resource => 
      resource.archivedBy.some(archive => 
        archive.userId.toString() === userId.toString()
      )
    );

    res.json({
      success: true,
      resources: filtered
    });
  } catch (error) {
    console.error('Get archived resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get archived resources',
      error: error.message
    });
  }
};

export const autoGenerate = async (req, res) => {
  try {
    const { query, preferredType = 'all', videoType = 'all' } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query is required'
      });
    }

    // Search Google and YouTube for resources (returns categorized results)
    const results = await autoGenerateResources(query, preferredType, videoType);

    // Transform results into 4 organized sections
    const organizedResults = {
      academic: results.academic.map(item => transformResource(item, query)),
      learningPlatforms: results.learningPlatforms.map(item => transformResource(item, query)),
      technicalArticles: results.technicalArticles.map(item => transformResource(item, query)),
      videoTutorials: results.videoTutorials.map(item => transformResource(item, query, true)),
      query: results.query,
      generatedAt: results.generatedAt,
      totalResults: results.totalResults,
    };

    // Debug: Log sample video to check URL structure
    if (organizedResults.videoTutorials.length > 0) {
      console.log('📹 Sample Video Data:', JSON.stringify({
        title: organizedResults.videoTutorials[0].title,
        url: organizedResults.videoTutorials[0].url,
        content: organizedResults.videoTutorials[0].content,
        thumbnail: organizedResults.videoTutorials[0].thumbnail,
        thumbnailUrl: organizedResults.videoTutorials[0].thumbnailUrl,
      }, null, 2));
    }

    res.json({
      success: true,
      data: organizedResults,
      message: `Found ${organizedResults.totalResults} high-quality resources across 4 categories`
    });
  } catch (error) {
    console.error('Auto-generate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-generate resources',
      error: error.message
    });
  }
};

export const saveGeneratedResource = async (req, res) => {
  try {
    const resourceData = {
      ...req.body,
      createdBy: req.user._id,
      isPublic: false, // Make resources private to the user who saved them
    };

    // Remove auto-generated flag and score
    delete resourceData.isAutoGenerated;
    delete resourceData.score;
    delete resourceData.viewCount;
    delete resourceData.likeCount;
    delete resourceData.duration;

    const resource = new LearningResource(resourceData);
    await resource.save();

    res.status(201).json({
      success: true,
      data: resource,
      message: 'Resource saved successfully'
    });
  } catch (error) {
    console.error('Save generated resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save resource',
      error: error.message
    });
  }
};

/**
 * Helper: Transform raw search result into resource format
 */
function transformResource(item, query, isVideo = false) {
  return {
    title: item.title,
    description: item.description,
    category: isVideo ? 'video' : 'article',
    subject: extractTopics(query)[0] || 'General',
    topics: extractTopics(query),
    difficulty: item.difficulty || determineDifficulty(item.title, item.description),
    content: item.url,
    url: item.url, // Direct video/article URL
    contentType: isVideo ? 'video-url' : 'url',
    thumbnailUrl: item.thumbnail || item.thumbnailUrl || '',
    thumbnail: item.thumbnail || item.thumbnailUrl || '', // Add both for compatibility
    tags: extractTopics(query).map(t => t.toLowerCase()),
    estimatedTime: item.estimatedTime || estimateTime(isVideo ? 'video-url' : 'url', item.description),
    source: item.source,
    score: item.score,
    viewCount: item.views || item.viewCount || 0,
    likeCount: item.likes || item.likeCount || 0,
    duration: item.duration || '',
    isAutoGenerated: true,
  };
}

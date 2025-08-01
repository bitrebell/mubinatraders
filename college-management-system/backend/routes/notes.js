const express = require('express');
const { body, query } = require('express-validator');
const Note = require('../models/Note');
const User = require('../models/User');
const Course = require('../models/Course');
const { auth, authorize, requireEmailVerification, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// @route   GET /api/notes
// @desc    Get all notes with filtering and pagination
// @access  Public (with optional auth for personalization)
router.get('/', [
  optionalAuth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1-50'),
  query('course').optional().isMongoId().withMessage('Invalid course ID'),
  query('semester').optional().isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1-8'),
  query('subject').optional().trim(),
  query('noteType').optional().isIn(['lecture', 'assignment', 'practical', 'reference', 'exam', 'project']),
  query('status').optional().isIn(['pending', 'approved', 'rejected']),
  query('sortBy').optional().isIn(['createdAt', 'downloads', 'likes', 'views']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], validate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { isActive: true };
    
    // Only show approved notes for students and non-authenticated users
    if (!req.user || req.user.role === 'student') {
      filter.status = 'approved';
    }

    if (req.query.course) filter.course = req.query.course;
    if (req.query.semester) filter.semester = parseInt(req.query.semester);
    if (req.query.subject) filter['subject.name'] = { $regex: req.query.subject, $options: 'i' };
    if (req.query.noteType) filter.noteType = req.query.noteType;
    if (req.query.status && req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) {
      filter.status = req.query.status;
    }

    // Search functionality
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { 'subject.name': { $regex: req.query.search, $options: 'i' } },
        { chapter: { $regex: req.query.search, $options: 'i' } },
        { topic: { $regex: req.query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(req.query.search, 'i')] } }
      ];
    }

    // User-specific filtering
    if (req.user && req.user.role === 'student') {
      // Show notes for user's course and semester, or public notes
      filter.$or = [
        { course: req.user.course, semester: req.user.semester },
        { visibility: 'public' }
      ];
    }

    // Sorting
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    let sortObj = {};
    
    if (sortBy === 'downloads') {
      sortObj = { 'downloads': sortOrder };
    } else if (sortBy === 'likes') {
      sortObj = { 'likes': sortOrder };
    } else if (sortBy === 'views') {
      sortObj = { 'views': sortOrder };
    } else {
      sortObj[sortBy] = sortOrder;
    }

    const notes = await Note.find(filter)
      .populate('uploadedBy', 'firstName lastName email role')
      .populate('approvedBy', 'firstName lastName email')
      .populate('course', 'name code department')
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    const total = await Note.countDocuments(filter);

    // Add user interaction data if authenticated
    const notesWithUserData = notes.map(note => {
      const noteObj = note.toObject();
      if (req.user) {
        noteObj.userLiked = note.likes.some(like => like.user.toString() === req.user.id);
        noteObj.userViewed = note.views.some(view => view.user.toString() === req.user.id);
      }
      return noteObj;
    });

    res.json({
      success: true,
      data: {
        notes: notesWithUserData,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notes'
    });
  }
});

// @route   GET /api/notes/:id
// @desc    Get single note
// @access  Public (with optional auth for view tracking)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const note = await Note.findOne({ 
      _id: req.params.id, 
      isActive: true 
    })
      .populate('uploadedBy', 'firstName lastName email role department')
      .populate('approvedBy', 'firstName lastName email')
      .populate('course', 'name code department')
      .populate('comments.user', 'firstName lastName avatar');

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check if user can view this note
    if (note.status !== 'approved' && (!req.user || (req.user.role === 'student' && note.uploadedBy._id.toString() !== req.user.id))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Track view if user is authenticated
    if (req.user) {
      const existingView = note.views.find(view => view.user.toString() === req.user.id);
      if (!existingView) {
        note.views.push({
          user: req.user.id,
          viewedAt: new Date(),
          ipAddress: req.ip
        });
        await note.save();
      }
    }

    const noteObj = note.toObject();
    if (req.user) {
      noteObj.userLiked = note.likes.some(like => like.user.toString() === req.user.id);
    }

    res.json({
      success: true,
      data: noteObj
    });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching note'
    });
  }
});

// @route   POST /api/notes
// @desc    Create new note
// @access  Private (Student/Teacher)
router.post('/', [
  auth,
  requireEmailVerification,
  authorize('student', 'teacher', 'admin'),
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be between 5-200 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('subject.name').trim().isLength({ min: 2 }).withMessage('Subject name is required'),
  body('subject.code').trim().isLength({ min: 2 }).withMessage('Subject code is required'),
  body('course').isMongoId().withMessage('Valid course ID is required'),
  body('semester').isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1-8'),
  body('noteType').isIn(['lecture', 'assignment', 'practical', 'reference', 'exam', 'project']),
  body('chapter').optional().trim(),
  body('topic').optional().trim(),
  body('visibility').optional().isIn(['public', 'course-specific', 'semester-specific']),
  body('tags').optional().isArray()
], validate, async (req, res) => {
  try {
    // Verify course exists
    const course = await Course.findById(req.body.course);
    if (!course) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course selected'
      });
    }

    const noteData = {
      ...req.body,
      uploadedBy: req.user.id,
      status: req.user.role === 'teacher' || req.user.role === 'admin' ? 'approved' : 'pending'
    };

    const note = new Note(noteData);
    await note.save();

    await note.populate('uploadedBy', 'firstName lastName email role');
    await note.populate('course', 'name code department');

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: note
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating note'
    });
  }
});

// @route   PUT /api/notes/:id
// @desc    Update note
// @access  Private (Owner/Admin)
router.put('/:id', [
  auth,
  requireEmailVerification,
  authorize('student', 'teacher', 'admin'),
  body('title').optional().trim().isLength({ min: 5, max: 200 }),
  body('description').optional().trim().isLength({ min: 10 }),
  body('status').optional().isIn(['pending', 'approved', 'rejected'])
], validate, async (req, res) => {
  try {
    const note = await Note.findOne({ 
      _id: req.params.id, 
      isActive: true 
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check ownership or admin privileges
    const isOwner = note.uploadedBy.toString() === req.user.id;
    const canModerate = req.user.role === 'teacher' || req.user.role === 'admin';
    
    if (!isOwner && !canModerate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Only moderators can change status
    if (req.body.status && !canModerate) {
      return res.status(403).json({
        success: false,
        message: 'Only teachers and admins can change note status'
      });
    }

    // Update note
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        note[key] = req.body[key];
      }
    });

    // Set approver if status is being changed to approved
    if (req.body.status === 'approved' && canModerate) {
      note.approvedBy = req.user.id;
    }

    await note.save();
    await note.populate('uploadedBy', 'firstName lastName email role');
    await note.populate('course', 'name code department');

    res.json({
      success: true,
      message: 'Note updated successfully',
      data: note
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating note'
    });
  }
});

// @route   DELETE /api/notes/:id
// @desc    Delete note (soft delete)
// @access  Private (Owner/Admin)
router.delete('/:id', [
  auth,
  requireEmailVerification,
  authorize('student', 'teacher', 'admin')
], async (req, res) => {
  try {
    const note = await Note.findOne({ 
      _id: req.params.id, 
      isActive: true 
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check ownership (admin can delete any note)
    if (req.user.role !== 'admin' && note.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    note.isActive = false;
    await note.save();

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting note'
    });
  }
});

// @route   POST /api/notes/:id/like
// @desc    Like/Unlike a note
// @access  Private
router.post('/:id/like', [
  auth,
  requireEmailVerification
], async (req, res) => {
  try {
    const note = await Note.findOne({ 
      _id: req.params.id, 
      isActive: true,
      status: 'approved'
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    const existingLike = note.likes.find(like => like.user.toString() === req.user.id);
    
    if (existingLike) {
      // Unlike
      note.likes = note.likes.filter(like => like.user.toString() !== req.user.id);
    } else {
      // Like
      note.likes.push({
        user: req.user.id,
        likedAt: new Date()
      });
    }

    await note.save();

    res.json({
      success: true,
      message: existingLike ? 'Note unliked' : 'Note liked',
      data: {
        liked: !existingLike,
        likeCount: note.likes.length
      }
    });
  } catch (error) {
    console.error('Like note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing like'
    });
  }
});

// @route   POST /api/notes/:id/comment
// @desc    Add comment to note
// @access  Private
router.post('/:id/comment', [
  auth,
  requireEmailVerification,
  body('text').trim().isLength({ min: 1, max: 500 }).withMessage('Comment must be between 1-500 characters')
], validate, async (req, res) => {
  try {
    const note = await Note.findOne({ 
      _id: req.params.id, 
      isActive: true,
      status: 'approved'
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    note.comments.push({
      user: req.user.id,
      text: req.body.text,
      createdAt: new Date()
    });

    await note.save();
    await note.populate('comments.user', 'firstName lastName avatar');

    const newComment = note.comments[note.comments.length - 1];

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: newComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding comment'
    });
  }
});

// @route   DELETE /api/notes/:noteId/comment/:commentId
// @desc    Delete comment
// @access  Private (Comment owner/Admin)
router.delete('/:noteId/comment/:commentId', [
  auth,
  requireEmailVerification
], async (req, res) => {
  try {
    const note = await Note.findOne({ 
      _id: req.params.noteId, 
      isActive: true 
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    const comment = note.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check ownership (admin can delete any comment)
    if (req.user.role !== 'admin' && comment.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    comment.remove();
    await note.save();

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting comment'
    });
  }
});

// @route   POST /api/notes/:id/download
// @desc    Track note download
// @access  Private
router.post('/:id/download', [
  auth,
  requireEmailVerification
], async (req, res) => {
  try {
    const note = await Note.findOne({ 
      _id: req.params.id, 
      isActive: true,
      status: 'approved'
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Track download
    note.downloads.push({
      user: req.user.id,
      downloadedAt: new Date(),
      ipAddress: req.ip
    });

    await note.save();

    res.json({
      success: true,
      message: 'Download tracked successfully',
      data: {
        downloadCount: note.downloads.length
      }
    });
  } catch (error) {
    console.error('Track download error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while tracking download'
    });
  }
});

// @route   GET /api/notes/user/uploaded
// @desc    Get user's uploaded notes
// @access  Private
router.get('/user/uploaded', [
  auth,
  requireEmailVerification
], async (req, res) => {
  try {
    const notes = await Note.find({
      uploadedBy: req.user.id,
      isActive: true
    })
      .populate('course', 'name code department')
      .populate('approvedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: notes
    });
  } catch (error) {
    console.error('Get user notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user notes'
    });
  }
});

module.exports = router;

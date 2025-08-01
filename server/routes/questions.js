const express = require('express');
const { body, validationResult } = require('express-validator');
const QuestionPaper = require('../models/QuestionPaper');
const User = require('../models/User');
const { auth, teacherAuth } = require('../middleware/auth');
const { upload, handleMulterError } = require('../config/multer');
const emailService = require('../services/emailService');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Get all question papers with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      department,
      semester,
      subject,
      examType,
      year,
      search,
      sortBy = 'year',
      sortOrder = 'desc',
      approved = 'true'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (approved === 'true') {
      filter.isApproved = true;
    }
    
    if (department && department !== 'all') {
      filter.department = department;
    }
    
    if (semester && semester !== 'all') {
      filter.semester = parseInt(semester);
    }
    
    if (subject && subject !== 'all') {
      filter.subject = new RegExp(subject, 'i');
    }
    
    if (examType && examType !== 'all') {
      filter.examType = examType;
    }
    
    if (year && year !== 'all') {
      filter.year = parseInt(year);
    }
    
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { subject: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [papers, totalCount] = await Promise.all([
      QuestionPaper.find(filter)
        .populate('uploadedBy', 'name email role')
        .populate('approvedBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      QuestionPaper.countDocuments(filter)
    ]);

    res.json({
      papers,
      totalCount,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      currentPage: parseInt(page),
      hasNext: skip + papers.length < totalCount,
      hasPrev: parseInt(page) > 1
    });
  } catch (error) {
    console.error('Get question papers error:', error);
    res.status(500).json({ message: 'Server error while fetching question papers' });
  }
});

// Get single question paper by ID
router.get('/:id', async (req, res) => {
  try {
    const paper = await QuestionPaper.findById(req.params.id)
      .populate('uploadedBy', 'name email role avatar')
      .populate('approvedBy', 'name email')
      .populate('solutions.uploadedBy', 'name email');

    if (!paper) {
      return res.status(404).json({ message: 'Question paper not found' });
    }

    // Check if paper is approved or user has permission to view
    if (!paper.isApproved && (!req.user || 
        (req.user._id.toString() !== paper.uploadedBy._id.toString() && 
         req.user.role !== 'admin' && req.user.role !== 'teacher'))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(paper);
  } catch (error) {
    console.error('Get question paper error:', error);
    res.status(500).json({ message: 'Server error while fetching question paper' });
  }
});

// Upload new question paper
router.post('/', auth, upload.single('file'), handleMulterError, [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('semester').isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8'),
  body('examType').isIn(['midterm', 'final', 'quiz', 'assignment', 'practical']).withMessage('Invalid exam type'),
  body('year').isInt({ min: 2000, max: new Date().getFullYear() + 1 }).withMessage('Invalid year')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Delete uploaded file if validation fails
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      }
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }

    const { 
      title, subject, department, semester, examType, year, month, 
      duration, maxMarks, difficulty, tags, syllabus, visibility 
    } = req.body;

    // Parse tags if provided
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        parsedTags = tags.split(',').map(tag => tag.trim());
      }
    }

    const questionPaper = new QuestionPaper({
      title,
      subject,
      department,
      semester: parseInt(semester),
      examType,
      year: parseInt(year),
      month,
      duration,
      maxMarks: maxMarks ? parseInt(maxMarks) : undefined,
      difficulty: difficulty || 'medium',
      fileUrl: `/uploads/questions/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      uploadedBy: req.user._id,
      tags: parsedTags,
      syllabus,
      visibility: visibility || 'public',
      isApproved: req.user.role === 'teacher' || req.user.role === 'admin'
    });

    await questionPaper.save();
    await questionPaper.populate('uploadedBy', 'name email role');

    // If auto-approved, send notifications
    if (questionPaper.isApproved) {
      // Find users who want notifications for new question papers
      const interestedUsers = await User.find({
        department: questionPaper.department,
        'notifications.email': true,
        'notifications.newQuestions': true,
        _id: { $ne: req.user._id } // Exclude the uploader
      });

      // Send notifications in background
      if (interestedUsers.length > 0) {
        setImmediate(async () => {
          try {
            await Promise.allSettled(
              interestedUsers.map(user => 
                emailService.sendNewQuestionPaperNotification(
                  user.email, 
                  user.name, 
                  questionPaper.title, 
                  questionPaper.subject, 
                  questionPaper.department,
                  questionPaper.year
                )
              )
            );
          } catch (error) {
            console.error('Error sending notifications:', error);
          }
        });
      }
    }

    res.status(201).json({
      message: questionPaper.isApproved ? 'Question paper uploaded and published successfully' : 'Question paper uploaded and pending approval',
      paper: questionPaper
    });
  } catch (error) {
    // Delete uploaded file if database save fails
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    console.error('Upload question paper error:', error);
    res.status(500).json({ message: 'Server error while uploading question paper' });
  }
});

// Approve/Reject question paper (Teacher/Admin only)
router.patch('/:id/approve', auth, teacherAuth, async (req, res) => {
  try {
    const { approved, rejectionReason } = req.body;
    
    const paper = await QuestionPaper.findById(req.params.id)
      .populate('uploadedBy', 'name email');

    if (!paper) {
      return res.status(404).json({ message: 'Question paper not found' });
    }

    if (approved) {
      paper.isApproved = true;
      paper.approvedBy = req.user._id;
      paper.approvedAt = new Date();
      
      // Send notifications to interested users
      const interestedUsers = await User.find({
        department: paper.department,
        'notifications.email': true,
        'notifications.newQuestions': true,
        _id: { $ne: paper.uploadedBy._id }
      });

      if (interestedUsers.length > 0) {
        setImmediate(async () => {
          try {
            await Promise.allSettled(
              interestedUsers.map(user => 
                emailService.sendNewQuestionPaperNotification(
                  user.email, 
                  user.name, 
                  paper.title, 
                  paper.subject, 
                  paper.department,
                  paper.year
                )
              )
            );
          } catch (error) {
            console.error('Error sending notifications:', error);
          }
        });
      }
    } else {
      // If rejected, delete the file
      const filePath = path.join(__dirname, '..', paper.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting rejected file:', err);
        });
      }
      
      await QuestionPaper.findByIdAndDelete(req.params.id);
      
      // Optionally send rejection email to uploader
      if (rejectionReason) {
        try {
          await emailService.sendEmail(
            paper.uploadedBy.email,
            'Question Paper Submission Rejected',
            `Your question paper submission "${paper.title}" has been rejected. Reason: ${rejectionReason}`
          );
        } catch (error) {
          console.error('Error sending rejection email:', error);
        }
      }
      
      return res.json({ message: 'Question paper rejected and deleted' });
    }

    await paper.save();
    res.json({ message: 'Question paper approved successfully', paper });
  } catch (error) {
    console.error('Approve question paper error:', error);
    res.status(500).json({ message: 'Server error while processing approval' });
  }
});

// Download question paper file
router.get('/:id/download', async (req, res) => {
  try {
    const paper = await QuestionPaper.findById(req.params.id);
    
    if (!paper) {
      return res.status(404).json({ message: 'Question paper not found' });
    }

    // Check if paper is approved
    if (!paper.isApproved) {
      return res.status(403).json({ message: 'Question paper not approved for download' });
    }

    const filePath = path.join(__dirname, '..', paper.fileUrl);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Increment download count
    paper.downloads += 1;
    await paper.save();

    // Set proper headers
    res.setHeader('Content-Disposition', `attachment; filename="${paper.fileName}"`);
    res.setHeader('Content-Type', paper.fileType);
    
    // Send file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Server error while downloading file' });
  }
});

// Get unique years for filtering
router.get('/filters/years', async (req, res) => {
  try {
    const years = await QuestionPaper.distinct('year', { isApproved: true });
    res.json(years.sort((a, b) => b - a));
  } catch (error) {
    console.error('Get years error:', error);
    res.status(500).json({ message: 'Server error while fetching years' });
  }
});

// Get statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const { department, semester } = req.query;
    
    const filter = { isApproved: true };
    if (department && department !== 'all') filter.department = department;
    if (semester && semester !== 'all') filter.semester = parseInt(semester);

    const [
      totalPapers,
      papersByExamType,
      papersByYear,
      papersBySubject
    ] = await Promise.all([
      QuestionPaper.countDocuments(filter),
      QuestionPaper.aggregate([
        { $match: filter },
        { $group: { _id: '$examType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      QuestionPaper.aggregate([
        { $match: filter },
        { $group: { _id: '$year', count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
        { $limit: 5 }
      ]),
      QuestionPaper.aggregate([
        { $match: filter },
        { $group: { _id: '$subject', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      totalPapers,
      papersByExamType,
      papersByYear,
      papersBySubject
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error while fetching statistics' });
  }
});

// Delete question paper (Author/Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const paper = await QuestionPaper.findById(req.params.id);
    
    if (!paper) {
      return res.status(404).json({ message: 'Question paper not found' });
    }

    // Check permission
    if (req.user._id.toString() !== paper.uploadedBy.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete main file
    const filePath = path.join(__dirname, '..', paper.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    // Delete solution files
    paper.solutions.forEach(solution => {
      const solutionPath = path.join(__dirname, '..', solution.fileUrl);
      if (fs.existsSync(solutionPath)) {
        fs.unlink(solutionPath, (err) => {
          if (err) console.error('Error deleting solution file:', err);
        });
      }
    });

    await QuestionPaper.findByIdAndDelete(req.params.id);
    res.json({ message: 'Question paper deleted successfully' });
  } catch (error) {
    console.error('Delete question paper error:', error);
    res.status(500).json({ message: 'Server error while deleting question paper' });
  }
});

// Get user's uploaded question papers
router.get('/user/my-papers', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [papers, totalCount] = await Promise.all([
      QuestionPaper.find({ uploadedBy: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      QuestionPaper.countDocuments({ uploadedBy: req.user._id })
    ]);

    res.json({
      papers,
      totalCount,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Get user question papers error:', error);
    res.status(500).json({ message: 'Server error while fetching user question papers' });
  }
});

module.exports = router;

const express = require('express');
const { body, validationResult } = require('express-validator');
const Notes = require('../models/Notes');
const User = require('../models/User');
const { auth, teacherAuth } = require('../middleware/auth');
const { upload, handleMulterError } = require('../config/multer');
const emailService = require('../services/emailService');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Get all notes with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      department,
      semester,
      subject,
      search,
      sortBy = 'createdAt',
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
    
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [notes, totalCount] = await Promise.all([
      Notes.find(filter)
        .populate('uploadedBy', 'name email role')
        .populate('approvedBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Notes.countDocuments(filter)
    ]);

    res.json({
      notes,
      totalCount,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      currentPage: parseInt(page),
      hasNext: skip + notes.length < totalCount,
      hasPrev: parseInt(page) > 1
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ message: 'Server error while fetching notes' });
  }
});

// Get single note by ID
router.get('/:id', async (req, res) => {
  try {
    const note = await Notes.findById(req.params.id)
      .populate('uploadedBy', 'name email role avatar')
      .populate('approvedBy', 'name email');

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if note is approved or user has permission to view
    if (!note.isApproved && (!req.user || 
        (req.user._id.toString() !== note.uploadedBy._id.toString() && 
         req.user.role !== 'admin' && req.user.role !== 'teacher'))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(note);
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ message: 'Server error while fetching note' });
  }
});

// Upload new notes
router.post('/', auth, upload.single('file'), handleMulterError, [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('semester').isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8')
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

    const { title, description, subject, department, semester, unit, topic, tags, visibility } = req.body;

    // Parse tags if provided
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        parsedTags = tags.split(',').map(tag => tag.trim());
      }
    }

    const note = new Notes({
      title,
      description,
      subject,
      department,
      semester: parseInt(semester),
      unit,
      topic,
      fileUrl: `/uploads/notes/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      uploadedBy: req.user._id,
      tags: parsedTags,
      visibility: visibility || 'public',
      isApproved: req.user.role === 'teacher' || req.user.role === 'admin'
    });

    await note.save();
    await note.populate('uploadedBy', 'name email role');

    // If auto-approved, send notifications
    if (note.isApproved) {
      // Find users who want notifications for new notes
      const interestedUsers = await User.find({
        department: note.department,
        'notifications.email': true,
        'notifications.newNotes': true,
        _id: { $ne: req.user._id } // Exclude the uploader
      });

      // Send notifications in background
      if (interestedUsers.length > 0) {
        setImmediate(async () => {
          try {
            await Promise.allSettled(
              interestedUsers.map(user => 
                emailService.sendNewNotesNotification(
                  user.email, 
                  user.name, 
                  note.title, 
                  note.subject, 
                  note.department
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
      message: note.isApproved ? 'Notes uploaded and published successfully' : 'Notes uploaded and pending approval',
      note
    });
  } catch (error) {
    // Delete uploaded file if database save fails
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    console.error('Upload notes error:', error);
    res.status(500).json({ message: 'Server error while uploading notes' });
  }
});

// Approve/Reject notes (Teacher/Admin only)
router.patch('/:id/approve', auth, teacherAuth, async (req, res) => {
  try {
    const { approved, rejectionReason } = req.body;
    
    const note = await Notes.findById(req.params.id)
      .populate('uploadedBy', 'name email');

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (approved) {
      note.isApproved = true;
      note.approvedBy = req.user._id;
      note.approvedAt = new Date();
      
      // Send notifications to interested users
      const interestedUsers = await User.find({
        department: note.department,
        'notifications.email': true,
        'notifications.newNotes': true,
        _id: { $ne: note.uploadedBy._id }
      });

      if (interestedUsers.length > 0) {
        setImmediate(async () => {
          try {
            await Promise.allSettled(
              interestedUsers.map(user => 
                emailService.sendNewNotesNotification(
                  user.email, 
                  user.name, 
                  note.title, 
                  note.subject, 
                  note.department
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
      const filePath = path.join(__dirname, '..', note.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting rejected file:', err);
        });
      }
      
      await Notes.findByIdAndDelete(req.params.id);
      
      // Optionally send rejection email to uploader
      if (rejectionReason) {
        try {
          await emailService.sendEmail(
            note.uploadedBy.email,
            'Notes Submission Rejected',
            `Your notes submission "${note.title}" has been rejected. Reason: ${rejectionReason}`
          );
        } catch (error) {
          console.error('Error sending rejection email:', error);
        }
      }
      
      return res.json({ message: 'Notes rejected and deleted' });
    }

    await note.save();
    res.json({ message: 'Notes approved successfully', note });
  } catch (error) {
    console.error('Approve notes error:', error);
    res.status(500).json({ message: 'Server error while processing approval' });
  }
});

// Download note file
router.get('/:id/download', async (req, res) => {
  try {
    const note = await Notes.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if note is approved
    if (!note.isApproved) {
      return res.status(403).json({ message: 'Note not approved for download' });
    }

    const filePath = path.join(__dirname, '..', note.fileUrl);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Increment download count
    note.downloads += 1;
    await note.save();

    // Set proper headers
    res.setHeader('Content-Disposition', `attachment; filename="${note.fileName}"`);
    res.setHeader('Content-Type', note.fileType);
    
    // Send file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Server error while downloading file' });
  }
});

// Delete note (Author/Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Notes.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check permission
    if (req.user._id.toString() !== note.uploadedBy.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete file
    const filePath = path.join(__dirname, '..', note.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    await Notes.findByIdAndDelete(req.params.id);
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ message: 'Server error while deleting note' });
  }
});

// Get user's uploaded notes
router.get('/user/my-notes', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notes, totalCount] = await Promise.all([
      Notes.find({ uploadedBy: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notes.countDocuments({ uploadedBy: req.user._id })
    ]);

    res.json({
      notes,
      totalCount,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Get user notes error:', error);
    res.status(500).json({ message: 'Server error while fetching user notes' });
  }
});

module.exports = router;

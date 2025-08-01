const express = require('express');
const User = require('../models/User');
const Notes = require('../models/Notes');
const QuestionPaper = require('../models/QuestionPaper');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all users (Admin only)
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, department } = req.query;
    
    const filter = {};
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }
    if (role && role !== 'all') {
      filter.role = role;
    }
    if (department && department !== 'all') {
      filter.department = department;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [users, totalCount] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);

    res.json({
      users,
      totalCount,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

// Get user profile by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's upload statistics
    const [notesCount, questionsCount, totalDownloads] = await Promise.all([
      Notes.countDocuments({ uploadedBy: user._id, isApproved: true }),
      QuestionPaper.countDocuments({ uploadedBy: user._id, isApproved: true }),
      Notes.aggregate([
        { $match: { uploadedBy: user._id, isApproved: true } },
        { $group: { _id: null, total: { $sum: '$downloads' } } }
      ]).then(result => result[0]?.total || 0)
    ]);

    const userProfile = {
      ...user.toObject(),
      stats: {
        notesUploaded: notesCount,
        questionsUploaded: questionsCount,
        totalDownloads
      }
    };

    res.json(userProfile);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error while fetching user profile' });
  }
});

// Update user role (Admin only)
router.patch('/:id/role', auth, adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['student', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User role updated successfully', user });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Server error while updating user role' });
  }
});

// Verify user (Admin only)
router.patch('/:id/verify', auth, adminAuth, async (req, res) => {
  try {
    const { isVerified } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User verification status updated successfully', user });
  } catch (error) {
    console.error('Update user verification error:', error);
    res.status(500).json({ message: 'Server error while updating user verification' });
  }
});

// Delete user (Admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last admin user' });
      }
    }

    // Delete user's uploads (optional - you might want to keep them)
    // await Notes.deleteMany({ uploadedBy: user._id });
    // await QuestionPaper.deleteMany({ uploadedBy: user._id });

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error while deleting user' });
  }
});

// Get dashboard statistics
router.get('/stats/dashboard', auth, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const isTeacher = req.user.role === 'teacher' || req.user.role === 'admin';

    let filter = {};
    if (!isAdmin && !isTeacher) {
      // Students can only see their own stats
      filter = { uploadedBy: req.user._id };
    }

    const [
      totalUsers,
      totalNotes,
      totalQuestions,
      pendingApprovals,
      recentUploads,
      topUploaders
    ] = await Promise.all([
      isAdmin ? User.countDocuments() : Promise.resolve(0),
      Notes.countDocuments({ ...filter, isApproved: true }),
      QuestionPaper.countDocuments({ ...filter, isApproved: true }),
      isTeacher ? Promise.all([
        Notes.countDocuments({ isApproved: false }),
        QuestionPaper.countDocuments({ isApproved: false })
      ]).then(([notes, questions]) => notes + questions) : Promise.resolve(0),
      
      // Recent uploads (last 7 days)
      Promise.all([
        Notes.find({
          ...filter,
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }).populate('uploadedBy', 'name').sort({ createdAt: -1 }).limit(5),
        QuestionPaper.find({
          ...filter,
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }).populate('uploadedBy', 'name').sort({ createdAt: -1 }).limit(5)
      ]).then(([notes, questions]) => [...notes, ...questions].sort((a, b) => b.createdAt - a.createdAt).slice(0, 10)),

      // Top uploaders (if admin/teacher)
      isTeacher ? User.aggregate([
        {
          $lookup: {
            from: 'notes',
            localField: '_id',
            foreignField: 'uploadedBy',
            as: 'notes'
          }
        },
        {
          $lookup: {
            from: 'questionpapers',
            localField: '_id',
            foreignField: 'uploadedBy',
            as: 'questions'
          }
        },
        {
          $project: {
            name: 1,
            email: 1,
            department: 1,
            uploadCount: { $add: [{ $size: '$notes' }, { $size: '$questions' }] }
          }
        },
        { $sort: { uploadCount: -1 } },
        { $limit: 5 }
      ]) : Promise.resolve([])
    ]);

    res.json({
      totalUsers,
      totalNotes,
      totalQuestions,
      pendingApprovals,
      recentUploads,
      topUploaders
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error while fetching dashboard statistics' });
  }
});

// Get pending approvals (Teacher/Admin only)
router.get('/approvals/pending', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { page = 1, limit = 10, type = 'all' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let results = { notes: [], questions: [], totalCount: 0 };

    if (type === 'all' || type === 'notes') {
      const [notes, notesCount] = await Promise.all([
        Notes.find({ isApproved: false })
          .populate('uploadedBy', 'name email department')
          .sort({ createdAt: -1 })
          .skip(type === 'notes' ? skip : 0)
          .limit(type === 'notes' ? parseInt(limit) : 5),
        Notes.countDocuments({ isApproved: false })
      ]);
      results.notes = notes;
      if (type === 'notes') results.totalCount = notesCount;
    }

    if (type === 'all' || type === 'questions') {
      const [questions, questionsCount] = await Promise.all([
        QuestionPaper.find({ isApproved: false })
          .populate('uploadedBy', 'name email department')
          .sort({ createdAt: -1 })
          .skip(type === 'questions' ? skip : 0)
          .limit(type === 'questions' ? parseInt(limit) : 5),
        QuestionPaper.countDocuments({ isApproved: false })
      ]);
      results.questions = questions;
      if (type === 'questions') results.totalCount = questionsCount;
    }

    if (type === 'all') {
      results.totalCount = results.notes.length + results.questions.length;
    }

    res.json(results);
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ message: 'Server error while fetching pending approvals' });
  }
});

module.exports = router;

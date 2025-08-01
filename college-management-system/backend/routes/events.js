const express = require('express');
const { body, query } = require('express-validator');
const Event = require('../models/Event');
const User = require('../models/User');
const { auth, authorize, requireEmailVerification } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { sendEventNotification } = require('../utils/email');

const router = express.Router();

// @route   GET /api/events
// @desc    Get all events with filtering and pagination
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1-50'),
  query('eventType').optional().isIn(['academic', 'cultural', 'sports', 'workshop', 'seminar', 'exam', 'holiday', 'announcement']),
  query('status').optional().isIn(['draft', 'published', 'cancelled', 'completed']),
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  query('course').optional().isMongoId().withMessage('Invalid course ID'),
  query('semester').optional().isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1-8')
], validate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { isActive: true };
    
    // Only show published events for non-authenticated users
    if (!req.user || req.user.role === 'student') {
      filter.status = 'published';
    }

    if (req.query.eventType) filter.eventType = req.query.eventType;
    if (req.query.status && req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) {
      filter.status = req.query.status;
    }

    // Date filtering
    if (req.query.startDate || req.query.endDate) {
      filter.startDate = {};
      if (req.query.startDate) filter.startDate.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.startDate.$lte = new Date(req.query.endDate);
    }

    // Course and semester filtering
    if (req.query.course) {
      filter['targetAudience.courses'] = req.query.course;
    }
    if (req.query.semester) {
      filter['targetAudience.semesters'] = parseInt(req.query.semester);
    }

    // Search functionality
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(req.query.search, 'i')] } }
      ];
    }

    const events = await Event.find(filter)
      .populate('organizer', 'firstName lastName email role')
      .populate('targetAudience.courses', 'name code')
      .populate('registeredUsers.user', 'firstName lastName email')
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Event.countDocuments(filter);

    res.json({
      success: true,
      data: {
        events,
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
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching events'
    });
  }
});

// @route   GET /api/events/:id
// @desc    Get single event
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findOne({ 
      _id: req.params.id, 
      isActive: true 
    })
      .populate('organizer', 'firstName lastName email role department')
      .populate('targetAudience.courses', 'name code department')
      .populate('registeredUsers.user', 'firstName lastName email studentId course');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user can view this event
    if (event.status !== 'published' && (!req.user || req.user.role === 'student')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching event'
    });
  }
});

// @route   POST /api/events
// @desc    Create new event
// @access  Private (Teacher/Admin)
router.post('/', [
  auth,
  requireEmailVerification,
  authorize('teacher', 'admin'),
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be between 5-200 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('eventType').isIn(['academic', 'cultural', 'sports', 'workshop', 'seminar', 'exam', 'holiday', 'announcement']),
  body('startDate').isISO8601().withMessage('Invalid start date format'),
  body('endDate').isISO8601().withMessage('Invalid end date format'),
  body('startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
  body('endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
  body('venue').optional().trim(),
  body('targetAudience.courses').optional().isArray(),
  body('targetAudience.semesters').optional().isArray(),
  body('targetAudience.roles').optional().isArray(),
  body('registrationRequired').optional().isBoolean(),
  body('maxParticipants').optional().isInt({ min: 1 }),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('tags').optional().isArray()
], validate, async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      organizer: req.user.id
    };

    // Validate end date is after start date
    if (new Date(req.body.endDate) < new Date(req.body.startDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    const event = new Event(eventData);
    await event.save();

    await event.populate('organizer', 'firstName lastName email role');

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating event'
    });
  }
});

// @route   PUT /api/events/:id
// @desc    Update event
// @access  Private (Owner/Admin)
router.put('/:id', [
  auth,
  requireEmailVerification,
  authorize('teacher', 'admin'),
  body('title').optional().trim().isLength({ min: 5, max: 200 }),
  body('description').optional().trim().isLength({ min: 10 }),
  body('eventType').optional().isIn(['academic', 'cultural', 'sports', 'workshop', 'seminar', 'exam', 'holiday', 'announcement']),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('status').optional().isIn(['draft', 'published', 'cancelled', 'completed'])
], validate, async (req, res) => {
  try {
    const event = await Event.findOne({ 
      _id: req.params.id, 
      isActive: true 
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check ownership (admin can edit any event)
    if (req.user.role !== 'admin' && event.organizer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update event
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        event[key] = req.body[key];
      }
    });

    await event.save();
    await event.populate('organizer', 'firstName lastName email role');

    // Send notification if event is published
    if (req.body.status === 'published' && event.status !== 'published') {
      // Get target audience emails
      const users = await User.find({
        isActive: true,
        isEmailVerified: true,
        $or: [
          { course: { $in: event.targetAudience.courses } },
          { role: { $in: event.targetAudience.roles } }
        ]
      });

      const emails = users.map(user => user.email);
      if (emails.length > 0) {
        await sendEventNotification(emails, event);
      }
    }

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating event'
    });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete event (soft delete)
// @access  Private (Owner/Admin)
router.delete('/:id', [
  auth,
  requireEmailVerification,
  authorize('teacher', 'admin')
], async (req, res) => {
  try {
    const event = await Event.findOne({ 
      _id: req.params.id, 
      isActive: true 
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check ownership (admin can delete any event)
    if (req.user.role !== 'admin' && event.organizer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    event.isActive = false;
    await event.save();

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting event'
    });
  }
});

// @route   POST /api/events/:id/register
// @desc    Register for an event
// @access  Private (Student)
router.post('/:id/register', [
  auth,
  requireEmailVerification,
  authorize('student')
], async (req, res) => {
  try {
    const event = await Event.findOne({ 
      _id: req.params.id, 
      isActive: true,
      status: 'published'
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or not available for registration'
      });
    }

    // Check if registration is required
    if (!event.registrationRequired) {
      return res.status(400).json({
        success: false,
        message: 'This event does not require registration'
      });
    }

    // Check registration deadline
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed'
      });
    }

    // Check if already registered
    const alreadyRegistered = event.registeredUsers.some(
      reg => reg.user.toString() === req.user.id
    );

    if (alreadyRegistered) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }

    // Check capacity
    if (event.maxParticipants && event.registeredUsers.length >= event.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Event is full. No more registrations allowed'
      });
    }

    // Register user
    event.registeredUsers.push({
      user: req.user.id,
      registeredAt: new Date()
    });

    await event.save();

    res.json({
      success: true,
      message: 'Registration successful',
      data: {
        eventId: event._id,
        registrationCount: event.registredUsers.length
      }
    });
  } catch (error) {
    console.error('Event registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while registering for event'
    });
  }
});

// @route   DELETE /api/events/:id/register
// @desc    Unregister from an event
// @access  Private (Student)
router.delete('/:id/register', [
  auth,
  requireEmailVerification,
  authorize('student')
], async (req, res) => {
  try {
    const event = await Event.findOne({ 
      _id: req.params.id, 
      isActive: true 
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if registered
    const registrationIndex = event.registeredUsers.findIndex(
      reg => reg.user.toString() === req.user.id
    );

    if (registrationIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'You are not registered for this event'
      });
    }

    // Remove registration
    event.registeredUsers.splice(registrationIndex, 1);
    await event.save();

    res.json({
      success: true,
      message: 'Unregistration successful'
    });
  } catch (error) {
    console.error('Event unregistration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while unregistering from event'
    });
  }
});

// @route   GET /api/events/user/registered
// @desc    Get user's registered events
// @access  Private (Student)
router.get('/user/registered', [
  auth,
  requireEmailVerification,
  authorize('student')
], async (req, res) => {
  try {
    const events = await Event.find({
      'registeredUsers.user': req.user.id,
      isActive: true
    })
      .populate('organizer', 'firstName lastName email role')
      .populate('targetAudience.courses', 'name code')
      .sort({ startDate: 1 });

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Get registered events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching registered events'
    });
  }
});

module.exports = router;

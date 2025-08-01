const express = require('express');
const { body, query } = require('express-validator');
const Course = require('../models/Course');
const { auth, authorize, requireEmailVerification } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// @route   GET /api/courses
// @desc    Get all courses
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1-50'),
  query('department').optional().trim(),
  query('search').optional().trim()
], validate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { isActive: true };
    
    if (req.query.department) {
      filter.department = { $regex: req.query.department, $options: 'i' };
    }

    // Search functionality
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { code: { $regex: req.query.search, $options: 'i' } },
        { department: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const courses = await Course.find(filter)
      .sort({ department: 1, name: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Course.countDocuments(filter);

    res.json({
      success: true,
      data: {
        courses,
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
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching courses'
    });
  }
});

// @route   GET /api/courses/:id
// @desc    Get single course
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findOne({ 
      _id: req.params.id, 
      isActive: true 
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching course'
    });
  }
});

// @route   GET /api/courses/:id/subjects
// @desc    Get subjects for a specific course and semester
// @access  Public
router.get('/:id/subjects', [
  query('semester').optional().isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1-8')
], validate, async (req, res) => {
  try {
    const course = await Course.findOne({ 
      _id: req.params.id, 
      isActive: true 
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    let subjects = course.subjects;

    // Filter by semester if provided
    if (req.query.semester) {
      subjects = subjects.filter(subject => subject.semester === parseInt(req.query.semester));
    }

    // Group subjects by semester
    const subjectsBySemester = {};
    subjects.forEach(subject => {
      if (!subjectsBySemester[subject.semester]) {
        subjectsBySemester[subject.semester] = [];
      }
      subjectsBySemester[subject.semester].push(subject);
    });

    res.json({
      success: true,
      data: {
        course: {
          _id: course._id,
          name: course.name,
          code: course.code,
          department: course.department
        },
        subjects: req.query.semester ? subjects : subjectsBySemester
      }
    });
  } catch (error) {
    console.error('Get course subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching course subjects'
    });
  }
});

// @route   POST /api/courses
// @desc    Create new course
// @access  Private (Admin only)
router.post('/', [
  auth,
  requireEmailVerification,
  authorize('admin'),
  body('name').trim().isLength({ min: 3, max: 100 }).withMessage('Course name must be between 3-100 characters'),
  body('code').trim().isLength({ min: 2, max: 10 }).withMessage('Course code must be between 2-10 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('duration').isInt({ min: 1, max: 6 }).withMessage('Duration must be between 1-6 years'),
  body('totalSemesters').isInt({ min: 2, max: 12 }).withMessage('Total semesters must be between 2-12'),
  body('department').trim().isLength({ min: 2 }).withMessage('Department is required'),
  body('subjects').isArray().withMessage('Subjects must be an array'),
  body('subjects.*.semester').isInt({ min: 1 }).withMessage('Subject semester is required'),
  body('subjects.*.subjectName').trim().isLength({ min: 2 }).withMessage('Subject name is required'),
  body('subjects.*.subjectCode').trim().isLength({ min: 2 }).withMessage('Subject code is required'),
  body('subjects.*.credits').isInt({ min: 1, max: 6 }).withMessage('Credits must be between 1-6'),
  body('subjects.*.isElective').optional().isBoolean()
], validate, async (req, res) => {
  try {
    const { name, code, description, duration, totalSemesters, department, subjects } = req.body;

    // Check if course code already exists
    const existingCourse = await Course.findOne({ code: code.toUpperCase() });
    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: 'Course code already exists'
      });
    }

    // Validate subject codes are unique within the course
    const subjectCodes = subjects.map(s => s.subjectCode.toUpperCase());
    const uniqueSubjectCodes = [...new Set(subjectCodes)];
    if (subjectCodes.length !== uniqueSubjectCodes.length) {
      return res.status(400).json({
        success: false,
        message: 'Subject codes must be unique within the course'
      });
    }

    // Validate semesters don't exceed totalSemesters
    const maxSemester = Math.max(...subjects.map(s => s.semester));
    if (maxSemester > totalSemesters) {
      return res.status(400).json({
        success: false,
        message: 'Subject semester cannot exceed total semesters'
      });
    }

    const course = new Course({
      name,
      code: code.toUpperCase(),
      description,
      duration,
      totalSemesters,
      department,
      subjects: subjects.map(subject => ({
        ...subject,
        subjectCode: subject.subjectCode.toUpperCase()
      }))
    });

    await course.save();

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating course'
    });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private (Admin only)
router.put('/:id', [
  auth,
  requireEmailVerification,
  authorize('admin'),
  body('name').optional().trim().isLength({ min: 3, max: 100 }),
  body('code').optional().trim().isLength({ min: 2, max: 10 }),
  body('description').optional().trim().isLength({ min: 10 }),
  body('duration').optional().isInt({ min: 1, max: 6 }),
  body('totalSemesters').optional().isInt({ min: 2, max: 12 }),
  body('department').optional().trim().isLength({ min: 2 }),
  body('subjects').optional().isArray()
], validate, async (req, res) => {
  try {
    const course = await Course.findOne({ 
      _id: req.params.id, 
      isActive: true 
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if course code is being changed and if it already exists
    if (req.body.code && req.body.code.toUpperCase() !== course.code) {
      const existingCourse = await Course.findOne({ code: req.body.code.toUpperCase() });
      if (existingCourse) {
        return res.status(400).json({
          success: false,
          message: 'Course code already exists'
        });
      }
    }

    // Update course
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        if (key === 'code') {
          course[key] = req.body[key].toUpperCase();
        } else if (key === 'subjects') {
          course[key] = req.body[key].map(subject => ({
            ...subject,
            subjectCode: subject.subjectCode.toUpperCase()
          }));
        } else {
          course[key] = req.body[key];
        }
      }
    });

    await course.save();

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating course'
    });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete course (soft delete)
// @access  Private (Admin only)
router.delete('/:id', [
  auth,
  requireEmailVerification,
  authorize('admin')
], async (req, res) => {
  try {
    const course = await Course.findOne({ 
      _id: req.params.id, 
      isActive: true 
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    course.isActive = false;
    await course.save();

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting course'
    });
  }
});

// @route   GET /api/courses/departments/list
// @desc    Get list of all departments
// @access  Public
router.get('/departments/list', async (req, res) => {
  try {
    const departments = await Course.distinct('department', { isActive: true });
    
    res.json({
      success: true,
      data: departments.sort()
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching departments'
    });
  }
});

// @route   POST /api/courses/:id/subjects
// @desc    Add subject to course
// @access  Private (Admin only)
router.post('/:id/subjects', [
  auth,
  requireEmailVerification,
  authorize('admin'),
  body('semester').isInt({ min: 1 }).withMessage('Subject semester is required'),
  body('subjectName').trim().isLength({ min: 2 }).withMessage('Subject name is required'),
  body('subjectCode').trim().isLength({ min: 2 }).withMessage('Subject code is required'),
  body('credits').isInt({ min: 1, max: 6 }).withMessage('Credits must be between 1-6'),
  body('isElective').optional().isBoolean()
], validate, async (req, res) => {
  try {
    const course = await Course.findOne({ 
      _id: req.params.id, 
      isActive: true 
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const { semester, subjectName, subjectCode, credits, isElective } = req.body;

    // Check if subject code already exists in this course
    const existingSubject = course.subjects.find(
      subject => subject.subjectCode.toUpperCase() === subjectCode.toUpperCase()
    );

    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: 'Subject code already exists in this course'
      });
    }

    // Validate semester doesn't exceed total semesters
    if (semester > course.totalSemesters) {
      return res.status(400).json({
        success: false,
        message: 'Subject semester cannot exceed total semesters'
      });
    }

    // Add subject
    course.subjects.push({
      semester,
      subjectName,
      subjectCode: subjectCode.toUpperCase(),
      credits,
      isElective: isElective || false
    });

    await course.save();

    res.status(201).json({
      success: true,
      message: 'Subject added successfully',
      data: course
    });
  } catch (error) {
    console.error('Add subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding subject'
    });
  }
});

// @route   DELETE /api/courses/:courseId/subjects/:subjectId
// @desc    Remove subject from course
// @access  Private (Admin only)
router.delete('/:courseId/subjects/:subjectId', [
  auth,
  requireEmailVerification,
  authorize('admin')
], async (req, res) => {
  try {
    const course = await Course.findOne({ 
      _id: req.params.courseId, 
      isActive: true 
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const subject = course.subjects.id(req.params.subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    subject.remove();
    await course.save();

    res.json({
      success: true,
      message: 'Subject removed successfully'
    });
  } catch (error) {
    console.error('Remove subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing subject'
    });
  }
});

module.exports = router;

const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true,
    unique: true
  },
  code: {
    type: String,
    required: [true, 'Course code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Course description is required']
  },
  duration: {
    type: Number,
    required: [true, 'Course duration in years is required'],
    min: 1,
    max: 6
  },
  totalSemesters: {
    type: Number,
    required: [true, 'Total semesters is required'],
    min: 2,
    max: 12
  },
  department: {
    type: String,
    required: [true, 'Department is required']
  },
  subjects: [{
    semester: {
      type: Number,
      required: true,
      min: 1
    },
    subjectName: {
      type: String,
      required: true,
      trim: true
    },
    subjectCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    credits: {
      type: Number,
      required: true,
      min: 1,
      max: 6
    },
    isElective: {
      type: Boolean,
      default: false
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better performance
courseSchema.index({ code: 1 });
courseSchema.index({ department: 1 });
courseSchema.index({ 'subjects.semester': 1 });

module.exports = mongoose.model('Course', courseSchema);

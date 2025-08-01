const mongoose = require('mongoose');

const questionPaperSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  examType: {
    type: String,
    enum: ['midterm', 'final', 'quiz', 'assignment', 'practical'],
    required: true
  },
  year: {
    type: Number,
    required: true,
    min: 2000,
    max: new Date().getFullYear() + 1
  },
  month: {
    type: String,
    enum: ['January', 'February', 'March', 'April', 'May', 'June', 
           'July', 'August', 'September', 'October', 'November', 'December']
  },
  duration: {
    type: String,
    trim: true
  },
  maxMarks: {
    type: Number,
    min: 0
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  downloads: {
    type: Number,
    default: 0
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true
  }],
  syllabus: {
    type: String,
    trim: true
  },
  solutions: [{
    fileUrl: String,
    fileName: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  visibility: {
    type: String,
    enum: ['public', 'department', 'private'],
    default: 'public'
  }
}, {
  timestamps: true
});

// Index for better search performance
questionPaperSchema.index({ title: 'text', subject: 'text', tags: 'text' });
questionPaperSchema.index({ department: 1, semester: 1, subject: 1, year: -1 });
questionPaperSchema.index({ uploadedBy: 1 });
questionPaperSchema.index({ isApproved: 1 });
questionPaperSchema.index({ examType: 1 });

module.exports = mongoose.model('QuestionPaper', questionPaperSchema);

const mongoose = require('mongoose');

const notesSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
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
  unit: {
    type: String,
    trim: true
  },
  topic: {
    type: String,
    trim: true
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
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  tags: [{
    type: String,
    trim: true
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
notesSchema.index({ title: 'text', description: 'text', subject: 'text', tags: 'text' });
notesSchema.index({ department: 1, semester: 1, subject: 1 });
notesSchema.index({ uploadedBy: 1 });
notesSchema.index({ isApproved: 1 });

module.exports = mongoose.model('Notes', notesSchema);

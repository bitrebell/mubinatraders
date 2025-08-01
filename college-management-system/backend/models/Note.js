const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Note title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Note description is required']
  },
  content: {
    type: String,
    default: ''
  },
  subject: {
    name: {
      type: String,
      required: [true, 'Subject name is required']
    },
    code: {
      type: String,
      required: [true, 'Subject code is required'],
      uppercase: true
    }
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: 1,
    max: 8
  },
  chapter: {
    type: String,
    trim: true
  },
  topic: {
    type: String,
    trim: true
  },
  noteType: {
    type: String,
    enum: ['lecture', 'assignment', 'practical', 'reference', 'exam', 'project'],
    required: [true, 'Note type is required']
  },
  files: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    publicId: String,
    size: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  visibility: {
    type: String,
    enum: ['public', 'course-specific', 'semester-specific'],
    default: 'semester-specific'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  downloads: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    downloadedAt: {
      type: Date,
      default: Date.now
    },
    ipAddress: String
  }],
  views: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    },
    ipAddress: String
  }],
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      maxlength: [500, 'Comment cannot be more than 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  expiresAt: Date
}, {
  timestamps: true
});

// Indexes for better performance
noteSchema.index({ course: 1, semester: 1 });
noteSchema.index({ 'subject.code': 1 });
noteSchema.index({ uploadedBy: 1 });
noteSchema.index({ status: 1 });
noteSchema.index({ noteType: 1 });
noteSchema.index({ tags: 1 });
noteSchema.index({ createdAt: -1 });

// Virtual for download count
noteSchema.virtual('downloadCount').get(function() {
  return this.downloads.length;
});

// Virtual for view count
noteSchema.virtual('viewCount').get(function() {
  return this.views.length;
});

// Virtual for like count
noteSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
noteSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Virtual for total file size
noteSchema.virtual('totalSize').get(function() {
  return this.files.reduce((total, file) => total + file.size, 0);
});

// Ensure virtual fields are serialized
noteSchema.set('toJSON', { virtuals: true });

// Pre-save middleware to handle expiration
noteSchema.pre('save', function(next) {
  if (this.isNew && this.noteType === 'assignment' && !this.expiresAt) {
    // Auto-expire assignments after 6 months
    this.expiresAt = new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000);
  }
  next();
});

module.exports = mongoose.model('Note', noteSchema);

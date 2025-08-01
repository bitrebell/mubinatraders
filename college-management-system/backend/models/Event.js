const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required']
  },
  eventType: {
    type: String,
    enum: ['academic', 'cultural', 'sports', 'workshop', 'seminar', 'exam', 'holiday', 'announcement'],
    required: [true, 'Event type is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(value) {
        return value >= this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  startTime: {
    type: String,
    required: function() {
      return this.eventType !== 'holiday' && this.eventType !== 'announcement';
    }
  },
  endTime: {
    type: String,
    required: function() {
      return this.eventType !== 'holiday' && this.eventType !== 'announcement';
    }
  },
  venue: {
    type: String,
    required: function() {
      return this.eventType !== 'holiday' && this.eventType !== 'announcement';
    }
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetAudience: {
    courses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    }],
    semesters: [{
      type: Number,
      min: 1,
      max: 8
    }],
    roles: [{
      type: String,
      enum: ['student', 'teacher', 'admin']
    }],
    isPublic: {
      type: Boolean,
      default: true
    }
  },
  images: [{
    url: String,
    publicId: String,
    caption: String
  }],
  attachments: [{
    filename: String,
    url: String,
    publicId: String,
    size: Number,
    mimeType: String
  }],
  registrationRequired: {
    type: Boolean,
    default: false
  },
  registrationDeadline: {
    type: Date,
    required: function() {
      return this.registrationRequired;
    }
  },
  maxParticipants: {
    type: Number,
    min: 1
  },
  registeredUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    }
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
eventSchema.index({ startDate: 1, endDate: 1 });
eventSchema.index({ eventType: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ 'targetAudience.courses': 1 });
eventSchema.index({ tags: 1 });
eventSchema.index({ organizer: 1 });

// Virtual for event duration
eventSchema.virtual('duration').get(function() {
  return this.endDate - this.startDate;
});

// Virtual for registration count
eventSchema.virtual('registrationCount').get(function() {
  return this.registeredUsers.length;
});

// Virtual for availability
eventSchema.virtual('spotsAvailable').get(function() {
  if (!this.maxParticipants) return null;
  return this.maxParticipants - this.registeredUsers.length;
});

// Ensure virtual fields are serialized
eventSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);

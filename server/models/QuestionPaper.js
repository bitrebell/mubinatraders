const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QuestionPaper = sequelize.define('QuestionPaper', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [3, 200]
    }
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 8
    }
  },
  examType: {
    type: DataTypes.ENUM('midterm', 'final', 'quiz', 'assignment', 'practical'),
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 2000,
      max: new Date().getFullYear() + 1
    }
  },
  month: {
    type: DataTypes.STRING
  },
  duration: {
    type: DataTypes.STRING
  },
  maxMarks: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0
    }
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fileType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  uploadedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  approvedAt: {
    type: DataTypes.DATE
  },
  downloads: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'medium', 'hard'),
    defaultValue: 'medium'
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  syllabus: {
    type: DataTypes.TEXT
  },
  solutions: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  visibility: {
    type: DataTypes.ENUM('public', 'department', 'private'),
    defaultValue: 'public'
  }
}, {
  tableName: 'question_papers',
  indexes: [
    {
      fields: ['department', 'semester', 'subject', 'year']
    },
    {
      fields: ['isApproved']
    },
    {
      fields: ['examType']
    }
  ]
});

module.exports = QuestionPaper;

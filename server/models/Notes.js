const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notes = sequelize.define('Notes', {
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
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [10, 1000]
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
  unit: {
    type: DataTypes.STRING
  },
  topic: {
    type: DataTypes.STRING
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
  rating: {
    type: DataTypes.JSON,
    defaultValue: {
      average: 0,
      count: 0
    }
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  visibility: {
    type: DataTypes.ENUM('public', 'department', 'private'),
    defaultValue: 'public'
  }
}, {
  tableName: 'notes',
  indexes: [
    {
      fields: ['department', 'semester', 'subject']
    },
    {
      fields: ['isApproved']
    },
    {
      fields: ['uploadedBy']
    }
  ]
});

module.exports = Notes;

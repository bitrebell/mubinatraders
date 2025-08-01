const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('student', 'teacher', 'admin'),
    defaultValue: 'student'
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false
  },
  semester: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 8
    }
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  avatar: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  notifications: {
    type: DataTypes.JSON,
    defaultValue: {
      email: true,
      newNotes: true,
      newQuestions: true
    }
  },
  lastLogin: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// Hash password before saving
User.beforeSave(async (user) => {
  if (user.changed('password')) {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

// Compare password method
User.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import database and models
const sequelize = require('./config/database');
const User = require('./models/User');
const Notes = require('./models/Notes');
const QuestionPaper = require('./models/QuestionPaper');

// Import routes
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const questionsRoutes = require('./routes/questions');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Serve static frontend files
app.use(express.static('public'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'College Notes Manager API is running',
    database: 'SQLite',
    timestamp: new Date().toISOString()
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    // Sync database (create tables if they don't exist)
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized successfully');

    // Create default admin user if none exists
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    if (!adminExists) {
      await User.create({
        name: 'Admin User',
        email: 'admin@college.edu',
        password: 'admin123',
        role: 'admin',
        department: 'Administration',
        isVerified: true
      });
      console.log('✅ Default admin user created (admin@college.edu / admin123)');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📊 Database: SQLite`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;

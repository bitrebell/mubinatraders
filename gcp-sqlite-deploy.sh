#!/bin/bash

echo "🚀 Preparing College Notes Manager for Google Cloud + SQLite Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the project root directory.${NC}"
    exit 1
fi

# Check prerequisites
echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js first.${NC}"
    exit 1
fi

if ! command -v gcloud &> /dev/null; then
    echo -e "${YELLOW}⚠️  Google Cloud CLI not found. You'll need to install it for deployment.${NC}"
    echo -e "${BLUE}   Download from: https://cloud.google.com/sdk/docs/install${NC}"
fi

# Create deployment directory
echo -e "${YELLOW}📁 Creating deployment directory...${NC}"
rm -rf gcp-deploy
mkdir -p gcp-deploy

# Build the React app
echo -e "${YELLOW}🔨 Building React application...${NC}"
cd client
if npm run build; then
    echo -e "${GREEN}✅ React build successful${NC}"
else
    echo -e "${RED}❌ React build failed${NC}"
    exit 1
fi
cd ..

# Copy server files and modify for SQLite
echo -e "${YELLOW}📦 Preparing server files for SQLite...${NC}"
cp -r server/* gcp-deploy/
rm -rf gcp-deploy/node_modules
rm -f gcp-deploy/.env

# Create SQLite-compatible package.json
echo -e "${YELLOW}📄 Creating SQLite package.json...${NC}"
cat > gcp-deploy/package.json << 'EOF'
{
  "name": "college-notes-server",
  "version": "1.0.0",
  "description": "College Notes Manager - Server with SQLite",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "sqlite3": "^5.1.6",
    "sequelize": "^6.35.2",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "nodemailer": "^6.9.7",
    "express-validator": "^7.0.1",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "@google-cloud/storage": "^7.7.0"
  }
}
EOF

# Create SQLite database configuration
echo -e "${YELLOW}🗄️ Creating SQLite database configuration...${NC}"
mkdir -p gcp-deploy/config
cat > gcp-deploy/config/database.js << 'EOF'
const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Ensure database directory exists
const dbDir = path.join(__dirname, '..', 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(dbDir, 'college_notes.sqlite'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: false,
  },
});

// Test connection
sequelize.authenticate()
  .then(() => {
    console.log('✅ SQLite database connection established successfully.');
  })
  .catch(err => {
    console.error('❌ Unable to connect to the database:', err);
  });

module.exports = sequelize;
EOF

# Create Sequelize User model
echo -e "${YELLOW}👤 Creating Sequelize User model...${NC}"
cat > gcp-deploy/models/User.js << 'EOF'
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
    allowNull: false,
    validate: {
      len: [2, 100]
    }
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
    allowNull: false,
    validate: {
      len: [6, 255]
    }
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
}, {
  tableName: 'users',
  hooks: {
    beforeSave: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance method to compare password
User.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

module.exports = User;
EOF

# Create Sequelize Notes model
echo -e "${YELLOW}📝 Creating Sequelize Notes model...${NC}"
cat > gcp-deploy/models/Notes.js << 'EOF'
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
EOF

# Create Sequelize QuestionPaper model
echo -e "${YELLOW}❓ Creating Sequelize QuestionPaper model...${NC}"
cat > gcp-deploy/models/QuestionPaper.js << 'EOF'
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
EOF

# Update main server file for SQLite
echo -e "${YELLOW}🔧 Updating main server file...${NC}"
cat > gcp-deploy/index.js << 'EOF'
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

// API Routes
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
EOF

# Create Dockerfile for Google Cloud Run
echo -e "${YELLOW}🐳 Creating Dockerfile...${NC}"
cat > gcp-deploy/Dockerfile << 'EOF'
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Create necessary directories
RUN mkdir -p database uploads/notes uploads/questions uploads/avatars public

# Copy application code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the application
CMD ["npm", "start"]
EOF

# Create .dockerignore
cat > gcp-deploy/.dockerignore << 'EOF'
node_modules
npm-debug.log
.env
.env.*
.git
.gitignore
README.md
Dockerfile
.dockerignore
database/*.sqlite
uploads/*
*.log
.DS_Store
coverage
.nyc_output
EOF

# Copy built React app to public directory
echo -e "${YELLOW}📋 Copying React build to server...${NC}"
mkdir -p gcp-deploy/public
cp -r client/build/* gcp-deploy/public/

# Create environment template
echo -e "${YELLOW}⚙️ Creating environment template...${NC}"
cat > gcp-deploy/.env.template << 'EOF'
# Production Environment for Google Cloud Run
NODE_ENV=production
PORT=8080

# JWT Secret - Generate a strong secret
JWT_SECRET=your-super-secure-jwt-secret-key-for-production

# Client URL - Your domain (Hostinger)
CLIENT_URL=https://yourdomain.com

# Email Configuration - Gmail SMTP (recommended)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM=College Notes System <your-email@gmail.com>

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
EOF

# Create Google Cloud deployment script
echo -e "${YELLOW}☁️ Creating Google Cloud deployment script...${NC}"
cat > gcp-deploy/deploy-to-gcp.sh << 'EOF'
#!/bin/bash

echo "🚀 Deploying to Google Cloud Run..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Google Cloud CLI not found. Please install it first.${NC}"
    echo -e "${YELLOW}   Download from: https://cloud.google.com/sdk/docs/install${NC}"
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ No Google Cloud project set. Run: gcloud config set project YOUR_PROJECT_ID${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Project ID: $PROJECT_ID${NC}"

# Enable required APIs
echo -e "${YELLOW}🔧 Enabling required APIs...${NC}"
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Build and push the container
echo -e "${YELLOW}🏗️ Building container image...${NC}"
gcloud builds submit --tag gcr.io/$PROJECT_ID/college-notes-api

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Container build failed${NC}"
    exit 1
fi

# Deploy to Cloud Run
echo -e "${YELLOW}🚀 Deploying to Cloud Run...${NC}"
gcloud run deploy college-notes-api \
  --image gcr.io/$PROJECT_ID/college-notes-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10 \
  --timeout 300 \
  --concurrency 80 \
  --set-env-vars="NODE_ENV=production" \
  --set-env-vars="JWT_SECRET=$(openssl rand -base64 32)" \
  --set-env-vars="CLIENT_URL=https://yourdomain.com"

if [ $? -eq 0 ]; then
    # Get the service URL
    SERVICE_URL=$(gcloud run services describe college-notes-api --region=us-central1 --format="value(status.url)")
    
    echo ""
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo -e "${YELLOW}📋 Service Information:${NC}"
    echo -e "   Backend URL: $SERVICE_URL"
    echo -e "   API Endpoint: $SERVICE_URL/api"
    echo ""
    echo -e "${YELLOW}📋 Next Steps:${NC}"
    echo -e "   1. Update your frontend's API URL to: $SERVICE_URL/api"
    echo -e "   2. Configure email settings in Cloud Run environment variables"
    echo -e "   3. Test the API: curl $SERVICE_URL/api/health"
    echo -e "   4. Upload frontend to Hostinger"
    echo ""
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi
EOF

chmod +x gcp-deploy/deploy-to-gcp.sh

# Create database migration script
echo -e "${YELLOW}🗄️ Creating database migration script...${NC}"
cat > gcp-deploy/migrate-db.js << 'EOF'
const sequelize = require('./config/database');
const User = require('./models/User');
const Notes = require('./models/Notes');
const QuestionPaper = require('./models/QuestionPaper');

async function migrateDatabase() {
  try {
    console.log('🔄 Starting database migration...');
    
    // Force sync (recreate tables)
    await sequelize.sync({ force: false, alter: true });
    
    console.log('✅ Database migration completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateDatabase();
EOF

# Create frontend deployment script
echo -e "${YELLOW}🌐 Creating frontend deployment instructions...${NC}"
cat > gcp-deploy/FRONTEND_DEPLOYMENT.md << 'EOF'
# Frontend Deployment to Hostinger

## 1. Get Your Backend URL
After deploying to Google Cloud Run, you'll get a URL like:
`https://college-notes-api-xxxxx-uc.a.run.app`

## 2. Update Frontend Configuration
Update your React app's API URL:

### Option A: Environment Variable
Create `client/.env.production`:
```
REACT_APP_API_URL=https://your-cloud-run-url.run.app/api
```

### Option B: Direct Configuration
In your React app, update the API base URL:
```javascript
const API_BASE_URL = 'https://your-cloud-run-url.run.app/api';
```

## 3. Build Frontend
```bash
cd client
npm run build
```

## 4. Upload to Hostinger
1. Log into Hostinger hPanel
2. Go to File Manager
3. Navigate to public_html (or your domain folder)
4. Upload all contents from `client/build/` folder
5. Extract if needed

## 5. Configure .htaccess
Create `.htaccess` in your public_html:
```apache
RewriteEngine On

# Handle React Router
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# HTTPS redirect (when SSL is enabled)
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
```

## 6. Test Deployment
1. Visit your domain
2. Test user registration/login
3. Verify API calls are working
4. Check browser console for errors
EOF

echo -e "${YELLOW}🗜️ Creating deployment archive...${NC}"
cd gcp-deploy
tar -czf ../college-notes-gcp-sqlite.tar.gz .
cd ..

echo ""
echo -e "${GREEN}✅ Google Cloud + SQLite deployment package created successfully!${NC}"
echo ""
echo -e "${YELLOW}📦 Files created:${NC}"
echo "  • gcp-deploy/ - Google Cloud deployment directory"
echo "  • college-notes-gcp-sqlite.tar.gz - Compressed package"
echo ""
echo -e "${YELLOW}📋 Deployment Architecture:${NC}"
echo "  • Frontend: Hostinger (static files)"
echo "  • Backend: Google Cloud Run (serverless)"
echo "  • Database: SQLite (file-based)"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "  1. Set up Google Cloud project and billing"
echo "  2. Install Google Cloud CLI if not already installed"
echo "  3. Run: cd gcp-deploy && ./deploy-to-gcp.sh"
echo "  4. Upload frontend to Hostinger using build files"
echo "  5. Update frontend API URL to your Cloud Run URL"
echo ""
echo -e "${YELLOW}💡 Benefits of this setup:${NC}"
echo "  • No database hosting costs (SQLite is file-based)"
echo "  • Google Cloud Run free tier (2M requests/month)"
echo "  • Auto-scaling based on traffic"
echo "  • Simple deployment and updates"
echo ""
echo -e "${GREEN}🎉 Ready for Google Cloud deployment!${NC}"

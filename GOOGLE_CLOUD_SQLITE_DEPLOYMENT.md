# Google Cloud + SQLite Deployment Guide

This guide shows you how to deploy the College Notes Manager with:
- **Frontend**: Hostinger (static files)
- **Backend**: Google Cloud Run (serverless)
- **Database**: SQLite (local file database)

## Benefits of This Setup

- **Cost Effective**: Google Cloud Run has generous free tier
- **Simple Database**: SQLite requires no external database service
- **Scalable**: Auto-scales based on traffic
- **Fast Deployment**: Quick setup and deployment

## Prerequisites

- Google Cloud Account (free tier available)
- Google Cloud CLI installed
- Docker installed (for local testing)
- Hostinger hosting account

## Step 1: Modify Backend for SQLite

### Install SQLite Dependencies

Update `server/package.json` to replace MongoDB with SQLite:

```json
{
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
    "express-rate-limit": "^7.1.5"
  }
}
```

### Database Configuration

Create `server/config/database.js`:

```javascript
const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'database', 'college_notes.sqlite'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

module.exports = sequelize;
```

## Step 2: Create Sequelize Models

### User Model (`server/models/User.js`)

```javascript
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
```

## Step 3: Google Cloud Setup

### Create Dockerfile

Create `server/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Create database directory
RUN mkdir -p database uploads/notes uploads/questions uploads/avatars

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 8080

CMD ["npm", "start"]
```

### Create .dockerignore

Create `server/.dockerignore`:

```
node_modules
npm-debug.log
.env
.git
.gitignore
README.md
Dockerfile
.dockerignore
database/*.sqlite
uploads/*
```

### Google Cloud Configuration

Create `server/app.yaml` (for App Engine alternative):

```yaml
runtime: nodejs18

env_variables:
  NODE_ENV: production
  JWT_SECRET: your-jwt-secret-here
  CLIENT_URL: https://yourdomain.com
  EMAIL_HOST: smtp.gmail.com
  EMAIL_PORT: 587
  EMAIL_USER: your-email@gmail.com
  EMAIL_PASS: your-app-password
  EMAIL_FROM: College Notes <your-email@gmail.com>

automatic_scaling:
  min_instances: 0
  max_instances: 10
```

## Step 4: Deploy to Google Cloud Run

### Prepare Deployment Script

Create `deploy-google-cloud.sh`:

```bash
#!/bin/bash

echo "🚀 Deploying to Google Cloud Run..."

# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/college-notes-api

# Deploy to Cloud Run
gcloud run deploy college-notes-api \
  --image gcr.io/YOUR_PROJECT_ID/college-notes-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=production \
  --set-env-vars JWT_SECRET=your-jwt-secret \
  --set-env-vars CLIENT_URL=https://yourdomain.com

echo "✅ Deployment complete!"
```

### Manual Deployment Steps

1. **Enable APIs**:
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   ```

2. **Build and Deploy**:
   ```bash
   # Set your project
   gcloud config set project YOUR_PROJECT_ID
   
   # Build the image
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/college-notes-api
   
   # Deploy to Cloud Run
   gcloud run deploy college-notes-api \
     --image gcr.io/YOUR_PROJECT_ID/college-notes-api \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

## Step 5: Frontend Deployment to Hostinger

### Update React Configuration

Create `client/.env.production`:

```env
REACT_APP_API_URL=https://your-cloud-run-url.run.app/api
```

### Build and Deploy Frontend

```bash
# Build React app
cd client
npm run build

# Upload contents of build/ folder to Hostinger public_html
```

## Step 6: Database Persistence (Important!)

### Cloud Storage for SQLite (Recommended)

Since Cloud Run is stateless, use Google Cloud Storage for SQLite file:

```javascript
// server/config/database.js
const { Sequelize } = require('sequelize');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');

const storage = new Storage();
const bucket = storage.bucket('your-database-bucket');
const dbFile = 'college_notes.sqlite';
const localDbPath = path.join(__dirname, '..', 'database', dbFile);

// Download database file on startup
async function initDatabase() {
  try {
    if (!fs.existsSync(path.dirname(localDbPath))) {
      fs.mkdirSync(path.dirname(localDbPath), { recursive: true });
    }
    
    const file = bucket.file(dbFile);
    const [exists] = await file.exists();
    
    if (exists) {
      await file.download({ destination: localDbPath });
      console.log('Database downloaded from Cloud Storage');
    } else {
      console.log('Creating new database');
    }
  } catch (error) {
    console.log('Creating new database:', error.message);
  }
}

// Upload database file periodically
async function backupDatabase() {
  try {
    if (fs.existsSync(localDbPath)) {
      await bucket.upload(localDbPath, { destination: dbFile });
      console.log('Database backed up to Cloud Storage');
    }
  } catch (error) {
    console.error('Database backup failed:', error);
  }
}

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: localDbPath,
  logging: false,
});

module.exports = { sequelize, initDatabase, backupDatabase };
```

### Alternative: Cloud SQL (MySQL/PostgreSQL)

For better persistence, consider Cloud SQL:

```javascript
// For Cloud SQL MySQL
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    dialectOptions: {
      socketPath: process.env.DB_SOCKET_PATH
    }
  }
);
```

## Step 7: Complete Deployment Script

Create `deploy-gcp-hostinger.sh`:

```bash
#!/bin/bash

echo "🚀 Deploying College Notes Manager..."
echo "📍 Backend: Google Cloud Run"
echo "📍 Frontend: Hostinger"
echo "📍 Database: SQLite"

# Check prerequisites
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI not found. Please install it first."
    exit 1
fi

# Build frontend
echo "🔨 Building React frontend..."
cd client
npm run build
cd ..

# Build and deploy backend
echo "🚀 Deploying backend to Google Cloud Run..."
cd server

# Build and push container
gcloud builds submit --tag gcr.io/$GOOGLE_CLOUD_PROJECT/college-notes-api

# Deploy to Cloud Run
gcloud run deploy college-notes-api \
  --image gcr.io/$GOOGLE_CLOUD_PROJECT/college-notes-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10

cd ..

# Get Cloud Run URL
BACKEND_URL=$(gcloud run services describe college-notes-api --region=us-central1 --format="value(status.url)")

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Upload client/build/* contents to Hostinger public_html"
echo "2. Update frontend API URL to: $BACKEND_URL/api"
echo "3. Configure email settings in Google Cloud Run environment"
echo "4. Test all functionality"
echo ""
echo "🌐 Backend URL: $BACKEND_URL"
echo "🌐 Frontend: Upload to Hostinger"
```

## Step 8: Environment Variables Setup

Set environment variables in Google Cloud Run:

```bash
gcloud run services update college-notes-api \
  --region us-central1 \
  --set-env-vars="NODE_ENV=production,JWT_SECRET=your-secure-secret,CLIENT_URL=https://yourdomain.com,EMAIL_HOST=smtp.gmail.com,EMAIL_PORT=587,EMAIL_USER=your-email@gmail.com,EMAIL_PASS=your-app-password"
```

## Pricing Estimate

### Google Cloud Run (Free Tier)
- 2 million requests/month
- 400,000 GB-seconds/month
- 200,000 CPU-seconds/month

### Google Cloud Storage (if using for SQLite backup)
- 5GB free storage
- Minimal costs for small databases

### Total Monthly Cost: ~$0-5 for small applications

## Benefits of This Setup

1. **Serverless**: No server management
2. **Auto-scaling**: Handles traffic spikes
3. **Cost-effective**: Pay only for usage
4. **Simple database**: SQLite for small to medium apps
5. **Fast deployment**: Quick updates and rollbacks

This setup is perfect for college projects and small to medium-sized applications!

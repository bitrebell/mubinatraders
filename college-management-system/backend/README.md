# College Management System - Backend

This is the backend API for the College Management System built with Node.js, Express, and MongoDB.

## Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Email verification with OTP
  - Password reset functionality
  - Role-based access control (Student, Teacher, Admin)

- **User Management**
  - User registration and login
  - Profile management
  - Avatar upload
  - User statistics dashboard

- **Events Management**
  - Create, read, update, delete events
  - Event registration system
  - Email notifications for events
  - Event filtering and search

- **Notes Management**
  - Upload and share study materials
  - File upload with Cloudinary
  - Like and comment system
  - Download tracking
  - Approval system for student uploads

- **Course Management**
  - Course and subject management
  - Semester-wise organization
  - Department categorization

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Cloudinary
- **Email Service**: Nodemailer
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- Cloudinary account (for file uploads)
- Gmail account (for email service)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd college-management-system/backend
```

2. Install dependencies
```bash
npm install
```

3. Environment Setup
```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/college_management

# JWT Secret (generate a secure random string)
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_complex
JWT_EXPIRE=7d

# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@collegemanagement.com

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Gmail Setup for Email Service

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and generate password
   - Use this password in `EMAIL_PASS`

### Cloudinary Setup

1. Create account at [cloudinary.com](https://cloudinary.com)
2. Get your Cloud Name, API Key, and API Secret from the dashboard
3. Add them to your `.env` file

### Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-email` - Verify email with OTP
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/upload-avatar` - Upload avatar
- `PUT /api/users/change-password` - Change password
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create event (Teacher/Admin)
- `PUT /api/events/:id` - Update event (Owner/Admin)
- `DELETE /api/events/:id` - Delete event (Owner/Admin)
- `POST /api/events/:id/register` - Register for event (Student)
- `DELETE /api/events/:id/register` - Unregister from event (Student)

### Notes
- `GET /api/notes` - Get all notes
- `GET /api/notes/:id` - Get single note
- `POST /api/notes` - Create note
- `PUT /api/notes/:id` - Update note (Owner/Admin)
- `DELETE /api/notes/:id` - Delete note (Owner/Admin)
- `POST /api/notes/:id/like` - Like/Unlike note
- `POST /api/notes/:id/comment` - Add comment
- `DELETE /api/notes/:noteId/comment/:commentId` - Delete comment
- `POST /api/notes/:id/download` - Track download

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get single course
- `GET /api/courses/:id/subjects` - Get course subjects
- `POST /api/courses` - Create course (Admin only)
- `PUT /api/courses/:id` - Update course (Admin only)
- `DELETE /api/courses/:id` - Delete course (Admin only)

### File Uploads
- `POST /api/uploads/documents` - Upload documents
- `POST /api/uploads/images` - Upload images

## Database Models

### User Model
- Personal information (name, email, etc.)
- Role-based permissions
- Course and semester information
- Authentication tokens

### Event Model
- Event details and scheduling
- Target audience configuration
- Registration system
- File attachments

### Note Model
- Study material information
- File management
- User interactions (likes, comments, downloads)
- Approval workflow

### Course Model
- Course structure
- Subject management
- Semester organization

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS configuration
- Helmet for security headers
- File upload restrictions

## Error Handling

The API uses consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [...] // Validation errors if any
}
```

## Deployment

### Google Cloud Platform

1. Create a new GCP project
2. Enable Cloud Run, Cloud SQL, and Cloud Storage APIs
3. Set up Cloud SQL (PostgreSQL/MySQL) or use MongoDB Atlas
4. Configure environment variables in Cloud Run
5. Deploy using Cloud Build or Docker

Example `cloudbuild.yaml`:
```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/college-management-backend', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/college-management-backend']
  - name: 'gcr.io/cloud-builders/gcloud'
    args: [
      'run', 'deploy', 'college-management-backend',
      '--image', 'gcr.io/$PROJECT_ID/college-management-backend',
      '--platform', 'managed',
      '--region', 'us-central1',
      '--allow-unauthenticated'
    ]
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/college_management
JWT_SECRET=production_jwt_secret_very_long_and_secure
CORS_ORIGIN=https://your-frontend-domain.com
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or questions, please contact the development team or create an issue in the repository.

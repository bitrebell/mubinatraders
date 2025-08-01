# College Notes Manager

A comprehensive web application for managing college notes and previous year question papers with email notification system.

## Features

### 📝 Notes Management
- Upload and organize college notes by subject, semester, and department
- Support for multiple file formats (PDF, DOC, DOCX, PPT, PPTX, TXT, images)
- Advanced search and filtering capabilities
- Rating and review system for notes

### 📋 Question Papers
- Access previous year question papers organized by:
  - Department and semester
  - Subject and exam type (midterm, final, quiz, etc.)
  - Year and difficulty level
- Upload solutions for question papers

### 🔐 User Management
- Role-based access control (Student, Teacher, Admin)
- User authentication and authorization
- Profile management with department and semester info
- Avatar support

### 📧 Email Notifications
- Welcome emails for new users
- Notifications for new notes and question papers
- Approval/rejection notifications
- Customizable notification preferences

### 👨‍🏫 Content Moderation
- Teacher/Admin approval system for uploads
- Content review and moderation tools
- Bulk approval/rejection capabilities

### 📊 Analytics & Dashboard
- User statistics and activity tracking
- Download counters and popular content
- Admin dashboard with system overview

## Technology Stack

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer** for file uploads
- **Nodemailer** for email services
- **Bcrypt** for password hashing

### Frontend
- **React** with modern hooks
- **React Router** for navigation
- **React Query** for data fetching
- **React Hook Form** for form handling
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Heroicons** for icons

### Security Features
- **Helmet** for HTTP headers security
- **Rate limiting** to prevent abuse
- **Input validation** and sanitization
- **File type validation** and size limits
- **CORS** configuration

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd college-notes-manager
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
npm run install-server

# Install client dependencies
npm run install-client
```

### 3. Environment Configuration

#### Server Environment (.env)
Create a `.env` file in the `server` directory:

```env
# Environment
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/college_notes

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Client URL
CLIENT_URL=http://localhost:3000

# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=College Notes System <your-email@gmail.com>

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

#### Client Environment (Optional)
Create a `.env` file in the `client` directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Start the Application

#### Development Mode (Both servers)
```bash
npm run dev
```

#### Or start individually:
```bash
# Start backend server
npm run server

# Start frontend (in another terminal)
npm run client
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## Email Configuration

### Gmail Setup
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the generated password in `EMAIL_PASS`

### Other Email Providers
Update the SMTP settings in `.env`:
- **Outlook**: smtp-mail.outlook.com:587
- **Yahoo**: smtp.mail.yahoo.com:587
- **Custom SMTP**: Use your provider's settings

## File Upload Configuration

### Supported File Types
- **Documents**: PDF, DOC, DOCX, PPT, PPTX, TXT
- **Images**: JPG, JPEG, PNG, GIF

### File Size Limits
- Default: 10MB per file
- Configurable via `MAX_FILE_SIZE` environment variable

### Storage
- Files are stored locally in the `server/uploads` directory
- Organized by type: `uploads/notes/`, `uploads/questions/`, `uploads/avatars/`

## Database Schema

### Users
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: ['student', 'teacher', 'admin'],
  department: String,
  semester: Number (1-8, for students),
  isVerified: Boolean,
  notifications: {
    email: Boolean,
    newNotes: Boolean,
    newQuestions: Boolean
  }
}
```

### Notes
```javascript
{
  title: String,
  description: String,
  subject: String,
  department: String,
  semester: Number,
  fileUrl: String,
  uploadedBy: ObjectId (User),
  isApproved: Boolean,
  downloads: Number,
  rating: { average: Number, count: Number },
  tags: [String]
}
```

### Question Papers
```javascript
{
  title: String,
  subject: String,
  department: String,
  semester: Number,
  examType: ['midterm', 'final', 'quiz', 'assignment', 'practical'],
  year: Number,
  fileUrl: String,
  uploadedBy: ObjectId (User),
  isApproved: Boolean,
  downloads: Number,
  difficulty: ['easy', 'medium', 'hard']
}
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Notes
- `GET /api/notes` - Get all notes (with filters)
- `POST /api/notes` - Upload new notes
- `GET /api/notes/:id` - Get single note
- `GET /api/notes/:id/download` - Download note file
- `PATCH /api/notes/:id/approve` - Approve/reject notes (Teacher/Admin)

### Question Papers
- `GET /api/questions` - Get all question papers (with filters)
- `POST /api/questions` - Upload new question paper
- `GET /api/questions/:id` - Get single question paper
- `GET /api/questions/:id/download` - Download question paper

### Users (Admin)
- `GET /api/users` - Get all users
- `PATCH /api/users/:id/role` - Update user role
- `DELETE /api/users/:id` - Delete user

## Deployment

### Production Build
```bash
# Build client for production
cd client && npm run build

# Start production server
cd server && npm start
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Use strong JWT secret
- Configure production database URL
- Set up proper email credentials
- Configure CORS for production domains

### Recommended Hosting
- **Backend**: Heroku, DigitalOcean, AWS EC2
- **Database**: MongoDB Atlas
- **Frontend**: Netlify, Vercel, GitHub Pages
- **File Storage**: AWS S3, Cloudinary (for production)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Development Guidelines

### Code Style
- Use ESLint and Prettier for code formatting
- Follow React best practices and hooks patterns
- Use meaningful commit messages
- Write comments for complex logic

### Testing
- Write unit tests for utility functions
- Test API endpoints with Postman or similar
- Test user flows manually before committing

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network connectivity

2. **Email Not Sending**
   - Check email credentials
   - Verify SMTP settings
   - Test with a simple email service first

3. **File Upload Issues**
   - Check file size limits
   - Ensure upload directories exist
   - Verify file type restrictions

4. **Build Errors**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify all dependencies are installed

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

---

Built with ❤️ for the college community

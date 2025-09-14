# Educational Management System

A robust, deployment-ready educational management system built with Node.js, PostgreSQL, and vanilla JavaScript.

## 🚀 Features

### Core Management
- **User Management**: Students, Teachers, Parents, Administrators
- **School Management**: Multi-school support with detailed information
- **Class Management**: Course scheduling and enrollment
- **Grade Management**: Assignment tracking and grading
- **Parent Portal**: Parent-student relationships and communication

### Educational Tools
- **Quiz System**: Create, manage, and take quizzes with automatic grading
- **Lesson Planning**: Comprehensive lesson plan creation and management
- **File Management**: Upload, organize, and share educational materials
- **Notification System**: Real-time notifications and announcements

### Technical Features
- **Mobile Responsive**: Works on all devices (PC, tablet, mobile)
- **PostgreSQL Ready**: Robust database integration with full schema
- **Security**: JWT authentication, password hashing, rate limiting
- **Deployment Ready**: Configured for Netlify, Heroku, and GitHub
- **Error Handling**: Comprehensive error handling and validation

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js, PostgreSQL
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Database**: PostgreSQL
- **Deployment**: Netlify (Frontend), Heroku/Railway (Backend)

## 📋 Prerequisites

- Node.js >= 16.0.0
- PostgreSQL >= 12
- npm >= 8.0.0

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Setup Database
```bash
# Linux/Mac
./scripts/setup-database.sh

# Windows
scripts\setup-database.bat
```

### 3. Configure Environment
Update `backend/.env` with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=educational_management
DB_USER=postgres
DB_PASSWORD=your_password
```

### 4. Start Development Server
```bash
npm start
```

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 📱 Mobile Support

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## 🚀 Deployment

### Frontend (Netlify)
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `frontend`
4. Deploy!

### Backend (Heroku/Railway)
1. Create a new app on Heroku or Railway
2. Connect your GitHub repository
3. Add PostgreSQL addon
4. Set environment variables
5. Deploy!

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### User Management
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Teachers
- `GET /api/teachers` - Get all teachers
- `GET /api/teachers/:id` - Get teacher by ID
- `POST /api/teachers` - Create new teacher
- `PUT /api/teachers/:id` - Update teacher
- `DELETE /api/teachers/:id` - Delete teacher

### Parents
- `GET /api/parents` - Get all parents
- `GET /api/parents/:id` - Get parent by ID
- `POST /api/parents` - Create new parent
- `PUT /api/parents/:id` - Update parent
- `DELETE /api/parents/:id` - Delete parent
- `GET /api/parents/:id/children` - Get parent's children

### Schools
- `GET /api/schools` - Get all schools
- `GET /api/schools/:id` - Get school by ID
- `POST /api/schools` - Create new school
- `PUT /api/schools/:id` - Update school
- `DELETE /api/schools/:id` - Delete school
- `GET /api/schools/:id/stats` - Get school statistics

### Classes
- `GET /api/classes` - Get all classes
- `GET /api/classes/:id` - Get class by ID
- `POST /api/classes` - Create new class
- `PUT /api/classes/:id` - Update class
- `DELETE /api/classes/:id` - Delete class

### Grades
- `GET /api/grades` - Get all grades
- `GET /api/grades/student/:studentId` - Get student grades
- `GET /api/grades/class/:classId` - Get class grades
- `POST /api/grades` - Add new grade
- `PUT /api/grades/:id` - Update grade
- `DELETE /api/grades/:id` - Delete grade

### Quizzes
- `GET /api/quizzes` - Get all quizzes
- `GET /api/quizzes/:id` - Get quiz by ID
- `POST /api/quizzes` - Create new quiz
- `PUT /api/quizzes/:id` - Update quiz
- `DELETE /api/quizzes/:id` - Delete quiz
- `POST /api/quizzes/:id/questions` - Add question to quiz
- `POST /api/quizzes/:id/submit` - Submit quiz (students)

### Lesson Plans
- `GET /api/lesson-plans` - Get all lesson plans
- `GET /api/lesson-plans/:id` - Get lesson plan by ID
- `POST /api/lesson-plans` - Create new lesson plan
- `PUT /api/lesson-plans/:id` - Update lesson plan
- `DELETE /api/lesson-plans/:id` - Delete lesson plan
- `GET /api/lesson-plans/teacher/:teacherId` - Get teacher's lesson plans
- `GET /api/lesson-plans/class/:classId` - Get class lesson plans

### Files
- `GET /api/files` - Get all files
- `GET /api/files/:id` - Get file by ID
- `POST /api/files/upload` - Upload file
- `GET /api/files/:id/download` - Download file
- `PUT /api/files/:id` - Update file metadata
- `DELETE /api/files/:id` - Delete file
- `GET /api/files/stats/overview` - Get file statistics

### Notifications
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/:id` - Get notification by ID
- `POST /api/notifications` - Create notification (admin/teacher)
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `DELETE /api/notifications/:id` - Delete notification
- `DELETE /api/notifications/all` - Delete all notifications
- `GET /api/notifications/stats/overview` - Get notification statistics
- `GET /api/notifications/unread/count` - Get unread count

## 🛡️ Security Features

- JWT Authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Input validation
- SQL injection prevention

## 📊 Database Schema

The system uses PostgreSQL with the following comprehensive schema:

### Core Tables
- `users` - User accounts and authentication
- `schools` - School information and management
- `students` - Student information and profiles
- `teachers` - Teacher information and profiles
- `parents` - Parent information and relationships
- `subjects` - Subject/course definitions
- `classes` - Class/course scheduling and management

### Educational Content
- `lesson_plans` - Lesson planning and curriculum
- `quizzes` - Quiz and assessment management
- `quiz_questions` - Individual quiz questions
- `quiz_submissions` - Student quiz submissions and grades
- `grades` - Grade records and assessments
- `attendance` - Student attendance tracking

### System Features
- `notifications` - System notifications and announcements
- `files` - File uploads and document management
- `class_enrollments` - Student class enrollment tracking

### Key Features
- **Full Relationships**: All tables are properly linked with foreign keys
- **Data Integrity**: Comprehensive constraints and validation
- **Performance**: Optimized with proper indexing
- **Scalability**: Designed to handle large educational institutions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API endpoints

---

Built with ❤️ for educational institutions worldwide.

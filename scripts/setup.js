const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Educational Management System...\n');

// Create necessary directories
const directories = [
    'backend/logs',
    'backend/uploads',
    'frontend/assets',
    'docs',
    'tests'
];

directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
    }
});

// Create .env file if it doesn't exist
const envPath = 'backend/.env';
if (!fs.existsSync(envPath)) {
    const envContent = `# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=educational_management
DB_USER=postgres
DB_PASSWORD=your_password_here

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your_jwt_secret_here_${Date.now()}
JWT_EXPIRES_IN=7d

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
`;

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env file');
}

// Install dependencies
console.log('\n📦 Installing dependencies...');
try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Root dependencies installed');
    
    execSync('cd backend && npm install', { stdio: 'inherit' });
    console.log('✅ Backend dependencies installed');
} catch (error) {
    console.error('❌ Error installing dependencies:', error.message);
    process.exit(1);
}

// Create database setup script
const dbSetupScript = `#!/bin/bash
# Database setup script for Educational Management System

echo "🗄️ Setting up PostgreSQL database..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    echo "Visit: https://www.postgresql.org/download/"
    exit 1
fi

# Create database
echo "Creating database 'educational_management'..."
createdb educational_management 2>/dev/null || echo "Database may already exist"

# Run schema
echo "Running database schema..."
psql -d educational_management -f backend/models/schema.sql

echo "✅ Database setup complete!"
echo "📝 Don't forget to update your .env file with the correct database credentials."
`;

fs.writeFileSync('scripts/setup-database.sh', dbSetupScript);
fs.chmodSync('scripts/setup-database.sh', '755');

// Create Windows batch file for database setup
const dbSetupBatch = `@echo off
echo 🗄️ Setting up PostgreSQL database...

REM Check if PostgreSQL is installed
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ PostgreSQL is not installed. Please install PostgreSQL first.
    echo Visit: https://www.postgresql.org/download/
    pause
    exit /b 1
)

REM Create database
echo Creating database 'educational_management'...
createdb educational_management 2>nul || echo Database may already exist

REM Run schema
echo Running database schema...
psql -d educational_management -f backend\\models\\schema.sql

echo ✅ Database setup complete!
echo 📝 Don't forget to update your .env file with the correct database credentials.
pause
`;

fs.writeFileSync('scripts/setup-database.bat', dbSetupBatch);

// Create README
const readmeContent = `# Educational Management System

A robust, deployment-ready educational management system built with Node.js, PostgreSQL, and vanilla JavaScript.

## 🚀 Features

- **User Management**: Students, Teachers, Parents, Administrators
- **Class Management**: Course scheduling and enrollment
- **Grade Management**: Assignment tracking and grading
- **Mobile Responsive**: Works on all devices
- **PostgreSQL Ready**: Robust database integration
- **Deployment Ready**: Configured for Netlify, Heroku, and GitHub

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
\`\`\`bash
npm run install:all
\`\`\`

### 2. Setup Database
\`\`\`bash
# Linux/Mac
./scripts/setup-database.sh

# Windows
scripts\\setup-database.bat
\`\`\`

### 3. Configure Environment
Update \`backend/.env\` with your database credentials:
\`\`\`env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=educational_management
DB_USER=postgres
DB_PASSWORD=your_password
\`\`\`

### 4. Start Development Server
\`\`\`bash
npm start
\`\`\`

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
2. Set build command: \`npm run build\`
3. Set publish directory: \`frontend\`
4. Deploy!

### Backend (Heroku/Railway)
1. Create a new app on Heroku or Railway
2. Connect your GitHub repository
3. Add PostgreSQL addon
4. Set environment variables
5. Deploy!

## 🔧 API Endpoints

### Authentication
- \`POST /api/auth/register\` - Register new user
- \`POST /api/auth/login\` - Login user
- \`GET /api/auth/profile\` - Get user profile
- \`PUT /api/auth/profile\` - Update profile
- \`PUT /api/auth/change-password\` - Change password

### Students
- \`GET /api/students\` - Get all students
- \`GET /api/students/:id\` - Get student by ID
- \`POST /api/students\` - Create new student

### Teachers
- \`GET /api/teachers\` - Get all teachers
- \`GET /api/teachers/:id\` - Get teacher by ID
- \`POST /api/teachers\` - Create new teacher

### Classes
- \`GET /api/classes\` - Get all classes
- \`GET /api/classes/:id\` - Get class by ID
- \`POST /api/classes\` - Create new class

### Grades
- \`GET /api/grades/student/:studentId\` - Get student grades
- \`GET /api/grades/class/:classId\` - Get class grades
- \`POST /api/grades\` - Add new grade
- \`PUT /api/grades/:id\` - Update grade

## 🛡️ Security Features

- JWT Authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Input validation
- SQL injection prevention

## 📊 Database Schema

The system uses PostgreSQL with the following main tables:
- \`users\` - User accounts
- \`students\` - Student information
- \`teachers\` - Teacher information
- \`classes\` - Class/course information
- \`grades\` - Grade records
- \`attendance\` - Attendance tracking

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
`;

fs.writeFileSync('README.md', readmeContent);

console.log('\n✅ Setup complete!');
console.log('\n📝 Next steps:');
console.log('1. Setup PostgreSQL database: ./scripts/setup-database.sh');
console.log('2. Update backend/.env with your database credentials');
console.log('3. Start the development server: npm start');
console.log('\n🌐 Access your application at: http://localhost:3000');
console.log('🔧 API available at: http://localhost:3001');

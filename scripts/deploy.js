const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Deploying Educational Management System...\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
    console.error('❌ Please run this script from the project root directory');
    process.exit(1);
}

// Build frontend
console.log('📦 Building frontend...');
try {
    execSync('npm run build:frontend', { stdio: 'inherit' });
    console.log('✅ Frontend built successfully');
} catch (error) {
    console.error('❌ Frontend build failed:', error.message);
    process.exit(1);
}

// Create deployment package
console.log('📁 Creating deployment package...');
const deployDir = 'deploy';
if (fs.existsSync(deployDir)) {
    execSync(`rm -rf ${deployDir}`, { stdio: 'inherit' });
}
fs.mkdirSync(deployDir, { recursive: true });

// Copy backend files
const backendFiles = [
    'backend/server.js',
    'backend/package.json',
    'backend/config',
    'backend/routes',
    'backend/models',
    'backend/middleware',
    'backend/.env'
];

backendFiles.forEach(file => {
    const src = file;
    const dest = path.join(deployDir, file);
    
    if (fs.existsSync(src)) {
        if (fs.statSync(src).isDirectory()) {
            execSync(`cp -r ${src} ${path.dirname(dest)}`, { stdio: 'inherit' });
        } else {
            fs.mkdirSync(path.dirname(dest), { recursive: true });
            fs.copyFileSync(src, dest);
        }
        console.log(`✅ Copied ${file}`);
    }
});

// Copy frontend build
if (fs.existsSync('frontend')) {
    execSync(`cp -r frontend ${deployDir}/`, { stdio: 'inherit' });
    console.log('✅ Copied frontend files');
}

// Copy deployment files
const deployFiles = [
    'package.json',
    'README.md',
    'netlify.toml'
];

deployFiles.forEach(file => {
    if (fs.existsSync(file)) {
        fs.copyFileSync(file, path.join(deployDir, file));
        console.log(`✅ Copied ${file}`);
    }
});

// Create production package.json
const prodPackageJson = {
    "name": "educational-management-system",
    "version": "1.0.0",
    "description": "Educational Management System - Production Build",
    "main": "backend/server.js",
    "scripts": {
        "start": "node backend/server.js",
        "dev": "nodemon backend/server.js",
        "build": "echo 'Frontend is already built'",
        "install:all": "npm install && cd backend && npm install"
    },
    "dependencies": {
        "express": "^4.18.2",
        "pg": "^8.11.3",
        "cors": "^2.8.5",
        "helmet": "^7.1.0",
        "dotenv": "^16.3.1",
        "bcryptjs": "^2.4.3",
        "jsonwebtoken": "^9.0.2",
        "express-validator": "^7.0.1",
        "morgan": "^1.10.0",
        "compression": "^1.7.4",
        "express-rate-limit": "^7.1.5"
    },
    "devDependencies": {
        "nodemon": "^3.0.1"
    },
    "engines": {
        "node": ">=16.0.0",
        "npm": ">=8.0.0"
    }
};

fs.writeFileSync(
    path.join(deployDir, 'package.json'),
    JSON.stringify(prodPackageJson, null, 2)
);

// Create deployment instructions
const deployInstructions = `# Deployment Instructions

## Frontend Deployment (Netlify)

1. Go to [Netlify](https://netlify.com)
2. Connect your GitHub repository
3. Set build settings:
   - Build command: \`npm run build\`
   - Publish directory: \`frontend\`
4. Set environment variables:
   - \`REACT_APP_API_URL\`: Your backend API URL
5. Deploy!

## Backend Deployment (Heroku)

1. Install Heroku CLI
2. Login: \`heroku login\`
3. Create app: \`heroku create your-app-name\`
4. Add PostgreSQL: \`heroku addons:create heroku-postgresql:hobby-dev\`
5. Set environment variables:
   \`\`\`bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-secret-key
   heroku config:set DB_URL=\$(heroku config:get DATABASE_URL)
   \`\`\`
6. Deploy: \`git push heroku main\`

## Backend Deployment (Railway)

1. Go to [Railway](https://railway.app)
2. Connect your GitHub repository
3. Add PostgreSQL service
4. Set environment variables in Railway dashboard
5. Deploy!

## Environment Variables

Make sure to set these environment variables in your deployment platform:

\`\`\`env
NODE_ENV=production
PORT=3001
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=educational_management
DB_USER=your-db-user
DB_PASSWORD=your-db-password
JWT_SECRET=your-jwt-secret
FRONTEND_URL=https://your-frontend-url.netlify.app
\`\`\`

## Database Setup

1. Create PostgreSQL database
2. Run the schema: \`psql -d your-db -f backend/models/schema.sql\`
3. Update environment variables with database credentials

## Health Check

After deployment, test these endpoints:
- Backend health: \`https://your-backend-url.herokuapp.com/health\`
- Frontend: \`https://your-frontend-url.netlify.app\`
`;

fs.writeFileSync(path.join(deployDir, 'DEPLOYMENT.md'), deployInstructions);

console.log('\n✅ Deployment package created successfully!');
console.log(`📁 Deployment files are in the '${deployDir}' directory`);
console.log('\n📋 Next steps:');
console.log('1. Review DEPLOYMENT.md for detailed instructions');
console.log('2. Deploy backend to Heroku/Railway');
console.log('3. Deploy frontend to Netlify');
console.log('4. Update environment variables');
console.log('5. Test your deployment!');

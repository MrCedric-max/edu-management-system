const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Heroku deployment...');

// Check if Heroku CLI is installed
try {
  execSync('heroku --version', { stdio: 'ignore' });
  console.log('✅ Heroku CLI found');
} catch (error) {
  console.error('❌ Heroku CLI not found. Please install it from https://devcenter.heroku.com/articles/heroku-cli');
  process.exit(1);
}

// Create Heroku app
const appName = 'edu-management-cameroon-' + Math.random().toString(36).substr(2, 9);
console.log(`📱 Creating Heroku app: ${appName}`);

try {
  execSync(`heroku create ${appName}`, { stdio: 'inherit' });
  console.log('✅ Heroku app created');
} catch (error) {
  console.error('❌ Failed to create Heroku app:', error.message);
  process.exit(1);
}

// Add PostgreSQL addon
console.log('🗄️ Adding PostgreSQL addon...');
try {
  execSync(`heroku addons:create heroku-postgresql:mini --app ${appName}`, { stdio: 'inherit' });
  console.log('✅ PostgreSQL addon added');
} catch (error) {
  console.error('❌ Failed to add PostgreSQL addon:', error.message);
}

// Set environment variables
console.log('🔧 Setting environment variables...');
const envVars = {
  'NODE_ENV': 'production',
  'JWT_SECRET': 'edu_management_cameroon_2024_secure_key',
  'FRONTEND_URL': 'https://your-frontend-app.netlify.app'
};

for (const [key, value] of Object.entries(envVars)) {
  try {
    execSync(`heroku config:set ${key}="${value}" --app ${appName}`, { stdio: 'inherit' });
    console.log(`✅ Set ${key}`);
  } catch (error) {
    console.error(`❌ Failed to set ${key}:`, error.message);
  }
}

// Deploy to Heroku
console.log('📤 Deploying to Heroku...');
try {
  execSync(`git add .`, { stdio: 'inherit' });
  execSync(`git commit -m "Deploy to Heroku"`, { stdio: 'inherit' });
  execSync(`git push heroku main`, { stdio: 'inherit' });
  console.log('✅ Deployed to Heroku');
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}

// Run database migrations
console.log('🗄️ Running database migrations...');
try {
  execSync(`heroku run "node setup-database.js" --app ${appName}`, { stdio: 'inherit' });
  console.log('✅ Database migrations completed');
} catch (error) {
  console.error('❌ Database migrations failed:', error.message);
}

console.log(`🎉 Deployment complete!`);
console.log(`🌐 Backend URL: https://${appName}.herokuapp.com`);
console.log(`📊 Health check: https://${appName}.herokuapp.com/health`);
console.log(`🔧 API: https://${appName}.herokuapp.com/api`);

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🌐 Starting Netlify deployment...');

// Check if Netlify CLI is installed
try {
  execSync('netlify --version', { stdio: 'ignore' });
  console.log('✅ Netlify CLI found');
} catch (error) {
  console.error('❌ Netlify CLI not found. Please install it with: npm install -g netlify-cli');
  process.exit(1);
}

// Build frontend (if needed)
console.log('🏗️ Building frontend...');
console.log('✅ Frontend is already built (static files)');

// Deploy to Netlify
console.log('📤 Deploying to Netlify...');
try {
  // Initialize Netlify site
  execSync('netlify init', { stdio: 'inherit' });
  
  // Deploy
  execSync('netlify deploy --prod', { stdio: 'inherit' });
  
  console.log('✅ Deployed to Netlify');
} catch (error) {
  console.error('❌ Netlify deployment failed:', error.message);
  process.exit(1);
}

console.log('🎉 Frontend deployment complete!');
console.log('🌐 Your site is now live on Netlify');

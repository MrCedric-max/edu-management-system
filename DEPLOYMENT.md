# 🚀 Deployment Guide - Educational Management System

## 📋 Prerequisites

### Required Tools:
- [Git](https://git-scm.com/) - Version control
- [Node.js](https://nodejs.org/) (v16+) - Runtime environment
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) - Backend deployment
- [Netlify CLI](https://docs.netlify.com/cli/get-started/) - Frontend deployment

### Accounts Needed:
- [GitHub](https://github.com/) - Code repository
- [Heroku](https://heroku.com/) - Backend hosting
- [Netlify](https://netlify.com/) - Frontend hosting

## 🚀 Quick Deployment

### Option 1: Automated Deployment
```bash
# Install dependencies
npm install

# Deploy everything automatically
npm run deploy:all
```

### Option 2: Manual Step-by-Step

#### 1. Backend Deployment (Heroku)
```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login

# Deploy backend
npm run deploy:heroku
```

#### 2. Frontend Deployment (Netlify)
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy frontend
npm run deploy:netlify
```

## 🔧 Manual Deployment Steps

### Backend (Heroku)

1. **Create Heroku App:**
   ```bash
   heroku create your-app-name
   ```

2. **Add PostgreSQL:**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

3. **Set Environment Variables:**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-secure-secret
   heroku config:set FRONTEND_URL=https://your-frontend.netlify.app
   ```

4. **Deploy:**
   ```bash
   git push heroku main
   ```

5. **Run Database Setup:**
   ```bash
   heroku run "node setup-database.js"
   ```

### Frontend (Netlify)

1. **Connect Repository:**
   - Go to [Netlify](https://netlify.com/)
   - Click "New site from Git"
   - Connect your GitHub repository

2. **Build Settings:**
   - Build command: `echo 'Frontend is already built'`
   - Publish directory: `frontend`

3. **Environment Variables:**
   - Add `REACT_APP_API_URL` = `https://your-backend.herokuapp.com/api`

4. **Deploy:**
   - Click "Deploy site"

## 🌐 Production URLs

After deployment, you'll have:
- **Frontend**: `https://your-app.netlify.app`
- **Backend API**: `https://your-app.herokuapp.com/api`
- **Health Check**: `https://your-app.herokuapp.com/health`

## 🔍 Testing Deployment

### 1. Health Check
```bash
curl https://your-backend.herokuapp.com/health
```

### 2. Test Registration
```bash
curl -X POST https://your-backend.herokuapp.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","firstName":"Test","lastName":"User","role":"teacher"}'
```

### 3. Test Frontend
- Visit your Netlify URL
- Try registering a new user
- Test language switching
- Test all features

## 🛠️ Troubleshooting

### Common Issues:

1. **Database Connection Failed:**
   - Check Heroku PostgreSQL addon is active
   - Verify DATABASE_URL environment variable

2. **Frontend Can't Connect to Backend:**
   - Update netlify.toml with correct backend URL
   - Check CORS settings in backend

3. **Build Failures:**
   - Check Node.js version compatibility
   - Verify all dependencies are installed

### Logs:
```bash
# Backend logs
heroku logs --tail

# Frontend logs
netlify logs
```

## 📊 Monitoring

### Heroku Dashboard:
- Monitor app performance
- Check database usage
- View error logs

### Netlify Dashboard:
- Monitor site performance
- Check build logs
- View analytics

## 🔄 Updates

To update the deployed system:
```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push origin main

# Backend will auto-deploy from GitHub
# Frontend will auto-deploy from GitHub
```

## 🎉 Success!

Once deployed, your bilingual educational management system will be live and accessible worldwide!

- **Francophone System**: French language with SIL, CP, CE1, CE2, CM1, CM2 classes
- **Anglophone System**: English language with Class 1-6
- **User Types**: Teachers, Parents, School Admins, Super Admins
- **Features**: Registration, Login, Dashboard, Student Management, etc.

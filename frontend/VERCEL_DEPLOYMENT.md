# Vercel Deployment Guide

## Prerequisites
- Railway backend URL (e.g., `https://your-app.up.railway.app`)
- Vercel account (sign up at https://vercel.com)

## Step-by-Step Deployment

### Step 1: Prepare Frontend for Vercel

The frontend is already configured! Just need to set environment variables.

### Step 2: Deploy to Vercel

#### Option A: Using Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Sign in with GitHub

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select "Import Git Repository"
   - Choose: `danibutt9914-dev/full-stack`
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Create React App
   - **Root Directory**: Click "Edit" and select `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

4. **Add Environment Variables**
   Click "Environment Variables" and add:
   
   ```
   Name: REACT_APP_API_URL
   Value: https://your-railway-backend.up.railway.app/api
   
   Name: REACT_APP_SOCKET_URL
   Value: https://your-railway-backend.up.railway.app
   
   Name: GENERATE_SOURCEMAP
   Value: false
   ```

   **⚠️ IMPORTANT**: Replace `your-railway-backend.up.railway.app` with your actual Railway URL!

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - Your app will be live at: `https://your-project.vercel.app`

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend folder
cd frontend

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? Select your account
# - Link to existing project? N
# - Project name? full-stack-frontend (or your choice)
# - Directory? ./
# - Override build command? N
# - Override output directory? N

# Add environment variables
vercel env add REACT_APP_API_URL
# Enter: https://your-railway-backend.up.railway.app/api

vercel env add REACT_APP_SOCKET_URL
# Enter: https://your-railway-backend.up.railway.app

# Deploy to production
vercel --prod
```

### Step 3: Update Railway Backend CORS

After deploying to Vercel, update your Railway environment variables:

1. Go to Railway dashboard
2. Select your backend service
3. Go to "Variables" tab
4. Update these variables:
   ```
   FRONTEND_URL=https://your-vercel-app.vercel.app
   SOCKET_ORIGINS=https://your-vercel-app.vercel.app
   ```
5. Railway will auto-redeploy

### Step 4: Test Your Deployment

1. **Open your Vercel URL**: `https://your-project.vercel.app`
2. **Test Registration/Login**
3. **Test Admin Dashboard** (admin@example.com / Admin123@)
4. **Check Browser Console** for any errors
5. **Test Real-time Features** (notifications, cart updates)

## Troubleshooting

### CORS Errors
**Problem**: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solution**:
1. Verify `FRONTEND_URL` in Railway matches your Vercel URL exactly
2. Check `SOCKET_ORIGINS` includes your Vercel URL
3. Redeploy Railway backend

### API Connection Failed
**Problem**: "NetworkError when attempting to fetch resource"

**Solution**:
1. Verify `REACT_APP_API_URL` in Vercel includes `/api` at the end
2. Check Railway backend is running (visit the URL)
3. Ensure Railway backend has all required env variables

### Build Fails on Vercel
**Problem**: "Build failed with exit code 1"

**Solution**:
```bash
# Test build locally first
cd frontend
npm run build

# If build succeeds locally but fails on Vercel:
# - Check Node.js version compatibility
# - Verify all dependencies are in package.json
# - Check for TypeScript errors if any
```

### Socket.IO Not Connecting
**Problem**: Real-time notifications not working

**Solution**:
1. Check browser console for Socket.IO errors
2. Verify `REACT_APP_SOCKET_URL` doesn't have `/api` (just the base URL)
3. Ensure Railway backend has `SOCKET_ORIGINS` set to Vercel URL

## Environment Variables Summary

### Railway Backend
```
FRONTEND_URL=https://your-vercel-app.vercel.app
SOCKET_ORIGINS=https://your-vercel-app.vercel.app
```

### Vercel Frontend
```
REACT_APP_API_URL=https://your-railway-backend.up.railway.app/api
REACT_APP_SOCKET_URL=https://your-railway-backend.up.railway.app
```

## Custom Domain (Optional)

### On Vercel:
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### On Railway:
1. Go to Service Settings → Networking
2. Add custom domain
3. Update DNS records

Then update environment variables to use custom domains!

## Continuous Deployment

Both Railway and Vercel support auto-deployment:

- **Push to GitHub** → Railway auto-deploys backend
- **Push to GitHub** → Vercel auto-deploys frontend

Changes you make locally and push will automatically deploy! 🚀

## Quick Links

- **Frontend (Vercel)**: https://your-project.vercel.app
- **Backend (Railway)**: https://your-service.up.railway.app
- **GitHub Repo**: https://github.com/danibutt9914-dev/full-stack

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app

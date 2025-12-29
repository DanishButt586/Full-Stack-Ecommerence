# 🚀 Complete Deployment Guide

## Overview

This guide covers deploying the full-stack e-commerce application:
- **Backend** → Railway
- **Frontend** → Vercel

## 📋 Prerequisites

- [x] GitHub repository: https://github.com/danibutt9914-dev/full-stack
- [ ] MongoDB Atlas account with database URL
- [ ] Railway account (sign up at https://railway.app)
- [ ] Vercel account (sign up at https://vercel.com)
- [ ] Stripe account with API keys
- [ ] Google OAuth credentials (optional)

---

## Part 1: Deploy Backend to Railway ⚙️

### Step 1: Sign Up & Connect GitHub

1. Go to https://railway.app
2. Click "Login" → "Login with GitHub"
3. Authorize Railway to access your repositories

### Step 2: Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose repository: `danibutt9914-dev/full-stack`
4. Railway will detect the repo

### Step 3: Configure Root Directory

1. After importing, click on the service
2. Go to "Settings" tab
3. Under "Build", set:
   - **Root Directory**: `Backend`
   - **Build Command**: (leave default or `npm install`)
   - **Start Command**: `npm start`

### Step 4: Add Environment Variables

Click on "Variables" tab and add these one by one:

#### Required Variables:
```
PORT=5000
NODE_ENV=production
```

#### Database:
```
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/ecommerce?retryWrites=true&w=majority
```
*(Replace with your actual MongoDB Atlas connection string)*

#### JWT & Session:
```
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_123456
JWT_EXPIRE=30d
SESSION_SECRET=your_super_secret_session_key_change_this_in_production_123456
```

#### CORS (Important - Update after Vercel deployment):
```
FRONTEND_URL=https://your-app-name.vercel.app
SOCKET_ORIGINS=https://your-app-name.vercel.app
```
*(For now, use a placeholder. You'll update this in Step 9)*

#### Socket.IO:
```
SOCKET_PING_TIMEOUT=20000
SOCKET_PING_INTERVAL=25000
```

#### Admin Credentials:
```
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin123@
```

#### Stripe Keys:
```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

#### Rate Limiting:
```
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
AUTH_RATE_LIMIT_MAX=50
```

#### Google OAuth (Optional):
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Step 5: Deploy Backend

1. Railway will automatically deploy after adding variables
2. Wait for deployment to complete (2-3 minutes)
3. Check "Deployments" tab for status

### Step 6: Get Your Railway Backend URL

1. Go to "Settings" tab
2. Under "Networking" section
3. Click "Generate Domain"
4. Copy your Railway URL (e.g., `https://full-stack-production-xxxx.up.railway.app`)

**✅ SAVE THIS URL - YOU'LL NEED IT FOR VERCEL!**

### Step 7: Test Backend

Open your Railway URL in browser. You should see:
```json
{
  "success": true,
  "message": "E-commerce API is running!",
  "timestamp": "2025-12-29T..."
}
```

---

## Part 2: Deploy Frontend to Vercel 🎨

### Step 8: Sign Up & Import Project

1. Go to https://vercel.com/dashboard
2. Click "Login" → "Continue with GitHub"
3. Click "Add New..." → "Project"
4. Click "Import" next to `danibutt9914-dev/full-stack`

### Step 9: Configure Build Settings

On the import screen:

1. **Framework Preset**: `Create React App`
2. **Root Directory**: Click "Edit" → Select `frontend` → Click "Continue"
3. **Build Command**: `npm run build` (default is fine)
4. **Output Directory**: `build` (default is fine)
5. **Install Command**: `npm install` (default is fine)

### Step 10: Add Environment Variables

Before clicking Deploy, expand "Environment Variables" section:

#### Variable 1:
- **Name**: `REACT_APP_API_URL`
- **Value**: `https://your-railway-url.up.railway.app/api`
  *(Replace with your actual Railway URL from Step 6, and add `/api` at the end)*

#### Variable 2:
- **Name**: `REACT_APP_SOCKET_URL`
- **Value**: `https://your-railway-url.up.railway.app`
  *(Same Railway URL, but WITHOUT `/api`)*

#### Variable 3:
- **Name**: `GENERATE_SOURCEMAP`
- **Value**: `false`
  *(Reduces build size)*

**Example**:
```
REACT_APP_API_URL=https://full-stack-production-xxxx.up.railway.app/api
REACT_APP_SOCKET_URL=https://full-stack-production-xxxx.up.railway.app
GENERATE_SOURCEMAP=false
```

### Step 11: Deploy Frontend

1. Click "Deploy"
2. Wait 2-3 minutes for build and deployment
3. Once complete, you'll see "Congratulations!"
4. Copy your Vercel URL (e.g., `https://full-stack-git-master-username.vercel.app`)

### Step 12: Update Railway CORS Settings

**IMPORTANT**: Now that you have your Vercel URL, update Railway:

1. Go back to Railway dashboard
2. Select your backend service
3. Click "Variables" tab
4. Update these two variables:
   ```
   FRONTEND_URL=https://your-actual-vercel-url.vercel.app
   SOCKET_ORIGINS=https://your-actual-vercel-url.vercel.app
   ```
5. Railway will automatically redeploy (wait 1-2 minutes)

---

## Part 3: Testing Your Deployment 🧪

### Test Checklist:

1. **Open Frontend**: Visit your Vercel URL
2. **Test Registration**:
   - Click "Sign Up"
   - Create a new customer account
   - Verify email validation works
3. **Test Login**:
   - Login with customer account
   - Check if dashboard loads
4. **Test Admin**:
   - Logout
   - Login with: `admin@example.com` / `Admin123@`
   - Verify admin dashboard loads
   - Check if customers list shows
5. **Test Products**:
   - Browse products
   - Add to cart
   - Check cart updates
6. **Test Real-time**:
   - As admin, create a notification
   - Check if it appears in real-time
7. **Check Console**:
   - Press F12 → Console tab
   - Verify no CORS errors
   - Check Socket.IO connection

---

## 🔧 Troubleshooting

### Problem: CORS Error in Browser Console

**Error**: "Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy"

**Solution**:
1. Go to Railway dashboard
2. Check `FRONTEND_URL` matches your Vercel URL exactly (including https://)
3. Update `SOCKET_ORIGINS` to same URL
4. Wait for Railway to redeploy

### Problem: "NetworkError when attempting to fetch resource"

**Solution**:
1. Verify Railway backend is running (visit the URL directly)
2. Check `REACT_APP_API_URL` in Vercel includes `/api` at the end
3. Ensure Railway has all environment variables set

### Problem: Build Failed on Vercel

**Solution**:
1. Check "Deployment" logs in Vercel dashboard
2. Common issues:
   - Missing dependencies → Add to `package.json`
   - Build command wrong → Should be `npm run build`
   - Node version → Vercel uses Node 18 by default

### Problem: Socket.IO Not Connecting

**Solution**:
1. Check browser console for Socket.IO errors
2. Verify `REACT_APP_SOCKET_URL` doesn't have `/api`
3. Check Railway logs for Socket.IO initialization messages

### Problem: Admin Login Shows "Not Authorized"

**Solution**:
1. Clear browser localStorage: Press F12 → Console → Type:
   ```javascript
   localStorage.clear(); location.reload();
   ```
2. Login again with admin credentials

---

## 📊 Deployment Summary

After completing all steps:

| Component | Platform | URL |
|-----------|----------|-----|
| **Backend API** | Railway | `https://your-service.up.railway.app` |
| **Frontend** | Vercel | `https://your-project.vercel.app` |
| **Database** | MongoDB Atlas | (connection string in Railway vars) |
| **Repository** | GitHub | https://github.com/danibutt9914-dev/full-stack |

---

## 🔄 Continuous Deployment

Both platforms support auto-deployment:

**To update your app**:
```bash
# Make changes locally
git add .
git commit -m "Your changes"
git push origin master

# Railway automatically deploys backend changes
# Vercel automatically deploys frontend changes
```

---

## 🎯 Quick Commands Reference

### Railway CLI (Optional):
```bash
npm install -g @railway/cli
railway login
railway link
railway run npm start
```

### Vercel CLI (Optional):
```bash
npm install -g vercel
vercel login
cd frontend
vercel --prod
```

---

## 📝 Important URLs to Save

1. **Frontend (Vercel)**: _____________________
2. **Backend (Railway)**: _____________________
3. **MongoDB Atlas**: _____________________
4. **GitHub Repo**: https://github.com/danibutt9914-dev/full-stack

---

## ✅ Deployment Checklist

- [ ] Railway backend deployed and running
- [ ] MongoDB Atlas connected
- [ ] All Railway environment variables set
- [ ] Railway backend URL copied
- [ ] Vercel frontend deployed
- [ ] Frontend environment variables set with Railway URL
- [ ] Railway CORS updated with Vercel URL
- [ ] Frontend accessible and loads
- [ ] Backend API responds
- [ ] Login/Registration works
- [ ] Admin dashboard accessible
- [ ] Socket.IO real-time features work
- [ ] No CORS errors in console

---

**🎉 Congratulations! Your full-stack e-commerce app is now live!**

Need help? Check:
- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- GitHub Issues: https://github.com/danibutt9914-dev/full-stack/issues

# Railway Deployment Guide

## Environment Variables Required

Add these in Railway dashboard under your service → Variables:

```
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
NODE_ENV=production
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d
SESSION_SECRET=your_session_secret_here
FRONTEND_URL=https://your-vercel-app.vercel.app

# Admin credentials
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin123@

# Socket.IO
SOCKET_ORIGINS=https://your-vercel-app.vercel.app
SOCKET_PING_TIMEOUT=20000
SOCKET_PING_INTERVAL=25000

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
AUTH_RATE_LIMIT_MAX=50
```

## Deployment Steps

1. **Push Backend to GitHub** (Already done ✅)
   - Repository: https://github.com/danibutt9914-dev/full-stack

2. **Create Railway Project**
   - Go to https://railway.app
   - Sign in with GitHub
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose: danibutt9914-dev/full-stack
   - Set root directory: `/Backend`

3. **Add Environment Variables**
   - In Railway dashboard, click on your service
   - Go to "Variables" tab
   - Add all variables listed above
   - **Important**: Update FRONTEND_URL after deploying to Vercel

4. **Deploy**
   - Railway will auto-deploy
   - Wait for build to complete
   - Copy your Railway URL (e.g., `https://your-app.up.railway.app`)

5. **Update CORS Settings**
   - After getting Vercel URL, update FRONTEND_URL and SOCKET_ORIGINS
   - Railway will auto-redeploy

## Your Railway URL
After deployment, your backend will be at:
`https://[your-service-name].up.railway.app`

Save this URL - you'll need it for Vercel frontend deployment!

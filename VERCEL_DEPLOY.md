# 🚀 Vercel Deployment Guide

## Prerequisites
- GitHub repository: vikrantwiz02/HydroTech
- Render backend: https://hydrotech.onrender.com (✅ Already deployed)
- Vercel account

## Quick Deploy to Vercel

### Option 1: One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vikrantwiz02/HydroTech)

### Option 2: Manual Deployment

1. **Connect GitHub to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import `vikrantwiz02/HydroTech` repository

2. **Configure Build Settings**
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Set Environment Variables**
   Add these in Vercel Dashboard → Settings → Environment Variables:
   
   ```
   VITE_API_BASE_URL=https://hydrotech.onrender.com
   VITE_GOOGLE_CLIENT_ID=318773664238-i46bhdj58m92c6n913o4vp3kamvb64vk.apps.googleusercontent.com
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - Your site will be live at `https://your-project.vercel.app`

## Post-Deployment Setup

### 1. Update Google OAuth
Once your Vercel deployment is live, add the production URL to Google Console:
- Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- Select your OAuth 2.0 Client ID
- Add to **Authorized JavaScript origins**:
  - `https://your-project.vercel.app`
- Add to **Authorized redirect URIs**:
  - `https://your-project.vercel.app`

### 2. Test Your Deployment
Visit your Vercel URL and verify:
- ✅ Frontend loads correctly
- ✅ API connection to Render backend works
- ✅ Google Sign-In functions properly
- ✅ Predictions and forecasting work

### 3. Custom Domain (Optional)
In Vercel Dashboard:
- Go to Settings → Domains
- Add your custom domain
- Update Google OAuth with custom domain URLs

## Architecture

```
┌─────────────────┐
│  Vercel (FREE)  │  Frontend (React + Vite)
│  Static Hosting │  https://your-project.vercel.app
└────────┬────────┘
         │
         │ API Calls
         ▼
┌─────────────────┐
│  Render (FREE)  │  Backend (FastAPI + ML Model)
│  Web Service    │  https://hydrotech.onrender.com
└────────┬────────┘
         │
         │ Database
         ▼
┌─────────────────┐
│ MongoDB Atlas   │  Database (FREE Tier)
│  (FREE)         │  512MB Storage
└─────────────────┘
```

## Costs
- **Vercel Frontend**: $0/month (FREE tier - 100GB bandwidth)
- **Render Backend**: $0/month (FREE tier - 750 hours/month)
- **MongoDB Atlas**: $0/month (FREE tier - 512MB)
- **Total**: **$0/month** 🎉

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### API Connection Issues
- Verify `VITE_API_BASE_URL` is set correctly
- Check Render backend is running: https://hydrotech.onrender.com
- Check browser console for CORS errors

### Google Sign-In Not Working
- Ensure production URL is added to Google OAuth settings
- Clear browser cache and cookies
- Check `VITE_GOOGLE_CLIENT_ID` environment variable

## Monitoring

### Vercel
- Dashboard: https://vercel.com/dashboard
- View deployments, analytics, and logs
- Automatic deployments on git push

### Render
- Dashboard: https://dashboard.render.com
- Monitor backend health and logs
- Note: Free tier sleeps after 15 min inactivity (wakes on request)

## Updates

To update your deployment:
1. Push changes to GitHub main branch
2. Vercel automatically rebuilds and deploys
3. Render automatically rebuilds if backend changes

## Support
- Vercel Docs: https://vercel.com/docs
- Render Docs: https://render.com/docs
- Vite Docs: https://vitejs.dev

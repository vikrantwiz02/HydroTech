# HydroTech Deployment Guide

## Architecture

- **Frontend**: Vercel (React + Vite)
- **Backend**: Render.com (FastAPI + Python)
- **Database**: MongoDB Atlas (already set up)

---

## Step 1: Deploy Backend on Render

### 1.1 Create Render Account
1. Go to https://render.com
2. Sign up with GitHub (free tier available)

### 1.2 Create New Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `hydrotech-backend`
   - **Environment**: `Python 3`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`

### 1.3 Add Environment Variables
In Render dashboard, add these environment variables:

```
MONGODB_URI=mongodb+srv://hydrotech:vikrant%4019JC@hydrotech.rmmo40o.mongodb.net/
OPENWEATHER_API_KEY=120c1d742105474a5f77dbf48559c643
```

### 1.4 Deploy
- Click "Create Web Service"
- Wait 5-10 minutes for deployment
- Copy your backend URL: `https://hydrotech-backend.onrender.com`

### 1.5 Test Backend
```bash
curl https://hydrotech-backend.onrender.com/
# Should return: {"status":"healthy","model_loaded":true,...}
```

---

## Step 2: Deploy Frontend on Vercel

### 2.1 Update vercel.json
Replace `your-backend-url.onrender.com` in `vercel.json` with your actual Render URL:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://hydrotech-backend.onrender.com/api/:path*"
    }
  ]
}
```

### 2.2 Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub

### 2.3 Import Project
1. Click "Add New..." → "Project"
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as is)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 2.4 Add Environment Variables
In Vercel project settings → Environment Variables:

```
VITE_API_BASE_URL=https://hydrotech-backend.onrender.com
VITE_WS_URL=wss://hydrotech-backend.onrender.com
VITE_GOOGLE_CLIENT_ID=318773664238-i46bhdj58m92c6n913o4vp3kamvb64vk.apps.googleusercontent.com
```

### 2.5 Deploy
- Click "Deploy"
- Wait 2-3 minutes
- Your app will be live at `https://hydrotech-xxx.vercel.app`

---

## Step 3: Update Google OAuth

### 3.1 Add Authorized Origins
Go to Google Cloud Console → Credentials:

**Authorized JavaScript origins:**
- Add: `https://hydrotech-xxx.vercel.app` (your Vercel URL)

**Authorized redirect URIs:**
- Add: `https://hydrotech-xxx.vercel.app`

---

## Step 4: Test Production

### 4.1 Test Backend
```bash
# Health check
curl https://hydrotech-backend.onrender.com/

# Test prediction
curl -X POST https://hydrotech-backend.onrender.com/api/predict/detailed \
  -H "Content-Type: application/json" \
  -d '{"rainfall":200,"temperature":28,"latitude":26.5,"longitude":80.4,"month":7}'
```

### 4.2 Test Frontend
1. Open `https://hydrotech-xxx.vercel.app`
2. Try making a prediction
3. Test Google login
4. Test forecasting panel

---

## Important Notes

### Free Tier Limitations

**Render (Backend):**
- ⚠️ Goes to sleep after 15 minutes of inactivity
- ⚠️ First request after sleep takes 30-60 seconds to wake up
- ✅ Free 750 hours/month
- ✅ Auto SSL/HTTPS

**Vercel (Frontend):**
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Auto SSL/HTTPS
- ✅ Instant global CDN

**MongoDB Atlas:**
- ✅ 512MB storage (free forever)
- ✅ Shared clusters

### To Prevent Backend Sleep
- Upgrade to Render paid plan ($7/month) for always-on
- OR use a free uptime monitor (e.g., UptimeRobot) to ping every 10 minutes

---

## Alternative: Deploy Backend on Railway

If Render is slow, try Railway.app (also free):

1. Go to https://railway.app
2. Connect GitHub
3. Deploy from repo
4. Set same environment variables
5. Get Railway URL and update Vercel env vars

---

## Environment Variables Reference

### Backend (.env or Render dashboard)
```bash
MONGODB_URI=mongodb+srv://hydrotech:vikrant%4019JC@hydrotech.rmmo40o.mongodb.net/
OPENWEATHER_API_KEY=120c1d742105474a5f77dbf48559c643
```

### Frontend (Vercel dashboard)
```bash
VITE_API_BASE_URL=https://your-backend-url.onrender.com
VITE_WS_URL=wss://your-backend-url.onrender.com
VITE_GOOGLE_CLIENT_ID=318773664238-i46bhdj58m92c6n913o4vp3kamvb64vk.apps.googleusercontent.com
```

---

## Troubleshooting

### Backend not loading
- Check Render logs: Dashboard → Logs
- Ensure all env vars are set
- Check MongoDB connection string

### Frontend can't reach backend
- Check CORS settings in backend/main.py
- Verify VITE_API_BASE_URL in Vercel
- Check browser console for errors

### Google OAuth fails
- Add Vercel URL to Google Console
- Clear browser cache
- Check VITE_GOOGLE_CLIENT_ID

---

## Quick Deploy Commands

```bash
# Push to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# Both Vercel and Render will auto-deploy from GitHub
```

---

## Custom Domain (Optional)

### Vercel
1. Settings → Domains
2. Add your domain
3. Update DNS records

### Render
1. Settings → Custom Domain
2. Add your domain
3. Update DNS records

---

## Costs Summary

- **Free Setup**: $0/month
  - Render free tier + Vercel free tier + MongoDB Atlas free
  - ⚠️ Backend sleeps after 15 min idle

- **Recommended Setup**: $7/month
  - Render Starter ($7) + Vercel free + MongoDB Atlas free
  - ✅ Backend always on, faster responses

- **Professional Setup**: $14/month
  - Render Starter ($7) + MongoDB Atlas M10 ($7)
  - ✅ Better performance, more storage

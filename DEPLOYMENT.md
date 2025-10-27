# HydroTech Deployment Guide

## Architecture

- **Frontend**: Vercel (React + Vite) - FREE
- **Backend**: Render.com (FastAPI + Python) - FREE  
- **Database**: MongoDB Atlas (already set up) - FREE
- **Total Cost**: $0/month ✅

---

## ⚠️ Why Not Vercel-Only?

Vercel serverless functions have a **250MB unzipped size limit**. Our ML backend (scikit-learn + numpy + pandas) is approximately **300MB**, which exceeds this limit. 

**Attempted solutions that don't work:**
- ❌ Lighter dependencies → scikit-learn alone is 150MB
- ❌ Model optimization → already using joblib compression
- ❌ Vercel Pro → still has same 250MB limit

**Solution:** Split deployment (both platforms have FREE tiers!)

---

## Important: Render.com is FREE!

**Render Free Tier:**
- ✅ 512MB RAM (perfect for ML models!)
- ✅ 750 hours/month (enough for 24/7 operation)
- ✅ No credit card required
- ✅ Auto SSL/HTTPS
- ⚠️ Sleeps after 15min idle (wakes in 30-60 seconds)

---

## Step 1: Deploy on Vercel

### 1.1 Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub (free tier available)

### 1.2 Import Project
1. Click "Add New..." → "Project"
2. Import your GitHub repository: `vikrantwiz02/HydroTech`
3. Configure:
   - **Framework Preset**: Vite (auto-detected)
   - **Root Directory**: `./` (leave as root)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)

> **Note**: Vercel will automatically detect both the frontend (Vite) and serverless functions (`api/index.py`). The Python runtime is configured in `vercel.json`.

### 1.3 Add Environment Variables
In Vercel project settings → Environment Variables:

**Frontend Environment Variables:**
```
VITE_API_BASE_URL=/
VITE_GOOGLE_CLIENT_ID=318773664238-i46bhdj58m92c6n913o4vp3kamvb64vk.apps.googleusercontent.com
```

**Backend Environment Variables:**
```
MONGODB_URI=mongodb+srv://hydrotech:vikrant%4019JC@hydrotech.rmmo40o.mongodb.net/
OPENWEATHER_API_KEY=120c1d742105474a5f77dbf48559c643
```

> **Important**: Set `VITE_API_BASE_URL=/` because the backend is now on the same domain via serverless functions!

### 1.4 Deploy
- Click "Deploy"
- Wait 3-5 minutes for both frontend build and Python dependencies installation
- Your app will be live at `https://hydrotech-xxx.vercel.app`

### 1.5 Test Deployment

**Test Backend API:**
```bash
# Health check
curl https://hydrotech-xxx.vercel.app/api/

# Test prediction
curl -X POST https://hydrotech-xxx.vercel.app/api/predict/detailed \
  -H "Content-Type: application/json" \
  -d '{"rainfall":200,"temperature":28,"latitude":26.5,"longitude":80.4,"month":7}'
```

**Test Frontend:**
1. Open `https://hydrotech-xxx.vercel.app`
2. Try making a prediction
3. Test Google login
4. Test forecasting panel

---

## Step 2: Update Google OAuth

### 2.1 Add Authorized Origins
Go to Google Cloud Console → Credentials:

**Authorized JavaScript origins:**
- Add: `https://hydrotech-xxx.vercel.app` (your Vercel URL)

**Authorized redirect URIs:**
- Add: `https://hydrotech-xxx.vercel.app`

---

## Important Notes

### Vercel Free Tier Limitations

**Serverless Functions:**
- ✅ 100 GB-hours/month compute time (generous!)
- ✅ 10-second execution timeout per function (enough for ML predictions)
- ✅ 1000 invocations/day on free tier
- ⚠️ 50 MB max deployment size (our model is ~2-3 MB, well within limits)
- ⚠️ Cold start: ~1-2 seconds on first request after idle

**Frontend:**
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Auto SSL/HTTPS
- ✅ Instant global CDN
- ✅ Automatic preview deployments for PRs

**MongoDB Atlas:**
- ✅ 512MB storage (free forever)
- ✅ Shared clusters

### Advantages of Vercel-Only Deployment

✅ **Single Platform**: No need to manage two separate services
✅ **No CORS Issues**: Frontend and backend on same domain
✅ **Always Free**: Generous free tier for hobby projects
✅ **No Sleep**: Functions wake instantly (unlike Render free tier)
✅ **Auto Scaling**: Handles traffic spikes automatically
✅ **Simpler Setup**: One deployment, one dashboard

---

## Environment Variables Reference

### Vercel Dashboard (All Variables)

**Frontend Variables (prefix with VITE_):**
```bash
VITE_API_BASE_URL=/
VITE_GOOGLE_CLIENT_ID=318773664238-i46bhdj58m92c6n913o4vp3kamvb64vk.apps.googleusercontent.com
```

**Backend Variables (no prefix needed):**
```bash
MONGODB_URI=mongodb+srv://hydrotech:vikrant%4019JC@hydrotech.rmmo40o.mongodb.net/
OPENWEATHER_API_KEY=120c1d742105474a5f77dbf48559c643
```

> **Note**: All variables are set in the same Vercel project. Frontend vars need `VITE_` prefix, backend vars don't.

---

## Troubleshooting

### Serverless Function Issues

**Problem**: 500 error on API calls
- **Solution**: Check Vercel function logs: Dashboard → Functions → View Logs
- Common causes:
  - Model file not found (check `backend/groundwater_model.joblib` is committed)
  - Missing environment variables (MONGODB_URI, OPENWEATHER_API_KEY)
  - Import errors (check `api/index.py` imports)

**Problem**: "Module not found" errors
- **Solution**: Ensure `requirements.txt` is in root directory with all dependencies
- Verify: Check build logs for Python package installation
- Try: Redeploy to trigger fresh Python environment

**Problem**: Cold start timeout (first request slow)
- **Expected**: 1-2 seconds on first call after idle
- **If longer**: Model file might be too large, check file size
- **Workaround**: Keep functions warm with periodic pings (UptimeRobot)

**Problem**: API returns 404
- **Solution**: Verify `vercel.json` rewrites are correct
- Current config: `/api/*` → `/api/index` (serverless function)
- Check: Make sure `api/index.py` exists and is committed

### Database Issues

**MongoDB connection fails**
- Verify MONGODB_URI in Vercel dashboard
- Check password is URL-encoded: `%4019JC` not `@19JC`
- Test connection string in MongoDB Compass locally

### Frontend Issues

**Frontend can't reach backend**
- Check `VITE_API_BASE_URL=/` in Vercel dashboard (not full URL!)
- Browser console should show requests to `/api/*`
- Verify network tab: requests should go to same domain

**Google OAuth fails**
- Add Vercel URL to Google Console → Authorized JavaScript origins
- Add `https://your-app.vercel.app/auth/callback` to redirect URIs
- Clear browser cache and cookies
- Check `VITE_GOOGLE_CLIENT_ID` in Vercel dashboard

**Build errors**
- Ensure `package.json` has correct build command
- Check TypeScript errors: `npm run build` locally
- Verify all imports are correct (case-sensitive)

---

## Quick Deploy Commands

```bash
# Commit and push to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# Vercel auto-deploys from GitHub
# Check deployment progress: https://vercel.com/dashboard
```

---

## Deployment Best Practices

### File Organization
```
✅ GOOD - Vercel serverless structure:
HydroTech/
├── api/                   # Vercel serverless functions
│   └── index.py           # FastAPI adapter
├── backend/               # Backend source code
│   ├── main.py            # FastAPI app
│   └── *.py               # Other modules
├── src/                   # Frontend React code
├── package.json           # Frontend dependencies
├── requirements.txt       # Backend Python dependencies (root!)
└── vercel.json            # Unified deployment config
```

### Deployment Checklist

**Before first deploy:**
- [ ] `api/index.py` exists with Mangum adapter
- [ ] `requirements.txt` in root directory with all Python deps
- [ ] `vercel.json` configured for Python runtime
- [ ] `backend/groundwater_model.joblib` committed to repo
- [ ] All secrets set in Vercel dashboard

**For each deployment:**
- [ ] Test locally: `npm run dev` (frontend) and `cd backend && uvicorn main:app --reload` (backend)
- [ ] Commit and push: `git push origin main`
- [ ] Vercel auto-deploys (3-5 min for Python packages)
- [ ] Check function logs if errors occur
- [ ] Test: `curl https://your-app.vercel.app/api/` and visit app

### Common Workflows

**Backend changes:**
```bash
# Edit backend/main.py or other backend files
git add backend/ api/
git commit -m "Fix: Update prediction logic"
git push origin main
# Result: Vercel redeploys serverless functions
```

**Frontend changes:**
```bash
# Edit src/App.tsx or components
git add src/
git commit -m "UI: Update dashboard"
git push origin main
# Result: Vercel rebuilds frontend
```

**Full-stack changes:**
```bash
# Edit both
git add .
git commit -m "Feature: New forecasting panel"
git push origin main
# Result: Vercel redeploys everything
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

- **Free Setup**: $0/month ✅ **RECOMMENDED**
  - Vercel Hobby (free) + MongoDB Atlas free tier (512MB)
  - ✅ 100 GB-hours serverless compute/month
  - ✅ 1000 function invocations/day
  - ✅ 100 GB bandwidth/month
  - ⚠️ 1-2 second cold start on first request after idle
  - **Perfect for**: Personal projects, demos, portfolios

- **Pro Setup**: $20/month (if you need more)
  - Vercel Pro ($20) + MongoDB Atlas free
  - ✅ Unlimited function invocations
  - ✅ Advanced analytics and monitoring
  - ✅ Team collaboration features

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         GitHub Repo                          │
│  ┌──────────────────────┐  ┌───────────────────────────┐   │
│  │  Frontend (src/)     │  │  Backend (backend/)       │   │
│  │  - React + TypeScript│  │  - FastAPI + Python      │   │
│  │  - Vite build        │  │  - ML model + API        │   │
│  └──────────────────────┘  └───────────────────────────┘   │
│                                       │                      │
│                          ┌────────────┴──────────┐          │
│                          │   api/index.py        │          │
│                          │   (Mangum adapter)    │          │
│                          └───────────────────────┘          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                git push → Vercel (Single Platform)
                               │
                ┌──────────────┴──────────────┐
                │                             │
         ┌──────▼─────┐              ┌───────▼────────┐
         │   Static   │              │   Serverless   │
         │  Frontend  │              │   Functions    │
         │   (CDN)    │              │   (Python)     │
         └──────┬─────┘              └───────┬────────┘
                │                            │
                │      Same Domain           │
                │    (No CORS!)              │
                │                            │
                └────────────┬───────────────┘
                             │
                             │ MongoDB Atlas
                             ▼
                      ┌──────────────┐
                      │   Database   │
                      │   + Weather  │
                      │     APIs     │
                      └──────────────┘
                             ▲
                             │
                      ┌──────┴───────┐
                      │    Users     │
                      │  (Browser)   │
                      └──────────────┘
```

**Data Flow:**
1. User visits `https://your-app.vercel.app` (static frontend via CDN)
2. Frontend makes API calls to `/api/*` (same domain, no CORS!)
3. Vercel routes `/api/*` to serverless function (`api/index.py`)
4. Mangum converts FastAPI to serverless handler
5. Backend processes prediction using ML model
6. Backend stores/retrieves data from MongoDB Atlas
7. Backend fetches real-time weather from OpenWeather API
8. Results returned to frontend for display

**Deployment Flow:**
```
git push → GitHub → Vercel
                    ├─→ Build frontend (Vite → dist/)
                    ├─→ Install Python deps (requirements.txt)
                    └─→ Deploy serverless functions (api/*.py)
```

---

## Support

Issues? Check:
1. **Vercel Function Logs**: https://vercel.com/dashboard → Your Project → Deployments → View Function Logs
2. **Vercel Build Logs**: Dashboard → Deployments → Build Logs
3. **MongoDB Logs**: https://cloud.mongodb.com → Clusters → Metrics

### Useful Commands

```bash
# Test serverless function locally (requires Vercel CLI)
npm i -g vercel
vercel dev

# View logs in real-time
vercel logs --follow

# Check deployment status
vercel ls
```

Good luck with your deployment! 🚀

# ⚠️ IMPORTANT: Vercel Serverless Functions Limitation

Due to Vercel's 250MB unzipped size limit for serverless functions, deploying the full ML backend (scikit-learn + numpy + pandas ≈ 300MB) is not possible on Vercel's free tier.

## Recommended Solutions:

### Option 1: Split Deployment (RECOMMENDED)
- **Frontend**: Deploy on Vercel (works perfectly!)
- **Backend**: Deploy on a platform with larger limits:
  - **Render.com** (512MB limit, free tier)  
  - **Railway.app** (free tier, no strict limits)
  - **Google Cloud Run** (4GB limit, generous free tier)
  - **AWS Lambda** (250MB compressed, 10GB uncompressed)

### Option 2: Optimize Model Size
- Use a lighter model (LinearRegression instead of RandomForest)
- Reduce number of features
- Use model quantization
- Store model externally (S3/GCS) and load at runtime

### Option 3: Vercel Pro
- Upgrade to Vercel Pro ($20/month)
- Serverless function limit: 50MB → still too small for full ML stack

## Current Setup:
- ✅ Frontend builds successfully on Vercel
- ❌ Backend exceeds 250MB limit
- Package sizes:
  - scikit-learn: ~150MB
  - numpy: ~50MB  
  - pandas: ~50MB
  - Other deps: ~50MB
  - **Total**: ~300MB (exceeds 250MB limit)

## Next Steps:
1. Keep frontend on Vercel
2. Deploy backend to Render.com (follow DEPLOYMENT.md Render section)
3. Update `VITE_API_BASE_URL` in Vercel to point to Render backend URL

See DEPLOYMENT.md for detailed instructions.

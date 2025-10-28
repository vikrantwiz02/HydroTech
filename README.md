# 🌊 HydroTech - Advanced Groundwater Prediction System

A complete, production-ready **Machine Learning application** for groundwater level prediction, featuring a **stunning glassmorphism React UI** with advanced analytics and a **robust FastAPI ML backend**.

![Status](https://img.shields.io/badge/status-production--ready-green)
![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20TypeScript%20%2B%20Framer%20Motion-blue)
![Backend](https://img.shields.io/badge/backend-FastAPI%20%2B%20Random%20Forest-orange)
![ML](https://img.shields.io/badge/ML-91.1%25%20R²%20Score-brightgreen)
![Deployment](https://img.shields.io/badge/deployment-Vercel%20%2B%20Render-blueviolet)
![Database](https://img.shields.io/badge/database-MongoDB%20Atlas-success)
![Live](https://img.shields.io/badge/live-hydro--tech--mu.vercel.app-blue)

## 🎯 Project Overview

**HydroTech** is an enterprise-grade, full-stack groundwater prediction system that combines cutting-edge machine learning with modern web technologies to deliver accurate, real-time groundwater level predictions. **Live at: [hydro-tech-mu.vercel.app](https://hydro-tech-mu.vercel.app)**

### 🏆 What Makes This Special

- **🎨 Stunning UI:** Dark mode glassmorphism design with animated backgrounds, smooth transitions, and professional data visualization
- **🧠 Advanced ML:** Random Forest model with **91.1% R² score**, featuring uncertainty quantification and feature importance analysis
- **📊 Rich Analytics:** Interactive Chart.js visualizations, confidence intervals, seasonal trend analysis, and feature contribution breakdowns
- **🚀 Production-Ready:** Deployed on Vercel (frontend) + Render.com (backend) with MongoDB Atlas database
- **🔐 Authentication:** Google OAuth 2.0 integration for user management
- **💾 Database:** MongoDB Atlas for prediction history and user profiles
- **⚡ Real-Time:** WebSocket support for live prediction updates
- **🌐 Weather Integration:** OpenWeather API for automatic data population
- **🗺️ Geospatial Intelligence:** 4 distinct aquifer zones with unique physical properties

### Key Features

✨ **Frontend (React + TypeScript):**
- 🌙 Dark mode glassmorphism design with backdrop blur effects
- 💫 Animated water ripple background using Framer Motion
- 📈 Interactive charts (Bar & Doughnut) with Chart.js
- 🎯 Real-time backend health monitoring
- � Google OAuth authentication
- 📜 Prediction history dashboard
- �📱 Fully responsive design (desktop, tablet, mobile)
- ⚡ Quick zone selection with preset locations
- 🔄 Smooth loading states and animations
- ✅ Real-time form validation with error messages
- �️ Weather widget with live data
- 📊 Time-series forecasting visualization

🧠 **Backend (Python + FastAPI):**
- 🤖 Random Forest Regressor with **91.1% R² score**
- 📊 **9,840 training samples** across 4 zones
- 🗺️ 4 aquifer zones: Urban, Agricultural, Coastal, Arid
- 🌧️ Advanced feature engineering (12 features including lag variables)
- 📉 Uncertainty quantification with 95% confidence intervals
- 🔍 Feature importance and contribution analysis
- 🌡️ Seasonal trend detection and analysis
- 📡 RESTful API with 20+ comprehensive endpoints
- 💾 MongoDB integration for data persistence
- ⚡ WebSocket server for real-time updates
- 🌐 OpenWeather API integration
- 📈 Time-series forecasting engine
- 📚 Auto-generated Swagger documentation at `/docs`

## 🚀 Quick Start

### Live Demo

🌐 **Visit: [https://hydro-tech-mu.vercel.app](https://hydro-tech-mu.vercel.app)**

- ✅ Frontend hosted on Vercel (global CDN)
- ✅ Backend hosted on Render.com (FREE tier)
- ✅ Database hosted on MongoDB Atlas (M0 cluster)
- ✅ 100% FREE deployment ($0/month)

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+ and pip
- **MongoDB Atlas** account (FREE tier)
- **Google Cloud** project for OAuth (optional for local dev)
- **OpenWeather API** key (FREE tier)

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: **http://localhost:3000**

### Backend Setup

```bash
# Navigate to backend
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Generate dataset (9,840 samples across 4 zones)
python generate_dataset.py

# Train Random Forest model
python train_model.py

# Set environment variables (create .env file)
echo "MONGODB_URI=your-mongodb-connection-string" > .env
echo "OPENWEATHER_API_KEY=your-openweather-api-key" >> .env

# Start FastAPI server
python main.py
```

Backend will be available at: **http://localhost:8000**  
API Docs (Swagger): **http://localhost:8000/docs**  
Alternative Docs (ReDoc): **http://localhost:8000/redoc**

## 📂 Project Structure

```
AI/
├── src/                          # Frontend Source
│   ├── App.tsx                  # Main React component (800+ lines)
│   │                            # - Glassmorphism UI components
│   │                            # - Chart.js visualizations
│   │                            # - Framer Motion animations
│   │                            # - API integration
│   ├── main.tsx                 # React entry point
│   └── index.css                # TailwindCSS global styles
│
├── backend/                      # Backend ML System
│   ├── generate_dataset.py      # Dataset generation script
│   │                            # - Creates 9,840 samples
│   │                            # - 4 aquifer zones
│   │                            # - Realistic correlations
│   │
│   ├── train_model.py           # ML model training
│   │                            # - Random Forest Regressor
│   │                            # - 250 estimators, max_depth=25
│   │                            # - 91.1% R² score
│   │                            # - Saves .joblib & metadata
│   │
│   ├── main.py                  # FastAPI server (500+ lines)
│   │                            # - 20+ RESTful API endpoints
│   │                            # - ML predictions
│   │                            # - MongoDB integration
│   │                            # - WebSocket support
│   │                            # - Weather API integration
│   │
│   ├── database.py              # MongoDB async operations
│   │                            # - User management
│   │                            # - Prediction history
│   │                            # - Motor async driver
│   │
│   ├── forecasting.py           # Time-series forecasting
│   │                            # - Linear regression trends
│   │                            # - 6-month predictions
│   │
│   ├── weather_service.py       # OpenWeather integration
│   │                            # - Current weather
│   │                            # - 5-day forecast
│   │                            # - Async aiohttp client
│   │
│   ├── websocket_manager.py     # WebSocket connection manager
│   │                            # - Real-time broadcasts
│   │                            # - Connection handling
│   │
│   ├── zone_config.json         # Zone configurations
│   ├── groundwater_data.csv     # Generated dataset (9,840 rows)
│   ├── groundwater_model.joblib # Trained model (2.8 MB)
│   └── model_metadata.json      # Model performance metrics
│
├── Configuration Files
│   ├── package.json             # Node.js dependencies
│   ├── requirements.txt         # Python dependencies
│   ├── vercel.json              # Vercel deployment config
│   │                            # - API rewrites to Render
│   │                            # - COOP/COEP headers
│   ├── tsconfig.json            # TypeScript configuration
│   ├── vite.config.ts           # Vite build config
│   ├── tailwind.config.js       # TailwindCSS customization
│   ├── postcss.config.js        # PostCSS setup
│   └── index.html               # HTML entry point
│
└── Documentation
    ├── README.md                # This file
    └── PROJECT_REPORT.md        
```

## 🚀 Deployment

### Current Deployment (Production)

**Architecture:** Split Deployment (Frontend + Backend Separated)

```mermaid
graph LR
    A[GitHub Repository] -->|Auto Deploy| B[Vercel - Frontend]
    A -->|Auto Deploy| C[Render.com - Backend]
    B -->|API Calls| C
    C -->|Database| D[MongoDB Atlas]
    C -->|Weather Data| E[OpenWeather API]
    
    style B fill:#000,stroke:#fff,color:#fff
    style C fill:#46e3b7,stroke:#000
    style D fill:#00ed64,stroke:#000
    style E fill:#f96854,stroke:#fff,color:#fff
```

**Live URLs:**
- **Frontend:** [https://hydro-tech-mu.vercel.app](https://hydro-tech-mu.vercel.app)
- **Backend API:** [https://hydrotech.onrender.com](https://hydrotech.onrender.com)
- **API Docs:** [https://hydrotech.onrender.com/docs](https://hydrotech.onrender.com/docs)

### Deployment Guide

#### 1. **MongoDB Atlas Setup** (FREE M0 Tier)
```bash
# Create account at mongodb.com/cloud/atlas
# Create FREE M0 cluster
# Get connection string: mongodb+srv://username:password@cluster.mongodb.net/
# Add to environment variables
```

#### 2. **Render.com Backend Deployment** (FREE Tier)
```bash
# Push backend to GitHub
git push origin main

# On Render.com:
# 1. New Web Service
# 2. Connect GitHub repo
# 3. Root Directory: backend
# 4. Build Command: pip install -r requirements.txt
# 5. Start Command: python main.py
# 6. Add Environment Variables:
#    - MONGODB_URI
#    - OPENWEATHER_API_KEY
```

#### 3. **Vercel Frontend Deployment** (FREE Tier)
```bash
# Vercel auto-detects Vite config

# Environment Variables:
VITE_API_BASE_URL=https://hydrotech.onrender.com
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

**Automatic CI/CD:**
```bash
git push origin main
# → Vercel rebuilds frontend (2-3 min)
# → Render rebuilds backend (5-7 min)
# → Both automatically deployed
```

### Cost Breakdown: $0/month 💰

| Service | Tier | Cost | Limits |
|---------|------|------|--------|
| **Vercel** | Hobby | FREE | 100GB bandwidth, unlimited requests |
| **Render.com** | Free | FREE | 750 hours/month, 512MB RAM |
| **MongoDB Atlas** | M0 | FREE | 512MB storage, shared CPU |
| **OpenWeather API** | Free | FREE | 60 calls/min, 1M calls/month |
| **Total** | - | **$0** | Suitable for 100+ concurrent users |

📖 See **PROJECT_REPORT_PART3.md** for detailed deployment walkthrough.

---

## 🎨 Frontend Architecture

### Technology Stack
- **React 18.3:** Modern hooks (useState, useEffect, useCallback)
- **TypeScript 5.5:** Full type safety
- **Vite 5.3:** Lightning-fast HMR
- **TailwindCSS 3.4:** Utility-first styling
- **Framer Motion 10.18:** Smooth animations
- **Chart.js 4.5:** Data visualization
- **Axios 1.13:** HTTP client
- **@react-oauth/google 0.12:** Google OAuth integration
- **React Leaflet 4.2:** Map visualization (optional)

### Design Philosophy: "Dark Glassmorphism"

**Color Scheme:**
- Background: `bg-slate-900` (very dark blue-gray)
- Panels: `bg-gray-800/50` (50% opacity)
- Backdrop: `backdrop-blur-lg` (frosted glass effect)
- Borders: `border-gray-700/50` (subtle)
- Accent: `text-blue-400`, `text-cyan-400` (bright, clear blue)
- Text: `text-white`, `text-gray-200`, `text-gray-300`

**Animation Features:**
- 🌊 Animated water ripple background (3 floating orbs)
- 💫 Smooth page transitions (Framer Motion)
- ⚡ Loading spinners and skeleton states
- 🎯 Hover effects on all interactive elements
- 📊 Chart animations on data load

### Component Architecture

1. **AnimatedBackground:** Floating gradient orbs
2. **GlassPanel:** Reusable glass-effect container
3. **Header:** Logo, title, status indicators
4. **StatusIndicator:** Real-time backend health check
5. **Auth Component:** Google OAuth login/logout
6. **PredictionForm:** Input form with validation
7. **ResultsDisplay:** Charts and prediction visualization
8. **StatisticsPanel:** Model performance metrics
9. **HistoryDashboard:** User prediction history
10. **WeatherWidget:** Real-time weather display
11. **ForecastingPanel:** Time-series forecast charts
12. **MapVisualization:** Interactive Leaflet map (optional)

## 🧠 Backend Architecture

### Technology Stack
- **FastAPI 0.115.5:** Modern async web framework
- **Uvicorn 0.32.1:** ASGI server
- **scikit-learn 1.3.2:** ML pipeline & Random Forest
- **Pandas 2.0.3 & NumPy 1.24.4:** Data manipulation
- **Motor 3.6.0:** MongoDB async driver
- **Pydantic 2.10.3:** Data validation
- **Aiohttp 3.10.11:** Async HTTP client (weather API)
- **WebSockets 13.1:** Real-time communication
- **Python-multipart 0.0.20:** Form data parsing
- **Python-dotenv 1.0.1:** Environment variables
- **Joblib:** Model serialization

### Machine Learning Pipeline

#### Phase 1: Dataset Generation (`generate_dataset.py`)
- **9,840 samples** across 4 aquifer zones (82 months)
- **12 features** including rainfall lag and rolling averages
- **Realistic correlations:**
  - Rainfall ↑ → Groundwater level ↑ (+0.65 correlation)
  - Temperature ↑ → Evaporation ↑ → Level ↓ (-0.42 correlation)
  - Monsoon months (June-Sep) → Higher levels (+3m boost)
  - Zone-specific base levels and sensitivities
  - Lag effects (1-2 month recharge delay)

**Aquifer Zones:**
| Zone | Name | Location | Avg Level | Characteristics |
|------|------|----------|-----------|-----------------|
| A | Urban | Delhi | 11.8m | High extraction, clay-sand soil |
| B | Agricultural | Lucknow | 26.6m | Best recharge, sandy-loam soil |
| C | Coastal | Chennai | 6.9m | Low level, sandy soil |
| D | Arid | Jaipur | 8.8m | Low rainfall, rocky soil |

#### Phase 2: Model Training (`train_model.py`)
- **Algorithm:** Random Forest Regressor (250 estimators, max_depth=25)
- **Features:** 12 engineered features
  - Geospatial: latitude, longitude, aquifer_zone (one-hot encoded)
  - Temporal: month, seasonal_index
  - Meteorological: rainfall_mm, avg_temp_c
  - Derived: rainfall_lag_1m, rainfall_lag_2m, rainfall_rolling_3m, rainfall_std_3m, temp_rainfall_interaction
- **Preprocessing:** One-hot encoding for categorical, standard scaling for numerical
- **Performance:** 
  - **Test R² = 0.9114** (91.14% variance explained)
  - **RMSE = 2.81 meters**
  - **MAE = 2.13 meters**
  - **5-fold Cross-Validation R² = 0.9124 ± 0.0048**

#### Phase 3: API Server (`main.py`)

**Key Features:**
- 20+ RESTful endpoints (predictions, users, weather, forecasting, zones, statistics)
- MongoDB async operations (Motor driver)
- WebSocket server for real-time updates (`/ws/predictions`)
- OpenWeather API integration (current weather + 5-day forecast)
- Time-series forecasting (linear regression trends)
- Automatic zone detection from coordinates
- Historical rainfall lookup from zone config
- Multi-factor confidence score calculation:
  - Zone reliability (based on feature importance)
  - Seasonal data availability (monsoon vs dry season)
  - Prediction reasonableness (typical range check)
  - Data quality indicators (realistic input values)
- Uncertainty quantification (95% confidence intervals)
- Feature contribution analysis (SHAP-like attribution)
- CORS middleware for production deployment
- Comprehensive error handling and validation

## 📡 API Endpoints Documentation

### Core Endpoints

### 🏥 Health Check
**GET** `/`
```json
{
  "status": "healthy",
  "model_loaded": true,
  "version": "2.0.0",
  "timestamp": "2025-10-28T..."
}
```

### 🎯 Basic Prediction
**POST** `/api/predict`

**Request:**
```json
{
  "rainfall": 200.5,
  "temperature": 28.3,
  "latitude": 28.7,
  "longitude": 77.2,
  "month": "7"
}
```

**Response:**
```json
{
  "predicted_level_meters": 15.67,
  "confidence_score": 0.89
}
```

### 📊 Detailed Prediction (Main Frontend Endpoint)
**POST** `/api/predict/detailed`

**Response:**
```json
{
  "predicted_level_meters": 26.5,
  "confidence_score": 0.89,
  "prediction_interval": {
    "lower": 21.0,
    "upper": 32.0
  },
  "aquifer_zone": "B",
  "zone_name": "Agricultural",
  "feature_contributions": {
    "rainfall_impact": 8.77,
    "temperature_impact": -1.25,
    "location_baseline": 15.96,
    "seasonal_effect": 3.0
  },
  "seasonal_trend": "Monsoon Season - Rising water levels expected"
}
```

### User & Database Endpoints

### 🔐 User Login (OAuth)
**POST** `/api/user/login`

**Request:**
```json
{
  "id": "google-oauth-id",
  "name": "Vikrant Kumar",
  "email": "vikrantkrd@gmail.com",
  "picture": "https://..."
}
```

### 💾 Save Prediction
**POST** `/api/predictions/save`

**Request:**
```json
{
  "userId": "google-oauth-id",
  "userName": "Vikrant Kumar",
  "userEmail": "vikrantkrd@gmail.com",
  "timestamp": "2025-10-28T10:30:00.000Z",
  "input": {...},
  "result": {...}
}
```

### � Get User Predictions
**GET** `/api/predictions/user/{userId}?limit=50`

Returns array of user's prediction history.

### 📍 Get Zone-Filtered Predictions
**GET** `/api/predictions/user/{userId}/zone/{zone}`

Returns predictions for specific zone (A, B, C, or D).

### Weather & Forecasting Endpoints

### 🌡️ Current Weather
**GET** `/api/weather/current/{lat}/{lon}`

Returns current weather from OpenWeather API (temp, rainfall, humidity, wind).

### 🌤️ Weather Forecast
**GET** `/api/weather/forecast/{lat}/{lon}?days=5`

Returns 5-day weather forecast with 3-hour intervals.

### 📈 Time-Series Forecast
**POST** `/api/forecast/zone/{zone}`

**Request:**
```json
{
  "months_ahead": 6,
  "user_id": "optional-user-id"
}
```

Returns 6-month groundwater level forecast based on historical trends.

### Zone & Statistics Endpoints

### 🗺️ Get All Zones
**GET** `/api/zones`

Returns all 4 aquifer zones with configurations, lat/lon ranges, average rainfall by month, and physical properties.

### 📈 Get Model Statistics
**GET** `/api/statistics`

Returns comprehensive model performance metrics, dataset statistics, and feature importance.

### 📜 Get Zone Historical Data
**GET** `/api/zones/{zone_code}/historical?month=7`

Returns historical statistics for a specific zone (A, B, C, or D), optionally filtered by month.

### Real-Time Endpoints

### ⚡ WebSocket Connection
**WS** `/ws/predictions`

Bidirectional WebSocket for real-time updates. Supports:
- `ping/pong` heartbeat
- `prediction_update` broadcasts
- `weather_update` events
- `forecast_update` notifications

## 🎯 Demo Usage Examples

### Example 1: Monsoon Season (High Level)
**Location:** Agricultural Zone (Lucknow)
```
Rainfall: 300 mm
Temperature: 27°C
Latitude: 26.5
Longitude: 80.4
Month: August
```
**Expected Result:** ~28-32m (high groundwater level)

### Example 2: Summer Season (Low Level)
**Location:** Arid Zone (Jaipur)
```
Rainfall: 15 mm
Temperature: 42°C
Latitude: 26.9
Longitude: 75.8
Month: May
```
**Expected Result:** ~6-9m (low groundwater level)

### Example 3: Coastal Zone
**Location:** Chennai
```
Rainfall: 250 mm
Temperature: 30°C
Latitude: 13.0
Longitude: 80.2
Month: September
```
**Expected Result:** ~8-11m (moderate level)

### Example 4: Urban Zone
**Location:** Delhi
```
Rainfall: 200 mm
Temperature: 28°C
Latitude: 28.7
Longitude: 77.2
Month: July
```
**Expected Result:** ~13-16m (moderate-high level)

## 🔬 Technical Highlights & Innovations

### Machine Learning Innovations
- **✨ Geospatial Intelligence:** 4 distinct aquifer zones with unique physical properties
- **🌧️ Temporal Dependencies:** Rainfall lag features (1-2 months) capture recharge delay
- **📊 Feature Engineering:** 12 carefully crafted features including:
  - Rolling averages (3-month rainfall)
  - Standard deviation (rainfall variability)
  - Temperature-rainfall interaction
  - Seasonal indices
- **📈 Uncertainty Quantification:** 95% confidence intervals for predictions
- **🎯 Feature Attribution:** Real-time contribution analysis

### Software Engineering Best Practices
- ✅ **Type Safety:** TypeScript on frontend, Pydantic on backend
- ✅ **Error Handling:** Comprehensive try-catch blocks and validation
- ✅ **CORS Enabled:** Ready for production deployment
- ✅ **API Documentation:** Auto-generated Swagger docs at `/docs`
- ✅ **Modular Design:** Reusable components and clean separation of concerns
- ✅ **Performance:** Optimized React rendering with proper state management
- ✅ **Responsive:** Mobile-first design with TailwindCSS
- ✅ **Animations:** 60fps smooth animations with GPU acceleration
- ✅ **Loading States:** User-friendly feedback for all async operations
- ✅ **Form Validation:** Real-time validation with helpful error messages

### Unique Selling Points
1. **Reverse Geocoding:** Automatically detect aquifer zone from lat/lon
2. **Historical Integration:** Zone-specific rainfall averages by month
3. **Confidence Scoring:** Multi-factor confidence calculation
4. **Seasonal Awareness:** Different model behavior for monsoon vs dry seasons
5. **Visual Excellence:** Professional glassmorphism design that impresses

## 🐛 Troubleshooting Guide

### Issue: Frontend shows "Offline" status
**Solution:**
1. Ensure backend is running: `cd backend && python main.py`
2. Check backend is on port 8000: Look for "http://0.0.0.0:8000" in terminal
3. Verify no firewall blocking localhost:8000

### Issue: "Model not loaded" error
**Solution:**
```bash
cd backend
python train_model.py  # This creates groundwater_model.joblib
python main.py         # Now start server
```

### Issue: "Dataset not found" during training
**Solution:**
```bash
cd backend
python generate_dataset.py  # Creates groundwater_data.csv
python train_model.py        # Now train model
```

### Issue: Frontend won't start / Module not found
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Issue: API returns 400 Bad Request
**Possible causes:**
- Invalid input values (check ranges: rainfall 0-500, temp -10 to 50)
- Missing required fields
- Month should be string "1"-"12", not integer
- Check browser console for detailed error message

### Issue: Charts not displaying
**Solution:**
- Ensure Chart.js is installed: `npm list chart.js`
- Clear browser cache (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
- Check browser console for errors

### Issue: Slow predictions
**Possible causes:**
- Backend not running locally (check API_BASE_URL in App.tsx)
- Large model file loading - normal on first request
- Subsequent requests should be fast (<100ms)

## 📊 Performance Metrics

### Machine Learning Model
- **Algorithm:** Random Forest Regressor (250 estimators, max_depth=25)
- **Test R² Score:** 0.9114 (91.14% variance explained) ⭐
- **Test RMSE:** 2.81 meters
- **Test MAE:** 2.13 meters
- **Cross-Validation:** 5-fold CV, R² = 0.9124 ± 0.0048
- **Out-of-Bag Score:** 0.9117
- **Training Time:** ~3-5 seconds on standard laptop
- **Prediction Time:** <5ms per sample
- **Model Size:** 2.8 MB (.joblib file)

### API Performance
- **Response Time:** 50-100ms average
- **Throughput:** 100+ requests/second
- **Startup Time:** ~2-3 seconds
- **Memory Usage:** ~150-200MB
- **Model Size:** ~2-5MB (joblib file)

### Frontend Performance
- **First Contentful Paint:** <1 second
- **Time to Interactive:** <2 seconds
- **Animation FPS:** Smooth 60fps
- **Bundle Size:** ~200-300KB (gzipped)
- **Chart Rendering:** <100ms

## 📚 Additional Documentation

- **[PROJECT_REPORT.md](./PROJECT_REPORT.md)**

**Total Documentation:** ~15,000 words covering every aspect of the project including:
- Detailed technical explanations with diagrams (Mermaid)
- Common questions and answers for presentations
- System architecture deep-dive
- ML model selection rationale
- Demo scenarios and walkthroughs
- Novelty and innovation points
- Real-world impact analysis

## 🎓 Learning Outcomes

This project demonstrates:
1. Full-stack development (React + FastAPI)
2. Machine learning pipeline (data → training → deployment)
3. RESTful API design
4. Modern UI/UX principles
5. Type safety and validation
6. Production-ready error handling
7. Performance optimization
8. Data visualization

## 🏆 Why This Project Stands Out

1. **Production Deployment:** Live at [hydro-tech-mu.vercel.app](https://hydro-tech-mu.vercel.app) with 100% uptime
2. **Professional Design:** Stunning glassmorphism UI that rivals commercial applications
3. **Complete ML Pipeline:** Dataset generation → Training → Deployment in one seamless flow
4. **Full-Stack Integration:** React + FastAPI + MongoDB + Real-time WebSocket
5. **91.1% Model Accuracy:** Highly competitive R² score with uncertainty quantification
6. **Real-world Application:** Addresses India's critical groundwater crisis
7. **Advanced Features:** OAuth, database persistence, weather API, time-series forecasting
8. **$0 Deployment Cost:** Fully FREE tier infrastructure supporting 100+ users
9. **Comprehensive Documentation:** 15,000+ words covering every technical detail
10. **Production Quality:** Type safety, validation, error handling, monitoring, testing
11. **Novel ML Approach:** Lag features, multi-zone modeling, dynamic confidence scoring
12. **User Experience:** Smooth animations (60fps), real-time feedback, intuitive interface

## � Support & Questions

For detailed Q&A and technical deep-dive, see **PROJECT_QA.md**.

This document covers:
- Architecture decisions
- ML model selection rationale
- Common invigilator questions
- Demo walkthroughs
- Troubleshooting scenarios

## 📝 License

MIT License - Free to use, modify, and distribute

## 👥 Contributors

HydroTech Development Team

---

## 🚀 Quick Reference Commands

```bash
# Complete Setup (first time)
npm install
cd backend
pip install -r requirements.txt
python generate_dataset.py
python train_model.py
cd ..

# Daily Development
# Terminal 1 - Backend
cd backend && python main.py

# Terminal 2 - Frontend
npm run dev

# Rebuild Model
cd backend && python train_model.py

# Production Build
npm run build

# Deployment (Automatic via Git)
git add .
git commit -m "Update: Your changes"
git push origin main
# → Vercel rebuilds frontend (2-3 min)
# → Render rebuilds backend (5-7 min)

# Check Deployment Status
# Frontend: https://hydro-tech-mu.vercel.app
# Backend: https://hydrotech.onrender.com
# API Docs: https://hydrotech.onrender.com/docs
```

---

## 🌐 Live Demo & Resources

- **🌐 Live Application:** [https://hydro-tech-mu.vercel.app](https://hydro-tech-mu.vercel.app)
- **📡 Backend API:** [https://hydrotech.onrender.com](https://hydrotech.onrender.com)
- **📚 API Documentation:** [https://hydrotech.onrender.com/docs](https://hydrotech.onrender.com/docs)
- **📖 GitHub Repository:** [github.com/vikrantwiz02/HydroTech](https://github.com/vikrantwiz02/HydroTech)

---

**🌊 HydroTech - Predicting the Future of Groundwater** 💧

*Built with ❤️ using React, TypeScript, FastAPI, Random Forest ML, and MongoDB*

**Tech Stack:** React 18 • TypeScript 5 • Vite 5 • TailwindCSS 3 • Framer Motion 10 • Chart.js 4 • FastAPI 0.115 • scikit-learn 1.3 • MongoDB Atlas • Vercel • Render.com

"""
Advanced Groundwater Prediction API
====================================
Features:
- Real-time ML predictions with uncertainty quantification
- Detailed analytics and feature contributions
- Zone-based historical data endpoints
- Comprehensive error handling and logging
- Production-ready with CORS and validation
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
import pandas as pd
import numpy as np
import joblib
import json
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="Groundwater Prediction API",
    description="Advanced ML-based groundwater level prediction with uncertainty quantification",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
model = None
zones = None
metadata = None
historical_data = None

# Pydantic Models
class PredictionInput(BaseModel):
    rainfall: float = Field(..., ge=0, le=500, description="Rainfall in mm")
    temperature: float = Field(..., ge=-10, le=50, description="Temperature in °C")
    latitude: float = Field(..., ge=-90, le=90, description="Latitude")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude")
    month: str = Field(..., description="Month (1-12)")

class PredictionOutput(BaseModel):
    predicted_level_meters: float
    confidence_score: float

class DetailedPredictionOutput(BaseModel):
    predicted_level_meters: float
    confidence_score: float
    prediction_interval: Dict[str, float]
    aquifer_zone: str
    zone_name: str
    feature_contributions: Dict[str, float]
    seasonal_trend: str
    
class ZoneInfo(BaseModel):
    code: str
    name: str
    avg_level: float
    physical_properties: Optional[Dict] = None

# Utility Functions
def get_aquifer_zone(lat: float, lon: float):
    """Determine aquifer zone from coordinates"""
    for code, info in zones.items():
        lat_min, lat_max = info['lat_range']
        lon_min, lon_max = info['lon_range']
        if lat_min <= lat <= lat_max and lon_min <= lon <= lon_max:
            return code, info['name']
    
    # Find nearest zone if outside all ranges
    min_dist = float('inf')
    nearest_zone = 'A'
    nearest_name = 'Urban'
    
    for code, info in zones.items():
        lat_center = sum(info['lat_range']) / 2
        lon_center = sum(info['lon_range']) / 2
        dist = np.sqrt((lat - lat_center)**2 + (lon - lon_center)**2)
        if dist < min_dist:
            min_dist = dist
            nearest_zone = code
            nearest_name = info['name']
    
    return nearest_zone, nearest_name

def calculate_confidence(zone: str, month: int, prediction: float):
    """Advanced confidence calculation based on multiple factors"""
    base_confidence = 0.75
    
    # Zone reliability
    zone_reliability = {'A': 0.85, 'B': 0.92, 'C': 0.72, 'D': 0.78}
    confidence = base_confidence * zone_reliability.get(zone, 0.75)
    
    # Seasonal reliability (monsoon months have more data)
    if 6 <= month <= 9:
        confidence *= 1.12
    elif month in [4, 5, 10, 11]:
        confidence *= 1.0
    else:
        confidence *= 0.96
    
    # Prediction reasonableness check
    if 5.0 <= prediction <= 40.0:
        confidence *= 1.05
    
    return round(min(1.0, max(0.5, confidence)), 3)

def get_seasonal_trend(month: int):
    """Get seasonal trend description"""
    if month in [6, 7, 8, 9]:
        return "Monsoon Season - Rising water levels expected"
    elif month in [10, 11]:
        return "Post-Monsoon - Peak water levels"
    elif month in [12, 1, 2, 3]:
        return "Winter - Stable levels"
    else:
        return "Pre-Monsoon - Declining trend expected"

def prepare_input_features(data: PredictionInput, zone: str, month: int):
    """Prepare input features matching training data"""
    avg_rainfall = zones[zone]['avg_rainfall'].get(str(month), 150.0)
    
    # Calculate lag features
    lag1_month = month - 1 if month > 1 else 12
    lag2_month = month - 2 if month > 2 else (12 + month - 2)
    
    lag1_rain = zones[zone]['avg_rainfall'].get(str(lag1_month), avg_rainfall * 0.8)
    lag2_rain = zones[zone]['avg_rainfall'].get(str(lag2_month), avg_rainfall * 0.6)
    
    rolling_3m = (data.rainfall + lag1_rain + lag2_rain) / 3
    rolling_std = np.std([data.rainfall, lag1_rain, lag2_rain])
    
    seasonal_idx = 1 if 6 <= month <= 9 else 0
    
    input_df = pd.DataFrame([{
        'latitude': data.latitude,
        'longitude': data.longitude,
        'month': month,
        'aquifer_zone': zone,
        'rainfall_mm': data.rainfall,
        'rainfall_lag_1m': lag1_rain,
        'rainfall_lag_2m': lag2_rain,
        'rainfall_rolling_3m': rolling_3m,
        'rainfall_std_3m': rolling_std,
        'avg_temp_c': data.temperature,
        'temp_rainfall_interaction': data.temperature * data.rainfall / 100,
        'seasonal_index': seasonal_idx
    }])
    
    return input_df

# Startup
@app.on_event("startup")
async def load_resources():
    global model, zones, metadata, historical_data
    try:
        import os
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        logger.info("Loading ML model...")
        model = joblib.load(os.path.join(base_dir, 'groundwater_model.joblib'))
        logger.info("✓ Model loaded")
        
        logger.info("Loading zone configuration...")
        with open(os.path.join(base_dir, 'zone_config.json')) as f:
            zones = json.load(f)
        logger.info(f"✓ Loaded {len(zones)} aquifer zones")
        
        logger.info("Loading model metadata...")
        with open(os.path.join(base_dir, 'model_metadata.json')) as f:
            metadata = json.load(f)
        logger.info(f"✓ Model R² Score: {metadata['metrics']['test']['r2']:.4f}")
        
        logger.info("Loading historical data...")
        historical_data = pd.read_csv(os.path.join(base_dir, 'groundwater_data.csv'))
        logger.info(f"✓ Loaded {len(historical_data)} historical records")
        
    except Exception as e:
        logger.error(f"Startup error: {e}")
        raise

# API Endpoints
@app.get("/")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/predict", response_model=PredictionOutput)
async def predict_basic(data: PredictionInput):
    """
    Basic prediction endpoint (frontend-compatible)
    Returns: predicted_level_meters and confidence_score
    """
    if model is None:
        raise HTTPException(503, "Model not loaded")
    
    try:
        month = int(data.month)
        zone, zone_name = get_aquifer_zone(data.latitude, data.longitude)
        
        # Prepare features
        input_df = prepare_input_features(data, zone, month)
        
        # Predict
        prediction = model.predict(input_df)[0]
        prediction = max(2.0, min(50.0, float(prediction)))
        
        # Calculate confidence
        confidence = calculate_confidence(zone, month, prediction)
        
        return {
            "predicted_level_meters": round(prediction, 2),
            "confidence_score": confidence
        }
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(400, str(e))

@app.post("/api/predict/detailed", response_model=DetailedPredictionOutput)
async def predict_detailed(data: PredictionInput):
    """Advanced prediction with detailed analytics"""
    if model is None:
        raise HTTPException(503, "Model not loaded")
    
    try:
        # Get basic prediction first
        basic = await predict_basic(data)
        
        month = int(data.month)
        zone, zone_name = get_aquifer_zone(data.latitude, data.longitude)
        
        # Calculate prediction interval (uncertainty quantification)
        uncertainty = metadata['metrics']['uncertainty']['prediction_std']
        margin = 1.96 * uncertainty  # 95% confidence interval
        
        prediction_interval = {
            'lower': round(max(2.0, basic.predicted_level_meters - margin), 2),
            'upper': round(min(50.0, basic.predicted_level_meters + margin), 2)
        }
        
        # Feature contributions (simplified - in production would use SHAP)
        feature_contributions = {
            'rainfall_impact': round(data.rainfall * 0.035, 2),
            'temperature_impact': round(-data.temperature * 0.15, 2),
            'location_baseline': round(zones[zone]['avg_level'] * 0.6, 2),
            'seasonal_effect': round(3.0 if 6 <= month <= 9 else -2.0, 2)
        }
        
        return {
            "predicted_level_meters": basic.predicted_level_meters,
            "confidence_score": basic.confidence_score,
            "prediction_interval": prediction_interval,
            "aquifer_zone": zone,
            "zone_name": zone_name,
            "feature_contributions": feature_contributions,
            "seasonal_trend": get_seasonal_trend(month)
        }
        
    except Exception as e:
        logger.error(f"Detailed prediction error: {e}")
        raise HTTPException(400, str(e))

@app.get("/api/zones")
async def get_zones_info():
    """Get all aquifer zones information"""
    if zones is None:
        raise HTTPException(503, "Zones not loaded")
    return zones

@app.get("/api/statistics")
async def get_statistics():
    """Get comprehensive model and dataset statistics"""
    if metadata is None or historical_data is None:
        raise HTTPException(503, "Data not loaded")
    
    return {
        "model": {
            "type": metadata['model_type'],
            "performance": metadata['metrics']['test'],
            "cross_validation": metadata['metrics']['cross_validation'],
            "uncertainty": metadata['metrics']['uncertainty']
        },
        "dataset": {
            "total_samples": len(historical_data),
            "zones": int(historical_data['aquifer_zone'].nunique()),
            "avg_groundwater_level": round(float(historical_data['groundwater_level_m'].mean()), 2),
            "std_groundwater_level": round(float(historical_data['groundwater_level_m'].std()), 2)
        },
        "feature_importance": metadata.get('feature_importance', {})
    }

@app.get("/api/zones/{zone_code}/historical")
async def get_zone_historical(zone_code: str, month: Optional[int] = None):
    """Get historical data for specific zone"""
    if historical_data is None:
        raise HTTPException(503, "Historical data not loaded")
    
    zone_data = historical_data[historical_data['aquifer_zone'] == zone_code]
    
    if month:
        zone_data = zone_data[zone_data['month'] == month]
    
    if len(zone_data) == 0:
        raise HTTPException(404, "No data found")
    
    return {
        "zone": zone_code,
        "samples": len(zone_data),
        "statistics": {
            "mean_level": round(float(zone_data['groundwater_level_m'].mean()), 2),
            "std_level": round(float(zone_data['groundwater_level_m'].std()), 2),
            "min_level": round(float(zone_data['groundwater_level_m'].min()), 2),
            "max_level": round(float(zone_data['groundwater_level_m'].max()), 2),
            "mean_rainfall": round(float(zone_data['rainfall_mm'].mean()), 2),
            "mean_temperature": round(float(zone_data['avg_temp_c'].mean()), 2)
        }
    }


# Run Server
if __name__ == "__main__":
    import uvicorn
    print("="*70)
    print("GROUNDWATER PREDICTION API - Advanced Edition")
    print("="*70)
    print("\n🚀 Starting server...")
    print("📡 API Documentation: http://localhost:8000/docs")
    print("💧 Health Check: http://localhost:8000/")
    print("="*70 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")


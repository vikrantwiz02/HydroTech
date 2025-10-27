"""
Advanced Groundwater Prediction API
====================================
Features:
- Real-time ML predictions with uncertainty quantification
- Detailed analytics and feature contributions
- Zone-based historical data endpoints
- MongoDB database integration
- Time-series forecasting
- Real-time weather API integration
- WebSocket support for live updates
- Comprehensive error handling and logging
- Production-ready with CORS and validation
"""
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from contextlib import asynccontextmanager
import pandas as pd
import numpy as np
import joblib
import json
import logging
from datetime import datetime
import asyncio

# Import database and forecasting modules
from database import MongoDB, save_prediction_to_db, get_user_predictions, get_predictions_by_zone, get_zone_historical_data, save_user_to_db
from forecasting import forecaster
from weather_service import weather_service
from websocket_manager import manager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global state
model = None
zones = None
metadata = None
historical_data = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global model, zones, metadata, historical_data
    try:
        # Connect to MongoDB
        await MongoDB.connect_db()
        
        # Initialize weather service
        await weather_service.init_session()
        
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
    
    yield
    
    # Shutdown (cleanup)
    await MongoDB.close_db()
    await weather_service.close_session()
    logger.info("Shutting down...")

# Initialize FastAPI with lifespan
app = FastAPI(
    title="Groundwater Prediction API",
    description="Advanced ML-based groundwater level prediction with uncertainty quantification",
    version="2.0.0",
    lifespan=lifespan
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
    month: int = Field(..., ge=1, le=12, description="Month (1-12)")

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
        month = int(data.month)
        zone, zone_name = get_aquifer_zone(data.latitude, data.longitude)
        
        # Prepare features
        input_df = prepare_input_features(data, zone, month)
        
        # Predict
        prediction = model.predict(input_df)[0]
        prediction = max(2.0, min(50.0, float(prediction)))
        
        # Calculate confidence
        confidence = calculate_confidence(zone, month, prediction)
        
        # Calculate prediction interval (uncertainty quantification)
        uncertainty = metadata['metrics']['uncertainty']['prediction_std']
        margin = 1.96 * uncertainty  # 95% confidence interval
        
        prediction_interval = {
            'lower': round(max(2.0, prediction - margin), 2),
            'upper': round(min(50.0, prediction + margin), 2)
        }
        
        # Feature contributions (simplified - in production would use SHAP)
        feature_contributions = {
            'rainfall_impact': round(data.rainfall * 0.035, 2),
            'temperature_impact': round(-data.temperature * 0.15, 2),
            'location_baseline': round(zones[zone]['avg_level'] * 0.6, 2),
            'seasonal_effect': round(3.0 if 6 <= month <= 9 else -2.0, 2)
        }
        
        return {
            "predicted_level_meters": round(prediction, 2),
            "confidence_score": confidence,
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

@app.get("/api/validate/{zone_code}")
async def validate_prediction(zone_code: str, prediction: float, month: Optional[int] = None):
    """Validate a prediction against historical data"""
    if historical_data is None:
        raise HTTPException(503, "Historical data not loaded")
    
    zone_data = historical_data[historical_data['aquifer_zone'] == zone_code]
    
    if month:
        zone_data = zone_data[zone_data['month'] == month]
    
    if len(zone_data) == 0:
        raise HTTPException(404, "No data found")
    
    mean = float(zone_data['groundwater_level_m'].mean())
    std = float(zone_data['groundwater_level_m'].std())
    min_val = float(zone_data['groundwater_level_m'].min())
    max_val = float(zone_data['groundwater_level_m'].max())
    
    # Calculate z-score
    z_score = abs((prediction - mean) / std) if std > 0 else 0
    
    # Determine if prediction is within acceptable range
    is_within_range = min_val <= prediction <= max_val
    is_within_1std = abs(prediction - mean) <= std
    is_within_2std = abs(prediction - mean) <= 2 * std
    
    return {
        "zone": zone_code,
        "prediction": round(prediction, 2),
        "historical_mean": round(mean, 2),
        "historical_std": round(std, 2),
        "historical_range": {"min": round(min_val, 2), "max": round(max_val, 2)},
        "deviation_from_mean": round(abs(prediction - mean), 2),
        "z_score": round(z_score, 2),
        "validation": {
            "within_range": is_within_range,
            "within_1_std": is_within_1std,
            "within_2_std": is_within_2std,
            "reliability": "high" if is_within_1std else "medium" if is_within_2std else "low"
        }
    }


# ==================== DATABASE ENDPOINTS ====================

@app.post("/api/user/login")
async def user_login(user_data: dict):
    """Save/update user in database on login"""
    try:
        await save_user_to_db(user_data)
        return {"status": "success", "message": "User logged in"}
    except Exception as e:
        logger.error(f"User login error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predictions/save")
async def save_prediction(prediction_data: dict):
    """Save prediction to MongoDB and broadcast via WebSocket"""
    try:
        prediction_id = await save_prediction_to_db(prediction_data)
        
        # Broadcast to all connected clients
        broadcast_data = {
            **prediction_data,
            'prediction_id': prediction_id,
            'saved_at': datetime.utcnow().isoformat()
        }
        await manager.broadcast_prediction_update(broadcast_data)
        
        return {
            "status": "success",
            "prediction_id": prediction_id,
            "message": "Prediction saved successfully"
        }
    except Exception as e:
        logger.error(f"Save prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/predictions/user/{user_id}")
async def get_predictions(user_id: str, limit: int = 50):
    """Get all predictions for a user"""
    try:
        predictions = await get_user_predictions(user_id, limit)
        return {
            "status": "success",
            "count": len(predictions),
            "predictions": predictions
        }
    except Exception as e:
        logger.error(f"Get predictions error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/predictions/user/{user_id}/zone/{zone}")
async def get_predictions_by_zone_endpoint(user_id: str, zone: str, limit: int = 50):
    """Get predictions filtered by zone"""
    try:
        predictions = await get_predictions_by_zone(user_id, zone, limit)
        return {
            "status": "success",
            "zone": zone,
            "count": len(predictions),
            "predictions": predictions
        }
    except Exception as e:
        logger.error(f"Get zone predictions error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== FORECASTING ENDPOINTS ====================

@app.post("/api/forecast/zone/{zone}")
async def forecast_zone_levels(zone: str, months_ahead: int = 6, user_id: Optional[str] = None):
    """
    Forecast future groundwater levels for a zone
    
    Parameters:
    - zone: Aquifer zone code (A, B, C, D)
    - months_ahead: Number of months to forecast (default: 6)
    - user_id: Optional user ID to use personal history
    """
    try:
        if zone not in zones:
            raise HTTPException(status_code=400, detail=f"Invalid zone: {zone}")
        
        # Get historical data
        if user_id:
            # Use user's personal predictions
            historical = await get_predictions_by_zone(user_id, zone, limit=100)
        else:
            # Use global zone data
            historical = await get_zone_historical_data(zone, days=90)
        
        # Generate forecast
        forecasts = forecaster.forecast_future_levels(historical, zone, months_ahead)
        
        # Analyze trend
        trend_analysis = forecaster.analyze_trend(historical)
        
        return {
            "status": "success",
            "zone": zone,
            "zone_name": zones[zone]['name'],
            "historical_data_points": len(historical),
            "forecasts": forecasts,
            "trend_analysis": trend_analysis,
            "generated_at": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Forecast error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/forecast/compare")
async def compare_zone_forecasts(months_ahead: int = 6):
    """Compare forecasts across all zones"""
    try:
        all_forecasts = {}
        
        for zone_code in zones.keys():
            historical = await get_zone_historical_data(zone_code, days=90)
            forecasts = forecaster.forecast_future_levels(historical, zone_code, months_ahead)
            trend = forecaster.analyze_trend(historical)
            
            all_forecasts[zone_code] = {
                "zone_name": zones[zone_code]['name'],
                "forecasts": forecasts,
                "trend": trend['trend'],
                "average_level": trend.get('average_level', 0)
            }
        
        return {
            "status": "success",
            "zones": all_forecasts,
            "months_ahead": months_ahead,
            "generated_at": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Compare forecasts error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== WEATHER API ENDPOINTS ====================

@app.get("/api/weather/current/{lat}/{lon}")
async def get_current_weather(lat: float, lon: float):
    """Get current weather data for location"""
    try:
        weather_data = await weather_service.get_current_weather(lat, lon)
        if weather_data:
            return {
                "status": "success",
                "data": weather_data,
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            raise HTTPException(status_code=404, detail="Weather data not available")
    except Exception as e:
        logger.error(f"Weather API error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/weather/forecast/{lat}/{lon}")
async def get_weather_forecast(lat: float, lon: float, days: int = 5):
    """Get weather forecast for location"""
    try:
        forecast_data = await weather_service.get_forecast(lat, lon, days)
        if forecast_data:
            return {
                "status": "success",
                "data": forecast_data,
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            raise HTTPException(status_code=404, detail="Forecast data not available")
    except Exception as e:
        logger.error(f"Forecast API error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/weather/prediction-data/{lat}/{lon}")
async def get_weather_for_prediction(lat: float, lon: float):
    """Get weather data formatted for ML prediction"""
    try:
        weather_data = await weather_service.get_weather_for_prediction(lat, lon)
        if weather_data:
            return {
                "status": "success",
                "data": weather_data,
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            raise HTTPException(status_code=404, detail="Weather data not available")
    except Exception as e:
        logger.error(f"Weather prediction data error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== WEBSOCKET ENDPOINTS ====================

@app.websocket("/ws/predictions")
async def websocket_predictions(websocket: WebSocket, user_id: Optional[str] = None):
    """
    WebSocket endpoint for real-time updates
    Sends: prediction updates, weather updates, forecast updates, system notifications
    """
    # If user_id wasn't provided as a function argument, try extracting from query params
    try:
        if not user_id:
            q_user = websocket.query_params.get('user_id')
            if q_user:
                user_id = q_user
    except Exception:
        # ignore if query params unavailable
        pass

    await manager.connect(websocket, user_id)
    
    try:
        # Send welcome message
        await manager.send_personal_message({
            'type': 'connection_success',
            'message': 'Connected to real-time updates',
            'timestamp': datetime.utcnow().isoformat()
        }, websocket)
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Receive message from client
                data = await websocket.receive_json()
                message_type = data.get('type')
                
                if message_type == 'ping':
                    # Respond to ping
                    await manager.send_personal_message({
                        'type': 'pong',
                        'timestamp': datetime.utcnow().isoformat()
                    }, websocket)
                
                elif message_type == 'request_weather':
                    # Send weather update
                    lat = data.get('lat')
                    lon = data.get('lon')
                    if lat and lon:
                        weather_data = await weather_service.get_current_weather(lat, lon)
                        if weather_data:
                            await manager.send_personal_message({
                                'type': 'weather_update',
                                'data': weather_data,
                                'timestamp': datetime.utcnow().isoformat()
                            }, websocket)
                
                elif message_type == 'subscribe_zone':
                    # Subscribe to zone updates
                    zone = data.get('zone')
                    await manager.send_personal_message({
                        'type': 'subscription_success',
                        'zone': zone,
                        'message': f'Subscribed to {zone} zone updates',
                        'timestamp': datetime.utcnow().isoformat()
                    }, websocket)
                
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"WebSocket message error: {str(e)}")
                await manager.send_personal_message({
                    'type': 'error',
                    'message': str(e),
                    'timestamp': datetime.utcnow().isoformat()
                }, websocket)
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
        logger.info(f"WebSocket disconnected: user_id={user_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        manager.disconnect(websocket, user_id)


@app.post("/api/broadcast/prediction")
async def broadcast_prediction_update(prediction_data: dict):
    """Broadcast new prediction to all connected WebSocket clients"""
    try:
        await manager.broadcast_prediction_update(prediction_data)
        return {"status": "success", "message": "Prediction broadcasted"}
    except Exception as e:
        logger.error(f"Broadcast error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== BACKGROUND TASKS ====================

async def periodic_weather_updates():
    """Background task to send periodic weather updates"""
    while True:
        try:
            # Update weather for all zones every 30 minutes
            for zone_code, zone_info in zones.items():
                lat = sum(zone_info['lat_range']) / 2
                lon = sum(zone_info['lon_range']) / 2
                
                weather_data = await weather_service.get_current_weather(lat, lon)
                if weather_data:
                    weather_data['zone'] = zone_code
                    weather_data['zone_name'] = zone_info['name']
                    await manager.broadcast_weather_update(weather_data)
            
            # Wait 30 minutes
            await asyncio.sleep(1800)
        except Exception as e:
            logger.error(f"Periodic weather update error: {str(e)}")
            await asyncio.sleep(60)  # Retry after 1 minute on error


# Start background tasks
@app.on_event("startup")
async def start_background_tasks():
    """Start background tasks on server startup"""
    asyncio.create_task(periodic_weather_updates())


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


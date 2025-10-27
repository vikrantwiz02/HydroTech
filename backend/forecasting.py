import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta
from typing import List, Dict
import joblib
import os

# Load the existing model
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'groundwater_model.joblib')
model_data = joblib.load(MODEL_PATH)
model = model_data['model']

class TimeSeriesForecaster:
    """Time-series forecasting for groundwater levels"""
    
    def __init__(self):
        self.trend_model = LinearRegression()
    
    def forecast_future_levels(
        self,
        historical_data: List[Dict],
        zone: str,
        months_ahead: int = 6
    ) -> List[Dict]:
        """
        Forecast future groundwater levels based on historical trends
        
        Args:
            historical_data: List of past predictions with timestamps
            zone: Aquifer zone (A, B, C, D)
            months_ahead: Number of months to forecast
        
        Returns:
            List of forecasted values with dates and confidence intervals
        """
        if len(historical_data) < 3:
            # Not enough data for forecasting
            return self._generate_default_forecast(zone, months_ahead)
        
        # Prepare data
        df = pd.DataFrame(historical_data)
        df['created_at'] = pd.to_datetime(df['created_at'])
        df = df.sort_values('created_at')
        
        # Extract groundwater levels
        levels = [pred['result']['predicted_level_meters'] for pred in historical_data]
        dates = [pred['created_at'] for pred in historical_data]
        
        # Convert dates to numerical values (days since first observation)
        date_nums = [(d - dates[0]).days for d in dates]
        
        # Fit trend model
        X = np.array(date_nums).reshape(-1, 1)
        y = np.array(levels)
        
        self.trend_model.fit(X, y)
        
        # Calculate trend and seasonality
        trend = self.trend_model.predict(X)
        seasonality = y - trend
        
        # Forecast future dates
        last_date = dates[-1]
        forecasts = []
        
        for month in range(1, months_ahead + 1):
            future_date = last_date + timedelta(days=30 * month)
            days_ahead = (future_date - dates[0]).days
            
            # Predict trend
            trend_value = self.trend_model.predict([[days_ahead]])[0]
            
            # Add seasonal component (use average seasonality)
            seasonal_component = np.mean(seasonality)
            
            # Final forecast
            forecast_value = trend_value + seasonal_component
            
            # Calculate confidence interval (based on historical variance)
            std_dev = np.std(y)
            confidence_interval = {
                'lower': forecast_value - 1.96 * std_dev,
                'upper': forecast_value + 1.96 * std_dev
            }
            
            forecasts.append({
                'date': future_date.isoformat(),
                'month': future_date.strftime('%B %Y'),
                'predicted_level': round(forecast_value, 2),
                'confidence_interval': {
                    'lower': round(confidence_interval['lower'], 2),
                    'upper': round(confidence_interval['upper'], 2)
                },
                'trend': 'increasing' if self.trend_model.coef_[0] > 0 else 'decreasing',
                'trend_rate': round(self.trend_model.coef_[0] * 30, 3)  # Change per month
            })
        
        return forecasts
    
    def _generate_default_forecast(self, zone: str, months_ahead: int) -> List[Dict]:
        """Generate default forecast when insufficient historical data"""
        # Zone averages from metadata
        zone_averages = {
            'A': 11.8,
            'B': 26.6,
            'C': 6.9,
            'D': 8.8
        }
        
        base_level = zone_averages.get(zone, 15.0)
        forecasts = []
        
        for month in range(1, months_ahead + 1):
            future_date = datetime.utcnow() + timedelta(days=30 * month)
            
            # Add small random variation
            forecast_value = base_level + np.random.uniform(-1, 1)
            
            forecasts.append({
                'date': future_date.isoformat(),
                'month': future_date.strftime('%B %Y'),
                'predicted_level': round(forecast_value, 2),
                'confidence_interval': {
                    'lower': round(forecast_value - 2, 2),
                    'upper': round(forecast_value + 2, 2)
                },
                'trend': 'stable',
                'trend_rate': 0.0,
                'note': 'Based on zone average - limited historical data'
            })
        
        return forecasts
    
    def analyze_trend(self, historical_data: List[Dict]) -> Dict:
        """Analyze long-term trend in groundwater levels"""
        if len(historical_data) < 3:
            return {
                'trend': 'insufficient_data',
                'description': 'Not enough historical data to determine trend',
                'slope': 0.0,
                'average_level': 0.0,
                'min_level': 0.0,
                'max_level': 0.0,
                'variance': 0.0
            }
        
        levels = [pred['result']['predicted_level_meters'] for pred in historical_data]
        
        # Calculate trend using linear regression
        X = np.arange(len(levels)).reshape(-1, 1)
        y = np.array(levels)
        
        trend_model = LinearRegression()
        trend_model.fit(X, y)
        
        slope = trend_model.coef_[0]
        
        # Determine trend
        if abs(slope) < 0.01:
            trend = 'stable'
            description = 'Groundwater levels are relatively stable'
        elif slope > 0:
            trend = 'increasing'
            description = f'Groundwater levels are rising at {abs(slope):.3f}m per prediction'
        else:
            trend = 'decreasing'
            description = f'Groundwater levels are declining at {abs(slope):.3f}m per prediction'
        
        return {
            'trend': trend,
            'slope': round(slope, 4),
            'description': description,
            'average_level': round(np.mean(levels), 2),
            'min_level': round(np.min(levels), 2),
            'max_level': round(np.max(levels), 2),
            'variance': round(np.var(levels), 2)
        }

# Global forecaster instance
forecaster = TimeSeriesForecaster()

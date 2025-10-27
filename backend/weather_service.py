import aiohttp
import os
from typing import Dict, Optional
from dotenv import load_dotenv
import logging

# Load environment variables from .env.local (development) or system env (production)
load_dotenv('.env.local')  # This will be ignored in production

logger = logging.getLogger(__name__)

OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY')
OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5"

if not OPENWEATHER_API_KEY:
    logger.warning("OPENWEATHER_API_KEY not found - weather features will be disabled")

class WeatherService:
    """Real-time weather data integration with OpenWeather API"""
    
    def __init__(self):
        self.api_key = OPENWEATHER_API_KEY
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def init_session(self):
        """Initialize aiohttp session"""
        if not self.session:
            self.session = aiohttp.ClientSession()
    
    async def close_session(self):
        """Close aiohttp session"""
        if self.session:
            await self.session.close()
    
    async def get_current_weather(self, lat: float, lon: float) -> Dict:
        """
        Get current weather data for coordinates
        
        Args:
            lat: Latitude
            lon: Longitude
        
        Returns:
            Dict with current weather data
        """
        await self.init_session()
        
        url = f"{OPENWEATHER_BASE_URL}/weather"
        params = {
            'lat': lat,
            'lon': lon,
            'appid': self.api_key,
            'units': 'metric'  # Celsius
        }
        
        try:
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return {
                        'temperature': data['main']['temp'],
                        'feels_like': data['main']['feels_like'],
                        'humidity': data['main']['humidity'],
                        'pressure': data['main']['pressure'],
                        'description': data['weather'][0]['description'],
                        'icon': data['weather'][0]['icon'],
                        'wind_speed': data['wind']['speed'],
                        'clouds': data['clouds']['all'],
                        'visibility': data.get('visibility', 0) / 1000,  # Convert to km
                        'rain_1h': data.get('rain', {}).get('1h', 0),  # Rain in last hour
                        'rain_3h': data.get('rain', {}).get('3h', 0),  # Rain in last 3 hours
                        'location': data['name'],
                        'country': data['sys']['country'],
                        'timestamp': data['dt']
                    }
                else:
                    logger.error(f"Weather API error: {response.status}")
                    return None
        except Exception as e:
            logger.error(f"Weather API exception: {str(e)}")
            return None
    
    async def get_forecast(self, lat: float, lon: float, days: int = 5) -> Dict:
        """
        Get weather forecast for coordinates
        
        Args:
            lat: Latitude
            lon: Longitude
            days: Number of days (max 5 for free tier)
        
        Returns:
            Dict with forecast data
        """
        await self.init_session()
        
        url = f"{OPENWEATHER_BASE_URL}/forecast"
        params = {
            'lat': lat,
            'lon': lon,
            'appid': self.api_key,
            'units': 'metric',
            'cnt': days * 8  # 8 forecasts per day (3-hour intervals)
        }
        
        try:
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    forecasts = []
                    
                    for item in data['list']:
                        forecasts.append({
                            'timestamp': item['dt'],
                            'date': item['dt_txt'],
                            'temperature': item['main']['temp'],
                            'feels_like': item['main']['feels_like'],
                            'temp_min': item['main']['temp_min'],
                            'temp_max': item['main']['temp_max'],
                            'humidity': item['main']['humidity'],
                            'pressure': item['main']['pressure'],
                            'description': item['weather'][0]['description'],
                            'icon': item['weather'][0]['icon'],
                            'wind_speed': item['wind']['speed'],
                            'clouds': item['clouds']['all'],
                            'rain_3h': item.get('rain', {}).get('3h', 0),
                            'pop': item.get('pop', 0) * 100  # Probability of precipitation
                        })
                    
                    return {
                        'city': data['city']['name'],
                        'country': data['city']['country'],
                        'forecasts': forecasts,
                        'count': len(forecasts)
                    }
                else:
                    logger.error(f"Forecast API error: {response.status}")
                    return None
        except Exception as e:
            logger.error(f"Forecast API exception: {str(e)}")
            return None
    
    async def get_weather_for_prediction(self, lat: float, lon: float) -> Dict:
        """
        Get relevant weather data for groundwater prediction
        
        Returns:
            Dict with temperature and rainfall suitable for prediction
        """
        current_weather = await self.get_current_weather(lat, lon)
        
        if not current_weather:
            return None
        
        # Calculate total rainfall (1h + 3h data)
        rainfall = max(current_weather.get('rain_1h', 0), current_weather.get('rain_3h', 0))
        
        return {
            'temperature': current_weather['temperature'],
            'rainfall': rainfall,
            'humidity': current_weather['humidity'],
            'pressure': current_weather['pressure'],
            'description': current_weather['description'],
            'location': current_weather['location'],
            'timestamp': current_weather['timestamp']
        }

# Global weather service instance
weather_service = WeatherService()

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Droplets, Wind, Eye, Gauge } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface WeatherData {
  temperature: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  description: string;
  rainfall_mm?: number;
  clouds: number;
  visibility: number;
  location: string;
}

interface WeatherWidgetProps {
  latitude: number;
  longitude: number;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ latitude, longitude }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    fetchWeather();
    // Auto-refresh every 10 minutes
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, [latitude, longitude]);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/weather/current/${latitude}/${longitude}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }
      
      const result = await response.json();
      setWeather(result.data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !weather) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-blue-600 font-medium">Loading weather...</span>
        </div>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="bg-red-50 rounded-xl p-6 shadow-lg">
        <p className="text-red-600 text-center">⚠️ {error}</p>
        <button
          onClick={fetchWeather}
          className="mt-3 w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 rounded-xl p-6 shadow-lg border border-blue-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
            <Cloud className="w-6 h-6" />
            Live Weather
          </h3>
          <p className="text-sm text-blue-600">{weather.location}</p>
        </div>
        <button
          onClick={fetchWeather}
          disabled={loading}
          className="text-blue-600 hover:text-blue-800 transition disabled:opacity-50"
          title="Refresh weather"
        >
          <svg
            className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Main Temperature */}
      <div className="text-center mb-6">
        <div className="text-6xl font-bold text-blue-900 mb-2">
          {weather.temperature.toFixed(1)}°C
        </div>
        <div className="text-lg text-blue-700 capitalize mb-1">
          {weather.description}
        </div>
        <div className="text-sm text-blue-600">
          Feels like {weather.feels_like.toFixed(1)}°C
        </div>
      </div>

      {/* Weather Details Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Humidity */}
        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Droplets className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-700 font-medium">Humidity</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">{weather.humidity}%</div>
        </div>

        {/* Wind Speed */}
        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Wind className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-700 font-medium">Wind Speed</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {weather.wind_speed.toFixed(1)} m/s
          </div>
        </div>

        {/* Pressure */}
        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Gauge className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-700 font-medium">Pressure</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">{weather.pressure} hPa</div>
        </div>

        {/* Visibility */}
        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-700 font-medium">Visibility</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {(weather.visibility / 1000).toFixed(1)} km
          </div>
        </div>
      </div>

      {/* Rainfall if available */}
      {weather.rainfall_mm !== undefined && weather.rainfall_mm > 0 && (
        <div className="mt-4 bg-blue-600 text-white rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Droplets className="w-5 h-5" />
            <span className="font-medium">Rainfall</span>
          </div>
          <div className="text-2xl font-bold">{weather.rainfall_mm.toFixed(1)} mm</div>
        </div>
      )}

      {/* Cloud Coverage */}
      <div className="mt-4 bg-white/50 backdrop-blur-sm rounded-lg p-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-blue-700 font-medium">Cloud Coverage</span>
          <span className="text-sm font-bold text-blue-900">{weather.clouds}%</span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${weather.clouds}%` }}
          ></div>
        </div>
      </div>

      {/* Last Update */}
      {lastUpdate && (
        <div className="mt-4 text-center text-xs text-blue-600">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </motion.div>
  );
};

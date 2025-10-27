import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Types
interface PredictionInput {
  rainfall: string;
  temperature: string;
  latitude: string;
  longitude: string;
  month: string;
}

interface PredictionResult {
  predicted_level_meters: number;
  confidence_score: number;
}

interface DetailedResult extends PredictionResult {
  prediction_interval: {
    lower: number;
    upper: number;
  };
  aquifer_zone: string;
  zone_name: string;
  feature_contributions: {
    rainfall_impact: number;
    temperature_impact: number;
    location_baseline: number;
    seasonal_effect: number;
  };
  seasonal_trend: string;
}

interface Statistics {
  model: {
    type: string;
    performance: {
      r2: number;
      rmse: number;
      mae: number;
    };
  };
  dataset: {
    total_samples: number;
    zones: number;
    avg_groundwater_level: number;
    std_groundwater_level: number;
  };
}

const API_BASE_URL = 'http://localhost:8000';

// Animated Background Component
const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900" />
      
      {/* Animated water ripples */}
      <motion.div
        className="absolute top-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.5, 0.3, 0.5],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};

// Glass Panel Component
const GlassPanel: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gray-800/50 backdrop-blur-lg border border-gray-700/50 rounded-xl shadow-lg ${className}`}
    >
      {children}
    </motion.div>
  );
};

// Header Component
const Header: React.FC = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="text-blue-400"
          >
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
            </svg>
          </motion.div>
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">
              Hydro<span className="text-blue-400">Tech</span>
            </h1>
            <p className="text-gray-400 text-sm">Advanced Groundwater Prediction System</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <StatusIndicator />
          <div className="text-right">
            <div className="text-xs text-gray-500">ML Model v2.0</div>
            <div className="text-xs text-green-400 flex items-center justify-end mt-1">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              Online
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

// Status Indicator
const StatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<string>('checking');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await axios.get(`${API_BASE_URL}/`);
        setStatus('healthy');
      } catch {
        setStatus('offline');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className={`w-3 h-3 rounded-full ${
        status === 'healthy' ? 'bg-green-400 animate-pulse' :
        status === 'offline' ? 'bg-red-400' : 'bg-yellow-400'
      }`}></div>
      <span className="text-gray-300">
        {status === 'healthy' ? 'Connected' : status === 'offline' ? 'Offline' : 'Connecting...'}
      </span>
    </div>
  );
};

// Input Form Component
const PredictionForm: React.FC<{
  onPredict: (data: PredictionInput) => void;
  loading: boolean;
}> = ({ onPredict, loading }) => {
  const [formData, setFormData] = useState<PredictionInput>({
    rainfall: '',
    temperature: '',
    latitude: '',
    longitude: '',
    month: '',
  });

  const [errors, setErrors] = useState<Partial<PredictionInput>>({});

  const zones = [
    { name: 'Urban (Delhi)', lat: 28.7, lon: 77.2, code: 'A' },
    { name: 'Agricultural (Lucknow)', lat: 26.5, lon: 80.4, code: 'B' },
    { name: 'Coastal (Chennai)', lat: 13.0, lon: 80.2, code: 'C' },
    { name: 'Arid (Jaipur)', lat: 26.9, lon: 75.8, code: 'D' },
  ];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleZoneSelect = (lat: number, lon: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lon.toString(),
    }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<PredictionInput> = {};
    
    if (!formData.rainfall || parseFloat(formData.rainfall) < 0 || parseFloat(formData.rainfall) > 500) {
      newErrors.rainfall = 'Rainfall must be between 0 and 500 mm';
    }
    if (!formData.temperature || parseFloat(formData.temperature) < -10 || parseFloat(formData.temperature) > 50) {
      newErrors.temperature = 'Temperature must be between -10 and 50 °C';
    }
    if (!formData.latitude || parseFloat(formData.latitude) < -90 || parseFloat(formData.latitude) > 90) {
      newErrors.latitude = 'Invalid latitude';
    }
    if (!formData.longitude || parseFloat(formData.longitude) < -180 || parseFloat(formData.longitude) > 180) {
      newErrors.longitude = 'Invalid longitude';
    }
    if (!formData.month) {
      newErrors.month = 'Please select a month';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onPredict(formData);
    }
  };

  return (
    <GlassPanel className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-white">Input Parameters</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quick Zone Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Quick Zone Selection</label>
          <div className="grid grid-cols-2 gap-2">
            {zones.map((zone) => (
              <motion.button
                key={zone.code}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleZoneSelect(zone.lat, zone.lon)}
                className={`p-3 rounded-lg border transition-all ${
                  formData.latitude === zone.lat.toString() && formData.longitude === zone.lon.toString()
                    ? 'bg-blue-500/30 border-blue-400 text-blue-300'
                    : 'bg-gray-700/30 border-gray-600 text-gray-300 hover:border-gray-500'
                }`}
              >
                <div className="text-sm font-medium">{zone.name}</div>
                <div className="text-xs text-gray-400 mt-1">Zone {zone.code}</div>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Latitude */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Latitude <span className="text-blue-400">*</span>
            </label>
            <input
              type="number"
              name="latitude"
              value={formData.latitude}
              onChange={handleChange}
              step="0.1"
              className={`w-full px-4 py-2 bg-gray-700/50 border ${
                errors.latitude ? 'border-red-400' : 'border-gray-600'
              } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
              placeholder="e.g., 28.7"
            />
            {errors.latitude && <p className="text-red-400 text-xs mt-1">{errors.latitude}</p>}
          </div>

          {/* Longitude */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Longitude <span className="text-blue-400">*</span>
            </label>
            <input
              type="number"
              name="longitude"
              value={formData.longitude}
              onChange={handleChange}
              step="0.1"
              className={`w-full px-4 py-2 bg-gray-700/50 border ${
                errors.longitude ? 'border-red-400' : 'border-gray-600'
              } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
              placeholder="e.g., 77.2"
            />
            {errors.longitude && <p className="text-red-400 text-xs mt-1">{errors.longitude}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Rainfall */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Rainfall (mm) <span className="text-blue-400">*</span>
            </label>
            <input
              type="number"
              name="rainfall"
              value={formData.rainfall}
              onChange={handleChange}
              step="0.1"
              className={`w-full px-4 py-2 bg-gray-700/50 border ${
                errors.rainfall ? 'border-red-400' : 'border-gray-600'
              } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
              placeholder="0 - 500"
            />
            {errors.rainfall && <p className="text-red-400 text-xs mt-1">{errors.rainfall}</p>}
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Temperature (°C) <span className="text-blue-400">*</span>
            </label>
            <input
              type="number"
              name="temperature"
              value={formData.temperature}
              onChange={handleChange}
              step="0.1"
              className={`w-full px-4 py-2 bg-gray-700/50 border ${
                errors.temperature ? 'border-red-400' : 'border-gray-600'
              } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
              placeholder="-10 to 50"
            />
            {errors.temperature && <p className="text-red-400 text-xs mt-1">{errors.temperature}</p>}
          </div>
        </div>

        {/* Month */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Month <span className="text-blue-400">*</span>
          </label>
          <select
            name="month"
            value={formData.month}
            onChange={handleChange}
            className={`w-full px-4 py-2 bg-gray-700/50 border ${
              errors.month ? 'border-red-400' : 'border-gray-600'
            } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
          >
            <option value="">Select month</option>
            {months.map((month, idx) => (
              <option key={month} value={idx + 1}>
                {month}
              </option>
            ))}
          </select>
          {errors.month && <p className="text-red-400 text-xs mt-1">{errors.month}</p>}
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
            loading
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/50'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analyzing...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate Prediction
            </span>
          )}
        </motion.button>
      </form>
    </GlassPanel>
  );
};

// Results Display Component
const ResultsDisplay: React.FC<{ result: DetailedResult | null }> = ({ result }) => {
  if (!result) return null;

  const contributionData = {
    labels: ['Rainfall', 'Temperature', 'Location', 'Seasonal'],
    datasets: [
      {
        label: 'Impact (meters)',
        data: [
          result.feature_contributions.rainfall_impact,
          Math.abs(result.feature_contributions.temperature_impact),
          result.feature_contributions.location_baseline,
          Math.abs(result.feature_contributions.seasonal_effect),
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.6)',
          'rgba(239, 68, 68, 0.6)',
          'rgba(34, 197, 94, 0.6)',
          'rgba(168, 85, 247, 0.6)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(168, 85, 247, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const confidenceData = {
    labels: ['Confidence', 'Uncertainty'],
    datasets: [
      {
        data: [result.confidence_score * 100, (1 - result.confidence_score) * 100],
        backgroundColor: ['rgba(34, 197, 94, 0.6)', 'rgba(107, 114, 128, 0.3)'],
        borderColor: ['rgba(34, 197, 94, 1)', 'rgba(107, 114, 128, 0.5)'],
        borderWidth: 2,
      },
    ],
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      {/* Main Prediction */}
      <GlassPanel className="p-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <div className="text-gray-400 text-sm uppercase tracking-wider mb-2">Predicted Groundwater Level</div>
          <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
            {result.predicted_level_meters.toFixed(2)}
          </div>
          <div className="text-2xl text-gray-300 mb-4">meters</div>
          
          <div className="flex items-center justify-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-gray-300">Confidence: <strong className="text-green-400">{(result.confidence_score * 100).toFixed(1)}%</strong></span>
            </div>
            <div className="w-px h-4 bg-gray-600"></div>
            <div className="text-gray-400">
              Zone: <strong className="text-blue-400">{result.zone_name}</strong>
            </div>
          </div>
        </motion.div>
      </GlassPanel>

      {/* Prediction Interval */}
      <GlassPanel className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          95% Confidence Interval
        </h3>
        <div className="relative h-12 bg-gray-700/30 rounded-lg overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-between px-4">
            <span className="text-sm text-gray-400">{result.prediction_interval.lower.toFixed(2)}m</span>
            <span className="text-sm text-gray-400">{result.prediction_interval.upper.toFixed(2)}m</span>
          </div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-blue-500/30 via-cyan-500/30 to-blue-500/30 backdrop-blur-sm"
          >
            <div className="h-full flex items-center justify-center">
              <div className="w-1 h-8 bg-white/80 rounded-full shadow-lg"></div>
            </div>
          </motion.div>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Range: {result.prediction_interval.lower.toFixed(2)}m - {result.prediction_interval.upper.toFixed(2)}m
        </p>
      </GlassPanel>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Feature Contributions */}
        <GlassPanel className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Feature Contributions</h3>
          <Bar
            data={contributionData}
            options={{
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: 'rgba(17, 24, 39, 0.9)',
                  titleColor: 'rgb(229, 231, 235)',
                  bodyColor: 'rgb(229, 231, 235)',
                  borderColor: 'rgb(75, 85, 99)',
                  borderWidth: 1,
                },
              },
              scales: {
                x: {
                  ticks: { color: 'rgb(156, 163, 175)' },
                  grid: { color: 'rgba(75, 85, 99, 0.3)' },
                },
                y: {
                  ticks: { color: 'rgb(156, 163, 175)' },
                  grid: { color: 'rgba(75, 85, 99, 0.3)' },
                },
              },
            }}
          />
        </GlassPanel>

        {/* Confidence Meter */}
        <GlassPanel className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Confidence Score</h3>
          <div className="flex items-center justify-center h-48">
            <Doughnut
              data={confidenceData}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    titleColor: 'rgb(229, 231, 235)',
                    bodyColor: 'rgb(229, 231, 235)',
                    borderColor: 'rgb(75, 85, 99)',
                    borderWidth: 1,
                  },
                },
              }}
            />
          </div>
        </GlassPanel>
      </div>

      {/* Seasonal Trend */}
      <GlassPanel className="p-6">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">Seasonal Analysis</h3>
            <p className="text-gray-300">{result.seasonal_trend}</p>
          </div>
        </div>
      </GlassPanel>
    </motion.div>
  );
};

// Statistics Panel
const StatisticsPanel: React.FC = () => {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/statistics`);
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch statistics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <GlassPanel className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="p-6">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
        <div className="p-2 bg-cyan-500/20 rounded-lg mr-3">
          <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        Model Statistics
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Model Type"
          value={stats.model.type}
          icon="🤖"
        />
        <StatCard
          label="R² Score"
          value={(stats.model.performance.r2 * 100).toFixed(1) + '%'}
          icon="📊"
        />
        <StatCard
          label="Total Samples"
          value={stats.dataset.total_samples.toLocaleString()}
          icon="📈"
        />
        <StatCard
          label="Aquifer Zones"
          value={stats.dataset.zones.toString()}
          icon="🗺️"
        />
        <StatCard
          label="Avg Level"
          value={stats.dataset.avg_groundwater_level.toFixed(2) + 'm'}
          icon="💧"
        />
        <StatCard
          label="RMSE"
          value={stats.model.performance.rmse.toFixed(2) + 'm'}
          icon="📉"
        />
      </div>
    </GlassPanel>
  );
};

// Stat Card Component
const StatCard: React.FC<{ label: string; value: string; icon: string }> = ({ label, value, icon }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50"
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className="text-xl font-bold text-white">{value}</div>
    </motion.div>
  );
};

// Main App Component
const App: React.FC = () => {
  const [result, setResult] = useState<DetailedResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePredict = async (data: PredictionInput) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/predict/detailed`, {
        rainfall: parseFloat(data.rainfall),
        temperature: parseFloat(data.temperature),
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        month: data.month,
      });

      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch prediction. Please check the backend connection.');
      console.error('Prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <AnimatedBackground />
      
      <div className="max-w-7xl mx-auto">
        <Header />

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Input Form */}
          <div className="lg:col-span-1">
            <PredictionForm onPredict={handlePredict} loading={loading} />
            <div className="mt-6">
              <StatisticsPanel />
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2">
            {result ? (
              <ResultsDisplay result={result} />
            ) : (
              <GlassPanel className="p-12 text-center">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="mb-6"
                >
                  <svg className="w-24 h-24 mx-auto text-blue-400/50" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                  </svg>
                </motion.div>
                <h3 className="text-2xl font-semibold text-gray-400 mb-2">Ready for Prediction</h3>
                <p className="text-gray-500">Enter parameters and click "Generate Prediction" to see results</p>
              </GlassPanel>
            )}
          </div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center text-gray-500 text-sm"
        >
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Powered by Advanced Machine Learning</span>
          </div>
          <p>HydroTech Groundwater Prediction System © 2025</p>
        </motion.footer>
      </div>
    </div>
  );
};

export default App;

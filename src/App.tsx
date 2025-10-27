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
      {/* Gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950" />
      
      {/* Animated grid */}
      <div className="absolute inset-0" style={{
        backgroundImage: `
          linear-gradient(to right, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
      }} />
      
      {/* Animated water ripples */}
      <motion.div
        className="absolute top-20 left-20 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-3xl"
        animate={{
          scale: [1.3, 1, 1.3],
          opacity: [0.4, 0.2, 0.4],
          x: [0, -40, 0],
          y: [0, -25, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-500/15 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.3, 0.5, 0.3],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-40 right-40 w-[400px] h-[400px] bg-purple-500/15 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 30, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Scanning line effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-32"
        animate={{
          y: ['-10%', '110%'],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
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
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={`relative bg-gradient-to-br from-gray-900/80 via-gray-800/60 to-gray-900/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl shadow-2xl ${className}`}
      style={{
        boxShadow: '0 8px 32px 0 rgba(6, 182, 212, 0.15), inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 opacity-0 hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

// Header Component
const Header: React.FC = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-10"
    >
      <div className="relative">
        {/* Glowing background effect */}
        <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 rounded-3xl blur-2xl" />
        
        <div className="relative bg-gradient-to-r from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-5">
              {/* Animated logo */}
              <div className="relative">
                <motion.div
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ 
                    rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="relative z-10"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                    </svg>
                  </div>
                </motion.div>
                <motion.div
                  className="absolute inset-0 bg-cyan-400/30 rounded-xl blur-xl"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
                  Hydro<span className="text-cyan-300">Tech</span>
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <motion.div
                    className="w-2 h-2 bg-cyan-400 rounded-full"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <p className="text-cyan-300/80 text-sm font-medium tracking-wider uppercase">
                    AI-Powered Groundwater Analytics
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <StatusIndicator />
              <div className="text-right bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl px-4 py-3">
                <div className="text-xs text-cyan-400 font-semibold uppercase tracking-wider">ML Model v2.0</div>
                <div className="text-xs text-green-400 flex items-center justify-end mt-1">
                  <motion.div 
                    className="w-2 h-2 bg-green-400 rounded-full mr-2 shadow-lg shadow-green-400/50"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <span className="font-medium">System Online</span>
                </div>
              </div>
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
    <div className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-cyan-500/30 rounded-xl px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <motion.div
            className={`w-4 h-4 rounded-full ${
              status === 'healthy' ? 'bg-green-400 shadow-lg shadow-green-400/50' :
              status === 'offline' ? 'bg-red-400 shadow-lg shadow-red-400/50' : 'bg-yellow-400 shadow-lg shadow-yellow-400/50'
            }`}
            animate={status === 'healthy' ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
          {status === 'healthy' && (
            <motion.div
              className="absolute inset-0 bg-green-400 rounded-full"
              animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wider">Status</div>
          <div className={`text-sm font-semibold ${
            status === 'healthy' ? 'text-green-400' :
            status === 'offline' ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {status === 'healthy' ? 'Connected' : status === 'offline' ? 'Offline' : 'Connecting...'}
          </div>
        </div>
      </div>
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
        <motion.div 
          className="p-3 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-xl border border-cyan-400/30"
          animate={{ boxShadow: ['0 0 20px rgba(6, 182, 212, 0.3)', '0 0 30px rgba(6, 182, 212, 0.5)', '0 0 20px rgba(6, 182, 212, 0.3)'] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <svg className="w-7 h-7 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </motion.div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Input Parameters</h2>
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
          className={`relative w-full py-4 rounded-xl font-bold text-white transition-all overflow-hidden ${
            loading ? 'cursor-not-allowed' : ''
          }`}
        >
          {/* Animated background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"
            animate={loading ? {} : {
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{
              backgroundSize: '200% 100%',
            }}
          />
          
          {/* Glow effect */}
          {!loading && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-white/20 to-cyan-400/0"
              animate={{
                x: ['-200%', '200%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1,
              }}
            />
          )}
          
          {/* Button content */}
          <span className="relative z-10 flex items-center justify-center">
            {loading ? (
              <>
                <motion.svg 
                  className="h-5 w-5 mr-3" 
                  viewBox="0 0 24 24"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </motion.svg>
                <span className="tracking-wider">ANALYZING DATA...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="tracking-wider">GENERATE PREDICTION</span>
              </>
            )}
          </span>
          
          {/* Shadow effect */}
          {!loading && (
            <div className="absolute inset-0 -z-10 blur-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-50" />
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
      <GlassPanel className="p-10 text-center relative overflow-hidden">
        {/* Animated background particles */}
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 50%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="relative z-10"
        >
          <div className="text-cyan-400 text-xs uppercase tracking-[0.3em] mb-3 font-bold">Predicted Groundwater Level</div>
          
          {/* Holographic display effect */}
          <div className="relative inline-block mb-4">
            <motion.div
              className="text-8xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 5, repeat: Infinity }}
              style={{
                backgroundSize: '200% 100%',
              }}
            >
              {result.predicted_level_meters.toFixed(2)}
            </motion.div>
            
            {/* Glowing underline */}
            <motion.div
              className="h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
              animate={{
                opacity: [0.5, 1, 0.5],
                scaleX: [0.8, 1, 0.8],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          
          <div className="text-3xl font-bold text-cyan-300/80 mb-6 tracking-widest">METERS</div>
          
          {/* Stats row */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <motion.div 
              className="flex items-center space-x-2 bg-green-500/10 border border-green-400/30 rounded-lg px-4 py-2"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div 
                className="w-3 h-3 bg-green-400 rounded-full shadow-lg shadow-green-400/50"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-gray-300">Confidence:</span>
              <strong className="text-green-400 text-lg">{(result.confidence_score * 100).toFixed(1)}%</strong>
            </motion.div>
            
            <div className="w-px h-6 bg-cyan-500/30"></div>
            
            <motion.div 
              className="flex items-center space-x-2 bg-blue-500/10 border border-blue-400/30 rounded-lg px-4 py-2"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
              <span className="text-gray-300">Zone:</span>
              <strong className="text-blue-400 text-lg">{result.zone_name}</strong>
            </motion.div>
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
        
        {/* Labels above the bar */}
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="text-left">
            <div className="text-xs text-cyan-400 font-semibold mb-1">Lower Bound</div>
            <div className="text-lg font-bold text-white">{result.prediction_interval.lower.toFixed(2)}m</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-cyan-400 font-semibold mb-1">Upper Bound</div>
            <div className="text-lg font-bold text-white">{result.prediction_interval.upper.toFixed(2)}m</div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="relative h-12 bg-gray-700/30 rounded-lg overflow-hidden border border-cyan-500/20">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-blue-500/40 via-cyan-500/40 to-blue-500/40 backdrop-blur-sm"
          >
            <div className="h-full flex items-center justify-center">
              <motion.div 
                className="w-1 h-8 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50"
                animate={{ 
                  boxShadow: ['0 0 10px rgba(6, 182, 212, 0.5)', '0 0 20px rgba(6, 182, 212, 0.8)', '0 0 10px rgba(6, 182, 212, 0.5)']
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>
        </div>
        
        <p className="text-xs text-gray-400 mt-3 text-center">
          Prediction Range: <span className="text-cyan-300 font-semibold">{result.prediction_interval.lower.toFixed(2)}m - {result.prediction_interval.upper.toFixed(2)}m</span>
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

      {/* Prediction Validation Panel */}
      <PredictionValidation result={result} />
    </motion.div>
  );
};

// Prediction Validation Component
const PredictionValidation: React.FC<{ result: DetailedResult }> = ({ result }) => {
  // Define typical ranges for each zone
  const zoneRanges: { [key: string]: { min: number; max: number; avg: number } } = {
    'A': { min: 5, max: 20, avg: 11.8 },      // Urban (Delhi)
    'B': { min: 15, max: 40, avg: 26.6 },     // Agricultural (Lucknow)
    'C': { min: 3, max: 12, avg: 6.9 },       // Coastal (Chennai)
    'D': { min: 4, max: 15, avg: 8.8 },       // Arid (Jaipur)
  };

  const prediction = result.predicted_level_meters;
  const zone = result.aquifer_zone;
  const range = zoneRanges[zone] || { min: 2, max: 50, avg: 15 };
  
  // Calculate validation metrics
  const isWithinRange = prediction >= range.min && prediction <= range.max;
  const deviationFromAvg = Math.abs(prediction - range.avg);
  const percentDeviation = (deviationFromAvg / range.avg) * 100;
  const isHighConfidence = result.confidence_score >= 0.75;
  const isReasonable = percentDeviation <= 50; // Within 50% of average
  
  // Overall validation status
  const validationStatus = 
    isWithinRange && isHighConfidence && isReasonable ? 'excellent' :
    isWithinRange && (isHighConfidence || isReasonable) ? 'good' :
    isWithinRange ? 'acceptable' : 'warning';

  const statusConfig = {
    excellent: {
      color: 'green',
      icon: '✓',
      title: 'Excellent Prediction',
      message: 'All validation checks passed. Prediction is highly reliable.',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-400/30',
      textColor: 'text-green-400'
    },
    good: {
      color: 'blue',
      icon: '✓',
      title: 'Good Prediction',
      message: 'Prediction appears reasonable with good confidence.',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-400/30',
      textColor: 'text-blue-400'
    },
    acceptable: {
      color: 'yellow',
      icon: '!',
      title: 'Acceptable Prediction',
      message: 'Prediction is within range but verify additional factors.',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-400/30',
      textColor: 'text-yellow-400'
    },
    warning: {
      color: 'red',
      icon: '⚠',
      title: 'Unusual Prediction',
      message: 'Prediction outside typical range. Double-check input parameters.',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-400/30',
      textColor: 'text-red-400'
    }
  };

  const status = statusConfig[validationStatus];

  return (
    <GlassPanel className={`p-6 ${status.bgColor} border-2 ${status.borderColor}`}>
      <div className="flex items-start space-x-4">
        <motion.div 
          className={`p-3 ${status.bgColor} border ${status.borderColor} rounded-xl`}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className={`text-3xl ${status.textColor}`}>{status.icon}</div>
        </motion.div>
        
        <div className="flex-1">
          <h3 className={`text-xl font-bold ${status.textColor} mb-2 flex items-center`}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Prediction Validation
          </h3>
          
          <p className="text-gray-300 mb-4">{status.message}</p>
          
          {/* Validation Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className={`${status.bgColor} border ${status.borderColor} rounded-lg p-3`}>
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Range Check</div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isWithinRange ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className={`font-semibold ${isWithinRange ? 'text-green-400' : 'text-red-400'}`}>
                  {isWithinRange ? 'Within Expected Range' : 'Outside Range'}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Expected: {range.min.toFixed(1)}m - {range.max.toFixed(1)}m
              </div>
            </div>
            
            <div className={`${status.bgColor} border ${status.borderColor} rounded-lg p-3`}>
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Confidence Level</div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isHighConfidence ? 'bg-green-400' : 'bg-yellow-400'}`} />
                <span className={`font-semibold ${isHighConfidence ? 'text-green-400' : 'text-yellow-400'}`}>
                  {isHighConfidence ? 'High Confidence' : 'Moderate Confidence'}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Score: {(result.confidence_score * 100).toFixed(1)}%
              </div>
            </div>
            
            <div className={`${status.bgColor} border ${status.borderColor} rounded-lg p-3`}>
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Zone Average</div>
              <div className="flex items-center space-x-2">
                <span className="text-cyan-400 font-bold text-lg">{range.avg.toFixed(2)}m</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Historical average for {result.zone_name}
              </div>
            </div>
            
            <div className={`${status.bgColor} border ${status.borderColor} rounded-lg p-3`}>
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Deviation</div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isReasonable ? 'bg-green-400' : 'bg-yellow-400'}`} />
                <span className={`font-semibold ${isReasonable ? 'text-green-400' : 'text-yellow-400'}`}>
                  {percentDeviation.toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                From zone average
              </div>
            </div>
          </div>
          
          {/* Validation Tips */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
            <div className="text-sm font-semibold text-white mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How to Validate:
            </div>
            <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
              <li>Compare with historical data for the same zone and season</li>
              <li>Check if prediction aligns with recent rainfall patterns</li>
              <li>Verify input parameters are accurate and realistic</li>
              <li>Consider local geological and environmental factors</li>
              <li>Cross-reference with government groundwater monitoring data</li>
            </ul>
          </div>
        </div>
      </div>
    </GlassPanel>
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

      {/* Model Accuracy Info */}
      <div className="mb-6 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">📊</div>
          <div>
            <div className="text-sm font-semibold text-cyan-400 mb-1">Model Accuracy Indicator</div>
            <div className="text-xs text-gray-300 space-y-1">
              <div>• <strong className="text-white">R² Score {(stats.model.performance.r2 * 100).toFixed(1)}%</strong> - Model explains {(stats.model.performance.r2 * 100).toFixed(1)}% of variance in data</div>
              <div>• <strong className="text-white">RMSE {stats.model.performance.rmse.toFixed(2)}m</strong> - Average prediction error is ±{stats.model.performance.rmse.toFixed(2)} meters</div>
              <div>• Trained on <strong className="text-white">{stats.dataset.total_samples.toLocaleString()}</strong> real historical samples</div>
            </div>
          </div>
        </div>
      </div>

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
      whileHover={{ scale: 1.05, y: -5 }}
      className="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl p-5 border border-cyan-500/20 overflow-hidden group cursor-pointer"
    >
      {/* Hover glow effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 1,
        }}
      />
      
      <div className="relative z-10">
        <div className="text-3xl mb-3 filter drop-shadow-lg">{icon}</div>
        <div className="text-xs text-cyan-400 mb-2 uppercase tracking-wider font-semibold">{label}</div>
        <div className="text-xl font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent break-words">
          {value}
        </div>
      </div>
      
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-bl-full" />
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
        month: parseInt(data.month),
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
            
            {/* Validation Guide */}
            <div className="mt-6">
              <GlassPanel className="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <div className="p-2 bg-purple-500/20 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  How to Verify Results
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-3">
                    <div className="text-cyan-400 font-bold text-lg">1</div>
                    <div>
                      <div className="text-white font-semibold mb-1">Check Validation Status</div>
                      <div className="text-gray-300 text-xs">After prediction, review the "Prediction Validation" panel for automatic checks</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="text-cyan-400 font-bold text-lg">2</div>
                    <div>
                      <div className="text-white font-semibold mb-1">Compare with Zone Average</div>
                      <div className="text-gray-300 text-xs">Prediction should be near the historical average for that zone</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="text-cyan-400 font-bold text-lg">3</div>
                    <div>
                      <div className="text-white font-semibold mb-1">Check Confidence Score</div>
                      <div className="text-gray-300 text-xs">Higher confidence (&gt;75%) indicates more reliable prediction</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="text-cyan-400 font-bold text-lg">4</div>
                    <div>
                      <div className="text-white font-semibold mb-1">Review Seasonal Factors</div>
                      <div className="text-gray-300 text-xs">Monsoon months should show higher levels</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-purple-400/20">
                    <div className="text-xs text-purple-300 space-y-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                        <span><strong>Green</strong> - Excellent, highly reliable</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full" />
                        <span><strong>Blue</strong> - Good, reasonable prediction</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                        <span><strong>Yellow</strong> - Acceptable, verify inputs</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full" />
                        <span><strong>Red</strong> - Unusual, check parameters</span>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassPanel>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2">
            {result ? (
              <ResultsDisplay result={result} />
            ) : (
              <GlassPanel className="p-16 text-center relative overflow-hidden">
                {/* Animated scanning lines */}
                <motion.div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(6, 182, 212, 0.5) 25%, rgba(6, 182, 212, 0.5) 26%, transparent 27%, transparent 74%, rgba(6, 182, 212, 0.5) 75%, rgba(6, 182, 212, 0.5) 76%, transparent 77%, transparent)',
                    backgroundSize: '50px 50px',
                  }}
                  animate={{
                    y: ['0%', '100%'],
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                
                <motion.div
                  animate={{ 
                    scale: [1, 1.15, 1],
                    opacity: [0.4, 0.8, 0.4],
                    rotate: [0, 180, 360],
                  }}
                  transition={{ 
                    duration: 8, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="mb-8 relative inline-block"
                >
                  <div className="relative z-10 w-32 h-32 bg-gradient-to-br from-cyan-400/30 to-blue-600/30 rounded-2xl flex items-center justify-center border border-cyan-400/30">
                    <svg className="w-20 h-20 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                    </svg>
                  </div>
                  <motion.div
                    className="absolute inset-0 bg-cyan-400/20 rounded-2xl blur-2xl"
                    animate={{ 
                      scale: [1, 1.3, 1],
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </motion.div>
                
                <h3 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-3">
                  System Ready
                </h3>
                <p className="text-cyan-300/60 text-lg mb-4">Awaiting Input Parameters</p>
                
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <motion.div
                    className="w-2 h-2 bg-cyan-400 rounded-full"
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-cyan-400 rounded-full"
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-cyan-400 rounded-full"
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                  />
                </div>
              </GlassPanel>
            )}
          </div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16"
        >
          <div className="relative bg-gradient-to-r from-gray-900/50 via-gray-800/50 to-gray-900/50 backdrop-blur-xl border-t border-cyan-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <motion.div
                className="w-3 h-3 bg-green-400 rounded-full shadow-lg shadow-green-400/50"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-cyan-400/80 font-semibold tracking-wider uppercase text-sm">Powered by HydroTech</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-gray-500 text-xs">
              <span>HydroTech Groundwater Prediction System</span>
              <span className="text-cyan-500">•</span>
              <span className="text-cyan-400">© 2025</span>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
          </div>
        </motion.footer>
      </div>
    </div>
  );
};

export default App;

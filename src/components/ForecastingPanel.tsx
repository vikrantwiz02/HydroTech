import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const API_BASE_URL = 'http://localhost:8000';

interface Forecast {
  date: string;
  month: string;
  predicted_level: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  trend: string;
  trend_rate: number;
  note?: string;
}

interface TrendAnalysis {
  trend: string;
  slope: number;
  description: string;
  average_level: number;
  min_level: number;
  max_level: number;
  variance: number;
}

interface ForecastingPanelProps {
  zone: string;
  zoneName: string;
  userId?: string;
}

const ForecastingPanel: React.FC<ForecastingPanelProps> = ({ zone, zoneName, userId }) => {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [monthsAhead, setMonthsAhead] = useState(6);
  const [historicalCount, setHistoricalCount] = useState(0);

  const loadForecast = async () => {
    setLoading(true);
    try {
      const params = userId ? { months_ahead: monthsAhead, user_id: userId } : { months_ahead: monthsAhead };
      const response = await axios.post(`${API_BASE_URL}/api/forecast/zone/${zone}`, null, { params });
      
      setForecasts(response.data.forecasts);
      setTrendAnalysis(response.data.trend_analysis);
      setHistoricalCount(response.data.historical_data_points);
    } catch (error) {
      console.error('Forecast error:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: forecasts.map(f => f.month),
    datasets: [
      {
        label: 'Predicted Level',
        data: forecasts.map(f => f.predicted_level),
        borderColor: 'rgb(6, 182, 212)',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        borderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.4,
      },
      {
        label: 'Upper Bound (95% CI)',
        data: forecasts.map(f => f.confidence_interval.upper),
        borderColor: 'rgba(6, 182, 212, 0.3)',
        backgroundColor: 'rgba(6, 182, 212, 0.05)',
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
        fill: '+1',
        tension: 0.4,
      },
      {
        label: 'Lower Bound (95% CI)',
        data: forecasts.map(f => f.confidence_interval.lower),
        borderColor: 'rgba(6, 182, 212, 0.3)',
        backgroundColor: 'rgba(6, 182, 212, 0.05)',
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        labels: { color: 'rgb(229, 231, 235)' },
      },
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
        title: {
          display: true,
          text: 'Groundwater Level (meters)',
          color: 'rgb(156, 163, 175)',
        },
      },
    },
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'increasing') return 'text-green-400';
    if (trend === 'decreasing') return 'text-red-400';
    return 'text-blue-400';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'increasing') return '↗️';
    if (trend === 'decreasing') return '↘️';
    return '→';
  };

  return (
    <div className="relative bg-gradient-to-br from-gray-900/80 via-gray-800/60 to-gray-900/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl overflow-hidden shadow-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center">
            <svg className="w-6 h-6 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Time-Series Forecast
          </h3>
          <p className="text-gray-400 text-sm mt-1">Zone {zone} - {zoneName}</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={monthsAhead}
            onChange={(e) => setMonthsAhead(parseInt(e.target.value))}
            className="px-3 py-2 bg-gray-700/50 border border-purple-500/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value={3}>3 Months</option>
            <option value={6}>6 Months</option>
            <option value={12}>12 Months</option>
          </select>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadForecast}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <motion.svg
                  className="w-4 h-4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </motion.svg>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Generate Forecast</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {forecasts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Trend Analysis */}
          {trendAnalysis && (
            <div className="bg-purple-500/10 border border-purple-400/30 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">{getTrendIcon(trendAnalysis.trend)}</span>
                    <h4 className={`text-lg font-bold ${getTrendColor(trendAnalysis.trend)}`}>
                      {trendAnalysis.trend.charAt(0).toUpperCase() + trendAnalysis.trend.slice(1)} Trend
                    </h4>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">{trendAnalysis.description}</p>
                  
                  <div className="grid grid-cols-4 gap-3 text-xs">
                    <div className="bg-gray-800/50 rounded-lg p-2">
                      <div className="text-gray-400 mb-1">Data Points</div>
                      <div className="text-cyan-400 font-bold">{historicalCount}</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-2">
                      <div className="text-gray-400 mb-1">Average</div>
                      <div className="text-cyan-400 font-bold">{trendAnalysis.average_level}m</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-2">
                      <div className="text-gray-400 mb-1">Range</div>
                      <div className="text-cyan-400 font-bold">{trendAnalysis.min_level} - {trendAnalysis.max_level}m</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-2">
                      <div className="text-gray-400 mb-1">Variance</div>
                      <div className="text-cyan-400 font-bold">{trendAnalysis.variance?.toFixed(2) ?? 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Forecast Chart */}
          <div className="bg-gray-800/30 rounded-xl p-4">
            <Line data={chartData} options={chartOptions} />
          </div>

          {/* Forecast Table */}
          <div className="bg-gray-800/30 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-purple-500/20 border-b border-purple-400/30">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">Month</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">Predicted Level</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">Confidence Interval</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-purple-300 uppercase tracking-wider">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {forecasts.map((forecast, index) => (
                    <tr key={index} className="hover:bg-purple-500/5 transition-colors">
                      <td className="px-4 py-3 text-gray-300 font-medium">{forecast.month}</td>
                      <td className="px-4 py-3">
                        <span className="text-cyan-400 font-bold text-lg">{forecast.predicted_level}m</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {forecast.confidence_interval?.lower?.toFixed(2) ?? 'N/A'} - {forecast.confidence_interval?.upper?.toFixed(2) ?? 'N/A'}m
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <span className={getTrendColor(forecast.trend)}>{getTrendIcon(forecast.trend)}</span>
                          <span className={`text-xs ${getTrendColor(forecast.trend)}`}>
                            {forecast.trend_rate ? `${forecast.trend_rate > 0 ? '+' : ''}${forecast.trend_rate.toFixed(3)}m/month` : 'N/A'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {forecasts[0]?.note && (
            <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-3 flex items-start space-x-2">
              <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-yellow-300 text-sm">{forecasts[0].note}</p>
            </div>
          )}
        </motion.div>
      )}

      {forecasts.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-400 mb-2">No forecast data yet</p>
          <p className="text-gray-500 text-sm">Click "Generate Forecast" to see future predictions</p>
        </div>
      )}
    </div>
  );
};

export default ForecastingPanel;

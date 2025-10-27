import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './Auth';
import { format } from 'date-fns';
import { DetailedResult } from '../types';

const HistoryDashboard: React.FC<{ onLoadPrediction: (result: DetailedResult, input: any) => void }> = ({ onLoadPrediction }) => {
  const { user, savedPredictions } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [filterZone, setFilterZone] = useState<string>('all');

  if (!user) return null;

  const filteredPredictions = filterZone === 'all' 
    ? savedPredictions.filter(p => p.userId === user.id)
    : savedPredictions.filter(p => p.userId === user.id && p.result.aquifer_zone === filterZone);

  const zones = ['all', 'A', 'B', 'C', 'D'];
  const zoneNames: { [key: string]: string } = {
    'all': 'All Zones',
    'A': 'Urban',
    'B': 'Agricultural',
    'C': 'Coastal',
    'D': 'Arid'
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center space-x-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full px-4 py-2 hover:border-purple-400/50 transition-all"
      >
        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm text-white font-medium">History ({savedPredictions.filter(p => p.userId === user.id).length})</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="p-6 border-b border-cyan-500/20">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    Prediction History
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Filter */}
                <div className="mt-4 flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Filter:</span>
                  {zones.map(zone => (
                    <button
                      key={zone}
                      onClick={() => setFilterZone(zone)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        filterZone === zone
                          ? 'bg-cyan-500 text-white'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {zoneNames[zone]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {filteredPredictions.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-400">No predictions found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPredictions.map((prediction) => (
                      <motion.div
                        key={prediction.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-cyan-500/20 rounded-xl p-4 hover:border-cyan-500/40 transition-all cursor-pointer"
                        onClick={() => {
                          onLoadPrediction(prediction.result, prediction.input);
                          setIsOpen(false);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="text-2xl font-bold text-cyan-400">
                                {prediction.result.predicted_level_meters.toFixed(2)}m
                              </div>
                              <div className="px-2 py-1 bg-blue-500/20 border border-blue-400/30 rounded text-xs text-blue-400">
                                {prediction.result.zone_name}
                              </div>
                              <div className="px-2 py-1 bg-green-500/20 border border-green-400/30 rounded text-xs text-green-400">
                                {(prediction.result.confidence_score * 100).toFixed(1)}%
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 text-xs text-gray-300 mb-2">
                              <div>
                                <span className="text-gray-500">Rainfall:</span> {prediction.input.rainfall}mm
                              </div>
                              <div>
                                <span className="text-gray-500">Temp:</span> {prediction.input.temperature}°C
                              </div>
                              <div>
                                <span className="text-gray-500">Location:</span> {prediction.input.latitude.toFixed(2)}°, {prediction.input.longitude.toFixed(2)}°
                              </div>
                            </div>
                            
                            <div className="text-xs text-gray-500">
                              {format(new Date(prediction.timestamp), 'PPpp')}
                            </div>
                          </div>
                          
                          <button className="p-2 hover:bg-cyan-500/20 rounded-lg transition-colors">
                            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HistoryDashboard;

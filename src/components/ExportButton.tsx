import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { exportToPDF, exportToCSV } from '../utils/export';
import { DetailedResult } from '../types';

interface ExportButtonProps {
  result: DetailedResult;
  input: any;
}

const ExportButton: React.FC<ExportButtonProps> = ({ result, input }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <motion.button
        onClick={() => setShowMenu(!showMenu)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center space-x-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full px-4 py-2 hover:border-green-400/50 transition-all"
      >
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-sm text-white font-medium">Export</span>
        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </motion.button>

      {showMenu && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-0 mt-2 w-40 bg-gray-800/95 backdrop-blur-xl border border-green-500/30 rounded-xl shadow-2xl overflow-hidden z-50"
        >
          <button
            onClick={() => {
              exportToPDF(result, input);
              setShowMenu(false);
            }}
            className="w-full px-4 py-3 text-left text-sm text-white hover:bg-green-500/10 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span>Export as PDF</span>
          </button>
          <button
            onClick={() => {
              exportToCSV(result, input);
              setShowMenu(false);
            }}
            className="w-full px-4 py-3 text-left text-sm text-white hover:bg-green-500/10 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export as CSV</span>
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default ExportButton;

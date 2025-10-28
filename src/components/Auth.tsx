import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import axios from 'axios';
import { User, SavedPrediction } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface AuthContextType {
  user: User | null;
  login: (credential: string) => Promise<void>;
  logout: () => void;
  savePrediction: (prediction: SavedPrediction) => void;
  savedPredictions: SavedPrediction[];
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [savedPredictions, setSavedPredictions] = useState<SavedPrediction[]>([]);

  useEffect(() => {
    // Load user from localStorage
    const savedUser = localStorage.getItem('hydrotech_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      
      // Fetch predictions from database for this user
      const fetchPredictions = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/predictions/user/${parsedUser.id}`);
          if (response.data.predictions && response.data.predictions.length > 0) {
            setSavedPredictions(response.data.predictions);
            localStorage.setItem('hydrotech_predictions', JSON.stringify(response.data.predictions));
            console.log(`✅ Loaded ${response.data.predictions.length} predictions from database`);
          }
        } catch (error) {
          console.error('Failed to fetch predictions from database:', error);
          // Fall back to localStorage
          const saved = localStorage.getItem('hydrotech_predictions');
          if (saved) {
            setSavedPredictions(JSON.parse(saved));
          }
        }
      };
      
      fetchPredictions();
    }
  }, []);

  const login = async (credential: string) => {
    // Decode JWT token
    const payload = JSON.parse(atob(credential.split('.')[1]));
    const newUser: User = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
    };
    
    // Save user to localStorage
    setUser(newUser);
    localStorage.setItem('hydrotech_user', JSON.stringify(newUser));
    
    // Save user to MongoDB backend
    try {
      await axios.post(`${API_BASE_URL}/api/user/login`, newUser);
      console.log('✅ User saved to database');
      
      // Fetch user's prediction history from database
      const response = await axios.get(`${API_BASE_URL}/api/predictions/user/${newUser.id}`);
      if (response.data.predictions && response.data.predictions.length > 0) {
        setSavedPredictions(response.data.predictions);
        localStorage.setItem('hydrotech_predictions', JSON.stringify(response.data.predictions));
        console.log(`✅ Loaded ${response.data.predictions.length} predictions from database`);
      }
    } catch (error) {
      console.error('Failed to sync with database:', error);
      // Continue with login even if database sync fails
    }
  };

  const logout = () => {
    setUser(null);
    setSavedPredictions([]);
    localStorage.removeItem('hydrotech_user');
    localStorage.removeItem('hydrotech_predictions');
    // Reload page to clear all state
    window.location.reload();
  };

  const savePrediction = (prediction: SavedPrediction) => {
    const updated = [prediction, ...savedPredictions].slice(0, 50); // Keep last 50
    setSavedPredictions(updated);
    localStorage.setItem('hydrotech_predictions', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, savePrediction, savedPredictions }}>
      {children}
    </AuthContext.Provider>
  );
};

export const LoginButton: React.FC = () => {
  const { login } = useAuth();

  const handleSuccess = (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      login(credentialResponse.credential);
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => console.log('Login Failed')}
      theme="filled_black"
      size="medium"
      text="signin_with"
      shape="pill"
    />
  );
};

export const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <motion.button
        onClick={() => setShowMenu(!showMenu)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-full px-3 py-2 hover:border-cyan-400/50 transition-all"
      >
        <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
        <span className="text-sm text-white font-medium">{user.name}</span>
        <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-56 bg-gray-800/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            <div className="p-4 border-b border-gray-700">
              <div className="text-sm text-white font-semibold">{user.name}</div>
              <div className="text-xs text-gray-400">{user.email}</div>
            </div>
            <button
              onClick={() => {
                logout();
                setShowMenu(false);
              }}
              className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

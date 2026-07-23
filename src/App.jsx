// src/App.jsx
import React, { useState, useEffect } from 'react';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import axios from 'axios';
import { 
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { 
  LayoutDashboard, Receipt, Target, PieChart as PieChartIcon, Settings, LogOut, 
  Plus, TrendingUp, TrendingDown, Wallet, Moon, Sun, Search, Filter, Download, Trash2
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api'; // Deployment ke baad isko update karna hoga

export default function App() {
  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data States
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  
  // Auth Form States
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Dark Mode Toggle Logic
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Initial Data Fetch
  useEffect(() => {
    if (token) {
      fetchData(token);
    }
  }, [token]);

  // ==========================================
  // 2. AUTHENTICATION LOGIC
  // ==========================================
  const handleGoogleLogin = async () => {
    try {
      setAuthLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      await syncUserWithBackend(result.user);
    } catch (error) {
      alert(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (authMode === 'signup') {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await syncUserWithBackend(result.user, name);
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await syncUserWithBackend(result.user);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const syncUserWithBackend = async (firebaseUser, displayName = '') => {
    try {
      const { data } = await axios.post(`${API_URL}/auth/sync`, {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || displayName || 'User'
      });
      setToken(data.token);
      setUser(data);
      localStorage.setItem('token', data.token);
      fetchData(data.token);
    } catch (error) {
      console.error("Backend Sync Error:", error);
      alert("Failed to connect to database.");
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setToken(null);
    setUser(null);
    setTransactions([]);
    localStorage.removeItem('token');
  };

  const fetchData = async (authToken) => {
    try {
      const config = { headers: { Authorization: `Bearer ${authToken}` } };
      const [txRes, budgetRes, goalRes] = await Promise.all([
        axios.get(`${API_URL}/transactions`, config),
        axios.get(`${API_URL}/budgets`, config),
        axios.get(`${API_URL}/goals`, config)
      ]);
      setTransactions(txRes.data);
      setBudgets(budgetRes.data);
      setGoals(goalRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // ==========================================
  // 3. UI: LOGIN & SIGNUP SCREEN
  // ==========================================
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-lightbg dark:bg-darkbg p-4 relative overflow-hidden transition-colors duration-300">
        {/* Animated Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        
        <div className="glass-panel w-full max-w-md p-8 rounded-2xl z-10 animate-fade-in relative shadow-xl">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>
          
          <div className="text-center mb-8 mt-4">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand to-purple-600 mb-2 tracking-tight">FinTrack</h1>
            <p className="text-slate-600 dark:text-slate-400 font-medium">Manage your wealth intelligently.</p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {authMode === 'signup' && (
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Full Name</label>
                <input 
                  type="text" 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-2 focus:ring-brand outline-none transition-all dark:text-white"
                  placeholder="John Doe"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Email Address</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-2 focus:ring-brand outline-none transition-all dark:text-white"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Password</label>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-2 focus:ring-brand outline-none transition-all dark:text-white"
                placeholder="••••••••"
              />
            </div>
            <button 
              type="submit" 
              disabled={authLoading}
              className="w-full bg-brand hover:bg-indigo-600 text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30 flex justify-center items-center gap-2"
            >
              {authLoading ? 'Please wait...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between">
            <span className="border-b border-slate-300 dark:border-slate-600 w-1/5 lg:w-1/4"></span>
            <span className="text-xs text-center text-slate-500 dark:text-slate-400 uppercase font-semibold">Or continue with</span>
            <span className="border-b border-slate-300 dark:border-slate-600 w-1/5 lg:w-1/4"></span>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={authLoading}
            className="mt-6 w-full bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-3 shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>

          <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
            {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-brand font-semibold hover:underline"
            >
              {authMode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // PLACEHOLDER FOR NEXT PART - Do not remove this bracket yet
  return (
    <div className="text-white p-10">
      Dashboard is loading... We will paste the UI here in Part 2.
    </div>
  );
}

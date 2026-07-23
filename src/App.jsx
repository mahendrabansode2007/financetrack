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

  // ==========================================
  // 4. HELPER CALCULATIONS & CRUD LOGIC
  // ==========================================
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;
  
  const pieData = [
    { name: 'Income', value: totalIncome, color: '#10b981' },
    { name: 'Expenses', value: totalExpense, color: '#ef4444' }
  ];

  // New Transaction State
  const [newTx, setNewTx] = useState({ title: '', amount: '', type: 'expense', category: 'Food' });

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${API_URL}/transactions`, newTx, config);
      setNewTx({ title: '', amount: '', type: 'expense', category: 'Food' });
      fetchData(token);
    } catch (error) {
      console.error("Error adding transaction");
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API_URL}/transactions/${id}`, config);
      fetchData(token);
    } catch (error) {
      console.error("Error deleting transaction");
    }
  };

  // ==========================================
  // 5. MAIN DASHBOARD UI
  // ==========================================
  return (
    <div className="min-h-screen bg-lightbg dark:bg-darkbg text-slate-900 dark:text-white flex transition-colors duration-300">
      
      {/* SIDEBAR */}
      <aside className="w-64 glass-panel border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col z-20">
        <div className="p-6 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-brand to-purple-600">FinTrack</h2>
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            {darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'transactions', icon: Receipt, label: 'Transactions' },
            { id: 'budgets', icon: PieChartIcon, label: 'Budgets' },
            { id: 'goals', icon: Target, label: 'Savings Goals' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                ? 'bg-brand text-white shadow-lg shadow-brand/30' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-sm truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        {/* Background decorative blob */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -z-10 pointer-events-none"></div>

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            <header className="flex justify-between items-center mb-2">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Welcome back, {user?.name?.split(' ')[0]}!</p>
              </div>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* CRED style Balance Card */}
              <div className="credit-card rounded-2xl p-6 text-white relative overflow-hidden transition-transform hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black opacity-10 rounded-full -ml-10 -mb-10"></div>
                <p className="text-indigo-100 mb-1 font-medium">Total Balance</p>
                <h2 className="text-4xl font-extrabold mb-6">${balance.toFixed(2)}</h2>
                <div className="flex justify-between text-sm opacity-90 font-mono">
                  <span>**** **** **** 4289</span>
                  <span>12/28</span>
                </div>
              </div>
              
              <div className="glass-panel p-6 rounded-2xl flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Income</p>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">${totalIncome.toFixed(2)}</h3>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl">
                    <TrendingDown className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Expense</p>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">${totalExpense.toFixed(2)}</h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
                <h3 className="text-lg font-bold mb-6">Income vs Expenses Overview</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[{ name: 'Current Month', Income: totalIncome, Expense: totalExpense }]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} />
                      <YAxis stroke="#64748b" axisLine={false} tickLine={false} />
                      <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: darkMode ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Legend iconType="circle" />
                      <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={60} />
                      <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={60} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-lg font-bold mb-6">Expense Breakdown</h3>
                <div className="h-72 flex justify-center items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{backgroundColor: darkMode ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none'}} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION PLACEHOLDER FOR PART 3 */}
        {activeTab !== 'dashboard' && (
          <div className="glass-panel p-8 rounded-2xl animate-fade-in">
            <h2 className="text-2xl font-bold mb-4 capitalize">{activeTab} Manager</h2>
            <p className="text-slate-500">I will provide the Add Transaction & Budget logic code in the final step to replace this!</p>
          </div>
        )}

      </main>
    </div>
  );
}

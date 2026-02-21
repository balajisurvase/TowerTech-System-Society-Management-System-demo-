import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  AlertTriangle, 
  Calendar, 
  MessageSquare, 
  Shield, 
  LogOut, 
  Plus, 
  CheckCircle, 
  Clock, 
  UserPlus,
  Building2,
  TrendingUp,
  ChevronRight,
  Menu,
  X,
  MapPin,
  Info,
  Moon,
  Sun,
  FileText,
  Download,
  Search,
  Filter,
  Activity
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type Role = 'admin' | 'resident' | 'security';

interface User {
  id: number;
  username: string;
  role: Role;
  flat_id: string | null;
  name: string;
}

interface Flat {
  id: string;
  tower: string;
  floor: number;
  flat_number: number;
  owner_name: string;
  maintenance_status: 'Paid' | 'Unpaid';
}

interface Bill {
  id: number;
  flat_id: string;
  amount: number;
  month: string;
  due_date: string;
  status: 'Paid' | 'Unpaid';
}

interface Complaint {
  id: number;
  flat_id: string;
  title: string;
  description: string;
  category: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  created_at: string;
}

interface ActivityLog {
  id: number;
  user_id: number;
  user_name: string;
  action: string;
  details: string;
  timestamp: string;
}

interface Alert {
  id: number;
  tower: string;
  title: string;
  message: string;
  severity: 'Low' | 'Medium' | 'High';
  created_at: string;
}

interface Visitor {
  id: number;
  name: string;
  tower: string;
  flat_id: string;
  entry_time: string;
  exit_time: string | null;
  status: 'In' | 'Out';
}

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
}

// --- Components ---

const Card = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden", className)} {...props}>
    {children}
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className,
  disabled
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  className?: string;
  disabled?: boolean;
}) => {
  const variants = {
    primary: "bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600",
    danger: "bg-rose-500 text-white hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-500",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-4 py-2 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
};

const Badge = ({ children, variant = 'neutral' }: { children: React.ReactNode; variant?: 'success' | 'warning' | 'danger' | 'neutral' | 'info' }) => {
  const variants = {
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    danger: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    info: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    neutral: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
  };

  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", variants[variant])}>
      {children}
    </span>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('towertech_token'));
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('towertech_dark') === 'true');
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('towertech_dark', isDarkMode.toString());
  }, [isDarkMode]);

  const apiFetch = async (url: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401 || res.status === 403) {
      handleLogout();
      throw new Error("Session expired");
    }
    return res;
  };

  // Auth Logic
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username');
    const password = formData.get('password');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('towertech_token', data.token);
        setActiveTab('dashboard');
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (result.success) {
        alert("Account created! Please login.");
        setAuthMode('login');
      } else {
        alert(result.message);
      }
    } catch (err) {
      alert("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('towertech_token');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-red-200">
                <Building2 className="text-white w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">TowerTech System</h1>
              <p className="text-slate-500 text-sm">Society Management Platform</p>
            </div>

            {authMode === 'login' && (
              <>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                    <input 
                      name="username"
                      type="text" 
                      required
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                      placeholder="admin, resident, or security"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-slate-700">Password</label>
                      <button 
                        type="button"
                        onClick={() => setAuthMode('forgot')}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <input 
                      name="password"
                      type="password" 
                      required
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                      placeholder="admin123, res123, or sec123"
                    />
                  </div>
                  <Button disabled={loading} className="w-full py-3 mt-2">
                    {loading ? "Logging in..." : "Sign In"}
                  </Button>
                </form>
                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-500">
                    Don't have an account?{" "}
                    <button onClick={() => setAuthMode('register')} className="text-red-600 font-bold hover:underline">
                      Create New Account
                    </button>
                  </p>
                </div>
              </>
            )}

            {authMode === 'register' && (
              <>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input name="name" required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input name="email" type="email" required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" placeholder="john@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                    <input name="username" required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" placeholder="johndoe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <input name="password" type="password" required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Flat ID (Optional)</label>
                    <input name="flatId" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" placeholder="e.g., A-101" />
                  </div>
                  <Button disabled={loading} className="w-full py-3 mt-2">
                    {loading ? "Creating Account..." : "Register"}
                  </Button>
                </form>
                <div className="mt-6 text-center">
                  <button onClick={() => setAuthMode('login')} className="text-sm text-slate-500 hover:text-red-600">
                    Already have an account? Sign In
                  </button>
                </div>
              </>
            )}

            {authMode === 'forgot' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Reset Password</h3>
                <p className="text-sm text-slate-500">Enter your email address and we'll send you a simulation link to reset your password.</p>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input type="email" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" placeholder="john@example.com" />
                </div>
                <Button onClick={() => { alert("Reset link sent (simulated)"); setAuthMode('login'); }} className="w-full py-3">
                  Send Reset Link
                </Button>
                <div className="text-center">
                  <button onClick={() => setAuthMode('login')} className="text-sm text-slate-500 hover:text-red-600">
                    Back to Login
                  </button>
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-xs text-center text-slate-400 mb-4 uppercase tracking-wider font-semibold">Demo Credentials</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-slate-50 rounded-lg">
                  <p className="text-[10px] font-bold text-slate-500">ADMIN</p>
                  <p className="text-[10px] text-slate-400">admin / admin123</p>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded-lg">
                  <p className="text-[10px] font-bold text-slate-500">RESIDENT</p>
                  <p className="text-[10px] text-slate-400">resident / res123</p>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded-lg">
                  <p className="text-[10px] font-bold text-slate-500">SECURITY</p>
                  <p className="text-[10px] text-slate-400">security / sec123</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transition-transform duration-300 lg:relative lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full lg:hidden"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <Building2 className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-slate-900 truncate">TowerTech</span>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden ml-auto">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            <SidebarItem 
              icon={<LayoutDashboard size={20} />} 
              label="Dashboard" 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
            />
            
            {user.role === 'admin' && (
              <>
                <SidebarItem icon={<Users size={20} />} label="Towers & Flats" active={activeTab === 'flats'} onClick={() => setActiveTab('flats')} />
                <SidebarItem icon={<CreditCard size={20} />} label="Maintenance" active={activeTab === 'maintenance'} onClick={() => setActiveTab('maintenance')} />
                <SidebarItem icon={<AlertTriangle size={20} />} label="Emergency Alerts" active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')} />
                <SidebarItem icon={<Calendar size={20} />} label="Society Events" active={activeTab === 'events'} onClick={() => setActiveTab('events')} />
                <SidebarItem icon={<TrendingUp size={20} />} label="Financial Reports" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
                <SidebarItem icon={<Activity size={20} />} label="Activity Logs" active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
              </>
            )}

            {user.role === 'resident' && (
              <>
                <SidebarItem icon={<CreditCard size={20} />} label="My Bills" active={activeTab === 'bills'} onClick={() => setActiveTab('bills')} />
                <SidebarItem icon={<MessageSquare size={20} />} label="Complaints" active={activeTab === 'complaints'} onClick={() => setActiveTab('complaints')} />
                <SidebarItem icon={<Calendar size={20} />} label="Amenity Booking" active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} />
                <SidebarItem icon={<Shield size={20} />} label="Visitor History" active={activeTab === 'visitors'} onClick={() => setActiveTab('visitors')} />
              </>
            )}

            {user.role === 'security' && (
              <>
                <SidebarItem icon={<Shield size={20} />} label="Visitor Log" active={activeTab === 'visitors'} onClick={() => setActiveTab('visitors')} />
                <SidebarItem icon={<UserPlus size={20} />} label="New Entry" active={activeTab === 'new-entry'} onClick={() => setActiveTab('new-entry')} />
              </>
            )}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user.role}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full p-3 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <Menu size={20} className="text-slate-600 dark:text-slate-400" />
            </button>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
              {activeTab.replace('-', ' ')}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">
                <AlertTriangle size={20} />
              </button>
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">
                2
              </span>
            </div>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-sm font-medium text-slate-900 dark:text-white">{format(new Date(), 'EEEE, do MMMM')}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">TowerTech Society</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <DashboardView user={user} apiFetch={apiFetch} />}
              {activeTab === 'flats' && <AdminFlatsView apiFetch={apiFetch} />}
              {activeTab === 'maintenance' && <AdminMaintenanceView apiFetch={apiFetch} />}
              {activeTab === 'alerts' && <AdminAlertsView apiFetch={apiFetch} />}
              {activeTab === 'events' && <AdminEventsView apiFetch={apiFetch} />}
              {activeTab === 'reports' && <AdminReportsView apiFetch={apiFetch} />}
              {activeTab === 'logs' && <AdminLogsView apiFetch={apiFetch} />}
              {activeTab === 'bills' && <ResidentBillsView user={user} apiFetch={apiFetch} />}
              {activeTab === 'complaints' && <ResidentComplaintsView user={user} apiFetch={apiFetch} />}
              {activeTab === 'bookings' && <ResidentBookingsView user={user} apiFetch={apiFetch} />}
              {activeTab === 'visitors' && (user.role === 'security' ? <SecurityVisitorsView apiFetch={apiFetch} /> : <ResidentVisitorsView user={user} apiFetch={apiFetch} />)}
              {activeTab === 'new-entry' && <SecurityNewEntryView apiFetch={apiFetch} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full p-3 rounded-xl transition-all",
        active 
          ? "bg-red-50 text-red-600" 
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      {icon}
      <span className="font-medium">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-red-600" />}
    </button>
  );
}

// --- Views ---

function DashboardView({ user, apiFetch }: { user: User, apiFetch: any }) {
  const [stats, setStats] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);

  useEffect(() => {
    if (user.role === 'admin') {
      apiFetch('/api/admin/stats').then((res: any) => res.json()).then(setStats);
      apiFetch('/api/admin/ai-prediction').then((res: any) => res.json()).then(setPrediction);
    }
  }, [user]);

  if (user.role === 'admin' && stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Building2 className="text-red-600" />} label="Total Flats" value={stats.totalFlats} color="red" />
          <StatCard icon={<CheckCircle className="text-emerald-600" />} label="Paid Maintenance" value={stats.paidFlats} color="emerald" />
          <StatCard icon={<MessageSquare className="text-orange-600" />} label="Pending Complaints" value={stats.pendingComplaints} color="orange" />
          <StatCard icon={<Users className="text-rose-600" />} label="Active Visitors" value={stats.activeVisitors} color="rose" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-6">Collection Overview</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Collected', value: stats.totalCollected },
                  { name: 'Pending', value: stats.totalPending }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-bold mb-6">AI Budget Prediction</h3>
            {prediction ? (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                      <TrendingUp className="text-red-600 w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-red-900 dark:text-red-100">Projected Expense Growth</p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                        Recent: ₹{prediction.recentExpense?.toLocaleString()} vs Previous: ₹{prediction.previousExpense?.toLocaleString()}
                      </p>
                      <p className="text-xs font-bold text-red-800 dark:text-red-200 mt-1">Growth: {prediction.growth}%</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Recommendation</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{prediction.suggestion}</p>
                </div>
                <div className="flex items-center justify-between pt-4">
                  <span className="text-sm text-slate-500">Confidence Level</span>
                  <span className="text-sm font-bold text-emerald-600">{prediction.confidence?.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${prediction.confidence}%` }} />
                </div>
              </div>
            ) : (
              <p className="text-slate-500 animate-pulse">Analyzing financial data...</p>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-8 bg-red-600 rounded-2xl text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold">Welcome back, {user.name}!</h2>
          <p className="opacity-80 mt-1">Everything looks good in the society today.</p>
          <div className="mt-8 flex gap-4">
            <div className="bg-white/20 backdrop-blur-md p-4 rounded-xl">
              <p className="text-xs opacity-70 uppercase font-bold">Current Status</p>
              <p className="text-xl font-bold mt-1">All Clear</p>
            </div>
            <div className="bg-white/20 backdrop-blur-md p-4 rounded-xl">
              <p className="text-xs opacity-70 uppercase font-bold">Active Alerts</p>
              <p className="text-xl font-bold mt-1">0</p>
            </div>
          </div>
        </div>
        <Building2 className="absolute -right-8 -bottom-8 w-64 h-64 opacity-10 rotate-12" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <Calendar size={20} />
            </div>
            <h3 className="font-bold">Upcoming Events</h3>
          </div>
          <div className="space-y-4">
            <EventItem title="Annual General Meeting" date="March 15, 2026" />
            <EventItem title="Holi Celebration" date="March 22, 2026" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <AlertTriangle size={20} />
            </div>
            <h3 className="font-bold">Recent Alerts</h3>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-slate-500 italic">No active alerts for your tower.</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <Shield size={20} />
            </div>
            <h3 className="font-bold">Security Status</h3>
          </div>
          <p className="text-sm text-slate-600">Gate security is active. Last visitor recorded 15 mins ago.</p>
          <Button variant="secondary" className="w-full mt-4 text-xs">View Security Log</Button>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: any, color: string }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className={cn("p-3 rounded-xl", `bg-${color}-50`)}>
          {icon}
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function EventItem({ title, date }: { title: string, date: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-red-500" />
      <div>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{date}</p>
      </div>
    </div>
  );
}

// --- Admin Views ---

function AdminFlatsView({ apiFetch }: { apiFetch: any }) {
  const [flats, setFlats] = useState<Flat[]>([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiFetch('/api/admin/flats').then((res: any) => res.json()).then(setFlats);
  }, []);

  const filteredFlats = flats.filter(f => {
    const matchesTower = filter === 'All' || f.tower_id === filter;
    const matchesSearch = f.id.toLowerCase().includes(search.toLowerCase()) || f.owner_name.toLowerCase().includes(search.toLowerCase());
    return matchesTower && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {['All', 'A', 'B', 'C', 'D'].map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                filter === t ? "bg-red-600 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
              )}
            >
              Tower {t}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search flat or owner..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredFlats.map(flat => (
          <Card key={flat.id} className="p-4 hover:border-red-200 dark:hover:border-red-800 transition-colors dark:bg-slate-800 dark:border-slate-700">
            <div className="flex justify-between items-start mb-2">
              <span className="text-lg font-bold text-slate-900 dark:text-white">{flat.id}</span>
              <Badge variant={flat.maintenance_status === 'Paid' ? 'success' : 'danger'}>
                {flat.maintenance_status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{flat.owner_name}</p>
            <div className="flex gap-2">
              <Button variant="secondary" className="text-[10px] px-2 py-1 flex-1 dark:bg-slate-700 dark:text-slate-300">Details</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AdminMaintenanceView({ apiFetch }: { apiFetch: any }) {
  const [loading, setLoading] = useState(false);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [bills, setBills] = useState<any[]>([]);

  useEffect(() => {
    apiFetch('/api/admin/flats').then((res: any) => res.json()).then(setFlats);
  }, []);

  const generateBills = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/generate-bills', {
        method: 'POST',
        body: JSON.stringify({
          month: format(new Date(), 'MMMM yyyy'),
          amount: 1500,
          dueDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 10), 'yyyy-MM-dd')
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Bills generated successfully!");
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Failed to generate bills");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-8 max-w-2xl mx-auto dark:bg-slate-800 dark:border-slate-700">
        <h3 className="text-xl font-bold mb-6 dark:text-white">Generate Monthly Bills</h3>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Billing Month</label>
              <input type="text" readOnly value={format(new Date(), 'MMMM yyyy')} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (₹)</label>
              <input type="number" defaultValue={1500} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-900 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
            <input type="date" defaultValue={format(new Date(new Date().getFullYear(), new Date().getMonth(), 10), 'yyyy-MM-dd')} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-900 dark:text-white" />
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800 flex gap-3">
            <Info className="text-red-600 dark:text-red-400 shrink-0" size={20} />
            <p className="text-xs text-red-700 dark:text-red-300">Generating bills will create a new maintenance record for all 112 flats. Residents will receive an automated simulation email.</p>
          </div>
          <Button onClick={generateBills} disabled={loading} className="w-full py-3">
            {loading ? "Generating..." : "Generate Bills for All Flats"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function AdminAlertsView({ apiFetch }: { apiFetch: any }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      tower: formData.get('tower'),
      title: formData.get('title'),
      message: formData.get('message'),
      severity: formData.get('severity')
    };

    try {
      await apiFetch('/api/admin/alerts', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      alert("Alert sent successfully!");
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      alert("Failed to send alert");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-8 dark:bg-slate-800 dark:border-slate-700">
        <h3 className="text-xl font-bold mb-6 dark:text-white">Create Emergency Alert</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Tower</label>
              <select name="tower" className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-900 dark:text-white">
                <option value="All">All Towers</option>
                <option value="A">Tower A</option>
                <option value="B">Tower B</option>
                <option value="C">Tower C</option>
                <option value="D">Tower D</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Severity</label>
              <select name="severity" className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-900 dark:text-white">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Alert Title</label>
            <input name="title" required type="text" className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-900 dark:text-white" placeholder="e.g., Water Supply Interruption" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Message</label>
            <textarea name="message" required rows={4} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-900 dark:text-white" placeholder="Detailed message for residents..." />
          </div>
          <Button disabled={loading} className="w-full py-3">
            {loading ? "Sending..." : "Broadcast Alert"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function AdminEventsView({ apiFetch }: { apiFetch: any }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch('/api/events').then((res: any) => res.json()).then(setEvents);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      date: formData.get('date')
    };

    try {
      await apiFetch('/api/admin/events', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      const res = await apiFetch('/api/events');
      const newEvents = await res.json();
      setEvents(newEvents);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      alert("Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-6 lg:col-span-1 h-fit dark:bg-slate-800 dark:border-slate-700">
        <h3 className="text-lg font-bold mb-4 dark:text-white">Add New Event</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Event Title</label>
            <input name="title" required type="text" className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
            <input name="date" required type="date" className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea name="description" required rows={3} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-900 dark:text-white" />
          </div>
          <Button disabled={loading} className="w-full">
            {loading ? "Creating..." : "Create Event"}
          </Button>
        </form>
      </Card>

      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-lg font-bold dark:text-white">Upcoming Events</h3>
        {events.map(event => (
          <Card key={event.id} className="p-4 flex items-center gap-6 dark:bg-slate-800 dark:border-slate-700">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-xl flex flex-col items-center justify-center text-red-600 dark:text-red-400 shrink-0">
              <span className="text-xs font-bold uppercase">{format(new Date(event.date), 'MMM')}</span>
              <span className="text-xl font-black">{format(new Date(event.date), 'dd')}</span>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 dark:text-white">{event.title}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{event.description}</p>
            </div>
          </Card>
        ))}
        {events.length === 0 && <p className="text-center py-12 text-slate-400">No events scheduled.</p>}
      </div>
    </div>
  );
}

function AdminLogsView({ apiFetch }: { apiFetch: any }) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    apiFetch('/api/admin/logs').then((res: any) => res.json()).then(setLogs);
  }, []);

  return (
    <Card className="p-6 dark:bg-slate-800 dark:border-slate-700">
      <h3 className="text-lg font-bold mb-6 dark:text-white">System Activity Logs</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700">
              <th className="py-3 font-semibold text-slate-500 dark:text-slate-400 text-sm">Timestamp</th>
              <th className="py-3 font-semibold text-slate-500 dark:text-slate-400 text-sm">User</th>
              <th className="py-3 font-semibold text-slate-500 dark:text-slate-400 text-sm">Action</th>
              <th className="py-3 font-semibold text-slate-500 dark:text-slate-400 text-sm">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
            {logs.map(log => (
              <tr key={log.id}>
                <td className="py-4 text-xs text-slate-500 dark:text-slate-400">{format(new Date(log.timestamp), 'PPP p')}</td>
                <td className="py-4 font-medium text-slate-900 dark:text-white">{log.user_name}</td>
                <td className="py-4">
                  <Badge variant="info">{log.action}</Badge>
                </td>
                <td className="py-4 text-sm text-slate-600 dark:text-slate-300">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex justify-center">
        <Button variant="secondary" className="text-sm">Load More Logs</Button>
      </div>
    </Card>
  );
}

function AdminReportsView({ apiFetch }: { apiFetch: any }) {
  const data = [
    { name: 'Jan', income: 168000, expense: 120000 },
    { name: 'Feb', income: 168000, expense: 135000 },
    { name: 'Mar', income: 168000, expense: 142000 },
    { name: 'Apr', income: 168000, expense: 158000 },
  ];

  const pieData = [
    { name: 'Security', value: 45000 },
    { name: 'Maintenance', value: 35000 },
    { name: 'Utilities', value: 25000 },
    { name: 'Landscaping', value: 15000 },
  ];

  const COLORS = ['#ef4444', '#f87171', '#fca5a5', '#fee2e2'];

  const exportCSV = () => {
    const headers = ["Category", "Budgeted", "Actual", "Variance", "Status"];
    const rows = [
      ["Security Services", 45000, 45000, 0, "Under"],
      ["Electrical Maintenance", 15000, 18500, 3500, "Over"],
      ["Water Supply", 20000, 19200, -800, "Under"],
      ["Cleaning & Hygiene", 12000, 12000, 0, "Under"]
    ];
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `financial_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 dark:bg-slate-800 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-6 dark:text-white">Income vs Expense</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#ef4444" strokeWidth={3} dot={{ r: 6 }} />
                <Line type="monotone" dataKey="expense" stroke="#94a3b8" strokeWidth={3} dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 dark:bg-slate-800 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-6 dark:text-white">Expense Distribution</h3>
          <div className="h-80 flex flex-col items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-6 dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold dark:text-white">Financial Summary</h3>
          <Button onClick={exportCSV} variant="secondary" className="flex items-center gap-2 text-xs dark:bg-slate-700 dark:text-slate-300">
            <Download size={14} />
            Export CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                <th className="py-3 font-semibold text-slate-500 dark:text-slate-400 text-sm">Category</th>
                <th className="py-3 font-semibold text-slate-500 dark:text-slate-400 text-sm">Budgeted</th>
                <th className="py-3 font-semibold text-slate-500 dark:text-slate-400 text-sm">Actual</th>
                <th className="py-3 font-semibold text-slate-500 dark:text-slate-400 text-sm">Variance</th>
                <th className="py-3 font-semibold text-slate-500 dark:text-slate-400 text-sm text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              <ReportRow category="Security Services" budgeted={45000} actual={45000} />
              <ReportRow category="Electrical Maintenance" budgeted={15000} actual={18500} />
              <ReportRow category="Water Supply" budgeted={20000} actual={19200} />
              <ReportRow category="Cleaning & Hygiene" budgeted={12000} actual={12000} />
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ReportRow({ category, budgeted, actual }: { category: string, budgeted: number, actual: number }) {
  const variance = actual - budgeted;
  const isOver = variance > 0;

  return (
    <tr>
      <td className="py-4 font-medium text-slate-900 dark:text-white">{category}</td>
      <td className="py-4 text-slate-600 dark:text-slate-400">₹{budgeted.toLocaleString()}</td>
      <td className="py-4 text-slate-600 dark:text-slate-400">₹{actual.toLocaleString()}</td>
      <td className={cn("py-4", isOver ? "text-rose-600" : "text-emerald-600")}>
        {isOver ? "+" : ""}₹{variance.toLocaleString()}
      </td>
      <td className="py-4 text-right">
        <Badge variant={isOver ? 'danger' : 'success'}>{isOver ? 'Over' : 'Under'}</Badge>
      </td>
    </tr>
  );
}

// --- Resident Views ---

function ResidentBillsView({ user, apiFetch }: { user: User, apiFetch: any }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    apiFetch('/api/resident/dashboard').then((res: any) => res.json()).then(setData);
  }, [user]);

  if (!data) return <p className="dark:text-white">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 md:col-span-1 bg-red-600 text-white border-none">
          <p className="text-xs opacity-70 uppercase font-bold">Current Outstanding</p>
          <h3 className="text-4xl font-black mt-2">₹{data.flat.maintenance_status === 'Unpaid' ? '1,500' : '0'}</h3>
          <p className="text-sm opacity-80 mt-4">Flat {user.flat_id}</p>
          <p className="text-sm opacity-80">{user.name}</p>
          {data.flat.maintenance_status === 'Unpaid' && (
            <Button variant="secondary" className="w-full mt-6 text-red-600 font-bold">Pay Now</Button>
          )}
        </Card>

        <div className="md:col-span-2 space-y-4">
          <h3 className="text-lg font-bold dark:text-white">Billing History</h3>
          {data.bills.map((bill: Bill) => (
            <Card key={bill.id} className="p-4 flex items-center justify-between dark:bg-slate-800 dark:border-slate-700">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{bill.month}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Due: {bill.due_date}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-bold text-slate-900 dark:text-white">₹{bill.amount}</p>
                  <Badge variant={bill.status === 'Paid' ? 'success' : 'danger'}>{bill.status}</Badge>
                </div>
                {bill.status === 'Paid' && (
                  <Button 
                    variant="ghost" 
                    className="p-2 text-red-600"
                    onClick={() => window.print()}
                  >
                    <FileText size={18} />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResidentComplaintsView({ user, apiFetch }: { user: User, apiFetch: any }) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch('/api/resident/dashboard').then((res: any) => res.json()).then((data: any) => setComplaints(data.complaints));
  }, [user]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      category: formData.get('category')
    };

    try {
      await apiFetch('/api/resident/complaints', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      const res = await apiFetch('/api/resident/dashboard');
      const dashboardData = await res.json();
      setComplaints(dashboardData.complaints);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      alert("Failed to raise complaint");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-6 lg:col-span-1 h-fit dark:bg-slate-800 dark:border-slate-700">
        <h3 className="text-lg font-bold mb-4 dark:text-white">Raise a Complaint</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
            <select name="category" className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-900 dark:text-white">
              <option value="Water">Water</option>
              <option value="Electricity">Electricity</option>
              <option value="Lift">Lift</option>
              <option value="Cleaning">Cleaning</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Issue Title</label>
            <input name="title" required type="text" className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-900 dark:text-white" placeholder="e.g., Leakage in Bathroom" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea name="description" required rows={4} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-900 dark:text-white" placeholder="Describe the issue in detail..." />
          </div>
          <Button disabled={loading} className="w-full">
            {loading ? "Submitting..." : "Submit Complaint"}
          </Button>
        </form>
      </Card>

      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-lg font-bold dark:text-white">Your Complaints</h3>
        {complaints.map(c => (
          <Card key={c.id} className="p-4 dark:bg-slate-800 dark:border-slate-700">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">{c.title}</h4>
                <Badge variant="neutral">{c.category}</Badge>
              </div>
              <Badge variant={c.status === 'Resolved' ? 'success' : 'warning'}>{c.status}</Badge>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{c.description}</p>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <Clock size={12} />
              <span>{format(new Date(c.created_at), 'PPP p')}</span>
            </div>
          </Card>
        ))}
        {complaints.length === 0 && <p className="text-center py-12 text-slate-400">No complaints raised yet.</p>}
      </div>
    </div>
  );
}

function ResidentBookingsView({ user, apiFetch }: { user: User, apiFetch: any }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch('/api/amenities/bookings').then((res: any) => res.json()).then(setBookings);
  }, []);

  const handleBook = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      amenity: formData.get('amenity'),
      date: formData.get('date'),
      timeSlot: formData.get('timeSlot')
    };

    try {
      const res = await apiFetch('/api/resident/book', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (result.success) {
        const bRes = await apiFetch('/api/amenities/bookings');
        setBookings(await bRes.json());
        alert("Booking confirmed!");
      } else {
        alert(result.message);
      }
    } catch (err) {
      alert("Booking failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-6 lg:col-span-1 h-fit dark:bg-slate-800 dark:border-slate-700">
        <h3 className="text-lg font-bold mb-4 dark:text-white">Book Amenity</h3>
        <form onSubmit={handleBook} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select Amenity</label>
            <select name="amenity" className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-900 dark:text-white">
              <option value="Clubhouse">Clubhouse</option>
              <option value="Gym">Gym</option>
              <option value="Swimming Pool">Swimming Pool</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
            <input name="date" required type="date" min={format(new Date(), 'yyyy-MM-dd')} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Time Slot</label>
            <select name="timeSlot" className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-900 dark:text-white">
              <option value="06:00 AM - 08:00 AM">06:00 AM - 08:00 AM</option>
              <option value="08:00 AM - 10:00 AM">08:00 AM - 10:00 AM</option>
              <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
              <option value="06:00 PM - 08:00 PM">06:00 PM - 08:00 PM</option>
            </select>
          </div>
          <Button disabled={loading} className="w-full">
            {loading ? "Checking..." : "Confirm Booking"}
          </Button>
        </form>
      </Card>

      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-lg font-bold dark:text-white">Society Bookings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bookings.map(b => (
            <Card key={b.id} className={cn("p-4 border-l-4 dark:bg-slate-800 dark:border-slate-700", b.flat_id === user.flat_id ? "border-l-red-600" : "border-l-slate-200 dark:border-l-slate-600")}>
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-slate-900 dark:text-white">{b.amenity}</h4>
                {b.flat_id === user.flat_id && <Badge variant="info">Your Booking</Badge>}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{format(new Date(b.date), 'PPP')}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{b.time_slot}</p>
              <p className="text-[10px] text-slate-400 mt-2">Booked by Flat {b.flat_id}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResidentVisitorsView({ user, apiFetch }: { user: User, apiFetch: any }) {
  const [visitors, setVisitors] = useState<Visitor[]>([]);

  useEffect(() => {
    apiFetch('/api/resident/dashboard').then((res: any) => res.json()).then((data: any) => setVisitors(data.visitors));
  }, [user]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold dark:text-white">Visitor History</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700">
              <th className="py-3 font-semibold text-slate-500 dark:text-slate-400 text-sm">Visitor Name</th>
              <th className="py-3 font-semibold text-slate-500 dark:text-slate-400 text-sm">Entry Time</th>
              <th className="py-3 font-semibold text-slate-500 dark:text-slate-400 text-sm">Exit Time</th>
              <th className="py-3 font-semibold text-slate-500 dark:text-slate-400 text-sm text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
            {visitors.map(v => (
              <tr key={v.id}>
                <td className="py-4 font-medium text-slate-900 dark:text-white">{v.name}</td>
                <td className="py-4 text-slate-600 dark:text-slate-300 text-sm">{format(new Date(v.entry_time), 'PPP p')}</td>
                <td className="py-4 text-slate-600 dark:text-slate-300 text-sm">{v.exit_time ? format(new Date(v.exit_time), 'PPP p') : '-'}</td>
                <td className="py-4 text-right">
                  <Badge variant={v.status === 'In' ? 'warning' : 'neutral'}>{v.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {visitors.length === 0 && <p className="text-center py-12 text-slate-400">No visitor records found.</p>}
    </div>
  );
}

// --- Security Views ---

function SecurityVisitorsView({ apiFetch }: { apiFetch: any }) {
  const [visitors, setVisitors] = useState<Visitor[]>([]);

  useEffect(() => {
    apiFetch('/api/security/visitors').then((res: any) => res.json()).then(setVisitors);
  }, []);

  const handleExit = async (id: number) => {
    await apiFetch('/api/security/visitor-exit', {
      method: 'POST',
      body: JSON.stringify({ id })
    });
    const res = await apiFetch('/api/security/visitors');
    setVisitors(await res.json());
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold dark:text-white">Daily Visitor Log</h3>
        <Badge variant="info">{visitors.filter(v => v.status === 'In').length} Currently Inside</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visitors.map(v => (
          <Card key={v.id} className="p-4 dark:bg-slate-800 dark:border-slate-700">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">{v.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Flat {v.flat_id} (Tower {v.tower})</p>
              </div>
              <Badge variant={v.status === 'In' ? 'warning' : 'neutral'}>{v.status}</Badge>
            </div>
            <div className="space-y-1 mb-4">
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <Clock size={12} />
                <span>In: {format(new Date(v.entry_time), 'p')}</span>
              </div>
              {v.exit_time && (
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <Clock size={12} />
                  <span>Out: {format(new Date(v.exit_time), 'p')}</span>
                </div>
              )}
            </div>
            {v.status === 'In' && (
              <Button onClick={() => handleExit(v.id)} variant="secondary" className="w-full text-xs">Mark Exit</Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function SecurityNewEntryView({ apiFetch }: { apiFetch: any }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      tower: formData.get('tower'),
      flatId: formData.get('flatId')
    };

    try {
      await apiFetch('/api/security/visitor-entry', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      alert("Entry recorded successfully!");
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      alert("Failed to record entry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card className="p-8 dark:bg-slate-800 dark:border-slate-700">
        <h3 className="text-xl font-bold mb-6 dark:text-white">Record New Visitor</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Visitor Name</label>
            <input name="name" required type="text" className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-900 dark:text-white" placeholder="Full Name" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tower</label>
              <select name="tower" className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-900 dark:text-white">
                <option value="A">Tower A</option>
                <option value="B">Tower B</option>
                <option value="C">Tower C</option>
                <option value="D">Tower D</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Flat Number</label>
              <input name="flatId" required type="text" className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-900 dark:text-white" placeholder="e.g., A-101" />
            </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 flex gap-3">
            <MapPin className="text-slate-400 shrink-0" size={20} />
            <p className="text-xs text-slate-500 dark:text-slate-400">Entry time will be automatically recorded as {format(new Date(), 'p')}.</p>
          </div>
          <Button disabled={loading} className="w-full py-3">
            {loading ? "Recording..." : "Check In Visitor"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

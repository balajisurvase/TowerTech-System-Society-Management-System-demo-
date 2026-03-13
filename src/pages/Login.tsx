import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { ensureAdminProfile, initializeDemoData } from '../lib/demoData';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Lock, User, AlertCircle, Eye, EyeOff, Sun, Moon } from 'lucide-react';

const Login: React.FC = () => {
  const [role, setRole] = useState<'ADMIN' | 'RESIDENT'>('RESIDENT');
  const [societyId, setSocietyId] = useState('TOWERTECH001');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [tower, setTower] = useState('A');
  const [flatNumber, setFlatNumber] = useState('A-101');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        await initializeDemoData();
      } catch (err) {
        // Silently fail initialization if no permissions (likely not logged in yet)
        console.log("Initialization skipped (no permissions yet)");
      }
    };
    init();
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Special check for requested admin credentials
      if (role === 'ADMIN' && email === 'admin@towertech.com' && password === 'mssu@123') {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          await ensureAdminProfile(userCredential.user.uid, userCredential.user.email!);
          navigate('/admin');
          return;
        } catch (authErr: any) {
          if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
            // Auto-create demo admin if it doesn't exist in Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await ensureAdminProfile(userCredential.user.uid, userCredential.user.email!);
            navigate('/admin');
            return;
          }
          throw authErr;
        }
      }

      // For Residents
      if (role === 'RESIDENT') {
        // For demo purposes, if they use the demo password mssu@123, we'll try to find or create them
        if (password === 'mssu@123') {
          const residentEmail = `resident.${flatNumber.toLowerCase()}@towertech.com`;
          
          try {
            // Try signing in
            await signInWithEmailAndPassword(auth, residentEmail, password);
          } catch (authErr: any) {
            // If user doesn't exist, create them
            if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
              const userCredential = await createUserWithEmailAndPassword(auth, residentEmail, password);
              // Create Firestore profile
              await setDoc(doc(db, 'users', userCredential.user.uid), {
                uid: userCredential.user.uid,
                name: `Resident ${flatNumber}`,
                email: residentEmail,
                role: 'RESIDENT',
                tower: tower,
                flatNumber: flatNumber,
                status: 'APPROVED',
                createdAt: new Date().toISOString()
              });
            } else {
              throw authErr;
            }
          }
          navigate('/resident');
          return;
        }

        // Normal resident login (requires existing account)
        const q = query(collection(db, 'users'), where('flatNumber', '==', flatNumber), where('role', '==', 'RESIDENT'));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          throw new Error("Resident not found for this flat. Please register first.");
        }
        
        const userData = snap.docs[0].data();
        await signInWithEmailAndPassword(auth, userData.email, password);
        navigate('/resident');
      } else {
        // Normal Admin login
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/admin');
      }
      
    } catch (err: any) {
      console.error("Login error:", err);
      
      // Detailed error info for debugging
      const errInfo = {
        error: err.message,
        role,
        email,
        flatNumber,
        authStatus: auth.currentUser ? 'Authenticated' : 'Not Authenticated',
        uid: auth.currentUser?.uid
      };
      console.error('Detailed Login Error: ', JSON.stringify(errInfo));

      setError("Invalid credentials. Please check your email/password or use the sample credentials below.");
    } finally {
      setLoading(false);
    }
  };

  const flatOptions = Array.from({ length: 7 }, (_, i) => i + 1).flatMap(floor => 
    Array.from({ length: 4 }, (_, j) => j + 1).map(flat => `${tower}-${floor}0${flat}`)
  );

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-[#111827]' : 'bg-[#F3F4F6]'} p-4 relative`}>
      {/* Dark Mode Toggle */}
      <button 
        onClick={toggleDarkMode}
        className="absolute top-6 right-6 p-2 rounded-full bg-white dark:bg-[#1F2937] shadow-md text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-all z-50"
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="w-full max-w-[420px] bg-white dark:bg-[#1F2937] p-[30px] rounded-[12px] shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border border-transparent dark:border-gray-800">
        <div className="text-center mb-[20px]">
          <h1 className="text-[28px] font-bold text-[#1E3A8A] dark:text-white leading-tight">TowerTech Society Management System</h1>
          <p className="text-[16px] text-[#6B7280] dark:text-gray-300 mt-1">Smart Society Management Platform</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle size={18} />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-[15px]">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Login As</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full h-[40px] px-3 rounded-[6px] border border-[#D1D5DB] dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:border-[#2563EB]"
            >
              <option value="RESIDENT">Resident</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Society ID</label>
            <input 
              type="text"
              placeholder="Enter Society ID"
              value={societyId}
              onChange={(e) => setSocietyId(e.target.value)}
              className="w-full h-[40px] px-3 rounded-[6px] border border-[#D1D5DB] dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:border-[#2563EB]"
              required
            />
          </div>

          {role === 'ADMIN' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Email Address</label>
              <input 
                type="email"
                placeholder="Enter admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[40px] px-3 rounded-[6px] border border-[#D1D5DB] dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:border-[#2563EB]"
                required
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Select Tower</label>
                  <select
                    value={tower}
                    onChange={(e) => {
                      setTower(e.target.value);
                      setFlatNumber(`${e.target.value}-101`);
                    }}
                    className="w-full h-[40px] px-3 rounded-[6px] border border-[#D1D5DB] dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:border-[#2563EB]"
                  >
                    <option value="A">A Tower</option>
                    <option value="B">B Tower</option>
                    <option value="C">C Tower</option>
                    <option value="D">D Tower</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Flat Number</label>
                  <select
                    value={flatNumber}
                    onChange={(e) => setFlatNumber(e.target.value)}
                    className="w-full h-[40px] px-3 rounded-[6px] border border-[#D1D5DB] dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:border-[#2563EB]"
                  >
                    {flatOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-[40px] px-3 pr-10 rounded-[6px] border border-[#D1D5DB] dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:border-[#2563EB]"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]"
              />
              <span className="text-[14px] text-gray-600 dark:text-gray-300">Remember Me</span>
            </label>
            <button type="button" className="text-[#2563EB] text-[14px] hover:underline font-medium">Forgot Password?</button>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full h-[45px] mt-[15px] bg-[#2563EB] hover:bg-[#1E40AF] text-white font-bold rounded-[8px] transition-all disabled:opacity-50 text-[16px] shadow-lg shadow-blue-500/20"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
            Don't have an account?
          </p>
          <Link 
            to="/register" 
            className="w-full h-[40px] flex items-center justify-center border border-[#2563EB] text-[#2563EB] rounded-[8px] text-sm font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all"
          >
            Create New Account
          </Link>
        </div>

        {/* Sample Credentials Box */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Sample Credentials</p>
          <div className="space-y-2">
            <div>
              <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400">Admin Login:</p>
              <p className="text-[11px] text-gray-600 dark:text-gray-300">Email: admin@towertech.com</p>
              <p className="text-[11px] text-gray-600 dark:text-gray-300">Pass: mssu@123</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Resident Login:</p>
              <p className="text-[11px] text-gray-600 dark:text-gray-300">Select Flat (e.g. A-101)</p>
              <p className="text-[11px] text-gray-600 dark:text-gray-300">Pass: mssu@123</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-[12px] text-gray-500 dark:text-gray-400">
          © 2026 TowerTech Society Management System
        </p>
      </div>
    </div>
  );
};

export default Login;

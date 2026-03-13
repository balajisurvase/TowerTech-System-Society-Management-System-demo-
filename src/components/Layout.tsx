import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, 
  Users, 
  CreditCard, 
  MessageSquare, 
  Calendar, 
  ShieldAlert, 
  FileText, 
  User, 
  Settings, 
  LogOut, 
  Sun, 
  Moon,
  Menu,
  X
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../lib/auth';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, isAdmin } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutGrid, label: 'Dashboard', path: isAdmin ? '/admin' : '/resident' },
    { icon: Users, label: 'Residents', path: '/admin/residents', adminOnly: true },
    { icon: CreditCard, label: 'Maintenance', path: isAdmin ? '/admin/billing' : '/resident/maintenance' },
    { icon: MessageSquare, label: 'Complaints', path: isAdmin ? '/admin/complaints' : '/resident/complaints' },
    { icon: Calendar, label: 'Events', path: isAdmin ? '/admin/events' : '/resident/events' },
    { icon: ShieldAlert, label: 'Amenity Booking', path: isAdmin ? '/admin/bookings' : '/resident/bookings' },
    { icon: FileText, label: 'Financial Reports', path: '/admin/reports', adminOnly: true },
    { icon: ShieldAlert, label: 'Emergency Alerts', path: isAdmin ? '/admin/alerts' : '/resident/alert' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const filteredItems = menuItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen flex bg-[#F3F4F6] dark:bg-[#111827]">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-[220px] bg-[#1E3A8A] text-white transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-[#1E3A8A] font-bold text-xl">T</span>
            </div>
            <span className="text-xl font-bold tracking-tight">TowerTech</span>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {filteredItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                <item.icon size={20} />
                <span className="text-sm">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-white/10">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
            >
              <LogOut size={20} />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-[#1F2937] shadow-sm flex items-center justify-between px-6 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleDarkMode}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-700 mx-2"></div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-800 dark:text-white leading-none">{profile?.name}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">{profile?.role}</p>
              </div>
              <div className="w-10 h-10 bg-[#2563EB] rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                {profile?.name?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

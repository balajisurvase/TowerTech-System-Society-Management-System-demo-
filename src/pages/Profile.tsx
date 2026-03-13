import React from 'react';
import { useAuth } from '../lib/auth';
import { User, Mail, Phone, Building2, LayoutGrid, ShieldCheck } from 'lucide-react';

const Profile: React.FC = () => {
  const { profile } = useAuth();

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white dark:bg-[#1F2937] rounded-[10px] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="w-24 h-24 bg-blue-600 rounded-full border-4 border-white dark:border-[#1F2937] flex items-center justify-center text-white text-4xl font-bold shadow-lg">
              {profile.name?.charAt(0)}
            </div>
            <button className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-100 transition-all">
              Edit Profile
            </button>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.name}</h2>
            <p className="text-gray-500 flex items-center gap-2 mt-1">
              <ShieldCheck size={16} className="text-blue-600" />
              {profile.role} • TowerTech Society
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-[#1F2937] p-8 rounded-[10px] shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Contact Information</h3>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Mail size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email Address</p>
                <p className="text-gray-900 dark:text-white font-medium">{profile.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Phone size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Phone Number</p>
                <p className="text-gray-900 dark:text-white font-medium">{profile.phone || '+91 98765 43210'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1F2937] p-8 rounded-[10px] shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Residence Details</h3>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Building2 size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tower</p>
                <p className="text-gray-900 dark:text-white font-medium">Tower {profile.tower || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <LayoutGrid size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Flat Number</p>
                <p className="text-gray-900 dark:text-white font-medium">{profile.flatNumber || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;


import React, { useState } from 'react';
import { X, User, Bell, Shield, Moon, Monitor, LogOut, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  user: any;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onLogout, user }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'privacy'>('general');
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 animate-scale-up flex flex-col md:flex-row h-[500px]">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-6 flex flex-col">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Settings</h2>
          
          <nav className="space-y-1 flex-1">
            <button 
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'general' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <User size={18} />
              <span>General</span>
            </button>
            <button 
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notifications' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <Bell size={18} />
              <span>Notifications</span>
            </button>
            <button 
              onClick={() => setActiveTab('privacy')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'privacy' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <Shield size={18} />
              <span>Privacy & Security</span>
            </button>
          </nav>

          <div className="pt-6 border-t border-slate-200">
             <button 
                onClick={() => { onLogout(); onClose(); }}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
             >
                <LogOut size={18} />
                <span>Sign Out</span>
             </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 overflow-y-auto relative">
           <button 
             onClick={onClose}
             className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
           >
             <X size={20} />
           </button>

           {activeTab === 'general' && (
             <div className="space-y-6 animate-fade-in">
                <div>
                   <h3 className="text-lg font-bold text-slate-800 mb-1">Profile Information</h3>
                   <p className="text-sm text-slate-500">Update your account details.</p>
                </div>
                
                <div className="flex items-center space-x-4 mb-6">
                   <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl border-4 border-white shadow-sm">
                      {user?.email ? user.email[0].toUpperCase() : 'U'}
                   </div>
                   <div>
                      <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700">Change Avatar</button>
                      <p className="text-xs text-slate-400">JPG, GIF or PNG. 1MB Max.</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
                      <input type="text" defaultValue="Alex User" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm" />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                      <input type="email" defaultValue={user?.email || "alex@example.com"} className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 text-sm" disabled />
                   </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800 mb-4">Appearance</h3>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                                <Moon size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-700">Dark Mode</p>
                                <p className="text-xs text-slate-500">Reduce eye strain at night</p>
                            </div>
                        </div>
                        <button onClick={() => setDarkMode(!darkMode)} className={`text-2xl ${darkMode ? 'text-indigo-600' : 'text-slate-300'}`}>
                            {darkMode ? <ToggleRight size={40} className="fill-current" /> : <ToggleLeft size={40} />}
                        </button>
                    </div>
                </div>
             </div>
           )}

           {activeTab === 'notifications' && (
             <div className="space-y-6 animate-fade-in">
                <div>
                   <h3 className="text-lg font-bold text-slate-800 mb-1">Notifications</h3>
                   <p className="text-sm text-slate-500">Manage how we communicate with you.</p>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                        <div>
                            <p className="text-sm font-bold text-slate-700">Email Digest</p>
                            <p className="text-xs text-slate-500">Weekly summary of your learning progress.</p>
                        </div>
                        <button onClick={() => setEmailNotifs(!emailNotifs)} className={`text-2xl ${emailNotifs ? 'text-indigo-600' : 'text-slate-300'}`}>
                            {emailNotifs ? <ToggleRight size={40} className="fill-current" /> : <ToggleLeft size={40} />}
                        </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                        <div>
                            <p className="text-sm font-bold text-slate-700">New Course Alerts</p>
                            <p className="text-xs text-slate-500">Get notified when new courses match your skills.</p>
                        </div>
                        <button className="text-2xl text-indigo-600">
                             <ToggleRight size={40} className="fill-current" />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                        <div>
                            <p className="text-sm font-bold text-slate-700">Earnings Updates</p>
                            <p className="text-xs text-slate-500">Notifications when you receive payouts.</p>
                        </div>
                         <button className="text-2xl text-indigo-600">
                             <ToggleRight size={40} className="fill-current" />
                        </button>
                    </div>
                </div>
             </div>
           )}

            {activeTab === 'privacy' && (
             <div className="space-y-6 animate-fade-in">
                <div>
                   <h3 className="text-lg font-bold text-slate-800 mb-1">Privacy & Security</h3>
                   <p className="text-sm text-slate-500">Control your data and account security.</p>
                </div>

                 <div className="space-y-2">
                    <button className="w-full flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group">
                        <div>
                            <p className="text-sm font-bold text-slate-700">Change Password</p>
                            <p className="text-xs text-slate-500">Last changed 3 months ago</p>
                        </div>
                        <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-600" />
                    </button>
                    
                     <button className="w-full flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group">
                        <div>
                            <p className="text-sm font-bold text-slate-700">Two-Factor Authentication</p>
                            <p className="text-xs text-slate-500">Add an extra layer of security</p>
                        </div>
                        <div className="flex items-center">
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded mr-3">OFF</span>
                            <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-600" />
                        </div>
                    </button>
                 </div>

                 <div className="pt-6 border-t border-slate-100">
                     <h4 className="text-sm font-bold text-rose-600 mb-2">Danger Zone</h4>
                     <button className="text-sm text-slate-500 hover:text-rose-600 underline decoration-slate-300 hover:decoration-rose-600 underline-offset-4 transition-all">
                         Delete my account and data
                     </button>
                 </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

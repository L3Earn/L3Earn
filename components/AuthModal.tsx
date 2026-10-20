
import React, { useState } from 'react';
import { X, Mail, Lock, ArrowRight, Loader2, Github, Chrome } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onLogin(email);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 animate-scale-up overflow-hidden">
        <button 
             onClick={onClose}
             className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-20"
        >
             <X size={20} />
        </button>

        <div className="p-8">
            <div className="text-center mb-8">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200 text-white">
                    <Lock size={24} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
                <p className="text-slate-500 mt-2 text-sm">
                    {isSignUp ? 'Join the L2Earn evolution today.' : 'Enter your details to access your workspace.'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email</label>
                    <div className="relative">
                        <Mail size={18} className="absolute left-3 top-3 text-slate-400" />
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@company.com"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex justify-between">
                        Password
                        {!isSignUp && <a href="#" className="text-indigo-600 hover:underline capitalize font-medium">Forgot?</a>}
                    </label>
                    <div className="relative">
                        <Lock size={18} className="absolute left-3 top-3 text-slate-400" />
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                            required
                        />
                    </div>
                </div>

                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center mt-6 disabled:opacity-70"
                >
                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : (
                        <>
                            {isSignUp ? 'Create Account' : 'Sign In'}
                            <ArrowRight size={18} className="ml-2" />
                        </>
                    )}
                </button>
            </form>

            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold">Or continue with</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium text-slate-600">
                    <Chrome size={18} className="mr-2" /> Google
                </button>
                <button className="flex items-center justify-center py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium text-slate-600">
                    <Github size={18} className="mr-2" /> GitHub
                </button>
            </div>

            <p className="text-center mt-8 text-sm text-slate-500">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"} {' '}
                <button onClick={() => setIsSignUp(!isSignUp)} className="text-indigo-600 font-bold hover:underline">
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
            </p>
        </div>
      </div>
    </div>
  );
};

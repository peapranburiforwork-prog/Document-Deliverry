
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, LogIn, Loader2, AlertCircle, UserCircle, Briefcase, Lock, Send } from 'lucide-react';
import { User, UserRole } from '../types';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

const ADMIN_SECRET = '510262F';

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'user' | 'admin'>('user');
  
  // User form states
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('sender');
  const [department, setDepartment] = useState('');
  const [secretCode, setSecretCode] = useState('');

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        const user = event.data.user;
        onLogin(user);
        setIsLoading(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLogin]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/google/url');
      const { url } = await response.json();
      const authWindow = window.open(url, 'google_auth_popup', 'width=600,height=700');
      if (!authWindow) {
        setError('กรุณาอนุญาตให้เปิดหน้าต่างป๊อปอัพ');
        setIsLoading(false);
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      setIsLoading(false);
    }
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (role === 'admin' && secretCode !== ADMIN_SECRET) {
      setError('รหัสลับไม่ถูกต้อง');
      return;
    }

    onLogin({
      id: `user-${Date.now()}`,
      name,
      role,
      department: department || (role === 'sender' ? 'ธุรการ' : 'บริหาร'),
      email: '' // Manual users don't have email
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="cute-blob bg-pink-200 w-96 h-96 -top-20 -left-20 rounded-full animate-float" />
      <div className="cute-blob bg-purple-200 w-80 h-80 bottom-0 -right-20 rounded-full animate-float" style={{ animationDelay: '1.5s' }} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass-card p-10 rounded-[3rem] shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex p-5 bg-gradient-to-br from-pink-100 to-pink-200 rounded-[2rem] mb-6 text-brand-500 shadow-inner animate-bounce-soft">
            <ShieldCheck size={56} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">DocDelivery</h1>
          <div className="flex justify-center gap-4 mt-6">
            <button 
              onClick={() => setMode('user')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${mode === 'user' ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-400'}`}
            >
              เข้าใช้งานทั่วไป
            </button>
            <button 
              onClick={() => setMode('admin')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${mode === 'admin' ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-400'}`}
            >
              แอดมิน (Admin)
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'user' ? (
            <motion.form 
              key="user-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleManualLogin} 
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-700 ml-2 uppercase tracking-widest">ชื่อ-นามสกุล</label>
                <div className="relative">
                  <UserCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-300" size={20} />
                  <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field pl-12 py-3 font-bold"
                    placeholder="ระบุชื่อของคุณ"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-700 ml-2 uppercase tracking-widest">แผนก/หน่วยงาน</label>
                <div className="relative">
                  <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-300" size={20} />
                  <input 
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="input-field pl-12 py-3 font-bold"
                    placeholder="เช่น บัญชี, การเงิน"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-black text-slate-700 ml-2 uppercase tracking-widest">สิทธิการใช้งาน</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('sender')}
                    className={`p-3 rounded-2xl border-2 font-black text-xs transition-all ${role === 'sender' ? 'bg-brand-500 border-brand-500 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}
                  >
                    ผู้ส่งเอกสาร
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('receiver')}
                    className={`p-3 rounded-2xl border-2 font-black text-xs transition-all ${role === 'receiver' ? 'bg-brand-500 border-brand-500 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}
                  >
                    ผู้รับเอกสาร
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full py-4 rounded-[2rem] flex items-center justify-center gap-2">
                <Send size={20} />
                เข้าสู่ระบบ
              </button>
            </motion.form>
          ) : (
            <motion.div 
              key="admin-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <p className="text-center text-sm text-slate-500 px-4">
                แอดมินกรุณาเข้าสู่ระบบด้วย Google เพื่อเชื่อมต่อฐานข้อมูล
              </p>
              <button 
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="btn-primary w-full py-5 text-lg rounded-[2rem] flex items-center justify-center gap-3"
              >
                {isLoading ? <Loader2 size={24} className="animate-spin" /> : <LogIn size={24} />}
                {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'Login with Google'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold"
          >
            <AlertCircle size={20} />
            {error}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default AuthScreen;

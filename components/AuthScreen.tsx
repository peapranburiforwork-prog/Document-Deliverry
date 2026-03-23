
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserRole } from '../types';
import { UserCircle, ShieldCheck, Send, LogIn, Lock, AlertCircle } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

const ADMIN_SECRET = '510262F';

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('sender');
  const [secretCode, setSecretCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (role === 'admin' && secretCode !== ADMIN_SECRET) {
      setError('รหัสลับไม่ถูกต้อง สำหรับสิทธิแอดมิน');
      return;
    }
    
    onLogin({
      id: `user-${Date.now()}`,
      name,
      role,
      department: role === 'sender' ? 'ธุรการ' : role === 'receiver' ? 'บริหาร' : 'ไอที/ผู้ดูแลระบบ',
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-pink-50 relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="cute-blob bg-pink-200 w-96 h-96 -top-20 -left-20 rounded-full animate-float" />
      <div className="cute-blob bg-purple-200 w-80 h-80 bottom-0 -right-20 rounded-full animate-float" style={{ animationDelay: '1.5s' }} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass-card p-10 rounded-[3rem] shadow-2xl relative z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex p-5 bg-gradient-to-br from-pink-100 to-pink-200 rounded-[2rem] mb-6 text-brand-500 shadow-inner animate-bounce-soft">
            <ShieldCheck size={56} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Hi Welcome to DocDelivery</h1>
          <p className="text-slate-500 font-medium">✨ Happy Sending ✨</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label className="block text-sm font-black text-slate-700 ml-2 uppercase tracking-widest">ชื่อ-นามสกุล</label>
            <div className="relative">
              <UserCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-300" size={24} />
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field pl-14 py-4 text-lg font-bold placeholder:text-slate-300"
                placeholder="ระบุชื่อของคุณ"
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-black text-slate-700 ml-2 uppercase tracking-widest">เลือกสิทธิการใช้งาน</label>
            <div className="grid grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setRole('sender')}
                className={`flex flex-col items-center gap-3 p-4 rounded-[2rem] border-4 transition-all duration-300 ${
                  role === 'sender' 
                    ? 'border-brand-400 bg-brand-50 text-brand-600 scale-105 shadow-lg' 
                    : 'border-pink-50 bg-white text-slate-400 hover:border-pink-100'
                }`}
              >
                <div className={`p-2 rounded-xl ${role === 'sender' ? 'bg-brand-100' : 'bg-slate-50'}`}>
                  <Send size={24} />
                </div>
                <span className="font-black text-[11px] uppercase tracking-tighter">ผู้ส่ง</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('receiver')}
                className={`flex flex-col items-center gap-3 p-4 rounded-[2rem] border-4 transition-all duration-300 ${
                  role === 'receiver' 
                    ? 'border-brand-400 bg-brand-50 text-brand-600 scale-105 shadow-lg' 
                    : 'border-pink-50 bg-white text-slate-400 hover:border-pink-100'
                }`}
              >
                <div className={`p-2 rounded-xl ${role === 'receiver' ? 'bg-brand-100' : 'bg-slate-50'}`}>
                  <LogIn size={24} />
                </div>
                <span className="font-black text-[11px] uppercase tracking-tighter">ผู้รับ</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex flex-col items-center gap-3 p-4 rounded-[2rem] border-4 transition-all duration-300 ${
                  role === 'admin' 
                    ? 'border-brand-400 bg-brand-50 text-brand-600 scale-105 shadow-lg' 
                    : 'border-pink-50 bg-white text-slate-400 hover:border-pink-100'
                }`}
              >
                <div className={`p-2 rounded-xl ${role === 'admin' ? 'bg-brand-100' : 'bg-slate-50'}`}>
                  <ShieldCheck size={24} />
                </div>
                <span className="font-black text-[11px] uppercase tracking-tighter">แอดมิน</span>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {role === 'admin' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="pt-2"
              >
                <label className="block text-sm font-black text-slate-700 ml-2 mb-2 uppercase tracking-widest">รหัสลับแอดมิน 🔒</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-300" size={24} />
                  <input 
                    type="password" 
                    value={secretCode}
                    onChange={(e) => {
                      setSecretCode(e.target.value);
                      setError('');
                    }}
                    className="input-field pl-14 py-4 text-lg font-bold"
                    placeholder="กรอกรหัสลับตรงนี้"
                    required
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 text-red-500 text-sm font-bold bg-red-50 p-4 rounded-2xl border-2 border-red-100"
            >
              <AlertCircle size={20} />
              {error}
            </motion.div>
          )}

          <button type="submit" className="btn-primary w-full py-5 text-xl rounded-full shadow-brand-200">
            เริ่มต้นความสดใส ✨
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AuthScreen;

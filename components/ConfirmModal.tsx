
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  type = 'info'
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm glass-card p-8 rounded-[2.5rem] shadow-2xl text-center"
          >
            <div className={`inline-flex p-4 rounded-2xl mb-6 ${type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-brand-100 text-brand-600'}`}>
              <AlertCircle size={32} />
            </div>
            
            <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>
            <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
              {message}
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={onConfirm}
                className={`w-full py-4 rounded-2xl font-black text-sm transition-all shadow-lg ${
                  type === 'danger' 
                    ? 'bg-red-500 text-white shadow-red-500/20 hover:bg-red-600' 
                    : 'bg-brand-500 text-white shadow-brand-500/20 hover:bg-brand-600'
                }`}
              >
                {confirmText}
              </button>
              <button 
                onClick={onCancel}
                className="w-full py-4 rounded-2xl font-black text-sm text-slate-400 hover:bg-slate-50 transition-all"
              >
                {cancelText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;

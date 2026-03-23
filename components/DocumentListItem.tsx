
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Document, DocumentStatus } from '../types';
import StatusBadge from './StatusBadge';
import { CheckCircle, Clock, User, Calendar, DollarSign, ShieldCheck, AlertCircle, MessageSquare, History, Send, Trash2, Edit2, X, Save } from 'lucide-react';

interface DocumentListItemProps {
  document: Document;
  onConfirmReceipt: (id: string, receiverName: string) => void;
  onAddMessage: (id: string, message: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Document>) => void;
  userRole: 'sender' | 'receiver' | 'admin';
}

const DocumentListItem: React.FC<DocumentListItemProps> = ({ document, onConfirmReceipt, onAddMessage, onDelete, onUpdate, userRole }) => {
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    item: document.item,
    payee: document.payee,
    amount: document.amount
  });

  const isActionableForReceiver = userRole === 'receiver' && document.status === DocumentStatus.PendingReceipt;

  const handleConfirm = () => {
    if (inputCode === document.verificationCode) {
      onConfirmReceipt(document.id, 'ผู้รับมอบปัจจุบัน');
      setIsConfirming(false);
      setError('');
    } else {
      setError('รหัสยืนยันไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
    }
  };

  const handleAddMessage = () => {
    if (newMessage.trim()) {
      onAddMessage(document.id, newMessage.trim());
      setNewMessage('');
    }
  };

  const handleUpdate = () => {
    onUpdate(document.id, editData);
    setIsEditing(false);
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('th-TH', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative bg-white border-2 border-cute-pink/10 rounded-[2.5rem] p-8 transition-all hover:shadow-2xl hover:shadow-cute-pink/10 hover:border-cute-pink/30"
    >
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div className="flex-grow space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-cute-lavender bg-cute-lavender/10 px-4 py-1.5 rounded-full uppercase tracking-widest">
              {document.documentNumber}
            </span>
            <StatusBadge status={document.status} />
          </div>
          
          <div>
            {isEditing ? (
              <div className="space-y-4 mt-2 p-4 bg-cute-pink/5 rounded-3xl border-2 border-cute-pink/10">
                <input 
                  type="text" 
                  value={editData.item}
                  onChange={(e) => setEditData({...editData, item: e.target.value})}
                  className="w-full px-4 py-3 bg-white border-2 border-cute-pink/20 rounded-2xl text-base font-bold focus:border-cute-pink focus:ring-0 transition-all"
                  placeholder="ชื่อรายการ"
                />
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    value={editData.payee}
                    onChange={(e) => setEditData({...editData, payee: e.target.value})}
                    className="flex-grow px-4 py-3 bg-white border-2 border-cute-pink/20 rounded-2xl text-sm focus:border-cute-pink focus:ring-0 transition-all"
                    placeholder="ผู้รับเงิน"
                  />
                  <input 
                    type="number" 
                    value={editData.amount}
                    onChange={(e) => setEditData({...editData, amount: Number(e.target.value)})}
                    className="w-32 px-4 py-3 bg-white border-2 border-cute-pink/20 rounded-2xl text-sm font-bold text-cute-pink focus:border-cute-pink focus:ring-0 transition-all"
                    placeholder="จำนวนเงิน"
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={handleUpdate}
                    className="flex items-center gap-2 px-6 py-2.5 bg-cute-mint text-emerald-700 text-sm font-black rounded-xl hover:scale-105 transition-transform"
                  >
                    <Save size={16} /> บันทึก
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 text-slate-600 text-sm font-black rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    <X size={16} /> ยกเลิก
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-black text-slate-900 mb-2 leading-tight">{document.item}</h3>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500 font-medium">
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full">
                    <User size={16} className="text-cute-lavender" />
                    {document.payee}
                  </div>
                  <div className="flex items-center gap-2 text-cute-pink font-black text-lg">
                    <DollarSign size={18} />
                    {formatCurrency(document.amount)}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {userRole === 'sender' && document.status === DocumentStatus.PendingReceipt && (
          <div className="flex-shrink-0 flex flex-col items-end justify-center">
            <div className="bg-cute-yellow/10 border-2 border-cute-yellow/30 p-4 rounded-[2rem] text-center shadow-inner">
              <p className="text-[10px] font-black text-cute-yellow-dark uppercase tracking-widest mb-1">รหัสยืนยัน (Trust Code)</p>
              <p className="text-3xl font-black text-cute-yellow-dark tracking-[0.2em]">{document.verificationCode}</p>
            </div>
          </div>
        )}
      </div>

      <div className="my-8 h-px bg-gradient-to-r from-transparent via-cute-pink/20 to-transparent"></div>

      {/* Timeline Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="flex items-start gap-4 p-4 bg-cute-mint/5 rounded-3xl border border-cute-mint/10">
          <div className="mt-1 p-2 bg-cute-mint/20 rounded-full text-emerald-600">
            <CheckCircle size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-cute-mint-dark uppercase tracking-widest mb-0.5">ผู้นำส่ง</p>
            <p className="text-base font-bold text-slate-700">{document.sender}</p>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
              <Calendar size={12} />
              {formatDateTime(document.submittedAt)}
            </div>
          </div>
        </div>

        {document.status === DocumentStatus.Received ? (
          <div className="flex items-start gap-4 p-4 bg-cute-sky/5 rounded-3xl border border-cute-sky/10">
            <div className="mt-1 p-2 bg-cute-sky/20 rounded-full text-blue-600">
              <CheckCircle size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black text-cute-sky-dark uppercase tracking-widest mb-0.5">ผู้รับมอบ</p>
              <p className="text-base font-bold text-slate-700">{document.receivedBy}</p>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                <Calendar size={12} />
                {formatDateTime(document.receivedAt!)}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4 p-4 bg-cute-yellow/5 rounded-3xl border border-cute-yellow/10">
            <div className="mt-1 p-2 bg-cute-yellow/20 rounded-full text-amber-600">
              <Clock size={18} className="animate-spin-slow" />
            </div>
            <div>
              <p className="text-[10px] font-black text-cute-yellow-dark uppercase tracking-widest mb-0.5">สถานะ</p>
              <p className="text-base font-bold text-amber-600">รอการรับมอบเอกสาร...</p>
            </div>
          </div>
        )}
      </div>

      {/* History & Messages Toggle */}
      <div className="mt-8 pt-6 border-t-2 border-cute-pink/5 flex items-center justify-between">
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-3 text-xs font-black text-slate-400 hover:text-cute-pink transition-colors uppercase tracking-widest group/btn"
        >
          <div className="p-2 rounded-full bg-slate-50 group-hover/btn:bg-cute-pink/10 transition-colors">
            <History size={16} />
          </div>
          {showHistory ? 'ซ่อนทามไลน์' : 'ดูทามไลน์และข้อความ'}
          <span className="bg-cute-pink/10 text-cute-pink px-3 py-1 rounded-full text-[10px]">
            {document.history.length}
          </span>
        </button>

        {userRole === 'admin' && !isEditing && (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsEditing(true)}
              className="p-3 text-slate-400 hover:text-cute-sky hover:bg-cute-sky/10 rounded-2xl transition-all"
              title="แก้ไขข้อมูล"
            >
              <Edit2 size={20} />
            </button>
            <button 
              onClick={() => onDelete(document.id)}
              className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
              title="ลบเอกสาร"
            >
              <Trash2 size={20} />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-6 space-y-4 pl-6 border-l-4 border-cute-pink/10">
              {document.history.map((entry, idx) => (
                <div key={idx} className="relative pb-6 last:pb-0">
                  <div className="absolute -left-[28px] top-1 w-4 h-4 rounded-full bg-white border-4 border-cute-pink"></div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-cute-pink uppercase tracking-widest">{entry.action}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{formatDateTime(entry.timestamp)}</p>
                    </div>
                    <p className="text-sm font-bold text-slate-700">{entry.user}</p>
                    {entry.message && (
                      <p className="text-sm text-slate-500 bg-cute-pink/5 p-3 rounded-2xl mt-1 italic border border-cute-pink/10">
                        "{entry.message}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Message Input */}
            <div className="mt-8 flex gap-3">
              <div className="relative flex-grow">
                <MessageSquare size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-cute-pink/40" />
                <input 
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMessage()}
                  placeholder="บันทึกข้อความเพิ่มเติม..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-medium focus:bg-white focus:border-cute-pink/20 focus:ring-0 transition-all"
                />
              </div>
              <button 
                onClick={handleAddMessage}
                disabled={!newMessage.trim()}
                className="p-3 bg-cute-pink text-white rounded-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cute-pink/20"
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isActionableForReceiver && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-8 pt-8 border-t-2 border-cute-pink/5 overflow-hidden"
          >
            {!isConfirming ? (
              <button 
                onClick={() => setIsConfirming(true)}
                className="btn-primary w-full py-4 text-lg rounded-full shadow-brand-200"
              >
                <ShieldCheck size={24} />
                ดำเนินการรับมอบเอกสาร ✨
              </button>
            ) : (
              <div className="space-y-6 bg-cute-pink/5 p-6 rounded-[2rem] border-2 border-cute-pink/10">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-black text-slate-900 flex items-center gap-3">
                    <div className="p-2 bg-cute-pink/20 rounded-full text-cute-pink">
                      <ShieldCheck size={20} />
                    </div>
                    ยืนยันด้วยรหัส Trust Code
                  </h4>
                  <button onClick={() => setIsConfirming(false)} className="text-xs font-black text-slate-400 hover:text-cute-pink uppercase tracking-widest">ยกเลิก</button>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-grow">
                    <input 
                      type="text"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      placeholder="รหัส 4 หลัก"
                      className="w-full px-4 py-4 bg-white border-2 border-cute-pink/20 rounded-2xl text-center text-3xl font-black tracking-[0.5em] focus:border-cute-pink focus:ring-0 transition-all"
                      maxLength={4}
                    />
                  </div>
                  <button 
                    onClick={handleConfirm}
                    className="btn-primary px-10 rounded-2xl"
                  >
                    ยืนยัน ✨
                  </button>
                </div>
                
                {error && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm font-bold text-red-500 flex items-center gap-2 bg-red-50 p-3 rounded-xl border border-red-100"
                  >
                    <AlertCircle size={16} />
                    {error}
                  </motion.p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DocumentListItem;

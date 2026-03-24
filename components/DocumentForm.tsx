
import React, { useState, FormEvent } from 'react';
import { Document, User } from '../types';
import { Send, X, FileText, User as UserIcon, Hash, Landmark, Banknote, MessageSquare } from 'lucide-react';

interface DocumentFormProps {
  onSubmit: (doc: Omit<Document, 'id' | 'submittedAt' | 'status' | 'verificationCode' | 'senderId'> & { initialMessage?: string }) => void;
  onCancel: () => void;
  currentUser: User | null;
}

const DocumentForm: React.FC<DocumentFormProps> = ({ onSubmit, onCancel, currentUser }) => {
  const [documentNumber, setDocumentNumber] = useState('');
  const [item, setItem] = useState('');
  const [payee, setPayee] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [message, setMessage] = useState('');
  const [senderName, setSenderName] = useState(currentUser?.name || '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!documentNumber || !item || !payee || amount === '' || (!currentUser && !senderName)) {
      return;
    }

    onSubmit({
      sender: currentUser ? currentUser.name : senderName,
      documentNumber,
      item,
      payee,
      amount,
      initialMessage: message.trim() || undefined
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100"
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-slate-900">นำส่งเอกสาร</h2>
        <button 
          type="button" 
          onClick={onCancel}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="space-y-6">
        <div className="relative">
          <label htmlFor="documentNumber" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">เลขที่เอกสาร</label>
          <div className="relative">
            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input
              type="text" id="documentNumber" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)}
              className="input-field pl-12"
              placeholder="เช่น PV-202405-001" required
            />
          </div>
        </div>

        <div className="relative">
          <label htmlFor="item" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">รายการ / รายละเอียด</label>
          <div className="relative">
            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input
              type="text" id="item" value={item} onChange={(e) => setItem(e.target.value)}
              className="input-field pl-12"
              placeholder="เช่น ค่าทำความสะอาดประจำเดือน" required
            />
          </div>
        </div>

        <div className="relative">
          <label htmlFor="payee" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">ชื่อผู้รับเงิน / บริษัท</label>
          <div className="relative">
            <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input
              type="text" id="payee" value={payee} onChange={(e) => setPayee(e.target.value)}
              className="input-field pl-12"
              placeholder="ระบุชื่อผู้รับเงิน" required
            />
          </div>
        </div>

        <div className="relative">
          <label htmlFor="amount" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">จำนวนเงิน (บาท)</label>
          <div className="relative">
            <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input
              type="number" id="amount" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || '')}
              className="input-field pl-12"
              placeholder="0.00" required
            />
          </div>
        </div>

        <div className="relative">
          <label htmlFor="message" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">หมายเหตุ / ข้อความเพิ่มเติม (ถ้ามี)</label>
          <div className="relative">
            <MessageSquare className="absolute left-4 top-4 text-slate-300" size={18} />
            <textarea
              id="message" value={message} onChange={(e) => setMessage(e.target.value)}
              className="input-field pl-12 pt-3 h-24 resize-none"
              placeholder="ระบุข้อความเพิ่มเติมที่ต้องการบันทึก..."
            />
          </div>
        </div>

        {!currentUser && (
          <div className="relative">
            <label htmlFor="senderName" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">ชื่อผู้นำส่ง</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="text" id="senderName" value={senderName} onChange={(e) => setSenderName(e.target.value)}
                className="input-field pl-12"
                placeholder="ระบุชื่อของคุณ" required
              />
            </div>
          </div>
        )}

        {currentUser && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ผู้นำส่ง (Current User)</p>
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <UserIcon size={16} className="text-brand-500" />
              {currentUser.name}
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-8">
        <button type="submit" className="btn-primary w-full py-4 rounded-2xl">
          <Send size={20} />
          ยืนยันการนำส่ง
        </button>
      </div>
    </form>
  );
};

export default DocumentForm;

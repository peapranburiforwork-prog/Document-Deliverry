
import React, { useState, FormEvent } from 'react';
import { Document } from '../types';
import { SendIcon } from './icons';

interface DocumentFormProps {
  onSubmit: (doc: Omit<Document, 'id' | 'submittedAt' | 'status'>) => void;
  onCancel: () => void;
}

const DocumentForm: React.FC<DocumentFormProps> = ({ onSubmit, onCancel }) => {
  const [sender, setSender] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [item, setItem] = useState('');
  const [payee, setPayee] = useState('');
  const [amount, setAmount] = useState<number | ''>('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!sender || !documentNumber || !item || !payee || amount === '') {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    onSubmit({
      sender,
      documentNumber,
      item,
      payee,
      amount,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-xl shadow-md"
    >
      <h2 className="text-2xl font-bold mb-6 text-slate-800">บันทึกการนำส่งเอกสาร</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="documentNumber" className="block text-sm font-medium text-slate-600 mb-1">เลขที่เอกสาร</label>
          <input
            type="text" id="documentNumber" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="เช่น PV-202405-001" required
          />
        </div>
         <div>
          <label htmlFor="item" className="block text-sm font-medium text-slate-600 mb-1">รายการ</label>
          <input
            type="text" id="item" value={item} onChange={(e) => setItem(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="เช่น ค่าทำความสะอาดประจำเดือน" required
          />
        </div>
         <div>
          <label htmlFor="payee" className="block text-sm font-medium text-slate-600 mb-1">ชื่อผู้รับจ้าง/บริษัท</label>
          <input
            type="text" id="payee" value={payee} onChange={(e) => setPayee(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="ระบุชื่อผู้รับเงิน" required
          />
        </div>
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-slate-600 mb-1">จำนวนเงิน</label>
          <input
            type="number" id="amount" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || '')}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="0.00" required
          />
        </div>
        <div>
          <label htmlFor="sender" className="block text-sm font-medium text-slate-600 mb-1">ชื่อผู้นำส่ง (ผสน.)</label>
          <input
            type="text" id="sender" value={sender} onChange={(e) => setSender(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="ระบุชื่อของคุณ" required
          />
        </div>
      </div>
      
      <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
         <button type="button" onClick={onCancel} className="w-full flex items-center justify-center gap-2 bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-lg hover:bg-slate-300 transition">
          ยกเลิก
        </button>
        <button type="submit" className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform duration-150 ease-in-out active:scale-95">
          <SendIcon className="h-5 w-5" />
          บันทึกและนำส่งเอกสาร
        </button>
      </div>
    </form>
  );
};

export default DocumentForm;

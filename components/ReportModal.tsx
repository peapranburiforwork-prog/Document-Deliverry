
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Document } from '../types';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Database,
  ShieldCheck
} from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: Document[];
  isAdminConfigured: boolean;
  hasSheet: boolean;
  onAdminConfigured: () => void;
  onUpdateDocuments: (newDocs: Document[]) => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ 
  isOpen, 
  onClose, 
  documents, 
  isAdminConfigured, 
  hasSheet,
  onAdminConfigured,
  onUpdateDocuments
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && hasSheet) {
      // We don't have the sheetId directly anymore, but we can fetch the status
      // or just assume the server knows it.
      // For the URL, we can fetch it once or just use a generic link if we know the ID.
      // Let's fetch the admin status again to get the sheetId if needed, 
      // or just let the sync handle it.
      const fetchStatus = async () => {
        try {
          const response = await fetch('/api/admin/status');
          const data = await response.json();
          // We should probably return the sheetId in the status if we want to show the link
        } catch (e) {}
      };
      fetchStatus();
    }
  }, [isOpen, hasSheet]);

  const handleConnect = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      const { url } = await response.json();
      
      const authWindow = window.open(url, 'google_auth_popup', 'width=600,height=700');
      
      if (!authWindow) {
        alert('Please allow popups for this site to connect your Google account.');
        return;
      }

      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
          onAdminConfigured();
          window.removeEventListener('message', handleMessage);
        }
      };
      window.addEventListener('message', handleMessage);
    } catch (err) {
      setError('Failed to get auth URL');
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      const response = await fetch('/api/sheets/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents })
      });

      if (!response.ok) throw new Error('Failed to sync to Google Sheets');

      const data = await response.json();
      setSheetUrl(data.url);
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับ Google Sheets');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLoad = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/sheets/load');
      if (!response.ok) throw new Error('Failed to load from Google Sheets');
      
      const data = await response.json();
      onUpdateDocuments(data.documents);
      onClose();
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลจาก Google Sheets ได้');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCSV = () => {
    const headers = ['ID', 'Document Number', 'Item', 'Payee', 'Amount', 'Sender', 'Submitted At', 'Status', 'Received By', 'Received At', 'Verification Code', 'Timeline/Messages'];
    const rows = documents.map(doc => [
      doc.id,
      doc.documentNumber,
      doc.item,
      doc.payee,
      doc.amount,
      doc.sender,
      doc.submittedAt.toISOString(),
      doc.status,
      doc.receivedBy || '-',
      doc.receivedAt?.toISOString() || '-',
      doc.verificationCode,
      (doc.history || []).map(h => 
        `[${new Date(h.timestamp).toISOString()}] ${h.user}: ${h.action}${h.message ? ` - ${h.message}` : ''}`
      ).join(' | ')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val}"`).join(','))
    ].join('\n');

    // Add UTF-8 BOM for Thai language support in Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = window.document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `DocDelivery_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg glass-card p-8 rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-brand-100 rounded-2xl text-brand-600">
                  <Database size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">รายงานสรุปผล</h2>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Data Export & Sync</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">จำนวนเอกสารทั้งหมด</p>
                  <p className="text-2xl font-black text-slate-900">{documents.length}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ยอดเงินรวม</p>
                  <p className="text-2xl font-black text-brand-600">
                    {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(
                      documents.reduce((sum, doc) => sum + doc.amount, 0)
                    )}
                  </p>
                </div>
              </div>

              <div className="p-6 bg-brand-50/50 rounded-3xl border border-brand-100 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <FileSpreadsheet className="text-brand-600" size={20} />
                  <h3 className="font-bold text-slate-900">Google Sheets Integration</h3>
                </div>
                
                <p className="text-sm text-slate-600 leading-relaxed">
                  เชื่อมต่อกับ Google Drive เพื่อจัดเก็บข้อมูลไทม์ไลน์และข้อความต่างๆ ลงใน Google Sheets โดยอัตโนมัติ (ข้อมูลจะถูกเก็บไว้ในบัญชีของผู้ที่ทำการซิงค์)
                </p>

                {sheetUrl || hasSheet ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 p-3 rounded-xl">
                      <CheckCircle size={18} />
                      เชื่อมต่อกับ Google Sheets แล้ว
                    </div>
                    {sheetUrl && (
                      <a 
                        href={sheetUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-primary w-full py-3 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                      >
                        <ExternalLink size={18} />
                        เปิด Google Sheets
                      </a>
                    )}
                    <button 
                      onClick={handleLoad}
                      disabled={isLoading}
                      className="w-full py-3 px-4 bg-white border-2 border-emerald-100 text-emerald-600 font-bold rounded-xl hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Database size={18} />
                      )}
                      ดึงข้อมูลจาก Google Sheets
                    </button>
                    <button 
                      onClick={handleSync}
                      disabled={isSyncing}
                      className="w-full py-3 text-slate-400 text-xs font-bold hover:text-slate-600 transition-all"
                    >
                      {isSyncing ? 'กำลังอัปเดต...' : 'อัปเดตข้อมูลเดี๋ยวนี้'}
                    </button>
                  </div>
                ) : !isAdminConfigured ? (
                  <button 
                    onClick={handleConnect}
                    className="btn-primary w-full py-4"
                  >
                    <ShieldCheck size={20} />
                    เชื่อมต่อ Google Account (Admin)
                  </button>
                ) : (
                  <button 
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="btn-primary w-full py-4 disabled:opacity-50"
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        กำลังซิงค์ข้อมูล...
                      </>
                    ) : (
                      <>
                        <Download size={20} />
                        ส่งข้อมูลไปยัง Google Sheets
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={downloadCSV}
                  className="flex-grow flex items-center justify-center gap-2 py-3 px-4 bg-white border-2 border-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all"
                >
                  <Download size={18} />
                  ดาวน์โหลด CSV
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-500 font-bold text-xs bg-red-50 p-3 rounded-xl">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                DocDelivery Data Management System
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReportModal;

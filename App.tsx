
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Document, DocumentStatus, User } from './types';
import DocumentForm from './components/DocumentForm';
import DocumentList from './components/DocumentList';
import SummaryCard from './components/SummaryCard';
import AuthScreen from './components/AuthScreen';
import ReportModal from './components/ReportModal';
import { 
  PlusCircle, 
  Clock, 
  CheckCircle, 
  Archive, 
  LogOut, 
  ShieldCheck,
  FileText,
  TrendingUp,
  Database,
  LayoutGrid,
  FileSpreadsheet
} from 'lucide-react';

const App: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'all'>('tasks');
  const [showReport, setShowReport] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAdminConfigured, setIsAdminConfigured] = useState(false);
  const [hasSheet, setHasSheet] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 1. Check server session (Google Auth)
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const user = await response.json();
          setCurrentUser(user);
          setIsAuthLoading(false);
          return;
        }
        
        // 2. Check localStorage (Manual Auth)
        const savedUser = localStorage.getItem('docdelivery_user');
        if (savedUser) {
          setCurrentUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Auth check failed');
      } finally {
        setIsAuthLoading(false);
      }
    };

    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/admin/status');
        const data = await response.json();
        setIsAdminConfigured(data.isConfigured);
        setHasSheet(data.hasSheet);
      } catch (error) {}
    };

    checkAuth();
    checkAdminStatus();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (!user.email) {
      localStorage.setItem('docdelivery_user', JSON.stringify(user));
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('docdelivery_user');
      setCurrentUser(null);
      setShowForm(false);
      setActiveTab('tasks');
    } catch (error) {
      console.error('Logout failed');
    }
  };

  // Expose updateDocuments to window for ReportModal to use
  useEffect(() => {
    (window as any).updateDocuments = (newDocs: Document[]) => {
      // Convert date strings back to Date objects if needed
      const processedDocs = newDocs.map(doc => ({
        ...doc,
        submittedAt: new Date(doc.submittedAt),
        receivedAt: doc.receivedAt ? new Date(doc.receivedAt) : undefined,
        history: doc.history.map(h => ({
          ...h,
          timestamp: new Date(h.timestamp)
        }))
      }));
      setDocuments(processedDocs);
    };
    return () => { delete (window as any).updateDocuments; };
  }, []);

  useEffect(() => {
    // Load from localStorage if available
    const savedDocs = localStorage.getItem('docdelivery_docs');
    if (savedDocs) {
      try {
        const parsed = JSON.parse(savedDocs);
        const processed = parsed.map((doc: any) => ({
          ...doc,
          submittedAt: new Date(doc.submittedAt),
          receivedAt: doc.receivedAt ? new Date(doc.receivedAt) : undefined,
          history: doc.history.map((h: any) => ({
            ...h,
            timestamp: new Date(h.timestamp)
          }))
        }));
        setDocuments(processed);
        return;
      } catch (e) {
        console.error('Failed to parse saved docs');
      }
    }

    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);
    const twoDaysAgo = new Date(Date.now() - 86400000 * 2);

    const initialDocuments: Document[] = [
      { 
        id: 'doc-1', 
        documentNumber: 'PV-202405-001', 
        item: 'ค่าทำความสะอาดเดือน พ.ค.', 
        payee: 'บริษัท คลีน จำกัด', 
        amount: 5000, 
        sender: 'สมชาย ใจดี', 
        senderId: 'user-1',
        submittedAt: twoDaysAgo, 
        status: DocumentStatus.Received, 
        receivedBy: 'สมศรี รักสะอาด', 
        receivedById: 'user-2',
        receivedAt: yesterday,
        verificationCode: '1234',
        history: [
          { timestamp: twoDaysAgo, user: 'สมชาย ใจดี', action: 'สร้างเอกสาร', message: 'เริ่มนำส่งเอกสาร' },
          { timestamp: yesterday, user: 'สมศรี รักสะอาด', action: 'รับมอบเอกสาร', message: 'ตรวจสอบความถูกต้องแล้ว' }
        ]
      },
      { 
        id: 'doc-2', 
        documentNumber: 'PV-202405-002', 
        item: 'ค่าเช่า Server', 
        payee: 'คลาวด์ คอมพิวติ้ง', 
        amount: 12500, 
        sender: 'สมชาย ใจดี', 
        senderId: 'user-1',
        submittedAt: yesterday, 
        status: DocumentStatus.PendingReceipt,
        verificationCode: '5678',
        history: [
          { timestamp: yesterday, user: 'สมชาย ใจดี', action: 'สร้างเอกสาร', message: 'เริ่มนำส่งเอกสาร' }
        ]
      },
      { 
        id: 'doc-3', 
        documentNumber: 'PV-202405-003', 
        item: 'ค่าน้ำประปาประจำเดือน', 
        payee: 'การประปาฯ', 
        amount: 850, 
        sender: 'วิชัย มั่นคง', 
        senderId: 'user-3',
        submittedAt: today, 
        status: DocumentStatus.PendingReceipt,
        verificationCode: '9999',
        history: [
          { timestamp: today, user: 'วิชัย มั่นคง', action: 'สร้างเอกสาร', message: 'เริ่มนำส่งเอกสาร' }
        ]
      },
    ].sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
    setDocuments(initialDocuments);
  }, []);

  // Save to localStorage whenever documents change
  useEffect(() => {
    if (documents.length > 0) {
      localStorage.setItem('docdelivery_docs', JSON.stringify(documents));
    }
  }, [documents]);

  // Auto-sync to Google Sheets whenever documents change
  useEffect(() => {
    if (isAdminConfigured && documents.length > 0) {
      const sync = async () => {
        try {
          const response = await fetch('/api/sheets/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documents })
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setHasSheet(true);
            }
          }
        } catch (error) {
          console.error('Auto-sync failed');
        }
      };
      
      const timeout = setTimeout(sync, 3000);
      return () => clearTimeout(timeout);
    }
  }, [documents, isAdminConfigured]);

  const addDocument = (doc: Omit<Document, 'id' | 'submittedAt' | 'status' | 'verificationCode' | 'senderId' | 'history'> & { initialMessage?: string }) => {
    if (!currentUser) return;
    
    const { initialMessage, ...docData } = doc;
    const now = new Date();
    const newDoc: Document = { 
      ...docData, 
      id: `doc-${Date.now()}`, 
      submittedAt: now, 
      status: DocumentStatus.PendingReceipt,
      senderId: currentUser.id,
      verificationCode: Math.floor(1000 + Math.random() * 9000).toString(), // Generate 4-digit code
      history: [
        { 
          timestamp: now, 
          user: currentUser.name, 
          action: 'สร้างเอกสาร', 
          message: initialMessage || 'เริ่มนำส่งเอกสาร' 
        }
      ]
    };
    setDocuments(prevDocs => [newDoc, ...prevDocs]);
    setShowForm(false);
  };

  const confirmReceipt = (id: string, receiverName: string) => {
    if (!currentUser) return;
    const now = new Date();
    setDocuments(prevDocs => 
      prevDocs.map(doc => 
        doc.id === id 
          ? { 
              ...doc, 
              status: DocumentStatus.Received, 
              receivedBy: receiverName, 
              receivedById: currentUser.id,
              receivedAt: now,
              history: [
                ...doc.history,
                { timestamp: now, user: receiverName, action: 'รับมอบเอกสาร', message: 'ยืนยันการรับมอบเอกสารเรียบร้อย' }
              ]
            } 
          : doc
      )
    );
  };

  const deleteDocument = (id: string) => {
    if (currentUser?.role !== 'admin') return;
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบเอกสารนี้?')) {
      setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== id));
    }
  };

  const updateDocument = (id: string, updates: Partial<Document>) => {
    if (currentUser?.role !== 'admin') return;
    const now = new Date();
    setDocuments(prevDocs => 
      prevDocs.map(doc => 
        doc.id === id 
          ? { 
              ...doc, 
              ...updates,
              history: [
                ...doc.history,
                { timestamp: now, user: currentUser.name, action: 'แก้ไขข้อมูล', message: 'ผู้ดูแลระบบแก้ไขข้อมูลเอกสาร' }
              ]
            } 
          : doc
      )
    );
  };

  const addHistoryMessage = (id: string, message: string) => {
    if (!currentUser) return;
    const now = new Date();
    setDocuments(prevDocs => 
      prevDocs.map(doc => 
        doc.id === id 
          ? { 
              ...doc, 
              history: [
                ...doc.history,
                { timestamp: now, user: currentUser.name, action: 'บันทึกข้อความ', message }
              ]
            } 
          : doc
      )
    );
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <div className="animate-bounce-soft text-brand-500">
          <ShieldCheck size={64} />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  const isToday = (someDate: Date) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
      someDate.getMonth() === today.getMonth() &&
      someDate.getFullYear() === today.getFullYear();
  };
  
  const docsSentToday = documents.filter(doc => isToday(doc.submittedAt));
  const docsPendingReceipt = documents.filter(doc => doc.status === DocumentStatus.PendingReceipt);
  const docsReceived = documents.filter(doc => doc.status === DocumentStatus.Received);
  
  const documentsToDisplay = activeTab === 'all'
    ? documents
    : (currentUser.role === 'sender' 
        ? documents.filter(d => d.senderId === currentUser.id)
        : docsPendingReceipt);

  return (
    <div className="min-h-screen bg-pink-50 text-slate-900 pb-20 relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="cute-blob bg-pink-300 w-96 h-96 -top-20 -left-20 rounded-full animate-float" />
      <div className="cute-blob bg-purple-300 w-80 h-80 top-1/2 -right-20 rounded-full animate-float" style={{ animationDelay: '1s' }} />
      <div className="cute-blob bg-yellow-200 w-64 h-64 bottom-20 left-1/4 rounded-full animate-float" style={{ animationDelay: '2s' }} />

      <header className="bg-white/70 backdrop-blur-lg sticky top-0 z-50 border-b border-pink-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-brand-400 to-brand-600 rounded-[1.5rem] text-white shadow-lg shadow-brand-200 animate-bounce-soft">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">DocDelivery</h1>
                <p className="text-[10px] uppercase tracking-widest font-black text-brand-500 mt-1">✨ Happy Sending ✨</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-sm font-black text-slate-900">{currentUser.name}</p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                    {currentUser.role === 'sender' ? 'ผู้นำส่ง (Sender)' : 
                     currentUser.role === 'receiver' ? 'ผู้รับมอบ (Receiver)' : 
                     'ผู้ดูแลระบบ (Admin)'}
                  </p>
                </div>
              </div>
              <button 
                onClick={logout}
                className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all bg-white/50 border border-slate-100 shadow-sm"
                title="ออกจากระบบ"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-5xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <SummaryCard title="ส่งแล้ววันนี้" count={docsSentToday.length} icon={<TrendingUp />} color="blue" />
            <SummaryCard title="ค้างรับ (Pending)" count={docsPendingReceipt.length} icon={<Clock />} color="yellow" />
            <SummaryCard title="รับแล้ว (Received)" count={docsReceived.length} icon={<CheckCircle />} color="green" />
          </div>

          {/* Tab Switcher & Report Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex p-1.5 bg-slate-100 rounded-2xl w-full sm:w-fit">
              <button 
                onClick={() => setActiveTab('tasks')}
                className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                  activeTab === 'tasks' 
                    ? 'bg-white text-brand-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <LayoutGrid size={18} />
                {currentUser.role === 'admin' ? 'แดชบอร์ดแอดมิน' : (currentUser.role === 'sender' ? 'รายการที่ฉันส่ง' : 'รายการรอรับมอบ')}
              </button>
              <button 
                onClick={() => setActiveTab('all')}
                className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                  activeTab === 'all' 
                    ? 'bg-white text-brand-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Database size={18} />
                สถานะเอกสารทั้งหมด
              </button>
            </div>

            <button 
              onClick={() => setShowReport(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-50 text-brand-600 font-black rounded-2xl hover:bg-brand-100 transition-all w-full sm:w-fit"
            >
              <FileSpreadsheet size={20} />
              รายงานสรุปผล
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Action Section */}
            <div className="lg:col-span-4 space-y-6">
              {currentUser.role === 'sender' && (
                <div className="sticky top-24">
                  <AnimatePresence mode="wait">
                    {showForm ? (
                      <motion.div
                        key="form"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                      >
                        <DocumentForm 
                          onSubmit={addDocument} 
                          onCancel={() => setShowForm(false)} 
                          currentUser={currentUser}
                        />
                      </motion.div>
                    ) : (
                      <motion.button 
                        key="btn"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => setShowForm(true)} 
                        className="btn-primary w-full py-6 text-lg rounded-[2rem]"
                      >
                        <PlusCircle size={24} />
                        บันทึกการนำส่งใหม่
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              )}
              
              <div className="glass-card p-6 rounded-[2rem] hidden lg:block">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText size={18} className="text-brand-500" />
                  คำแนะนำการใช้งาน
                </h3>
                <ul className="text-sm text-slate-500 space-y-3">
                  <li className="flex gap-2">
                    <span className="text-brand-500 font-bold">•</span>
                    ผู้ส่งต้องระบุข้อมูลให้ครบถ้วนและแจ้งรหัสยืนยันแก่ผู้รับ
                  </li>
                  <li className="flex gap-2">
                    <span className="text-brand-500 font-bold">•</span>
                    ผู้รับต้องตรวจสอบเอกสารและกรอกรหัสยืนยันเพื่อรับมอบ
                  </li>
                  <li className="flex gap-2">
                    <span className="text-brand-500 font-bold">•</span>
                    ระบบจะบันทึกเวลาและผู้ดำเนินการเพื่อความโปร่งใส
                  </li>
                </ul>
              </div>
            </div>

            {/* List Section */}
            <div className="lg:col-span-8">
              <div className="glass-card p-6 sm:p-8 rounded-[2rem]">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-xl text-slate-600">
                      {activeTab === 'tasks' ? <Archive size={20} /> : <Database size={20} />}
                    </div>
                    <h2 className="text-2xl font-black text-slate-900">
                      {activeTab === 'tasks' 
                        ? (currentUser.role === 'sender' ? 'ประวัติการส่ง' : 'รายการรอรับมอบ')
                        : 'ฐานข้อมูลสถานะเอกสาร'}
                    </h2>
                  </div>
                  <span className="px-4 py-1.5 bg-slate-100 text-slate-500 text-xs font-bold rounded-full">
                    {documentsToDisplay.length} รายการ
                  </span>
                </div>
                
                <DocumentList 
                  documents={documentsToDisplay} 
                  onConfirmReceipt={confirmReceipt} 
                  onAddMessage={addHistoryMessage}
                  onDelete={deleteDocument}
                  onUpdate={updateDocument}
                  userRole={currentUser.role} 
                />
              </div>
            </div>
          </div>
        </motion.div>
      </main>
      
      <footer className="text-center py-10 text-xs font-bold text-slate-400 uppercase tracking-widest">
        <p>&copy; {new Date().getFullYear()} DocDelivery Secure System</p>
      </footer>

      <ReportModal 
        isOpen={showReport} 
        onClose={() => setShowReport(false)} 
        documents={documents} 
        isAdminConfigured={isAdminConfigured}
        hasSheet={hasSheet}
        onAdminConfigured={() => setIsAdminConfigured(true)}
        onUpdateDocuments={(newDocs) => setDocuments(newDocs)}
      />
    </div>
  );
};

export default App;

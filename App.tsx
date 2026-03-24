
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Document, DocumentStatus, User } from './types';
import DocumentForm from './components/DocumentForm';
import DocumentList from './components/DocumentList';
import SummaryCard from './components/SummaryCard';
import ReportModal from './components/ReportModal';
import ConfirmModal from './components/ConfirmModal';
import { db } from './firebase';
import { collection, onSnapshot, query, orderBy, addDoc } from 'firebase/firestore';
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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    // Auth checks removed for public access
    setIsAuthLoading(false);

    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/admin/status');
        const data = await response.json();
        setIsAdminConfigured(data.isConfigured);
        setHasSheet(data.hasSheet);
      } catch (error) {}
    };

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
    const q = query(collection(db, 'documents'), orderBy('submittedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: Document[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          submittedAt: data.submittedAt.toDate(),
          receivedAt: data.receivedAt ? data.receivedAt.toDate() : undefined,
          history: data.history.map((h: any) => ({
            ...h,
            timestamp: h.timestamp.toDate()
          }))
        } as Document;
      });
      setDocuments(docs);
    });

    return () => unsubscribe();
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

  const addDocument = async (doc: Omit<Document, 'id' | 'submittedAt' | 'status' | 'verificationCode' | 'senderId' | 'history'> & { initialMessage?: string }) => {
    const { initialMessage, ...docData } = doc;
    const now = new Date();
    const newDoc = { 
      ...docData, 
      submittedAt: now, 
      status: DocumentStatus.PendingReceipt,
      senderId: currentUser?.id || 'anonymous',
      verificationCode: Math.floor(1000 + Math.random() * 9000).toString(),
      history: [
        { 
          timestamp: now, 
          user: currentUser?.name || 'พนักงานทั่วไป', 
          action: 'สร้างเอกสาร', 
          message: initialMessage || 'เริ่มนำส่งเอกสาร' 
        }
      ]
    };
    
    try {
      await addDoc(collection(db, 'documents'), newDoc);
      setShowForm(false);
    } catch (error) {
      console.error('Error adding document:', error);
    }
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
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== deleteConfirmId));
      setDeleteConfirmId(null);
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

  // Removed: const [showAdminLogin, setShowAdminLogin] = useState(false);

  // ... (keep other states)

  // Removed: if (isAuthLoading) { ... }

  // Removed: if (!currentUser) { return <AuthScreen ... /> }

  const isToday = (someDate: Date) => {
    // ... (keep isToday)
  };
  
  const docsSentToday = documents.filter(doc => isToday(doc.submittedAt));
  const docsPendingReceipt = documents.filter(doc => doc.status === DocumentStatus.PendingReceipt);
  const docsReceived = documents.filter(doc => doc.status === DocumentStatus.Received);
  
  const documentsToDisplay = activeTab === 'all'
    ? documents
    : (currentUser?.role === 'sender' 
        ? documents.filter(d => d.senderId === currentUser?.id)
        : docsPendingReceipt);

  // Removed: if (showAdminLogin) { return <AuthScreen ... /> }

  return (
    <div className="min-h-screen bg-pink-50 text-slate-900 pb-20 relative overflow-hidden">
      {/* ... (keep decorative blobs) */}

      <header className="bg-white/70 backdrop-blur-lg sticky top-0 z-50 border-b border-pink-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* ... (keep logo) */}
            
            <div className="flex items-center gap-4">
              {currentUser ? (
                <>
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
                </>
              ) : null}
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
                {currentUser?.role === 'admin' ? 'แดชบอร์ดแอดมิน' : (currentUser?.role === 'sender' ? 'รายการที่ฉันส่ง' : 'รายการรอรับมอบ')}
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
                        ? (currentUser?.role === 'sender' ? 'ประวัติการส่ง' : 'รายการรอรับมอบ')
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
                  userRole={currentUser?.role || 'sender'} 
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

      <ConfirmModal 
        isOpen={!!deleteConfirmId}
        title="ยืนยันการลบข้อมูล"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบเอกสารนี้? ข้อมูลที่ลบแล้วจะไม่สามารถกู้คืนได้"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
        confirmText="ลบข้อมูล"
        cancelText="ยกเลิก"
        type="danger"
      />
    </div>
  );
};

export default App;

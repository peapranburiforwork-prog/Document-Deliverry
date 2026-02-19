
import React, { useState, useEffect } from 'react';
import { Document, DocumentStatus } from './types';
import DocumentForm from './components/DocumentForm';
import DocumentList from './components/DocumentList';
import SummaryCard from './components/SummaryCard';
import { LogoIcon, PlusCircleIcon, ClockIcon, CheckCircleIcon, ArchiveIcon } from './components/icons';

type UserRole = 'sender' | 'approver';

const App: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [userRole, setUserRole] = useState<UserRole>('sender');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);
    const twoDaysAgo = new Date(Date.now() - 86400000 * 2);

    const initialDocuments: Document[] = [
      { id: 'doc-1', documentNumber: 'PV-202405-001', item: 'ค่าทำความสะอาดเดือน พ.ค.', payee: 'บริษัท คลีน จำกัด', amount: 5000, sender: 'ฝ่ายธุรการ', submittedAt: twoDaysAgo, status: DocumentStatus.Received, receivedBy: 'สมศรี รักสะอาด', receivedAt: yesterday },
      { id: 'doc-2', documentNumber: 'PV-202405-002', item: 'ค่าเช่า Server', payee: 'คลาวด์ คอมพิวติ้ง', amount: 12500, sender: 'ฝ่าย IT', submittedAt: yesterday, status: DocumentStatus.PendingReceipt },
      { id: 'doc-3', documentNumber: 'PV-202405-003', item: 'ค่าโฆษณา Facebook', payee: 'Meta Inc.', amount: 8200, sender: 'ฝ่ายการตลาด', submittedAt: new Date(Date.now() - 3600000), status: DocumentStatus.PendingReceipt },
      { id: 'doc-4', documentNumber: 'PV-202405-004', item: 'ค่าจัดเลี้ยง', payee: 'ร้านอร่อยโภชนา', amount: 3500, sender: 'ฝ่ายบุคคล', submittedAt: new Date(), status: DocumentStatus.PendingReceipt },
    ].sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
    setDocuments(initialDocuments);
  }, []);

  const addDocument = (doc: Omit<Document, 'id' | 'submittedAt' | 'status'>) => {
    const newDoc: Document = { ...doc, id: `doc-${Date.now()}`, submittedAt: new Date(), status: DocumentStatus.PendingReceipt };
    setDocuments(prevDocs => [newDoc, ...prevDocs]);
    setShowForm(false);
  };

  const confirmReceipt = (id: string, receiverName: string) => {
    setDocuments(prevDocs => 
      prevDocs.map(doc => 
        doc.id === id 
          ? { ...doc, status: DocumentStatus.Received, receivedBy: receiverName, receivedAt: new Date() } 
          : doc
      )
    );
  };
  
  const RoleSwitcher = () => (
    <div className="flex bg-slate-200 rounded-full p-1 text-sm font-semibold">
        <button onClick={() => setUserRole('sender')} className={`px-4 py-1.5 rounded-full transition-colors ${userRole === 'sender' ? 'bg-white text-blue-600 shadow' : 'text-slate-600'}`}>Sender (ผสน.)</button>
        <button onClick={() => setUserRole('approver')} className={`px-4 py-1.5 rounded-full transition-colors ${userRole === 'approver' ? 'bg-white text-blue-600 shadow' : 'text-slate-600'}`}>Receiver (ผบร.)</button>
    </div>
  );

  const isToday = (someDate: Date) => {
    const today = new Date()
    return someDate.getDate() == today.getDate() &&
      someDate.getMonth() == today.getMonth() &&
      someDate.getFullYear() == today.getFullYear()
  }
  
  const docsSentToday = documents.filter(doc => isToday(doc.submittedAt));
  const docsPendingReceipt = documents.filter(doc => doc.status === DocumentStatus.PendingReceipt);
  const docsReceived = documents.filter(doc => doc.status === DocumentStatus.Received);
  
  const documentsToDisplay = userRole === 'sender' ? documents : docsPendingReceipt;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3"><LogoIcon className="h-9 w-9 text-blue-600" /><div><h1 className="text-lg font-bold text-slate-800">Document Delivery</h1><p className="text-xs text-slate-500">ระบบติดตามการนำส่งเอกสาร</p></div></div>
                <div className="hidden sm:block"><RoleSwitcher /></div>
            </div>
            <div className="sm:hidden mt-3 flex justify-center"><RoleSwitcher /></div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SummaryCard title="ส่งแล้ววันนี้" count={docsSentToday.length} icon={<PlusCircleIcon />} color="blue" />
                <SummaryCard title="ค้างรับ (Pending)" count={docsPendingReceipt.length} icon={<ClockIcon />} color="yellow" />
                <SummaryCard title="รับแล้ว (Received)" count={docsReceived.length} icon={<CheckCircleIcon />} color="green" />
            </div>

            {userRole === 'sender' && (
                <div className="space-y-6">
                    {showForm 
                        ? <DocumentForm onSubmit={addDocument} onCancel={() => setShowForm(false)} />
                        : <button onClick={() => setShowForm(true)} className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white font-bold py-4 px-4 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform duration-150 ease-in-out active:scale-95 shadow-lg"><PlusCircleIcon className="h-6 w-6" />[ + บันทึกการนำส่งเอกสารใหม่ ]</button>
                    }
                </div>
            )}
            
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
                <div className="flex items-center gap-3 mb-4"><ArchiveIcon className="h-6 w-6 text-blue-600" /><h2 className="text-xl font-bold">{userRole === 'sender' ? 'ประวัติการส่งทั้งหมด' : 'รายการเอกสารที่รอรับ'}</h2></div>
                <DocumentList documents={documentsToDisplay} onConfirmReceipt={confirmReceipt} userRole={userRole} />
            </div>
        </div>
      </main>
      
      <footer className="text-center py-6 mt-8 text-sm text-slate-500"><p>&copy; {new Date().getFullYear()} Document Delivery System. All rights reserved.</p></footer>
    </div>
  );
};

export default App;

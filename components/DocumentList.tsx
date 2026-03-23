
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Document } from '../types';
import DocumentListItem from './DocumentListItem';
import { Inbox } from 'lucide-react';

interface DocumentListProps {
  documents: Document[];
  onConfirmReceipt: (id: string, receiverName: string) => void;
  onAddMessage: (id: string, message: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Document>) => void;
  userRole: 'sender' | 'receiver' | 'admin';
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, onConfirmReceipt, onAddMessage, onDelete, onUpdate, userRole }) => {
  if (documents.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-20"
      >
        <div className="inline-flex p-8 bg-pink-50 rounded-[3rem] text-pink-200 mb-6 animate-bounce-soft">
          <Inbox size={80} />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2">ไม่พบรายการเอกสารนะ</h3>
        <p className="text-sm text-slate-400 max-w-[250px] mx-auto font-medium">
          {userRole === 'sender' 
            ? 'คุณยังไม่มีประวัติการส่งเอกสารเลย มาเริ่มส่งเอกสารใบแรกกันเถอะ! ✨' 
            : 'ขณะนี้ยังไม่มีเอกสารที่รอการรับมอบจากคุณเลยนะ'}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence mode="popLayout">
        {documents.map(doc => (
          <DocumentListItem 
            key={doc.id} 
            document={doc} 
            onConfirmReceipt={onConfirmReceipt} 
            onAddMessage={onAddMessage}
            onDelete={onDelete}
            onUpdate={onUpdate}
            userRole={userRole} 
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default DocumentList;

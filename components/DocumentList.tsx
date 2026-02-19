
import React from 'react';
import { Document, DocumentStatus } from '../types';
import DocumentListItem from './DocumentListItem';
import { InboxIcon } from './icons';

interface DocumentListProps {
  documents: Document[];
  onConfirmReceipt: (id: string, receiverName: string) => void;
  userRole: 'sender' | 'approver';
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, onConfirmReceipt, userRole }) => {
  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <InboxIcon className="mx-auto h-16 w-16 text-slate-300" />
        <p className="mt-4 text-slate-500">ไม่พบเอกสาร</p>
        <p className="text-sm text-slate-400">เมื่อมีเอกสารใหม่จะแสดงที่นี่</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map(doc => (
        <DocumentListItem key={doc.id} document={doc} onConfirmReceipt={onConfirmReceipt} userRole={userRole} />
      ))}
    </div>
  );
};

export default DocumentList;

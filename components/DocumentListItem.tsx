
import React, { useState } from 'react';
import { Document, DocumentStatus } from '../types';
import StatusBadge from './StatusBadge';
import { CheckCircleIcon, ClockIcon } from './icons';

interface DocumentListItemProps {
  document: Document;
  onConfirmReceipt: (id: string, receiverName: string) => void;
  userRole: 'sender' | 'approver';
}

// Mock receiver names for the dropdown
const MOCK_RECEIVERS = ['สมหญิง ยอดนักรับ', 'สมชาย ใจดี', 'สมศรี รักสะอาด'];

const DocumentListItem: React.FC<DocumentListItemProps> = ({ document, onConfirmReceipt, userRole }) => {
  const [selectedReceiver, setSelectedReceiver] = useState(MOCK_RECEIVERS[0]);
  const isActionableForReceiver = userRole === 'approver' && document.status === DocumentStatus.PendingReceipt;

  const handleConfirm = () => {
    if (selectedReceiver) {
      onConfirmReceipt(document.id, selectedReceiver);
    } else {
      alert('กรุณาเลือกชื่อผู้รับ');
    }
  };
  
  const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
  }

  const formatDateTime = (date: Date) => {
      return date.toLocaleString('th-TH', {
          dateStyle: 'short',
          timeStyle: 'short'
      });
  }

  return (
    <div className="border border-slate-200 rounded-lg p-4 transition-shadow hover:shadow-md bg-white">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
            <div className="flex-grow">
                <p className="text-sm text-slate-500">{document.documentNumber}</p>
                <h3 className="font-semibold text-slate-800 break-words">{document.item}</h3>
                <p className="text-sm text-slate-600">ถึง: {document.payee} - <span className="font-bold">{formatCurrency(document.amount)}</span></p>
            </div>
            <div className="flex-shrink-0 mt-2 sm:mt-0">
                <StatusBadge status={document.status} />
            </div>
        </div>

        <div className="border-t border-slate-200 my-3"></div>

        {/* Timeline */}
        <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-slate-700">
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                <span><span className="font-semibold">{document.sender}</span> ส่งเอกสาร ({formatDateTime(document.submittedAt)})</span>
            </div>
            {document.status === DocumentStatus.Received && document.receivedBy && document.receivedAt ? (
                 <div className="flex items-center gap-2 text-slate-700">
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    <span><span className="font-semibold">{document.receivedBy}</span> รับมอบแล้ว ({formatDateTime(document.receivedAt)})</span>
                </div>
            ) : (
                <div className="flex items-center gap-2 text-yellow-600">
                    <ClockIcon className="h-5 w-5 animate-pulse" />
                    <span>รอ ผบร. รับมอบ...</span>
                </div>
            )}
        </div>

        {isActionableForReceiver && (
            <div className="mt-4 pt-4 border-t border-slate-200 bg-slate-50 p-3 rounded-lg">
                <label htmlFor={`receiver-${document.id}`} className="block text-sm font-medium text-slate-700 mb-2">ชื่อ-สกุล ผู้รับ (ผบร.):</label>
                <div className="flex flex-col sm:flex-row gap-3">
                    <select
                        id={`receiver-${document.id}`}
                        value={selectedReceiver}
                        onChange={(e) => setSelectedReceiver(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                    >
                        {MOCK_RECEIVERS.map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
                    <button
                        onClick={handleConfirm}
                        className="flex-shrink-0 w-full sm:w-auto flex items-center gap-2 justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                    >
                        <CheckCircleIcon className="h-5 w-5" />
                        กดยืนยันการรับเอกสาร
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

export default DocumentListItem;

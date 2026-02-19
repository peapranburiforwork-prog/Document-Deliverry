
import React from 'react';
import { DocumentStatus } from '../types';

interface StatusBadgeProps {
  status: DocumentStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case DocumentStatus.PendingReceipt:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'; // Yellow
      case DocumentStatus.Received:
        return 'bg-green-100 text-green-800 border-green-300'; // Green
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getStatusDotColor = () => {
    switch (status) {
        case DocumentStatus.PendingReceipt:
            return 'bg-yellow-500 animate-pulse'; // Yellow
        case DocumentStatus.Received:
            return 'bg-green-500'; // Green
        default:
            return 'bg-slate-500';
    }
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor()}`}>
       <span className={`h-2 w-2 rounded-full ${getStatusDotColor()}`}></span>
      {status}
    </div>
  );
};

export default StatusBadge;

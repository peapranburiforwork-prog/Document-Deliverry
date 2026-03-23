
import React from 'react';
import { DocumentStatus } from '../types';
import { Clock, CheckCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: DocumentStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case DocumentStatus.PendingReceipt:
        return {
          container: 'bg-cute-yellow/20 text-amber-600 border-cute-yellow/30',
          icon: <Clock size={12} className="animate-spin-slow" />
        };
      case DocumentStatus.Received:
        return {
          container: 'bg-cute-mint/20 text-emerald-600 border-cute-mint/30',
          icon: <CheckCircle size={12} />
        };
      default:
        return {
          container: 'bg-slate-50 text-slate-600 border-slate-100',
          icon: null
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${styles.container}`}>
      {styles.icon}
      {status}
    </div>
  );
};

export default StatusBadge;


import React from 'react';

interface SummaryCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  color: 'blue' | 'yellow' | 'green';
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, count, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-md flex items-center gap-4">
      <div className={`p-3 rounded-full ${colorClasses[color]}`}>
        {React.cloneElement(icon as React.ReactElement, { className: "h-6 w-6" })}
      </div>
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{count}</p>
      </div>
    </div>
  );
};

export default SummaryCard;

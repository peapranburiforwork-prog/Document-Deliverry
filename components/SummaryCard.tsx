
import React from 'react';
import { motion } from 'framer-motion';

interface SummaryCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  color: 'blue' | 'yellow' | 'green';
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, count, icon, color }) => {
  const colorClasses = {
    blue: 'bg-cute-sky/20 text-blue-600 border-cute-sky/30',
    yellow: 'bg-cute-yellow/20 text-amber-600 border-cute-yellow/30',
    green: 'bg-cute-mint/20 text-emerald-600 border-cute-mint/30',
  };

  const iconBgClasses = {
    blue: 'bg-cute-sky/40',
    yellow: 'bg-cute-yellow/40',
    green: 'bg-cute-mint/40',
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`glass-card p-6 rounded-[2rem] flex items-center gap-5 border ${colorClasses[color]}`}
    >
      <div className={`p-4 rounded-2xl ${iconBgClasses[color]}`}>
        {React.cloneElement(icon as React.ReactElement, { size: 28 })}
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-widest opacity-70">{title}</p>
        <p className="text-3xl font-black">{count}</p>
      </div>
    </motion.div>
  );
};

export default SummaryCard;

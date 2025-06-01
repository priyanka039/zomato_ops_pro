import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const StatCard = ({ icon, title, value, change, color = 'bg-gradient-to-br from-zomato-400 to-zomato-600' }) => {
  const isPositiveChange = change && change.startsWith('+');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={clsx(
        'rounded-xl p-6 text-white shadow-lg',
        'transform transition-all duration-300 hover:scale-105',
        color
      )}
    >
      <div className="flex items-center justify-between">
        <div className="text-3xl">{icon}</div>
        {change && (
          <div className={clsx(
            'text-sm px-2 py-1 rounded-full',
            isPositiveChange ? 'bg-green-500/20' : 'bg-red-500/20'
          )}>
            <span className={clsx(
              isPositiveChange ? 'text-green-100' : 'text-red-100'
            )}>
              {change}
            </span>
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <h3 className="text-lg font-medium text-white/80">{title}</h3>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
    </motion.div>
  );
};

export default StatCard; 
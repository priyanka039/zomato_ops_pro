import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ icon, title, value, change, color = 'bg-gradient-to-br from-orange-400 to-red-500' }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`${color} rounded-xl p-6 text-white shadow-lg`}
    >
      <div className="flex items-center justify-between">
        <div className="text-2xl">{icon}</div>
        <div className="bg-white/20 rounded-full px-2 py-1 text-xs backdrop-blur-sm">
          {change}
        </div>
      </div>
      <h3 className="mt-4 text-lg font-medium text-white/90">{title}</h3>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </motion.div>
  );
};

export default StatCard; 
import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ icon, title, value, change, color = 'bg-gradient-to-br from-orange-400 to-red-500' }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`${color} rounded-xl p-4 text-white shadow-lg`}
    >
      <div className="flex items-center justify-between">
        <div className="text-2xl">{icon}</div>
        {change && (
          <div className="bg-white/20 px-2 py-1 rounded text-sm">
            {change}
          </div>
        )}
      </div>
      <h3 className="mt-2 text-lg font-medium text-white/90">{title}</h3>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </motion.div>
  );
};

export default StatCard; 
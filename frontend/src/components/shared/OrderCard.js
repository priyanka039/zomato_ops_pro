import React from 'react';
import { motion } from 'framer-motion';
import { ClockIcon, TruckIcon, CalendarIcon } from '@heroicons/react/outline';

const StatusBadge = ({ status }) => {
  const statusConfig = {
    PREP: { color: 'bg-yellow-100 text-yellow-800', text: 'Preparing' },
    PICKED: { color: 'bg-blue-100 text-blue-800', text: 'Picked Up' },
    ON_ROUTE: { color: 'bg-purple-100 text-purple-800', text: 'On Route' },
    DELIVERED: { color: 'bg-green-100 text-green-800', text: 'Delivered' }
  };

  const config = statusConfig[status] || statusConfig.PREP;

  return (
    <span className={`${config.color} px-3 py-1 rounded-full text-sm font-medium`}>
      {config.text}
    </span>
  );
};

const OrderCard = ({ order, onAssignRider }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border-l-4 border-orange-400"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-lg font-bold text-gray-800">
            Order #{order._id.slice(-6)}
          </h4>
          <p className="text-gray-600">{order.items}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div className="flex items-center space-x-2">
          <ClockIcon className="w-4 h-4 text-blue-500" />
          <span>Prep: {order.prepTime}min</span>
        </div>
        <div className="flex items-center space-x-2">
          <TruckIcon className="w-4 h-4 text-green-500" />
          <span>{order.deliveryPartner?.name || 'Unassigned'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-4 h-4 text-purple-500" />
          <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
        </div>
      </div>
      
      {!order.deliveryPartner && onAssignRider && (
        <button
          onClick={() => onAssignRider(order)}
          className="w-full mt-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 rounded-lg font-medium hover:shadow-md transition-all"
        >
          Assign Delivery Partner
        </button>
      )}
    </motion.div>
  );
};

export default OrderCard; 
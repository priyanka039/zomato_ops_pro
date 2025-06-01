import React from 'react';
import { motion } from 'framer-motion';
import { ClockIcon, TruckIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const StatusBadge = ({ status }) => {
  const statusConfig = {
    PREP: { color: 'bg-yellow-500', text: 'Preparing' },
    PICKED: { color: 'bg-blue-500', text: 'Picked Up' },
    ON_ROUTE: { color: 'bg-purple-500', text: 'On Route' },
    DELIVERED: { color: 'bg-green-500', text: 'Delivered' }
  };

  const config = statusConfig[status] || { color: 'bg-gray-500', text: 'Unknown' };

  return (
    <span className={`${config.color} text-white text-sm px-3 py-1 rounded-full font-medium`}>
      {config.text}
    </span>
  );
};

const OrderCard = ({ order, onAssignRider }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border-l-4 border-zomato-500"
      id={`order-${order.id}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-lg font-bold text-gray-800">Order #{order.id}</h4>
          <p className="text-gray-600 mt-1">{order.items}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div className="flex items-center space-x-2 text-gray-600">
          <ClockIcon className="w-4 h-4 text-blue-500" />
          <span>Prep: {order.prepTime}min</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <TruckIcon className="w-4 h-4 text-green-500" />
          <span>{order.deliveryPartner || 'Unassigned'}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <CalendarIcon className="w-4 h-4 text-purple-500" />
          <span>{format(new Date(order.createdAt), 'HH:mm')}</span>
        </div>
      </div>
      
      {!order.deliveryPartner && onAssignRider && (
        <button
          onClick={() => onAssignRider(order.id)}
          className="w-full mt-4 bg-gradient-to-r from-zomato-500 to-zomato-600 text-white py-2 px-4 rounded-lg font-medium hover:shadow-md transition-shadow"
        >
          Assign Rider
        </button>
      )}
    </motion.div>
  );
};

export default OrderCard; 
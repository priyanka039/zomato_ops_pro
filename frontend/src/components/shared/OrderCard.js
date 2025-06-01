import React from 'react';
import { motion } from 'framer-motion';
import { ClockIcon, LocationMarkerIcon, UserIcon, PhoneIcon } from '@heroicons/react/outline';

const OrderCard = ({ order, onAssignRider, onUpdateStatus }) => {
  const statusColors = {
    'PREP': 'bg-yellow-100 text-yellow-800',
    'PICKED': 'bg-blue-100 text-blue-800',
    'ON_ROUTE': 'bg-purple-100 text-purple-800',
    'DELIVERED': 'bg-green-100 text-green-800'
  };

  const statusMessages = {
    'PREP': '👨‍🍳 Chef is preparing your delicious order',
    'PICKED': '📦 Order picked up by delivery hero',
    'ON_ROUTE': '🏃‍♂️ Your food is on its way!',
    'DELIVERED': '✨ Order delivered successfully'
  };

  const canAssignRider = order.status === 'PREP' && !order.deliveryPartnerId && onAssignRider;
  const canUpdateStatus = onUpdateStatus && order.status !== 'DELIVERED';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md overflow-hidden"
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Order #{order._id.slice(-6)}
            </h3>
            <p className="text-sm text-gray-500">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
            {order.status}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <ClockIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Order Items</p>
              <p className="text-sm text-gray-500">{order.items}</p>
              <p className="text-xs text-gray-400 mt-1">
                Prep Time: {order.prepTime} minutes
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <UserIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Customer Details</p>
              <p className="text-sm text-gray-500">{order.customerName}</p>
              {order.customerPhone && (
                <div className="flex items-center mt-1">
                  <PhoneIcon className="h-4 w-4 text-gray-400 mr-1" />
                  <p className="text-sm text-gray-500">{order.customerPhone}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <LocationMarkerIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Delivery Location</p>
              <p className="text-sm text-gray-500">{order.customerLocation.address}</p>
            </div>
          </div>

          {order.deliveryPartnerId && (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {order.deliveryPartnerName?.charAt(0) || 'D'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {order.deliveryPartnerName}
                  </p>
                  <p className="text-xs text-gray-500">Delivery Partner</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            {statusMessages[order.status]}
          </p>
          <div className="flex space-x-3">
            {canAssignRider && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onAssignRider(order)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all"
              >
                Assign Delivery Partner
              </motion.button>
            )}
            {canUpdateStatus && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const statusFlow = ['PREP', 'PICKED', 'ON_ROUTE', 'DELIVERED'];
                  const currentIndex = statusFlow.indexOf(order.status);
                  if (currentIndex < statusFlow.length - 1) {
                    onUpdateStatus(order._id, statusFlow[currentIndex + 1]);
                  }
                }}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all"
              >
                Update Status
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderCard; 
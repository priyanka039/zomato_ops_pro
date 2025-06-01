import React from 'react';
import { motion } from 'framer-motion';
import { CheckIcon } from '@heroicons/react/outline';

const steps = [
  { key: 'PREP', label: 'Preparing', icon: '👨‍🍳', message: 'Chef is working magic!' },
  { key: 'PICKED', label: 'Picked Up', icon: '📦', message: 'Got it! On my way!' },
  { key: 'ON_ROUTE', label: 'On Route', icon: '🏍️', message: 'Zooming through traffic!' },
  { key: 'DELIVERED', label: 'Delivered', icon: '✅', message: 'Mission accomplished! 🎉' }
];

const getCurrentStepIndex = (status) => {
  return steps.findIndex(step => step.key === status);
};

const getNextActionText = (status) => {
  switch (status) {
    case 'PREP':
      return 'Pick Up Order';
    case 'PICKED':
      return 'Start Delivery';
    case 'ON_ROUTE':
      return 'Mark as Delivered';
    default:
      return 'Update Status';
  }
};

const DeliveryProgressTracker = ({ currentStatus, orderId, onUpdateStatus }) => {
  const currentIndex = getCurrentStepIndex(currentStatus);

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <motion.div
          key={step.key}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`flex items-center space-x-4 ${
            currentIndex >= index ? 'opacity-100' : 'opacity-40'
          }`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg ${
            currentIndex >= index 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-200 text-gray-500'
          }`}>
            {step.icon}
          </div>
          <div className="flex-1">
            <p className="font-semibold">{step.label}</p>
            <p className="text-sm text-gray-600">{step.message}</p>
          </div>
          {currentIndex > index && (
            <CheckIcon className="w-6 h-6 text-green-500" />
          )}
        </motion.div>
      ))}
      
      {currentStatus !== 'DELIVERED' && onUpdateStatus && (
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            const nextStep = steps[currentIndex + 1];
            if (nextStep) {
              onUpdateStatus(orderId, nextStep.key);
            }
          }}
          className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
        >
          {getNextActionText(currentStatus)}
        </motion.button>
      )}
    </div>
  );
};

export default DeliveryProgressTracker; 
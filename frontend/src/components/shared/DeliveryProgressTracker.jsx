import React from 'react';
import { motion } from 'framer-motion';
import { CheckIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';

const DeliveryProgressTracker = ({ currentStatus, orderId, onUpdateStatus }) => {
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
      case 'PREP': return 'Mark as Picked Up';
      case 'PICKED': return 'Start Delivery';
      case 'ON_ROUTE': return 'Complete Delivery';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {steps.map((step, index) => {
        const currentIndex = getCurrentStepIndex(currentStatus);
        const isCompleted = currentIndex > index;
        const isCurrent = currentIndex === index;

        return (
          <motion.div
            key={step.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.2 }}
            className={clsx(
              'flex items-center space-x-4',
              (isCompleted || isCurrent) ? 'opacity-100' : 'opacity-40'
            )}
          >
            <div className={clsx(
              'w-12 h-12 rounded-full flex items-center justify-center text-lg transition-colors duration-300',
              isCompleted ? 'bg-green-500 text-white' : 
              isCurrent ? 'bg-zomato-500 text-white' : 
              'bg-gray-200 text-gray-500'
            )}>
              {isCompleted ? <CheckIcon className="w-6 h-6" /> : step.icon}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{step.label}</p>
                  <p className="text-sm text-gray-600">{step.message}</p>
                </div>
                {isCompleted && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-green-500"
                  >
                    <CheckIcon className="w-5 h-5" />
                  </motion.div>
                )}
              </div>

              {isCurrent && (
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  className="mt-3 h-1 bg-zomato-500/20 rounded-full overflow-hidden"
                >
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="h-full bg-zomato-500"
                  />
                </motion.div>
              )}
            </div>
          </motion.div>
        );
      })}

      {currentStatus !== 'DELIVERED' && onUpdateStatus && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onUpdateStatus(orderId, currentStatus)}
          className="w-full mt-6 bg-gradient-to-r from-zomato-500 to-zomato-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform transition-all"
        >
          {getNextActionText(currentStatus)}
        </motion.button>
      )}
    </div>
  );
};

export default DeliveryProgressTracker; 
import React from 'react';
import { motion } from 'framer-motion';
import { CheckIcon } from '@heroicons/react/outline';

const DeliveryProgressTracker = ({ currentStatus, onUpdateStatus }) => {
  const steps = [
    { key: 'PREP', label: 'Preparing', icon: '👨‍🍳', message: 'Chef is working magic!' },
    { key: 'PICKED', label: 'Picked Up', icon: '📦', message: 'Got the package!' },
    { key: 'ON_ROUTE', label: 'On Route', icon: '🏍️', message: 'Zooming through traffic!' },
    { key: 'DELIVERED', label: 'Delivered', icon: '✅', message: 'Mission accomplished!' }
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.key === currentStatus);
  };

  const getNextStatus = () => {
    const currentIndex = getCurrentStepIndex();
    return currentIndex < steps.length - 1 ? steps[currentIndex + 1].key : null;
  };

  const getNextActionText = () => {
    const nextStatus = getNextStatus();
    if (!nextStatus) return '';

    const actions = {
      'PICKED': 'Pick Up Order',
      'ON_ROUTE': 'Start Delivery',
      'DELIVERED': 'Complete Delivery'
    };
    return actions[nextStatus];
  };

  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const isCompleted = getCurrentStepIndex() > index;
        const isCurrent = getCurrentStepIndex() === index;
        const isUpcoming = getCurrentStepIndex() < index;

        return (
          <div key={step.key} className="flex items-center space-x-4">
            <motion.div
              initial={false}
              animate={{
                backgroundColor: isCompleted || isCurrent ? '#10B981' : '#E5E7EB',
                scale: isCurrent ? 1.1 : 1
              }}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-lg shadow-md ${
                isCompleted || isCurrent ? 'text-white' : 'text-gray-400'
              }`}
            >
              {isCompleted ? (
                <CheckIcon className="w-6 h-6" />
              ) : (
                <span className={isUpcoming ? 'opacity-50' : ''}>{step.icon}</span>
              )}
            </motion.div>
            
            <div className="flex-1">
              <motion.p
                initial={false}
                animate={{
                  color: isCompleted ? '#10B981' : isCurrent ? '#111827' : '#6B7280'
                }}
                className="font-semibold"
              >
                {step.label}
              </motion.p>
              <motion.p
                initial={false}
                animate={{
                  opacity: isUpcoming ? 0.5 : 1
                }}
                className="text-sm text-gray-600"
              >
                {step.message}
              </motion.p>
            </div>

            {isCurrent && getNextStatus() && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onUpdateStatus(getNextStatus())}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all"
              >
                {getNextActionText()}
              </motion.button>
            )}
          </div>
        );
      })}

      {currentStatus === 'DELIVERED' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 text-center"
        >
          <div className="text-4xl mb-2">🎉</div>
          <p className="text-green-600 font-medium">Delivery completed successfully!</p>
          <p className="text-sm text-gray-600">Great job! Ready for the next one?</p>
        </motion.div>
      )}
    </div>
  );
};

export default DeliveryProgressTracker; 
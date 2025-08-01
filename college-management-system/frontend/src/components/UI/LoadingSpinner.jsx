import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  className = '',
  text = '',
  fullScreen = false 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const colorClasses = {
    primary: 'border-primary-600',
    white: 'border-white',
    gray: 'border-gray-600',
    success: 'border-success-600',
    warning: 'border-warning-600',
    error: 'border-error-600',
  };

  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  };

  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { duration: 0.2 }
    },
  };

  const content = (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className={`flex flex-col items-center justify-center ${className}`}
    >
      <motion.div
        variants={spinnerVariants}
        animate="animate"
        className={`
          ${sizeClasses[size]} 
          ${colorClasses[color]} 
          border-2 border-t-transparent rounded-full
        `}
      />
      {text && (
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          {text}
        </p>
      )}
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;

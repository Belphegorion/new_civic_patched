import React from 'react';
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, XCircleIcon, DocumentIcon } from '@heroicons/react/24/outline';

const StatusBadge = ({ status, showIcon = true, size = 'md' }) => {
  const statusConfig = {
    Submitted: {
      bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
      text: 'text-white',
      icon: DocumentIcon,
      pulse: false
    },
    Acknowledged: {
      bg: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      text: 'text-white',
      icon: ExclamationTriangleIcon,
      pulse: true
    },
    'In Progress': {
      bg: 'bg-gradient-to-r from-indigo-500 to-purple-600',
      text: 'text-white',
      icon: ClockIcon,
      pulse: true
    },
    Resolved: {
      bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
      text: 'text-white',
      icon: CheckCircleIcon,
      pulse: false
    },
    Rejected: {
      bg: 'bg-gradient-to-r from-red-500 to-red-600',
      text: 'text-white',
      icon: XCircleIcon,
      pulse: false
    },
  };

  const config = statusConfig[status] || {
    bg: 'bg-gradient-to-r from-gray-400 to-gray-500',
    text: 'text-white',
    icon: DocumentIcon,
    pulse: false
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const IconComponent = config.icon;

  return (
    <span className={`
      inline-flex items-center gap-1.5 font-semibold rounded-full shadow-sm
      ${config.bg} ${config.text} ${sizeClasses[size]}
      ${config.pulse ? 'animate-pulse' : ''}
      transition-all duration-200 hover:scale-105 hover:shadow-md
    `}>
      {showIcon && <IconComponent className={iconSizes[size]} />}
      {status}
    </span>
  );
};

export default StatusBadge;
import React from 'react';

export const Badge = ({ variant = 'default', children, className = '' }) => {
  const variants = {
    // Project statuses
    Active: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    'In Progress': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    Completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    'On Hold': 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',

    // Task statuses
    'To Do': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',

    // Priorities
    Low: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    Medium: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    High: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    Urgent: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 font-semibold',

    // Roles
    Owner: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    Admin: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    Member: 'bg-gray-500/10 text-gray-600 dark:text-gray-300 border-gray-500/20',
    Viewer: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',

    default: 'bg-gray-100 dark:bg-dark-surface text-gray-700 dark:text-gray-300 border-gray-200 dark:border-dark-border',
  };

  const selectedVariant = variants[variant] || variants.default;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${selectedVariant} ${className}`}
    >
      {children}
    </span>
  );
};

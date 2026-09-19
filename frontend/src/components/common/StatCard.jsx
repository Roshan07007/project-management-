import React from 'react';

export const StatCard = ({ title, value, icon: Icon, color = 'blue', change = null }) => {
  const colorMap = {
    blue: 'text-primary-500 bg-primary-500/10 border-primary-500/20',
    purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    red: 'text-red-500 bg-red-500/10 border-red-500/20',
  };

  return (
    <div className="glass-card glass-card-hover p-6 rounded-2xl flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <h3 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mt-1.5 tracking-tight">
          {value}
        </h3>
        {change && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {change}
          </p>
        )}
      </div>

      {Icon && (
        <div className={`p-3.5 rounded-2xl border ${colorMap[color] || colorMap.blue}`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  );
};

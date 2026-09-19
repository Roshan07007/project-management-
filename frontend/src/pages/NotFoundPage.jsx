import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full glass-card p-8 rounded-3xl border border-gray-200 dark:border-dark-border shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-primary-500/10 text-primary-500 flex items-center justify-center mx-auto border border-primary-500/20">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            404
          </h1>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
            Page Not Found
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary-500/25 transition-all hover:scale-105"
          >
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

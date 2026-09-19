import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Toast = () => {
  const { toast, hideToast } = useAuth();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        hideToast();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, hideToast]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3.5 rounded-xl shadow-2xl border backdrop-blur-lg animate-in slide-in-from-top-3 duration-200 min-w-[300px] max-w-md bg-white/95 dark:bg-dark-card/95 border-gray-200 dark:border-dark-border text-gray-900 dark:text-gray-100">
      {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
      {isError && <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />}
      {!isSuccess && !isError && <Info className="w-5 h-5 text-primary-500 shrink-0" />}

      <p className="text-sm font-medium flex-1">{toast.message}</p>

      <button
        onClick={hideToast}
        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

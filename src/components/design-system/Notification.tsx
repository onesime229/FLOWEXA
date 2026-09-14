import React from 'react';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';
import { ToastMessage } from '../../types';

export interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

export const ToastItem: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 text-[#10D97F] shrink-0" />,
    info: <Info className="w-5 h-5 text-[#0BE9EF] shrink-0" />,
    warning: <AlertCircle className="w-5 h-5 text-[#FB8205] shrink-0" />,
    error: <XCircle className="w-5 h-5 text-rose-500 shrink-0" />,
  };

  const borderMap = {
    success: 'border-[#10D97F]/30',
    info: 'border-[#0BE9EF]/30',
    warning: 'border-[#FB8205]/30',
    error: 'border-rose-500/30',
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 bg-[#0A1428] border ${borderMap[toast.type]} rounded-xl shadow-2xl text-left w-full max-w-sm pointer-events-auto animate-in slide-in-from-top-2 duration-200`}
    >
      {iconMap[toast.type]}
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">{toast.title}</h4>
        <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/5 transition-colors cursor-pointer shrink-0"
        aria-label="Fermer la notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const NotificationContainer: React.FC<{
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-md w-full px-4 sm:px-0">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'border-cyan-500/50 bg-cyan-500/10' : 
                  type === 'error' ? 'border-red-500/50 bg-red-500/10' : 
                  'border-purple-500/50 bg-purple-500/10';
  
  const textColor = type === 'success' ? 'text-cyan-400' : 
                    type === 'error' ? 'text-red-400' : 
                    'text-purple-400';

  return (
    <div className={`fixed bottom-8 right-8 z-[100] glass px-6 py-4 rounded-2xl border ${bgColor} animate-toast shadow-2xl flex items-center gap-4 min-w-[300px]`}>
      <div className={`w-2 h-2 rounded-full animate-pulse ${type === 'success' ? 'bg-cyan-500' : type === 'error' ? 'bg-red-500' : 'bg-purple-500'}`}></div>
      <div className="flex-grow">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-0.5">System Notification</p>
        <p className={`text-xs font-futuristic font-bold ${textColor}`}>{message}</p>
      </div>
      <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    </div>
  );
};

export default Toast;
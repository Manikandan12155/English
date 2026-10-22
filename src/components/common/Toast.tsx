import React from 'react';
import { CheckCircle2, AlertCircle, Info, RotateCcw, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-slide-up ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-100 border-emerald-800'
              : toast.type === 'warning'
              ? 'bg-amber-950/90 text-amber-100 border-amber-800'
              : 'bg-slate-900/90 text-slate-100 border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : toast.type === 'warning' ? (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-indigo-400 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-medium">{toast.message}</span>
          </div>

          <div className="flex items-center gap-2">
            {toast.undoAction && (
              <button
                onClick={() => {
                  toast.undoAction?.();
                  removeToast(toast.id);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-bold transition uppercase tracking-wider"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Undo</span>
              </button>
            )}
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

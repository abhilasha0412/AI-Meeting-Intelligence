import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const typeConfig = {
    success: {
      icon: CheckCircle2,
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-950/90 text-emerald-100',
      iconColor: 'text-emerald-400'
    },
    error: {
      icon: AlertCircle,
      border: 'border-rose-500/30',
      bg: 'bg-rose-950/90 text-rose-100',
      iconColor: 'text-rose-400'
    },
    info: {
      icon: Info,
      border: 'border-brand-500/30',
      bg: 'bg-brand-950/90 text-brand-100',
      iconColor: 'text-brand-400'
    }
  };

  const config = typeConfig[type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-md ${config.bg} ${config.border}`}>
        <Icon className={`w-5 h-5 flex-shrink-0 ${config.iconColor}`} />
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

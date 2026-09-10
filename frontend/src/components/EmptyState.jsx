import React from 'react';
import { Sparkles, UploadCloud, Database } from 'lucide-react';

export default function EmptyState({ 
  title = "No meetings yet", 
  description = "Upload your first meeting recording and let AI turn it into useful insights.",
  onUploadClick,
  onSeedClick,
  isSeeding = false
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl bg-white/60 dark:bg-[#0B0F19]/60 border border-dashed border-slate-300 dark:border-slate-800 backdrop-blur-sm">
      <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600/20 via-brand-500/20 to-brand-purple/20 flex items-center justify-center mb-4 border border-brand-500/30 text-brand-500 dark:text-brand-400">
        <Sparkles className="w-8 h-8 animate-pulse-subtle" />
      </div>

      <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-2">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
        {description}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {onUploadClick && (
          <button
            onClick={onUploadClick}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-purple hover:from-brand-500 hover:to-brand-purple shadow-md shadow-brand-500/20 active:scale-95 transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Meeting</span>
          </button>
        )}

        {onSeedClick && (
          <button
            onClick={onSeedClick}
            disabled={isSeeding}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/80 hover:bg-brand-100 dark:hover:bg-brand-900/60 transition-all disabled:opacity-50"
          >
            <Database className="w-4 h-4" />
            <span>{isSeeding ? 'Loading Sample...' : 'Try Sample Meeting'}</span>
          </button>
        )}
      </div>
    </div>
  );
}

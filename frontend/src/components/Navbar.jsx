import React from 'react';
import { 
  Sun, 
  Moon, 
  Sparkles, 
  Key, 
  UploadCloud, 
  Search,
  Database
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ 
  title, 
  subtitle, 
  onUploadClick, 
  apiKeyConfigured = true,
  onSeedDemo,
  isSeeding = false
}) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="h-16 px-6 border-b border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-[#0B0F19]/70 backdrop-blur-md flex items-center justify-between sticky top-0 z-20 transition-colors duration-200">
      {/* Title / Breadcrumb */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right Action Tools */}
      <div className="flex items-center gap-3">
        {/* Quick Demo Seeder Button */}
        {onSeedDemo && (
          <button
            onClick={onSeedDemo}
            disabled={isSeeding}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/60 hover:bg-brand-100 dark:hover:bg-brand-900/60 transition-all disabled:opacity-50"
            title="Load realistic sample meetings to test RAG and Analytics"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isSeeding ? 'Seeding...' : 'Load Sample Data'}</span>
          </button>
        )}

        {/* API Key Status Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300">
          <Key className="w-3 h-3 text-brand-500" />
          <span className="hidden sm:inline">Groq AI:</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Connected
          </span>
        </div>

        {/* Dark / Light Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Primary Upload Meeting Action */}
        {onUploadClick && (
          <button
            onClick={onUploadClick}
            className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-brand-600 to-brand-purple hover:from-brand-500 hover:to-brand-purple/90 shadow-md shadow-brand-500/20 active:scale-95 transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Meeting</span>
          </button>
        )}
      </div>
    </header>
  );
}

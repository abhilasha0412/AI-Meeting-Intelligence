import React from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  Video, 
  Bot, 
  CheckSquare, 
  BarChart3, 
  Settings as SettingsIcon,
  Sparkles,
  ChevronRight
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'upload', label: 'Upload Meeting', icon: UploadCloud },
  { id: 'meetings', label: 'Meetings', icon: Video },
  { id: 'chat', label: 'AI Chat', icon: Bot, badge: 'RAG' },
  { id: 'action-items', label: 'Action Items', icon: CheckSquare },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export default function Sidebar({ currentPage, setCurrentPage, stats }) {
  return (
    <aside className="w-64 bg-[#0B0F19] text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800/80 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-800/60">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-brand-purple flex items-center justify-center shadow-glow flex-shrink-0">
          <Sparkles className="w-5 h-5 text-white animate-pulse-subtle" />
        </div>
        <div className="overflow-hidden">
          <h1 className="font-bold text-base text-white tracking-tight flex items-center gap-1.5 truncate">
            AI Meeting
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">
              Pro
            </span>
          </h1>
          <p className="text-[11px] text-slate-400 truncate">Actionable Intelligence</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Main Menu
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-brand-600/90 to-brand-purple/80 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-400'
                }`} />
                <span className="truncate">{item.label}</span>
              </div>
              
              {item.badge && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  {item.badge}
                </span>
              )}
              {item.id === 'action-items' && stats?.pending_tasks > 0 && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {stats.pending_tasks}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Upgrade / Model Badge */}
      <div className="p-3 mx-3 mb-3 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800/80 to-slate-900 border border-slate-700/60">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-xs font-semibold text-slate-200">Groq Engine Active</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Whisper + Qwen 3.8 / GPT-120B with ChromaDB RAG.
        </p>
      </div>

      {/* User Profile Footer */}
      <div className="p-3.5 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-500 to-brand-blue flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            AI
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-white truncate">Abhilasha</p>
            <p className="text-[11px] text-slate-400 truncate">abhilasha@work.ai</p>
          </div>
        </div>
        <button 
          onClick={() => setCurrentPage('settings')}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          title="Account Settings"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}

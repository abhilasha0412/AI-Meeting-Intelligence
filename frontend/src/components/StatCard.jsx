import React from 'react';

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendPositive = true,
  color = 'indigo'
}) {
  const colorMap = {
    indigo: 'from-brand-500/10 to-brand-600/5 text-brand-600 dark:text-brand-400 border-brand-500/20',
    purple: 'from-purple-500/10 to-purple-600/5 text-purple-600 dark:text-purple-400 border-purple-500/20',
    blue: 'from-sky-500/10 to-sky-600/5 text-sky-600 dark:text-sky-400 border-sky-500/20',
    emerald: 'from-emerald-500/10 to-emerald-600/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    amber: 'from-amber-500/10 to-amber-600/5 text-amber-600 dark:text-amber-400 border-amber-500/20',
  };

  const iconBgMap = {
    indigo: 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    blue: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#0F172A]/80 border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-card hover:shadow-card-hover transition-all duration-200 group">
      {/* Soft Gradient Corner Glow */}
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl opacity-40 bg-gradient-to-br ${colorMap[color] || colorMap.indigo}`} />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {value}
          </p>
        </div>

        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBgMap[color] || iconBgMap.indigo} transition-transform duration-200 group-hover:scale-110 shadow-sm`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3.5 flex items-center gap-2 text-xs">
          {trend && (
            <span className={`font-semibold px-1.5 py-0.5 rounded-md ${
              trendPositive 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}>
              {trend}
            </span>
          )}
          {subtitle && (
            <span className="text-slate-500 dark:text-slate-400 truncate">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

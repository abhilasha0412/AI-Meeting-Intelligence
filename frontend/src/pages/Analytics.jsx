import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Video, 
  CheckSquare, 
  Lightbulb, 
  Calendar,
  Layers
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import StatCard from '../components/StatCard';

export default function Analytics({ analytics = null }) {
  const summary = analytics?.summary || {};
  const sentimentData = analytics?.sentiment_distribution || [];
  const topTopics = analytics?.top_topics || [];
  const activityTimeline = analytics?.activity_timeline || [];
  const taskDistribution = analytics?.task_distribution || [];
  const decisionCategories = analytics?.decision_categories || [];

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          Meeting Intelligence Analytics
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Aggregated trends, meeting duration metrics, team sentiment, and task completion velocity.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Meetings"
          value={summary.total_meetings || 0}
          subtitle="Indexed in RAG store"
          icon={Video}
          color="indigo"
        />
        <StatCard
          title="Total Hours"
          value={`${summary.total_hours || 0} hrs`}
          subtitle={`Avg ${summary.avg_duration_minutes || 0} mins/session`}
          icon={Clock}
          color="purple"
        />
        <StatCard
          title="Task Completion Rate"
          value={`${summary.completion_rate || 0}%`}
          subtitle={`${summary.completed_tasks || 0} of ${summary.total_tasks || 0} finished`}
          icon={CheckSquare}
          color="emerald"
          trend="+8% this sprint"
          trendPositive={true}
        />
        <StatCard
          title="Total Decisions Logged"
          value={summary.total_decisions || 0}
          subtitle="Strategic agreements"
          icon={Lightbulb}
          color="blue"
        />
      </div>

      {/* Charts Grid 1: Meeting Activity & Sentiment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meeting Activity Area Chart (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800/80 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-500" />
              <span>Meeting Activity & Duration (Mins)</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500">Timeline</span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityTimeline}>
                <defs>
                  <linearGradient id="durationGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis 
                  dataKey="date" 
                  stroke="#94A3B8" 
                  fontSize={12} 
                  tickLine={false} 
                />
                <YAxis 
                  stroke="#94A3B8" 
                  fontSize={12} 
                  tickLine={false} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0F172A', 
                    borderColor: '#1E293B',
                    borderRadius: '0.75rem',
                    color: '#F8FAFC',
                    fontSize: '12px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="duration" 
                  name="Duration (mins)" 
                  stroke="#6366F1" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#durationGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Pie Chart (1 Col) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800/80 shadow-card space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span>Team Sentiment Ratio</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tone & sentiment distribution</p>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0F172A', 
                    borderColor: '#1E293B',
                    borderRadius: '0.75rem',
                    color: '#F8FAFC',
                    fontSize: '12px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
            {sentimentData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-500 truncate">{item.name}:</span>
                <span className="font-bold text-slate-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Grid 2: Top Topics & Task Completion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Discussion Topics Bar Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800/80 shadow-card space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-500" />
            <span>Most Discussed Topics</span>
          </h3>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topTopics} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} horizontal={false} />
                <XAxis type="number" stroke="#94A3B8" fontSize={11} />
                <YAxis type="category" dataKey="topic" stroke="#94A3B8" fontSize={11} width={130} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0F172A', 
                    borderColor: '#1E293B',
                    borderRadius: '0.75rem',
                    color: '#F8FAFC',
                    fontSize: '12px'
                  }} 
                />
                <Bar dataKey="count" name="Mentions" fill="#8B5CF6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Decisions by Category Cards */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800/80 shadow-card space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-brand-500" />
            <span>Decisions by Domain</span>
          </h3>

          <div className="space-y-3 pt-2">
            {decisionCategories.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No decisions recorded yet.</p>
            ) : (
              decisionCategories.map((cat, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between"
                >
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    {cat.category}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                    {cat.count} decisions
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

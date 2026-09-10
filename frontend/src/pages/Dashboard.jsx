import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  Bot, 
  TrendingUp, 
  Calendar,
  Layers,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import { formatDuration, formatDate, getSentimentBadge } from '../utils/formatters';

const SUGGESTED_PROMPTS = [
  "What did we discuss about the frontend?",
  "Who has pending tasks?",
  "What decisions were made in the latest meeting?",
  "Summarize my recent meetings."
];

export default function Dashboard({ 
  onNavigate, 
  onSelectMeeting, 
  onAskChat, 
  meetings = [], 
  analytics = null,
  onSeedDemo,
  isSeeding = false
}) {
  const summary = analytics?.summary || {};
  const sentimentData = analytics?.sentiment_distribution || [];
  const topTopics = analytics?.top_topics || [];

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Good Morning! 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Here's what's happening with your meetings and actionable intelligence.
          </p>
        </div>

        <button
          onClick={() => onNavigate('upload')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-brand-600 to-brand-purple hover:from-brand-500 hover:to-brand-purple shadow-md shadow-brand-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>New Meeting</span>
        </button>
      </div>

      {/* 4 Primary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Meetings"
          value={summary.total_meetings || meetings.length || 0}
          subtitle="All recorded sessions"
          icon={Video}
          color="indigo"
          trend="+12% this month"
          trendPositive={true}
        />
        <StatCard
          title="Total Hours"
          value={`${summary.total_hours || 0} hrs`}
          subtitle={`Avg ${summary.avg_duration_minutes || 0} mins / meeting`}
          icon={Clock}
          color="purple"
        />
        <StatCard
          title="Pending Tasks"
          value={summary.pending_tasks || 0}
          subtitle="Action items needing review"
          icon={AlertCircle}
          color="amber"
          trend={summary.pending_tasks > 0 ? "Requires action" : "All cleared"}
          trendPositive={summary.pending_tasks === 0}
        />
        <StatCard
          title="Completed Tasks"
          value={summary.completed_tasks || 0}
          subtitle={`${summary.completion_rate || 0}% completion velocity`}
          icon={CheckCircle2}
          color="emerald"
          trend={`${summary.completion_rate || 0}%`}
          trendPositive={true}
        />
      </div>

      {/* Main Content Grid: Recent Meetings + Meeting Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Meetings */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-500" />
              <span>Recent Meetings</span>
            </h2>
            {meetings.length > 0 && (
              <button
                onClick={() => onNavigate('meetings')}
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-500 flex items-center gap-1 transition-colors"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {meetings.length === 0 ? (
            <EmptyState
              title="No meetings recorded yet"
              description="Upload an audio recording or load sample data to explore automatic Whisper transcription, Groq summary extraction, and RAG search."
              onUploadClick={() => onNavigate('upload')}
              onSeedClick={onSeedDemo}
              isSeeding={isSeeding}
            />
          ) : (
            <div className="space-y-3">
              {meetings.slice(0, 4).map((meeting) => {
                const sentimentBadge = getSentimentBadge(meeting.sentiment);
                return (
                  <div
                    key={meeting.id}
                    onClick={() => onSelectMeeting(meeting.id)}
                    className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0F172A]/90 border border-slate-200/80 dark:border-slate-800/80 shadow-card hover:shadow-card-hover hover:border-brand-500/40 dark:hover:border-brand-500/40 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors truncate">
                          {meeting.title}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${sentimentBadge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sentimentBadge.dot}`}></span>
                          {sentimentBadge.label}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {meeting.summary || "No executive summary recorded."}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {formatDuration(meeting.duration_seconds)}
                        </span>
                        <span>•</span>
                        <span>{formatDate(meeting.created_at)}</span>
                        <span>•</span>
                        <span className="font-medium text-brand-600 dark:text-brand-400">
                          {meeting.action_items_count || 0} action items
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="p-2 rounded-xl text-slate-400 group-hover:text-brand-500 group-hover:bg-brand-500/10 dark:group-hover:bg-brand-500/20 transition-all">
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: AI Assistant Preview & Sentiment */}
        <div className="space-y-6">
          {/* AI Assistant Card */}
          <div className="rounded-3xl bg-gradient-to-br from-[#0B0F19] to-slate-900 border border-brand-500/30 p-5 sm:p-6 shadow-glow text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-500 to-brand-purple flex items-center justify-center shadow-sm">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">AI Meeting Assistant</h3>
                <p className="text-[11px] text-brand-300">RAG Semantic Search Ready</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Ask anything across your entire meeting knowledge base:
            </p>

            {/* Clickable Suggestion Chips */}
            <div className="space-y-2">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => onAskChat(prompt)}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-800/80 hover:bg-brand-900/60 border border-slate-700/60 hover:border-brand-500/50 text-xs text-slate-200 hover:text-white transition-all duration-150 flex items-center justify-between group"
                >
                  <span className="truncate pr-2">"{prompt}"</span>
                  <MessageSquare className="w-3.5 h-3.5 text-brand-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                </button>
              ))}
            </div>

            <button
              onClick={() => onNavigate('chat')}
              className="mt-4 w-full py-2.5 rounded-xl text-xs font-bold text-brand-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Open Full AI Chatbot</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sentiment Distribution Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A]/80 border border-slate-200/80 dark:border-slate-800/80 shadow-card space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-500" />
              <span>Meeting Sentiment Overview</span>
            </h3>

            {sentimentData.length > 0 && sentimentData[0]?.name !== "No Data" ? (
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={65}
                      paddingAngle={4}
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
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                Upload meetings to visualize team sentiment.
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {sentimentData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 dark:text-slate-400 truncate">{item.name}:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

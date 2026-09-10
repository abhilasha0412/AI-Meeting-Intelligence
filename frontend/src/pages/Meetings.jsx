import React, { useState } from 'react';
import { 
  Video, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Clock, 
  Calendar, 
  CheckSquare, 
  Trash2, 
  ChevronRight,
  Sparkles,
  Plus
} from 'lucide-react';
import EmptyState from '../components/EmptyState';
import { formatDuration, formatDate, getSentimentBadge } from '../utils/formatters';
import { meetingsApi } from '../services/api';

export default function Meetings({ 
  meetings = [], 
  onSelectMeeting, 
  onNavigate, 
  onRefreshMeetings, 
  showToast,
  onSeedDemo,
  isSeeding = false
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'duration'
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (e, id, title) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${title}"? This will remove its transcript, tasks, and ChromaDB vector embeddings.`)) {
      return;
    }

    try {
      setDeletingId(id);
      await meetingsApi.delete(id);
      showToast('Meeting deleted successfully', 'info');
      if (onRefreshMeetings) onRefreshMeetings();
    } catch (error) {
      showToast('Failed to delete meeting', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter & Search
  const filtered = meetings.filter(m => {
    const matchesSearch = !search || m.title.toLowerCase().includes(search.toLowerCase()) || (m.summary && m.summary.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
    if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
    if (sortBy === 'duration') return (b.duration_seconds || 0) - (a.duration_seconds || 0);
    return 0;
  });

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Meeting History
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Browse, search, and review all your transcribed meetings and AI intelligence.
          </p>
        </div>

        <button
          onClick={() => onNavigate('upload')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-brand-600 to-brand-purple hover:from-brand-500 hover:to-brand-purple shadow-md shadow-brand-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Meeting</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search meetings by title or topic..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
          />
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Processing">Processing</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="duration">Longest Duration</option>
            </select>
          </div>
        </div>
      </div>

      {/* Meetings List / Grid */}
      {sorted.length === 0 ? (
        <EmptyState
          title={search ? "No matching meetings" : "No meetings recorded yet"}
          description={search ? `No meetings found matching "${search}". Try clearing your search filter.` : "Upload your first meeting recording to unlock automatic speech recognition, AI summaries, and vector RAG search."}
          onUploadClick={() => onNavigate('upload')}
          onSeedClick={onSeedDemo}
          isSeeding={isSeeding}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {sorted.map((meeting) => {
            const sentimentBadge = getSentimentBadge(meeting.sentiment);
            const isDeleting = deletingId === meeting.id;

            return (
              <div
                key={meeting.id}
                onClick={() => onSelectMeeting(meeting.id)}
                className={`p-5 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800/80 shadow-card hover:shadow-card-hover hover:border-brand-500/40 dark:hover:border-brand-500/40 transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                  isDeleting ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header: Title & Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors truncate">
                        {meeting.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(meeting.created_at)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDuration(meeting.duration_seconds)}
                        </span>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${sentimentBadge.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sentimentBadge.dot}`}></span>
                      {sentimentBadge.label}
                    </span>
                  </div>

                  {/* Summary Snippet */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {meeting.summary || "No executive summary available."}
                  </p>

                  {/* Key Topics Tags */}
                  {meeting.key_topics && meeting.key_topics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {meeting.key_topics.slice(0, 3).map((topic, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        >
                          #{topic}
                        </span>
                      ))}
                      {meeting.key_topics.length > 3 && (
                        <span className="px-1.5 py-0.5 text-[10px] text-slate-400">
                          +{meeting.key_topics.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1">
                      <CheckSquare className="w-3.5 h-3.5" />
                      {meeting.action_items_count || 0} Action Items
                    </span>
                    {meeting.decisions_count > 0 && (
                      <span className="text-slate-500 dark:text-slate-400">
                        {meeting.decisions_count} Decisions
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleDelete(e, meeting.id, meeting.title)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="Delete meeting"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <span className="p-1.5 rounded-lg text-slate-400 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

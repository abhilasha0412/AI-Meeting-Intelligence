import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Search, 
  Filter, 
  User, 
  Calendar, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { actionItemsApi } from '../services/api';
import EmptyState from '../components/EmptyState';

export default function ActionItems({ onSelectMeeting, showToast }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchActionItems();
  }, [statusFilter]);

  const fetchActionItems = async () => {
    try {
      setLoading(true);
      const res = await actionItemsApi.list({ status: statusFilter !== 'All' ? statusFilter : undefined });
      setItems(res.data.action_items || []);
    } catch (error) {
      showToast('Failed to load action items', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (itemId, currentStatus) => {
    const nextStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    
    // Optimistic update
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, status: nextStatus } : item
    ));

    if (nextStatus === 'Completed') {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.8 }
      });
    }

    try {
      await actionItemsApi.update(itemId, { status: nextStatus });
      showToast(`Task marked as ${nextStatus.toLowerCase()}`, 'success');
    } catch (error) {
      showToast('Failed to update task', 'error');
      fetchActionItems();
    }
  };

  const handleDeleteTask = async (e, itemId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this action item?')) return;

    try {
      await actionItemsApi.delete(itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
      showToast('Action item deleted', 'info');
    } catch (error) {
      showToast('Failed to delete task', 'error');
    }
  };

  const filteredItems = items.filter(i =>
    !search || 
    i.task.toLowerCase().includes(search.toLowerCase()) || 
    i.assignee.toLowerCase().includes(search.toLowerCase()) ||
    i.meeting_title.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = items.filter(i => i.status === 'Pending').length;
  const completedCount = items.filter(i => i.status === 'Completed').length;

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Action Items & Task Tracker
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Automatically extracted deliverables, owners, and deadlines across all meetings.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {pendingCount} Pending
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            {completedCount} Completed
          </span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks, assignees, or meetings..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full sm:w-auto">
          {['All', 'Pending', 'Completed'].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === filter
                  ? 'bg-white dark:bg-[#0B0F19] text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Task List / Table */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
          <p className="text-xs text-slate-400">Loading action items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
          No action items found matching your criteria.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isDone = item.status === 'Completed';
            return (
              <div
                key={item.id}
                onClick={() => handleToggleStatus(item.id, item.status)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                  isDone 
                    ? 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/60 opacity-60'
                    : 'bg-white dark:bg-[#0F172A] border-slate-200 dark:border-slate-800 hover:border-brand-500/50 shadow-card hover:shadow-card-hover'
                }`}
              >
                {/* Checkbox & Task Name */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => {}}
                    className="w-4 h-4 mt-0.5 rounded accent-brand-500 cursor-pointer flex-shrink-0"
                  />
                  <div className="space-y-1">
                    <p className={`text-xs sm:text-sm font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                      {item.task}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                        <User className="w-3 h-3 text-brand-500" />
                        {item.assignee || 'Team'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Due: {item.deadline || 'Upcoming'}
                      </span>
                      <span>•</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectMeeting) onSelectMeeting(item.meeting_id);
                        }}
                        className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                      >
                        <span>{item.meeting_title}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status & Delete */}
                <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isDone ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}>
                    {item.status}
                  </span>

                  <button
                    onClick={(e) => handleDeleteTask(e, item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

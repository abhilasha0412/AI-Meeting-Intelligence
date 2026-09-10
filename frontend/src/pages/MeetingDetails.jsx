import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  FileText, 
  CheckSquare, 
  Lightbulb, 
  MessageSquare, 
  Copy, 
  Check, 
  Search,
  Sparkles,
  Bot,
  Send,
  Loader2,
  Trash2,
  Tag,
  User,
  ShieldCheck
} from 'lucide-react';
import AudioPlayer from '../components/AudioPlayer';
import { formatDuration, formatDate, formatTime, getSentimentBadge } from '../utils/formatters';
import { meetingsApi, actionItemsApi, chatApi } from '../services/api';

const TABS = [
  { id: 'summary', label: 'Summary', icon: Sparkles },
  { id: 'transcript', label: 'Transcript', icon: FileText },
  { id: 'action-items', label: 'Action Items', icon: CheckSquare },
  { id: 'decisions', label: 'Decisions', icon: Lightbulb },
  { id: 'chat', label: 'Meeting Chat', icon: MessageSquare },
];

export default function MeetingDetails({ meetingId, onBack, showToast }) {
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  
  // Audio seek sync
  const [seekTime, setSeekTime] = useState(null);
  const [currentAudioTime, setCurrentAudioTime] = useState(0);

  // Transcript search & copy
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [copied, setCopied] = useState(false);

  // Meeting scoped Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    fetchMeeting();
  }, [meetingId]);

  const fetchMeeting = async () => {
    try {
      setLoading(true);
      const res = await meetingsApi.get(meetingId);
      setMeeting(res.data);
    } catch (error) {
      showToast('Failed to load meeting details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActionStatus = async (itemId, currentStatus) => {
    const nextStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    try {
      // Optimistic update
      setMeeting(prev => ({
        ...prev,
        action_items: prev.action_items.map(item =>
          item.id === itemId ? { ...item, status: nextStatus } : item
        )
      }));

      await actionItemsApi.update(itemId, { status: nextStatus });
      showToast(`Task marked as ${nextStatus.toLowerCase()}`, 'success');
    } catch (error) {
      showToast('Failed to update task status', 'error');
      fetchMeeting(); // revert on failure
    }
  };

  const handleCopyTranscript = () => {
    if (!meeting?.transcripts) return;
    const fullText = meeting.transcripts
      .map(t => `[${formatTime(t.start_time)}] ${t.speaker}: ${t.text}`)
      .join('\n\n');
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    showToast('Full transcript copied to clipboard!', 'info');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatLoading(true);

    try {
      const response = await chatApi.ask(userMessage, meetingId);
      setChatMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: response.data.answer,
          sources: response.data.sources 
        }
      ]);
    } catch (error) {
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "I couldn't process that question right now. Please try again."
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading meeting intelligence...</p>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-500">Meeting not found or deleted.</p>
        <button onClick={onBack} className="px-4 py-2 rounded-xl bg-brand-500 text-white font-medium text-sm">
          Return to Meetings
        </button>
      </div>
    );
  }

  const sentimentBadge = getSentimentBadge(meeting.sentiment);

  // Filtered transcript chunks
  const filteredTranscripts = (meeting.transcripts || []).filter(t => 
    !transcriptSearch || 
    t.text.toLowerCase().includes(transcriptSearch.toLowerCase()) || 
    t.speaker.toLowerCase().includes(transcriptSearch.toLowerCase())
  );

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
            title="Back to all meetings"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {meeting.title}
              </h1>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${sentimentBadge.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sentimentBadge.dot}`}></span>
                {sentimentBadge.label}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
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
        </div>
      </div>

      {/* Audio Waveform Player Bar */}
      {meeting.file_path && (
        <AudioPlayer
          audioUrl={meeting.file_path}
          seekTime={seekTime}
          onTimeUpdate={(time) => setCurrentAudioTime(time)}
        />
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-px">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count = tab.id === 'action-items' ? meeting.action_items?.length : tab.id === 'decisions' ? meeting.decisions?.length : null;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-semibold text-xs sm:text-sm whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {count !== null && count !== undefined && count > 0 && (
                  <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-brand-500/20 text-brand-600 dark:text-brand-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB 1: SUMMARY */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Executive Summary */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800/80 shadow-card space-y-4">
              <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Executive Summary
                </h3>
              </div>

              <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3 whitespace-pre-line">
                {meeting.summary || "No executive summary available."}
              </div>
            </div>

            {/* Important Points */}
            {meeting.important_points && meeting.important_points.length > 0 && (
              <div className="p-6 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800/80 shadow-card space-y-4">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  <span>Important Discussion Points</span>
                </h3>

                <ul className="space-y-2.5">
                  {meeting.important_points.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2 flex-shrink-0" />
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Key Topics & Side Meta */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800/80 shadow-card space-y-4">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-brand-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Key Discussion Topics
                </h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {meeting.key_topics && meeting.key_topics.map((topic, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60 shadow-sm"
                  >
                    #{topic}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800/80 shadow-card space-y-3 text-xs">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
                Meeting Metadata
              </h3>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Audio Duration:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatDuration(meeting.duration_seconds)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Action Items:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{meeting.action_items?.length || 0} tasks</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Decisions:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{meeting.decisions?.length || 0} recorded</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Sentiment:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{meeting.sentiment || 'Positive'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRANSCRIPT */}
      {activeTab === 'transcript' && (
        <div className="rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800/80 shadow-card p-6 space-y-4 animate-fade-in">
          {/* Transcript Tools */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={transcriptSearch}
                onChange={(e) => setTranscriptSearch(e.target.value)}
                placeholder="Search spoken words or speakers..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <button
              onClick={handleCopyTranscript}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors self-end sm:self-auto"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Full Transcript'}</span>
            </button>
          </div>

          {/* Transcript Rows */}
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {filteredTranscripts.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-8">
                No transcript segments found matching your search.
              </p>
            ) : (
              filteredTranscripts.map((t) => {
                const isCurrentlyActive = currentAudioTime >= t.start_time && currentAudioTime <= t.end_time;
                return (
                  <div
                    key={t.id}
                    className={`p-3.5 rounded-2xl transition-all duration-150 flex items-start gap-3.5 ${
                      isCurrentlyActive
                        ? 'bg-brand-50/80 dark:bg-brand-950/40 border border-brand-300 dark:border-brand-800/80 shadow-sm'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-900/50 border border-transparent'
                    }`}
                  >
                    {/* Timestamp Pill (Click to Seek) */}
                    <button
                      onClick={() => setSeekTime(t.start_time)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-brand-500 hover:text-white text-[11px] font-bold text-slate-600 dark:text-slate-300 transition-colors flex-shrink-0"
                      title="Click to seek audio to this timestamp"
                    >
                      {formatTime(t.start_time)}
                    </button>

                    {/* Speaker & Content */}
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-xs font-bold text-brand-600 dark:text-brand-400">
                        {t.speaker}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                        {t.text}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ACTION ITEMS */}
      {activeTab === 'action-items' && (
        <div className="rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800/80 shadow-card p-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-brand-500" />
              <span>Meeting Action Items ({meeting.action_items?.length || 0})</span>
            </h3>
            <p className="text-xs text-slate-400">Click checkboxes to toggle status</p>
          </div>

          {!meeting.action_items || meeting.action_items.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-8">
              No action items extracted from this meeting.
            </p>
          ) : (
            <div className="space-y-3">
              {meeting.action_items.map((item) => {
                const isDone = item.status === 'Completed';
                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleActionStatus(item.id, item.status)}
                    className={`p-4 rounded-2xl border transition-all duration-150 cursor-pointer flex items-center justify-between gap-4 ${
                      isDone 
                        ? 'bg-slate-50/60 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/60 opacity-60'
                        : 'bg-white dark:bg-[#0B0F19] border-slate-200 dark:border-slate-800 hover:border-brand-500/50 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => {}}
                        className="w-4 h-4 mt-0.5 rounded accent-brand-500 cursor-pointer"
                      />
                      <div className="space-y-1">
                        <p className={`text-xs sm:text-sm font-semibold ${isDone ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                          {item.task}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {item.assignee || 'Unassigned'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Deadline: {item.deadline || 'Upcoming'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      isDone ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DECISIONS */}
      {activeTab === 'decisions' && (
        <div className="rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800/80 shadow-card p-6 space-y-4 animate-fade-in">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-purple-500" />
              <span>Key Decisions & Ratified Outcomes</span>
            </h3>
          </div>

          {!meeting.decisions || meeting.decisions.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-8">
              No formal decisions logged in this meeting.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {meeting.decisions.map((decision) => (
                <div
                  key={decision.id}
                  className="p-5 rounded-2xl bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2.5 shadow-sm"
                >
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    {decision.category || 'General'}
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                    "{decision.decision_text}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: IN-MEETING CHAT */}
      {activeTab === 'chat' && (
        <div className="rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800/80 shadow-card p-6 space-y-4 animate-fade-in">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Bot className="w-5 h-5 text-brand-500" />
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                In-Meeting AI Assistant
              </h3>
              <p className="text-xs text-slate-500">Ask questions scoped strictly to "{meeting.title}"</p>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto space-y-4 pr-2">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-2 text-slate-400">
                <Bot className="w-8 h-8 text-brand-500/40" />
                <p className="text-xs">Ask anything about this recording. Groq AI answers using RAG transcript retrieval.</p>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-brand-purple flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5">
                      AI
                    </div>
                  )}
                  <div className={`p-3.5 rounded-2xl max-w-lg text-xs sm:text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-brand-600 text-white rounded-tr-none'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-tl-none space-y-2'
                  }`}>
                    <p className="whitespace-pre-line">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            {isChatLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                <span>Searching meeting transcripts and formulating answer...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendChat} className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`Ask a question about ${meeting.title}...`}
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={isChatLoading || !chatInput.trim()}
              className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-md active:scale-95 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

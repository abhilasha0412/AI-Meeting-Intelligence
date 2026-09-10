import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Loader2, 
  Sparkles, 
  ExternalLink, 
  Clock, 
  FileText, 
  HelpCircle,
  MessageSquare,
  ChevronRight,
  Database
} from 'lucide-react';
import { chatApi } from '../services/api';

const SUGGESTED_QUESTIONS = [
  "What was discussed in the latest meeting?",
  "Who has pending tasks?",
  "What decisions were made about architecture?",
  "What is the frontend project deadline?",
  "Summarize the Q3 strategy meeting.",
  "Which topics were discussed most often?"
];

export default function AIChat({ onSelectMeeting, initialPrompt = '', showToast }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: "Hello! I'm your AI Meeting Assistant. Ask me anything about your past discussions, action items, decisions, or timelines, and I'll retrieve the exact facts from your meeting recordings with verifiable citations.",
      sources: []
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendQuery(initialPrompt.trim());
    }
  }, [initialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendQuery = async (queryText) => {
    const text = queryText || input.trim();
    if (!text || isLoading) return;

    setInput('');
    const userMsgId = Date.now();
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: text }]);
    setIsLoading(true);

    try {
      const response = await chatApi.ask(text);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: response.data.answer,
          sources: response.data.sources || []
        }
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: "I couldn't retrieve an answer right now. Please verify your meeting recordings or check your Groq AI configuration in Settings.",
          sources: []
        }
      ]);
      showToast('Error communicating with AI assistant', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6 flex flex-col h-[calc(100vh-4rem)] animate-fade-in">
      {/* Header */}
      <div className="space-y-1 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-purple flex items-center justify-center text-white shadow-glow">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              AI Meeting Assistant
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/20">
                RAG Engine
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ask questions across all meeting transcripts with grounded facts and exact audio citations.
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-shrink-0">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1 pl-1 flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-brand-500" />
          <span>Suggestions:</span>
        </span>
        {SUGGESTED_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendQuery(q)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 whitespace-nowrap shadow-sm transition-all flex-shrink-0"
          >
            "{q}"
          </button>
        ))}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800/80 shadow-card p-4 sm:p-6 overflow-y-auto space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-purple flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm mt-0.5">
                AI
              </div>
            )}

            <div className="space-y-3 max-w-2xl">
              {/* Message Bubble */}
              <div className={`p-4 sm:p-5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-brand-600 to-brand-purple text-white rounded-tr-none shadow-md shadow-brand-500/20'
                  : 'bg-slate-50 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800/80 rounded-tl-none space-y-2'
              }`}>
                <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
              </div>

              {/* Source Citations Card */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="p-4 rounded-2xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200/80 dark:border-brand-800/60 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400">
                    <Database className="w-3.5 h-3.5" />
                    <span>Verified Meeting Sources ({msg.sources.length})</span>
                  </div>

                  <div className="space-y-2">
                    {msg.sources.map((src, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white dark:bg-[#0B0F19] border border-brand-100 dark:border-brand-900/60 flex items-center justify-between gap-3 text-xs shadow-xs"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {src.meeting_title}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-brand-500" />
                              Timestamp: {src.timestamp_formatted}
                            </span>
                            <span>•</span>
                            <span className="truncate italic">"{src.snippet}"</span>
                          </div>
                        </div>

                        {onSelectMeeting && (
                          <button
                            onClick={() => onSelectMeeting(src.meeting_id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/60 hover:bg-brand-100 dark:hover:bg-brand-800/80 transition-colors flex-shrink-0"
                          >
                            <span>View</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3 text-slate-500 text-xs py-3">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
            </div>
            <span>Searching vector embeddings and formulating grounded answer...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSendQuery(); }}
        className="p-2 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-card flex items-center gap-2 flex-shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your meetings, deadlines, decisions, or speakers..."
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-brand-600 to-brand-purple hover:from-brand-500 hover:to-brand-purple shadow-md shadow-brand-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}

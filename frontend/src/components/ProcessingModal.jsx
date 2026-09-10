import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  Mic, 
  BrainCircuit, 
  ListTodo, 
  Database,
  ArrowRight
} from 'lucide-react';

const STAGES = [
  { id: 1, label: 'File uploaded & validated', icon: Mic, detail: 'Audio format verified and prepared for processing' },
  { id: 2, label: 'Transcribing with Whisper', icon: Mic, detail: 'Extracting high-accuracy speech timestamps and speakers' },
  { id: 3, label: 'Generating AI intelligence', icon: BrainCircuit, detail: 'Groq LLM synthesizing executive summary and topics' },
  { id: 4, label: 'Extracting action items & decisions', icon: ListTodo, detail: 'Identifying tasks, assignees, and strategic commitments' },
  { id: 5, label: 'Creating vector embeddings', icon: Database, detail: 'Generating semantic chunks for instant ChromaDB RAG search' },
  { id: 6, label: 'Meeting intelligence complete!', icon: Sparkles, detail: 'Finalizing knowledge base and preparing meeting report' },
];

export default function ProcessingModal({ isOpen, currentStage = 1, isCompleted = false, onViewMeeting }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 overflow-hidden relative">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-2 bg-gradient-to-r from-brand-500 via-brand-purple to-brand-blue blur-sm" />

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-brand-purple text-white shadow-glow mb-2">
            {isCompleted ? (
              <Sparkles className="w-7 h-7 animate-bounce" />
            ) : (
              <Loader2 className="w-7 h-7 animate-spin" />
            )}
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {isCompleted ? 'Analysis Complete! 🎉' : 'Processing Meeting Audio'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            {isCompleted 
              ? 'Your meeting transcript, executive summary, action items, and RAG vectors are ready.' 
              : 'Our Whisper & Groq AI pipelines are turning your conversation into actionable intelligence.'}
          </p>
        </div>

        {/* Step-by-Step Progress Pipeline */}
        <div className="space-y-3.5 mb-8">
          {STAGES.map((stage) => {
            const isDone = stage.id < currentStage || (stage.id === 6 && isCompleted);
            const isCurrent = stage.id === currentStage && !isCompleted;
            const isPending = stage.id > currentStage;
            const Icon = stage.icon;

            return (
              <div 
                key={stage.id} 
                className={`flex items-start gap-3.5 p-3 rounded-xl transition-all duration-300 ${
                  isCurrent 
                    ? 'bg-brand-50/80 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800/80 shadow-sm' 
                    : isDone
                    ? 'bg-slate-50 dark:bg-slate-900/50 border border-transparent'
                    : 'opacity-40'
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-brand-600 dark:text-brand-400 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center text-[10px] text-slate-400">
                      {stage.id}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-xs sm:text-sm font-semibold truncate ${
                    isCurrent 
                      ? 'text-brand-600 dark:text-brand-400' 
                      : isDone 
                      ? 'text-slate-800 dark:text-slate-200' 
                      : 'text-slate-500 dark:text-slate-500'
                  }`}>
                    {stage.label}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {stage.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Completion Action */}
        {isCompleted && (
          <button
            onClick={onViewMeeting}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-brand-600 via-brand-500 to-brand-purple hover:from-brand-500 hover:to-brand-purple shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <span>View Meeting Intelligence</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

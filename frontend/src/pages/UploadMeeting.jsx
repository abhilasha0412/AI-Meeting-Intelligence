import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileAudio, 
  Sparkles, 
  X, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Clock,
  HardDrive
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { meetingsApi } from '../services/api';
import { formatFileSize } from '../utils/formatters';
import ProcessingModal from '../components/ProcessingModal';

export default function UploadMeeting({ onSelectMeeting, showToast }) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [customTitle, setCustomTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [createdMeetingId, setCreatedMeetingId] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const validExtensions = ['.mp3', '.wav', '.m4a', '.mp4', '.ogg', '.flac', '.webm', '.aac'];
    const name = selectedFile.name.toLowerCase();
    const isValid = validExtensions.some(ext => name.endsWith(ext));

    if (!isValid) {
      showToast('Please upload a valid audio/video file (.mp3, .wav, .m4a, .mp4, .ogg)', 'error');
      return;
    }

    setFile(selectedFile);
    if (!customTitle) {
      // Auto-suggest clean title from filename
      const baseName = selectedFile.name.rsplit ? selectedFile.name.rsplit('.', 1)[0] : selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || selectedFile.name;
      setCustomTitle(baseName.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsProcessing(true);
    setCurrentStage(1);
    setIsCompleted(false);

    const formData = new FormData();
    formData.append('file', file);
    if (customTitle.trim()) {
      formData.append('custom_title', customTitle.trim());
    }

    // Progress timer sequence for fluid UI responsiveness
    const timer1 = setTimeout(() => setCurrentStage(2), 1200);  // Transcribing
    const timer2 = setTimeout(() => setCurrentStage(3), 3500);  // Groq AI
    const timer3 = setTimeout(() => setCurrentStage(4), 5500);  // Action items
    const timer4 = setTimeout(() => setCurrentStage(5), 7000);  // Embeddings

    try {
      const response = await meetingsApi.upload(formData);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);

      setCurrentStage(6);
      setIsCompleted(true);
      setCreatedMeetingId(response.data.meeting_id);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      showToast('Meeting processed and indexed in knowledge base!', 'success');

      // Auto-navigate to meeting details after a short pleasant pause
      setTimeout(() => {
        onSelectMeeting(response.data.meeting_id);
      }, 1500);

    } catch (error) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      setIsProcessing(false);
      
      const errorMsg = error.response?.data?.detail || 'Failed to process audio recording. Please check file format.';
      showToast(errorMsg, 'error');
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Upload Meeting Recording
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Upload any meeting audio or video. Whisper and Groq AI will transcribe, analyze, and build your RAG knowledge base.
        </p>
      </div>

      {/* Main Upload Card */}
      <div className="rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 shadow-card space-y-6">
        {/* Drag and Drop Zone */}
        {!file ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-10 sm:p-16 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-4 ${
              isDragging
                ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 scale-[1.01]'
                : 'border-slate-300 dark:border-slate-700/80 hover:border-brand-500/60 dark:hover:border-brand-500/60 hover:bg-slate-50/50 dark:hover:bg-slate-900/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,.m4a,.mp4,.ogg,.flac,.webm,.aac"
              onChange={handleFileInput}
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-purple text-white flex items-center justify-center shadow-glow">
              <UploadCloud className="w-8 h-8 animate-pulse-subtle" />
            </div>

            <div className="space-y-1">
              <p className="text-base font-bold text-slate-900 dark:text-white">
                Drop your meeting recording here
              </p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                or <span className="font-semibold text-brand-600 dark:text-brand-400 underline">browse your files</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {['MP3', 'WAV', 'M4A', 'MP4', 'OGG', 'WEBM'].map(format => (
                <span
                  key={format}
                  className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60"
                >
                  {format}
                </span>
              ))}
            </div>
          </div>
        ) : (
          /* File Selected Preview State */
          <div className="p-5 rounded-2xl bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
                <FileAudio className="w-6 h-6" />
              </div>
              <div className="truncate space-y-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {file.name}
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3.5 h-3.5" />
                    {formatFileSize(file.size)}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Ready for analysis</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => { setFile(null); setCustomTitle(''); }}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              title="Remove file"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Optional Custom Meeting Title */}
        {file && (
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Meeting Title (Optional)
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g. Q4 Executive Strategy Sync"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            />
          </div>
        )}

        {/* Action Button */}
        {file && (
          <div className="pt-2">
            <button
              onClick={handleAnalyze}
              disabled={isProcessing}
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-brand-600 via-brand-500 to-brand-purple hover:from-brand-500 hover:to-brand-purple shadow-glow hover:shadow-glow-purple active:scale-98 transition-all flex items-center justify-center gap-2.5"
            >
              <Sparkles className="w-5 h-5" />
              <span>Analyze Meeting</span>
            </button>
          </div>
        )}
      </div>

      {/* Feature Highlights Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-slate-600 dark:text-slate-400 text-xs">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0F172A]/60 border border-slate-200/60 dark:border-slate-800/60 flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
          <p><span className="font-bold text-slate-900 dark:text-slate-200">Local & Groq Whisper</span>: High-precision speech-to-text with timestamps.</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0F172A]/60 border border-slate-200/60 dark:border-slate-800/60 flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
          <p><span className="font-bold text-slate-900 dark:text-slate-200">Executive Insights</span>: Summaries, key topics, decisions & action items.</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0F172A]/60 border border-slate-200/60 dark:border-slate-800/60 flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
          <p><span className="font-bold text-slate-900 dark:text-slate-200">ChromaDB RAG</span>: Instant grounded search with exact audio citations.</p>
        </div>
      </div>

      {/* Real-time Multi-stage Processing Modal */}
      <ProcessingModal
        isOpen={isProcessing}
        currentStage={currentStage}
        isCompleted={isCompleted}
        onViewMeeting={() => createdMeetingId && onSelectMeeting(createdMeetingId)}
      />
    </div>
  );
}

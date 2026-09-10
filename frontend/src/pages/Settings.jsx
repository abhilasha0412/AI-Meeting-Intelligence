import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  Moon, 
  Sun, 
  User, 
  Save, 
  Database,
  Cpu
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { settingsApi } from '../services/api';

export default function Settings({ showToast, onSeedDemo, isSeeding = false }) {
  const { isDark, toggleTheme } = useTheme();
  
  const [settingsData, setSettingsData] = useState({
    groq_api_key_masked: '',
    groq_model: 'qwen/qwen3.8-27b',
    whisper_model: 'base',
    use_groq_whisper: true,
    gemini_api_key_masked: ''
  });

  const [newGroqKey, setNewGroqKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState('qwen/qwen3.8-27b');
  const [whisperModel, setWhisperModel] = useState('base');
  
  // Test Connection status
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await settingsApi.get();
      setSettingsData(res.data);
      if (res.data.groq_model) setSelectedModel(res.data.groq_model);
      if (res.data.whisper_model) setWhisperModel(res.data.whisper_model);
    } catch (error) {
      showToast('Could not load current settings', 'error');
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await settingsApi.testKey(newGroqKey.trim() || undefined);
      setTestResult({
        success: true,
        message: res.data.message || 'Groq AI connected successfully!'
      });
      showToast('Groq AI API key verified!', 'success');
    } catch (error) {
      const errMsg = error.response?.data?.detail || 'Failed to connect to Groq API. Please check your key.';
      setTestResult({
        success: false,
        message: errMsg
      });
      showToast(errMsg, 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        groq_model: selectedModel,
        whisper_model: whisperModel,
        use_groq_whisper: true
      };
      if (newGroqKey.trim()) {
        payload.groq_api_key = newGroqKey.trim();
      }

      await settingsApi.update(payload);
      showToast('Settings saved successfully!', 'success');
      setNewGroqKey('');
      fetchSettings();
    } catch (error) {
      showToast('Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Settings & Configuration
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage your AI model keys, transcription engines, appearance, and profile.
        </p>
      </div>

      {/* 1. AI Configuration Card */}
      <div className="rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 shadow-card space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-purple flex items-center justify-center text-white shadow-glow">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Groq AI & Inference Engine
            </h3>
            <p className="text-xs text-slate-500">Ultra-fast structured intelligence and Whisper transcription</p>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-5">
          {/* API Key Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Groq API Key
              </label>
              {settingsData.groq_api_key_configured && (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active: {settingsData.groq_api_key_masked}
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={newGroqKey}
                onChange={(e) => setNewGroqKey(e.target.value)}
                placeholder={settingsData.groq_api_key_configured ? "Enter new key to update, or leave blank to keep active key" : "gsk_..."}
                className="w-full pl-4 pr-24 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Get your free high-speed API key at <a href="https://console.groq.com/" target="_blank" rel="noreferrer" className="text-brand-500 underline font-semibold">console.groq.com</a>.
            </p>
          </div>

          {/* Model Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Groq LLM Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="qwen/qwen3.8-27b">Qwen 3.8 27B (Recommended, Fast & Structured)</option>
                <option value="openai/gpt-oss-120b">GPT-OSS 120B (High Reasoning)</option>
                <option value="groq/compound">Groq Compound (Multi-agent)</option>
                <option value="openai/gpt-oss-20b">GPT-OSS 20B (Ultra-fast)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Local Whisper Fallback Model
              </label>
              <select
                value={whisperModel}
                onChange={(e) => setWhisperModel(e.target.value)}
                className="w-full px-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="base">Base (Balanced accuracy & speed)</option>
                <option value="tiny">Tiny (Ultra-lightweight)</option>
                <option value="small">Small (Higher precision)</option>
              </select>
            </div>
          </div>

          {/* Test Connection Banner */}
          {testResult && (
            <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
              testResult.success 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
            }`}>
              {testResult.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              <p className="font-medium">{testResult.message}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/80 hover:bg-brand-100 dark:hover:bg-brand-900/60 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
              <span>{isTesting ? 'Testing Connection...' : 'Test Groq Connection'}</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-brand-purple hover:from-brand-500 hover:to-brand-purple shadow-md shadow-brand-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save AI Settings</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Appearance & Theme */}
      <div className="rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              {isDark ? <Moon className="w-5 h-5 text-brand-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
              <span>Interface Appearance</span>
            </h3>
            <p className="text-xs text-slate-500">Toggle between sleek dark mode and bright crisp light mode.</p>
          </div>

          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </button>
        </div>
      </div>

      {/* 3. Demo Data Management */}
      <div className="rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-brand-500" />
              <span>Demo Data & Sandbox</span>
            </h3>
            <p className="text-xs text-slate-500">Load sample meetings and embeddings to test RAG chatbot and analytics without recording audio.</p>
          </div>

          <button
            onClick={() => onSeedDemo && onSeedDemo(true)}
            disabled={isSeeding}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/80 hover:bg-brand-100 dark:hover:bg-brand-900/60 transition-colors disabled:opacity-50 self-start sm:self-auto"
          >
            {isSeeding ? 'Reloading Sample...' : 'Reset & Reload Demo Data'}
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import Dashboard from './pages/Dashboard';
import UploadMeeting from './pages/UploadMeeting';
import Meetings from './pages/Meetings';
import MeetingDetails from './pages/MeetingDetails';
import AIChat from './pages/AIChat';
import ActionItems from './pages/ActionItems';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import { meetingsApi, analyticsApi, settingsApi } from './services/api';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);
  const [chatInitialPrompt, setChatInitialPrompt] = useState('');

  // Global app data
  const [meetings, setMeetings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    fetchGlobalData();
  }, []);

  const fetchGlobalData = async () => {
    try {
      const [meetingsRes, analyticsRes] = await Promise.all([
        meetingsApi.list(),
        analyticsApi.get()
      ]);
      setMeetings(meetingsRes.data.meetings || []);
      setAnalytics(analyticsRes.data || null);
    } catch (error) {
      console.error('Error loading global data:', error);
    }
  };

  const handleSelectMeeting = (id) => {
    setSelectedMeetingId(id);
    setCurrentPage('meeting-details');
  };

  const handleAskChatPrompt = (prompt) => {
    setChatInitialPrompt(prompt);
    setCurrentPage('chat');
  };

  const handleSeedDemo = async (force = false) => {
    try {
      setIsSeeding(true);
      await settingsApi.seedDemo(force);
      showToast('Sample meetings and vector embeddings ready!', 'success');
      await fetchGlobalData();
    } catch (error) {
      showToast('Failed to load sample data', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  const getPageMeta = () => {
    switch (currentPage) {
      case 'dashboard':
        return { title: 'Dashboard', subtitle: "Turn every meeting into actionable intelligence." };
      case 'upload':
        return { title: 'Upload Recording', subtitle: "Audio Transcription, LLM Extraction & Vector Indexing" };
      case 'meetings':
        return { title: 'Meeting Records', subtitle: "All archived meetings and transcripts" };
      case 'meeting-details':
        return { title: 'Meeting Intelligence', subtitle: "Detailed executive report, transcript & tasks" };
      case 'chat':
        return { title: 'AI Assistant', subtitle: "RAG Semantic Retrieval over all meeting transcripts" };
      case 'action-items':
        return { title: 'Action Items', subtitle: "Deliverables & task completion tracker" };
      case 'analytics':
        return { title: 'Analytics', subtitle: "Meeting durations, topics, and team sentiment metrics" };
      case 'settings':
        return { title: 'Settings', subtitle: "Configure Groq AI keys, models, and themes" };
      default:
        return { title: 'AI Meeting Intelligence', subtitle: '' };
    }
  };

  const pageMeta = getPageMeta();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] dark:bg-[#070A12] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={(page) => {
          if (page !== 'meeting-details') setSelectedMeetingId(null);
          setCurrentPage(page);
        }}
        stats={analytics?.summary}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          title={pageMeta.title}
          subtitle={pageMeta.subtitle}
          onUploadClick={currentPage !== 'upload' ? () => setCurrentPage('upload') : null}
          onSeedDemo={meetings.length === 0 ? () => handleSeedDemo(false) : null}
          isSeeding={isSeeding}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 overflow-y-auto">
          {currentPage === 'dashboard' && (
            <Dashboard
              onNavigate={setCurrentPage}
              onSelectMeeting={handleSelectMeeting}
              onAskChat={handleAskChatPrompt}
              meetings={meetings}
              analytics={analytics}
              onSeedDemo={() => handleSeedDemo(false)}
              isSeeding={isSeeding}
            />
          )}

          {currentPage === 'upload' && (
            <UploadMeeting
              onSelectMeeting={(id) => {
                fetchGlobalData();
                handleSelectMeeting(id);
              }}
              showToast={showToast}
            />
          )}

          {currentPage === 'meetings' && (
            <Meetings
              meetings={meetings}
              onSelectMeeting={handleSelectMeeting}
              onNavigate={setCurrentPage}
              onRefreshMeetings={fetchGlobalData}
              showToast={showToast}
              onSeedDemo={() => handleSeedDemo(false)}
              isSeeding={isSeeding}
            />
          )}

          {currentPage === 'meeting-details' && selectedMeetingId && (
            <MeetingDetails
              meetingId={selectedMeetingId}
              onBack={() => {
                fetchGlobalData();
                setCurrentPage('meetings');
              }}
              showToast={showToast}
            />
          )}

          {currentPage === 'chat' && (
            <AIChat
              onSelectMeeting={handleSelectMeeting}
              initialPrompt={chatInitialPrompt}
              showToast={showToast}
            />
          )}

          {currentPage === 'action-items' && (
            <ActionItems
              onSelectMeeting={handleSelectMeeting}
              showToast={showToast}
            />
          )}

          {currentPage === 'analytics' && (
            <Analytics
              analytics={analytics}
            />
          )}

          {currentPage === 'settings' && (
            <Settings
              showToast={showToast}
              onSeedDemo={handleSeedDemo}
              isSeeding={isSeeding}
            />
          )}
        </main>
      </div>

      {/* Global Toast Alert */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'info' })}
      />
    </div>
  );
}

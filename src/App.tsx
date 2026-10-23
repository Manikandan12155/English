import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { BottomNav } from './components/common/BottomNav';
import { ToastContainer } from './components/common/Toast';
import { HomeDashboard } from './components/dashboard/HomeDashboard';
import { StudyMode } from './components/study/StudyMode';
import { WordListView } from './components/wordlist/WordListView';
import { ReviewMode } from './components/review/ReviewMode';
import { QuizMode } from './components/review/QuizMode';
import { StatisticsView } from './components/stats/StatisticsView';
import { FilterModal } from './components/wordlist/FilterModal';
import { CsvImportModal } from './components/wordlist/CsvImportModal';
import { EditWordModal } from './components/wordlist/EditWordModal';
import { ExpandedWordModal } from './components/study/ExpandedWordModal';
import { AutoPlayModal } from './components/study/AutoPlayModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { TrackSelectorPortal } from './components/portal/TrackSelectorPortal';
import { AIAssistantView } from './components/assistant/AIAssistantView';
import { VocabularyWord, WordStatus } from './types/vocabulary';

export const AppContent: React.FC = () => {
  const { 
    currentScreen, 
    setCurrentScreen, 
    loading, 
    userStats, 
    handleWordStatusChange 
  } = useApp();

  // Modals state
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [showCsvImportModal, setShowCsvImportModal] = useState<boolean>(false);
  const [showEditWordModal, setShowEditWordModal] = useState<boolean>(false);
  const [editingWord, setEditingWord] = useState<VocabularyWord | null>(null);
  const [expandedWord, setExpandedWord] = useState<VocabularyWord | null>(null);
  const [showAutoPlayModal, setShowAutoPlayModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  // Check onboarding on first load
  React.useEffect(() => {
    if (userStats && !userStats.hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, [userStats]);

  const handleOpenDetails = (word: VocabularyWord) => {
    setExpandedWord(word);
  };

  const handleAddNewWord = () => {
    setEditingWord(null);
    setShowEditWordModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-xl animate-pulse mb-4">
          <span className="text-white font-black text-2xl">L</span>
        </div>
        <p className="font-bold text-sm tracking-tight text-slate-600 dark:text-slate-300">
          Loading LexiCraft...
        </p>
      </div>
    );
  }

  // Pre-dashboard login-style mode selector portal
  if (currentScreen === 'portal') {
    return (
      <>
        <TrackSelectorPortal onSelectTrack={() => setCurrentScreen('learn')} />
        <ToastContainer />
      </>
    );
  }

  // Dedicated Full-Screen AI Assistant (Authentic ChatGPT edge-to-edge view)
  if (currentScreen === 'game' || currentScreen === 'assistant') {
    return (
      <div className="h-screen w-screen bg-[#212121] text-slate-100 flex flex-col overflow-hidden">
        <AIAssistantView onBack={() => setCurrentScreen('dashboard')} />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 transition-colors relative selection:bg-indigo-500 selection:text-white">
      {/* iPhone Ambient Liquid Mesh Background */}
      <div className="ios-mesh-bg" aria-hidden="true">
        <div className="ios-mesh-orb-1" />
        <div className="ios-mesh-orb-2" />
        <div className="ios-mesh-orb-3" />
        <div className="ios-mesh-orb-4" />
      </div>
      
      {/* Top Navbar */}
      <Navbar 
        onOpenSettings={() => setShowSettingsModal(true)} 
      />

      <div className="flex-1 flex w-full">
        {/* Left Sidebar (Desktop - Panel 8) - Docked to screen edge */}
        <Sidebar 
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenHelp={() => setShowOnboarding(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 px-3 py-2 sm:px-6 sm:py-3 pb-16 sm:pb-4 lg:pb-6 min-w-0">
          <div className="max-w-5xl mx-auto">
          {currentScreen === 'dashboard' && (
            <HomeDashboard
              onStartLearning={() => setCurrentScreen('learn')}
              onOpenAudioMode={() => setShowAutoPlayModal(true)}
            />
          )}

          {currentScreen === 'learn' && (
            <StudyMode
              onOpenDetails={handleOpenDetails}
              onOpenAudioMode={() => setShowAutoPlayModal(true)}
            />
          )}

          {currentScreen === 'wordlist' && (
            <WordListView
              onOpenFilter={() => setShowFilterModal(true)}
              onOpenImport={() => setShowCsvImportModal(true)}
              onOpenDetails={handleOpenDetails}
              onAddNewWord={handleAddNewWord}
            />
          )}

          {currentScreen === 'review' && (
            <ReviewMode />
          )}

          {currentScreen === 'quiz' && (
            <QuizMode />
          )}

          {currentScreen === 'stats' && (
            <StatisticsView
              onOpenDailyGoalModal={() => setShowSettingsModal(true)}
            />
          )}
          </div>
        </main>
      </div>

      {/* Bottom Navigation (Mobile - Panels 2, 6, 7) */}
      <BottomNav />

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Modals */}
      {showFilterModal && (
        <FilterModal onClose={() => setShowFilterModal(false)} />
      )}

      {showCsvImportModal && (
        <CsvImportModal onClose={() => setShowCsvImportModal(false)} />
      )}

      {showEditWordModal && (
        <EditWordModal 
          wordToEdit={editingWord} 
          onClose={() => setShowEditWordModal(false)} 
        />
      )}

      {expandedWord && (
        <ExpandedWordModal
          word={expandedWord}
          onClose={() => setExpandedWord(null)}
          onStatusChange={(status: WordStatus) => {
            if (expandedWord.id) {
              handleWordStatusChange(expandedWord.id, status);
            }
          }}
        />
      )}

      {showAutoPlayModal && (
        <AutoPlayModal onClose={() => setShowAutoPlayModal(false)} />
      )}

      {showSettingsModal && (
        <SettingsModal onClose={() => setShowSettingsModal(false)} />
      )}

      {showOnboarding && (
        <OnboardingModal onClose={() => setShowOnboarding(false)} />
      )}

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <React.StrictMode>
      <AppContent />
    </React.StrictMode>
  );
};

export default App;

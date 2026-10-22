import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initializeDatabase, updateWordStatus, toggleFavorite } from '../db/database';
import { VocabularyWord, UserStats, ViewScreen, FilterOptions, WordStatus, LearningTrack } from '../types/vocabulary';

interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'undo';
  undoAction?: () => void;
}

interface AppContextType {
  words: VocabularyWord[];
  loading: boolean;
  learningTrack: LearningTrack;
  setLearningTrack: (track: LearningTrack) => void;
  userStats: UserStats | null;
  currentScreen: ViewScreen;
  setCurrentScreen: (screen: ViewScreen) => void;
  activeWordId: number | null;
  setActiveWordId: (id: number | null) => void;
  studyQueue: VocabularyWord[];
  setStudyQueue: (words: VocabularyWord[]) => void;
  filterOptions: FilterOptions;
  setFilterOptions: React.Dispatch<React.SetStateAction<FilterOptions>>;
  toasts: ToastMessage[];
  addToast: (msg: string, type?: ToastMessage['type'], undoAction?: () => void) => void;
  removeToast: (id: string) => void;
  handleWordStatusChange: (wordId: number, status: WordStatus) => Promise<void>;
  handleToggleFavorite: (wordId: number) => Promise<void>;
  toggleDarkMode: () => void;
  isDarkMode: boolean;
  refreshKey: number;
  triggerRefresh: () => void;
  statsBreakdown: {
    total: number;
    known: number;
    understand: number;
    new: number;
    a1: number;
    a2: number;
    b1: number;
    b2: number;
    c1: number;
    c2: number;
    knownPct: number;
    understandPct: number;
    newPct: number;
  };
}

const defaultFilterOptions: FilterOptions = {
  searchQuery: '',
  levels: [],
  statuses: [],
  partsOfSpeech: [],
  favoritesOnly: false,
  sortBy: 'default'
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [learningTrack, setLearningTrackState] = useState<LearningTrack>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vocabmaster_active_track') as LearningTrack;
      if (saved === 'vocabulary' || saved === 'phrases' || saved === 'prepositions' || saved === 'conjunctions' || saved === 'grammar') return saved;
    }
    return 'vocabulary';
  });

  const [currentScreen, setCurrentScreen] = useState<ViewScreen>(() => {
    if (typeof window !== 'undefined') {
      const hasChosen = localStorage.getItem('vocabmaster_has_chosen_track');
      if (!hasChosen) return 'portal';
    }
    return 'dashboard';
  });

  const [activeWordId, setActiveWordId] = useState<number | null>(null);
  const [studyQueue, setStudyQueue] = useState<VocabularyWord[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(defaultFilterOptions);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [dbReady, setDbReady] = useState<boolean>(false);

  const setLearningTrack = (track: LearningTrack) => {
    setLearningTrackState(track);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vocabmaster_active_track', track);
      localStorage.setItem('vocabmaster_has_chosen_track', 'true');
    }
    setRefreshKey(prev => prev + 1);
  };

  // Initialize DB
  useEffect(() => {
    initializeDatabase().then(() => {
      setDbReady(true);
    });
  }, []);

  // Dexie live queries (dynamically query Oxford words, Oxford phrases, English prepositions, Conjunctions, or Grammar)
  const words = useLiveQuery(
    () => {
      if (learningTrack === 'conjunctions') return db.conjunctions.toArray();
      if (learningTrack === 'grammar') return db.grammar.toArray();
      if (learningTrack === 'prepositions') return db.prepositions.toArray();
      if (learningTrack === 'phrases') return db.phrases.toArray();
      return db.words.toArray();
    },
    [refreshKey, dbReady, learningTrack]
  ) || [];
  const statsArray = useLiveQuery(() => db.userStats.toArray(), [refreshKey, dbReady]);
  const userStats = statsArray && statsArray.length > 0 ? statsArray[0] : null;

  // Dark mode effect
  useEffect(() => {
    if (userStats) {
      setIsDarkMode(userStats.darkMode);
      if (userStats.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [userStats]);

  const toggleDarkMode = async () => {
    if (!userStats) return;
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    await db.userStats.update(userStats.id!, { darkMode: newMode });
  };

  const addToast = (message: string, type: ToastMessage['type'] = 'info', undoAction?: () => void) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type, undoAction }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleWordStatusChange = async (wordId: number, status: WordStatus) => {
    const word = words.find(w => w.id === wordId);
    if (!word) return;

    const prevStatus = word.status;
    await updateWordStatus(wordId, status);

    addToast(
      `Marked "${word.word}" as ${status.toUpperCase()}`,
      status === 'known' ? 'success' : status === 'understand' ? 'warning' : 'info',
      () => {
        updateWordStatus(wordId, prevStatus);
        addToast(`Undone! Reverted "${word.word}" to ${prevStatus}`, 'info');
      }
    );
  };

  const handleToggleFavorite = async (wordId: number) => {
    const isFav = await toggleFavorite(wordId);
    addToast(isFav ? 'Added to favorites' : 'Removed from favorites', 'info');
  };

  // Pre-calculated stats
  const total = words.length;
  const known = words.filter(w => w.status === 'known').length;
  const understand = words.filter(w => w.status === 'understand').length;
  const newCount = words.filter(w => w.status === 'new').length;
  const a1 = words.filter(w => w.cefrLevel === 'A1').length;
  const a2 = words.filter(w => w.cefrLevel === 'A2').length;
  const b1 = words.filter(w => w.cefrLevel === 'B1').length;
  const b2 = words.filter(w => w.cefrLevel === 'B2').length;
  const c1 = words.filter(w => w.cefrLevel === 'C1').length;
  const c2 = words.filter(w => w.cefrLevel === 'C2').length;

  const knownPct = total > 0 ? Math.round((known / total) * 100) : 0;
  const understandPct = total > 0 ? Math.round((understand / total) * 100) : 0;
  const newPct = total > 0 ? Math.round((newCount / total) * 100) : 0;

  return (
    <AppContext.Provider
      value={{
        words,
        loading: !dbReady,
        learningTrack,
        setLearningTrack,
        userStats,
        currentScreen,
        setCurrentScreen,
        activeWordId,
        setActiveWordId,
        studyQueue,
        setStudyQueue,
        filterOptions,
        setFilterOptions,
        toasts,
        addToast,
        removeToast,
        handleWordStatusChange,
        handleToggleFavorite,
        toggleDarkMode,
        isDarkMode,
        refreshKey,
        triggerRefresh,
        statsBreakdown: {
          total,
          known,
          understand,
          new: newCount,
          a1,
          a2,
          b1,
          b2,
          c1,
          c2,
          knownPct,
          understandPct,
          newPct
        }
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

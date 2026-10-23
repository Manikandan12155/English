import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Play, 
  Pause, 
  Eye, 
  EyeOff, 
  RotateCcw,
  Sparkles,
  RefreshCw,
  Maximize2,
  Headphones,
  CheckCircle,
  HelpCircle,
  XCircle,
  Info,
  Globe,
  Shuffle,
  ArrowUpDown,
  ArrowDownAZ,
  ArrowUpZA,
  Minimize2,
  Target,
  Compass
} from 'lucide-react';
import { StartFromModal } from './StartFromModal';
import { useApp } from '../../context/AppContext';
import { VocabularyWord, WordStatus, CEFRLevel } from '../../types/vocabulary';
import { speechService } from '../../services/speechService';
import { dictionaryService, LiveDictionaryResult } from '../../services/dictionaryService';
import { explainWordWithGemini, getCachedAIMeaning, AIMeaningResult } from '../../services/geminiService';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import confetti from 'canvas-confetti';

const FULLSCREEN_GRADIENTS = [
  'from-indigo-600 via-purple-700 to-pink-600',
  'from-blue-600 via-indigo-700 to-violet-900',
  'from-emerald-600 via-teal-700 to-cyan-800',
  'from-rose-600 via-pink-700 to-purple-800',
  'from-violet-700 via-purple-900 to-slate-950',
  'from-teal-600 via-emerald-700 to-blue-800',
  'from-amber-600 via-orange-700 to-rose-800',
  'from-fuchsia-600 via-rose-700 to-indigo-800',
  'from-cyan-600 via-blue-700 to-purple-800',
  'from-slate-900 via-indigo-950 to-purple-950',
  'from-violet-600 via-pink-600 to-rose-600',
  'from-sky-600 via-teal-700 to-emerald-800'
];

interface StudyModeProps {
  onOpenDetails: (word: VocabularyWord) => void;
  onOpenAudioMode: () => void;
}

export const StudyMode: React.FC<StudyModeProps> = ({ onOpenDetails, onOpenAudioMode }) => {
  const { 
    words, 
    handleWordStatusChange, 
    handleToggleFavorite, 
    userStats, 
    setCurrentScreen,
    filterOptions,
    learningTrack,
    addToast
  } = useApp();

  // Load saved level from localStorage or default
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel | 'ALL'>(() => {
    if (typeof window !== 'undefined') {
      const savedLvl = localStorage.getItem(`vocabmaster_last_level_${learningTrack}`) as CEFRLevel | 'ALL' | null;
      if (savedLvl && (['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(savedLvl))) {
        return savedLvl;
      }
    }
    return filterOptions.levels.length === 1 ? filterOptions.levels[0] : 'ALL';
  });

  const [selectedStatus, setSelectedStatus] = useState<WordStatus | 'ALL'>('ALL');

  // Load saved index from localStorage
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const savedLvl = localStorage.getItem(`vocabmaster_last_level_${learningTrack}`) || 'ALL';
      const savedIdx = localStorage.getItem(`vocabmaster_last_index_${learningTrack}_${savedLvl}`);
      if (savedIdx !== null) {
        const parsed = parseInt(savedIdx, 10);
        if (!isNaN(parsed) && parsed >= 0) return parsed;
      }
    }
    return 0;
  });

  const [lastStudiedWord, setLastStudiedWord] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem(`vocabmaster_last_word_${learningTrack}`) : null;
  });

  // Collapsible detail sections: Meaning, Synonyms, Antonyms (Initial close by default)
  const [isMeaningOpen, setIsMeaningOpen] = useState<boolean>(false);
  const [isSynonymsOpen, setIsSynonymsOpen] = useState<boolean>(false);
  const [isAntonymsOpen, setIsAntonymsOpen] = useState<boolean>(false);

  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const autoPlayTimerRef = useRef<any>(null);

  // Shuffle, Sort, Alphabet & Start-From states
  const [isShuffled, setIsShuffled] = useState<boolean>(false);
  const [shuffleSeed, setShuffleSeed] = useState<number>(0);
  const [sortOrder, setSortOrder] = useState<'default' | 'az' | 'za'>('default');
  const [isFullscreenCard, setIsFullscreenCard] = useState<boolean>(false);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [showStartFromModal, setShowStartFromModal] = useState<boolean>(false);

  // Compute level counts
  const levelCounts = React.useMemo(() => {
    const counts: Record<string, number> = { ALL: words.length };
    (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).forEach(lvl => {
      counts[lvl] = words.filter(w => w.cefrLevel === lvl).length;
    });
    return counts;
  }, [words]);

  // Filter words by selected level, status & alphabet letter, with Shuffle and Alphabetical Sort
  const filteredWords = React.useMemo(() => {
    let list = words;
    if (selectedLevel !== 'ALL') {
      list = list.filter(w => w.cefrLevel === selectedLevel);
    }
    if (selectedStatus !== 'ALL') {
      list = list.filter(w => w.status === selectedStatus);
    }
    if (selectedLetter) {
      list = list.filter(w => (w.word || '').trim().toUpperCase().startsWith(selectedLetter));
    }

    if (isShuffled) {
      const copy = [...list];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }

    if (sortOrder === 'az') {
      return [...list].sort((a, b) => a.word.localeCompare(b.word));
    }
    if (sortOrder === 'za') {
      return [...list].sort((a, b) => b.word.localeCompare(a.word));
    }

    return list;
  }, [words, selectedLevel, selectedStatus, selectedLetter, isShuffled, shuffleSeed, sortOrder]);

  // Automatically align to the saved word once filteredWords load
  const hasAlignedSavedRef = useRef<boolean>(false);
  useEffect(() => {
    if (filteredWords.length > 0 && !hasAlignedSavedRef.current) {
      hasAlignedSavedRef.current = true;
      const savedWord = localStorage.getItem(`vocabmaster_last_word_${learningTrack}`);
      if (savedWord) {
        const foundIdx = filteredWords.findIndex(w => w.word.toLowerCase() === savedWord.toLowerCase());
        if (foundIdx >= 0) {
          setCurrentIndex(foundIdx);
          return;
        }
      }
      const savedIdx = localStorage.getItem(`vocabmaster_last_index_${learningTrack}_${selectedLevel}`);
      if (savedIdx !== null) {
        const parsed = parseInt(savedIdx, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed < filteredWords.length) {
          setCurrentIndex(parsed);
        }
      }
    }
  }, [filteredWords, learningTrack, selectedLevel]);

  // Automatically save current word and index to localStorage on every change
  const activeWord: VocabularyWord | undefined = filteredWords[currentIndex] || filteredWords[0];
  const totalWords = filteredWords.length;

  useEffect(() => {
    if (activeWord?.word) {
      localStorage.setItem(`vocabmaster_last_word_${learningTrack}`, activeWord.word);
      localStorage.setItem(`vocabmaster_last_level_${learningTrack}`, selectedLevel);
      localStorage.setItem(`vocabmaster_last_index_${learningTrack}_${selectedLevel}`, String(currentIndex));
      setLastStudiedWord(activeWord.word);
    }
  }, [currentIndex, activeWord?.word, learningTrack, selectedLevel]);

  // Reset all 3 sections (Meaning, Synonyms, Antonyms) to closed (false) initially on every word change
  useEffect(() => {
    setIsMeaningOpen(false);
    setIsSynonymsOpen(false);
    setIsAntonymsOpen(false);
  }, [activeWord?.word]);

  // Restore index for selected level when level changes
  const handleLevelChange = (lvl: CEFRLevel | 'ALL') => {
    setSelectedLevel(lvl);
    const savedIdx = localStorage.getItem(`vocabmaster_last_index_${learningTrack}_${lvl}`);
    if (savedIdx !== null) {
      const parsed = parseInt(savedIdx, 10);
      setCurrentIndex(!isNaN(parsed) && parsed >= 0 ? parsed : 0);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleStatusFilterChange = (st: WordStatus | 'ALL') => {
    setSelectedStatus(st);
    setCurrentIndex(0);
  };

  // Jump directly back to where the user left off
  const handleResumeLastWord = () => {
    const savedWord = localStorage.getItem(`vocabmaster_last_word_${learningTrack}`);
    const savedLvl = localStorage.getItem(`vocabmaster_last_level_${learningTrack}`) as CEFRLevel | 'ALL' | null;
    if (!savedWord) return;

    if (savedLvl && savedLvl !== selectedLevel) {
      setSelectedLevel(savedLvl);
    }

    const currentList = (savedLvl && savedLvl !== 'ALL')
      ? words.filter(w => w.cefrLevel === savedLvl)
      : words;

    const targetIdx = currentList.findIndex(w => w.word.toLowerCase() === savedWord.toLowerCase());
    if (targetIdx >= 0) {
      setCurrentIndex(targetIdx);
      if (addToast) addToast(`Resumed from "${savedWord}" (#${targetIdx + 1})`, 'info');
    }
  };

  // Start learning from specific alphabet letter
  const handleSelectLetter = (letter: string, filterOnly: boolean = false) => {
    if (filterOnly) {
      setSelectedLetter(letter.toUpperCase());
      setCurrentIndex(0);
      if (addToast) addToast(`Filtering words starting with "${letter.toUpperCase()}"`, 'info');
      return;
    }

    // Continuous learning: start from the first word of this letter
    if (selectedLetter !== null) {
      setSelectedLetter(null);
    }
    if (isShuffled) {
      setIsShuffled(false);
    }

    const targetIdx = filteredWords.findIndex(w => (w.word || '').trim().toUpperCase().startsWith(letter.toUpperCase()));
    if (targetIdx >= 0) {
      setCurrentIndex(targetIdx);
      const targetWord = filteredWords[targetIdx];
      if (addToast) {
        addToast(`Started from letter "${letter.toUpperCase()}" → "${targetWord.word}" (#${targetIdx + 1})`, 'info');
      }
    } else {
      const globalIdx = words.findIndex(w => (w.word || '').trim().toUpperCase().startsWith(letter.toUpperCase()));
      if (globalIdx >= 0) {
        setSelectedLevel('ALL');
        setTimeout(() => {
          const newIdx = words.findIndex(w => (w.word || '').trim().toUpperCase().startsWith(letter.toUpperCase()));
          if (newIdx >= 0) setCurrentIndex(newIdx);
        }, 50);
        if (addToast) {
          addToast(`Switched to ALL levels & started from letter "${letter.toUpperCase()}"`, 'info');
        }
      } else {
        if (addToast) addToast(`No words found starting with "${letter.toUpperCase()}"`, 'warning');
      }
    }
  };

  // Start learning from specific word
  const handleSelectWord = (word: VocabularyWord, _index: number) => {
    if (isShuffled) {
      setIsShuffled(false);
    }

    const currentIdx = filteredWords.findIndex(w => w.id === word.id || w.word.toLowerCase() === word.word.toLowerCase());
    if (currentIdx >= 0) {
      setCurrentIndex(currentIdx);
      if (addToast) addToast(`Started learning from "${word.word}" (#${currentIdx + 1})`, 'info');
      return;
    }

    if (selectedLetter) setSelectedLetter(null);
    if (selectedLevel !== 'ALL' && word.cefrLevel !== selectedLevel) {
      setSelectedLevel(word.cefrLevel);
    }

    setTimeout(() => {
      const idx = words.findIndex(w => w.id === word.id || w.word.toLowerCase() === word.word.toLowerCase());
      if (idx >= 0) {
        setCurrentIndex(idx);
        if (addToast) addToast(`Started learning from "${word.word}" (#${idx + 1})`, 'info');
      }
    }, 50);
  };

  // Live Dictionary API for active word
  const [liveCardData, setLiveCardData] = useState<LiveDictionaryResult | null>(null);
  const [loadingCardLive, setLoadingCardLive] = useState<boolean>(false);

  useEffect(() => {
    if (!activeWord?.word || activeWord.partOfSpeech === 'grammar') {
      setLiveCardData(null);
      setLoadingCardLive(false);
      return;
    }

    const cachedLive = dictionaryService.getCachedLiveDictionary(activeWord.word);
    if (cachedLive) {
      setLiveCardData(cachedLive);
      setLoadingCardLive(false);
      return;
    }

    let isMounted = true;
    setLiveCardData(null);
    setLoadingCardLive(true);
    dictionaryService.fetchLiveDictionary(activeWord.word).then(res => {
      if (isMounted) {
        setLoadingCardLive(false);
        setLiveCardData(res);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [activeWord?.word]);

  // Gemini AI Meaning State
  const [aiMeaning, setAiMeaning] = useState<AIMeaningResult | null>(null);
  const [showAIMeaning, setShowAIMeaning] = useState<boolean>(false);
  const [loadingAI, setLoadingAI] = useState<boolean>(false);

  useEffect(() => {
    if (!activeWord?.word) {
      setAiMeaning(null);
      setShowAIMeaning(false);
      setLoadingAI(false);
      return;
    }
    // If word was previously explained with AI, immediately load from persistent cache
    const cachedAI = getCachedAIMeaning(activeWord.word);
    if (cachedAI) {
      setAiMeaning(cachedAI);
      setShowAIMeaning(true);
    } else {
      setAiMeaning(null);
      setShowAIMeaning(false);
    }
    setLoadingAI(false);
  }, [activeWord?.word]);

  // Active definition index for words with multiple meanings
  const [activeDefIndex, setActiveDefIndex] = useState<number>(0);

  useEffect(() => {
    setActiveDefIndex(0);
  }, [activeWord?.word]);

  const handleNextDefinition = () => {
    if (liveCardData?.definitions && liveCardData.definitions.length > 1) {
      setActiveDefIndex(prev => (prev + 1) % liveCardData.definitions.length);
    }
  };

  // Synonyms and Antonyms extraction against active word
  const synonymsList = React.useMemo(() => {
    const set = new Set<string>();
    if (activeWord?.synonyms) activeWord.synonyms.forEach(s => set.add(s));
    if (liveCardData?.synonyms) liveCardData.synonyms.forEach(s => set.add(s));
    if (aiMeaning?.synonyms) aiMeaning.synonyms.forEach(s => set.add(s));
    return Array.from(set).filter(s => s && s.toLowerCase() !== activeWord?.word?.toLowerCase()).slice(0, 6);
  }, [activeWord, liveCardData, aiMeaning]);

  const antonymsList = React.useMemo(() => {
    const set = new Set<string>();
    if (activeWord?.antonyms) activeWord.antonyms.forEach(a => set.add(a));
    if (liveCardData?.antonyms) liveCardData.antonyms.forEach(a => set.add(a));
    if (aiMeaning?.antonyms) aiMeaning.antonyms.forEach(a => set.add(a));
    return Array.from(set).filter(a => a && a.toLowerCase() !== activeWord?.word?.toLowerCase()).slice(0, 6);
  }, [activeWord, liveCardData, aiMeaning]);

  // Close Fullscreen on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreenCard) {
        setIsFullscreenCard(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenCard]);

  const handleToggleAIMeaning = async () => {
    if (!activeWord) return;
    if (showAIMeaning) {
      setShowAIMeaning(false);
      return;
    }
    setShowAIMeaning(true);
    setIsMeaningOpen(true);
    if (!aiMeaning) {
      setLoadingAI(true);
      try {
        const res = await explainWordWithGemini(
          activeWord.word, 
          activeWord.cefrLevel, 
          activeWord.partOfSpeech
        );
        setAiMeaning(res);
      } catch (err) {
        console.warn('Gemini AI Meaning fetch error:', err);
      } finally {
        setLoadingAI(false);
      }
    }
  };

  const handleRegenerateAIMeaning = async () => {
    if (!activeWord) return;
    setLoadingAI(true);
    try {
      const res = await explainWordWithGemini(
        activeWord.word, 
        activeWord.cefrLevel, 
        activeWord.partOfSpeech,
        undefined,
        true // forceRefresh: clear cache and regenerate fresh explanation
      );
      setAiMeaning(res);
      setShowAIMeaning(true);
    } catch (err) {
      console.warn('Gemini AI Meaning regenerate error:', err);
    } finally {
      setLoadingAI(false);
    }
  };

  // Speak word
  const speakCurrentWord = () => {
    if (!activeWord) return;
    setIsPlayingAudio(true);
    speechService.speak(activeWord.word, userStats?.speechSpeed || 1.0, () => {
      setIsPlayingAudio(false);
    });
  };

  const handleNext = () => {
    if (currentIndex < totalWords - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Loop or celebrate
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      setCurrentIndex(0);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleStatusSelect = async (status: WordStatus) => {
    if (!activeWord || !activeWord.id) return;
    
    if (status === 'known') {
      // Minor burst of confetti if marking known
      confetti({ particleCount: 35, spread: 45, origin: { y: 0.8 } });
    }

    await handleWordStatusChange(activeWord.id, status);
    handleNext();
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onKnown: () => handleStatusSelect('known'),
    onUnderstand: () => handleStatusSelect('understand'),
    onNew: () => handleStatusSelect('new'),
    onNext: handleNext,
    onPrevious: handlePrevious,
    onTogglePlay: () => setIsAutoPlaying(prev => !prev),
    onSpeak: speakCurrentWord,
    enabled: true
  });

  // Auto-play loop
  useEffect(() => {
    if (isAutoPlaying) {
      speakCurrentWord();
      const intervalSec = userStats?.autoPlayInterval || 3;
      autoPlayTimerRef.current = setTimeout(() => {
        handleNext();
      }, intervalSec * 1000);
    } else {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    }

    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, [isAutoPlaying, currentIndex]);

  const levelColorMap: Record<CEFRLevel, string> = {
    A1: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    A2: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    B1: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800',
    B2: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    C1: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    C2: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/60 dark:text-fuchsia-300 border-fuchsia-300 dark:border-fuchsia-800',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-2 sm:space-y-2.5 pb-2 sm:pb-4 pt-0.5">
      
      {/* Unified Learning Header & Level Bar (Mobile Optimized) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
        
        {/* Top Info Row: Level Title, Word Counter & Audio Button */}
        <div className="flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-extrabold text-slate-800 dark:text-slate-100 truncate">
              {selectedLevel === 'ALL' 
                ? (learningTrack === 'grammar' ? 'All Grammar Topics' : learningTrack === 'conjunctions' ? 'All Conjunctions' : learningTrack === 'prepositions' ? 'All Prepositions' : learningTrack === 'phrases' ? 'All Oxford Phrases' : 'All Oxford Words') 
                : `Level ${selectedLevel}`}
            </span>
            {activeWord && (
              <span className={`font-black px-2 py-0.5 rounded-full border text-[10px] ${levelColorMap[activeWord.cefrLevel]}`}>
                {activeWord.cefrLevel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowStartFromModal(true)}
              title="Click to jump to any word or alphabet letter"
              className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 tabular-nums font-bold underline decoration-dotted underline-offset-2 transition"
            >
              {totalWords > 0 ? `${currentIndex + 1} / ${totalWords}` : '0 words'}
            </button>
            <button
              onClick={onOpenAudioMode}
              title="Launch Immersive Audio Mode"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition font-bold text-[11px]"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Audio</span>
            </button>
          </div>
        </div>

        {/* Progress Track */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: totalWords > 0 ? `${Math.round(((currentIndex + 1) / totalWords) * 100)}%` : '0%' }}
          />
        </div>

        {/* Level Pills: 7-Column Responsive Grid - ALL 7 levels visible without scrolling */}
        <div className="grid grid-cols-7 gap-1 w-full pt-0.5">
          {(['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).map(lvl => {
            const isSelected = selectedLevel === lvl;
            const count = levelCounts[lvl] || 0;
            return (
              <button
                key={lvl}
                onClick={() => handleLevelChange(lvl)}
                className={`w-full py-1.5 px-0.5 rounded-xl font-bold transition flex flex-col items-center justify-center border text-center ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-800 hover:border-indigo-400'
                }`}
              >
                <span className="text-[11px] sm:text-xs font-black leading-tight">{lvl}</span>
                <span className={`text-[9px] sm:text-[10px] ${isSelected ? 'text-indigo-100' : 'text-slate-400'} tabular-nums leading-tight mt-0.5`}>
                  {count > 999 ? `${(count/1000).toFixed(1)}k` : count}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {!activeWord ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
          <p className="font-bold text-slate-700 dark:text-slate-300">
            No words found for Level {selectedLevel}.
          </p>
          <button
            onClick={() => handleLevelChange('ALL')}
            className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow transition hover:bg-indigo-500"
          >
            Show All Levels
          </button>
        </div>
      ) : (
        <>
          {/* Top Navigation & Auto Play Controls - Right below Level Bar */}
          <div className="flex items-center justify-between p-1.5 sm:p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm gap-2">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 px-3 sm:px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition font-semibold text-xs sm:text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev</span>
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Resume / Continue from last studied word button */}
              {lastStudiedWord && lastStudiedWord.toLowerCase() !== activeWord?.word?.toLowerCase() && (
                <button
                  onClick={handleResumeLastWord}
                  title={`Jump back to where you left off: ${lastStudiedWord}`}
                  className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900 transition font-bold text-[11px] sm:text-xs shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span className="hidden xs:inline">Resume:</span>
                  <span className="truncate max-w-[80px] sm:max-w-[120px] underline">{lastStudiedWord}</span>
                </button>
              )}

              {/* Auto Play / Pause Toggle */}
              <button
                onClick={() => setIsAutoPlaying(prev => !prev)}
                className={`flex items-center gap-1.5 px-3.5 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition shadow-sm ${
                  isAutoPlaying
                    ? 'bg-amber-500 text-white'
                    : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100'
                }`}
              >
                {isAutoPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                    <span>Auto Play</span>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-3 sm:px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition font-semibold text-xs sm:text-sm"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Main Vocabulary Card (Panels 3 & 8) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        
        {/* Card Header: Level, POS, Star, Expand */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${levelColorMap[activeWord.cefrLevel]}`}>
              {activeWord.cefrLevel}
            </span>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
              {activeWord.partOfSpeech}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* 1. Shuffle Option with Icon */}
            <button
              onClick={() => {
                setIsShuffled(prev => !prev);
                if (!isShuffled) setSortOrder('default');
                setShuffleSeed(Date.now());
                setCurrentIndex(0);
                if (addToast) addToast(!isShuffled ? '🔀 Words Shuffled randomly' : 'Shuffle turned off', 'info');
              }}
              title={isShuffled ? "Shuffle active (Click to turn off)" : "Shuffle words randomly"}
              className={`p-1.5 sm:p-2 rounded-xl transition ${
                isShuffled
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 ring-2 ring-purple-400 font-bold'
                  : 'text-slate-400 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Shuffle className={`w-4 h-4 sm:w-5 sm:h-5 ${isShuffled ? 'stroke-[2.5]' : ''}`} />
            </button>

            {/* 2. Alphabetical Sort Option with Icon */}
            <button
              onClick={() => {
                setIsShuffled(false);
                const nextSort = sortOrder === 'default' ? 'az' : sortOrder === 'az' ? 'za' : 'default';
                setSortOrder(nextSort);
                setCurrentIndex(0);
                if (addToast) {
                  addToast(nextSort === 'az' ? '🔤 Sorted A to Z' : nextSort === 'za' ? '🔤 Sorted Z to A' : 'Default word order', 'info');
                }
              }}
              title={`Alphabetical Sort: ${sortOrder === 'default' ? 'Default (Click for A-Z)' : sortOrder === 'az' ? 'A to Z (Click for Z-A)' : 'Z to A (Click for Default)'}`}
              className={`p-1.5 sm:p-2 rounded-xl transition ${
                sortOrder !== 'default'
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 ring-2 ring-indigo-400 font-bold'
                  : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {sortOrder === 'az' ? (
                <ArrowDownAZ className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              ) : sortOrder === 'za' ? (
                <ArrowUpZA className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              ) : (
                <ArrowUpDown className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>

            {/* 3. Start From Word or Alphabet Button */}
            <button
              onClick={() => setShowStartFromModal(true)}
              title="Set starting word or alphabet letter"
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Target className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Toggle Show/Hide All Details (Meaning, Synonyms, Antonyms) */}
            <button
              onClick={() => {
                const anyOpen = isMeaningOpen || isSynonymsOpen || isAntonymsOpen;
                const next = !anyOpen;
                setIsMeaningOpen(next);
                setIsSynonymsOpen(next);
                setIsAntonymsOpen(next);
              }}
              title={(isMeaningOpen || isSynonymsOpen || isAntonymsOpen) ? "Hide Details (Active Recall)" : "Reveal All Details (Meaning, Synonyms, Antonyms)"}
              className={`p-1.5 sm:p-2 rounded-xl transition ${
                (isMeaningOpen || isSynonymsOpen || isAntonymsOpen)
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {(isMeaningOpen || isSynonymsOpen || isAntonymsOpen) ? (
                <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
              ) : (
                <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
            <button
              onClick={() => activeWord.id && handleToggleFavorite(activeWord.id)}
              className={`p-1.5 sm:p-2 rounded-xl transition ${
                activeWord.isFavorite
                  ? 'text-amber-400 fill-amber-400 bg-amber-50 dark:bg-amber-950/50'
                  : 'text-slate-400 hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Star className={`w-4 h-4 sm:w-5 sm:h-5 ${activeWord.isFavorite ? 'fill-current' : ''}`} />
            </button>
            
            {/* 3. Fullscreen Expand button */}
            <button
              onClick={() => setIsFullscreenCard(true)}
              title="Expand Full Screen Mode (Word card + Random Colors)"
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Word + Audio Section */}
        <div className="text-center my-1.5 sm:my-2.5">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
            {activeWord.word}
          </h1>

          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <span className="text-slate-500 dark:text-slate-400 font-mono text-sm sm:text-base">
              {activeWord.pronunciation || '/.../'}
            </span>
            <button
              onClick={speakCurrentWord}
              title="Listen pronunciation (Press 'S')"
              className={`p-1.5 sm:p-2 rounded-full transition-all ${
                isPlayingAudio 
                  ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-600/30' 
                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900'
              }`}
            >
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Meaning & Example Content */}
        <div className="space-y-2 sm:space-y-2.5 my-2 sm:my-3">
          
          {/* 1. Meaning Block (Collapsible - Initial closed by default) */}
          <div className="rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800/80 transition-all overflow-hidden">
            {/* Header: Click to open/close */}
            <div 
              onClick={() => setIsMeaningOpen(prev => !prev)}
              className="p-3 sm:p-4 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100/60 dark:hover:bg-slate-800/90 transition"
            >
              <div className="flex items-center gap-2">
                <span className={`p-1 rounded-lg bg-slate-200/70 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 transition-transform duration-200 ${isMeaningOpen ? 'rotate-180' : ''}`}>
                  <ChevronDown className="w-3.5 h-3.5" />
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Meaning
                </span>
                {!isMeaningOpen && (
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold ml-1 animate-pulse">
                    • Tap to reveal
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                {/*AI Meaning Button */}
                <button
                  onClick={handleToggleAIMeaning}
                  className={`text-[10px] sm:text-[11px] font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg transition shadow-sm ${
                    showAIMeaning
                      ? 'bg-amber-500 text-white shadow-amber-500/20'
                      : 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 text-amber-700 dark:text-amber-300 border border-amber-300/50 dark:border-amber-700/50'
                  }`}
                  title="Explain this word in super simple terms using Gemini AI"
                >
                  <Sparkles className={`w-3 h-3 ${loadingAI ? 'animate-spin' : 'text-amber-500'}`} />
                  <span>{loadingAI ? 'AI Explaining...' : ' AI Meaning'}</span>
                </button>
              </div>
            </div>

            {/* Meaning Body (Visible only when isMeaningOpen is true) */}
            {isMeaningOpen && (
              <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-1 border-t border-slate-200/40 dark:border-slate-800/60 space-y-2 animate-fade-in">
                {liveCardData?.definitions && liveCardData.definitions.length > 0 ? (
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-start gap-1.5 flex-1">
                        <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold uppercase text-[9px] shrink-0 mt-0.5">
                          {liveCardData.definitions[activeDefIndex % liveCardData.definitions.length].partOfSpeech}
                        </span>
                        <p className="text-sm sm:text-base text-slate-800 dark:text-slate-100 font-medium leading-relaxed">
                          {liveCardData.definitions[activeDefIndex % liveCardData.definitions.length].definition}
                        </p>
                      </div>
                      {liveCardData.definitions.length > 1 && (
                        <button
                          onClick={handleNextDefinition}
                          className="px-1.5 py-0.5 rounded text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center gap-1 shrink-0 font-medium transition"
                          title="Show alternative dictionary meaning"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>{(activeDefIndex % liveCardData.definitions.length) + 1}/{liveCardData.definitions.length}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm sm:text-base text-slate-800 dark:text-slate-100 font-medium leading-relaxed">
                    {loadingCardLive ? 'Loading definition from Live API...' : activeWord.meaning}
                  </p>
                )}

                {/* Loading AI State */}
                {loadingAI && (
                  <div className="mt-2 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-center gap-2 text-xs text-amber-700 dark:text-amber-300 animate-pulse">
                    <Sparkles className="w-4 h-4 animate-spin text-amber-500" />
                    <span>Gemini AI is generating a fresh, simpler explanation...</span>
                  </div>
                )}

                {/* Gemini AI Meaning Card */}
                {showAIMeaning && aiMeaning && (
                  <div className="mt-2.5 p-3.5 rounded-xl bg-gradient-to-br from-amber-50/90 to-orange-50/70 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-800/60 text-xs space-y-2 animate-fade-in shadow-sm">
                    <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 font-bold text-[11px] pb-1 border-b border-amber-200/60 dark:border-amber-800/40">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Gemini AI Tutor</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRegenerateAIMeaning();
                        }}
                        disabled={loadingAI}
                        className="p-1.5 rounded-lg bg-amber-200/70 hover:bg-amber-300 dark:bg-amber-900/70 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-100 flex items-center justify-center transition shadow-xs active:scale-95"
                        title="Refresh Answer (Generate alternative explanation)"
                        aria-label="Refresh Answer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingAI ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-amber-100 leading-relaxed">
                        {aiMeaning.simpleMeaning}
                      </p>
                    </div>

                    {aiMeaning.realLifeExample && (
                      <div className="pt-1">
                        <span className="font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase block mb-0.5">
                          Daily Life Example:
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 italic">
                          "{aiMeaning.realLifeExample}"
                        </p>
                      </div>
                    )}

                    {aiMeaning.memoryTip && (
                      <div className="pt-1.5 border-t border-amber-200/60 dark:border-amber-800/40">
                        <span className="font-bold text-amber-700 dark:text-amber-400 text-[10px] block mb-0.5">
                          💡 Memory Trick (Mnemonic):
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 text-[11px]">
                          {aiMeaning.memoryTip}
                        </p>
                      </div>
                    )}

                    {aiMeaning.whenToUse && (
                      <div className="pt-1 text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="font-bold">When to use:</span> {aiMeaning.whenToUse}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2 & 3. Synonyms & Antonyms (Collapsible - Always visible on card, initial closed by default) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 animate-fade-in">
            {/* Synonyms Card */}
            <div className="rounded-xl sm:rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50 overflow-hidden transition-all">
              {/* Header: Click to toggle */}
              <div
                onClick={() => setIsSynonymsOpen(prev => !prev)}
                className="p-3 flex items-center justify-between cursor-pointer select-none hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span className={`p-1 rounded-lg bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 transition-transform duration-200 ${isSynonymsOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-3 h-3" />
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Synonyms (Same Meaning)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-200/70 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-200">
                    {synonymsList.length}
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">
                    {isSynonymsOpen ? 'Hide' : 'Show'}
                  </span>
                </div>
              </div>

              {/* Body: Visible only when isSynonymsOpen is true */}
              {isSynonymsOpen && (
                <div className="px-3 pb-3 pt-1 border-t border-emerald-200/50 dark:border-emerald-900/50 animate-fade-in">
                  {synonymsList.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {synonymsList.map(syn => (
                        <span
                          key={syn}
                          className="px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-100 font-bold text-xs border border-emerald-300/70 dark:border-emerald-700 shadow-xs"
                        >
                          {syn}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 italic py-1">
                      No direct synonyms recorded for this word.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Antonyms Card */}
            <div className="rounded-xl sm:rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-800/50 overflow-hidden transition-all">
              {/* Header: Click to toggle */}
              <div
                onClick={() => setIsAntonymsOpen(prev => !prev)}
                className="p-3 flex items-center justify-between cursor-pointer select-none hover:bg-rose-100/50 dark:hover:bg-rose-900/30 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span className={`p-1 rounded-lg bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 transition-transform duration-200 ${isAntonymsOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-3 h-3" />
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 dark:text-rose-300">
                    Antonyms (Opposite Meaning)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-200/70 dark:bg-rose-900/70 text-rose-800 dark:text-rose-200">
                    {antonymsList.length}
                  </span>
                  <span className="text-[10px] text-rose-700 dark:text-rose-300 font-semibold">
                    {isAntonymsOpen ? 'Hide' : 'Show'}
                  </span>
                </div>
              </div>

              {/* Body: Visible only when isAntonymsOpen is true */}
              {isAntonymsOpen && (
                <div className="px-3 pb-3 pt-1 border-t border-rose-200/50 dark:border-rose-900/50 animate-fade-in">
                  {antonymsList.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {antonymsList.map(ant => (
                        <span
                          key={ant}
                          className="px-2.5 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-900 dark:text-rose-100 font-bold text-xs border border-rose-300/70 dark:border-rose-700 shadow-xs"
                        >
                          {ant}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-rose-800/80 dark:text-rose-300/80 italic py-1">
                      No direct antonyms recorded for this word.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Keyboard shortcut hint banner (hidden on touch devices) */}
        <div className="hidden sm:flex items-center justify-center gap-4 text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border">1</kbd> Known</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border">2</kbd> Understand</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border">3</kbd> New</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border">Space</kbd> Play/Pause</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border">→</kbd> Next</span>
        </div>

      </div>

      {/* 3 Prominent Status Action Buttons - matching Panel 3 & 8 */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        
        {/* Known Button */}
        <button
          onClick={() => handleStatusSelect('known')}
          className="group p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white flex flex-col items-center justify-center shadow-md shadow-emerald-500/20 transition-all duration-150"
        >
          <div className="flex items-center gap-1 sm:gap-1.5 font-bold text-xs sm:text-sm">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
            <span>Known</span>
          </div>
          <span className="text-[9px] sm:text-[11px] opacity-80 mt-0.5 font-normal hidden sm:block">
            (I know this well)
          </span>
        </button>

        {/* Understand Button */}
        <button
          onClick={() => handleStatusSelect('understand')}
          className="group p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white flex flex-col items-center justify-center shadow-md shadow-amber-500/20 transition-all duration-150"
        >
          <div className="flex items-center gap-1 sm:gap-1.5 font-bold text-xs sm:text-sm">
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
            <span>Understand</span>
          </div>
          <span className="text-[9px] sm:text-[11px] opacity-80 mt-0.5 font-normal hidden sm:block">
            (Need practice)
          </span>
        </button>

        {/* New Button */}
        <button
          onClick={() => handleStatusSelect('new')}
          className="group p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white flex flex-col items-center justify-center shadow-md shadow-rose-500/20 transition-all duration-150"
        >
          <div className="flex items-center gap-1 sm:gap-1.5 font-bold text-xs sm:text-sm">
            <XCircle className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
            <span>New</span>
          </div>
          <span className="text-[9px] sm:text-[11px] opacity-80 mt-0.5 font-normal hidden sm:block">
            (Don't know yet)
          </span>
        </button>

      </div>
      </>
    )}

      {/* 3. Full Screen Mode Modal (Text Name, Card only, Random background colors) */}
      {isFullscreenCard && activeWord && (
        <div className={`fixed inset-0 z-50 flex flex-col justify-between p-4 sm:p-8 md:p-12 bg-gradient-to-br ${
          FULLSCREEN_GRADIENTS[Math.abs(((activeWord.word.charCodeAt(0) || 0) * 7 + currentIndex) % FULLSCREEN_GRADIENTS.length)]
        } text-white animate-fade-in overflow-y-auto`}>
          {/* Header Bar */}
          <div className="flex items-center justify-between w-full max-w-4xl mx-auto">
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md font-black text-xs sm:text-sm border border-white/30 shadow-sm">
                {activeWord.cefrLevel}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md font-semibold text-xs capitalize border border-white/20">
                {activeWord.partOfSpeech}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm font-bold bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/30 tabular-nums">
                {currentIndex + 1} / {totalWords}
              </span>
              <button
                onClick={() => setIsFullscreenCard(false)}
                className="p-2 sm:p-2.5 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition active:scale-95 border border-white/30 shadow-lg"
                title="Exit Full Screen (Esc)"
              >
                <Minimize2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* Center: Big Text Word Name & Card */}
          <div className="w-full max-w-3xl mx-auto my-auto py-4 sm:py-8 space-y-6 text-center">
            <div>
              <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight drop-shadow-2xl text-white">
                {activeWord.word}
              </h1>
              <div className="flex items-center justify-center gap-3 mt-3">
                <span className="font-mono text-lg sm:text-xl text-white/80">
                  {activeWord.pronunciation || '/.../'}
                </span>
                <button
                  onClick={speakCurrentWord}
                  className="p-2.5 sm:p-3 rounded-full bg-white/25 hover:bg-white/35 backdrop-blur-md text-white transition active:scale-95 border border-white/30 shadow-lg"
                  title="Listen pronunciation"
                >
                  <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            {/* Clean Glassmorphic Card */}
            <div className="bg-black/30 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl text-left space-y-4">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-white/60 block mb-1">
                  Meaning
                </span>
                <p className="text-lg sm:text-2xl font-bold text-white leading-relaxed">
                  {liveCardData?.definitions?.[0]?.definition || activeWord.meaning}
                </p>
              </div>

              {/* Synonyms & Antonyms in Fullscreen Card */}
              {(synonymsList.length > 0 || antonymsList.length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/15">
                  {synonymsList.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 block">
                        Synonyms
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {synonymsList.map(s => (
                          <span key={s} className="px-2.5 py-1 rounded-xl bg-emerald-500/30 backdrop-blur-md border border-emerald-400/40 text-white font-bold text-xs sm:text-sm">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {antonymsList.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-black uppercase tracking-wider text-rose-300 block">
                        Antonyms
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {antonymsList.map(a => (
                          <span key={a} className="px-2.5 py-1 rounded-xl bg-rose-500/30 backdrop-blur-md border border-rose-400/40 text-white font-bold text-xs sm:text-sm">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AI Explanation in Fullscreen if loaded */}
              {aiMeaning && (
                <div className="p-3.5 rounded-2xl bg-amber-500/20 backdrop-blur-md border border-amber-300/30 text-amber-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gemini AI Tutor</span>
                  </div>
                  <p className="text-sm sm:text-base font-semibold text-white">
                    {aiMeaning.simpleMeaning}
                  </p>
                  {aiMeaning.realLifeExample && (
                    <p className="text-xs italic text-amber-200/90 pt-1">
                      "{aiMeaning.realLifeExample}"
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Actions Bar */}
          <div className="w-full max-w-2xl mx-auto flex items-center justify-between gap-3 pt-4">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="flex items-center gap-1.5 px-4 sm:px-6 py-3 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md disabled:opacity-30 disabled:pointer-events-none transition font-bold text-sm sm:text-base border border-white/25 active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Prev</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStatusSelect('known')}
                className="px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-900/40 active:scale-95 transition"
              >
                Known
              </button>
              <button
                onClick={() => handleStatusSelect('understand')}
                className="px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs sm:text-sm shadow-lg shadow-amber-900/40 active:scale-95 transition"
              >
                Understand
              </button>
              <button
                onClick={() => handleStatusSelect('new')}
                className="px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs sm:text-sm shadow-lg shadow-rose-900/40 active:scale-95 transition"
              >
                New
              </button>
            </div>

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 sm:px-6 py-3 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md transition font-bold text-sm sm:text-base border border-white/25 active:scale-95"
            >
              <span>Next</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Start From Word / Alphabet Modal */}
      {showStartFromModal && (
        <StartFromModal
          words={words}
          currentIndex={currentIndex}
          selectedLetterFilter={selectedLetter}
          onSelectWord={handleSelectWord}
          onSelectLetter={handleSelectLetter}
          onClearLetterFilter={() => setSelectedLetter(null)}
          onClose={() => setShowStartFromModal(false)}
        />
      )}

    </div>
  );
};

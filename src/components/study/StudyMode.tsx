import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
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
  Globe
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { VocabularyWord, WordStatus, CEFRLevel } from '../../types/vocabulary';
import { speechService } from '../../services/speechService';
import { dictionaryService, LiveDictionaryResult } from '../../services/dictionaryService';
import { explainWordWithGemini, getCachedAIMeaning, AIMeaningResult } from '../../services/geminiService';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import confetti from 'canvas-confetti';

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
    learningTrack
  } = useApp();

  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel | 'ALL'>(
    filterOptions.levels.length === 1 ? filterOptions.levels[0] : 'ALL'
  );
  const [selectedStatus, setSelectedStatus] = useState<WordStatus | 'ALL'>('ALL');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [hideMeaning, setHideMeaning] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const autoPlayTimerRef = useRef<any>(null);

  // Compute level counts
  const levelCounts = React.useMemo(() => {
    const counts: Record<string, number> = { ALL: words.length };
    (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).forEach(lvl => {
      counts[lvl] = words.filter(w => w.cefrLevel === lvl).length;
    });
    return counts;
  }, [words]);

  // Filter words by selected level & status
  const filteredWords = React.useMemo(() => {
    let list = words;
    if (selectedLevel !== 'ALL') {
      list = list.filter(w => w.cefrLevel === selectedLevel);
    }
    if (selectedStatus !== 'ALL') {
      list = list.filter(w => w.status === selectedStatus);
    }
    return list;
  }, [words, selectedLevel, selectedStatus]);

  // Reset index when level/status filter changes
  const handleLevelChange = (lvl: CEFRLevel | 'ALL') => {
    setSelectedLevel(lvl);
    setCurrentIndex(0);
  };

  const handleStatusFilterChange = (st: WordStatus | 'ALL') => {
    setSelectedStatus(st);
    setCurrentIndex(0);
  };

  const activeWord: VocabularyWord | undefined = filteredWords[currentIndex] || filteredWords[0];
  const totalWords = filteredWords.length;

  // Live Dictionary API for active word
  const [liveCardData, setLiveCardData] = useState<LiveDictionaryResult | null>(null);
  const [loadingCardLive, setLoadingCardLive] = useState<boolean>(false);

  useEffect(() => {
    if (!activeWord?.word) {
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

  const handleToggleAIMeaning = async () => {
    if (!activeWord) return;
    if (showAIMeaning) {
      setShowAIMeaning(false);
      return;
    }
    setShowAIMeaning(true);
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
    <div className="max-w-3xl mx-auto space-y-2.5 sm:space-y-3 pb-28 lg:pb-8 pt-0.5">
      
      {/* Unified Learning Header & Level Bar (Mobile Optimized) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
        
        {/* Top Info Row: Level Title, Word Counter & Audio Button */}
        <div className="flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-extrabold text-slate-800 dark:text-slate-100 truncate">
              {selectedLevel === 'ALL' 
                ? (learningTrack === 'conjunctions' ? 'All Conjunctions' : learningTrack === 'prepositions' ? 'All Prepositions' : learningTrack === 'phrases' ? 'All Oxford Phrases' : 'All Oxford Words') 
                : `Level ${selectedLevel}`}
            </span>
            {activeWord && (
              <span className={`font-black px-2 py-0.5 rounded-full border text-[10px] ${levelColorMap[activeWord.cefrLevel]}`}>
                {activeWord.cefrLevel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums font-bold">
              {totalWords > 0 ? `${currentIndex + 1} / ${totalWords}` : '0 words'}
            </span>
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
          {/* Main Vocabulary Card (Panels 3 & 8) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        
        {/* Card Header: Level, POS, Star, Expand */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${levelColorMap[activeWord.cefrLevel]}`}>
              {activeWord.cefrLevel}
            </span>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
              {activeWord.partOfSpeech}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setHideMeaning(prev => !prev)}
              title={hideMeaning ? "Reveal Meaning" : "Hide Meaning for Recall"}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {hideMeaning ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
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
            <button
              onClick={() => onOpenDetails(activeWord)}
              title="Expand Details"
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Word + Audio Section */}
        <div className="text-center my-3 sm:my-5">
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-1.5">
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
        <div className="space-y-2.5 sm:space-y-4 my-3 sm:my-5">
          
          {/* Meaning Block */}
          <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800/80 transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Meaning
              </span>
              <div className="flex items-center gap-1.5">
                {/* ✨ AI Meaning Button */}
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
                  <span>{loadingAI ? 'AI Explaining...' : '✨ AI Meaning'}</span>
                </button>
              </div>
            </div>

            {hideMeaning ? (
              <div 
                onClick={() => setHideMeaning(false)}
                className="py-2 text-center cursor-pointer text-indigo-600 dark:text-indigo-400 font-semibold text-xs sm:text-sm hover:underline"
              >
                Click to reveal meaning (Test recall)
              </div>
            ) : (
              <div className="space-y-1.5">
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

      {/* Navigation & Auto Play Controls - matching Panel 3 & 8 */}
      <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 px-3 sm:px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition font-semibold text-xs sm:text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Prev</span>
        </button>

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

        <button
          onClick={handleNext}
          className="flex items-center gap-1 px-3 sm:px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition font-semibold text-xs sm:text-sm"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>

      </div>
      </>
    )}

    </div>
  );
};

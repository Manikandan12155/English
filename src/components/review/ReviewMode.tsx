import React, { useState } from 'react';
import { 
  ChevronRight, 
  RotateCw, 
  Sparkles, 
  BrainCircuit, 
  Shuffle, 
  Volume2, 
  CheckCircle2, 
  HelpCircle, 
  XCircle, 
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { VocabularyWord, WordStatus } from '../../types/vocabulary';
import { speechService } from '../../services/speechService';
import confetti from 'canvas-confetti';

export const ReviewMode: React.FC = () => {
  const { words, statsBreakdown, handleWordStatusChange, userStats } = useApp();

  // Active review session state
  const [activeSession, setActiveSession] = useState<{
    title: string;
    queue: VocabularyWord[];
  } | null>(null);

  const [sessionIndex, setSessionIndex] = useState<number>(0);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);

  // Filter queues
  const startQueueSession = (type: 'new' | 'understand' | 'known' | 'all' | 'weak' | 'srs' | 'random') => {
    let queue: VocabularyWord[] = [];
    let title = '';

    switch (type) {
      case 'new':
        queue = words.filter(w => w.status === 'new');
        title = 'Review: New Words Only';
        break;
      case 'understand':
        queue = words.filter(w => w.status === 'understand');
        title = 'Review: Understand Only';
        break;
      case 'known':
        queue = words.filter(w => w.status === 'known');
        title = 'Review: Known Words Refresh';
        break;
      case 'all':
        queue = [...words];
        title = 'Review: All Vocabulary';
        break;
      case 'weak':
        // words with mistakeCount > 0 or status == understand
        queue = words.filter(w => (w.mistakeCount && w.mistakeCount > 0) || w.status === 'understand');
        if (queue.length === 0) queue = words.filter(w => w.status === 'understand');
        title = 'Smart Review: Weak Words';
        break;
      case 'srs':
        const now = Date.now();
        queue = words.filter(w => !w.nextReviewAt || w.nextReviewAt <= now);
        if (queue.length === 0) queue = words.slice(0, 10);
        title = 'Smart Review: Spaced Repetition';
        break;
      case 'random':
        queue = [...words].sort(() => Math.random() - 0.5);
        title = 'Smart Review: Random Mix';
        break;
    }

    if (queue.length === 0) {
      alert('No words found in this category right now! Try another category.');
      return;
    }

    setActiveSession({ title, queue });
    setSessionIndex(0);
    setShowAnswer(false);
  };

  const handleReviewAnswer = async (status: WordStatus) => {
    if (!activeSession) return;
    const currentWord = activeSession.queue[sessionIndex];
    if (currentWord && currentWord.id) {
      await handleWordStatusChange(currentWord.id, status);
    }

    if (sessionIndex < activeSession.queue.length - 1) {
      setSessionIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      alert('Session Complete! Great job reviewing your vocabulary.');
      setActiveSession(null);
    }
  };

  const currentWord = activeSession?.queue[sessionIndex];

  // If in active session, show Flashcard Recall screen
  if (activeSession && currentWord) {
    return (
      <div className="max-w-2xl mx-auto space-y-5 pb-20 lg:pb-8 pt-2">
        {/* Session Top Bar */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <button
            onClick={() => setActiveSession(null)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Exit Review</span>
          </button>
          <div className="text-center">
            <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400 block">{activeSession.title}</span>
            <span className="text-[11px] text-slate-400">{sessionIndex + 1} of {activeSession.queue.length}</span>
          </div>
          <div className="w-16" />
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.round(((sessionIndex + 1) / activeSession.queue.length) * 100)}%` }}
          />
        </div>

        {/* Flashcard Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center relative overflow-hidden min-h-[340px] flex flex-col justify-between">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              {currentWord.cefrLevel}
            </span>
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
              {currentWord.partOfSpeech}
            </span>
          </div>

          <div className="my-6 space-y-3">
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              {currentWord.word}
            </h2>
            <div className="flex items-center justify-center gap-2">
              <span className="font-mono text-slate-400 text-sm">
                {currentWord.pronunciation || '/.../'}
              </span>
              <button
                onClick={() => speechService.speak(currentWord.word, userStats?.speechSpeed || 1.0)}
                className="p-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Reveal Meaning Button / Answer Section */}
          <div>
            {!showAnswer ? (
              <button
                onClick={() => setShowAnswer(true)}
                className="py-3 px-6 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 font-bold text-sm transition border border-indigo-200 dark:border-indigo-800 flex items-center gap-2 mx-auto"
              >
                <Eye className="w-4 h-4" />
                <span>Show Meaning & Example</span>
              </button>
            ) : (
              <div className="space-y-3 animate-fade-in text-left bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Meaning</span>
                  <p className="text-base text-slate-900 dark:text-white font-medium">{currentWord.meaning}</p>
                </div>
                {currentWord.exampleSentence && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Example</span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic">"{currentWord.exampleSentence}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Rating Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleReviewAnswer('known')}
            className="p-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md flex flex-col items-center justify-center transition active:scale-95"
          >
            <CheckCircle2 className="w-5 h-5 mb-0.5" />
            <span>Known</span>
            <span className="text-[10px] opacity-80">(Easy recall)</span>
          </button>

          <button
            onClick={() => handleReviewAnswer('understand')}
            className="p-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md flex flex-col items-center justify-center transition active:scale-95"
          >
            <HelpCircle className="w-5 h-5 mb-0.5" />
            <span>Understand</span>
            <span className="text-[10px] opacity-80">(Needed hint)</span>
          </button>

          <button
            onClick={() => handleReviewAnswer('new')}
            className="p-4 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-md flex flex-col items-center justify-center transition active:scale-95"
          >
            <XCircle className="w-5 h-5 mb-0.5" />
            <span>Forgot</span>
            <span className="text-[10px] opacity-80">(Review again)</span>
          </button>
        </div>

      </div>
    );
  }

  // Review Mode Hub matching Panel 6
  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20 lg:pb-8 pt-2">
      
      {/* Category Review Queues (Panel 6) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
          Targeted Review
        </h3>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 shadow-sm overflow-hidden">
          
          {/* New Words Only */}
          <button
            onClick={() => startQueueSession('new')}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group"
          >
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shrink-0" />
              <div className="text-left">
                <span className="font-bold text-sm text-slate-900 dark:text-white block group-hover:text-indigo-600 transition">
                  New Words Only
                </span>
                <span className="text-xs text-slate-400">{statsBreakdown.new} words</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Understand Only */}
          <button
            onClick={() => startQueueSession('understand')}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group"
          >
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shrink-0" />
              <div className="text-left">
                <span className="font-bold text-sm text-slate-900 dark:text-white block group-hover:text-indigo-600 transition">
                  Understand Only
                </span>
                <span className="text-xs text-slate-400">{statsBreakdown.understand} words</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Known Words */}
          <button
            onClick={() => startQueueSession('known')}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group"
          >
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shrink-0" />
              <div className="text-left">
                <span className="font-bold text-sm text-slate-900 dark:text-white block group-hover:text-indigo-600 transition">
                  Known Words
                </span>
                <span className="text-xs text-slate-400">{statsBreakdown.known} words</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* All Words */}
          <button
            onClick={() => startQueueSession('all')}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group"
          >
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 shrink-0" />
              <div className="text-left">
                <span className="font-bold text-sm text-slate-900 dark:text-white block group-hover:text-indigo-600 transition">
                  All Words
                </span>
                <span className="text-xs text-slate-400">{statsBreakdown.total} words</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>

        </div>
      </div>

      {/* Smart Review Section (Panel 6) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
          Smart Review Modes
        </h3>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 shadow-sm overflow-hidden">
          
          {/* Weak Words */}
          <button
            onClick={() => startQueueSession('weak')}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="font-bold text-sm text-slate-900 dark:text-white block group-hover:text-indigo-600 transition">
                  Weak Words
                </span>
                <span className="text-xs text-slate-400">Words you got wrong or need clarity on</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Spaced Repetition */}
          <button
            onClick={() => startQueueSession('srs')}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-500 flex items-center justify-center">
                <RotateCw className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="font-bold text-sm text-slate-900 dark:text-white block group-hover:text-indigo-600 transition">
                  Spaced Repetition
                </span>
                <span className="text-xs text-slate-400">Scheduled by memory curve retention</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Random Mix */}
          <button
            onClick={() => startQueueSession('random')}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
                <Shuffle className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="font-bold text-sm text-slate-900 dark:text-white block group-hover:text-indigo-600 transition">
                  Random Mix
                </span>
                <span className="text-xs text-slate-400">Mixed words from all CEFR levels</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>

        </div>
      </div>

    </div>
  );
};

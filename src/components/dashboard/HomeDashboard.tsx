import React from 'react';
import { 
  Play, 
  RotateCw, 
  Headphones, 
  BrainCircuit, 
  CheckCircle2, 
  HelpCircle, 
  XCircle, 
  ArrowRight,
  TrendingUp,
  Flame,
  FileDown,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CEFRLevel } from '../../types/vocabulary';

interface HomeDashboardProps {
  onStartLearning: () => void;
  onOpenAudioMode: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ 
  onStartLearning, 
  onOpenAudioMode 
}) => {
  const { statsBreakdown, setCurrentScreen, setFilterOptions, userStats, learningTrack } = useApp();

  const handleStartReview = (type: 'weak' | 'new' | 'understand') => {
    if (type === 'weak') {
      setFilterOptions(prev => ({ ...prev, statuses: ['understand'] }));
    } else if (type === 'new') {
      setFilterOptions(prev => ({ ...prev, statuses: ['new'] }));
    }
    setCurrentScreen('review');
  };

  const handleLevelClick = (level: CEFRLevel) => {
    setFilterOptions(prev => ({ ...prev, levels: [level] }));
    setCurrentScreen('wordlist');
  };

  // SVG circular gauge calculation (compact size)
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (statsBreakdown.knownPct / 100) * circumference;

  const levelBadgeColors: Record<CEFRLevel, string> = {
    A1: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
    A2: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800',
    B1: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800',
    B2: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
    C1: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800',
    C2: 'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-950/60 border-fuchsia-200 dark:border-fuchsia-800',
  };

  return (
    <div className="space-y-3.5 pb-16 lg:pb-4 pt-1">
      
      {/* Top Split Section: Mastery Gauge + CEFR Levels */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        
        {/* Left Card: Circular Mastery Gauge + Streak + Start Learning */}
        <div className="md:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
              <span>Overall Mastery</span>
            </div>
            
            {/* Day Streak moved from top nav to Dashboard */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800 text-amber-600 dark:text-amber-400 text-xs font-bold shadow-sm">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
              <span className="tabular-nums">{userStats?.streakDays || 1} Day Streak</span>
            </div>
          </div>

          <div className="flex items-center justify-around gap-3 my-1.5">
            {/* Circular Gauge */}
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r={radius * 0.8}
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={radius * 0.8}
                  className="stroke-emerald-500 transition-all duration-1000 ease-out"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * radius * 0.8}
                  strokeDashoffset={(2 * Math.PI * radius * 0.8) - (statsBreakdown.knownPct / 100) * (2 * Math.PI * radius * 0.8)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              <div className="absolute text-center">
                <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums block">
                  {statsBreakdown.knownPct}%
                </span>
                <span className="text-[9px] text-slate-400 uppercase font-semibold">
                  Known
                </span>
              </div>
            </div>

            {/* Quick Action button */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Progress:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                  {statsBreakdown.known} / {statsBreakdown.total}
                </span>
              </div>
              <button
                onClick={onStartLearning}
                className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 group transition"
              >
                <span>Start Learning</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Card: CEFR Levels Matrix (A1, A2, B1, B2, C1, C2) */}
        <div className="md:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                CEFR Level Distribution (A1 – C2)
              </span>
            </div>
            <span className="text-[10px] text-indigo-500 font-semibold">
              Click level to filter
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).map(level => {
              const count = statsBreakdown[level.toLowerCase() as 'a1' | 'a2' | 'b1' | 'b2' | 'c1' | 'c2'] || 0;

              return (
                <button
                  key={level}
                  onClick={() => handleLevelClick(level)}
                  className="flex flex-col items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 transition group text-center"
                >
                  <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full border mb-1 ${levelBadgeColors[level]}`}>
                    {level}
                  </span>
                  <span className="text-sm font-black text-slate-800 dark:text-slate-200 tabular-nums">
                    {count}
                  </span>
                  <span className="text-[9px] text-slate-400">words</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* 3 Status Cards (Known, Understand, New) - Responsive Mobile & Desktop */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        
        {/* Known Card */}
        <div 
          onClick={() => {
            setFilterOptions(prev => ({ ...prev, statuses: ['known'] }));
            setCurrentScreen('wordlist');
          }}
          className="p-2 sm:p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-1.5 sm:gap-3 cursor-pointer hover:border-emerald-400 transition min-w-0"
        >
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 w-full">
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block truncate">
              Known
            </span>
            <div className="flex items-baseline justify-center sm:justify-start gap-1">
              <span className="text-sm sm:text-xl font-black text-emerald-950 dark:text-emerald-100 tabular-nums">
                {statsBreakdown.known}
              </span>
              <span className="text-[9px] sm:text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                ({statsBreakdown.knownPct}%)
              </span>
            </div>
          </div>
        </div>

        {/* Understand Card */}
        <div 
          onClick={() => {
            setFilterOptions(prev => ({ ...prev, statuses: ['understand'] }));
            setCurrentScreen('wordlist');
          }}
          className="p-2 sm:p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-1.5 sm:gap-3 cursor-pointer hover:border-amber-400 transition min-w-0"
        >
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 w-full">
            <span className="text-[10px] sm:text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block truncate">
              Understand
            </span>
            <div className="flex items-baseline justify-center sm:justify-start gap-1">
              <span className="text-sm sm:text-xl font-black text-amber-950 dark:text-amber-100 tabular-nums">
                {statsBreakdown.understand}
              </span>
              <span className="text-[9px] sm:text-[11px] font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                ({statsBreakdown.understandPct}%)
              </span>
            </div>
          </div>
        </div>

        {/* New Card */}
        <div 
          onClick={() => {
            setFilterOptions(prev => ({ ...prev, statuses: ['new'] }));
            setCurrentScreen('wordlist');
          }}
          className="p-2 sm:p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-1.5 sm:gap-3 cursor-pointer hover:border-rose-400 transition min-w-0"
        >
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 w-full">
            <span className="text-[10px] sm:text-[11px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider block truncate">
              New
            </span>
            <div className="flex items-baseline justify-center sm:justify-start gap-1">
              <span className="text-sm sm:text-xl font-black text-rose-950 dark:text-rose-100 tabular-nums">
                {statsBreakdown.new}
              </span>
              <span className="text-[9px] sm:text-[11px] font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                ({statsBreakdown.newPct}%)
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Quick Actions Bar (Horizontal 4-Column Strip) */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          
          {/* Continue Learning */}
          <button
            onClick={() => setCurrentScreen('learn')}
            className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 shadow-sm transition text-left group"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div className="min-w-0">
              <span className="block font-bold text-slate-900 dark:text-white text-xs truncate">Continue</span>
              <span className="text-[10px] text-slate-400 truncate block">
                {learningTrack === 'grammar' ? 'Study grammar' : learningTrack === 'conjunctions' ? 'Study conjunctions' : learningTrack === 'prepositions' ? 'Study prepositions' : learningTrack === 'phrases' ? 'Study phrases' : 'Study words'}
              </span>
            </div>
          </button>

          {/* Review Weak Words */}
          <button
            onClick={() => handleStartReview('weak')}
            className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800 shadow-sm transition text-left group"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <RotateCw className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="block font-bold text-slate-900 dark:text-white text-xs truncate">Review</span>
              <span className="text-[10px] text-slate-400 truncate block">
                {learningTrack === 'grammar' ? 'Weak grammar' : learningTrack === 'conjunctions' ? 'Weak conjunctions' : learningTrack === 'prepositions' ? 'Weak prepositions' : learningTrack === 'phrases' ? 'Weak phrases' : 'Weak words'}
              </span>
            </div>
          </button>

          {/* Audio Mode */}
          <button
            onClick={onOpenAudioMode}
            className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800 shadow-sm transition text-left group"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Headphones className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="block font-bold text-slate-900 dark:text-white text-xs truncate">Audio Mode</span>
              <span className="text-[10px] text-slate-400 truncate block">Hands-free</span>
            </div>
          </button>

          {/* Quiz Mode */}
          <button
            onClick={() => setCurrentScreen('quiz')}
            className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-800 shadow-sm transition text-left group"
          >
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="block font-bold text-slate-900 dark:text-white text-xs truncate">Quiz Mode</span>
              <span className="text-[10px] text-slate-400 truncate block">Test skills</span>
            </div>
          </button>

        </div>
      </div>

      {/* Official Vocabulary & Phrase PDFs Download Section */}
      <div className="pt-1">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-1.5">
            <FileDown className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Download Official Oxford PDFs
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            Oxford & CEFR Standards
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {/* Oxford Phrase List */}
          <a
            href="/Oxford_Phrase_List.pdf"
            download="Oxford_Phrase_List.pdf"
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gradient-to-br from-purple-50/70 to-pink-50/70 dark:from-purple-950/30 dark:to-pink-950/20 border border-purple-200/80 dark:border-purple-800 hover:border-purple-400 transition group shadow-sm col-span-2 sm:col-span-1"
          >
            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
              <FileDown className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="block font-bold text-slate-900 dark:text-slate-100 text-xs truncate">Phrase List</span>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold truncate block">A1–C1 Phrases PDF</span>
            </div>
          </a>

          {/* Oxford 3000 */}
          <a
            href="/Oxford_3000.pdf"
            download="Oxford_3000.pdf"
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition group shadow-sm"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileDown className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="block font-bold text-slate-800 dark:text-slate-200 text-xs truncate">Oxford 3000</span>
              <span className="text-[10px] text-slate-400 truncate block">A1–B2 Core PDF</span>
            </div>
          </a>

          {/* Oxford 5000 */}
          <a
            href="/Oxford_5000.pdf"
            download="Oxford_5000.pdf"
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition group shadow-sm"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileDown className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="block font-bold text-slate-800 dark:text-slate-200 text-xs truncate">Oxford 5000</span>
              <span className="text-[10px] text-slate-400 truncate block">B2–C1 Advanced PDF</span>
            </div>
          </a>

          {/* CEFR C1 PDF */}
          <a
            href="/Oxford_CEFR_C1_Vocabulary.pdf"
            download="Oxford_CEFR_C1_Vocabulary.pdf"
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-600 transition group shadow-sm"
          >
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <FileDown className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="block font-bold text-slate-800 dark:text-slate-200 text-xs truncate">Level C1</span>
              <span className="text-[10px] text-slate-400 truncate block">2,224 Words PDF</span>
            </div>
          </a>

          {/* CEFR C2 PDF */}
          <a
            href="/Oxford_CEFR_C2_Vocabulary.pdf"
            download="Oxford_CEFR_C2_Vocabulary.pdf"
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-fuchsia-400 dark:hover:border-fuchsia-600 transition group shadow-sm"
          >
            <div className="w-7 h-7 rounded-lg bg-fuchsia-50 dark:bg-fuchsia-950/60 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center shrink-0">
              <FileDown className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="block font-bold text-slate-800 dark:text-slate-200 text-xs truncate">Level C2</span>
              <span className="text-[10px] text-slate-400 truncate block">887 Words PDF</span>
            </div>
          </a>
        </div>
      </div>

    </div>
  );
};

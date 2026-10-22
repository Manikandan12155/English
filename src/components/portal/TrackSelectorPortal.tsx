import React from 'react';
import { BookOpen, MessageSquareQuote, Compass, Link2, Sparkles, ArrowRight, CheckCircle2, Award, Navigation } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LearningTrack } from '../../types/vocabulary';

interface TrackSelectorPortalProps {
  onSelectTrack?: (track: LearningTrack) => void;
}

export const TrackSelectorPortal: React.FC<TrackSelectorPortalProps> = ({ onSelectTrack }) => {
  const { setLearningTrack, setCurrentScreen, learningTrack } = useApp();

  const handlePick = (track: LearningTrack) => {
    setLearningTrack(track);
    if (onSelectTrack) {
      onSelectTrack(track);
    } else {
      setCurrentScreen('dashboard');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-8 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white relative overflow-hidden select-none">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-3/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl w-full z-10 space-y-8 text-center">
        
        {/* Brand Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold backdrop-blur-md shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
            <span>Complete English Language Curriculum</span>
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            VocabMaster <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">5000</span>
          </h1>
          
          <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Choose your learning track to get started. You can return here anytime by clicking the VocabMaster logo.
          </p>
        </div>

        {/* 4 Track Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 text-left">
          
          {/* Card 1: Vocabulary Track */}
          <div 
            onClick={() => handlePick('vocabulary')}
            className={`group relative p-5 sm:p-6 rounded-3xl bg-slate-900/70 hover:bg-slate-800/80 border transition-all duration-300 cursor-pointer shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 backdrop-blur-xl flex flex-col justify-between ${
              learningTrack === 'vocabulary' 
                ? 'border-indigo-500/80 ring-2 ring-indigo-500/30' 
                : 'border-slate-800 hover:border-indigo-500/50'
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  7,653 Words
                </span>
              </div>

              <h2 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                Vocabulary
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1.5 leading-relaxed min-h-[40px]">
                Master essential Oxford words from A1 to C2 with phonetics, definitions, and AI explanations.
              </p>

              <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap gap-2 text-[11px] text-slate-300">
                <span className="flex items-center gap-1 bg-slate-800/60 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3 h-3 text-indigo-400" /> CEFR A1 - C2
                </span>
                <span className="flex items-center gap-1 bg-slate-800/60 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3 h-3 text-indigo-400" /> Audio IPA
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between text-indigo-400 font-bold text-xs group-hover:translate-x-0.5 transition-transform">
              <span>Start Vocabulary</span>
              <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Card 2: Phrase List Track */}
          <div 
            onClick={() => handlePick('phrases')}
            className={`group relative p-5 sm:p-6 rounded-3xl bg-slate-900/70 hover:bg-slate-800/80 border transition-all duration-300 cursor-pointer shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 backdrop-blur-xl flex flex-col justify-between ${
              learningTrack === 'phrases' 
                ? 'border-purple-500/80 ring-2 ring-purple-500/30' 
                : 'border-slate-800 hover:border-purple-500/50'
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform">
                  <MessageSquareQuote className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  893 Phrases
                </span>
              </div>

              <h2 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                Phrase List
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1.5 leading-relaxed min-h-[40px]">
                Official Oxford Phrase List with everyday idioms, phrasal verbs, collocations, and natural examples.
              </p>

              <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap gap-2 text-[11px] text-slate-300">
                <span className="flex items-center gap-1 bg-slate-800/60 px-2 py-0.5 rounded-md">
                  <Award className="w-3 h-3 text-purple-400" /> CEFR A1 - C1
                </span>
                <span className="flex items-center gap-1 bg-slate-800/60 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3 h-3 text-purple-400" /> Phrasal Verbs
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between text-purple-400 font-bold text-xs group-hover:translate-x-0.5 transition-transform">
              <span>Start Phrases</span>
              <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Card 3: Prepositions Track */}
          <div 
            onClick={() => handlePick('prepositions')}
            className={`group relative p-5 sm:p-6 rounded-3xl bg-slate-900/70 hover:bg-slate-800/80 border transition-all duration-300 cursor-pointer shadow-xl hover:shadow-teal-500/10 hover:-translate-y-1 backdrop-blur-xl flex flex-col justify-between ${
              learningTrack === 'prepositions' 
                ? 'border-teal-500/80 ring-2 ring-teal-500/30' 
                : 'border-slate-800 hover:border-teal-500/50'
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/25 group-hover:scale-105 transition-transform">
                  <Compass className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  123 Items
                </span>
              </div>

              <h2 className="text-xl font-bold text-white group-hover:text-teal-300 transition-colors">
                Prepositions
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1.5 leading-relaxed min-h-[40px]">
                Complete English prepositions of place, time, movement, and direction with authentic examples.
              </p>

              <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap gap-2 text-[11px] text-slate-300">
                <span className="flex items-center gap-1 bg-slate-800/60 px-2 py-0.5 rounded-md">
                  <Award className="w-3 h-3 text-teal-400" /> CEFR A1 - C1
                </span>
                <span className="flex items-center gap-1 bg-slate-800/60 px-2 py-0.5 rounded-md">
                  <Navigation className="w-3 h-3 text-teal-400" /> Place & Time
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between text-teal-400 font-bold text-xs group-hover:translate-x-0.5 transition-transform">
              <span>Start Prepositions</span>
              <div className="w-7 h-7 rounded-full bg-teal-500/20 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Card 4: Conjunctions Track */}
          <div 
            onClick={() => handlePick('conjunctions')}
            className={`group relative p-5 sm:p-6 rounded-3xl bg-slate-900/70 hover:bg-slate-800/80 border transition-all duration-300 cursor-pointer shadow-xl hover:shadow-rose-500/10 hover:-translate-y-1 backdrop-blur-xl flex flex-col justify-between ${
              learningTrack === 'conjunctions' 
                ? 'border-rose-500/80 ring-2 ring-rose-500/30' 
                : 'border-slate-800 hover:border-rose-500/50'
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/25 group-hover:scale-105 transition-transform">
                  <Link2 className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  88 Conjunctions
                </span>
              </div>

              <h2 className="text-xl font-bold text-white group-hover:text-rose-300 transition-colors">
                Conjunctions
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1.5 leading-relaxed min-h-[40px]">
                Master all English coordinating, subordinating, and correlative conjunctions with authentic examples.
              </p>

              <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap gap-2 text-[11px] text-slate-300">
                <span className="flex items-center gap-1 bg-slate-800/60 px-2 py-0.5 rounded-md">
                  <Award className="w-3 h-3 text-rose-400" /> CEFR A1 - C1
                </span>
                <span className="flex items-center gap-1 bg-slate-800/60 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3 h-3 text-rose-400" /> Linking Words
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between text-rose-400 font-bold text-xs group-hover:translate-x-0.5 transition-transform">
              <span>Start Conjunctions</span>
              <div className="w-7 h-7 rounded-full bg-rose-500/20 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <p className="text-xs text-slate-500">
          Oxford 5000™ • Oxford Phrase List™ • Prepositions A1–C1 • English Conjunctions A1–C1 • Spaced Repetition • Offline PWA
        </p>

      </div>
    </div>
  );
};

import React from 'react';
import { 
  Home, 
  BookOpen, 
  RotateCw, 
  BarChart2, 
  Layers 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ViewScreen } from '../../types/vocabulary';

export const BottomNav: React.FC = () => {
  const { currentScreen, setCurrentScreen, learningTrack } = useApp();

  const tabs: { id: ViewScreen; label: string; icon: React.ReactNode }[] = [
    { id: 'portal', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'learn', label: 'Learn', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'review', label: 'Review', icon: <RotateCw className="w-5 h-5" /> },
    { id: 'stats', label: 'Stats', icon: <BarChart2 className="w-5 h-5" /> },
    { id: 'wordlist', label: learningTrack === 'grammar' ? 'Grammar' : learningTrack === 'conjunctions' ? 'Conjunctions' : learningTrack === 'prepositions' ? 'Prepositions' : learningTrack === 'phrases' ? 'Phrases' : 'Words', icon: <Layers className="w-5 h-5" /> },
  ];

  return (
    <div className="lg:hidden fixed bottom-3 left-3 right-3 sm:left-auto sm:right-auto sm:w-[440px] sm:left-1/2 sm:-translate-x-1/2 z-40">
      <nav className="ios-dock px-2 py-1.5 flex justify-around items-center relative">
        {tabs.map(tab => {
          const isActive = currentScreen === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentScreen(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 ios-press relative ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-300 font-extrabold scale-105 ios-glass-btn shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <div className="relative">
                {tab.icon}
                {isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 shadow-xs shadow-indigo-500" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </nav>
      {/* iPhone Home Bar Touch Indicator */}
      <div className="w-28 h-1 bg-slate-400/30 dark:bg-slate-400/25 rounded-full mx-auto mt-1.5 pointer-events-none" />
    </div>
  );
};

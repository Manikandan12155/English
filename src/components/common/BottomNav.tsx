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
    { id: 'dashboard', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'learn', label: 'Learn', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'review', label: 'Review', icon: <RotateCw className="w-5 h-5" /> },
    { id: 'stats', label: 'Stats', icon: <BarChart2 className="w-5 h-5" /> },
    { id: 'wordlist', label: learningTrack === 'conjunctions' ? 'Conjunctions' : learningTrack === 'prepositions' ? 'Prepositions' : learningTrack === 'phrases' ? 'Phrases' : 'Words', icon: <Layers className="w-5 h-5" /> },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex justify-around items-center">
      {tabs.map(tab => {
        const isActive = currentScreen === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setCurrentScreen(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isActive
                ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

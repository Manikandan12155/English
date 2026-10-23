import { 
  Moon, 
  Sun, 
  Settings
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NavbarProps {
  onOpenSettings: () => void;
  onOpenSearch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSettings }) => {
  const { isDarkMode, toggleDarkMode, setCurrentScreen, learningTrack } = useApp();

  return (
    <header className="sticky top-0 z-30 ios-header-glass transition-colors">
      <div className="w-full px-3.5 sm:px-6 h-16 flex items-center justify-between gap-2 max-w-7xl mx-auto">
        
        {/* Brand / Logo - Click takes to Home Track Selection Portal */}
        <div 
          onClick={() => setCurrentScreen('portal')}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none shrink-0"
          title="Click to go to Home Track Selection"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-all duration-300 ios-gloss border border-white/30">
            <span className="text-white font-extrabold text-lg sm:text-xl tracking-tight drop-shadow-sm">L</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">LexiCraft</span>
              <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full ios-glass-subtle text-indigo-600 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-500/30">
                {learningTrack === 'grammar' ? 'Grammar' : learningTrack === 'conjunctions' ? 'Conjunctions' : learningTrack === 'prepositions' ? 'Prepositions' : learningTrack === 'phrases' ? 'Phrases' : '5000'}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 hidden md:block">
              {learningTrack === 'grammar' ? 'English Grammar A1–C1' : learningTrack === 'conjunctions' ? 'English Conjunctions A1–C1' : learningTrack === 'prepositions' ? 'English Prepositions A1–C1' : learningTrack === 'phrases' ? 'Oxford Phrase List A1–C1' : 'Oxford 5000 A1–C2 Master'}
            </p>
          </div>
        </div>

        {/* Dynamic Island Style Capsule (iPhone look) */}
        <div 
          onClick={() => setCurrentScreen('portal')}
          className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full ios-glass-subtle border border-white/60 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-xs cursor-pointer hover:scale-102 transition"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-bold">iOS Liquid Glass Edition</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 sm:p-2.5 rounded-xl ios-glass-btn text-slate-600 dark:text-slate-300"
          >
            {isDarkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />}
          </button>

          {/* Settings gear */}
          <button
            onClick={onOpenSettings}
            title="Settings"
            className="p-2 sm:p-2.5 rounded-xl ios-glass-btn text-slate-600 dark:text-slate-300"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

        </div>
      </div>
    </header>
  );
};

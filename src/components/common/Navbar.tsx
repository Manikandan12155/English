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
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="w-full px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        
        {/* Brand / Logo - Click takes to Home Track Selection Portal */}
        <div 
          onClick={() => setCurrentScreen('portal')}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none shrink-0"
          title="Click to go to Home Track Selection"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <span className="text-white font-extrabold text-lg sm:text-xl tracking-tight">V</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">VocabMaster</span>
              <span className="text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                {learningTrack === 'grammar' ? 'Grammar' : learningTrack === 'conjunctions' ? 'Conjunctions' : learningTrack === 'prepositions' ? 'Prepositions' : learningTrack === 'phrases' ? 'Phrases' : '5000'}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 hidden md:block">
              {learningTrack === 'grammar' ? 'English Grammar A1–C1' : learningTrack === 'conjunctions' ? 'English Conjunctions A1–C1' : learningTrack === 'prepositions' ? 'English Prepositions A1–C1' : learningTrack === 'phrases' ? 'Oxford Phrase List A1–C1' : 'Oxford 5000 A1–C2 Master'}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-2">

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          {/* Settings gear */}
          <button
            onClick={onOpenSettings}
            title="Settings"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Settings className="w-5 h-5" />
          </button>

        </div>
      </div>
    </header>
  );
};

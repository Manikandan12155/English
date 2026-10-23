import React, { useState } from 'react';
import { 
  Home,
  LayoutDashboard, 
  GraduationCap, 
  RotateCw, 
  BarChart3, 
  Layers, 
  Settings,
  HelpCircle,
  Search,
  BrainCircuit,
  X,
  ArrowLeftRight,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ViewScreen } from '../../types/vocabulary';

interface SidebarProps {
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

interface MenuItem {
  id: ViewScreen | 'settings' | 'help';
  label: string;
  icon: React.ReactNode;
  action?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenSettings, onOpenHelp }) => {
  const { currentScreen, setCurrentScreen, userStats, learningTrack } = useApp();
  const [menuSearch, setMenuSearch] = useState('');

  const allMenuItems: MenuItem[] = [
    { id: 'portal', label: 'Home', icon: <Home className="w-5 h-5 text-indigo-500" /> },
    { id: 'learn', label: learningTrack === 'grammar' ? 'Learn Grammar' : learningTrack === 'conjunctions' ? 'Learn Conjunctions' : learningTrack === 'prepositions' ? 'Learn Prepositions' : learningTrack === 'phrases' ? 'Learn Phrases' : 'Learn Words', icon: <GraduationCap className="w-5 h-5" /> },
    { id: 'review', label: 'Review', icon: <RotateCw className="w-5 h-5" /> },
    { id: 'game', label: 'AI Assistant', icon: <Sparkles className="w-5 h-5 text-indigo-400" /> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'quiz', label: 'Quiz Mode', icon: <BrainCircuit className="w-5 h-5" /> },
    { id: 'stats', label: 'Statistics', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'wordlist', label: learningTrack === 'grammar' ? 'Grammar List' : learningTrack === 'conjunctions' ? 'Conjunction List' : learningTrack === 'prepositions' ? 'Preposition List' : learningTrack === 'phrases' ? 'Phrase List' : 'Word List', icon: <Layers className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" />, action: onOpenSettings },
    { id: 'help', label: 'User Guide', icon: <HelpCircle className="w-5 h-5" />, action: onOpenHelp },
  ];

  const primaryItems = allMenuItems.slice(0, 7);

  const displayedItems = menuSearch.trim()
    ? allMenuItems.filter(item => item.label.toLowerCase().includes(menuSearch.toLowerCase().trim()))
    : primaryItems;

  const handleSelectMenu = (item: MenuItem) => {
    if (item.action) {
      item.action();
    } else {
      setCurrentScreen(item.id as ViewScreen);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && displayedItems.length > 0) {
      handleSelectMenu(displayedItems[0]);
      setMenuSearch('');
    }
  };

  const dailyGoal = userStats?.dailyGoal || 50;
  const todayReviewed = userStats?.todayReviewedCount || 0;
  const goalPercent = Math.min(100, Math.round((todayReviewed / dailyGoal) * 100));

  return (
    <aside className="hidden lg:flex flex-col w-60 border-r border-white/60 dark:border-white/10 ios-header-glass px-3.5 py-3 shrink-0 justify-between sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="space-y-2">
        
        {/* Search for screens in menu list */}
        <div className="relative pt-0.5">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none mt-0.5" />
          <input
            type="text"
            placeholder="Search screens..."
            value={menuSearch}
            onChange={(e) => setMenuSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-7 pr-7 py-1.5 text-xs rounded-xl ios-glass-subtle text-slate-800 dark:text-slate-100 placeholder-slate-400 border border-white/70 dark:border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition"
          />
          {menuSearch && (
            <button
              onClick={() => setMenuSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mt-0.5"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Navigation Section Title */}
        <div className="flex items-center justify-between px-3 mb-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            {menuSearch ? 'Matching Screens' : 'Menu'}
          </span>
          {menuSearch && (
            <span className="text-[10px] text-indigo-500 font-semibold tabular-nums">
              {displayedItems.length} found
            </span>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {displayedItems.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400">
              No screens found
            </div>
          ) : (
            displayedItems.map(item => {
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectMenu(item)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm transition-all duration-200 ios-press text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25 font-bold ios-gloss border border-white/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })
          )}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="space-y-2.5 pt-2">
        {/* Daily Goal Card */}
        <div className="p-3.5 rounded-2xl ios-glass-subtle border border-white/70 dark:border-white/10 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Daily Goal</span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">{goalPercent}%</span>
          </div>
          <div className="w-full bg-slate-200/80 dark:bg-slate-700/60 h-1.5 rounded-full overflow-hidden mb-1.5">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${goalPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 flex justify-between">
            <span>Progress today</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">{todayReviewed} / {dailyGoal} words</span>
          </p>
        </div>

        {/* Extra Actions */}
        <div className="pt-2 border-t border-white/40 dark:border-white/10 flex items-center justify-between px-1">
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition py-0.5 ios-press"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
          <button
            onClick={onOpenHelp}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-1 rounded-lg ios-press"
            title="User Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

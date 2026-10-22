import React, { useState } from 'react';
import { 
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
  ArrowLeftRight
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
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'learn', label: learningTrack === 'conjunctions' ? 'Learn Conjunctions' : learningTrack === 'prepositions' ? 'Learn Prepositions' : learningTrack === 'phrases' ? 'Learn Phrases' : 'Learn Words', icon: <GraduationCap className="w-5 h-5" /> },
    { id: 'review', label: 'Review', icon: <RotateCw className="w-5 h-5" /> },
    { id: 'quiz', label: 'Quiz Mode', icon: <BrainCircuit className="w-5 h-5" /> },
    { id: 'stats', label: 'Statistics', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'wordlist', label: learningTrack === 'conjunctions' ? 'Conjunction List' : learningTrack === 'prepositions' ? 'Preposition List' : learningTrack === 'phrases' ? 'Phrase List' : 'Word List', icon: <Layers className="w-5 h-5" /> },
    { id: 'portal', label: 'Switch Track', icon: <ArrowLeftRight className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" />, action: onOpenSettings },
    { id: 'help', label: 'User Guide', icon: <HelpCircle className="w-5 h-5" />, action: onOpenHelp },
  ];

  const primaryItems = allMenuItems.slice(0, 6);

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
    <aside className="hidden lg:flex flex-col w-60 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-3 shrink-0 justify-between sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="space-y-2">
        
        {/* Search for screens in menu list */}
        <div className="relative pt-0.5">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none mt-0.5" />
          <input
            type="text"
            placeholder="Search menu screens..."
            value={menuSearch}
            onChange={(e) => setMenuSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-7 pr-7 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 placeholder-slate-400 border border-slate-200/60 dark:border-slate-700/60 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition"
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
        <nav className="space-y-0.5">
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
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all duration-150 text-left ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
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
        <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-purple-50/70 dark:from-slate-800/80 dark:to-slate-800/40 border border-indigo-100 dark:border-slate-700/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Daily Goal</span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">{goalPercent}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mb-1.5">
            <div 
              className="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${goalPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 flex justify-between">
            <span>Progress today</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">{todayReviewed} / {dailyGoal} words</span>
          </p>
        </div>

        {/* Extra Actions */}
        <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-1">
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition py-0.5"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
          <button
            onClick={onOpenHelp}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-0.5"
            title="User Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Moon, 
  Sun, 
  Volume2, 
  Target, 
  Database, 
  RotateCcw,
  Sparkles,
  Info,
  Key,
  Eye,
  EyeOff,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db, resetToAuthenticOxfordData } from '../../db/database';
import { getStoredGeminiKey, saveGeminiKey } from '../../services/geminiService';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { userStats, isDarkMode, toggleDarkMode, addToast, triggerRefresh } = useApp();

  const [dailyGoal, setDailyGoal] = useState<number>(userStats?.dailyGoal || 50);
  const [speechSpeed, setSpeechSpeed] = useState<number>(userStats?.speechSpeed || 1.0);
  const [autoInterval, setAutoInterval] = useState<number>(userStats?.autoPlayInterval || 3);
  const [geminiKey, setGeminiKey] = useState<string>(getStoredGeminiKey());
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const handleSave = async () => {
    saveGeminiKey(geminiKey);
    if (userStats && userStats.id) {
      await db.userStats.update(userStats.id, {
        dailyGoal,
        speechSpeed,
        autoPlayInterval: autoInterval
      });
      addToast('Preferences saved!', 'success');
    }
    onClose();
  };

  const handleResetData = async () => {
    if (confirm('Are you sure you want to purge all mock data and reload the authentic Oxford 5000 words? This will start fresh with clean tracking.')) {
      setIsResetting(true);
      try {
        const loadedCount = await resetToAuthenticOxfordData();
        triggerRefresh();
        addToast(`Cleaned & reloaded ${loadedCount} authentic Oxford 5000 words!`, 'success');
        onClose();
      } catch (err: any) {
        addToast('Error resetting: ' + err.message, 'warning');
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Settings & Preferences</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          
          {/* Daily Goal Setting */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold">
              <Target className="w-4 h-4 text-indigo-500" />
              <span>Daily Study Goal</span>
            </div>
            <p className="text-slate-400 text-xs">Number of words to review or master each day.</p>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[20, 50, 100, 200].map(goal => (
                <button
                  key={goal}
                  onClick={() => setDailyGoal(goal)}
                  className={`py-2 rounded-xl font-bold border transition ${
                    dailyGoal === goal
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {goal} words
                </button>
              ))}
            </div>
          </div>

          {/* Theme Mode */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold">
              {isDarkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <span>Dark Theme</span>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                isDarkMode ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
          </div>

          {/* Speech Speed */}
          <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold">
              <Volume2 className="w-4 h-4 text-indigo-500" />
              <span>Speech Pronunciation Speed</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[0.75, 1.0, 1.25, 1.5].map(spd => (
                <button
                  key={spd}
                  onClick={() => setSpeechSpeed(spd)}
                  className={`py-2 rounded-xl font-bold border transition ${
                    speechSpeed === spd
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Auto Next Seconds */}
          <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-700 dark:text-slate-200 block">
              Auto-play Advance Delay
            </span>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 5, 7].map(sec => (
                <button
                  key={sec}
                  onClick={() => setAutoInterval(sec)}
                  className={`py-2 rounded-xl font-bold border transition ${
                    autoInterval === sec
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          {/* Google Gemini AI API Key */}
          <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Google Gemini API Key</span>
              </div>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
              >
                <span>Get Free Key</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <p className="text-slate-400 text-xs">
              Powers instant AI meanings, simple formulas, real-world examples, and mnemonics.
            </p>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Key className="w-3.5 h-3.5" />
              </div>
              <input 
                type={showKey ? 'text' : 'password'}
                value={geminiKey}
                onChange={e => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 italic">
              Saved privately in your browser's local storage.
            </p>
          </div>

          {/* Reset Starter Data */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <button
              onClick={handleResetData}
              className="w-full py-2.5 px-3 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Vocabulary to Default Starter Set</span>
            </button>
          </div>

          {/* System info */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-[11px] text-slate-400 space-y-1">
            <p className="font-semibold text-slate-600 dark:text-slate-300">VocabMaster 5000 PWA v1.0</p>
            <p>100% Offline Capable • Local IndexedDB (Dexie) • Web Speech Audio</p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition"
          >
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
};

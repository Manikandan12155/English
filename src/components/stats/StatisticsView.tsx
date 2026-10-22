import React, { useState } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  CheckCircle2, 
  HelpCircle, 
  XCircle, 
  Target, 
  Award,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/database';

interface StatisticsViewProps {
  onOpenDailyGoalModal: () => void;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({ onOpenDailyGoalModal }) => {
  const { words, statsBreakdown, userStats, triggerRefresh, addToast } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'level' | 'status'>('overview');

  // SVG Donut calculation
  const size = 180;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const total = statsBreakdown.total || 1;
  const knownDash = (statsBreakdown.known / total) * circumference;
  const understandDash = (statsBreakdown.understand / total) * circumference;
  const newDash = (statsBreakdown.new / total) * circumference;

  const dailyGoal = userStats?.dailyGoal || 50;
  const todayReviewed = userStats?.todayReviewedCount || 0;
  const goalPercent = Math.min(100, Math.round((todayReviewed / dailyGoal) * 100));

  // Level statistics
  const levels = [
    { name: 'A1', count: statsBreakdown.a1 },
    { name: 'A2', count: statsBreakdown.a2 },
    { name: 'B1', count: statsBreakdown.b1 },
    { name: 'B2', count: statsBreakdown.b2 },
    { name: 'C1', count: statsBreakdown.c1 },
    { name: 'C2', count: statsBreakdown.c2 },
  ];

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20 lg:pb-8 pt-2">
      
      {/* Header Tabs (Overview, Level, Status) - Panel 7 */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
        {(['overview', 'level', 'status'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl capitalize transition ${
              activeTab === tab
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Donut Chart & Legend Card (Panel 7) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-around gap-6">
        
        {/* Donut graphic */}
        <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90">
            {/* Background ring */}
            <circle
              cx="88"
              cy="88"
              r={radius}
              fill="transparent"
              stroke="#e2e8f0"
              className="dark:stroke-slate-800"
              strokeWidth={strokeWidth}
            />
            {/* Known slice (Green) */}
            <circle
              cx="88"
              cy="88"
              r={radius}
              fill="transparent"
              stroke="#10b981"
              strokeWidth={strokeWidth}
              strokeDasharray={`${knownDash} ${circumference}`}
              strokeDashoffset={0}
            />
            {/* Understand slice (Amber) */}
            <circle
              cx="88"
              cy="88"
              r={radius}
              fill="transparent"
              stroke="#f59e0b"
              strokeWidth={strokeWidth}
              strokeDasharray={`${understandDash} ${circumference}`}
              strokeDashoffset={-knownDash}
            />
            {/* New slice (Rose/Red) */}
            <circle
              cx="88"
              cy="88"
              r={radius}
              fill="transparent"
              stroke="#ef4444"
              strokeWidth={strokeWidth}
              strokeDasharray={`${newDash} ${circumference}`}
              strokeDashoffset={-(knownDash + understandDash)}
            />
          </svg>

          {/* Center text */}
          <div className="absolute text-center">
            <span className="text-3xl font-black text-slate-900 dark:text-white block">
              {statsBreakdown.total}
            </span>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Words
            </span>
          </div>
        </div>

        {/* Legend stats */}
        <div className="space-y-3.5 w-full max-w-xs">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Known</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {statsBreakdown.known}
              </span>
              <span className="text-xs text-slate-400 ml-1.5">
                ({statsBreakdown.knownPct}%)
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shrink-0" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Understand</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {statsBreakdown.understand}
              </span>
              <span className="text-xs text-slate-400 ml-1.5">
                ({statsBreakdown.understandPct}%)
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shrink-0" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">New</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {statsBreakdown.new}
              </span>
              <span className="text-xs text-slate-400 ml-1.5">
                ({statsBreakdown.newPct}%)
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* Progress by Level Section (Panel 7) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
          Progress by Level
        </h3>

        <div className="space-y-4">
          {levels.map(lvl => {
            // Find known words in this level
            const knownInLevel = words.filter(w => w.cefrLevel === lvl.name && w.status === 'known').length;
            const pct = lvl.count > 0 ? Math.round((knownInLevel / lvl.count) * 100) : 0;

            return (
              <div key={lvl.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-6 font-bold text-indigo-600 dark:text-indigo-400">{lvl.name}</span>
                    <span className="text-slate-600 dark:text-slate-400 font-medium">{knownInLevel} / {lvl.count}</span>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{pct}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Goal Card (Panel 7) */}
      <div className="p-5 rounded-3xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-emerald-950 dark:text-emerald-100">Daily Goal</span>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                {dailyGoal} words
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {todayReviewed} / {dailyGoal} reviewed today ({goalPercent}%)
            </p>
          </div>
        </div>

        <button
          onClick={onOpenDailyGoalModal}
          className="px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-800 transition"
        >
          Change
        </button>
      </div>

    </div>
  );
};

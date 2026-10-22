import React, { useState } from 'react';
import { X, RotateCcw, Check } from 'lucide-react';
import { FilterOptions, CEFRLevel, WordStatus } from '../../types/vocabulary';
import { useApp } from '../../context/AppContext';

interface FilterModalProps {
  onClose: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({ onClose }) => {
  const { filterOptions, setFilterOptions, statsBreakdown } = useApp();

  const [localLevels, setLocalLevels] = useState<CEFRLevel[]>(filterOptions.levels);
  const [localStatuses, setLocalStatuses] = useState<WordStatus[]>(filterOptions.statuses);
  const [localPos, setLocalPos] = useState<string[]>(filterOptions.partsOfSpeech);
  const [localSort, setLocalSort] = useState<FilterOptions['sortBy']>(filterOptions.sortBy);

  const toggleLevel = (lvl: CEFRLevel) => {
    setLocalLevels(prev => 
      prev.includes(lvl) ? prev.filter(l => l !== lvl) : [...prev, lvl]
    );
  };

  const toggleStatus = (st: WordStatus) => {
    setLocalStatuses(prev => 
      prev.includes(st) ? prev.filter(s => s !== st) : [...prev, st]
    );
  };

  const togglePos = (pos: string) => {
    if (pos === 'all') {
      setLocalPos([]);
      return;
    }
    setLocalPos(prev => 
      prev.includes(pos) ? prev.filter(p => p !== pos) : [...prev, pos]
    );
  };

  const handleReset = () => {
    setLocalLevels([]);
    setLocalStatuses([]);
    setLocalPos([]);
    setLocalSort('default');
  };

  const handleApply = () => {
    setFilterOptions(prev => ({
      ...prev,
      levels: localLevels,
      statuses: localStatuses,
      partsOfSpeech: localPos,
      sortBy: localSort
    }));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header (Panel 5) */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Filters</h3>
          </div>

          <button
            onClick={handleReset}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Filter Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          
          {/* CEFR Level Selector (Panel 5) */}
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2.5">
              CEFR Level
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).map(lvl => {
                const isSelected = localLevels.includes(lvl);
                return (
                  <button
                    key={lvl}
                    onClick={() => toggleLevel(lvl)}
                    className={`p-2.5 rounded-xl font-bold text-xs border transition flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300'
                    }`}
                  >
                    <span>{lvl}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Word Status (Panel 5) */}
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2.5">
              Word Status
            </span>
            <div className="space-y-2">
              
              {/* Known */}
              <label 
                onClick={() => toggleStatus('known')}
                className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 cursor-pointer hover:bg-emerald-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                    localStatuses.includes('known') 
                      ? 'bg-emerald-500 border-emerald-500 text-white' 
                      : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {localStatuses.includes('known') && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">Known</span>
                </div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{statsBreakdown.known}</span>
              </label>

              {/* Understand */}
              <label 
                onClick={() => toggleStatus('understand')}
                className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 cursor-pointer hover:bg-amber-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                    localStatuses.includes('understand') 
                      ? 'bg-amber-500 border-amber-500 text-white' 
                      : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {localStatuses.includes('understand') && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span className="text-sm font-semibold text-amber-900 dark:text-amber-200">Understand</span>
                </div>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{statsBreakdown.understand}</span>
              </label>

              {/* New */}
              <label 
                onClick={() => toggleStatus('new')}
                className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 cursor-pointer hover:bg-rose-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                    localStatuses.includes('new') 
                      ? 'bg-rose-500 border-rose-500 text-white' 
                      : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {localStatuses.includes('new') && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span className="text-sm font-semibold text-rose-900 dark:text-rose-200">New</span>
                </div>
                <span className="text-xs font-bold text-rose-700 dark:text-rose-400">{statsBreakdown.new}</span>
              </label>

            </div>
          </div>

          {/* Word Type / POS (Panel 5) */}
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2.5">
              Word Type
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'noun', label: 'Noun' },
                { id: 'verb', label: 'Verb' },
                { id: 'adjective', label: 'Adjective' },
                { id: 'adverb', label: 'Adverb' },
                { id: 'other', label: 'Others' },
              ].map(item => {
                const isSelected = item.id === 'all' 
                  ? localPos.length === 0 
                  : localPos.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => togglePos(item.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border-indigo-400 dark:border-indigo-700'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sort By (Panel 5) */}
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2.5">
              Sort By
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'default', label: 'Default Order' },
                { id: 'alphaAsc', label: 'A → Z' },
                { id: 'recent', label: 'Recently' },
              ].map(sort => {
                const isSelected = localSort === sort.id;
                return (
                  <button
                    key={sort.id}
                    onClick={() => setLocalSort(sort.id as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition text-center ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {sort.label}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer (Panel 5) */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <button
            onClick={handleApply}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition"
          >
            Apply Filters
          </button>
        </div>

      </div>
    </div>
  );
};

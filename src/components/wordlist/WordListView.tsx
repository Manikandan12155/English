import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Volume2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { VocabularyWord } from '../../types/vocabulary';
import { speechService } from '../../services/speechService';

interface WordListViewProps {
  onOpenFilter?: () => void;
  onOpenImport?: () => void;
  onOpenDetails: (word: VocabularyWord) => void;
  onAddNewWord?: () => void;
}

export const WordListView: React.FC<WordListViewProps> = ({
  onOpenDetails
}) => {
  const { 
    words, 
    filterOptions, 
    setFilterOptions, 
    learningTrack
  } = useApp();

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const itemsPerPage = 15;

  // Search and filter logic
  const filteredWords = useMemo(() => {
    return words.filter(word => {
      // Alphabetical letter filter
      if (selectedLetter) {
        if (!word.word.trim().toUpperCase().startsWith(selectedLetter)) {
          return false;
        }
      }

      // Search
      if (filterOptions.searchQuery) {
        const q = filterOptions.searchQuery.toLowerCase();
        const matchesWord = word.word.toLowerCase().includes(q);
        const matchesMeaning = word.meaning.toLowerCase().includes(q);
        const matchesExample = word.exampleSentence?.toLowerCase().includes(q);
        if (!matchesWord && !matchesMeaning && !matchesExample) return false;
      }

      // Levels
      if (filterOptions.levels.length > 0 && !filterOptions.levels.includes(word.cefrLevel)) {
        return false;
      }

      // Statuses
      if (filterOptions.statuses.length > 0 && !filterOptions.statuses.includes(word.status)) {
        return false;
      }

      // POS
      if (filterOptions.partsOfSpeech.length > 0 && !filterOptions.partsOfSpeech.includes(word.partOfSpeech)) {
        return false;
      }

      // Favorites
      if (filterOptions.favoritesOnly && !word.isFavorite) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (filterOptions.sortBy === 'alphaAsc') return a.word.localeCompare(b.word);
      if (filterOptions.sortBy === 'alphaDesc') return b.word.localeCompare(a.word);
      if (filterOptions.sortBy === 'level') return a.cefrLevel.localeCompare(b.cefrLevel);
      if (filterOptions.sortBy === 'recent') return (b.lastReviewedAt || 0) - (a.lastReviewedAt || 0);
      return 0;
    });
  }, [words, filterOptions, selectedLetter]);

  // Reset pagination to page 1 whenever any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterOptions, selectedLetter]);

  // Total pages and safe current page
  const totalPages = Math.max(1, Math.ceil(filteredWords.length / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedWords = filteredWords.slice(startIndex, startIndex + itemsPerPage);

  // If current page is out of bounds, auto clamp
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-20 lg:pb-8 pt-1">
      
      {/* Top Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        
        {/* Search input */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterOptions.searchQuery}
            onChange={e => {
              setFilterOptions(prev => ({ ...prev, searchQuery: e.target.value }));
              setCurrentPage(1);
            }}
            placeholder={learningTrack === 'grammar' ? "Search grammar rules, topics, or formulas..." : learningTrack === 'conjunctions' ? "Search conjunctions, meanings, or examples..." : learningTrack === 'prepositions' ? "Search prepositions, meanings, or examples..." : learningTrack === 'phrases' ? "Search phrases, idioms, or meanings..." : "Search words, meanings, or examples..."}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-slate-900 dark:text-white"
          />
        </div>

        {/* A-Z Quick Letter Filter Ribbon */}
        <div className="flex items-center gap-1 overflow-x-auto pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800 scrollbar-none">
          <button
            onClick={() => setSelectedLetter(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-black transition shrink-0 border ${
              !selectedLetter
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
            }`}
          >
            All
          </button>
          {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => {
            const isSelected = selectedLetter === letter;
            return (
              <button
                key={letter}
                onClick={() => setSelectedLetter(isSelected ? null : letter)}
                className={`w-7 h-7 rounded-lg text-xs font-black transition shrink-0 flex items-center justify-center border ${
                  isSelected
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-700'
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Filter Badges */}
      {(filterOptions.levels.length > 0 || filterOptions.statuses.length > 0 || filterOptions.partsOfSpeech.length > 0 || filterOptions.searchQuery || selectedLetter) && (
        <div className="flex flex-wrap items-center gap-2 px-1 text-xs animate-fade-in">
          <span className="text-slate-400 font-semibold">Active filters:</span>
          {selectedLetter && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold">
              Letter: {selectedLetter}
              <button 
                onClick={() => setSelectedLetter(null)}
                className="hover:text-red-500 ml-0.5 font-bold"
              >
                ✕
              </button>
            </span>
          )}
          {filterOptions.levels.map(lvl => (
            <span key={lvl} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold">
              Level: {lvl}
              <button 
                onClick={() => setFilterOptions(prev => ({ ...prev, levels: prev.levels.filter(l => l !== lvl) }))}
                className="hover:text-red-500 ml-0.5 font-bold"
              >
                ✕
              </button>
            </span>
          ))}
          {filterOptions.statuses.map(st => (
            <span key={st} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold capitalize">
              Status: {st}
              <button 
                onClick={() => setFilterOptions(prev => ({ ...prev, statuses: prev.statuses.filter(s => s !== st) }))}
                className="hover:text-red-500 ml-0.5 font-bold"
              >
                ✕
              </button>
            </span>
          ))}
          {filterOptions.partsOfSpeech.map(pos => (
            <span key={pos} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold capitalize">
              Type: {pos}
              <button 
                onClick={() => setFilterOptions(prev => ({ ...prev, partsOfSpeech: prev.partsOfSpeech.filter(p => p !== pos) }))}
                className="hover:text-red-500 ml-0.5 font-bold"
              >
                ✕
              </button>
            </span>
          ))}
          {filterOptions.searchQuery && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
              Search: "{filterOptions.searchQuery}"
              <button 
                onClick={() => setFilterOptions(prev => ({ ...prev, searchQuery: '' }))}
                className="hover:text-red-500 ml-0.5 font-bold"
              >
                ✕
              </button>
            </span>
          )}
          <button
            onClick={() => setFilterOptions({ searchQuery: '', levels: [], statuses: [], partsOfSpeech: [], favoritesOnly: false, sortBy: 'default' })}
            className="text-xs text-rose-500 hover:text-rose-600 font-bold ml-1 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Responsive Table (Panel 9) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-4 w-12 text-center">#</th>
                <th className="p-4">Word</th>
                <th className="p-4">Level & Type</th>
                <th className="p-4">Meaning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {paginatedWords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-400 font-medium">
                    No vocabulary words match your search or active filters.
                  </td>
                </tr>
              ) : (
                paginatedWords.map((word, index) => {
                  const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;

                  return (
                    <tr 
                      key={word.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                    >

                      {/* Number */}
                      <td className="p-4 text-center font-mono text-xs text-slate-400">
                        {globalIndex}
                      </td>

                      {/* Word + Speaker */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span 
                            onClick={() => onOpenDetails(word)}
                            className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                          >
                            {word.word}
                          </span>
                          <button
                            onClick={() => speechService.speak(word.word)}
                            title="Speak"
                            className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition opacity-0 group-hover:opacity-100"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {word.pronunciation && (
                          <span className="text-[11px] text-slate-400 font-mono block">
                            {word.pronunciation}
                          </span>
                        )}
                      </td>

                      {/* Level & Type Merged */}
                      <td className="p-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            word.cefrLevel === 'A1' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                            word.cefrLevel === 'A2' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                            word.cefrLevel === 'B1' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' :
                            word.cefrLevel === 'B2' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                            word.cefrLevel === 'C1' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' :
                            'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/60 dark:text-fuchsia-300'
                          }`}>
                            {word.cefrLevel}
                          </span>
                          <span className="text-xs text-slate-600 dark:text-slate-400 capitalize font-medium">
                            {word.partOfSpeech}
                          </span>
                        </div>
                      </td>

                      {/* Meaning */}
                      <td className="p-4 text-slate-700 dark:text-slate-300">
                        {word.simpleMeaning || word.meaning}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing {filteredWords.length > 0 ? (safeCurrentPage - 1) * itemsPerPage + 1 : 0} to{' '}
            {Math.min(safeCurrentPage * itemsPerPage, filteredWords.length)} of {filteredWords.length} words
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition font-semibold"
            >
              Previous
            </button>
            <span className="px-2 font-bold text-slate-800 dark:text-white">
              {safeCurrentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition font-semibold"
            >
              Next
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

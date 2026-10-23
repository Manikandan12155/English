import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Target, 
  ArrowRight, 
  BookOpen, 
  Hash, 
  Sparkles, 
  Filter,
  Check
} from 'lucide-react';
import { VocabularyWord, CEFRLevel } from '../../types/vocabulary';

interface StartFromModalProps {
  words: VocabularyWord[];
  currentIndex: number;
  selectedLetterFilter: string | null;
  onSelectWord: (word: VocabularyWord, index: number) => void;
  onSelectLetter: (letter: string, filterOnly?: boolean) => void;
  onClearLetterFilter: () => void;
  onClose: () => void;
}

const ALPHABETS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const levelColorMap: Record<CEFRLevel, string> = {
  A1: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
  A2: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800',
  B1: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800',
  B2: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
  C1: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800',
  C2: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/60 dark:text-fuchsia-300 border-fuchsia-300 dark:border-fuchsia-800',
};

export const StartFromModal: React.FC<StartFromModalProps> = ({
  words,
  currentIndex,
  selectedLetterFilter,
  onSelectWord,
  onSelectLetter,
  onClearLetterFilter,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'alphabet' | 'word' | 'number'>('alphabet');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [jumpNumber, setJumpNumber] = useState<string>(String(currentIndex + 1));
  const [filterOnlyLetters, setFilterOnlyLetters] = useState<boolean>(selectedLetterFilter !== null);

  // Compute alphabet letter stats & first word for each letter
  const alphabetStats = useMemo(() => {
    const map = new Map<string, { count: number; firstWord: string; firstIndex: number }>();
    ALPHABETS.forEach(char => {
      map.set(char, { count: 0, firstWord: '', firstIndex: -1 });
    });

    words.forEach((w, idx) => {
      const firstChar = (w.word || '').trim().charAt(0).toUpperCase();
      if (map.has(firstChar)) {
        const current = map.get(firstChar)!;
        if (current.count === 0) {
          current.firstWord = w.word;
          current.firstIndex = idx;
        }
        current.count += 1;
      }
    });

    return map;
  }, [words]);

  // Search results for "Start by Word" tab
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      // Show around 20 words starting from current index
      return words.slice(Math.max(0, currentIndex - 2), Math.min(words.length, currentIndex + 25)).map(w => ({
        word: w,
        index: words.indexOf(w)
      }));
    }

    const matches: { word: VocabularyWord; index: number }[] = [];
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (w.word.toLowerCase().includes(q)) {
        matches.push({ word: w, index: i });
        if (matches.length >= 60) break; // limit for snappy UI
      }
    }
    return matches;
  }, [words, searchQuery, currentIndex]);

  // Handle jump by number
  const handleJumpNumber = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(jumpNumber, 10);
    if (!isNaN(num) && num >= 1 && num <= words.length) {
      const targetWord = words[num - 1];
      if (targetWord) {
        onSelectWord(targetWord, num - 1);
        onClose();
      }
    }
  };

  const currentWord = words[currentIndex];
  const activeChar = currentWord?.word?.trim().charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/60 dark:border-indigo-800">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                Choose Starting Point
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Start learning from any alphabet letter or specific word
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('alphabet')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 ${
              activeTab === 'alphabet'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>Alphabet (A - Z)</span>
          </button>

          <button
            onClick={() => setActiveTab('word')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 ${
              activeTab === 'word'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Specific Word</span>
          </button>

          <button
            onClick={() => setActiveTab('number')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 ${
              activeTab === 'number'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Word #</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: ALPHABET A-Z GRID */}
          {activeTab === 'alphabet' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-indigo-50/70 dark:bg-indigo-950/40 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-900/60">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="text-xs font-semibold text-indigo-950 dark:text-indigo-200">
                    Click any letter to immediately start studying from that alphabet!
                  </span>
                </div>

                {/* Filter vs Jump toggle */}
                <label className="flex items-center gap-2 cursor-pointer self-start sm:self-auto text-xs font-bold text-indigo-900 dark:text-indigo-300">
                  <input
                    type="checkbox"
                    checked={filterOnlyLetters}
                    onChange={e => setFilterOnlyLetters(e.target.checked)}
                    className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                  />
                  <span>Study ONLY words of this letter</span>
                </label>
              </div>

              {selectedLetterFilter && (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
                  <span>Currently filtered to words starting with <strong>"{selectedLetterFilter}"</strong></span>
                  <button
                    onClick={() => {
                      onClearLetterFilter();
                      setFilterOnlyLetters(false);
                    }}
                    className="font-bold underline hover:text-amber-950 dark:hover:text-amber-100 ml-2"
                  >
                    Clear Filter
                  </button>
                </div>
              )}

              {/* 26 Letters Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {ALPHABETS.map(letter => {
                  const stat = alphabetStats.get(letter);
                  const count = stat ? stat.count : 0;
                  const isCurrentWordLetter = activeChar === letter;
                  const isFiltered = selectedLetterFilter === letter;
                  const isDisabled = count === 0;

                  return (
                    <button
                      key={letter}
                      disabled={isDisabled}
                      onClick={() => {
                        onSelectLetter(letter, filterOnlyLetters);
                        onClose();
                      }}
                      className={`p-2.5 rounded-2xl border transition-all flex flex-col items-center justify-center text-center relative group ${
                        isFiltered
                          ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-400'
                          : isCurrentWordLetter
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300 dark:ring-indigo-800'
                          : isDisabled
                          ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-800 cursor-not-allowed'
                          : 'bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-slate-700 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-base sm:text-lg font-black leading-none">{letter}</span>
                        {isCurrentWordLetter && !isFiltered && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                        )}
                      </div>
                      <span className={`text-[10px] font-bold mt-1 tabular-nums ${
                        isFiltered || isCurrentWordLetter ? 'text-indigo-100' : 'text-slate-400'
                      }`}>
                        {count} {count === 1 ? 'word' : 'words'}
                      </span>
                      {stat?.firstWord && !isDisabled && (
                        <span className={`text-[9px] truncate max-w-full mt-0.5 opacity-80 ${
                          isFiltered || isCurrentWordLetter ? 'text-indigo-200' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {stat.firstWord}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: SPECIFIC WORD SEARCH */}
          {activeTab === 'word' && (
            <div className="space-y-3">
              {/* Search Input */}
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Type any word to start from (e.g. create, focus, serene)..."
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-slate-900 dark:text-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between px-1">
                <span>
                  {searchQuery ? `Found ${searchResults.length} matches` : `Showing nearby words from current position`}
                </span>
                <span>Click any word to start learning from it</span>
              </div>

              {/* Words List */}
              <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                {searchResults.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    No words found matching "{searchQuery}".
                  </div>
                ) : (
                  searchResults.map(({ word, index }) => {
                    const isCurrent = index === currentIndex;
                    return (
                      <button
                        key={`${word.word}-${index}`}
                        onClick={() => {
                          onSelectWord(word, index);
                          onClose();
                        }}
                        className={`w-full p-2.5 sm:p-3 rounded-xl border text-left transition flex items-center justify-between gap-3 group ${
                          isCurrent
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 ring-2 ring-indigo-500/30'
                            : 'bg-white dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-800 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                              {word.word}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${levelColorMap[word.cefrLevel]}`}>
                              {word.cefrLevel}
                            </span>
                            <span className="text-[10px] text-slate-400 capitalize">
                              {word.partOfSpeech}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {word.meaning}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-mono font-bold text-slate-400">
                            #{index + 1}
                          </span>
                          <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: WORD NUMBER JUMP */}
          {activeTab === 'number' && (
            <form onSubmit={handleJumpNumber} className="space-y-4 py-2">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Enter Word Number (1 to {words.length})
                </label>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={words.length}
                    value={jumpNumber}
                    onChange={e => setJumpNumber(e.target.value)}
                    className="w-32 px-3 py-2.5 text-base font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white text-center"
                  />
                  <span className="text-sm font-bold text-slate-400">
                    of {words.length} words
                  </span>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min={1}
                  max={words.length}
                  value={jumpNumber || '1'}
                  onChange={e => setJumpNumber(e.target.value)}
                  className="w-full accent-indigo-600 cursor-pointer"
                />

                {/* Preview target word */}
                {(() => {
                  const targetIdx = parseInt(jumpNumber, 10) - 1;
                  const targetWord = words[targetIdx];
                  if (!targetWord) return null;
                  return (
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {targetWord.word}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${levelColorMap[targetWord.cefrLevel]}`}>
                            {targetWord.cefrLevel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs mt-0.5">
                          {targetWord.meaning}
                        </p>
                      </div>
                      <span className="text-xs font-mono text-slate-400">#{targetIdx + 1}</span>
                    </div>
                  );
                })()}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2"
              >
                <span>Jump & Start Learning</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Current Word: <strong>{currentWord?.word || 'None'}</strong> (#{currentIndex + 1})</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};

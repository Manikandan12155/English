import React, { useState, useEffect } from 'react';
import { 
  X, 
  Volume2, 
  Star, 
  CheckCircle, 
  HelpCircle, 
  XCircle,
  BookOpen,
  List,
  Link2,
  FileText,
  Globe,
  Loader2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { VocabularyWord, WordStatus } from '../../types/vocabulary';
import { speechService } from '../../services/speechService';
import { dictionaryService, LiveDictionaryResult } from '../../services/dictionaryService';
import { explainWordWithGemini, getCachedAIMeaning, AIMeaningResult } from '../../services/geminiService';
import { useApp } from '../../context/AppContext';

interface ExpandedWordModalProps {
  word: VocabularyWord | null;
  onClose: () => void;
  onStatusChange: (status: WordStatus) => void;
}

export const ExpandedWordModal: React.FC<ExpandedWordModalProps> = ({ 
  word, 
  onClose, 
  onStatusChange 
}) => {
  const { handleToggleFavorite, userStats } = useApp();
  const [activeTab, setActiveTab] = useState<'meaning' | 'examples' | 'related' | 'notes'>('meaning');
  const [playingSentenceIdx, setPlayingSentenceIdx] = useState<number | null>(null);

  // Live Third-Party Dictionary API state
  const [liveData, setLiveData] = useState<LiveDictionaryResult | null>(null);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [liveError, setLiveError] = useState<string | null>(null);

  // Gemini AI Meaning State
  const [aiMeaning, setAiMeaning] = useState<AIMeaningResult | null>(null);
  const [loadingAI, setLoadingAI] = useState<boolean>(false);

  useEffect(() => {
    setAiMeaning(null);
    setLoadingAI(false);
  }, [word?.word]);

  const handleFetchAIMeaning = async (forceRefresh: boolean = false) => {
    if (!word) return;
    setLoadingAI(true);
    try {
      const res = await explainWordWithGemini(
        word.word, 
        word.cefrLevel, 
        word.partOfSpeech,
        undefined,
        forceRefresh
      );
      setAiMeaning(res);
    } catch (err) {
      console.warn('AI fetch error:', err);
    } finally {
      setLoadingAI(false);
    }
  };

  useEffect(() => {
    if (!word?.word) return;

    // 1. Immediately load cached AI meaning if already generated
    const cachedAI = getCachedAIMeaning(word.word);
    setAiMeaning(cachedAI);

    // 2. Check cached live definitions
    const cachedLive = dictionaryService.getCachedLiveDictionary(word.word);
    if (cachedLive) {
      setLiveData(cachedLive);
      setIsLoadingLive(false);
      setLiveError(null);
      return;
    }

    let isMounted = true;
    setIsLoadingLive(true);
    setLiveError(null);
    setLiveData(null);

    dictionaryService.fetchLiveDictionary(word.word).then(res => {
      if (isMounted) {
        setIsLoadingLive(false);
        if (res) {
          setLiveData(res);
        } else {
          setLiveError('No live third-party dictionary definition found for this word.');
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [word?.word]);

  if (!word) return null;

  const fetchLiveDictionary = async () => {
    setIsLoadingLive(true);
    setLiveError(null);
    const res = await dictionaryService.fetchLiveDictionary(word.word);
    setIsLoadingLive(false);
    if (res) {
      setLiveData(res);
    } else {
      setLiveError('Could not fetch live definitions. Please check network connection.');
    }
  };

  const playWordAudio = () => {
    speechService.speak(word.word, userStats?.speechSpeed || 1.0);
  };

  const playNativeAudio = () => {
    if (liveData?.audioUrl) {
      const audio = new Audio(liveData.audioUrl);
      audio.play().catch(() => {
        speechService.speak(word.word, userStats?.speechSpeed || 1.0);
      });
    } else {
      speechService.speak(word.word, userStats?.speechSpeed || 1.0);
    }
  };

  const playSentenceAudio = (sentence: string, idx: number) => {
    setPlayingSentenceIdx(idx);
    speechService.speak(sentence, userStats?.speechSpeed || 1.0, () => {
      setPlayingSentenceIdx(null);
    });
  };

  const exampleList = word.exampleSentences && word.exampleSentences.length > 0 
    ? word.exampleSentences 
    : (word.exampleSentence ? [word.exampleSentence] : ['No example sentences available.']);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              {word.cefrLevel}
            </span>
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
              {word.partOfSpeech}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => word.id && handleToggleFavorite(word.id)}
              className={`p-2 rounded-xl transition ${
                word.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              <Star className={`w-5 h-5 ${word.isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Word Info Banner */}
        <div className="px-6 pt-5 pb-4 text-center border-b border-slate-100 dark:border-slate-800/60">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {word.word}
          </h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-slate-500 dark:text-slate-400 font-mono text-sm">
              {word.pronunciation || '/.../'}
            </span>
            <button
              onClick={playWordAudio}
              className="p-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs (Meaning, Examples, Related, Notes) */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 mt-5 -mb-4 justify-around text-xs font-bold">
            <button
              onClick={() => setActiveTab('meaning')}
              className={`pb-3 px-2 transition border-b-2 flex items-center gap-1.5 ${
                activeTab === 'meaning'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Meaning</span>
            </button>

            <button
              onClick={() => setActiveTab('examples')}
              className={`pb-3 px-2 transition border-b-2 flex items-center gap-1.5 ${
                activeTab === 'examples'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Examples ({exampleList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('related')}
              className={`pb-3 px-2 transition border-b-2 flex items-center gap-1.5 ${
                activeTab === 'related'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Related</span>
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`pb-3 px-2 transition border-b-2 flex items-center gap-1.5 ${
                activeTab === 'notes'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Notes</span>
            </button>
          </div>
        </div>

        {/* Tab Body Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          
          {/* Meaning Tab (Powered by Live Dictionary API) */}
          {activeTab === 'meaning' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Definitions
                  </span>
                  {liveData && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-200/60 dark:border-emerald-800/60">
                      {liveData.source}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleFetchAIMeaning(false)}
                    disabled={loadingAI}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 text-amber-700 dark:text-amber-300 border border-amber-300/50 dark:border-amber-700/50 flex items-center gap-1 transition shadow-sm"
                    title="Generate simple learner explanation with Gemini AI"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${loadingAI ? 'animate-spin' : 'text-amber-500'}`} />
                    <span>{loadingAI ? 'AI Explaining...' : '✨ AI Meaning'}</span>
                  </button>

                  <button
                    onClick={fetchLiveDictionary}
                    disabled={isLoadingLive}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingLive ? 'animate-spin' : ''}`} />
                    <span>{isLoadingLive ? 'Connecting...' : 'Reload API'}</span>
                  </button>
                </div>
              </div>

              {/* Gemini AI Meaning Card */}
              {loadingAI && (
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-center gap-2 text-xs text-amber-700 dark:text-amber-300 animate-pulse">
                  <Sparkles className="w-4 h-4 animate-spin text-amber-500" />
                  <span>Gemini AI is generating a simple learner explanation...</span>
                </div>
              )}

              {aiMeaning && !loadingAI && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/90 to-orange-50/70 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-800/60 text-xs space-y-2.5 animate-fade-in shadow-sm">
                  <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 font-bold text-xs pb-1.5 border-b border-amber-200/60 dark:border-amber-800/40">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Gemini AI Tutor</span>
                    </div>
                    <button
                      onClick={() => handleFetchAIMeaning(true)}
                      disabled={loadingAI}
                      className="p-1.5 rounded-lg bg-amber-200/70 hover:bg-amber-300 dark:bg-amber-900/70 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-100 flex items-center justify-center transition shadow-xs active:scale-95"
                      title="Refresh Answer (Generate alternative explanation)"
                      aria-label="Refresh Answer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingAI ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  <div>
                    <span className="font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase block mb-0.5">
                      Simple Meaning:
                    </span>
                    <p className="text-sm font-semibold text-slate-900 dark:text-amber-100 leading-relaxed">
                      {aiMeaning.simpleMeaning}
                    </p>
                  </div>

                  {aiMeaning.realLifeExample && (
                    <div>
                      <span className="font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase block mb-0.5">
                        Daily Life Example:
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 italic">
                        "{aiMeaning.realLifeExample}"
                      </p>
                    </div>
                  )}

                  {aiMeaning.memoryTip && (
                    <div className="pt-1.5 border-t border-amber-200/60 dark:border-amber-800/40">
                      <span className="font-bold text-amber-700 dark:text-amber-400 text-[10px] block mb-0.5">
                        💡 Memory Trick (Mnemonic):
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 text-[11px]">
                        {aiMeaning.memoryTip}
                      </p>
                    </div>
                  )}

                  {aiMeaning.whenToUse && (
                    <div className="pt-1 text-[10px] text-slate-500 dark:text-slate-400">
                      <span className="font-bold">When to use:</span> {aiMeaning.whenToUse}
                    </div>
                  )}
                </div>
              )}

                {isLoadingLive && (
                  <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center gap-2 text-xs text-indigo-600 dark:text-indigo-400">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    <span>Fetching live definitions & real audio from API...</span>
                  </div>
                )}

                {liveData && !isLoadingLive && (
                  <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
                    {/* Audio & Phonetics if present */}
                    {(liveData.phonetic || liveData.audioUrl) && (
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                          {liveData.phonetic || word.pronunciation}
                        </span>
                        {liveData.audioUrl && (
                          <button
                            onClick={playNativeAudio}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Play Real Voice</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Categorized Definitions */}
                    <div className="space-y-2">
                      {liveData.definitions.map((def, i) => (
                        <div key={i} className="text-xs space-y-1">
                          <div className="flex items-start gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold uppercase text-[9px] shrink-0 mt-0.5">
                              {def.partOfSpeech}
                            </span>
                            <span className="text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                              {def.definition}
                            </span>
                          </div>
                          {def.example && (
                            <p className="text-slate-500 dark:text-slate-400 italic pl-5 text-[11px]">
                              "{def.example}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Live Synonyms */}
                    {liveData.synonyms && liveData.synonyms.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Live Synonyms
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {liveData.synonyms.map((s, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-medium border border-slate-200 dark:border-slate-600">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {liveError && !isLoadingLive && !liveData && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                    {liveError}
                  </p>
                )}
            </div>
          )}

          {/* Examples Tab */}
          {activeTab === 'examples' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Contextual Sentences
              </span>
              {exampleList.map((sentence, idx) => (
                <div 
                  key={idx}
                  className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800"
                >
                  <div className="flex gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      "{sentence}"
                    </p>
                  </div>
                  <button
                    onClick={() => playSentenceAudio(sentence, idx)}
                    title="Play sentence audio"
                    className={`p-2 rounded-xl shrink-0 transition ${
                      playingSentenceIdx === idx
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Related Tab */}
          {activeTab === 'related' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Synonyms & Family Words
              </span>
              <div className="flex flex-wrap gap-2">
                {((word.relatedWords && word.relatedWords.length > 0) || (liveData?.synonyms && liveData.synonyms.length > 0)) ? (
                  Array.from(new Set([...(word.relatedWords || []), ...(liveData?.synonyms || [])])).map((rw, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                    >
                      {rw}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No extra related words recorded yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Personal Study Notes
              </span>
              <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                {word.notes || 'Tip: Use this word in a conversation or writing exercise today to solidify your long-term memory!'}
              </p>
            </div>
          )}

        </div>

        {/* Footer 3 Quick Status Buttons */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2.5">
          <button
            onClick={() => {
              onStatusChange('known');
              onClose();
            }}
            className="p-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Known</span>
          </button>

          <button
            onClick={() => {
              onStatusChange('understand');
              onClose();
            }}
            className="p-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Understand</span>
          </button>

          <button
            onClick={() => {
              onStatusChange('new');
              onClose();
            }}
            className="p-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <XCircle className="w-4 h-4" />
            <span>New</span>
          </button>
        </div>

      </div>
    </div>
  );
};

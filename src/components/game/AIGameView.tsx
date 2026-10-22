import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, 
  Sparkles, 
  Trophy, 
  Flame, 
  RotateCcw, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Lightbulb, 
  BrainCircuit, 
  Zap,
  Volume2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { speechService } from '../../services/speechService';
import { getStoredGeminiKey } from '../../services/geminiService';
import confetti from 'canvas-confetti';

interface AIGameViewProps {
  onBack: () => void;
}

type GameMode = 'mystery' | 'synonym' | 'grammar';

interface MysteryQuestion {
  word: string;
  cefrLevel: string;
  partOfSpeech: string;
  clue: string;
  masked: string;
  options: string[];
}

interface SynonymQuestion {
  prompt: string;
  targetWord: string;
  questionType: 'synonym' | 'antonym';
  correctAnswer: string;
  options: string[];
}

interface GrammarDetectiveQuestion {
  errorSentence: string;
  ruleExplanation: string;
  correctSentence: string;
  options: string[];
}

export const AIGameView: React.FC<AIGameViewProps> = ({ onBack }) => {
  const { words, setCurrentScreen } = useApp();
  const [activeMode, setActiveMode] = useState<GameMode>('mystery');
  
  // Game scores & stats
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(() => {
    return parseInt(localStorage.getItem('vocabmaster_game_best_streak') || '0', 10);
  });
  
  // Question states
  const [mysteryQ, setMysteryQ] = useState<MysteryQuestion | null>(null);
  const [synonymQ, setSynonymQ] = useState<SynonymQuestion | null>(null);
  const [grammarQ, setGrammarQ] = useState<GrammarDetectiveQuestion | null>(null);
  
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [revealClue, setRevealClue] = useState<boolean>(false);
  const [loadingAI, setLoadingAI] = useState<boolean>(false);

  // Fallback offline curated question banks
  const offlineMysteryPool: MysteryQuestion[] = [
    {
      word: 'reliable',
      cefrLevel: 'B1',
      partOfSpeech: 'adjective',
      clue: 'Someone or something you can always trust or count on to work properly.',
      masked: 'r _ _ _ _ _ _ e',
      options: ['reliable', 'hesitant', 'complex', 'frequent']
    },
    {
      word: 'abundant',
      cefrLevel: 'B2',
      partOfSpeech: 'adjective',
      clue: 'Existing or available in large, overflowing quantities; more than enough.',
      masked: 'a _ _ _ _ _ _ t',
      options: ['abundant', 'scarce', 'temporary', 'fragile']
    },
    {
      word: 'decide',
      cefrLevel: 'A1',
      partOfSpeech: 'verb',
      clue: 'To make a final choice or judgment about what to do after thinking.',
      masked: 'd _ _ _ _ e',
      options: ['decide', 'ignore', 'wander', 'postpone']
    },
    {
      word: 'essential',
      cefrLevel: 'B1',
      partOfSpeech: 'adjective',
      clue: 'Extremely important or absolutely necessary for life or success.',
      masked: 'e _ _ _ _ _ _ _ l',
      options: ['essential', 'optional', 'casual', 'doubtful']
    },
    {
      word: 'accomplish',
      cefrLevel: 'B2',
      partOfSpeech: 'verb',
      clue: 'To achieve or successfully finish doing something difficult.',
      masked: 'a _ _ _ _ _ _ _ _ h',
      options: ['accomplish', 'surrender', 'hesitate', 'complicate']
    }
  ];

  const offlineSynonymPool: SynonymQuestion[] = [
    {
      prompt: 'What is the SYNONYM (similar word) of:',
      targetWord: 'Reliable',
      questionType: 'synonym',
      correctAnswer: 'Trustworthy',
      options: ['Trustworthy', 'Deceptive', 'Hesitant', 'Careless']
    },
    {
      prompt: 'What is the ANTONYM (opposite word) of:',
      targetWord: 'Abundant',
      questionType: 'antonym',
      correctAnswer: 'Scarce',
      options: ['Scarce', 'Plentiful', 'Generous', 'Heavy']
    },
    {
      prompt: 'What is the SYNONYM of:',
      targetWord: 'Crucial',
      questionType: 'synonym',
      correctAnswer: 'Critical',
      options: ['Critical', 'Unimportant', 'Trivial', 'Minor']
    },
    {
      prompt: 'What is the ANTONYM of:',
      targetWord: 'Expand',
      questionType: 'antonym',
      correctAnswer: 'Shrink',
      options: ['Shrink', 'Enlarge', 'Broaden', 'Stretch']
    },
    {
      prompt: 'What is the SYNONYM of:',
      targetWord: 'Genuine',
      questionType: 'synonym',
      correctAnswer: 'Authentic',
      options: ['Authentic', 'Fake', 'Artificial', 'Pretended']
    }
  ];

  const offlineGrammarPool: GrammarDetectiveQuestion[] = [
    {
      errorSentence: "She don't like drinking hot coffee in the afternoon.",
      ruleExplanation: "Third-person singular (she/he/it) takes 'does not' / 'doesn't', not 'don't'.",
      correctSentence: "She doesn't like drinking hot coffee in the afternoon.",
      options: [
        "She doesn't like drinking hot coffee in the afternoon.",
        "She don't likes drinking hot coffee in the afternoon.",
        "She not likes drinking hot coffee in the afternoon.",
        "She didn't liked drinking hot coffee in the afternoon."
      ]
    },
    {
      errorSentence: "If I will win the lottery, I will travel around the world.",
      ruleExplanation: "In the first conditional, the 'if' clause uses simple present ('If I win'), not 'will'.",
      correctSentence: "If I win the lottery, I will travel around the world.",
      options: [
        "If I win the lottery, I will travel around the world.",
        "If I will won the lottery, I will travel around the world.",
        "If I won the lottery, I will travels around the world.",
        "If I am win the lottery, I travel around the world."
      ]
    },
    {
      errorSentence: "I have seen that movie yesterday with my friends.",
      ruleExplanation: "Specific past time markers like 'yesterday' require Past Simple ('I saw'), not Present Perfect.",
      correctSentence: "I saw that movie yesterday with my friends.",
      options: [
        "I saw that movie yesterday with my friends.",
        "I have saw that movie yesterday with my friends.",
        "I am seen that movie yesterday with my friends.",
        "I had saw that movie yesterday with my friends."
      ]
    }
  ];

  // Pick question based on active mode
  const loadNextQuestion = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setRevealClue(false);

    if (activeMode === 'mystery') {
      // Pick random from pool or dynamic word from database
      if (words && words.length > 10) {
        const randomWord = words[Math.floor(Math.random() * words.length)];
        const wrongWords = words.filter(w => w.word !== randomWord.word).sort(() => 0.5 - Math.random()).slice(0, 3);
        const options = [randomWord.word, ...wrongWords.map(w => w.word)].sort(() => 0.5 - Math.random());
        
        const wLen = randomWord.word.length;
        const masked = wLen <= 3 
          ? randomWord.word[0] + ' _ _' 
          : randomWord.word[0] + ' ' + '_ '.repeat(wLen - 2) + randomWord.word[wLen - 1];

        setMysteryQ({
          word: randomWord.word,
          cefrLevel: randomWord.cefrLevel,
          partOfSpeech: randomWord.partOfSpeech,
          clue: randomWord.meaning || 'A foundational English vocabulary word.',
          masked,
          options
        });
      } else {
        const q = offlineMysteryPool[Math.floor(Math.random() * offlineMysteryPool.length)];
        setMysteryQ(q);
      }
    } else if (activeMode === 'synonym') {
      const q = offlineSynonymPool[Math.floor(Math.random() * offlineSynonymPool.length)];
      setSynonymQ(q);
    } else if (activeMode === 'grammar') {
      const q = offlineGrammarPool[Math.floor(Math.random() * offlineGrammarPool.length)];
      setGrammarQ(q);
    }
  };

  useEffect(() => {
    loadNextQuestion();
  }, [activeMode]);

  const handleSelectOption = (opt: string, correct: string) => {
    if (isAnswered) return;
    setSelectedOption(opt);
    setIsAnswered(true);

    const isCorrect = opt.toLowerCase().trim() === correct.toLowerCase().trim();
    if (isCorrect) {
      const newScore = score + 10;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
        localStorage.setItem('vocabmaster_game_best_streak', String(newStreak));
      }
      confetti({ particleCount: 45, spread: 55, origin: { y: 0.7 } });
    } else {
      setStreak(0);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-20 pt-1 select-none">
      
      {/* Game Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
            title="Return to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-indigo-400" />
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">AI English Arena</h1>
            </div>
            <p className="text-xs text-slate-400">Master vocabulary through interactive AI challenges</p>
          </div>
        </div>

        {/* Score & Streak */}
        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center gap-1.5 text-amber-400 font-bold text-xs sm:text-sm shadow-sm">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="tabular-nums">{score} pts</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-1.5 text-rose-400 font-bold text-xs sm:text-sm shadow-sm">
            <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
            <span className="tabular-nums">{streak} Streak</span>
          </div>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveMode('mystery')}
          className={`py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition ${
            activeMode === 'mystery'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Mystery Word</span>
        </button>

        <button
          onClick={() => setActiveMode('synonym')}
          className={`py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition ${
            activeMode === 'synonym'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Synonym Duel</span>
        </button>

        <button
          onClick={() => setActiveMode('grammar')}
          className={`py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition ${
            activeMode === 'grammar'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <BrainCircuit className="w-4 h-4" />
          <span>Grammar Detective</span>
        </button>
      </div>

      {/* Mode 1: AI Mystery Word */}
      {activeMode === 'mystery' && mysteryQ && (
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6 relative overflow-hidden text-center">
          <div className="flex items-center justify-between text-xs">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-extrabold border border-indigo-500/30">
              Level {mysteryQ.cefrLevel} • {mysteryQ.partOfSpeech}
            </span>
            <button
              onClick={() => setRevealClue(prev => !prev)}
              className="flex items-center gap-1 text-amber-400 font-bold hover:underline"
            >
              <Lightbulb className="w-4 h-4" />
              <span>{revealClue ? 'Hide Hint' : 'Reveal Clue'}</span>
            </button>
          </div>

          <div className="space-y-3 my-4">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold block">
              Guess the English word:
            </span>
            <div className="text-3xl sm:text-5xl font-mono font-black text-white tracking-widest py-3 px-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 inline-block">
              {isAnswered ? mysteryQ.word : mysteryQ.masked}
            </div>

            <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto italic mt-2">
              "{mysteryQ.clue}"
            </p>
          </div>

          {/* 4 Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {mysteryQ.options.map((opt, idx) => {
              const isCorrect = opt.toLowerCase() === mysteryQ.word.toLowerCase();
              const isChosen = selectedOption === opt;
              
              let btnStyle = 'bg-slate-800/80 hover:bg-slate-700/80 text-white border-slate-700';
              if (isAnswered) {
                if (isCorrect) {
                  btnStyle = 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30';
                } else if (isChosen && !isCorrect) {
                  btnStyle = 'bg-rose-600 text-white border-rose-500';
                } else {
                  btnStyle = 'bg-slate-800/40 text-slate-500 border-slate-800';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(opt, mysteryQ.word)}
                  disabled={isAnswered}
                  className={`p-4 rounded-2xl font-bold text-sm sm:text-base border transition duration-150 flex items-center justify-between ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-white" />}
                  {isAnswered && isChosen && !isCorrect && <XCircle className="w-5 h-5 text-white" />}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          {isAnswered && (
            <div className="pt-4 flex justify-center">
              <button
                onClick={loadNextQuestion}
                className="py-3 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 animate-bounce"
              >
                <span>Next Question</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Synonym / Antonym Duel */}
      {activeMode === 'synonym' && synonymQ && (
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6 text-center">
          <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-extrabold text-xs border border-purple-500/30 inline-block">
            {synonymQ.questionType === 'synonym' ? '✨ Synonyms Match' : '⚡ Antonyms Opposites'}
          </span>

          <div className="space-y-2">
            <p className="text-slate-400 text-sm font-semibold">{synonymQ.prompt}</p>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {synonymQ.targetWord}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
            {synonymQ.options.map((opt, idx) => {
              const isCorrect = opt === synonymQ.correctAnswer;
              const isChosen = selectedOption === opt;

              let btnStyle = 'bg-slate-800/80 hover:bg-slate-700/80 text-white border-slate-700';
              if (isAnswered) {
                if (isCorrect) {
                  btnStyle = 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30';
                } else if (isChosen && !isCorrect) {
                  btnStyle = 'bg-rose-600 text-white border-rose-500';
                } else {
                  btnStyle = 'bg-slate-800/40 text-slate-500 border-slate-800';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(opt, synonymQ.correctAnswer)}
                  disabled={isAnswered}
                  className={`p-4 rounded-2xl font-bold text-sm sm:text-base border transition duration-150 flex items-center justify-between ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-white" />}
                  {isAnswered && isChosen && !isCorrect && <XCircle className="w-5 h-5 text-white" />}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <div className="pt-4 flex justify-center">
              <button
                onClick={loadNextQuestion}
                className="py-3 px-8 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition flex items-center gap-2"
              >
                <span>Next Duel</span>
                <Zap className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mode 3: Grammar Detective */}
      {activeMode === 'grammar' && grammarQ && (
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6 text-center">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-xs border border-amber-500/30 inline-block">
            🔎 Spot the Error & Choose the Correct Sentence
          </span>

          <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-900/50 text-left">
            <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider block mb-1">
              ❌ Sentence With Grammar Mistake:
            </span>
            <p className="text-base sm:text-lg font-bold text-rose-200">
              "{grammarQ.errorSentence}"
            </p>
          </div>

          <div className="space-y-2 text-left">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Choose the Correct Sentence:
            </span>
            <div className="space-y-2.5">
              {grammarQ.options.map((opt, idx) => {
                const isCorrect = opt === grammarQ.correctSentence;
                const isChosen = selectedOption === opt;

                let btnStyle = 'bg-slate-800/80 hover:bg-slate-700/80 text-white border-slate-700';
                if (isAnswered) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30';
                  } else if (isChosen && !isCorrect) {
                    btnStyle = 'bg-rose-600 text-white border-rose-500';
                  } else {
                    btnStyle = 'bg-slate-800/40 text-slate-500 border-slate-800';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(opt, grammarQ.correctSentence)}
                    disabled={isAnswered}
                    className={`w-full p-3.5 rounded-2xl font-semibold text-xs sm:text-sm border transition text-left flex items-start justify-between gap-3 ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-0.5" />}
                    {isAnswered && isChosen && !isCorrect && <XCircle className="w-5 h-5 text-white shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {isAnswered && (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/50 text-left text-xs text-amber-200 space-y-1">
              <span className="font-bold uppercase tracking-wider block text-amber-400">💡 Rule Explained:</span>
              <p>{grammarQ.ruleExplanation}</p>
            </div>
          )}

          {isAnswered && (
            <div className="pt-2 flex justify-center">
              <button
                onClick={loadNextQuestion}
                className="py-3 px-8 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-lg shadow-amber-600/30 transition flex items-center gap-2"
              >
                <span>Next Mystery</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

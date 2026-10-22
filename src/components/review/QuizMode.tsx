import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  BrainCircuit, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Volume2,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { VocabularyWord } from '../../types/vocabulary';
import { speechService } from '../../services/speechService';
import confetti from 'canvas-confetti';

export const QuizMode: React.FC = () => {
  const { words, setCurrentScreen, handleWordStatusChange } = useApp();

  const [questionIdx, setQuestionIdx] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [quizQuestions, setQuizQuestions] = useState<{
    word: VocabularyWord;
    options: string[];
    correct: string;
  }[]>([]);

  // Generate 10 random questions
  useEffect(() => {
    if (words.length < 4) return;

    const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, 10);
    const questions = shuffled.map(word => {
      // Pick 3 random wrong meanings
      const wrongWords = words.filter(w => w.id !== word.id).sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [word.meaning, ...wrongWords.map(w => w.meaning)].sort(() => Math.random() - 0.5);
      return {
        word,
        options,
        correct: word.meaning
      };
    });

    setQuizQuestions(questions);
    setQuestionIdx(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswered(false);
  }, [words]);

  if (quizQuestions.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        Preparing quiz questions...
      </div>
    );
  }

  const currentQ = quizQuestions[questionIdx];
  const isFinished = questionIdx >= quizQuestions.length;

  const handleSelectOption = async (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);

    const isCorrect = option === currentQ.correct;
    if (isCorrect) {
      setScore(prev => prev + 1);
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
      if (currentQ.word.id) {
        await handleWordStatusChange(currentQ.word.id, 'known');
      }
    } else {
      if (currentQ.word.id) {
        await handleWordStatusChange(currentQ.word.id, 'understand');
      }
    }
  };

  const handleNextQuestion = () => {
    setQuestionIdx(prev => prev + 1);
    setSelectedOption(null);
    setIsAnswered(false);
  };

  if (isFinished) {
    return (
      <div className="max-w-md mx-auto text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6 my-10">
        <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
          <BrainCircuit className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Quiz Completed!</h2>
          <p className="text-xs text-slate-400 mt-1">Great practice session</p>
        </div>

        <div className="p-6 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
          <span className="text-xs text-indigo-700 dark:text-indigo-300 font-bold uppercase tracking-wider block">Your Score</span>
          <span className="text-4xl font-black text-indigo-600 dark:text-indigo-400 my-1 block">
            {score} / {quizQuestions.length}
          </span>
          <span className="text-xs text-slate-500 font-semibold">
            {Math.round((score / quizQuestions.length) * 100)}% accuracy
          </span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setCurrentScreen('dashboard')}
            className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition"
          >
            Dashboard
          </button>
          <button
            onClick={() => {
              setQuestionIdx(0);
              setScore(0);
              setSelectedOption(null);
              setIsAnswered(false);
            }}
            className="flex-1 py-3 rounded-2xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 shadow-md transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-20 lg:pb-8 pt-2">
      {/* Quiz Top Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <button
          onClick={() => setCurrentScreen('dashboard')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit</span>
        </button>
        <span className="text-xs font-bold text-slate-900 dark:text-white">
          Question {questionIdx + 1} of {quizQuestions.length}
        </span>
        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
          Score: {score}
        </span>
      </div>

      {/* Progress */}
      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
        <div 
          className="bg-indigo-600 h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.round(((questionIdx + 1) / quizQuestions.length) * 100)}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
          {currentQ.word.cefrLevel} • {currentQ.word.partOfSpeech}
        </span>

        <h2 className="text-4xl font-black text-slate-900 dark:text-white my-4">
          {currentQ.word.word}
        </h2>

        <button
          onClick={() => speechService.speak(currentQ.word.word)}
          className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition inline-flex items-center gap-1.5 text-xs font-semibold"
        >
          <Volume2 className="w-4 h-4" />
          <span>Listen</span>
        </button>

        <p className="text-xs text-slate-400 mt-3">Select the correct definition:</p>
      </div>

      {/* 4 Multiple Choice Options */}
      <div className="space-y-2.5">
        {currentQ.options.map((option, idx) => {
          const isSelected = selectedOption === option;
          const isCorrect = option === currentQ.correct;

          let btnClass = 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-indigo-400';
          if (isAnswered) {
            if (isCorrect) {
              btnClass = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-100';
            } else if (isSelected) {
              btnClass = 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-100';
            } else {
              btnClass = 'opacity-40 border-slate-200 dark:border-slate-800';
            }
          }

          return (
            <button
              key={idx}
              disabled={isAnswered}
              onClick={() => handleSelectOption(option)}
              className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium transition flex items-center justify-between ${btnClass}`}
            >
              <span>{option}</span>
              {isAnswered && (
                <div>
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : isSelected ? (
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  ) : null}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Next Question Button */}
      {isAnswered && (
        <button
          onClick={handleNextQuestion}
          className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition animate-fade-in"
        >
          {questionIdx < quizQuestions.length - 1 ? 'Next Question →' : 'View Results'}
        </button>
      )}

    </div>
  );
};

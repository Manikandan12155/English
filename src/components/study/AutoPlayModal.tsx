import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Volume2, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Gauge,
  Sparkles
} from 'lucide-react';
import { VocabularyWord } from '../../types/vocabulary';
import { speechService } from '../../services/speechService';
import { useApp } from '../../context/AppContext';

interface AutoPlayModalProps {
  onClose: () => void;
}

export const AutoPlayModal: React.FC<AutoPlayModalProps> = ({ onClose }) => {
  const { words, userStats } = useApp();
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(userStats?.speechSpeed || 1.0);
  const [autoNextSeconds, setAutoNextSeconds] = useState<number>(userStats?.autoPlayInterval || 3);
  const [countdown, setCountdown] = useState<number>(autoNextSeconds);
  
  const timerRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);

  const activeWord: VocabularyWord | undefined = words[currentIndex] || words[0];

  const speakCurrent = () => {
    if (!activeWord) return;
    speechService.speak(activeWord.word, playbackSpeed, () => {
      // Once word finishes, speak meaning
      if (activeWord.meaning) {
        setTimeout(() => {
          speechService.speak(activeWord.meaning, playbackSpeed);
        }, 500);
      }
    });
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
    setCountdown(autoNextSeconds);
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
    setCountdown(autoNextSeconds);
  };

  // Play audio on slide change
  useEffect(() => {
    if (!activeWord || !isPlaying) return;
    speakCurrent();

    setCountdown(autoNextSeconds);

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => (prev > 1 ? prev - 1 : autoNextSeconds));
    }, 1000);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      handleNext();
    }, autoNextSeconds * 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [currentIndex, isPlaying, autoNextSeconds, playbackSpeed]);

  if (!activeWord) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl text-white animate-fade-in">
      <div className="max-w-2xl w-full flex flex-col justify-between min-h-[580px] p-6 sm:p-10 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">Auto Play Audio Mode</h3>
              <p className="text-[11px] text-slate-400">Continuous immersion & pronunciation</p>
            </div>
          </div>

          <button
            onClick={() => {
              speechService.stop();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Word Hero Display */}
        <div className="my-auto py-8 text-center space-y-6">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {activeWord.cefrLevel}
            </span>
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-slate-800 text-slate-300 capitalize">
              {activeWord.partOfSpeech}
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-white animate-pulse-subtle">
            {activeWord.word}
          </h1>

          <div className="flex items-center justify-center gap-3">
            <p className="text-xl font-mono text-indigo-400">
              {activeWord.pronunciation || '/.../'}
            </p>
            <button
              onClick={speakCurrent}
              className="p-2 rounded-full bg-indigo-600/30 text-indigo-400 hover:bg-indigo-600 hover:text-white transition"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          {/* Meaning & Example */}
          <div className="max-w-md mx-auto space-y-3 pt-4">
            <p className="text-slate-200 text-lg sm:text-xl font-medium leading-relaxed">
              {activeWord.meaning}
            </p>
            {activeWord.exampleSentence && (
              <p className="text-slate-400 text-sm italic">
                "{activeWord.exampleSentence}"
              </p>
            )}
          </div>
        </div>

        {/* Bottom Playback Controls (Panel 10) */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          
          {/* Speed Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
            <Gauge className="w-4 h-4 text-indigo-400" />
            <span>Speed:</span>
            <select
              value={playbackSpeed}
              onChange={e => setPlaybackSpeed(parseFloat(e.target.value))}
              className="bg-slate-800 text-white rounded-lg px-2 py-1 border border-slate-700 outline-none cursor-pointer"
            >
              <option value="0.75">0.75x</option>
              <option value="1.0">1.0x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
            </select>
          </div>

          {/* Center Playback Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-2.5 rounded-full bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 transition"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsPlaying(prev => !prev)}
              className="p-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/40 transition transform active:scale-95"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
            </button>

            <button
              onClick={handleNext}
              className="p-2.5 rounded-full bg-slate-800 text-slate-300 hover:text-white transition"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Auto Next countdown display */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Auto Next:</span>
            <select
              value={autoNextSeconds}
              onChange={e => setAutoNextSeconds(parseInt(e.target.value))}
              className="bg-slate-800 text-white rounded-lg px-2 py-1 border border-slate-700 outline-none cursor-pointer"
            >
              <option value="2">2s</option>
              <option value="3">3s</option>
              <option value="5">5s</option>
              <option value="7">7s</option>
            </select>
            <span className="w-5 h-5 rounded-full bg-indigo-900/80 text-indigo-300 flex items-center justify-center font-bold text-[10px]">
              {countdown}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};

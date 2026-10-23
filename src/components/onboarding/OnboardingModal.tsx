import React from 'react';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/database';

interface OnboardingModalProps {
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
  const { userStats } = useApp();

  const handleGetStarted = async () => {
    if (userStats && userStats.id) {
      await db.userStats.update(userStats.id, { hasSeenOnboarding: true });
    }
    onClose();
  };

  const features = [
    '5,000 carefully curated words (A1 – B2)',
    'Mark as Known / Understand / New',
    'Audio pronunciation & Web Speech',
    'Examples & contextual practice',
    'Smart revision system & Spaced Repetition'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in text-white">
      <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col items-center text-center">
        
        {/* LexiCraft Logo */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-2xl shadow-indigo-500/40 my-4 transform hover:rotate-3 transition">
          <span className="text-white font-black text-4xl">L</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
          LexiCraft
        </h1>
        <p className="text-xs text-indigo-400 font-semibold tracking-wide uppercase mt-1">
          Your personal vocabulary companion
        </p>

        {/* Feature Checkmarks (Panel 1) */}
        <div className="space-y-3.5 my-8 text-left w-full max-w-xs">
          {features.map((feat, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span className="text-xs sm:text-sm text-slate-300 font-medium">
                {feat}
              </span>
            </div>
          ))}
        </div>

        {/* Action Button (Panel 1) */}
        <button
          onClick={handleGetStarted}
          className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 group transition"
        >
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={handleGetStarted}
          className="text-xs text-slate-500 hover:text-slate-300 mt-4 transition"
        >
          Explore Dashboard directly
        </button>

      </div>
    </div>
  );
};

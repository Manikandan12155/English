import React, { useState } from 'react';
import { X, Plus, Save } from 'lucide-react';
import { VocabularyWord, CEFRLevel, PartOfSpeech, WordStatus } from '../../types/vocabulary';
import { db } from '../../db/database';
import { useApp } from '../../context/AppContext';

interface EditWordModalProps {
  wordToEdit?: VocabularyWord | null;
  onClose: () => void;
}

export const EditWordModal: React.FC<EditWordModalProps> = ({ wordToEdit, onClose }) => {
  const { addToast, triggerRefresh } = useApp();

  const [word, setWord] = useState(wordToEdit?.word || '');
  const [meaning, setMeaning] = useState(wordToEdit?.meaning || '');
  const [simpleMeaning, setSimpleMeaning] = useState(wordToEdit?.simpleMeaning || '');
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>(wordToEdit?.cefrLevel || 'A1');
  const [partOfSpeech, setPartOfSpeech] = useState<PartOfSpeech>(wordToEdit?.partOfSpeech || 'noun');
  const [pronunciation, setPronunciation] = useState(wordToEdit?.pronunciation || '');
  const [exampleSentence, setExampleSentence] = useState(wordToEdit?.exampleSentence || '');
  const [status, setStatus] = useState<WordStatus>(wordToEdit?.status || 'new');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !meaning.trim()) {
      addToast('Word and Meaning are required!', 'warning');
      return;
    }

    if (wordToEdit && wordToEdit.id) {
      await db.words.update(wordToEdit.id, {
        word: word.trim(),
        meaning: meaning.trim(),
        simpleMeaning: simpleMeaning.trim() || undefined,
        cefrLevel,
        partOfSpeech,
        pronunciation: pronunciation.trim() || undefined,
        exampleSentence: exampleSentence.trim() || undefined,
        exampleSentences: exampleSentence.trim() ? [exampleSentence.trim()] : [],
        status
      });
      addToast(`Updated "${word}" successfully!`, 'success');
    } else {
      await db.words.add({
        word: word.trim(),
        meaning: meaning.trim(),
        simpleMeaning: simpleMeaning.trim() || undefined,
        cefrLevel,
        partOfSpeech,
        pronunciation: pronunciation.trim() || undefined,
        exampleSentence: exampleSentence.trim() || undefined,
        exampleSentences: exampleSentence.trim() ? [exampleSentence.trim()] : [],
        status,
        createdAt: Date.now(),
        reviewCount: 0,
        correctCount: 0,
        mistakeCount: 0
      });
      addToast(`Added "${word}" to vocabulary!`, 'success');
    }

    triggerRefresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            {wordToEdit ? 'Edit Vocabulary Word' : 'Add New Vocabulary Word'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Word *
            </label>
            <input
              type="text"
              required
              value={word}
              onChange={e => setWord(e.target.value)}
              placeholder="e.g. reliable"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                CEFR Level
              </label>
              <select
                value={cefrLevel}
                onChange={e => setCefrLevel(e.target.value as CEFRLevel)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
              >
                <option value="A1">A1 - Beginner</option>
                <option value="A2">A2 - Elementary</option>
                <option value="B1">B1 - Intermediate</option>
                <option value="B2">B2 - Upper-Intermediate</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Part of Speech
              </label>
              <select
                value={partOfSpeech}
                onChange={e => setPartOfSpeech(e.target.value as PartOfSpeech)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
              >
                <option value="noun">Noun</option>
                <option value="verb">Verb</option>
                <option value="adjective">Adjective</option>
                <option value="adverb">Adverb</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Phonetic Pronunciation
            </label>
            <input
              type="text"
              value={pronunciation}
              onChange={e => setPronunciation(e.target.value)}
              placeholder="e.g. /rɪˈlaɪəbl/"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Meaning (Definition) *
            </label>
            <textarea
              required
              rows={2}
              value={meaning}
              onChange={e => setMeaning(e.target.value)}
              placeholder="Full clear definition..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Simple Meaning (Optional)
            </label>
            <input
              type="text"
              value={simpleMeaning}
              onChange={e => setSimpleMeaning(e.target.value)}
              placeholder="Quick one-line explanation..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Example Sentence
            </label>
            <textarea
              rows={2}
              value={exampleSentence}
              onChange={e => setExampleSentence(e.target.value)}
              placeholder="e.g. He is a reliable team member."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Initial Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['new', 'understand', 'known'] as const).map(st => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setStatus(st)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold capitalize border transition ${
                    status === st
                      ? st === 'known' ? 'bg-emerald-500 text-white border-emerald-500' :
                        st === 'understand' ? 'bg-amber-500 text-white border-amber-500' :
                        'bg-rose-500 text-white border-rose-500'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{wordToEdit ? 'Save Changes' : 'Add Word to VocabMaster'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

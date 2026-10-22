import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Download,
  FileText,
  Sparkles,
  Key,
  BookOpen,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { parseCSV, processImportRows, ImportResult } from '../../services/csvService';
import { extractTextFromPDF, parseOxfordWordlistText } from '../../services/pdfService';
import { 
  extractVocabularyWithGemini, 
  getStoredGeminiKey, 
  saveGeminiKey 
} from '../../services/geminiService';
import { db } from '../../db/database';
import { useApp } from '../../context/AppContext';
import { VocabularyWord } from '../../types/vocabulary';

interface CsvImportModalProps {
  onClose: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ onClose }) => {
  const { words, addToast, triggerRefresh } = useApp();

  const [activeTab, setActiveTab] = useState<'oxford' | 'pdf' | 'csv'>('oxford');
  
  // CSV State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [summary, setSummary] = useState<ImportResult | null>(null);

  // PDF & AI State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [apiKey, setApiKey] = useState<string>(getStoredGeminiKey());
  const [pdfProgress, setPdfProgress] = useState<number>(0);
  const [extractionMode, setExtractionMode] = useState<'ai' | 'fast'>('ai');
  const [extractedWords, setExtractedWords] = useState<Omit<VocabularyWord, 'id'>[]>([]);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [loadOxfordProgress, setLoadOxfordProgress] = useState<number | null>(null);

  // 1. One-Click Load Oxford 5000 Words
  const handleLoadOxford5000 = async () => {
    setLoading(true);
    setLoadOxfordProgress(10);

    try {
      const response = await fetch('/oxford-5000.json');
      if (!response.ok) {
        throw new Error('Could not fetch /oxford-5000.json');
      }

      setLoadOxfordProgress(40);
      const dataset: VocabularyWord[] = await response.json();
      setLoadOxfordProgress(70);

      // Check existing words to prevent duplicates
      const existingSet = new Set(words.map(w => w.word.toLowerCase().trim()));
      const newWords = dataset.filter(w => !existingSet.has(w.word.toLowerCase().trim()));

      if (newWords.length > 0) {
        // Chunk add to IndexedDB
        const chunkSize = 500;
        for (let i = 0; i < newWords.length; i += chunkSize) {
          const chunk = newWords.slice(i, i + chunkSize);
          await db.words.bulkAdd(chunk);
          setLoadOxfordProgress(70 + Math.round((i / newWords.length) * 30));
        }
        triggerRefresh();
        addToast(`Successfully added ${newWords.length} Oxford words to your database!`, 'success');
      } else {
        addToast('All Oxford words are already loaded in your database.', 'info');
      }
      setLoadOxfordProgress(100);
      onClose();
    } catch (err: any) {
      console.error(err);
      addToast('Error loading Oxford 5000 dataset: ' + err.message, 'warning');
    } finally {
      setLoading(false);
      setLoadOxfordProgress(null);
    }
  };

  // 2. Handle PDF Upload & Extraction
  const handleProcessPDF = async () => {
    if (!pdfFile) return;
    setIsExtracting(true);
    setPdfProgress(10);

    try {
      saveGeminiKey(apiKey);
      const text = await extractTextFromPDF(pdfFile, p => setPdfProgress(p));

      if (!text || text.trim().length === 0) {
        addToast('No text could be extracted from this PDF.', 'warning');
        setIsExtracting(false);
        return;
      }

      let parsedWords: Omit<VocabularyWord, 'id'>[] = [];

      if (extractionMode === 'ai') {
        try {
          parsedWords = await extractVocabularyWithGemini(text, apiKey);
        } catch (apiErr: any) {
          console.warn('Gemini API call failed, falling back to rule-based parser:', apiErr);
          addToast('Gemini API notice: falling back to rule-based word extractor.', 'info');
          parsedWords = parseOxfordWordlistText(text);
        }
      } else {
        parsedWords = parseOxfordWordlistText(text);
      }

      if (parsedWords.length === 0) {
        // Attempt rule-based parser if AI returned empty
        parsedWords = parseOxfordWordlistText(text);
      }

      if (parsedWords.length === 0) {
        addToast('No standard vocabulary words detected. Try AI extraction mode.', 'warning');
      } else {
        setExtractedWords(parsedWords);
        addToast(`Extracted ${parsedWords.length} vocabulary words! Review below.`, 'success');
      }
    } catch (err: any) {
      console.error(err);
      addToast('Failed to process PDF: ' + err.message, 'warning');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveExtractedWords = async () => {
    if (extractedWords.length === 0) return;
    const existingSet = new Set(words.map(w => w.word.toLowerCase().trim()));
    const valid = extractedWords.filter(w => !existingSet.has(w.word.toLowerCase().trim()));

    if (valid.length > 0) {
      await db.words.bulkAdd(valid as VocabularyWord[]);
      triggerRefresh();
      addToast(`Imported ${valid.length} words from PDF!`, 'success');
      onClose();
    } else {
      addToast('All extracted words already exist in your vocabulary.', 'info');
    }
  };

  // 3. Handle CSV
  const handleCsvImport = async () => {
    if (!csvFile) return;
    setLoading(true);

    try {
      const text = await csvFile.text();
      const { headers, rows } = parseCSV(text);

      if (rows.length === 0) {
        addToast('The selected CSV file has no data rows.', 'warning');
        setLoading(false);
        return;
      }

      const { validWords, result } = processImportRows(headers, rows, words);

      if (validWords.length > 0) {
        await db.words.bulkAdd(validWords as VocabularyWord[]);
        triggerRefresh();
      }

      setSummary(result);
      addToast(`Imported ${result.added} new words! (${result.skipped} duplicates skipped)`, 'success');
    } catch (err: any) {
      console.error(err);
      addToast('Failed to parse CSV file: ' + err.message, 'warning');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Import Vocabulary</h3>
            <p className="text-xs text-slate-500">Oxford 3000/5000, PDF AI Extractor & CSV</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 px-5 pt-3 gap-4 text-xs font-bold">
          
          <button
            onClick={() => setActiveTab('oxford')}
            className={`pb-3 px-2 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'oxford'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Oxford 3000 & 5000</span>
          </button>

          <button
            onClick={() => setActiveTab('pdf')}
            className={`pb-3 px-2 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'pdf'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>PDF AI Extractor (RAG)</span>
          </button>

          <button
            onClick={() => setActiveTab('csv')}
            className={`pb-3 px-2 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'csv'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>CSV Import</span>
          </button>

        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* TAB 1: OXFORD 3000 & 5000 */}
          {activeTab === 'oxford' && (
            <div className="space-y-5">
              
              {/* Load Master Dataset Banner */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800/80 dark:to-slate-800/40 border border-indigo-100 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    V
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Oxford 5000 Complete Wordlist
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      5,948 words (A1, A2, B1, B2) with phonetics and examples
                    </p>
                  </div>
                </div>

                {loadOxfordProgress !== null && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                      <span>Importing words...</span>
                      <span>{loadOxfordProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${loadOxfordProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleLoadOxford5000}
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading Oxford 5000 Words...</span>
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4" />
                      <span>Load Full Oxford 5000 Words into App</span>
                    </>
                  )}
                </button>
              </div>

              {/* Download Official PDF Section */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Download Official Oxford PDFs
                </span>

                <div className="space-y-2">
                  <a
                    href="/Oxford_3000.pdf"
                    download="Oxford_3000.pdf"
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-slate-800 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-indigo-500" />
                      <div>
                        <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 block group-hover:text-indigo-600 transition">
                          Oxford 3000 PDF
                        </span>
                        <span className="text-[11px] text-slate-400">Core 3,000 words (A1–B2)</span>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                  </a>

                  <a
                    href="/Oxford_5000.pdf"
                    download="Oxford_5000.pdf"
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-slate-800 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-purple-500" />
                      <div>
                        <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 block group-hover:text-indigo-600 transition">
                          Oxford 5000 PDF
                        </span>
                        <span className="text-[11px] text-slate-400">Expanded 5,000 vocabulary booklet</span>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                  </a>

                  <a
                    href="/Oxford_5000_by_CEFR_level.pdf"
                    download="Oxford_5000_by_CEFR_level.pdf"
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-slate-800 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-emerald-500" />
                      <div>
                        <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 block group-hover:text-indigo-600 transition">
                          Oxford 5000 by CEFR Level PDF
                        </span>
                        <span className="text-[11px] text-slate-400">Categorized by A1, A2, B1, B2 stages</span>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                  </a>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PDF UPLOAD & GEMINI AI RAG */}
          {activeTab === 'pdf' && (
            <div className="space-y-4">
              
              {/* Gemini API Key Input */}
              <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-800 dark:text-purple-300">
                  <Key className="w-3.5 h-3.5" />
                  <span>Google Gemini API Key</span>
                </div>
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="Enter Gemini API Key..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-slate-900 dark:text-white outline-none font-mono"
                />
                <p className="text-[10px] text-slate-500">
                  Configured with your Gemini API key. Stored locally in your browser.
                </p>
              </div>

              {/* Extraction Mode Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setExtractionMode('ai')}
                  className={`p-3 rounded-2xl border text-left transition ${
                    extractionMode === 'ai'
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-900 dark:text-purple-200 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="font-bold text-xs block">AI RAG Mode</span>
                  <span className="text-[10px] opacity-80">Full AI meaning, level & examples</span>
                </button>

                <button
                  type="button"
                  onClick={() => setExtractionMode('fast')}
                  className={`p-3 rounded-2xl border text-left transition ${
                    extractionMode === 'fast'
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="font-bold text-xs block">Fast Oxford Parser</span>
                  <span className="text-[10px] opacity-80">Instant offline Oxford PDF parsing</span>
                </button>
              </div>

              {/* PDF File Picker */}
              <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/20">
                <FileText className="w-9 h-9 text-purple-500 mb-2" />
                <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                  {pdfFile ? pdfFile.name : 'Select or drop any Vocabulary PDF'}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  e.g. Oxford 3000/5000, IELTS, novel chapter, or study list
                </span>
                <input 
                  type="file" 
                  accept=".pdf,application/pdf" 
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setPdfFile(e.target.files[0]);
                      setExtractedWords([]);
                    }
                  }} 
                  className="hidden" 
                />
              </label>

              {/* Extract Action Button */}
              {pdfFile && extractedWords.length === 0 && (
                <button
                  onClick={handleProcessPDF}
                  disabled={isExtracting}
                  className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Extracting PDF ({pdfProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Extract Vocabulary from PDF</span>
                    </>
                  )}
                </button>
              )}

              {/* Preview Extracted Words */}
              {extractedWords.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
                      Extracted Words ({extractedWords.length})
                    </span>
                    <button
                      onClick={handleSaveExtractedWords}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition"
                    >
                      Save All to Vocabulary
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                    {extractedWords.slice(0, 50).map((w, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{w.word}</span>
                          <span className="text-[10px] text-slate-400 capitalize">({w.partOfSpeech})</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          {w.cefrLevel}
                        </span>
                      </div>
                    ))}
                    {extractedWords.length > 50 && (
                      <p className="text-center text-[11px] text-slate-400 py-1">
                        + {extractedWords.length - 50} more words
                      </p>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: CSV IMPORT */}
          {activeTab === 'csv' && (
            <div className="space-y-4">
              {!summary ? (
                <>
                  <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/20">
                    <Upload className="w-8 h-8 text-indigo-500 mb-2" />
                    <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                      {csvFile ? csvFile.name : 'Choose a CSV file'}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      Columns: Word, Meaning, CEFR Level, Part of Speech, Pronunciation, Example
                    </span>
                    <input 
                      type="file" 
                      accept=".csv,text/csv" 
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          setCsvFile(e.target.files[0]);
                        }
                      }} 
                      className="hidden" 
                    />
                  </label>

                  {csvFile && (
                    <button
                      onClick={handleCsvImport}
                      disabled={loading}
                      className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md transition"
                    >
                      {loading ? 'Importing...' : 'Start CSV Import'}
                    </button>
                  )}
                </>
              ) : (
                <div className="space-y-4 text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">Import Successful!</h4>
                  <p className="text-xs text-slate-500">{summary.added} words added, {summary.skipped} skipped.</p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

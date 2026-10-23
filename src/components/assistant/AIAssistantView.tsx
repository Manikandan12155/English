import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ArrowLeft,
  Search,
  Volume2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  BookmarkPlus,
  MessageSquare,
  RefreshCw,
  Send,
  Copy,
  Check,
  Layers,
  BookOpen,
  ArrowRight,
  PlusCircle,
  Sparkle
} from 'lucide-react';
import { CEFRLevel } from '../../types/vocabulary';
import { 
  processUserMessageWithGemini,
  saveGeminiKey,
  getStoredGeminiKey,
  SituationalResult, 
  SituationalWord
} from '../../services/geminiService';
import { speechService } from '../../services/speechService';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/database';

interface AIAssistantViewProps {
  onBack: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  situationalResult?: SituationalResult;
}

const levelColorMap: Record<CEFRLevel, string> = {
  A1: 'bg-emerald-950/80 text-emerald-300',
  A2: 'bg-blue-950/80 text-blue-300',
  B1: 'bg-purple-950/80 text-purple-300',
  B2: 'bg-amber-950/80 text-amber-300',
  C1: 'bg-rose-950/80 text-rose-300',
  C2: 'bg-fuchsia-950/80 text-fuchsia-300',
};

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({ onBack }) => {
  const { addToast } = useApp();

  // Navigation: 'chat' (ChatGPT View) | 'studio' (Processed Learning View)
  const [activeView, setActiveView] = useState<'chat' | 'studio'>('chat');

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Active Curated Result for Studio
  const [currentResult, setCurrentResult] = useState<SituationalResult | null>(null);

  // Studio Sub-Category Filter: 'vocab' | 'phrase' | 'conjunction' | 'others'
  const [studioCategory, setStudioCategory] = useState<'vocab' | 'phrase' | 'conjunction' | 'others'>('vocab');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'flashcard'>('cards');

  // Flashcard index
  const [flashcardIndex, setFlashcardIndex] = useState<number>(0);
  const [isMeaningOpen, setIsMeaningOpen] = useState<boolean>(false);
  const [isSynonymsOpen, setIsSynonymsOpen] = useState<boolean>(false);
  const [isAntonymsOpen, setIsAntonymsOpen] = useState<boolean>(false);

  // Saved word tracking
  const [savedWordsMap, setSavedWordsMap] = useState<Record<string, boolean>>({});
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY;
    if (envKey && !getStoredGeminiKey()) {
      saveGeminiKey(envKey);
    }
  }, []);

  useEffect(() => {
    if (activeView === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isGenerating, activeView]);

  useEffect(() => {
    if (!currentResult?.words) return;
    const checkSavedWords = async () => {
      const map: Record<string, boolean> = {};
      for (const w of currentResult.words) {
        const found = await db.words.where('word').equalsIgnoreCase(w.word).first();
        if (found) {
          map[w.word.toLowerCase()] = true;
        }
      }
      setSavedWordsMap(map);
    };
    checkSavedWords();
  }, [currentResult]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : inputPrompt).trim();
    if (!text || isGenerating) return;

    const userMsgId = 'user-' + Date.now();
    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        sender: 'user',
        text: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];

    setMessages(newMessages);
    setInputPrompt('');
    setIsGenerating(true);

    try {
      const historyContext = newMessages.slice(-6).map(m => ({ sender: m.sender, text: m.text }));
      const analysis = await processUserMessageWithGemini(text, historyContext);

      if (analysis.intent === 'situational_toolkit' && analysis.toolkit) {
        setCurrentResult(analysis.toolkit);
        setFlashcardIndex(0);
        setIsMeaningOpen(false);
        setIsSynonymsOpen(false);
        setIsAntonymsOpen(false);

        setMessages(prev => [
          ...prev,
          {
            id: 'ai-' + Date.now(),
            sender: 'assistant',
            text: analysis.replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            situationalResult: analysis.toolkit
          }
        ]);
      } else {
        // Normal conversational chat reply without forcing a toolkit card
        setMessages(prev => [
          ...prev,
          {
            id: 'ai-' + Date.now(),
            sender: 'assistant',
            text: analysis.replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err: any) {
      if (addToast) addToast(err?.message || 'Failed to curate situation', 'warning');
      setMessages(prev => [
        ...prev,
        {
          id: 'ai-err-' + Date.now(),
          sender: 'assistant',
          text: "I encountered a hiccup connecting to the tutor engine. Please rephrase or try again in a moment.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenStudio = (result: SituationalResult) => {
    setCurrentResult(result);
    setStudioCategory('vocab');
    setSearchQuery('');
    setActiveView('studio');
  };

  const playTTS = (text: string) => {
    speechService.speak(text, 1.0);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    if (addToast) addToast('Copied to clipboard!', 'info');
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSaveWord = async (wordItem: SituationalWord) => {
    try {
      const existing = await db.words.where('word').equalsIgnoreCase(wordItem.word).first();
      if (existing) {
        if (addToast) addToast(`"${wordItem.word}" is already in your wordlist!`, 'info');
        setSavedWordsMap(prev => ({ ...prev, [wordItem.word.toLowerCase()]: true }));
        return;
      }

      await db.words.add({
        word: wordItem.word.toLowerCase(),
        meaning: wordItem.meaning,
        simpleMeaning: wordItem.simpleMeaning,
        cefrLevel: wordItem.cefrLevel,
        partOfSpeech: wordItem.partOfSpeech,
        pronunciation: wordItem.pronunciation,
        exampleSentence: wordItem.situationalSentence,
        exampleSentences: [wordItem.situationalSentence],
        status: 'new',
        createdAt: Date.now(),
        reviewCount: 0,
        correctCount: 0,
        mistakeCount: 0
      });

      setSavedWordsMap(prev => ({ ...prev, [wordItem.word.toLowerCase()]: true }));
      if (addToast) addToast(`Saved "${wordItem.word}" to My Wordlist!`, 'success');
    } catch {
      if (addToast) addToast(`Could not save "${wordItem.word}"`, 'warning');
    }
  };

  const handleSaveAllWords = async () => {
    if (!currentResult?.words) return;
    let savedCount = 0;
    for (const w of currentResult.words) {
      const existing = await db.words.where('word').equalsIgnoreCase(w.word).first();
      if (!existing) {
        await db.words.add({
          word: w.word.toLowerCase(),
          meaning: w.meaning,
          simpleMeaning: w.simpleMeaning,
          cefrLevel: w.cefrLevel,
          partOfSpeech: w.partOfSpeech,
          pronunciation: w.pronunciation,
          exampleSentence: w.situationalSentence,
          exampleSentences: [w.situationalSentence],
          status: 'new',
          createdAt: Date.now(),
          reviewCount: 0,
          correctCount: 0,
          mistakeCount: 0
        });
        savedCount++;
      }
    }
    const updatedMap: Record<string, boolean> = { ...savedWordsMap };
    currentResult.words.forEach(w => {
      updatedMap[w.word.toLowerCase()] = true;
    });
    setSavedWordsMap(updatedMap);
    if (addToast) {
      if (savedCount > 0) {
        addToast(`Added ${savedCount} new words to your deck!`, 'success');
      } else {
        addToast('All words already saved in your deck.', 'info');
      }
    }
  };

  const handleResetChat = () => {
    setMessages([]);
    setCurrentResult(null);
  };

  // Filtered Items for Studio
  const filteredWords = (currentResult?.words || []).filter(w => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      w.word.toLowerCase().includes(q) ||
      w.meaning.toLowerCase().includes(q) ||
      (w.simpleMeaning && w.simpleMeaning.toLowerCase().includes(q)) ||
      w.situationalSentence.toLowerCase().includes(q)
    );
  });

  const filteredPhrases = (currentResult?.phrases || []).filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.phrase.toLowerCase().includes(q) ||
      p.meaning.toLowerCase().includes(q) ||
      p.situationUsage.toLowerCase().includes(q)
    );
  });

  const filteredConjunctions = (currentResult?.conjunctions || []).filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.connector.toLowerCase().includes(q) ||
      c.meaning.toLowerCase().includes(q) ||
      c.situationalSentence.toLowerCase().includes(q) ||
      c.type.toLowerCase().includes(q)
    );
  });

  const filteredTips = (currentResult?.tips || []).filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.content.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  });

  const currentFlashcardWord = filteredWords[flashcardIndex];

  // ==========================================
  // RENDER: VIEW 1 - REAL CHATGPT STYLE VIEW
  // ==========================================
  if (activeView === 'chat') {
    return (
      <div className="flex flex-col h-full w-full bg-[#212121] text-[#ececec] overflow-hidden select-text">
        {/* ChatGPT Minimal Top Bar (No borders, pure seamless) */}
        <div className="h-14 px-4 flex items-center justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#2f2f2f] transition flex items-center gap-1.5 text-xs font-semibold"
              title="Exit to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2 px-2 py-1">
              <span className="font-bold text-sm tracking-tight text-white">Lexi AI</span>
              <span className="text-[11px] font-medium text-slate-400">English Tutor</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={handleResetChat}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#2f2f2f] transition"
                title="New Chat"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
            )}
            {currentResult && (
              <button
                onClick={() => setActiveView('studio')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2f2f2f] hover:bg-[#3d3d3d] text-white text-xs font-bold transition"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Studio</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* ChatGPT Central Messages Stream */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:py-6">
          <div className="max-w-3xl mx-auto w-full space-y-6">
            
            {/* If no messages, render ChatGPT Welcoming Center Hero */}
            {messages.length === 0 && (
              <div className="min-h-[55vh] flex flex-col items-center justify-center text-center px-4 space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#2f2f2f] flex items-center justify-center text-white shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  What situation do you want to master today?
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed">
                  Tell me in English or Tanglish — e.g. <em>"software developer interview"</em>, <em>"travel to chennai"</em>, <em>"hospital doctor consultation"</em>, or <em>"client presentation"</em>.
                </p>
              </div>
            )}

            {/* Conversation Messages */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 sm:gap-4 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-[#2f2f2f] flex-shrink-0 flex items-center justify-center text-white mt-1">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`space-y-3 ${
                    msg.sender === 'user'
                      ? 'bg-[#2f2f2f] text-white px-5 py-3 rounded-3xl max-w-[85%] sm:max-w-[75%]'
                      : 'text-[#ececec] max-w-[92%] sm:max-w-[85%] leading-relaxed pt-1'
                  }`}
                >
                  <div className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-normal">
                    {msg.text}
                  </div>

                  {/* Curated Result Studio Card (Border-free clean dark card) */}
                  {msg.situationalResult && (
                    <div className="mt-4 p-5 rounded-2xl bg-[#2f2f2f] shadow-lg space-y-4">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                            {msg.situationalResult.situationTitle}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {msg.situationalResult.situationSummary}
                        </p>
                      </div>

                      {/* 4 Category Pill Badges */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                        <div className="p-2.5 rounded-xl bg-[#212121]">
                          <div className="text-sm font-extrabold text-white">
                            📚 {msg.situationalResult.words.length}
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium">Vocab</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#212121]">
                          <div className="text-sm font-extrabold text-white">
                            💬 {msg.situationalResult.phrases.length}
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium">Phrases</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#212121]">
                          <div className="text-sm font-extrabold text-white">
                            🔗 {msg.situationalResult.conjunctions?.length || 5}
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium">Connectors</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#212121]">
                          <div className="text-sm font-extrabold text-white">
                            ⚡ {msg.situationalResult.tips?.length || 4}
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium">Tips</div>
                        </div>
                      </div>

                      {/* Studio Action Button */}
                      <button
                        onClick={() => handleOpenStudio(msg.situationalResult!)}
                        className="w-full py-3 px-4 rounded-full bg-white hover:bg-slate-200 text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition transform active:scale-95 shadow-md"
                      >
                        <span>Open Learning Studio & Search</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Thinking indicator */}
            {isGenerating && (
              <div className="flex gap-3 sm:gap-4 items-center">
                <div className="w-7 h-7 rounded-full bg-[#2f2f2f] flex-shrink-0 flex items-center justify-center text-white animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-xs sm:text-sm">
                  <span className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]"></span>
                  </span>
                  <span>Lexi AI is performing deep linguistic analysis...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ChatGPT Signature Floating Pill Input Bar */}
        <div className="w-full flex-shrink-0 px-4 pb-4 sm:pb-6 pt-2">
          <div className="max-w-3xl mx-auto w-full space-y-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="bg-[#2f2f2f] rounded-3xl pl-5 pr-2 py-2 flex items-center gap-3 shadow-2xl transition"
            >
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Ask in English or Tanglish (e.g. software interview preparation)..."
                disabled={isGenerating}
                className="w-full bg-transparent text-white placeholder-slate-400 text-sm sm:text-base focus:outline-none disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!inputPrompt.trim() || isGenerating}
                className="w-9 h-9 rounded-full bg-white hover:bg-slate-200 text-black flex items-center justify-center transition disabled:opacity-30 disabled:bg-[#424242] disabled:text-[#8e8e8e] flex-shrink-0"
                title="Send"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>

            <p className="text-[11px] text-center text-slate-500">
              Lexi AI curates real-world vocabulary, spoken phrases, and conjunctions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: VIEW 2 - CURATED LEARNING STUDIO
  // ==========================================
  if (!currentResult) {
    return (
      <div className="h-full w-full bg-[#212121] flex flex-col items-center justify-center text-slate-400 space-y-4">
        <p>No active situation. Return to chat.</p>
        <button
          onClick={() => setActiveView('chat')}
          className="px-4 py-2 bg-white text-black font-bold rounded-full text-xs"
        >
          Back to Chat
        </button>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#212121] text-[#ececec] overflow-y-auto px-4 py-4 sm:py-6 select-text">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-16">
        
        {/* Studio Top Navigation Bar (Border-free) */}
        <div className="bg-[#2f2f2f] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-lg space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveView('chat')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#212121] hover:bg-[#3d3d3d] text-white font-bold text-xs transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Chat</span>
              </button>
              <button
                onClick={onBack}
                className="px-3 py-1.5 rounded-full bg-[#212121] hover:bg-[#3d3d3d] text-slate-400 hover:text-white font-bold text-xs transition"
                title="Exit to Dashboard"
              >
                Exit
              </button>
              <span className="text-xs font-semibold text-slate-400 ml-1">
                Learning Studio
              </span>
            </div>

            <button
              onClick={handleSaveAllWords}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition active:scale-95 shadow-md"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>Save All Words</span>
            </button>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {currentResult.situationTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              {currentResult.situationSummary}
            </p>
          </div>
        </div>

        {/* Clean Segmented Category Tabs & Filter (Border-free) */}
        <div className="bg-[#2f2f2f] rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-lg space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Tab 1: Vocab */}
            <button
              onClick={() => {
                setStudioCategory('vocab');
                setFlashcardIndex(0);
              }}
              className={`p-3 rounded-xl sm:rounded-2xl font-extrabold text-xs sm:text-sm transition flex flex-col items-center sm:flex-row sm:justify-center gap-2 ${
                studioCategory === 'vocab'
                  ? 'bg-white text-black shadow-md'
                  : 'bg-[#212121] text-slate-400 hover:text-white'
              }`}
            >
              <span>📚 Vocab</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                studioCategory === 'vocab' ? 'bg-black/10 text-black' : 'bg-[#2f2f2f] text-slate-300'
              }`}>
                {currentResult.words.length}
              </span>
            </button>

            {/* Tab 2: Phrases */}
            <button
              onClick={() => setStudioCategory('phrase')}
              className={`p-3 rounded-xl sm:rounded-2xl font-extrabold text-xs sm:text-sm transition flex flex-col items-center sm:flex-row sm:justify-center gap-2 ${
                studioCategory === 'phrase'
                  ? 'bg-white text-black shadow-md'
                  : 'bg-[#212121] text-slate-400 hover:text-white'
              }`}
            >
              <span>💬 Phrases</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                studioCategory === 'phrase' ? 'bg-black/10 text-black' : 'bg-[#2f2f2f] text-slate-300'
              }`}>
                {currentResult.phrases.length}
              </span>
            </button>

            {/* Tab 3: Conjunctions */}
            <button
              onClick={() => setStudioCategory('conjunction')}
              className={`p-3 rounded-xl sm:rounded-2xl font-extrabold text-xs sm:text-sm transition flex flex-col items-center sm:flex-row sm:justify-center gap-2 ${
                studioCategory === 'conjunction'
                  ? 'bg-white text-black shadow-md'
                  : 'bg-[#212121] text-slate-400 hover:text-white'
              }`}
            >
              <span>🔗 Connectors</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                studioCategory === 'conjunction' ? 'bg-black/10 text-black' : 'bg-[#2f2f2f] text-slate-300'
              }`}>
                {currentResult.conjunctions?.length || 5}
              </span>
            </button>

            {/* Tab 4: Tips */}
            <button
              onClick={() => setStudioCategory('others')}
              className={`p-3 rounded-xl sm:rounded-2xl font-extrabold text-xs sm:text-sm transition flex flex-col items-center sm:flex-row sm:justify-center gap-2 ${
                studioCategory === 'others'
                  ? 'bg-white text-black shadow-md'
                  : 'bg-[#212121] text-slate-400 hover:text-white'
              }`}
            >
              <span>⚡ Tips</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                studioCategory === 'others' ? 'bg-black/10 text-black' : 'bg-[#2f2f2f] text-slate-300'
              }`}>
                {currentResult.tips?.length || 4}
              </span>
            </button>
          </div>

          {/* Search bar inside Studio */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setFlashcardIndex(0);
                }}
                placeholder={`Search in ${studioCategory}...`}
                className="w-full pl-9 pr-4 py-2 bg-[#212121] text-white rounded-full text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {studioCategory === 'vocab' && (
              <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#212121] self-end sm:self-auto">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                    viewMode === 'cards' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('flashcard')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                    viewMode === 'flashcard' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Flashcard
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* CATEGORY 1: VOCABULARY */}
        {/* ============================================================== */}
        {studioCategory === 'vocab' && (
          <>
            {filteredWords.length === 0 ? (
              <div className="p-8 text-center bg-[#2f2f2f] rounded-2xl text-slate-400">
                No vocabulary words match "{searchQuery}".
              </div>
            ) : viewMode === 'flashcard' && currentFlashcardWord ? (
              /* Single Flashcard View */
              <div className="bg-[#2f2f2f] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Word {flashcardIndex + 1} of {filteredWords.length}
                  </span>
                  <span className="font-bold text-white">
                    {currentFlashcardWord.category || 'Vocabulary'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        {currentFlashcardWord.word}
                      </h2>
                      <button
                        onClick={() => playTTS(currentFlashcardWord.word)}
                        className="p-2 rounded-full bg-[#212121] hover:bg-[#3d3d3d] text-white transition active:scale-90"
                        title="Listen"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>
                    {currentFlashcardWord.pronunciation && (
                      <p className="text-sm font-mono text-slate-400 mt-1">
                        {currentFlashcardWord.pronunciation}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${levelColorMap[currentFlashcardWord.cefrLevel] || levelColorMap.B1}`}>
                      CEFR {currentFlashcardWord.cefrLevel}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#212121] text-slate-300 capitalize">
                      {currentFlashcardWord.partOfSpeech}
                    </span>
                  </div>
                </div>

                {/* Meaning Reveal */}
                <div className="space-y-2">
                  <div
                    onClick={() => setIsMeaningOpen(prev => !prev)}
                    className="p-4 rounded-2xl bg-[#212121] flex items-center justify-between cursor-pointer select-none hover:bg-[#282828] transition"
                  >
                    <span className="text-xs font-bold text-slate-400 uppercase">
                      Definition & Meaning
                    </span>
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      {isMeaningOpen ? 'Hide' : 'Reveal'}
                      <ChevronDown className={`w-4 h-4 transition-transform ${isMeaningOpen ? 'rotate-180' : ''}`} />
                    </span>
                  </div>

                  {isMeaningOpen && (
                    <div className="p-4 rounded-2xl bg-[#262626] space-y-2">
                      {currentFlashcardWord.simpleMeaning && (
                        <p className="text-sm font-bold text-white">
                          "{currentFlashcardWord.simpleMeaning}"
                        </p>
                      )}
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {currentFlashcardWord.meaning}
                      </p>
                    </div>
                  )}
                </div>

                {/* Situational Sentence */}
                <div className="p-4 rounded-2xl bg-[#212121] space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Sparkle className="w-3.5 h-3.5 text-amber-400" />
                      Real Situational Example
                    </span>
                    <button
                      onClick={() => playTTS(currentFlashcardWord.situationalSentence)}
                      className="text-slate-300 hover:text-white"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm sm:text-base font-medium text-white italic leading-relaxed">
                    "{currentFlashcardWord.situationalSentence}"
                  </p>
                </div>

                {/* Flashcard Bottom Controls */}
                <div className="flex items-center justify-between pt-4">
                  <button
                    onClick={() => {
                      setFlashcardIndex(prev => Math.max(0, prev - 1));
                      setIsMeaningOpen(false);
                    }}
                    disabled={flashcardIndex === 0}
                    className="flex items-center gap-1 px-4 py-2 rounded-full bg-[#212121] hover:bg-[#3d3d3d] text-white font-bold text-xs disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    onClick={() => handleSaveWord(currentFlashcardWord)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs transition ${
                      savedWordsMap[currentFlashcardWord.word.toLowerCase()]
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white hover:bg-slate-200 text-black'
                    }`}
                  >
                    {savedWordsMap[currentFlashcardWord.word.toLowerCase()] ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="w-4 h-4" />
                        <span>Save Word</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setFlashcardIndex(prev => Math.min(filteredWords.length - 1, prev + 1));
                      setIsMeaningOpen(false);
                    }}
                    disabled={flashcardIndex === filteredWords.length - 1}
                    className="flex items-center gap-1 px-4 py-2 rounded-full bg-[#212121] hover:bg-[#3d3d3d] text-white font-bold text-xs disabled:opacity-30"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Cards Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredWords.map((wordItem, idx) => {
                  const isSaved = savedWordsMap[wordItem.word.toLowerCase()];
                  return (
                    <div
                      key={idx}
                      className="bg-[#2f2f2f] rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-extrabold text-white tracking-tight">
                                {wordItem.word}
                              </h3>
                              <button
                                onClick={() => playTTS(wordItem.word)}
                                className="p-1.5 rounded-full hover:bg-[#212121] text-slate-400 hover:text-white transition"
                                title="Listen"
                              >
                                <Volume2 className="w-4 h-4" />
                              </button>
                            </div>
                            {wordItem.pronunciation && (
                              <span className="text-xs font-mono text-slate-400">
                                {wordItem.pronunciation}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${levelColorMap[wordItem.cefrLevel] || levelColorMap.B1}`}>
                              {wordItem.cefrLevel}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#212121] text-slate-300 capitalize">
                              {wordItem.partOfSpeech}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 space-y-1">
                          {wordItem.simpleMeaning && (
                            <p className="text-xs font-bold text-white">
                              "{wordItem.simpleMeaning}"
                            </p>
                          )}
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {wordItem.meaning}
                          </p>
                        </div>

                        <div className="mt-3 p-3 rounded-xl bg-[#212121] space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                            <span>Context:</span>
                            <button
                              onClick={() => playTTS(wordItem.situationalSentence)}
                              className="text-slate-400 hover:text-white"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-xs text-slate-200 italic leading-relaxed">
                            "{wordItem.situationalSentence}"
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {wordItem.category || 'General'}
                        </span>

                        <button
                          onClick={() => handleSaveWord(wordItem)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-xs transition ${
                            isSaved
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white hover:bg-slate-200 text-black'
                          }`}
                        >
                          {isSaved ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Saved</span>
                            </>
                          ) : (
                            <>
                              <BookmarkPlus className="w-3.5 h-3.5" />
                              <span>Save</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ============================================================== */}
        {/* CATEGORY 2: PHRASES */}
        {/* ============================================================== */}
        {studioCategory === 'phrase' && (
          <div className="space-y-4">
            {filteredPhrases.length === 0 ? (
              <div className="p-8 text-center bg-[#2f2f2f] rounded-2xl text-slate-400">
                No conversational phrases match "{searchQuery}".
              </div>
            ) : (
              filteredPhrases.map((phraseItem, idx) => (
                <div
                  key={idx}
                  className="bg-[#2f2f2f] rounded-2xl p-5 space-y-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => playTTS(phraseItem.phrase)}
                        className="p-2 rounded-full bg-[#212121] hover:bg-[#3d3d3d] text-white transition flex-shrink-0"
                        title="Listen"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                        "{phraseItem.phrase}"
                      </h3>
                    </div>

                    <button
                      onClick={() => copyToClipboard(phraseItem.phrase)}
                      className="p-2 text-slate-400 hover:text-white rounded-lg transition"
                      title="Copy phrase"
                    >
                      {copiedText === phraseItem.phrase ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="pl-10 text-xs sm:text-sm text-slate-300">
                    <strong className="text-white">Meaning:</strong> {phraseItem.meaning}
                  </div>

                  <div className="ml-10 p-3 rounded-xl bg-[#212121] text-xs text-slate-300 flex items-start gap-2">
                    <span className="font-bold text-white">💡 How to use:</span>
                    <span>{phraseItem.situationUsage}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* CATEGORY 3: CONJUNCTIONS */}
        {/* ============================================================== */}
        {studioCategory === 'conjunction' && (
          <div className="space-y-4">
            {filteredConjunctions.length === 0 ? (
              <div className="p-8 text-center bg-[#2f2f2f] rounded-2xl text-slate-400">
                No conjunctions match "{searchQuery}".
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredConjunctions.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-[#2f2f2f] rounded-2xl p-5 space-y-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-white">
                          {item.connector}
                        </h3>
                        <button
                          onClick={() => playTTS(item.connector)}
                          className="p-1 text-slate-400 hover:text-white"
                          title="Listen"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#212121] text-amber-300">
                        {item.type}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">
                      {item.meaning}
                    </p>

                    <div className="p-3 rounded-xl bg-[#212121] space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span>Sentence Example:</span>
                        <button
                          onClick={() => playTTS(item.situationalSentence)}
                          className="hover:text-white"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-200 font-medium italic leading-relaxed">
                        "{item.situationalSentence}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* CATEGORY 4: TIPS & OTHERS */}
        {/* ============================================================== */}
        {studioCategory === 'others' && (
          <div className="space-y-4">
            {filteredTips.length === 0 ? (
              <div className="p-8 text-center bg-[#2f2f2f] rounded-2xl text-slate-400">
                No tips or templates match "{searchQuery}".
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTips.map((tip, idx) => {
                  const isDo = tip.category === 'do';
                  const isDont = tip.category === 'dont';
                  const isTemplate = tip.category === 'template';

                  const badgeColor = isDo
                    ? 'text-emerald-400'
                    : isDont
                    ? 'text-rose-400'
                    : isTemplate
                    ? 'text-purple-400'
                    : 'text-amber-400';

                  return (
                    <div
                      key={idx}
                      className="bg-[#2f2f2f] rounded-2xl p-5 space-y-3 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-black text-white">
                            {tip.title}
                          </h3>
                          <span className={`text-[10px] font-black uppercase tracking-wider ${badgeColor}`}>
                            {tip.category}
                          </span>
                        </div>

                        <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                          {tip.content}
                        </p>
                      </div>

                      {isTemplate && (
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => copyToClipboard(tip.content)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#212121] hover:bg-[#3d3d3d] text-white font-bold text-xs transition"
                          >
                            {copiedText === tip.content ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Template</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

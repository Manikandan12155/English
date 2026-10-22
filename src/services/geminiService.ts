import { VocabularyWord, CEFRLevel, PartOfSpeech } from '../types/vocabulary';

export const DEFAULT_GEMINI_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';

export function getStoredGeminiKey(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('vocabmaster_gemini_key');
    if (saved) return saved;
  }
  return DEFAULT_GEMINI_KEY;
}

export function saveGeminiKey(key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('vocabmaster_gemini_key', key.trim());
  }
}

export async function extractVocabularyWithGemini(
  textSnippet: string,
  apiKey: string = getStoredGeminiKey()
): Promise<Omit<VocabularyWord, 'id'>[]> {
  const cleanKey = apiKey.trim() || DEFAULT_GEMINI_KEY;
  
  const systemPrompt = `You are an expert lexicographer and English vocabulary teacher.
Analyze the provided text excerpt from a PDF/document and extract important English vocabulary words.
For each word, return a structured JSON array of objects with:
- "word": string (lowercase headword, e.g. "reliable")
- "meaning": string (clear learner-friendly definition)
- "simpleMeaning": string (short 3-5 word summary)
- "cefrLevel": string ("A1" | "A2" | "B1" | "B2")
- "partOfSpeech": string ("noun" | "verb" | "adjective" | "adverb" | "other")
- "pronunciation": string (IPA phonetic notation, e.g. "/rɪˈlaɪəbl/")
- "exampleSentence": string (a natural sentence using the word, preferably inspired by the context)

Return ONLY valid JSON array with NO markdown formatting, NO backticks. Example:
[{"word":"example","meaning":"a representative form","simpleMeaning":"sample case","cefrLevel":"A1","partOfSpeech":"noun","pronunciation":"/ɪɡˈzɑːmpl/","exampleSentence":"This is a good example."}]`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${cleanKey}`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: systemPrompt + "\n\nText excerpt to extract vocabulary from:\n" + textSnippet.slice(0, 15000) }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 4096
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': cleanKey
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
  
  // Clean JSON string (remove markdown code blocks if any)
  const cleaned = rawContent
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) return [];

  return parsed.map((item: any) => ({
    word: (item.word || '').trim().toLowerCase(),
    meaning: item.meaning || 'No definition',
    simpleMeaning: item.simpleMeaning || undefined,
    cefrLevel: (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(item.cefrLevel) ? item.cefrLevel : 'A1') as CEFRLevel,
    partOfSpeech: (item.partOfSpeech || 'noun') as PartOfSpeech,
    pronunciation: item.pronunciation || undefined,
    exampleSentence: item.exampleSentence || undefined,
    exampleSentences: item.exampleSentence ? [item.exampleSentence] : [],
    status: 'new',
    createdAt: Date.now(),
    reviewCount: 0,
    correctCount: 0,
    mistakeCount: 0
  }));
}

export async function askAboutWordWithRAG(
  word: string,
  contextText: string,
  question: string,
  apiKey: string = getStoredGeminiKey()
): Promise<string> {
  const cleanKey = apiKey.trim() || DEFAULT_GEMINI_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${cleanKey}`;

  const prompt = `You are a helpful English vocabulary AI assistant.
Word: "${word}"
Document context:
"${contextText.slice(0, 4000)}"

User question: "${question}"
Answer clearly, concisely, and helpfully based on the context.`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': cleanKey
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API Error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
}

export interface AIMeaningResult {
  word: string;
  simpleMeaning: string;
  realLifeExample: string;
  memoryTip: string;
  whenToUse?: string;
}

const aiMeaningCache = new Map<string, AIMeaningResult>();
const AI_CACHE_PREFIX = 'vocab_ai_meaning_v1_';

/**
 * Retrieve cached AI meaning from memory or localStorage
 */
export function getCachedAIMeaning(word: string): AIMeaningResult | null {
  const cleanWord = word.trim().toLowerCase();
  if (aiMeaningCache.has(cleanWord)) {
    return aiMeaningCache.get(cleanWord)!;
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(AI_CACHE_PREFIX + cleanWord);
      if (stored) {
        const parsed: AIMeaningResult = JSON.parse(stored);
        aiMeaningCache.set(cleanWord, parsed);
        return parsed;
      }
    } catch {
      // storage unavailable or invalid json
    }
  }
  return null;
}

export function clearCachedAIMeaning(word: string): void {
  const cleanWord = word.trim().toLowerCase();
  aiMeaningCache.delete(cleanWord);
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(AI_CACHE_PREFIX + cleanWord);
    } catch {
      // safe
    }
  }
}

/**
 * Generate crystal clear, student-friendly AI explanation using Gemini AI with persistent caching
 * and optional forceRefresh to regenerate if user dislikes previous answer
 */
export async function explainWordWithGemini(
  word: string,
  cefrLevel: string = 'A1',
  partOfSpeech: string = 'word',
  apiKey: string = getStoredGeminiKey(),
  forceRefresh: boolean = false
): Promise<AIMeaningResult> {
  const cleanWord = word.trim().toLowerCase();
  
  if (!forceRefresh) {
    // 1. Check persistent cache first (instant return, zero network hit)
    const cached = getCachedAIMeaning(cleanWord);
    if (cached) {
      return cached;
    }
  } else {
    clearCachedAIMeaning(cleanWord);
  }

  const cleanKey = apiKey.trim() || DEFAULT_GEMINI_KEY;
  const isGrammar = partOfSpeech === 'grammar';
  const prompt = isGrammar
    ? `You are an exceptionally clear, warm, and friendly English grammar teacher.
${forceRefresh ? 'The student disliked the previous explanation and wants a MUCH SIMPLER, crystal-clear explanation with a completely fresh, easy everyday example and a simple formula.' : ''}
Explain the English Grammar rule/topic "${cleanWord}" (CEFR: ${cefrLevel}) in super simple, easy-to-understand plain English so any non-native student can instantly understand how to use it without any confusion.

Return ONLY a valid JSON object with NO markdown formatting, NO backticks:
{
  "simpleMeaning": "Crystal-clear, easy-to-understand 1-2 sentence explanation of the rule and formula in simple English",
  "realLifeExample": "A relatable, natural everyday sentence showing this grammar rule clearly",
  "memoryTip": "A clever, simple trick, pattern, or mnemonic to remember this grammar rule easily",
  "whenToUse": "Brief practical tip on when to use this rule and common mistakes to avoid"
}`
    : `You are an exceptionally clear, warm, and friendly English vocabulary tutor.
${forceRefresh ? 'The student disliked the previous explanation and wants a DIFFERENT, much simpler, crystal-clear explanation with a completely fresh, easy everyday example and a creative memory trick.' : ''}
Explain the English word "${cleanWord}" (CEFR: ${cefrLevel}, Part of speech: ${partOfSpeech}) in super simple, easy-to-understand plain English that a non-native student can instantly grasp without any difficulty.

Return ONLY a valid JSON object with NO markdown formatting, NO backticks:
{
  "simpleMeaning": "Crystal-clear, easy-to-understand 1-sentence explanation in simple English",
  "realLifeExample": "A relatable, natural everyday sentence",
  "memoryTip": "A clever trick, association, or mnemonic to remember this word easily",
  "whenToUse": "Brief practical tip on when people usually say or write this word"
}`;

  const models = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemma-4-26b-a4b-it'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: forceRefresh ? 0.7 : 0.2, maxOutputTokens: 1024 }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        const result: AIMeaningResult = {
          word: cleanWord,
          simpleMeaning: parsed.simpleMeaning || `Meaning of ${cleanWord}`,
          realLifeExample: parsed.realLifeExample || `Example sentence with ${cleanWord}`,
          memoryTip: parsed.memoryTip || `Remember ${cleanWord} in daily practice`,
          whenToUse: parsed.whenToUse || 'Used in everyday conversational English'
        };

        // Save to in-memory cache and persistent localStorage
        aiMeaningCache.set(cleanWord, result);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(AI_CACHE_PREFIX + cleanWord, JSON.stringify(result));
          } catch {
            // quota limit handled safely
          }
        }

        return result;
      }
    } catch (e) {
      lastError = e;
    }
  }

  throw lastError || new Error('Could not generate AI meaning');
}

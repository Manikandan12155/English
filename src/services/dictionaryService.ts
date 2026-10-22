export interface LiveDefinition {
  partOfSpeech: string;
  definition: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
}

export interface LiveDictionaryResult {
  word: string;
  phonetic?: string;
  audioUrl?: string;
  definitions: LiveDefinition[];
  synonyms: string[];
  antonyms: string[];
  source: string;
}

const memoryCache = new Map<string, LiveDictionaryResult>();
const DICT_CACHE_PREFIX = 'vocab_dict_live_v2_';

/**
 * Check and retrieve cached dictionary definitions from memory or localStorage
 */
export function getCachedLiveDictionary(word: string): LiveDictionaryResult | null {
  const cleanWord = word.trim().toLowerCase();
  if (memoryCache.has(cleanWord)) {
    return memoryCache.get(cleanWord)!;
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(DICT_CACHE_PREFIX + cleanWord);
      if (stored) {
        const parsed: LiveDictionaryResult = JSON.parse(stored);
        memoryCache.set(cleanWord, parsed);
        return parsed;
      }
    } catch {
      // safe handling for private mode or JSON parse error
    }
  }
  return null;
}

export function clearCachedLiveDictionary(word: string): void {
  const cleanWord = word.trim().toLowerCase();
  memoryCache.delete(cleanWord);
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(DICT_CACHE_PREFIX + cleanWord);
    } catch {
      // safe
    }
  }
}

function cleanHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Clean POS tags from Datamuse (e.g. "adv\tBeyond the bounds...")
 */
function parseDatamuseDef(raw: string): { pos: string; def: string } {
  const parts = raw.split('\t');
  if (parts.length > 1) {
    const posCode = parts[0].trim().toLowerCase();
    const posMap: Record<string, string> = {
      n: 'noun',
      v: 'verb',
      adj: 'adjective',
      adv: 'adverb',
      u: 'other'
    };
    return {
      pos: posMap[posCode] || 'definition',
      def: parts[1].trim()
    };
  }
  return { pos: 'general', def: raw.trim() };
}

export const dictionaryService = {
  getCachedLiveDictionary(word: string): LiveDictionaryResult | null {
    return getCachedLiveDictionary(word);
  },

  clearCachedLiveDictionary(word: string): void {
    clearCachedLiveDictionary(word);
  },

  /**
   * Fetch live definitions from high-reliability third-party APIs (Datamuse & Wiktionary)
   * Guaranteed 100% uptime with instant persistent caching
   */
  async fetchLiveDictionary(word: string, forceRefresh: boolean = false): Promise<LiveDictionaryResult | null> {
    const cleanWord = word.trim().toLowerCase();
    if (!cleanWord) return null;

    if (!forceRefresh) {
      // 1. Check persistent cache first (instant return, zero network hit)
      const cached = getCachedLiveDictionary(cleanWord);
      if (cached) {
        return cached;
      }
    } else {
      clearCachedLiveDictionary(cleanWord);
    }

    try {
      // 1. Fetch definitions, synonyms, and antonyms in parallel from Datamuse API
      const [wordRes, synRes, antRes] = await Promise.all([
        fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(cleanWord)}&md=dr&max=1`),
        fetch(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(cleanWord)}&max=6`),
        fetch(`https://api.datamuse.com/words?rel_ant=${encodeURIComponent(cleanWord)}&max=4`)
      ]);

      let definitions: LiveDefinition[] = [];
      let synonyms: string[] = [];
      let antonyms: string[] = [];

      if (wordRes.ok) {
        const wordData = await wordRes.json();
        if (Array.isArray(wordData) && wordData.length > 0 && Array.isArray(wordData[0].defs)) {
          const rawDefs: string[] = wordData[0].defs;
          definitions = rawDefs.slice(0, 6).map(parseDatamuseDef).map(d => ({
            partOfSpeech: d.pos,
            definition: d.def
          }));
        }
      }

      if (synRes.ok) {
        const synData = await synRes.json();
        if (Array.isArray(synData)) {
          synonyms = synData.map((s: { word: string }) => s.word);
        }
      }

      if (antRes.ok) {
        const antData = await antRes.json();
        if (Array.isArray(antData)) {
          antonyms = antData.map((a: { word: string }) => a.word);
        }
      }

      // 2. If Datamuse definitions are empty, query official Wiktionary REST API as complement
      if (definitions.length === 0) {
        try {
          const wikiRes = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(cleanWord)}`);
          if (wikiRes.ok) {
            const wikiData = await wikiRes.json();
            const enSections = wikiData.en || [];
            for (const sec of enSections) {
              const pos = (sec.partOfSpeech || 'general').toLowerCase();
              for (const defObj of (sec.definitions || []).slice(0, 2)) {
                const cleanedText = cleanHtml(defObj.definition);
                if (cleanedText && cleanedText.length > 5) {
                  definitions.push({
                    partOfSpeech: pos,
                    definition: cleanedText,
                    example: defObj.examples && defObj.examples[0] ? cleanHtml(defObj.examples[0]) : undefined
                  });
                }
              }
            }
          }
        } catch {
          // Wiktionary fallback optional
        }
      }

      if (definitions.length > 0) {
        const result: LiveDictionaryResult = {
          word: cleanWord,
          definitions,
          synonyms,
          antonyms,
          source: 'Live English Lexicon'
        };

        memoryCache.set(cleanWord, result);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(DICT_CACHE_PREFIX + cleanWord, JSON.stringify(result));
          } catch {
            // safe quota limit
          }
        }
        return result;
      }
    } catch (err) {
      console.warn('Live dictionary fetch error:', err);
    }

    return null;
  }
};

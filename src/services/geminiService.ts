import { VocabularyWord, CEFRLevel, PartOfSpeech } from '../types/vocabulary';

export const DEFAULT_GEMINI_KEY = 
  (import.meta as any).env?.VITE_GEMINI_API_KEY || 
  (import.meta as any).env?.GEMINI_API_KEY || 
  '';

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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${cleanKey}`;

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
  synonyms?: string[];
  antonyms?: string[];
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

  // Fallback when no Gemini API key is configured yet
  if (!cleanKey) {
    const isGrammar = partOfSpeech === 'grammar';
    return {
      word: cleanWord,
      simpleMeaning: isGrammar
        ? `Essential grammar rule for ${cleanWord} (${cefrLevel}). Focus on correct sentence structure and natural word order.`
        : `Essential English ${partOfSpeech} at ${cefrLevel} level. Read the definitions and audio pronunciation above.`,
      realLifeExample: isGrammar
        ? `Review the curated examples above to see "${cleanWord}" applied in real-life English.`
        : `Practice saying "${cleanWord}" in a sentence to build confidence.`,
      memoryTip: `💡 Connect your Gemini API Key in Settings (⚙️) or Vercel Environment Variables (GEMINI_API_KEY) for live AI tutor explanations!`,
      whenToUse: isGrammar
        ? `Used frequently in modern English grammar across speaking and writing.`
        : `Frequently used in standard English conversations and writing.`
    };
  }

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
  "whenToUse": "Brief practical tip on when people usually say or write this word",
  "synonyms": ["common synonym 1", "synonym 2", "synonym 3"],
  "antonyms": ["direct antonym/opposite 1", "opposite 2"]
}`;

  const models = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];
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
          whenToUse: parsed.whenToUse || 'Used in everyday conversational English',
          synonyms: Array.isArray(parsed.synonyms) ? parsed.synonyms.filter(Boolean).slice(0, 5) : [],
          antonyms: Array.isArray(parsed.antonyms) ? parsed.antonyms.filter(Boolean).slice(0, 5) : []
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

// ==========================================
// AI SITUATIONAL VOCABULARY ASSISTANT
// ==========================================

export interface SituationalWord {
  word: string;
  meaning: string;
  simpleMeaning?: string;
  cefrLevel: CEFRLevel;
  partOfSpeech: PartOfSpeech;
  pronunciation?: string;
  situationalSentence: string;
  synonyms?: string[];
  antonyms?: string[];
  category?: string;
}

export interface SituationalPhrase {
  phrase: string;
  meaning: string;
  situationUsage: string;
}

export interface SituationalConjunction {
  connector: string;
  type: string;
  meaning: string;
  situationalSentence: string;
}

export interface SituationalTip {
  title: string;
  content: string;
  category: 'tip' | 'do' | 'dont' | 'template';
}

export interface SituationalResult {
  situationTitle: string;
  situationSummary: string;
  categoryTags: string[];
  words: SituationalWord[];
  phrases: SituationalPhrase[];
  conjunctions: SituationalConjunction[];
  tips: SituationalTip[];
}

export function getContextualConjunctionsAndTips(promptOrTitle: string): {
  conjunctions: SituationalConjunction[];
  tips: SituationalTip[];
} {
  const lower = (promptOrTitle || '').toLowerCase();

  if (lower.includes('software') || lower.includes('developer') || lower.includes('interview') || lower.includes('code') || lower.includes('tech') || lower.includes('react') || lower.includes('python')) {
    return {
      conjunctions: [
        {
          connector: 'Furthermore',
          type: 'Addition',
          meaning: 'In addition to what has been stated; introducing another strong technical point.',
          situationalSentence: 'Furthermore, by indexing our PostgreSQL tables, we slashed API latency by 45%.'
        },
        {
          connector: 'On the other hand',
          type: 'Contrast',
          meaning: 'Presenting an alternative approach or engineering trade-off.',
          situationalSentence: 'Microservices provide high agility; on the other hand, they introduce distributed tracing overhead.'
        },
        {
          connector: 'Consequently',
          type: 'Cause & Effect',
          meaning: 'As a direct result or outcome of an architectural decision.',
          situationalSentence: 'We implemented Redis caching; consequently, database read load dropped by 60%.'
        },
        {
          connector: 'In order to',
          type: 'Purpose',
          meaning: 'Explaining the specific objective or reasoning.',
          situationalSentence: 'In order to guarantee zero data loss, we configured write-ahead logging with dual replication.'
        },
        {
          connector: 'Whereas',
          type: 'Comparison',
          meaning: 'Contrasting two distinct technologies or architectures.',
          situationalSentence: 'REST APIs communicate synchronously, whereas Apache Kafka facilitates asynchronous event streaming.'
        }
      ],
      tips: [
        {
          title: 'STAR Method for Behavioral Questions',
          content: 'Structure your answers using STAR: Situation (context), Task (your goal), Action (what YOU did), and Result (measurable impact).',
          category: 'do'
        },
        {
          title: 'Think Out Loud',
          content: 'Interviewers evaluate your thought process. Speak your trade-offs and edge-case thoughts clearly as you formulate your solution.',
          category: 'tip'
        },
        {
          title: 'Avoid Vague Buzzwords',
          content: 'Do not just say "I used Cloud". Be concrete: "I configured a Dockerized container on AWS ECS with auto-scaling".',
          category: 'dont'
        },
        {
          title: 'Polite Follow-up Template',
          content: '"Could you clarify whether we are optimizing for low latency or high throughput in this scenario?"',
          category: 'template'
        }
      ]
    };
  }

  if (lower.includes('travel') || lower.includes('chennai') || lower.includes('coimbatore') || lower.includes('flight') || lower.includes('train') || lower.includes('bus') || lower.includes('hotel') || lower.includes('trip')) {
    return {
      conjunctions: [
        {
          connector: 'Meanwhile',
          type: 'Time Relation',
          meaning: 'At the same time during the journey or transit.',
          situationalSentence: 'Meanwhile, my travel partner verified our seat allocation on the railway reservation app.'
        },
        {
          connector: 'In case of',
          type: 'Condition',
          meaning: 'In the event of an unexpected delay or route change.',
          situationalSentence: 'In case of train delay due to weather, passengers can monitor live status through the transit app.'
        },
        {
          connector: 'Consequently',
          type: 'Result',
          meaning: 'As a direct result of early arrival or departure.',
          situationalSentence: 'We started early from the city center; consequently, we reached the terminal well ahead of departure.'
        },
        {
          connector: 'Although',
          type: 'Contrast',
          meaning: 'Showing an unexpected positive outcome despite an obstacle.',
          situationalSentence: 'Although our ticket was on waiting list initially, it got confirmed three hours prior to departure.'
        },
        {
          connector: 'As soon as',
          type: 'Time',
          meaning: 'Immediately upon reaching a destination or checkpoint.',
          situationalSentence: 'Please call me as soon as you arrive at the arrival gate.'
        }
      ],
      tips: [
        {
          title: 'Boarding Gate & Platform Vigilance',
          content: 'Double-check electronic departure displays 20 minutes prior to boarding; platform numbers can switch abruptly.',
          category: 'do'
        },
        {
          title: 'Polite Inquiry Opener',
          content: 'Always start with "Excuse me, sir/ma\'am" when asking station attendants or fellow travelers for directions.',
          category: 'tip'
        },
        {
          title: 'Do Not Leave Luggage Unattended',
          content: 'Keep essential documents, phone, and power bank in your personal backpack rather than checked baggage.',
          category: 'dont'
        },
        {
          title: 'Navigation Query Template',
          content: '"Excuse me, could you please point me towards Platform 4 for the express train to Chennai?"',
          category: 'template'
        }
      ]
    };
  }

  if (lower.includes('doctor') || lower.includes('hospital') || lower.includes('medical') || lower.includes('fever') || lower.includes('health') || lower.includes('clinic')) {
    return {
      conjunctions: [
        {
          connector: 'Whenever',
          type: 'Condition & Frequency',
          meaning: 'Every time a particular symptom or trigger occurs.',
          situationalSentence: 'Whenever I bend down or climb stairs, I experience a throbbing headache.'
        },
        {
          connector: 'In addition to',
          type: 'Addition',
          meaning: 'Listing additional symptoms or clinical observations.',
          situationalSentence: 'In addition to a high fever, I have experienced a dry cough and mild fatigue for two days.'
        },
        {
          connector: 'Otherwise',
          type: 'Consequence',
          meaning: 'Explaining what happens if medication or hydration is missed.',
          situationalSentence: 'Take the prescribed antibiotic after meals; otherwise, you might experience mild nausea.'
        },
        {
          connector: 'As prescribed',
          type: 'Instruction',
          meaning: 'Following exact medical dosage guidelines.',
          situationalSentence: 'I have been taking the tablets as prescribed, but the temperature remains elevated.'
        },
        {
          connector: 'Provided that',
          type: 'Condition',
          meaning: 'Under the condition of proper rest and hydration.',
          situationalSentence: 'You will recover within four days provided that you drink plenty of warm fluids and get adequate rest.'
        }
      ],
      tips: [
        {
          title: 'Describe Exact Duration & Intensity',
          content: 'Give specific numbers: "The pain has persisted for 48 hours and is a sharp 7 out of 10."',
          category: 'do'
        },
        {
          title: 'Mention Past Allergies & Ongoing Meds',
          content: 'Always inform the physician if you are allergic to penicillin or taking other medications.',
          category: 'tip'
        },
        {
          title: 'Never Stop Antibiotics Abruptly',
          content: 'Complete the entire course prescribed even if symptoms subside early to prevent drug resistance.',
          category: 'dont'
        },
        {
          title: 'Doctor Consultation Template',
          content: '"Doctor, I have had a persistent fever and body chills since Tuesday evening. Are there any specific foods I should avoid?"',
          category: 'template'
        }
      ]
    };
  }

  // General fallback for all topics / custom situations
  return {
    conjunctions: [
      {
        connector: 'Moreover',
        type: 'Addition',
        meaning: 'Adding an important reinforcing argument or detail.',
        situationalSentence: 'The proposal aligns with our core objectives; moreover, it saves valuable time and resources.'
      },
      {
        connector: 'On the other hand',
        type: 'Contrast',
        meaning: 'Balancing two perspectives or weighing pros and cons.',
        situationalSentence: 'This option is faster; on the other hand, the alternative guarantees higher precision.'
      },
      {
        connector: 'Consequently',
        type: 'Cause & Effect',
        meaning: 'Highlighting the logical outcome of an action or event.',
        situationalSentence: 'We prepared thoroughly in advance; consequently, the conversation proceeded smoothly.'
      },
      {
        connector: 'In order to',
        type: 'Purpose',
        meaning: 'Specifying the intended outcome or strategy.',
        situationalSentence: 'In order to ensure mutual understanding, we summarized the main action points clearly.'
      },
      {
        connector: 'For instance',
        type: 'Exemplification',
        meaning: 'Giving a concrete real-life example to illustrate your point.',
        situationalSentence: 'Active listening builds trust; for instance, paraphrasing the speaker shows genuine engagement.'
      }
    ],
    tips: [
      {
        title: 'Maintain a Calm & Measured Pace',
        content: 'Speaking slightly slower gives you time to choose precise vocabulary and sound confident.',
        category: 'tip'
      },
      {
        title: 'Use Connectors for Seamless Fluency',
        content: 'Link your ideas with transitional words like "Furthermore", "In contrast", and "As a result" instead of repeating "and".',
        category: 'do'
      },
      {
        title: 'Do Not Apologize for Minor Mistakes',
        content: 'If you mispronounce a word, self-correct calmly and keep talking without losing momentum.',
        category: 'dont'
      },
      {
        title: 'Polite Conversation Starter Template',
        content: '"Thank you for your time today. I would appreciate the opportunity to share my perspective on this topic."',
        category: 'template'
      }
    ]
  };
}

// Built-in presets for instant offline responses or fallback
const PRESET_PACKS = [
  {
    keywords: ['software', 'developer', 'interview', 'code', 'coding', 'programmer', 'frontend', 'backend', 'tech', 'engineer', 'it job', 'react', 'python', 'java', 'bug', 'api', 'system', 'skill', 'resume', 'hiring'],
    title: 'Software Developer & Tech Interview',
    summary: 'Essential technical vocabulary, architectural concepts, and professional speaking phrases tailored for cracking software engineering interviews.',
    tags: ['💻 Tech Skills', '🎯 Interview Q&A', '⚡ Architecture'],
    words: [
      {
        word: 'algorithm',
        meaning: 'A step-by-step procedure or set of rules to be followed in calculations or problem-solving operations, especially by a computer.',
        simpleMeaning: 'A set of steps to solve a computer problem.',
        cefrLevel: 'B2' as CEFRLevel,
        partOfSpeech: 'noun' as PartOfSpeech,
        pronunciation: '/ˈæl.ɡə.rɪ.ðəm/',
        situationalSentence: 'In my technical interview, I was asked to write an efficient algorithm to traverse a binary search tree.',
        synonyms: ['procedure', 'formula', 'method', 'routine'],
        antonyms: ['randomness', 'disorganization'],
        category: 'Core Computer Science'
      },
      {
        word: 'scalable',
        meaning: 'Able to be changed in size or scale, especially capable of handling a growing amount of work or traffic smoothly.',
        simpleMeaning: 'Able to grow and handle heavier traffic without crashing.',
        cefrLevel: 'B2' as CEFRLevel,
        partOfSpeech: 'adjective' as PartOfSpeech,
        pronunciation: '/ˈskeɪ.lə.bəl/',
        situationalSentence: 'I highlighted how we built a scalable microservices architecture that seamlessly handles over 100,000 active users.',
        synonyms: ['expandable', 'adaptable', 'flexible', 'modular'],
        antonyms: ['rigid', 'unscalable', 'fixed'],
        category: 'System Architecture'
      },
      {
        word: 'refactor',
        meaning: 'To restructure existing computer code without changing its external behavior, in order to improve readability and performance.',
        simpleMeaning: 'Clean up and improve code without changing what it does.',
        cefrLevel: 'B2' as CEFRLevel,
        partOfSpeech: 'verb' as PartOfSpeech,
        pronunciation: '/riːˈfæk.tər/',
        situationalSentence: 'When the interviewer asked about code quality, I explained how I refactored legacy functions into reusable components.',
        synonyms: ['restructure', 'clean up', 'optimize', 'modernize'],
        antonyms: ['spoil', 'degrade', 'complicate'],
        category: 'Code Quality'
      },
      {
        word: 'deploy',
        meaning: 'To move software or an application from a development environment to a live production server for users.',
        simpleMeaning: 'Launch new software to the live server.',
        cefrLevel: 'B1' as CEFRLevel,
        partOfSpeech: 'verb' as PartOfSpeech,
        pronunciation: '/dɪˈplɔɪ/',
        situationalSentence: 'We configured automated CI/CD pipelines to deploy zero-downtime releases to production every sprint.',
        synonyms: ['launch', 'release', 'roll out', 'ship'],
        antonyms: ['rollback', 'withdraw', 'recall'],
        category: 'DevOps & Release'
      },
      {
        word: 'bottleneck',
        meaning: 'A point of congestion in a system that impedes overall progress or degrades speed and performance.',
        simpleMeaning: 'A traffic jam point that slows down the whole system.',
        cefrLevel: 'B2' as CEFRLevel,
        partOfSpeech: 'noun' as PartOfSpeech,
        pronunciation: '/ˈbɒt.əl.nek/',
        situationalSentence: 'I used profiling tools during the performance test to detect the database indexing bottleneck.',
        synonyms: ['impediment', 'choke point', 'restriction', 'delay'],
        antonyms: ['breakthrough', 'accelerator', 'clearway'],
        category: 'Performance Tuning'
      },
      {
        word: 'latency',
        meaning: 'The delay between an instruction being given and the data actually being transferred or processed.',
        simpleMeaning: 'Network or processing delay time.',
        cefrLevel: 'C1' as CEFRLevel,
        partOfSpeech: 'noun' as PartOfSpeech,
        pronunciation: '/ˈleɪ.tən.si/',
        situationalSentence: 'By caching frequent responses with Redis, we reduced API latency from 450ms down to 40ms.',
        synonyms: ['delay', 'lag', 'deferment'],
        antonyms: ['immediacy', 'instantaneity'],
        category: 'Networking & Performance'
      },
      {
        word: 'proficient',
        meaning: 'Competent or skilled in doing or using something, especially a programming language or technical tool.',
        simpleMeaning: 'Skilled and experienced at doing something.',
        cefrLevel: 'B2' as CEFRLevel,
        partOfSpeech: 'adjective' as PartOfSpeech,
        pronunciation: '/prəˈfɪʃ.ənt/',
        situationalSentence: 'I am proficient in modern JavaScript, TypeScript, React, and building RESTful web services.',
        synonyms: ['skilled', 'adept', 'competent', 'experienced'],
        antonyms: ['amateur', 'inexperienced', 'inept'],
        category: 'Professional Fluency'
      },
      {
        word: 'troubleshoot',
        meaning: 'To trace, analyze, and correct faults in a mechanical or electronic system, or in computer software.',
        simpleMeaning: 'Find and fix problems or errors.',
        cefrLevel: 'B2' as CEFRLevel,
        partOfSpeech: 'verb' as PartOfSpeech,
        pronunciation: '/ˈtrʌb.əl.ʃuːt/',
        situationalSentence: 'The hiring manager was impressed with how methodically I troubleshoot unexpected null pointer errors in production.',
        synonyms: ['diagnose', 'debug', 'resolve', 'fix'],
        antonyms: ['ignore', 'neglect'],
        category: 'Problem Solving'
      },
      {
        word: 'agile',
        meaning: 'Relating to a method of project management, especially for software, that is characterized by short, flexible development cycles.',
        simpleMeaning: 'Fast, flexible teamwork with regular updates.',
        cefrLevel: 'B2' as CEFRLevel,
        partOfSpeech: 'adjective' as PartOfSpeech,
        pronunciation: '/ˈædʒ.aɪl/',
        situationalSentence: 'Our team practiced agile development with daily standup syncs, sprint planning, and bi-weekly retrospectives.',
        synonyms: ['nimble', 'adaptable', 'iterative'],
        antonyms: ['rigid', 'waterfall', 'inflexible'],
        category: 'Work Methodology'
      },
      {
        word: 'redundancy',
        meaning: 'The inclusion of extra components that are not strictly necessary to functioning, in case of failure in other components.',
        simpleMeaning: 'Having backup systems so service never goes down.',
        cefrLevel: 'C1' as CEFRLevel,
        partOfSpeech: 'noun' as PartOfSpeech,
        pronunciation: '/rɪˈdʌn.dən.si/',
        situationalSentence: 'We implemented multi-region server redundancy to guarantee 99.99% high availability during outages.',
        synonyms: ['backup', 'duplication', 'fail-safe'],
        antonyms: ['single point of failure', 'shortage'],
        category: 'High Availability'
      },
      {
        word: 'maintainability',
        meaning: 'The ease with which a software system or component can be modified to correct faults, improve performance, or adapt.',
        simpleMeaning: 'How easy code is to read, update, and fix in the future.',
        cefrLevel: 'B2' as CEFRLevel,
        partOfSpeech: 'noun' as PartOfSpeech,
        pronunciation: '/meɪnˌteɪ.nəˈbɪl.ə.ti/',
        situationalSentence: 'I follow clean code principles and comprehensive documentation to ensure long-term codebase maintainability.',
        synonyms: ['sustainability', 'manageability', 'readability'],
        antonyms: ['fragility', 'obsolescence'],
        category: 'Software Engineering'
      },
      {
        word: 'collaborate',
        meaning: 'To work jointly with others or together especially in an intellectual endeavor.',
        simpleMeaning: 'Work together as a united team.',
        cefrLevel: 'B1' as CEFRLevel,
        partOfSpeech: 'verb' as PartOfSpeech,
        pronunciation: '/kəˈlæb.ə.reɪt/',
        situationalSentence: 'I collaborate closely with UI/UX designers and product managers to deliver user-centric features.',
        synonyms: ['cooperate', 'team up', 'partner'],
        antonyms: ['isolate', 'compete', 'disagree'],
        category: 'Soft Skills'
      },
      {
        word: 'trade-off',
        meaning: 'A situational decision that involves diminishing or losing one quality, quantity, or property of a set or design in return for gains in other aspects.',
        simpleMeaning: 'Balancing pros and cons when picking an option.',
        cefrLevel: 'C1' as CEFRLevel,
        partOfSpeech: 'noun' as PartOfSpeech,
        pronunciation: '/ˈtreɪd.ɒf/',
        situationalSentence: 'In the system design round, I clearly analyzed the trade-off between database read latency and write consistency.',
        synonyms: ['compromise', 'balance', 'exchange'],
        antonyms: ['win-win'],
        category: 'System Design'
      },
      {
        word: 'idempotent',
        meaning: 'Denoting an element or operation of a system which produces the same outcome when executed multiple times as when executed once.',
        simpleMeaning: 'An API call that is safe to repeat without duplicate effects.',
        cefrLevel: 'C1' as CEFRLevel,
        partOfSpeech: 'adjective' as PartOfSpeech,
        pronunciation: '/ˌaɪ.dəmˈpoʊ.tənt/',
        situationalSentence: 'I designed our payment webhook endpoint to be strictly idempotent to prevent duplicate billing during network retries.',
        synonyms: ['repeatable', 'consistent'],
        antonyms: ['non-idempotent'],
        category: 'API & Reliability'
      },
      {
        word: 'asynchronous',
        meaning: 'Not occurring at the same time; in computing, executing tasks in the background without blocking the main program thread.',
        simpleMeaning: 'Running tasks in background without freezing the app.',
        cefrLevel: 'B2' as CEFRLevel,
        partOfSpeech: 'adjective' as PartOfSpeech,
        pronunciation: '/eɪˈsɪŋ.krə.nəs/',
        situationalSentence: 'We decoupled CPU-heavy image processing into an asynchronous message queue powered by RabbitMQ.',
        synonyms: ['non-blocking', 'decoupled', 'concurrent'],
        antonyms: ['synchronous', 'blocking'],
        category: 'Concurrency'
      },
      {
        word: 'monolithic',
        meaning: 'Composed of all in one piece; describing a software system where all components are tightly coupled in a single unified codebase.',
        simpleMeaning: 'A single large unified application system.',
        cefrLevel: 'C1' as CEFRLevel,
        partOfSpeech: 'adjective' as PartOfSpeech,
        pronunciation: '/ˌmɒn.əˈlɪθ.ɪk/',
        situationalSentence: 'I spearheaded the migration of our legacy monolithic service into independent, containerized services.',
        synonyms: ['unified', 'centralized', 'single-tier'],
        antonyms: ['distributed', 'microservices', 'modular'],
        category: 'Architecture'
      },
      {
        word: 'resilience',
        meaning: 'The ability of a system, software, or organization to recover quickly from difficulties, unexpected crashes, or network faults.',
        simpleMeaning: 'Ability to bounce back and stay alive after failures.',
        cefrLevel: 'C1' as CEFRLevel,
        partOfSpeech: 'noun' as PartOfSpeech,
        pronunciation: '/rɪˈzɪl.jəns/',
        situationalSentence: 'We improved our backend resilience by implementing circuit breakers and automatic exponential backoff retries.',
        synonyms: ['fault tolerance', 'durability', 'robustness'],
        antonyms: ['fragility', 'vulnerability'],
        category: 'High Availability'
      },
      {
        word: 'instrumentation',
        meaning: 'The ability to measure, log, and monitor the performance and internal execution flow of an application.',
        simpleMeaning: 'Adding logs and metrics to track app performance.',
        cefrLevel: 'C1' as CEFRLevel,
        partOfSpeech: 'noun' as PartOfSpeech,
        pronunciation: '/ˌɪn.strə.mənˈteɪ.ʃən/',
        situationalSentence: 'We added real-time telemetry instrumentation to track client API error rates in Datadog.',
        synonyms: ['observability', 'telemetry', 'monitoring'],
        antonyms: ['blindness'],
        category: 'DevOps & Monitoring'
      },
      {
        word: 'ownership',
        meaning: 'The state or fact of taking full accountability and proactive responsibility for delivering features from design to production.',
        simpleMeaning: 'Taking full responsibility for your work from start to finish.',
        cefrLevel: 'B2' as CEFRLevel,
        partOfSpeech: 'noun' as PartOfSpeech,
        pronunciation: '/ˈoʊ.nər.ʃɪp/',
        situationalSentence: 'In my previous role, I took complete end-to-end ownership of the authentication revamp and delivered it two weeks ahead of schedule.',
        synonyms: ['accountability', 'initiative', 'responsibility'],
        antonyms: ['passivity', 'indifference'],
        category: 'Leadership & Culture'
      },
      {
        word: 'proactive',
        meaning: 'Creating or controlling a situation by causing something to happen rather than responding to it after it has happened.',
        simpleMeaning: 'Acting in advance to prevent problems rather than waiting.',
        cefrLevel: 'B2' as CEFRLevel,
        partOfSpeech: 'adjective' as PartOfSpeech,
        pronunciation: '/prəʊˈæk.tɪv/',
        situationalSentence: 'I take a proactive approach to code health by writing automated linting rules and identifying technical debt early.',
        synonyms: ['forward-looking', 'anticipatory', 'enterprising'],
        antonyms: ['reactive', 'passive'],
        category: 'Soft Skills'
      }
    ],
    phrases: [
      {
        phrase: 'Could you walk me through your technical background and key projects?',
        meaning: 'A classic opening question asked by interviewers to hear your engineering journey.',
        situationUsage: 'Use to summarize your tech stack, responsibilities, and major impact achievements clearly.'
      },
      {
        phrase: 'I have hands-on experience in building and optimizing...',
        meaning: 'A strong professional statement indicating practical, real-world development experience.',
        situationUsage: 'Use when asserting your expertise in a language, framework, or cloud tool.'
      },
      {
        phrase: 'How do you handle edge cases and unexpected production bugs under pressure?',
        meaning: 'Interviewer testing your problem-solving calmness and diagnostic methods.',
        situationUsage: 'Answer by explaining systematic logging, reproduction steps, and root-cause analysis.'
      },
      {
        phrase: 'My approach to code quality is writing modular code with comprehensive unit test coverage.',
        meaning: 'Shows strong engineering maturity and respect for robust software.',
        situationUsage: 'Use during behavioral questions about your coding standards.'
      },
      {
        phrase: 'Could you elaborate on the expected read-to-write traffic ratio and latency bounds?',
        meaning: 'Clarifying the system scale before designing the architecture.',
        situationUsage: 'Use in system design interviews before proposing a database solution.'
      },
      {
        phrase: 'Given the constraints, I chose this approach because the primary trade-off prioritizes consistency over availability.',
        meaning: 'Demonstrates clear engineering reasoning based on the CAP theorem or product needs.',
        situationUsage: 'Use when defending an architecture or database choice.'
      },
      {
        phrase: 'I collaborated cross-functionally with product and QA to ensure seamless feature rollout.',
        meaning: 'Shows teamwork and cross-team communication abilities.',
        situationUsage: 'Use during behavioral and culture-fit rounds.'
      },
      {
        phrase: 'When we hit a bottleneck in our data pipeline, I initiated a deep-dive investigation...',
        meaning: 'Opening sentence for a STAR-method story highlighting problem solving.',
        situationUsage: 'Use when asked to describe a technical challenge you overcame.'
      },
      {
        phrase: 'I am always eager to learn modern tooling and adapt to your engineering best practices.',
        meaning: 'Polite statement showing growth mindset and humility.',
        situationUsage: 'Use during the interview conclusion or wrap-up questions.'
      },
      {
        phrase: 'Could you share what a typical sprint lifecycle looks like for an engineer on this team?',
        meaning: 'A thoughtful, engaging question to ask the interviewer at the end.',
        situationUsage: 'Use when the interviewer asks: "Do you have any questions for us?"'
      }
    ]
  },
  {
    keywords: ['travel', 'chennai', 'coimbatore', 'journey', 'trip', 'train', 'flight', 'bus', 'ticket', 'airport', 'station', 'commute', 'transit', 'route', 'destination', 'luggage', 'booking'],
    title: 'Travel & Transit (e.g., Coimbatore to Chennai)',
    summary: 'Practical English vocabulary, navigation phrases, and situational communication expressions for bus, train, flight, and road commutes.',
    tags: ['🚆 Transit & Rail', '🎫 Booking & Tickets', '🗺️ Navigation'],
    words: [
      {
        word: 'itinerary',
        meaning: 'A planned route or journey schedule listing places to visit and times.',
        simpleMeaning: 'A written plan or schedule for a trip.',
        cefrLevel: 'B1' as CEFRLevel,
        partOfSpeech: 'noun' as PartOfSpeech,
        pronunciation: '/aɪˈtɪn.ər.ər.i/',
        situationalSentence: 'My travel itinerary includes taking the early morning express train from Coimbatore to Chennai Central.',
        synonyms: ['schedule', 'route', 'journey plan', 'timetable'],
        antonyms: ['improvisation', 'detour'],
        category: 'Travel Planning'
      },
      {
        word: 'commute',
        meaning: 'To travel some distance between one’s home and place of work or travel regularly on a route.',
        simpleMeaning: 'Travel to work or between cities regularly.',
        cefrLevel: 'B1' as CEFRLevel,
        partOfSpeech: 'verb' as PartOfSpeech,
        pronunciation: '/kəˈmjuːt/',
        situationalSentence: 'Thousands of professionals commute between Coimbatore and Chennai weekly using the Vande Bharat Express.',
        synonyms: ['travel', 'journey', 'shuttle', 'transit'],
        antonyms: ['stay put', 'reside'],
        category: 'Transit'
      },
      {
        word: 'departure',
        meaning: 'The action of leaving, especially to start a journey.',
        simpleMeaning: 'Leaving or starting a trip.',
        cefrLevel: 'A2' as CEFRLevel,
        partOfSpeech: 'noun' as PartOfSpeech,
        pronunciation: '/dɪˈpɑː.tʃər/',
        situationalSentence: 'The departure time for the bus to Chennai is scheduled promptly at 9:30 PM from Gandhipuram.',
        synonyms: ['exit', 'leaving', 'send-off', 'takeoff'],
        antonyms: ['arrival', 'return', 'landing'],
        category: 'Station Terms'
      },
      {
        word: 'destination',
        meaning: 'The place to which someone or something is going or being sent.',
        simpleMeaning: 'The final place you are traveling to.',
        cefrLevel: 'B1' as CEFRLevel,
        partOfSpeech: 'noun' as PartOfSpeech,
        pronunciation: '/ˌdes.tɪˈneɪ.ʃən/',
        situationalSentence: 'Chennai was our final destination, and we arrived safely within six hours of boarding in Coimbatore.',
        synonyms: ['journey’s end', 'goal', 'target', 'terminus'],
        antonyms: ['origin', 'starting point', 'departure point'],
        category: 'Navigation'
      },
      {
        word: 'reservation',
        meaning: 'An arrangement by which something, such as a seat, berth, or room, is booked in advance.',
        simpleMeaning: 'Booking a seat or room before your trip.',
        cefrLevel: 'A2' as CEFRLevel,
        partOfSpeech: 'noun' as PartOfSpeech,
        pronunciation: '/ˌrez.əˈveɪ.ʃən/',
        situationalSentence: 'I showed the train conductor my confirmed digital reservation on my mobile screen.',
        synonyms: ['booking', 'arrangement', 'pre-order'],
        antonyms: ['cancellation', 'walk-in'],
        category: 'Tickets'
      },
      {
        word: 'transit',
        meaning: 'The carrying of people or goods from one place to another, or passing through a place en route.',
        simpleMeaning: 'Moving or passing through during a journey.',
        cefrLevel: 'B2' as CEFRLevel,
        partOfSpeech: 'noun' as PartOfSpeech,
        pronunciation: '/ˈtræn.zɪt/',
        situationalSentence: 'While in transit between Coimbatore and Chennai, we enjoyed the scenic lush greenery from the train window.',
        synonyms: ['passage', 'conveyance', 'transportation'],
        antonyms: ['stagnation', 'halt'],
        category: 'Transit'
      },
      {
        word: 'luggage',
        meaning: 'Suitcases or other bags in which to pack personal belongings for traveling.',
        simpleMeaning: 'Bags and suitcases you carry when traveling.',
        cefrLevel: 'A2' as CEFRLevel,
        partOfSpeech: 'noun' as PartOfSpeech,
        pronunciation: '/ˈlʌɡ.ɪdʒ/',
        situationalSentence: 'Keep your luggage securely placed under the seat or in the overhead carriage rack.',
        synonyms: ['baggage', 'suitcases', 'gear', 'belongings'],
        antonyms: [],
        category: 'Travel Items'
      },
      {
        word: 'delayed',
        meaning: 'Late, slow, or postponed beyond the appointed or expected time.',
        simpleMeaning: 'Happening later than scheduled.',
        cefrLevel: 'A2' as CEFRLevel,
        partOfSpeech: 'adjective' as PartOfSpeech,
        pronunciation: '/dɪˈleɪd/',
        situationalSentence: 'The express train was delayed by twenty minutes due to maintenance on the railway track near Salem.',
        synonyms: ['late', 'postponed', 'retarded', 'held up'],
        antonyms: ['punctual', 'on time', 'early'],
        category: 'Travel Status'
      },
      {
        word: 'boarding',
        meaning: 'The action of getting on or into a ship, aircraft, train, or other vehicle.',
        simpleMeaning: 'Getting into the train, bus, or plane.',
        cefrLevel: 'A2' as CEFRLevel,
        partOfSpeech: 'noun' as PartOfSpeech,
        pronunciation: '/ˈbɔː.dɪŋ/',
        situationalSentence: 'Boarding for the Chennai Superfast begins ten minutes before departure at Platform 1.',
        synonyms: ['embarking', 'mounting', 'entering'],
        antonyms: ['disembarking', 'alighting', 'exiting'],
        category: 'Station Terms'
      },
      {
        word: 'scenic',
        meaning: 'Providing or relating to views of impressive or beautiful natural scenery.',
        simpleMeaning: 'Having beautiful natural views.',
        cefrLevel: 'B1' as CEFRLevel,
        partOfSpeech: 'adjective' as PartOfSpeech,
        pronunciation: '/ˈsiː.nɪk/',
        situationalSentence: 'The daytime highway drive from Coimbatore to Chennai offers a scenic view of rolling hills and coconut groves.',
        synonyms: ['picturesque', 'breathtaking', 'panoramic', 'beautiful'],
        antonyms: ['dull', 'bleak', 'ugly'],
        category: 'Experience'
      },
      {
        word: 'accommodate',
        meaning: 'To provide lodging or sufficient space for someone; or to fit in with someone’s wishes.',
        simpleMeaning: 'Provide space or a room for someone.',
        cefrLevel: 'B2' as CEFRLevel,
        partOfSpeech: 'verb' as PartOfSpeech,
        pronunciation: '/əˈkɒm.ə.deɪt/',
        situationalSentence: 'The hotel near Chennai Central was able to accommodate our late night arrival smoothly.',
        synonyms: ['lodge', 'house', 'shelter', 'assist'],
        antonyms: ['turn away', 'evict', 'reject'],
        category: 'Hospitality'
      },
      {
        word: 'punctual',
        meaning: 'Happening, arriving, or doing something at the agreed or proper time; on time.',
        simpleMeaning: 'Always on time; never late.',
        cefrLevel: 'B2' as CEFRLevel,
        partOfSpeech: 'adjective' as PartOfSpeech,
        pronunciation: '/ˈpʌŋk.tʃu.əl/',
        situationalSentence: 'The morning Vande Bharat train from Coimbatore is remarkably punctual, reaching Chennai on the dot.',
        synonyms: ['on time', 'prompt', 'timely'],
        antonyms: ['tardy', 'late', 'delayed'],
        category: 'Service Quality'
      }
    ],
    phrases: [
      {
        phrase: 'Excuse me, could you please tell me which platform the train to Chennai arrives on?',
        meaning: 'A polite, clear inquiry to ask railway station staff or co-passengers.',
        situationUsage: 'Use upon reaching Coimbatore Junction or intermediate railway stations.'
      },
      {
        phrase: 'Is this the direct express coach, or does it require any transfer?',
        meaning: 'Confirming if your journey is non-stop or has transit stops.',
        situationUsage: 'Use before boarding long-distance buses or connecting rail coaches.'
      },
      {
        phrase: 'Could I please request a window seat, if one is available?',
        meaning: 'A polite booking or seat exchange request.',
        situationUsage: 'Use when booking tickets at the counter or checking in.'
      },
      {
        phrase: 'What is the estimated arrival time in Chennai considering current traffic?',
        meaning: 'Asking the driver or conductor for the realistic arrival forecast.',
        situationUsage: 'Use when planning pickup or connecting meetings upon arrival.'
      }
    ]
  },
  {
    keywords: ['doctor', 'hospital', 'clinic', 'pain', 'medicine', 'fever', 'health', 'sick', 'appointment', 'headache', 'treatment', 'prescription'],
    title: 'Doctor & Hospital Medical Visit',
    summary: 'Clinical vocabulary, symptom descriptions, and essential medical dialogue expressions for doctor appointments and healthcare consultations.',
    tags: ['🏥 Health & Clinic', '💊 Symptoms & Meds', '🩺 Consultations'],
    words: [
      {
        word: 'symptom',
        meaning: 'A physical or mental feature indicating a condition of disease, especially noticeable by the patient.',
        simpleMeaning: 'A sign or feeling of being sick.',
        cefrLevel: 'B1' as CEFRLevel,
        partOfSpeech: 'noun' as PartOfSpeech,
        pronunciation: '/ˈsɪmp.təm/',
        situationalSentence: 'The main symptom I noticed was a mild persistent fever accompanied by body aches.',
        synonyms: ['sign', 'indication', 'manifestation'],
        antonyms: [],
        category: 'Clinical'
      },
      {
        word: 'prescription',
        meaning: 'An instruction written by a medical practitioner that authorizes a patient to be provided a medicine.',
        simpleMeaning: 'A doctor’s official note for medicine.',
        cefrLevel: 'B1' as CEFRLevel,
        partOfSpeech: 'noun' as PartOfSpeech,
        pronunciation: '/prɪˈskrɪp.ʃən/',
        situationalSentence: 'The doctor gave me a five-day antibiotic prescription and advised complete bed rest.',
        synonyms: ['recipe', 'direction', 'order'],
        antonyms: [],
        category: 'Pharmacy'
      },
      {
        word: 'diagnosis',
        meaning: 'The identification of the nature of an illness or other problem by examination of the symptoms.',
        simpleMeaning: 'Finding out what sickness someone has.',
        cefrLevel: 'B2' as CEFRLevel,
        partOfSpeech: 'noun' as PartOfSpeech,
        pronunciation: '/ˌdaɪ.əɡˈnəʊ.sɪs/',
        situationalSentence: 'After checking my blood test results, the physician confirmed a mild seasonal viral infection diagnosis.',
        synonyms: ['identification', 'detection', 'assessment'],
        antonyms: [],
        category: 'Medical'
      },
      {
        word: 'dosage',
        meaning: 'The size or frequency of a dose of a medicine or drug.',
        simpleMeaning: 'How much and how often to take medicine.',
        cefrLevel: 'B2' as CEFRLevel,
        partOfSpeech: 'noun' as PartOfSpeech,
        pronunciation: '/ˈdəʊ.sɪdʒ/',
        situationalSentence: 'Be sure not to exceed the recommended dosage of two tablets twice a day after meals.',
        synonyms: ['amount', 'quantity', 'dose'],
        antonyms: [],
        category: 'Pharmacy'
      },
      {
        word: 'consultation',
        meaning: 'A meeting with an expert or doctor in order to seek advice.',
        simpleMeaning: 'A meeting to talk to a doctor about your health.',
        cefrLevel: 'B2' as CEFRLevel,
        partOfSpeech: 'noun' as PartOfSpeech,
        pronunciation: '/ˌkɒn.səlˈteɪ.ʃən/',
        situationalSentence: 'I booked a follow-up consultation with the cardiologist for next Thursday.',
        synonyms: ['discussion', 'appointment', 'conference'],
        antonyms: [],
        category: 'Hospital'
      },
      {
        word: 'persistent',
        meaning: 'Continuing firmly or obstinately in a course of action in spite of difficulty; continuing to exist for a long time.',
        simpleMeaning: 'Lasting for a long time without stopping.',
        cefrLevel: 'B2' as CEFRLevel,
        partOfSpeech: 'adjective' as PartOfSpeech,
        pronunciation: '/pəˈsɪs.tənt/',
        situationalSentence: 'I visited the doctor because of a persistent dry cough that has lasted for over a week.',
        synonyms: ['constant', 'continuous', 'enduring'],
        antonyms: ['temporary', 'fleeting'],
        category: 'Symptoms'
      }
    ],
    phrases: [
      {
        phrase: 'I have been experiencing a throbbing headache and fatigue since yesterday.',
        meaning: 'Describing your physical symptoms accurately to the doctor.',
        situationUsage: 'Use right after entering the consultation room.'
      },
      {
        phrase: 'Are there any dietary restrictions or common side effects for this medicine?',
        meaning: 'Inquiring about food precautions and adverse reactions.',
        situationUsage: 'Use before leaving the doctor’s desk or at the pharmacy.'
      }
    ]
  },
  {
    keywords: ['meeting', 'client', 'business', 'presentation', 'pitch', 'office', 'proposal', 'deadline', 'corporate', 'negotiate'],
    title: 'Professional Business Meeting & Client Pitch',
    summary: 'Executive expressions, negotiation terms, and structured phrases for high-stakes business presentations and client syncs.',
    tags: ['📊 Business', '🤝 Client Pitch', '💼 Corporate'],
    words: [
      {
        word: 'deliverable',
        meaning: 'A thing able to be provided, especially as a product or output of a development process.',
        simpleMeaning: 'The completed work or product promised to a client.',
        cefrLevel: 'B2' as CEFRLevel,
        partOfSpeech: 'noun' as PartOfSpeech,
        pronunciation: '/dɪˈlɪv.ər.ə.bəl/',
        situationalSentence: 'We assured the client that all key project deliverables would be completed before the quarter ends.',
        synonyms: ['output', 'product', 'result'],
        antonyms: [],
        category: 'Project Management'
      },
      {
        word: 'feasibility',
        meaning: 'The state or degree of being easily or conveniently done; practical viability.',
        simpleMeaning: 'Whether a plan is practical and possible to do.',
        cefrLevel: 'C1' as CEFRLevel,
        partOfSpeech: 'noun' as PartOfSpeech,
        pronunciation: '/ˌfiː.zəˈbɪl.ə.ti/',
        situationalSentence: 'Our engineering team conducted a feasibility study before presenting the proposal to the client.',
        synonyms: ['viability', 'practicability', 'workability'],
        antonyms: ['impossibility', 'unfeasibility'],
        category: 'Strategy'
      },
      {
        word: 'consensus',
        meaning: 'A general agreement among a group of people.',
        simpleMeaning: 'Everyone in the team agreeing on a decision.',
        cefrLevel: 'C1' as CEFRLevel,
        partOfSpeech: 'noun' as PartOfSpeech,
        pronunciation: '/kənˈsen.səs/',
        situationalSentence: 'After extensive discussion, the stakeholders reached a unanimous consensus on the project timeline.',
        synonyms: ['agreement', 'harmony', 'unity'],
        antonyms: ['disagreement', 'conflict', 'dissent'],
        category: 'Meetings'
      },
      {
        word: 'prioritize',
        meaning: 'To designate or treat something as more important than other things.',
        simpleMeaning: 'Put the most important task first.',
        cefrLevel: 'B2' as CEFRLevel,
        partOfSpeech: 'verb' as PartOfSpeech,
        pronunciation: '/praɪˈɒr.ɪ.taɪz/',
        situationalSentence: 'We need to prioritize customer feedback and resolve critical bugs before launching marketing campaigns.',
        synonyms: ['emphasize', 'rank', 'highlight'],
        antonyms: ['neglect', 'postpone'],
        category: 'Planning'
      }
    ],
    phrases: [
      {
        phrase: 'Let us touch base on the key deliverables and align our expectations.',
        meaning: 'A polite corporate phrase to initiate a project alignment meeting.',
        situationUsage: 'Use at the beginning of a client or stakeholder sync.'
      },
      {
        phrase: 'From a cost-benefit perspective, this solution offers the highest return on investment.',
        meaning: 'Persuasive reasoning during a pitch or business review.',
        situationUsage: 'Use when justifying an investment or architecture decision.'
      }
    ]
  }
];

export async function generateSituationalVocabulary(
  userPrompt: string,
  apiKey: string = getStoredGeminiKey()
): Promise<SituationalResult> {
  const cleanPrompt = (userPrompt || '').trim();
  const lower = cleanPrompt.toLowerCase();

  // Check if user prompt matches any preset pack
  let bestPreset = PRESET_PACKS.find(pack => 
    pack.keywords.some(k => lower.includes(k))
  );

  const cleanKey = apiKey.trim() || DEFAULT_GEMINI_KEY;

  // If no Gemini key is provided or offline, return the matched preset pack or a dynamic smart generator
  if (!cleanKey) {
    if (bestPreset) {
      const extra = getContextualConjunctionsAndTips(bestPreset.title);
      return {
        situationTitle: bestPreset.title,
        situationSummary: bestPreset.summary,
        categoryTags: bestPreset.tags,
        words: bestPreset.words,
        phrases: bestPreset.phrases,
        conjunctions: extra.conjunctions,
        tips: extra.tips
      };
    }

    // Dynamic fallback when prompt is totally custom (e.g. general topic) without Gemini API
    const promptWords = cleanPrompt.split(/\s+/).filter(w => w.length > 2).slice(0, 3).join(' ');
    const extra = getContextualConjunctionsAndTips(cleanPrompt);
    return {
      situationTitle: `Situational English: ${cleanPrompt.slice(0, 40)}`,
      situationSummary: `Curated English vocabulary, pronunciation, and practical conversation sentences tailored for: "${cleanPrompt}".`,
      categoryTags: ['🎯 Contextual English', '🗣️ Conversational', '💡 Real World'],
      words: [
        {
          word: 'perspective',
          meaning: 'A particular attitude toward or way of regarding something; a point of view.',
          simpleMeaning: 'Your way of thinking about or seeing something.',
          cefrLevel: 'B2',
          partOfSpeech: 'noun',
          pronunciation: '/pəˈspek.tɪv/',
          situationalSentence: `From my perspective regarding ${promptWords || 'this situation'}, clear and polite communication is vital.`,
          synonyms: ['point of view', 'outlook', 'viewpoint'],
          antonyms: [],
          category: 'Communication'
        },
        {
          word: 'feasible',
          meaning: 'Possible and practical to do easily or conveniently.',
          simpleMeaning: 'Practical and easy to accomplish.',
          cefrLevel: 'B2',
          partOfSpeech: 'adjective',
          pronunciation: '/ˈfiː.zə.bəl/',
          situationalSentence: `We evaluated whether it was feasible to handle ${promptWords || 'our plan'} within the available timeframe.`,
          synonyms: ['practical', 'achievable', 'viable'],
          antonyms: ['impractical', 'impossible'],
          category: 'Practical Skills'
        },
        {
          word: 'clarification',
          meaning: 'The action of making a statement or situation less confused and more comprehensible.',
          simpleMeaning: 'Making something clear so there is no confusion.',
          cefrLevel: 'B2',
          partOfSpeech: 'noun',
          pronunciation: '/ˌklær.ɪ.fɪˈkeɪ.ʃən/',
          situationalSentence: `I politely asked for clarification regarding the specific details of ${promptWords || 'the request'}.`,
          synonyms: ['explanation', 'simplification', 'illumination'],
          antonyms: ['confusion', 'obscurity'],
          category: 'Dialogue'
        },
        {
          word: 'convenient',
          meaning: 'Fitting in well with a person’s needs, activities, and plans; causing little difficulty.',
          simpleMeaning: 'Easy, useful, and comfortable to do.',
          cefrLevel: 'B1',
          partOfSpeech: 'adjective',
          pronunciation: '/kənˈviː.ni.ənt/',
          situationalSentence: `Please let me know a convenient time to discuss ${promptWords || 'this matter'}.`,
          synonyms: ['handy', 'suitable', 'favorable'],
          antonyms: ['inconvenient', 'troublesome'],
          category: 'Daily Usage'
        },
        {
          word: 'inquire',
          meaning: 'To ask for information from someone.',
          simpleMeaning: 'Ask a question or seek information politely.',
          cefrLevel: 'B1',
          partOfSpeech: 'verb',
          pronunciation: '/ɪnˈkwaɪər/',
          situationalSentence: `I called ahead to inquire about the schedule and guidelines for ${promptWords || 'our activity'}.`,
          synonyms: ['ask', 'question', 'query'],
          antonyms: ['reply', 'answer'],
          category: 'Conversation'
        },
        {
          word: 'demonstrate',
          meaning: 'To clearly show the existence or truth of something by giving proof or evidence.',
          simpleMeaning: 'Show clearly how something works or prove a skill.',
          cefrLevel: 'B2',
          partOfSpeech: 'verb',
          pronunciation: '/ˈdem.ən.streɪt/',
          situationalSentence: `I was able to demonstrate my practical skills and confidence in ${promptWords || 'my task'}.`,
          synonyms: ['show', 'prove', 'illustrate'],
          antonyms: ['conceal', 'hide'],
          category: 'Action'
        }
      ],
      phrases: [
        {
          phrase: `Could you please provide more details regarding ${promptWords || 'this'}?`,
          meaning: 'Polite inquiry asking for extra clarity.',
          situationUsage: 'Use in any conversation or email.'
        },
        {
          phrase: 'I would appreciate your guidance on the best way to proceed.',
          meaning: 'Polite request seeking advice or instructions.',
          situationUsage: 'Use when speaking to an interviewer, official, or senior colleague.'
        }
      ],
      conjunctions: extra.conjunctions,
      tips: extra.tips
    };
  }

  // Live Gemini generation when API key is present!
  const systemPrompt = `You are an elite English language tutor and vocabulary coach.
The student has provided a specific situation, goal, or scenario:
"${cleanPrompt}"

Perform a DEEP, COMPREHENSIVE linguistic analysis of this exact scenario.
Curate a rich, high-yield learning toolkit:
1. "words": 18 to 22 high-impact English vocabulary words covering technical/practical core concepts, action verbs, nuanced adjectives, and professional communication terms.
   For each word, include:
   - "word": headword in lowercase
   - "meaning": clear Oxford learner-friendly definition
   - "simpleMeaning": plain English 3-5 word summary
   - "cefrLevel": "A2" | "B1" | "B2" | "C1" | "C2"
   - "partOfSpeech": "noun" | "verb" | "adjective" | "adverb" | "phrase"
   - "pronunciation": accurate IPA phonetic notation (e.g. "/ˌskeɪləˈbɪləti/")
   - "situationalSentence": a natural, highly realistic spoken sentence using the word in this exact situation
   - "synonyms": 2 to 3 practical synonyms
   - "antonyms": 1 to 2 antonyms (if applicable)
   - "category": specific domain sub-category (e.g. "System Architecture", "Problem Solving", "Navigation")

2. "phrases": 8 to 12 real-world conversational spoken phrases, clarifying questions, and dialogue expressions.
   - "phrase": complete natural spoken sentence
   - "meaning": what it communicates and nuances
   - "situationUsage": when and how to say it effectively

3. "conjunctions": 6 to 8 smooth sentence connectors and transitional conjunctions for fluent, cohesive speech.
   - "connector": the transition word or phrase (e.g. "Consequently", "On the other hand", "Furthermore")
   - "type": category (e.g. "Cause & Effect", "Contrast", "Addition", "Sequencing")
   - "meaning": plain English explanation
   - "situationalSentence": realistic sentence linking two thoughts in this scenario

4. "tips": 5 to 6 practical speaking strategies, do's & don'ts, and response framework templates (e.g., STAR framework, tradeoff formula, confidence cues).
   - "title": punchy title
   - "content": actionable advice or speaking template
   - "category": "tip" | "do" | "dont" | "template"

Return strictly valid JSON matching this schema:
{
  "situationTitle": "Short catchy title summarizing the scenario",
  "situationSummary": "A concise 2-sentence overview of why these words and phrases are vital for this context.",
  "categoryTags": ["tag1", "tag2", "tag3"],
  "words": [...],
  "phrases": [...],
  "conjunctions": [...],
  "tips": [...]
}`;

  const models = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];
  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 6000,
            responseMimeType: 'application/json'
          }
        })
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        if (parsed.words && Array.isArray(parsed.words) && parsed.words.length > 0) {
          const fallbackExtra = getContextualConjunctionsAndTips(parsed.situationTitle || cleanPrompt);
          return {
            situationTitle: parsed.situationTitle || `Curated Vocab for: ${cleanPrompt.slice(0, 30)}`,
            situationSummary: parsed.situationSummary || 'Essential vocabulary and phrases tailored for your situation.',
            categoryTags: Array.isArray(parsed.categoryTags) && parsed.categoryTags.length > 0 ? parsed.categoryTags : ['Situational', 'Smart Curated', 'Fluency'],
            words: parsed.words.map((w: any) => ({
              word: (w.word || '').trim().toLowerCase(),
              meaning: w.meaning || 'Definition',
              simpleMeaning: w.simpleMeaning || undefined,
              cefrLevel: (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(w.cefrLevel) ? w.cefrLevel : 'B2') as CEFRLevel,
              partOfSpeech: (w.partOfSpeech || 'noun') as PartOfSpeech,
              pronunciation: w.pronunciation || '/.../',
              situationalSentence: w.situationalSentence || `Example sentence for ${w.word}.`,
              synonyms: Array.isArray(w.synonyms) ? w.synonyms : [],
              antonyms: Array.isArray(w.antonyms) ? w.antonyms : [],
              category: w.category || 'Core Vocabulary'
            })),
            phrases: Array.isArray(parsed.phrases) && parsed.phrases.length > 0 ? parsed.phrases : [],
            conjunctions: Array.isArray(parsed.conjunctions) && parsed.conjunctions.length > 0 
              ? parsed.conjunctions 
              : fallbackExtra.conjunctions,
            tips: Array.isArray(parsed.tips) && parsed.tips.length > 0 
              ? parsed.tips 
              : fallbackExtra.tips
          };
        }
      }
    } catch {
      // Continue to next model or fallback
    }
  }

  // If live call had an error or timeout, return best matching preset
  if (bestPreset) {
    const extra = getContextualConjunctionsAndTips(bestPreset.title);
    return {
      situationTitle: bestPreset.title,
      situationSummary: bestPreset.summary,
      categoryTags: bestPreset.tags,
      words: bestPreset.words,
      phrases: bestPreset.phrases,
      conjunctions: extra.conjunctions,
      tips: extra.tips
    };
  }

  throw new Error('Could not generate situational vocabulary. Please try again.');
}

// ==========================================
// INTELLIGENT GEMINI INTENT ANALYZER & ENGINE
// ==========================================

export interface AIChatAnalysisResult {
  intent: 'chat' | 'situational_toolkit';
  replyText: string;
  toolkit?: SituationalResult;
}

/**
 * Intelligent Multi-Stage Gemini LLM Intent Analyzer & Processor
 * 
 * Architecture:
 * - STAGE 1: Fast Intent Router (~1-2s):
 *   Determines if user is asking a conversational query, greeting, grammar doubt,
 *   or an explicit situational preparation request.
 * - STAGE 2: Deep Domain Generation (~8-15s):
 *   If situational, triggers deep analysis generating 20+ words, 10 phrases, connectors, and tips.
 */
export async function processUserMessageWithGemini(
  userMessage: string,
  history: Array<{ sender: 'user' | 'assistant'; text: string }> = [],
  apiKey: string = getStoredGeminiKey()
): Promise<AIChatAnalysisResult> {
  const cleanMessage = (userMessage || '').trim();
  const lower = cleanMessage.toLowerCase();
  const cleanKey = apiKey.trim() || DEFAULT_GEMINI_KEY;

  // Format recent chat history context for Gemini
  const formattedHistory = history
    .slice(-4)
    .map(h => `${h.sender.toUpperCase()}: ${h.text}`)
    .join('\n');

  // PHASE 1: Real-time Gemini LLM Fast Intent Classification
  if (cleanKey) {
    const intentPrompt = `You are Lexi AI, an expert, warm, and highly adaptive English Language Tutor and Speaking Coach.
The student can speak in English or Tanglish (Tamil phrases written in Latin alphabet).

Analyze the user's latest message considering the recent conversation history:
User Message: "${cleanMessage}"
Conversation History:
${formattedHistory || '(No previous history)'}

Determine the user's intent:
1. "chat":
   - Casual conversation, greetings ("hi", "hello"), typos ("j", "ok"), compliments, general guidance, asking for tips, grammar explanations (e.g. difference between advice vs advise), or feedback.
   - Provide an insightful, natural, warm tutor answer in "replyText".
   - Set "intent": "chat", "scenario": null.

2. "situational_toolkit":
   - The user is preparing for a specific situation, scenario, conversation, event, interview, or role (e.g., job interview, software developer round, airport transit, train journey, doctor appointment, office client pitch, IELTS speaking test, hotel reservation, salary negotiation).
   - Provide an encouraging, warm coach opening in "replyText" (e.g. "I'm curating a comprehensive 4-in-1 toolkit for your software interview with essential vocabulary, interview phrases, connectors, and tips!").
   - Set "intent": "situational_toolkit", "scenario": "<clear extracted title of the scenario, e.g. Software Developer Technical & Behavioral Interview>".

Return strictly valid JSON:
{
  "intent": "chat" | "situational_toolkit",
  "scenario": string | null,
  "replyText": string
}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${cleanKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: intentPrompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
            responseMimeType: 'application/json'
          }
        })
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        if (parsed.intent === 'chat') {
          return {
            intent: 'chat',
            replyText: parsed.replyText || "I'm here to help you practice English! What topic or situation are you working on today?"
          };
        }

        if (parsed.intent === 'situational_toolkit') {
          const scenarioToGenerate = parsed.scenario || cleanMessage;
          // Trigger deep comprehensive situational extraction
          const toolkit = await generateSituationalVocabulary(scenarioToGenerate, cleanKey);
          return {
            intent: 'situational_toolkit',
            replyText: parsed.replyText || `I've performed a deep analysis for "${toolkit.situationTitle}" and prepared a comprehensive learning studio for you.`,
            toolkit: toolkit
          };
        }
      }
    } catch {
      // Fast classifier timed out or network error -> proceed to smart rule classifier
    }
  }

  // PHASE 2: Smart Built-in NLP Intent Classifier (When offline, no API key, or timeout)

  // 1. Grammar rules, word differences, explanations
  if (
    lower.includes('difference between') ||
    lower.includes('vs ') ||
    lower.startsWith('what is') ||
    lower.startsWith('meaning of') ||
    lower.startsWith('explain') ||
    lower.startsWith('how to use') ||
    lower.endsWith('meaning') ||
    lower.endsWith('difference')
  ) {
    if (lower.includes('compliment') && lower.includes('complement')) {
      return {
        intent: 'chat',
        replyText: `Here is the key difference:\n\n• **Compliment** (with 'i'): A polite remark praising someone. (e.g., "She received a lovely compliment on her presentation.")\n• **Complement** (with 'e'): Something that adds to or completes something else perfectly. (e.g., "The spicy sauce complements the steamed rice.")\n\nMemory Tip: "I like compliments" (remember the 'I').`
      };
    }
    if (lower.includes('affect') && lower.includes('effect')) {
      return {
        intent: 'chat',
        replyText: `Here is the simple rule:\n\n• **Affect** is usually a **VERB** (action: to influence). (e.g., "Heavy rain will affect the match schedule.")\n• **Effect** is usually a **NOUN** (result: an outcome). (e.g., "The medicine had an immediate calming effect.")\n\nMemory Tip: **RAVEN** — **R**emember: **A**ffect is a **V**erb, **E**ffect is a **N**oun!`
      };
    }
    if (lower.includes('advice') && lower.includes('advise')) {
      return {
        intent: 'chat',
        replyText: `Here is the distinction:\n\n• **Advice** (noun with 'c'): The recommendation or guidance itself. (e.g., "Thank you for your valuable advice.")\n• **Advise** (verb with 's'): The action of giving that guidance. (e.g., "I strongly advise you to double-check the ticket dates.")`
      };
    }

    return {
      intent: 'chat',
      replyText: `Great question! In English, understanding precise word distinctions elevates your speaking confidence. If you'd like to practice words and phrases for a specific situation where this is used, tell me the scenario (e.g., 'Software interview' or 'Office meeting')!`
    };
  }

  // 2. Real Situational keywords check:
  const situationalSignals = [
    'interview', 'developer', 'software', 'coding', 'tech', 'job', 'hiring', 'react', 'python',
    'travel', 'chennai', 'coimbatore', 'train', 'flight', 'bus', 'ticket', 'airport', 'transit', 'hotel', 'journey',
    'doctor', 'hospital', 'clinic', 'fever', 'medicine', 'symptoms', 'health', 'consultation',
    'client', 'presentation', 'meeting', 'business', 'pitch', 'project', 'deliverables',
    'ielts', 'exam', 'speaking cue', 'band 8', 'band 9',
    'restaurant', 'food', 'order', 'dining', 'bill', 'cafe',
    'bank', 'loan', 'account', 'manager', 'wedding', 'reception', 'party',
    'office', 'colleague', 'email', 'complaint', 'salary', 'negotiation',
    'prepare', 'situation', 'dialogue', 'vocab for', 'words for', 'phrases for'
  ];

  const hasSituationalSignal = situationalSignals.some(s => lower.includes(s));

  // If user typed something short (< 4 words) without any situational signal, treat as chat!
  if (!hasSituationalSignal && cleanMessage.split(/\s+/).length < 4) {
    return {
      intent: 'chat',
      replyText: `I see you wrote "${cleanMessage}". Could you give me a little more context? For example, are you preparing for an interview, traveling, attending a meeting, or looking for specific vocabulary words?`
    };
  }

  // 3. Genuine Situational Learning Request
  try {
    const toolkit = await generateSituationalVocabulary(cleanMessage, apiKey);
    return {
      intent: 'situational_toolkit',
      replyText: `I've analyzed your situation: "${toolkit.situationTitle}". I have curated ${toolkit.words.length} essential vocabulary words, real-world spoken phrases, sentence connectors, and practical speaking tips tailored for you.`,
      toolkit: toolkit
    };
  } catch (err: any) {
    return {
      intent: 'chat',
      replyText: "I'm ready to help you prepare. Tell me more details about your situation — for example, 'I have an interview for a backend developer role next Monday' or 'I am traveling by train to Chennai'."
    };
  }
}

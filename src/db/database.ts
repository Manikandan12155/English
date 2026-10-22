import Dexie, { Table } from 'dexie';
import { VocabularyWord, UserStats, WordStatus } from '../types/vocabulary';

export class VocabMasterDatabase extends Dexie {
  words!: Table<VocabularyWord, number>;
  phrases!: Table<VocabularyWord, number>;
  prepositions!: Table<VocabularyWord, number>;
  conjunctions!: Table<VocabularyWord, number>;
  grammar!: Table<VocabularyWord, number>;
  userStats!: Table<UserStats, number>;

  constructor() {
    super('VocabMaster5000DB');
    this.version(1).stores({
      words: '++id, word, cefrLevel, partOfSpeech, status, isFavorite, lastReviewedAt, nextReviewAt, createdAt',
      userStats: '++id'
    });
    this.version(2).stores({
      words: '++id, word, cefrLevel, partOfSpeech, status, isFavorite, lastReviewedAt, nextReviewAt, createdAt',
      phrases: '++id, word, cefrLevel, partOfSpeech, status, isFavorite, lastReviewedAt, nextReviewAt, createdAt',
      userStats: '++id'
    });
    this.version(3).stores({
      words: '++id, word, cefrLevel, partOfSpeech, status, isFavorite, lastReviewedAt, nextReviewAt, createdAt',
      phrases: '++id, word, cefrLevel, partOfSpeech, status, isFavorite, lastReviewedAt, nextReviewAt, createdAt',
      prepositions: '++id, word, cefrLevel, partOfSpeech, status, isFavorite, lastReviewedAt, nextReviewAt, createdAt',
      userStats: '++id'
    });
    this.version(4).stores({
      words: '++id, word, cefrLevel, partOfSpeech, status, isFavorite, lastReviewedAt, nextReviewAt, createdAt',
      phrases: '++id, word, cefrLevel, partOfSpeech, status, isFavorite, lastReviewedAt, nextReviewAt, createdAt',
      prepositions: '++id, word, cefrLevel, partOfSpeech, status, isFavorite, lastReviewedAt, nextReviewAt, createdAt',
      grammar: '++id, word, cefrLevel, partOfSpeech, status, isFavorite, lastReviewedAt, nextReviewAt, createdAt',
      userStats: '++id'
    });
    this.version(5).stores({
      words: '++id, word, cefrLevel, partOfSpeech, status, isFavorite, lastReviewedAt, nextReviewAt, createdAt',
      phrases: '++id, word, cefrLevel, partOfSpeech, status, isFavorite, lastReviewedAt, nextReviewAt, createdAt',
      prepositions: '++id, word, cefrLevel, partOfSpeech, status, isFavorite, lastReviewedAt, nextReviewAt, createdAt',
      conjunctions: '++id, word, cefrLevel, partOfSpeech, status, isFavorite, lastReviewedAt, nextReviewAt, createdAt',
      grammar: '++id, word, cefrLevel, partOfSpeech, status, isFavorite, lastReviewedAt, nextReviewAt, createdAt',
      userStats: '++id'
    });
  }
}

export const db = new VocabMasterDatabase();

let initPromise: Promise<void> | null = null;

export async function initializeDatabase(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const count = await db.words.count();
    const c1Count = await db.words.where('cefrLevel').equals('C1').count();
    const firstWord = await db.words.limit(1).first();
    const hasPlaceholderMeaning = firstWord?.meaning?.includes('Essential English vocabulary word') ?? false;
    const DATA_VERSION = 'v4_full_7653_words';
    const currentVersion = localStorage.getItem('vocab_data_version');

    try {
      if (count !== 7653 || c1Count === 0 || hasPlaceholderMeaning || currentVersion !== DATA_VERSION) {
        console.log('Loading / upgrading full authentic Oxford & CEFR vocabulary data (7,653 words)...');
        const response = await fetch('/oxford-5000.json');
        if (response.ok) {
          const realOxfordWords: VocabularyWord[] = await response.json();
          
          // If existing words exist, preserve user's review status / favorites
          const existingWords = count > 0 ? await db.words.toArray() : [];
          const statusMap = new Map<string, { status: WordStatus; isFavorite?: boolean; reviewCount?: number; correctCount?: number; mistakeCount?: number; lastReviewedAt?: number }>();
          existingWords.forEach(w => {
            if (w.status !== 'new' || w.isFavorite) {
              const fullKey = `${w.word.toLowerCase()}_${w.partOfSpeech || ''}_${w.cefrLevel}`;
              const state = {
                status: w.status,
                isFavorite: w.isFavorite,
                reviewCount: w.reviewCount,
                correctCount: w.correctCount,
                mistakeCount: w.mistakeCount,
                lastReviewedAt: w.lastReviewedAt
              };
              statusMap.set(fullKey, state);
              if (!statusMap.has(w.word.toLowerCase())) {
                statusMap.set(w.word.toLowerCase(), state);
              }
            }
          });

          // Load all 7,653 authentic Oxford words directly from oxford-5000.json
          const wordsToLoad: VocabularyWord[] = realOxfordWords.map(w => {
            const fullKey = `${w.word.toLowerCase()}_${w.partOfSpeech || ''}_${w.cefrLevel}`;
            const userState = statusMap.get(fullKey) || statusMap.get(w.word.toLowerCase());
            return {
              ...w,
              status: userState ? userState.status : ('new' as WordStatus),
              isFavorite: userState ? userState.isFavorite : false,
              reviewCount: userState ? userState.reviewCount || 0 : 0,
              correctCount: userState ? userState.correctCount || 0 : 0,
              mistakeCount: userState ? userState.mistakeCount || 0 : 0,
              lastReviewedAt: userState ? userState.lastReviewedAt : undefined
            };
          });

          await db.transaction('rw', db.words, async () => {
            await db.words.clear();
            await db.words.bulkAdd(wordsToLoad);
          });
          localStorage.setItem('vocab_data_version', DATA_VERSION);
          console.log(`Successfully loaded all ${wordsToLoad.length} authentic Oxford & CEFR words!`);
        }
      }

      // Load Oxford Phrases (893 phrases from official Oxford Phrase List)
      const phraseCount = await db.phrases.count();
      const PHRASE_DATA_VERSION = 'v1_full_893_phrases';
      const currentPhraseVersion = localStorage.getItem('vocab_phrase_data_version');

      if (phraseCount < 800 || currentPhraseVersion !== PHRASE_DATA_VERSION) {
        console.log('Loading Oxford Phrase List (893 authentic phrases)...');
        const phraseRes = await fetch('/oxford-phrases.json');
        if (phraseRes.ok) {
          const realPhrases: VocabularyWord[] = await phraseRes.json();
          const existingPhrases = phraseCount > 0 ? await db.phrases.toArray() : [];
          const phraseStatusMap = new Map<string, { status: WordStatus; isFavorite?: boolean }>();
          existingPhrases.forEach(p => {
            if (p.status !== 'new' || p.isFavorite) {
              phraseStatusMap.set(p.word.toLowerCase(), { status: p.status, isFavorite: p.isFavorite });
            }
          });

          const phrasesToLoad: VocabularyWord[] = realPhrases.map(p => {
            const userState = phraseStatusMap.get(p.word.toLowerCase());
            return {
              ...p,
              status: userState ? userState.status : ('new' as WordStatus),
              isFavorite: userState ? userState.isFavorite : false
            };
          });

          await db.transaction('rw', db.phrases, async () => {
            await db.phrases.clear();
            await db.phrases.bulkAdd(phrasesToLoad);
          });
          localStorage.setItem('vocab_phrase_data_version', PHRASE_DATA_VERSION);
          console.log(`Successfully loaded all ${phrasesToLoad.length} authentic Oxford phrases!`);
        }
      }

      // Load English Prepositions (123 essential prepositions across CEFR A1-C1)
      const prepCount = await db.prepositions.count();
      const PREP_DATA_VERSION = 'v1_full_123_prepositions';
      const currentPrepVersion = localStorage.getItem('vocab_prep_data_version');

      if (prepCount < 100 || currentPrepVersion !== PREP_DATA_VERSION) {
        console.log('Loading English Prepositions (123 authentic prepositions)...');
        const prepRes = await fetch('/english-prepositions.json');
        if (prepRes.ok) {
          const realPrepositions: VocabularyWord[] = await prepRes.json();
          const existingPreps = prepCount > 0 ? await db.prepositions.toArray() : [];
          const prepStatusMap = new Map<string, { status: WordStatus; isFavorite?: boolean }>();
          existingPreps.forEach(p => {
            if (p.status !== 'new' || p.isFavorite) {
              prepStatusMap.set(p.word.toLowerCase(), { status: p.status, isFavorite: p.isFavorite });
            }
          });

          const prepsToLoad: VocabularyWord[] = realPrepositions.map(p => {
            const userState = prepStatusMap.get(p.word.toLowerCase());
            return {
              ...p,
              status: userState ? userState.status : ('new' as WordStatus),
              isFavorite: userState ? userState.isFavorite : false
            };
          });

          await db.transaction('rw', db.prepositions, async () => {
            await db.prepositions.clear();
            await db.prepositions.bulkAdd(prepsToLoad);
          });
          localStorage.setItem('vocab_prep_data_version', PREP_DATA_VERSION);
          console.log(`Successfully loaded all ${prepsToLoad.length} authentic English prepositions!`);
        }
      }

      // Load English Grammar (105 essential grammar topics across CEFR A1-C1)
      const grammarCount = await db.grammar.count();
      const GRAMMAR_DATA_VERSION = 'v1_full_105_grammar_topics';
      const currentGrammarVersion = localStorage.getItem('vocab_grammar_data_version');

      if (grammarCount < 100 || currentGrammarVersion !== GRAMMAR_DATA_VERSION) {
        console.log('Loading English Grammar (105 authentic topics & rules)...');
        const grammarRes = await fetch('/english-grammar.json');
        if (grammarRes.ok) {
          const realGrammar: VocabularyWord[] = await grammarRes.json();
          const existingGrammar = grammarCount > 0 ? await db.grammar.toArray() : [];
          const grammarStatusMap = new Map<string, { status: WordStatus; isFavorite?: boolean }>();
          existingGrammar.forEach(g => {
            if (g.status !== 'new' || g.isFavorite) {
              grammarStatusMap.set(g.word.toLowerCase(), { status: g.status, isFavorite: g.isFavorite });
            }
          });

          const grammarToLoad: VocabularyWord[] = realGrammar.map(g => {
            const userState = grammarStatusMap.get(g.word.toLowerCase());
            return {
              ...g,
              status: userState ? userState.status : ('new' as WordStatus),
              isFavorite: userState ? userState.isFavorite : false
            };
          });

          await db.transaction('rw', db.grammar, async () => {
            await db.grammar.clear();
            await db.grammar.bulkAdd(grammarToLoad);
          });
          localStorage.setItem('vocab_grammar_data_version', GRAMMAR_DATA_VERSION);
          console.log(`Successfully loaded all ${grammarToLoad.length} authentic English grammar topics!`);
        }
      }

      // Load English Conjunctions (88 essential conjunctions across CEFR A1-C1)
      const conjCount = await db.conjunctions.count();
      const CONJ_DATA_VERSION = 'v1_full_88_conjunctions';
      const currentConjVersion = localStorage.getItem('vocab_conj_data_version');

      if (conjCount < 80 || currentConjVersion !== CONJ_DATA_VERSION) {
        console.log('Loading English Conjunctions (88 authentic conjunctions)...');
        const conjRes = await fetch('/english-conjunctions.json');
        if (conjRes.ok) {
          const realConjunctions: VocabularyWord[] = await conjRes.json();
          const existingConjs = conjCount > 0 ? await db.conjunctions.toArray() : [];
          const conjStatusMap = new Map<string, { status: WordStatus; isFavorite?: boolean }>();
          existingConjs.forEach(c => {
            if (c.status !== 'new' || c.isFavorite) {
              conjStatusMap.set(c.word.toLowerCase(), { status: c.status, isFavorite: c.isFavorite });
            }
          });

          const conjsToLoad: VocabularyWord[] = realConjunctions.map(c => {
            const userState = conjStatusMap.get(c.word.toLowerCase());
            return {
              ...c,
              status: userState ? userState.status : ('new' as WordStatus),
              isFavorite: userState ? userState.isFavorite : false
            };
          });

          await db.transaction('rw', db.conjunctions, async () => {
            await db.conjunctions.clear();
            await db.conjunctions.bulkAdd(conjsToLoad);
          });
          localStorage.setItem('vocab_conj_data_version', CONJ_DATA_VERSION);
          console.log(`Successfully loaded all ${conjsToLoad.length} authentic English conjunctions!`);
        }
      }

      const statsCount = await db.userStats.count();
      if (statsCount === 0) {
        const today = new Date().toISOString().split('T')[0];
        await db.userStats.add({
          dailyGoal: 50,
          todayReviewedCount: 0,
          lastActiveDate: today,
          streakDays: 1,
          darkMode: false,
          speechSpeed: 1.0,
          autoPlayInterval: 3,
          hasSeenOnboarding: false
        });
      }
    } catch (err) {
      console.warn('Could not auto-fetch vocabulary data:', err);
    }
  })();
  return initPromise;
}

export async function resetToAuthenticOxfordData(): Promise<number> {
  await db.words.clear();
  const response = await fetch('/oxford-5000.json');
  if (!response.ok) throw new Error('Could not fetch Oxford 5000 dataset');
  const realOxfordWords: VocabularyWord[] = await response.json();
  const cleanWords = realOxfordWords.map(w => ({
    ...w,
    status: 'new' as WordStatus,
    reviewCount: 0,
    correctCount: 0,
    mistakeCount: 0
  }));
  await db.words.bulkAdd(cleanWords);

  // Reset user stats to 0
  const statsList = await db.userStats.toArray();
  if (statsList.length > 0) {
    await db.userStats.update(statsList[0].id!, {
      todayReviewedCount: 0,
      streakDays: 1
    });
  }

  return cleanWords.length;
}

export async function updateWordStatus(
  wordId: number, 
  newStatus: WordStatus, 
  wasCorrect?: boolean
): Promise<void> {
  let targetTable = db.words;
  let word = await db.words.get(wordId);
  if (!word) {
    word = await db.phrases.get(wordId);
    targetTable = db.phrases;
  }
  if (!word) {
    word = await db.prepositions.get(wordId);
    targetTable = db.prepositions;
  }
  if (!word) {
    word = await db.conjunctions.get(wordId);
    targetTable = db.conjunctions;
  }
  if (!word) {
    word = await db.grammar.get(wordId);
    targetTable = db.grammar;
  }
  if (!word) return;

  const now = Date.now();
  const currentReviews = (word.reviewCount || 0) + 1;
  const isCorrect = wasCorrect !== undefined ? wasCorrect : (newStatus === 'known');
  const currentCorrect = (word.correctCount || 0) + (isCorrect ? 1 : 0);
  const currentMistakes = (word.mistakeCount || 0) + (isCorrect ? 0 : 1);

  // Simple spaced repetition interval calculation
  let intervalDays = 1;
  if (newStatus === 'known') {
    intervalDays = Math.min(30, (word.intervalDays || 1) * 2 + 1);
  } else if (newStatus === 'understand') {
    intervalDays = Math.max(1, Math.floor((word.intervalDays || 1) * 1.2));
  } else {
    intervalDays = 1; // new or forgotten
  }

  const nextReviewAt = now + intervalDays * 24 * 60 * 60 * 1000;

  await targetTable.update(wordId, {
    status: newStatus,
    lastReviewedAt: now,
    nextReviewAt,
    intervalDays,
    reviewCount: currentReviews,
    correctCount: currentCorrect,
    mistakeCount: currentMistakes
  });

  // Update daily review count in userStats
  await recordReviewProgress();
}

export async function toggleFavorite(wordId: number): Promise<boolean> {
  let targetTable = db.words;
  let word = await db.words.get(wordId);
  if (!word) {
    word = await db.phrases.get(wordId);
    targetTable = db.phrases;
  }
  if (!word) {
    word = await db.prepositions.get(wordId);
    targetTable = db.prepositions;
  }
  if (!word) {
    word = await db.conjunctions.get(wordId);
    targetTable = db.conjunctions;
  }
  if (!word) {
    word = await db.grammar.get(wordId);
    targetTable = db.grammar;
  }
  if (!word) return false;
  const newFav = !word.isFavorite;
  await targetTable.update(wordId, { isFavorite: newFav });
  return newFav;
}

export async function recordReviewProgress(): Promise<void> {
  const statsList = await db.userStats.toArray();
  const today = new Date().toISOString().split('T')[0];

  if (statsList.length > 0) {
    const stats = statsList[0];
    let newReviewedCount = stats.todayReviewedCount + 1;
    let newStreak = stats.streakDays;

    if (stats.lastActiveDate !== today) {
      // Check if yesterday or gap
      const lastDate = new Date(stats.lastActiveDate);
      const currDate = new Date(today);
      const diffDays = Math.round((currDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
      newReviewedCount = 1;
    }

    await db.userStats.update(stats.id!, {
      todayReviewedCount: newReviewedCount,
      lastActiveDate: today,
      streakDays: newStreak
    });
  }
}

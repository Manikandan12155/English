export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type WordStatus = 'new' | 'understand' | 'known';

export type LearningTrack = 'vocabulary' | 'phrases' | 'prepositions' | 'conjunctions' | 'grammar';

export type PartOfSpeech = 
  | 'noun' 
  | 'verb' 
  | 'adjective' 
  | 'adverb' 
  | 'preposition' 
  | 'conjunction' 
  | 'pronoun' 
  | 'idiom' 
  | 'phrase'
  | 'phrasal verb'
  | 'prepositional phrase'
  | 'grammar'
  | 'other';

export interface VocabularyWord {
  id?: number;
  word: string;
  meaning: string;
  cefrLevel: CEFRLevel;
  partOfSpeech: PartOfSpeech;
  pronunciation?: string; // phonetic e.g. /rɪˈlaɪəbl/
  exampleSentence?: string;
  exampleSentences?: string[]; // multiple examples
  simpleMeaning?: string;
  relatedWords?: string[];
  notes?: string;
  status: WordStatus;
  isFavorite?: boolean;
  createdAt: number;
  lastReviewedAt?: number;
  reviewCount?: number;
  correctCount?: number;
  mistakeCount?: number;
  nextReviewAt?: number; // timestamp for spaced repetition Leitner box
  intervalDays?: number; // spaced repetition interval
  easeFactor?: number;
}

export interface UserStats {
  id?: number;
  dailyGoal: number; // e.g. 50 words
  todayReviewedCount: number;
  lastActiveDate: string; // YYYY-MM-DD
  streakDays: number;
  darkMode: boolean;
  speechSpeed: number; // 0.75, 1, 1.25, 1.5
  autoPlayInterval: number; // seconds
  hasSeenOnboarding: boolean;
  activeTrack?: LearningTrack;
}

export type ViewScreen = 
  | 'portal'
  | 'dashboard' 
  | 'learn' 
  | 'wordlist' 
  | 'review' 
  | 'quiz' 
  | 'stats' 
  | 'settings';

export interface FilterOptions {
  searchQuery: string;
  levels: CEFRLevel[];
  statuses: WordStatus[];
  partsOfSpeech: string[];
  favoritesOnly: boolean;
  sortBy: 'default' | 'alphaAsc' | 'alphaDesc' | 'level' | 'recent' | 'reviewCount';
}

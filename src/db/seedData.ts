import { VocabularyWord } from '../types/vocabulary';

// Authentic Oxford 5000 dataset is stored in /public/oxford-5000.json
// Mock seed data has been removed completely.
export const INITIAL_VOCABULARY: Omit<VocabularyWord, 'id'>[] = [];

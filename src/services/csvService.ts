import { VocabularyWord, CEFRLevel, PartOfSpeech, WordStatus } from '../types/vocabulary';

export interface ImportResult {
  added: number;
  skipped: number;
  errors: string[];
}

export function exportWordsToCSV(words: VocabularyWord[]): void {
  const headers = ['Word', 'Meaning', 'CEFR Level', 'Part of Speech', 'Pronunciation', 'Example Sentence', 'Status'];
  const rows = words.map(w => [
    `"${(w.word || '').replace(/"/g, '""')}"`,
    `"${(w.meaning || '').replace(/"/g, '""')}"`,
    `"${w.cefrLevel || 'A1'}"`,
    `"${w.partOfSpeech || 'noun'}"`,
    `"${(w.pronunciation || '').replace(/"/g, '""')}"`,
    `"${(w.exampleSentence || '').replace(/"/g, '""')}"`,
    `"${w.status || 'new'}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `vocabmaster_words_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map(h => h.toLowerCase());
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

export function processImportRows(
  headers: string[], 
  rows: string[][], 
  existingWords: VocabularyWord[]
): { validWords: Omit<VocabularyWord, 'id'>[]; result: ImportResult } {
  const wordIdx = headers.findIndex(h => h.includes('word'));
  const meaningIdx = headers.findIndex(h => h.includes('meaning') || h.includes('definition'));
  const levelIdx = headers.findIndex(h => h.includes('level') || h.includes('cefr'));
  const posIdx = headers.findIndex(h => h.includes('pos') || h.includes('part') || h.includes('type'));
  const pronIdx = headers.findIndex(h => h.includes('pronunciation') || h.includes('phonetic') || h.includes('ipa'));
  const exampleIdx = headers.findIndex(h => h.includes('example') || h.includes('sentence'));
  const statusIdx = headers.findIndex(h => h.includes('status'));

  const existingSet = new Set(existingWords.map(w => w.word.toLowerCase().trim()));
  const validWords: Omit<VocabularyWord, 'id'>[] = [];
  let skipped = 0;
  const errors: string[] = [];

  rows.forEach((row, idx) => {
    const wordText = wordIdx !== -1 ? row[wordIdx]?.trim() : row[0]?.trim();
    if (!wordText) {
      skipped++;
      return;
    }

    if (existingSet.has(wordText.toLowerCase())) {
      skipped++;
      return;
    }

    const meaning = meaningIdx !== -1 ? row[meaningIdx]?.trim() : (row[1]?.trim() || 'No definition available');
    let level: CEFRLevel = 'A1';
    const rawLevel = (levelIdx !== -1 ? row[levelIdx]?.trim().toUpperCase() : '') as CEFRLevel;
    if (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(rawLevel)) {
      level = rawLevel;
    }

    let pos: PartOfSpeech = 'noun';
    const rawPos = (posIdx !== -1 ? row[posIdx]?.trim().toLowerCase() : '') as PartOfSpeech;
    if (['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun', 'other'].includes(rawPos)) {
      pos = rawPos;
    }

    let status: WordStatus = 'new';
    const rawStatus = (statusIdx !== -1 ? row[statusIdx]?.trim().toLowerCase() : '') as WordStatus;
    if (['new', 'understand', 'known'].includes(rawStatus)) {
      status = rawStatus;
    }

    const pronunciation = pronIdx !== -1 ? row[pronIdx]?.trim() : undefined;
    const example = exampleIdx !== -1 ? row[exampleIdx]?.trim() : undefined;

    existingSet.add(wordText.toLowerCase());
    validWords.push({
      word: wordText,
      meaning: meaning || 'Definition not provided',
      cefrLevel: level,
      partOfSpeech: pos,
      pronunciation,
      exampleSentence: example,
      exampleSentences: example ? [example] : [],
      status,
      createdAt: Date.now(),
      reviewCount: 0,
      correctCount: 0,
      mistakeCount: 0
    });
  });

  return {
    validWords,
    result: {
      added: validWords.length,
      skipped,
      errors
    }
  };
}

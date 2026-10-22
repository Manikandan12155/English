import * as pdfjsLib from 'pdfjs-dist';
import { VocabularyWord, CEFRLevel, PartOfSpeech } from '../types/vocabulary';

// Set up worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export async function extractTextFromPDF(
  file: File, 
  onProgress?: (progress: number) => void
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  let fullText = '';

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str || '');
    fullText += strings.join(' ') + '\n';
    if (onProgress) {
      onProgress(Math.round((pageNum / numPages) * 100));
    }
  }

  return fullText;
}

/**
 * Fast offline parser for standard Oxford Wordlist format PDFs.
 * Oxford PDFs typically have patterns like:
 * "abandon v. B2"
 * "ability n. A2"
 * "able adj. A1"
 */
export function parseOxfordWordlistText(text: string): Omit<VocabularyWord, 'id'>[] {
  const words: Omit<VocabularyWord, 'id'>[] = [];
  const seen = new Set<string>();

  // Pattern matching: word pos level
  // e.g. "abandon v. B2" or "ability n. A2" or "about prep., adv. A1"
  const regex = /\b([a-zA-Z\-'\s]+?)\s+(v\.|n\.|adj\.|adv\.|prep\.|conj\.|pron\.|det\.)\s+(A1|A2|B1|B2|C1|C2)\b/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const rawWord = match[1].trim().toLowerCase();
    const rawPos = match[2].trim().toLowerCase();
    const rawLevel = match[3].trim().toUpperCase() as CEFRLevel;

    if (!rawWord || rawWord.length < 2 || seen.has(rawWord)) continue;
    seen.add(rawWord);

    let pos: PartOfSpeech = 'noun';
    if (rawPos.startsWith('v')) pos = 'verb';
    else if (rawPos.startsWith('adj')) pos = 'adjective';
    else if (rawPos.startsWith('adv')) pos = 'adverb';
    else if (rawPos.startsWith('prep')) pos = 'preposition';
    else if (rawPos.startsWith('conj')) pos = 'conjunction';

    words.push({
      word: rawWord,
      meaning: `Essential Oxford English vocabulary (${rawPos}).`,
      cefrLevel: rawLevel,
      partOfSpeech: pos,
      status: 'new',
      createdAt: Date.now(),
      reviewCount: 0,
      correctCount: 0,
      mistakeCount: 0
    });
  }

  return words;
}

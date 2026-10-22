# Build VocabMaster 5000 — Production-Ready Vocabulary Learning PWA

Act as a senior frontend engineer and UI/UX designer. Build a fully functional, responsive vocabulary-learning application inspired by the provided VocabMaster 5000 design reference.

## Technology
- React + TypeScript + Vite
- Tailwind CSS
- Lucide React icons
- IndexedDB using Dexie.js for persistent local data
- Browser SpeechSynthesis for pronunciation
- PWA support for mobile installation and offline usage

## Core requirements

### 1. Dashboard
- Display total vocabulary words, Known, Understand, and New counts.
- Show progress percentage and CEFR level distribution: A1, A2, B1, B2.
- Provide Continue Learning, Review Unknown, and All Words actions.
- Make the dashboard clean, premium, responsive, and mobile-first.

### 2. Vocabulary Study Mode
- Display one word prominently with its CEFR level, part of speech, meaning, pronunciation, and example sentence.
- Provide three large status buttons:
  - Known — green
  - Understand — amber
  - New — red
- Save the selected status immediately.
- Automatically move to the next word after a selection, with an undo option.
- Support Previous, Next, Skip, Pause, Resume, and Auto-play.
- Add keyboard shortcuts: 1 = Known, 2 = Understand, 3 = New, Space = Pause/Resume, ArrowRight = Next.
- Allow meanings and examples to be hidden until requested.

### 3. Word List
- Show all imported vocabulary in a fast, scrollable list or virtualized table.
- Include search, pagination or virtualization, bulk status changes, and individual status editing.
- Filter by Known, Understand, New, A1, A2, B1, B2, and part of speech.
- Allow multiple filters simultaneously.
- Include sorting by alphabetical order, CEFR level, and recently updated.
- Display word, short meaning, level, and current status.
- Allow CSV import and export.

### 4. Review Mode
- Review only New words, only Understand words, or all words.
- Provide randomized review and a weak-word review queue.
- Allow users to hide the meaning, recall it, and reveal the answer.
- Store review timestamps and correctness history.
- Use simple spaced-repetition scheduling, without requiring an AI API.

### 5. Data and persistence
- Create a vocabulary data model containing id, word, meaning, CEFR level, part of speech, pronunciation, example sentence, status, and lastReviewedAt.
- Use IndexedDB for local persistence.
- Default imported words to New unless a status is provided.
- Persist status changes immediately and retain progress after reloads.
- Include a CSV importer with column validation, duplicate detection, and import summary.
- Add a starter dataset for demonstration, but do not claim that sample words are the complete 5,000-word dataset.

### 6. Design
- Follow the provided VocabMaster 5000 design reference.
- Use a polished blue/purple theme, clear typography, rounded cards, subtle shadows, and accessible contrast.
- On mobile, show bottom navigation and large touch-friendly status buttons.
- On desktop, use a left sidebar and a wider learning area.
- Provide light and dark themes.
- Add loading, empty, error, and success states.

### 7. Performance and quality
- Use list virtualization for thousands of words.
- Avoid unnecessary API calls and external dependencies.
- Make search and filtering fast.
- Ensure the app works without a backend or API key.
- Include a README with setup, CSV format, and build instructions.

## Development instructions
First inspect the existing project and preserve any working configuration. Then implement the complete MVP, run the build, fix TypeScript and runtime errors, and verify the core workflows. Do not stop after generating a mockup. Prioritize a working application over unnecessary animations or complex features.
# VocabMaster 5000 — Vocabulary Learning PWA

VocabMaster 5000 is a modern, responsive, offline-ready English vocabulary learning Progressive Web Application (PWA). It covers CEFR levels A1 through B2 with smart categorization, audio pronunciation, and spaced repetition revision.

## ✨ Key Features

1. **Dashboard**:
   - Circular mastery gauge and progress tracker.
   - CEFR level distribution pills (A1, A2, B1, B2).
   - Word status counts (Known, Understand, New).
   - Quick action shortcuts (Continue, Review, Audio Mode, Quiz).

2. **Study Mode**:
   - Prominent word display with phonetic pronunciation and audio playback.
   - Part of speech, CEFR badge, full definition, and contextual example sentences.
   - 3 Large status action buttons: **Known** (Green), **Understand** (Amber), **New** (Red).
   - Active recall mode (hide/reveal meaning & example).
   - Keyboard shortcuts: `1` = Known, `2` = Understand, `3` = New, `Space` = Auto-play, `→` = Next, `←` = Prev, `S` = Speak.

3. **Immersive Audio / Auto-Play Mode**:
   - Ambient dark focus mode for hands-free listening and repetition.
   - Configurable auto-advance delay (2s, 3s, 5s, 7s).
   - Speech speed selector (0.75x, 1.0x, 1.25x, 1.5x).

4. **Word List & Data Management**:
   - Fast search and multi-criteria filters (Level, Status, Part of Speech, Favorites).
   - Multi-select with bulk actions (Mark Known, Mark Understand, Mark New, Delete).
   - Add custom vocabulary entries or edit existing words.
   - Export vocabulary to CSV.
   - Import CSV with column validation and duplicate detection.

5. **Review & Quiz Modes**:
   - Filtered queues: New Words Only, Understand Only, Known Words, All Words.
   - Smart review: Weak Words Queue, Spaced Repetition (SRS), Random Mix.
   - Interactive multiple-choice Quiz Mode with score tracking.

6. **Progress & Statistics**:
   - Interactive status breakdown donut chart.
   - Progress by CEFR level (A1, A2, B1, B2).
   - Daily goal tracker with confetti celebration.

7. **Offline PWA & Local Storage**:
   - Persistent client-side storage using IndexedDB via Dexie.js.
   - Zero external API keys or server backends required.
   - Native Web Speech API integration.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Database**: IndexedDB (Dexie.js)
- **Audio**: Web SpeechSynthesis API
- **Icons**: Lucide React
- **PWA**: vite-plugin-pwa

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Locally in Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production
```bash
npm run build
```

---

## 📄 CSV Format for Import

When importing vocabulary via CSV, ensure your CSV includes the following headers (case-insensitive):

| Column Header | Required | Example |
| :--- | :--- | :--- |
| `Word` | Yes | `reliable` |
| `Meaning` | Yes | `Consistently good in quality or performance` |
| `CEFR Level` | Optional (default A1) | `A2` (A1, A2, B1, or B2) |
| `Part of Speech` | Optional (default noun) | `adjective`, `verb`, `noun`, etc. |
| `Pronunciation` | Optional | `/rɪˈlaɪəbl/` |
| `Example Sentence` | Optional | `He is a reliable friend.` |
| `Status` | Optional (default new) | `new`, `understand`, or `known` |

Example CSV row:
```csv
Word,Meaning,CEFR Level,Part of Speech,Pronunciation,Example Sentence,Status
reliable,"Can be trusted or depended on",A2,adjective,/rɪˈlaɪəbl/,"He is a reliable team member.",understand
```

import pypdf
import json
import re

def parse_oxford_phrases():
    reader = pypdf.PdfReader('oxford-phrase-list.pdf')
    raw_lines = []
    
    for page in reader.pages:
        txt = page.extract_text()
        for line in txt.split('\n'):
            line = line.strip()
            if line:
                raw_lines.append(line)
                
    phrases = []
    current_level = 'A1'
    
    skip_substrings = [
        'Oxford University Press',
        'The Oxford Phrase List',
        'A1 to C1 level',
        'common fixed phrases',
        'collocations',
        'prepositional phrases',
        'verbs, compounds'
    ]
    
    common_phrase_meanings = {
        'a few': 'a small number of people or things',
        'a good idea': 'a sensible or beneficial suggestion or plan',
        'agree with sb': 'to have the same opinion as somebody else',
        'a little': 'a small amount or quantity',
        'a lot': 'a large number or amount; very much',
        'all day': 'during the entire day from morning to night',
        'all over the world': 'in every place or country across the globe',
        'ask for sth': 'to request something from someone',
        'at home': 'in one\'s house or residence; comfortable',
        'at the moment': 'now; at the present time',
        'at the same time': 'simultaneously; however, on the other hand',
        'best friend': 'the person one is closest to and trusts most',
        'cell phone': 'a portable mobile telephone',
        'take advantage of': 'to make good use of an opportunity or manipulate someone',
        'take care of': 'to look after or care for someone or something',
        'look forward to': 'to feel excited about something in the future',
        'pay attention': 'to listen or watch carefully',
        'make sense': 'to be logical, understandable, or sensible',
        'as a result': 'because of something that happened earlier; consequently',
        'in addition': 'used to add another point to what has already been said',
        'on the other hand': 'from another point of view (used to contrast points)',
        'due to': 'caused by; because of',
        'in front of': 'close to the front part of something or someone',
        'give up': 'to stop trying to do something or stop a habit',
        'find out': 'to discover a fact or piece of information',
        'figure out': 'to understand or solve something through thought'
    }
    
    for line in raw_lines:
        line_clean = (
            line.replace('\u2019', "'")
                .replace('\u2018', "'")
                .replace('\u2026', '...')
                .replace('\ufffd', "'")
                .replace('™', '')
                .replace('©', '')
                .strip()
        )
        
        if any(s.lower() in line_clean.lower() for s in skip_substrings):
            continue
            
        if line_clean in ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']:
            current_level = line_clean
            continue
            
        # Check if line is an example sentence or punctuation-heavy exclamation
        is_example = (
            line_clean.endswith('.') or 
            line_clean.endswith('!') or 
            line_clean.startswith("It's ") or 
            line_clean.startswith("That's ") or
            line_clean.startswith("Tell me ") or 
            line_clean.startswith("He ") or 
            line_clean.startswith("She ") or
            line_clean.startswith("They ") or
            line_clean.startswith("Good idea")
        )
        
        phrase_word = line_clean.replace('...', '').strip()
        
        if is_example and len(phrases) > 0:
            if not phrases[-1].get('exampleSentence'):
                phrases[-1]['exampleSentence'] = line_clean
            if 'exampleSentences' not in phrases[-1]:
                phrases[-1]['exampleSentences'] = []
            phrases[-1]['exampleSentences'].append(line_clean)
        elif phrase_word and len(phrase_word) > 1:
            meaning = common_phrase_meanings.get(
                phrase_word.lower(), 
                f"Common {current_level} English expression"
            )
            
            # Categorize phrase part of speech
            pos = 'phrase'
            if any(phrase_word.lower().startswith(v) for v in ['take ', 'get ', 'make ', 'come ', 'go ', 'look ', 'put ', 'turn ', 'give ', 'keep ']):
                pos = 'phrasal verb'
            elif any(phrase_word.lower().startswith(p) for p in ['at ', 'in ', 'on ', 'by ', 'for ', 'with ', 'under ', 'as ']):
                pos = 'prepositional phrase'
            elif any(phrase_word.lower().startswith(c) for c in ['and ', 'or ', 'but ', 'either ', 'neither ']):
                pos = 'conjunction'
                
            phrases.append({
                'id': f'phrase_{len(phrases)+1}',
                'word': phrase_word,
                'meaning': meaning,
                'cefrLevel': current_level,
                'partOfSpeech': pos,
                'pronunciation': f'/{phrase_word}/',
                'exampleSentence': None,
                'exampleSentences': [],
                'status': 'new',
                'createdAt': 1700000000000 + len(phrases),
                'reviewCount': 0,
                'correctCount': 0,
                'mistakeCount': 0
            })
            
    print(f"Total authentic phrases parsed: {len(phrases)}")
    level_counts = {}
    for p in phrases:
        lvl = p['cefrLevel']
        level_counts[lvl] = level_counts.get(lvl, 0) + 1
    print("CEFR Level Breakdown:", level_counts)
    
    with open('public/oxford-phrases.json', 'w', encoding='utf-8') as f:
        json.dump(phrases, f, indent=2, ensure_ascii=False)
    print("Successfully wrote public/oxford-phrases.json")

if __name__ == '__main__':
    parse_oxford_phrases()

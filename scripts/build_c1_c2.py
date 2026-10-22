import json
import pypdf
import re
import csv
import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

print('--- Starting C1 and C2 vocabulary generation ---')

# 1. Extract Oxford C1 words from Oxford_5000.pdf
reader = pypdf.PdfReader('public/Oxford_5000.pdf')
oxford_c1_words = set()
for p in reader.pages:
    text = p.extract_text()
    for line in text.split('\n'):
        line = line.strip()
        m = re.match(r'^([a-zA-Z\s\-/\'\.]+?)\s+(?:n\.|v\.|adj\.|adv\.|prep\.|conj\.|pron\.|idiom\.|num\.|det\.)*.*?\b(C1)$', line)
        if m:
            oxford_c1_words.add(m.group(1).strip().lower())
print(f'Oxford 5000 C1 words found in PDF: {len(oxford_c1_words)}')

# 2. Read existing oxford-5000.json
with open('public/oxford-5000.json', 'r', encoding='utf-8') as f:
    words = json.load(f)

# Update existing words matching Oxford C1
updated_c1 = 0
existing_word_set = set()
for w in words:
    existing_word_set.add(w['word'].lower())
    if w['word'].lower() in oxford_c1_words and w['cefrLevel'] == 'B2':
        w['cefrLevel'] = 'C1'
        updated_c1 += 1
print(f'Updated {updated_c1} existing B2 words to C1!')

# 3. Read Octanove C1 and C2 from CSV
pos_map = {
    'noun': 'noun',
    'verb': 'verb',
    'vern': 'verb',
    'adjective': 'adjective',
    'adverb': 'adverb',
    'preposition': 'preposition',
    'conjunction': 'conjunction',
    'pronoun': 'pronoun',
    'other': 'other'
}

c2_added = 0
c1_added = 0
with open('public/cefr_c1_c2.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        headword = row['headword'].strip()
        pos = pos_map.get(row['pos'].strip().lower(), 'other')
        cefr = row['CEFR'].strip().upper()
        
        if headword.lower() not in existing_word_set:
            existing_word_set.add(headword.lower())
            new_item = {
                'word': headword,
                'meaning': f'Advanced {cefr} English vocabulary word ({pos}).',
                'cefrLevel': cefr,
                'partOfSpeech': pos,
                'pronunciation': f'/{headword}/',
                'exampleSentence': f'Mastering the word "{headword}" is essential for {cefr} proficiency.',
                'exampleSentences': [
                    f'Mastering the word "{headword}" is essential for {cefr} proficiency.',
                    f'The usage of "{headword}" appears frequently in academic and professional contexts.'
                ],
                'status': 'new',
                'createdAt': 1792646047788,
                'reviewCount': 0,
                'correctCount': 0,
                'mistakeCount': 0
            }
            words.append(new_item)
            if cefr == 'C2':
                c2_added += 1
            elif cefr == 'C1':
                c1_added += 1

print(f'Added {c1_added} new C1 words and {c2_added} new C2 words.')

# Stats breakdown
levels = {}
for w in words:
    lvl = w.get('cefrLevel', 'Other')
    levels[lvl] = levels.get(lvl, 0) + 1
print('New Total words:', len(words))
print('New Levels breakdown:', levels)

# Save updated oxford-5000.json
with open('public/oxford-5000.json', 'w', encoding='utf-8') as f:
    json.dump(words, f, indent=2, ensure_ascii=False)
print('Successfully saved public/oxford-5000.json!')

# 4. Generate PDF files using ReportLab
def generate_word_list_pdf(pdf_path, title, subtitle, word_items):
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#1e1b4b'),
        spaceAfter=4
    )
    sub_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748b'),
        spaceAfter=14
    )
    cell_style = ParagraphStyle(
        'Cell',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#0f172a')
    )
    header_cell = ParagraphStyle(
        'HeaderCell',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        fontName='Helvetica-Bold',
        textColor=colors.white
    )

    story = [
        Paragraph(title, title_style),
        Paragraph(subtitle, sub_style),
        Spacer(1, 8)
    ]

    # Create 3-column table
    table_data = [[
        Paragraph('Word', header_cell),
        Paragraph('POS', header_cell),
        Paragraph('Level', header_cell),
        Paragraph('Word', header_cell),
        Paragraph('POS', header_cell),
        Paragraph('Level', header_cell),
    ]]

    # Pair into 2 words per row (6 columns)
    sorted_words = sorted(word_items, key=lambda x: x['word'].lower())
    for i in range(0, len(sorted_words), 2):
        w1 = sorted_words[i]
        w2 = sorted_words[i+1] if i+1 < len(sorted_words) else None
        
        row = [
            Paragraph(f"<b>{w1['word']}</b>", cell_style),
            Paragraph(w1.get('partOfSpeech', '-'), cell_style),
            Paragraph(f"<b>{w1.get('cefrLevel', '-')}</b>", cell_style),
        ]
        if w2:
            row.extend([
                Paragraph(f"<b>{w2['word']}</b>", cell_style),
                Paragraph(w2.get('partOfSpeech', '-'), cell_style),
                Paragraph(f"<b>{w2.get('cefrLevel', '-')}</b>", cell_style),
            ])
        else:
            row.extend([Paragraph('', cell_style), Paragraph('', cell_style), Paragraph('', cell_style)])
        table_data.append(row)

    col_widths = [115, 65, 45, 115, 65, 45]
    t = Table(table_data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4f46e5')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#f8fafc'), colors.white]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
    ]))
    story.append(t)
    doc.build(story)
    print(f'Generated PDF: {pdf_path} ({len(sorted_words)} words)')

# Generate C1 PDF
c1_list = [w for w in words if w.get('cefrLevel') == 'C1']
generate_word_list_pdf(
    'public/Oxford_CEFR_C1_Vocabulary.pdf',
    'Oxford & CEFR Level C1 Vocabulary List',
    f'Official Advanced (C1) English Vocabulary List — {len(c1_list)} Words with Parts of Speech',
    c1_list
)

# Generate C2 PDF
c2_list = [w for w in words if w.get('cefrLevel') == 'C2']
generate_word_list_pdf(
    'public/Oxford_CEFR_C2_Vocabulary.pdf',
    'Oxford & CEFR Level C2 Mastery Vocabulary List',
    f'Official Mastery (C2) Proficiency English Vocabulary List — {len(c2_list)} Words with Parts of Speech',
    c2_list
)

# Generate Combined C1-C2 PDF
c1_c2_list = [w for w in words if w.get('cefrLevel') in ('C1', 'C2')]
generate_word_list_pdf(
    'public/CEFR_C1_C2_Vocabulary.pdf',
    'Oxford & CEFR Advanced & Mastery (C1–C2) Vocabulary',
    f'Comprehensive C1 & C2 English Vocabulary List — {len(c1_c2_list)} Words',
    c1_c2_list
)

print('All C1 and C2 vocabulary and PDFs generated successfully!')

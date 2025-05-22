import json
import re
import spacy

# Load spaCy English model (đã tải về)
nlp = spacy.load('en_core_web_sm')

# criteria: list các dict, ví dụ: [{"type": "contains", "phrase": "climate change"}, {"type": "min_words", "count": 150}]
def grade_essay(content, criteria_json):
    reasons = []
    score = 1.0
    try:
        criteria = json.loads(criteria_json)
    except:
        return 0, ["Lỗi tiêu chí"]
    doc = nlp(content)
    word_count = len([t for t in doc if t.is_alpha])
    for c in criteria:
        if c.get('type') == 'contains':
            phrase = c.get('phrase', '').lower()
            if phrase not in content.lower():
                score -= 0.5
                reasons.append(f"Thiếu cụm từ '{phrase}'")
        elif c.get('type') == 'min_words':
            min_words = int(c.get('count', 0))
            if word_count < min_words:
                score -= 0.5
                reasons.append(f"Độ dài < {min_words} từ")
        elif c.get('type') == 'has_calculation':
            if not re.search(r'\d+\s*[+\-*/]\s*\d+', content):
                score -= 0.5
                reasons.append("Không có phép tính")
    score = max(0, min(1, score))
    return score * 10, reasons 
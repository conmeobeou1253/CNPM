import json
import re
import spacy

# Load spaCy English model (đã tải về)
nlp = spacy.load('en_core_web_sm')

# criteria: list các dict, ví dụ: [{"type": "contains", "phrase": "climate change", "deduct": 2}, {"type": "min_words", "count": 150, "deduct": 1.5}]
def grade_essay(content, criteria_json):
    reasons = []
    score = 10.0  # điểm tối đa
    try:
        criteria = json.loads(criteria_json)
    except:
        return 0, ["Lỗi tiêu chí"]
    doc = nlp(content)
    word_count = len([t for t in doc if t.is_alpha])
    for c in criteria:
        deduct = float(c.get('deduct', 0.5))
        if c.get('type') == 'contains':
            phrase = c.get('phrase', '').lower()
            if phrase and phrase not in content.lower():
                score -= deduct
                reasons.append(f"Thiếu cụm từ '{phrase}' (-{deduct} điểm)")
        elif c.get('type') == 'min_words':
            min_words = int(c.get('count', 0))
            if word_count < min_words:
                score -= deduct
                reasons.append(f"Độ dài < {min_words} từ (-{deduct} điểm)")
        elif c.get('type') == 'has_calculation':
            if not re.search(r'\d+\s*[+\-*/]\s*\d+', content):
                score -= deduct
                reasons.append(f"Không có phép tính (-{deduct} điểm)")
    score = max(0, min(10, score))
    return score, reasons 
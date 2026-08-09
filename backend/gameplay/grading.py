import re
import unicodedata
from difflib import SequenceMatcher

def normalize_text(text: str) -> str:
    """
    Normalizes text for Zakovat answer comparison:
    1. Trims and lowercases.
    2. Maps common Uzbek Cyrillic characters to Latin equivalents.
    3. Normalizes Uzbek apostrophes / modifier letters (o', g', sh, ch, etc.).
    4. Strips punctuation, diacritics, and extra spaces.
    """
    if not text:
        return ""
    
    s = text.strip().lower()

    # Cyrillic to Latin character replacement for Uzbek / Russian input tolerance
    cyr_map = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'x', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sh', 'ъ': '',
        'ы': 'i', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya', 'ў': 'o', 'ғ': 'g',
        'қ': 'q', 'ҳ': 'h'
    }
    for cyr, lat in cyr_map.items():
        s = s.replace(cyr, lat)

    # Normalize various quote/apostrophe characters used in Uzbek (e.g., o‘, o', o`)
    s = re.sub(r"[‘’'`ʻʼ]", "", s)

    # Strip diacritics using Unicode NFD decomposition
    s = unicodedata.normalize('NFD', s)
    s = "".join(c for c in s if unicodedata.category(c) != 'Mn')

    # Remove non-alphanumeric characters except spaces
    s = re.sub(r"[^\w\s]", "", s)
    # Collapse multiple whitespaces
    s = re.sub(r"\s+", " ", s).strip()

    return s

def check_answer_correctness(submitted_text: str, accepted_answers: list, similarity_threshold: float = 0.82) -> tuple[bool, str]:
    """
    Checks if a submitted answer matches any accepted answer.
    Returns (is_correct, matched_canonical_answer).
    """
    norm_sub = normalize_text(submitted_text)
    if not norm_sub:
        return False, ""

    for target in accepted_answers:
        norm_target = normalize_text(str(target))
        if not norm_target:
            continue

        # 1. Exact normalized match
        if norm_sub == norm_target:
            return True, target

        # 2. Substring match for target contained in submission (if target length > 3)
        if len(norm_target) >= 4 and norm_target in norm_sub:
            # Check length difference so long sentences containing a short word aren't false positives
            if len(norm_sub) <= len(norm_target) + 5:
                return True, target

        # 3. Fuzzy similarity ratio (Levenshtein/Gestalt pattern matching)
        ratio = SequenceMatcher(None, norm_sub, norm_target).ratio()
        if ratio >= similarity_threshold:
            return True, target

    return False, ""

def calculate_points(time_remaining: float, duration: float, speed_bonus_enabled: bool, solve_order: int = 1) -> int:
    """
    Base score = 1000 pts.
    Optional Speed bonus up to 500 extra points based on time_remaining / duration.
    Solve order multiplier: 1st gets 100%, 2nd 90%, 3rd 80%, 4th+ 70%.
    """
    base_points = 1000
    speed_bonus = 0

    if speed_bonus_enabled and duration > 0 and time_remaining > 0:
        factor = max(0.0, min(1.0, time_remaining / duration))
        speed_bonus = int(500 * factor)

    total = base_points + speed_bonus

    # Solve order scale in multiple mode
    order_factors = [1.0, 0.9, 0.8, 0.7]
    order_factor = order_factors[min(solve_order - 1, len(order_factors) - 1)]

    return int(total * order_factor)

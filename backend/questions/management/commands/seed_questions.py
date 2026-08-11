import os
import zipfile
import xml.etree.ElementTree as ET
import re
import hashlib
from django.core.management.base import BaseCommand
from django.conf import settings
from questions.models import QuestionPack, Question

MEDIA_DIR = os.path.join(settings.BASE_DIR, 'media', 'questions')

def extract_and_parse_docx(docx_path):
    if not os.path.exists(docx_path):
        return []

    os.makedirs(MEDIA_DIR, exist_ok=True)

    with zipfile.ZipFile(docx_path) as z:
        rels_xml = z.read('word/_rels/document.xml.rels')
        rels_tree = ET.fromstring(rels_xml)
        rids = {}
        for elem in rels_tree:
            rid = elem.attrib.get('Id')
            target = elem.attrib.get('Target')
            if rid and target:
                rids[rid] = target

        xml_content = z.read('word/document.xml')
        tree = ET.fromstring(xml_content)

        paras = []
        for p_elem in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
            p_text = ''.join(e.text for e in p_elem.iter() if e.tag.endswith('}t') and e.text).strip()
            img_rids = []
            for elem in p_elem.iter():
                for attr_k, attr_v in elem.attrib.items():
                    if attr_k.endswith('embed') or attr_k.endswith('id'):
                        if attr_v in rids and 'media/' in rids[attr_v]:
                            img_rids.append(rids[attr_v])
            if p_text or img_rids:
                paras.append({'text': p_text, 'imgs': img_rids})

    raw_blocks = []
    current_block = []

    for item in paras:
        t = item['text']
        is_new_q = False
        if re.search(r'^\d+\s*-\s*savol', t, re.I):
            is_new_q = True
        elif re.search(r'^\d+[\.\-]\s*', t) and not re.search(r'^(to[\'`ʻʼ]?g[\'`ʻʼ]?ri\s*)?javob', t, re.I) and not re.search(r'^(izoh|qabul|manba|muallif)', t, re.I):
            is_new_q = True

        if is_new_q and current_block:
            cb_text = '\n'.join([b['text'] for b in current_block if b['text']])
            if re.search(r'javob:', cb_text, re.I):
                raw_blocks.append(current_block)
                current_block = [item]
            else:
                current_block.append(item)
        else:
            current_block.append(item)

    if current_block:
        raw_blocks.append(current_block)

    parsed = []

    for block in raw_blocks:
        lines = [b['text'] for b in block if b['text']]
        block_text = '\n'.join(lines)
        block_imgs = []
        for b in block:
            block_imgs.extend(b['imgs'])

        # RULE 1: EXCLUDE BLITS QUESTIONS
        if re.search(r'\bblits\b', block_text, re.IGNORECASE) or re.search(r'блиц', block_text, re.IGNORECASE):
            continue

        # Extract Question, Answer, Qabul, Explanation
        ans_m = re.search(r'(to[\'`ʻʼ]?g[\'`ʻʼ]?ri\s*)?javob:\s*(.*?)(?=\nqabul:|\nizoh:|\nmanba:|\nmuallif:|$)', block_text, re.DOTALL | re.IGNORECASE)
        qabul_m = re.search(r'qabul:\s*(.*?)(?=\nizoh:|\nmanba:|\nmuallif:|$)', block_text, re.DOTALL | re.IGNORECASE)
        izoh_m = re.search(r'izoh:\s*(.*?)(?=\nmanba:|\nmuallif:|$)', block_text, re.DOTALL | re.IGNORECASE)

        if not ans_m:
            continue

        javob = ans_m.group(2).strip()
        qabul = qabul_m.group(1).strip() if qabul_m else ''
        izoh = izoh_m.group(1).strip() if izoh_m else ''

        # Question main body text
        parts = re.split(r'\n(to[\'`ʻʼ]?g[\'`ʻʼ]?ri\s*)?javob:', block_text, flags=re.IGNORECASE)
        q_text = parts[0].strip()

        # Clean leading numbers (e.g. "1. " or "12-savol. ")
        q_text = re.sub(r'^\d+\s*-\s*savol\.?\s*', '', q_text, flags=re.IGNORECASE)
        q_text = re.sub(r'^\d+[\.\-]\s*', '', q_text)

        if not q_text or len(q_text) < 8:
            continue

        # RULE 2: TARQATMA MATERIAL & IMAGE EXTRACTION
        media_url = None
        if block_imgs:
            raw_img_path = block_imgs[0]
            zip_target_path = raw_img_path if raw_img_path.startswith('word/') else f"word/{raw_img_path}"
            try:
                with zipfile.ZipFile(docx_path) as z:
                    img_data = z.read(zip_target_path)
                    ext = os.path.splitext(zip_target_path)[1] or '.png'
                    img_hash = hashlib.md5(img_data).hexdigest()[:12]
                    filename = f"q_{img_hash}{ext}"
                    out_path = os.path.join(MEDIA_DIR, filename)
                    with open(out_path, 'wb') as f:
                        f.write(img_data)
                    media_url = f"https://api-zakoweb.claive.uz/media/questions/{filename}"
            except Exception as e:
                print(f"Error extracting image {zip_target_path}: {e}")

        # Build accepted answers list
        answers = []
        if javob:
            raw_clean = javob.replace('[', '').replace(']', '').strip()
            if raw_clean:
                answers.append(raw_clean)
            no_bracket = re.sub(r'\[.*?\]', '', javob).strip()
            if no_bracket and no_bracket != raw_clean:
                answers.append(no_bracket)
            bracket_words = re.findall(r'\[(.*?)\]', javob)
            for bw in bracket_words:
                if bw.strip() and len(bw.strip()) > 1:
                    answers.append(bw.strip())

        if qabul:
            qabul_clean = qabul.replace('"', '').replace("'", '').strip()
            if qabul_clean:
                answers.append(qabul_clean)

        unique_answers = list(dict.fromkeys(answers))
        if not unique_answers:
            unique_answers = ["Javob berilmadi"]

        parsed.append({
            'text': q_text,
            'accepted_answers': unique_answers,
            'explanation': izoh,
            'media_url': media_url
        })

    return parsed


class Command(BaseCommand):
    help = "Seed official Zakovat question bank (Zakopediya.docx and 120qs.docx)"

    def handle(self, *args, **options):
        self.stdout.write("Seeding Zakoweb question bank...")

        base_dir = os.path.dirname(__file__)
        doc_sources = [
            ('/home/claive/website/zakoweb/qs_bank/Zakopediya.docx', 'Zakopediya (Saralangan Savollar)'),
            ('/home/claive/website/zakoweb/qs_bank/120qs.docx', 'Zakovat Rasmiy Bank (120 Savol)'),
            (os.path.join(base_dir, '../../fixtures/120qs.docx'), 'Zakovat Rasmiy Bank (120 Savol)'),
        ]

        Question.objects.all().delete()
        QuestionPack.objects.all().delete()

        pack = QuestionPack.objects.create(
            title="Zakoweb Rasmiy Savollar Banki",
            description="Zakopediya va Sardor Axmedov muallifligidagi saralangan Zakovat savollari, rasm tarqatmalar va izohlar to'plami.",
            language='uz',
            is_official=True
        )

        total_seeded = 0
        processed_files = set()

        for path, label in doc_sources:
            if os.path.exists(path) and path not in processed_files:
                processed_files.add(path)
                parsed = extract_and_parse_docx(path)
                self.stdout.write(f"Parsing '{os.path.basename(path)}': found {len(parsed)} non-blits questions...")

                for idx, q in enumerate(parsed):
                    Question.objects.create(
                        pack=pack,
                        text=q['text'],
                        accepted_answers=q['accepted_answers'],
                        explanation=q['explanation'],
                        media_url=q['media_url'],
                        category=f"Zakovat #{total_seeded + 1}"
                    )
                    total_seeded += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {total_seeded} questions into '{pack.title}'! Excluded BLITS, extracted Tarqatma material images."))

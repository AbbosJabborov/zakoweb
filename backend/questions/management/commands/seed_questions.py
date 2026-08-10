import os
import zipfile
import xml.etree.ElementTree as ET
import re
from django.core.management.base import BaseCommand
from questions.models import QuestionPack, Question

def parse_docx_questions(docx_path):
    if not os.path.exists(docx_path):
        return []

    with zipfile.ZipFile(docx_path) as z:
        xml_content = z.read('word/document.xml')
        tree = ET.fromstring(xml_content)
        paras = []
        for elem in tree.iter():
            if elem.tag.endswith('}p'):
                p_text = ''.join(e.text for e in elem.iter() if e.tag.endswith('}t') and e.text)
                if p_text.strip():
                    paras.append(p_text.strip())

    full_text = '\n'.join(paras)
    chunks = re.split(r'\n(?=\d+\s*-\s*savol)', full_text, flags=re.IGNORECASE)

    parsed = []
    for chunk in chunks:
        match_num = re.search(r'^(\d+)\s*-\s*savol', chunk, flags=re.IGNORECASE)
        if not match_num:
            continue

        q_num = match_num.group(1)

        # Extract Javob, Qabul, Izoh, Manba, Muallif
        q_text_m = re.search(r'^\d+\s*-\s*savol\.?\s*(.*?)(?=\nJavob:)', chunk, flags=re.DOTALL | re.IGNORECASE)
        javob_m = re.search(r'Javob:\s*(.*?)(?=\nQabul:|\nIzoh:|\nManba:|\nMuallif:|$)', chunk, flags=re.DOTALL | re.IGNORECASE)
        qabul_m = re.search(r'Qabul:\s*(.*?)(?=\nIzoh:|\nManba:|\nMuallif:|$)', chunk, flags=re.DOTALL | re.IGNORECASE)
        izoh_m = re.search(r'Izoh:\s*(.*?)(?=\nManba:|\nMuallif:|$)', chunk, flags=re.DOTALL | re.IGNORECASE)

        q_text = q_text_m.group(1).strip() if q_text_m else chunk.strip()
        javob = javob_m.group(1).strip() if javob_m else ''
        qabul = qabul_m.group(1).strip() if qabul_m else ''
        izoh = izoh_m.group(1).strip() if izoh_m else ''

        answers = []
        if javob:
            lines = [l.strip() for l in javob.split('\n') if l.strip()]
            for line in lines:
                cleaned_line = re.sub(r'^\d+\.\s*', '', line)
                raw_clean = cleaned_line.replace('[', '').replace(']', '').strip()
                if raw_clean:
                    answers.append(raw_clean)

                no_bracket = re.sub(r'\[.*?\]', '', cleaned_line).strip()
                if no_bracket and no_bracket != raw_clean:
                    answers.append(no_bracket)

                bracket_words = re.findall(r'\[(.*?)\]', cleaned_line)
                for bw in bracket_words:
                    if bw.strip() and len(bw.strip()) > 1:
                        answers.append(bw.strip())

        if qabul:
            qabul_clean = qabul.replace('"', '').replace("'", '').strip()
            if qabul_clean:
                answers.append(qabul_clean)
            quoted = re.findall(r'["\'](.*?)["\']', qabul)
            for qstr in quoted:
                if qstr.strip():
                    answers.append(qstr.strip())

        unique_answers = list(dict.fromkeys(answers))
        if not unique_answers:
            unique_answers = ["Javob berilmadi"]

        parsed.append({
            'num': q_num,
            'text': q_text,
            'accepted_answers': unique_answers,
            'explanation': izoh,
            'category': f"Zakovat #{q_num}"
        })

    return parsed


class Command(BaseCommand):
    help = "Seed official Zakovat questions from 120qs.docx into database"

    def handle(self, *args, **options):
        self.stdout.write("Seeding official 120qs.docx questions bank...")

        base_dir = os.path.dirname(__file__)
        possible_paths = [
            os.path.join(base_dir, '../../fixtures/120qs.docx'),
            '/home/claive/website/zakoweb/qs_bank/120qs.docx',
            '/app/questions/fixtures/120qs.docx',
            'qs_bank/120qs.docx'
        ]

        target_path = None
        for p in possible_paths:
            if os.path.exists(p):
                target_path = p
                break

        if not target_path:
            self.stdout.write(self.style.ERROR("Could not locate 120qs.docx in any expected path."))
            return

        parsed_qs = parse_docx_questions(target_path)
        if not parsed_qs:
            self.stdout.write(self.style.ERROR(f"Failed to parse questions from {target_path}"))
            return

        # Replace existing questions
        Question.objects.all().delete()
        QuestionPack.objects.all().delete()

        pack = QuestionPack.objects.create(
            title="Zakovat Rasmiy Bank (120 Savol)",
            description="Sardor Axmedov muallifligidagi 120 ta saralangan va izohli Zakovat savollari banki.",
            language='uz',
            is_official=True
        )

        created_count = 0
        for q in parsed_qs:
            Question.objects.create(
                pack=pack,
                text=q['text'],
                accepted_answers=q['accepted_answers'],
                explanation=q['explanation'],
                category=q['category']
            )
            created_count += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {created_count} official Zakovat questions with full explanations into '{pack.title}'!"))

import os
import re
import json
import zipfile
import hashlib
import xml.etree.ElementTree as ET
from django.core.management.base import BaseCommand
from django.conf import settings
from questions.models import QuestionPack, Question

MEDIA_DIR = os.path.join(settings.BASE_DIR, 'media', 'questions')

class Command(BaseCommand):
    help = "AI-powered Question Bank Ingestion Agent. Parses raw docx/txt files using Gemini AI structured extraction."

    def add_arguments(self, parser):
        parser.add_argument('file_path', type=str, help="Path to raw .docx or .txt file containing Zakovat questions.")
        parser.add_argument('--pack-title', type=str, default="Zakoweb Rasmiy Savollar Banki", help="Title of QuestionPack to insert into.")
        parser.add_argument('--api-key', type=str, default="", help="Gemini API Key (optional, defaults to GEMINI_API_KEY env var).")

    def handle(self, *args, **options):
        file_path = options['file_path']
        pack_title = options['pack_title']
        api_key = options['api_key'] or os.getenv('GEMINI_API_KEY', '')

        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f"File not found: {file_path}"))
            return

        self.stdout.write(self.style.SUCCESS(f"🤖 Starting AI Question Ingestion Agent on: {file_path}"))

        raw_blocks = self.extract_docx_blocks(file_path)
        self.stdout.write(f"📄 Found {len(raw_blocks)} candidate question blocks in document.")

        pack, _ = QuestionPack.objects.get_or_create(
            title=pack_title,
            defaults={
                'description': "AI-ingested and verified official Zakovat question bank.",
                'language': 'uz',
                'is_official': True
            }
        )

        imported_count = 0
        use_ai = bool(api_key)

        if use_ai:
            self.stdout.write(self.style.SUCCESS("✨ Gemini API key detected! Running LLM AI extraction with model 'gemini-3.5-flash'..."))
        else:
            self.stdout.write(self.style.WARNING("⚠️ No GEMINI_API_KEY set. Running High-Precision Preserving Parser..."))

        for idx, block in enumerate(raw_blocks):
            raw_text = block['text']
            imgs = block['imgs']

            if re.search(r'\bblits\b', raw_text, re.IGNORECASE) or re.search(r'блиц', raw_text, re.IGNORECASE):
                continue

            media_url = None
            if imgs:
                media_url = self.save_media_image(file_path, imgs[0])

            q_data = None

            if use_ai:
                q_data = self.ai_parse_block(raw_text, api_key)

            if not q_data:
                q_data = self.rule_based_parse_block(raw_text)

            if not q_data or not q_data.get('text') or not q_data.get('accepted_answers'):
                continue

            if media_url:
                q_data['media_url'] = media_url

            Question.objects.create(
                pack=pack,
                text=q_data['text'],
                accepted_answers=q_data['accepted_answers'],
                explanation=q_data.get('explanation', ''),
                media_url=q_data.get('media_url'),
                category=f"Zakovat #{Question.objects.filter(pack=pack).count() + 1}"
            )
            imported_count += 1
            if imported_count % 10 == 0:
                self.stdout.write(f"  Processed {imported_count} questions...")

        self.stdout.write(self.style.SUCCESS(f"✅ Successfully ingested {imported_count} questions into '{pack.title}'!"))

    def extract_docx_blocks(self, docx_path):
        os.makedirs(MEDIA_DIR, exist_ok=True)
        with zipfile.ZipFile(docx_path) as z:
            rels_xml = z.read('word/_rels/document.xml.rels')
            rels_tree = ET.fromstring(rels_xml)
            rids = {elem.attrib.get('Id'): elem.attrib.get('Target') for elem in rels_tree if elem.attrib.get('Id')}

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
            if re.search(r'^\d{1,3}\s*-\s*savol', t, re.I):
                is_new_q = True
            elif re.search(r'^\d{1,3}\s*[\.\)]\s+', t) and not re.search(r'^(to[\'`ʻʼ]?g[\'`ʻʼ]?ri\s*)?javob', t, re.I) and not re.search(r'^(izoh|qabul|manba|muallif)', t, re.I):
                is_new_q = True

            if is_new_q and current_block:
                cb_text = '\n'.join([b['text'] for b in current_block if b['text']])
                if re.search(r'javob:', cb_text, re.I):
                    raw_blocks.append({'text': cb_text, 'imgs': [img for x in current_block for img in x['imgs']]})
                    current_block = [item]
                else:
                    current_block.append(item)
            else:
                current_block.append(item)

        if current_block:
            cb_text = '\n'.join([b['text'] for b in current_block if b['text']])
            raw_blocks.append({'text': cb_text, 'imgs': [img for x in current_block for img in x['imgs']]})

        return raw_blocks

    def save_media_image(self, docx_path, raw_img_path):
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
                return f"https://api-zakoweb.claive.uz/media/questions/{filename}"
        except Exception:
            return None

    def rule_based_parse_block(self, block_text):
        ans_m = re.search(r'(to[\'`ʻʼ]?g[\'`ʻʼ]?ri\s*)?javob:\s*(.*?)(?=\nqabul:|\nizoh:|\nmanba:|\nmuallif:|$)', block_text, re.DOTALL | re.IGNORECASE)
        qabul_m = re.search(r'qabul:\s*(.*?)(?=\nizoh:|\nmanba:|\nmuallif:|$)', block_text, re.DOTALL | re.IGNORECASE)
        izoh_m = re.search(r'izoh:\s*(.*?)(?=\nmanba:|\nmuallif:|$)', block_text, re.DOTALL | re.IGNORECASE)

        if not ans_m:
            return None

        javob = ans_m.group(2).strip()
        qabul = qabul_m.group(1).strip() if qabul_m else ''
        izoh = izoh_m.group(1).strip() if izoh_m else ''

        parts = re.split(r'\n(to[\'`ʻʼ]?g[\'`ʻʼ]?ri\s*)?javob:', block_text, flags=re.IGNORECASE)
        q_text = parts[0].strip()

        # Preserve 4-digit years like 1883-yilda, strip only question indexes
        q_text = re.sub(r'^\d{1,3}\s*-\s*savol[\.:\s]*', '', q_text, flags=re.IGNORECASE)
        q_text = re.sub(r'^\d{1,3}\s*[\.\)]\s+', '', q_text)

        answers = []
        if javob:
            raw_clean = javob.replace('[', '').replace(']', '').strip()
            if raw_clean: answers.append(raw_clean)
            no_bracket = re.sub(r'\[.*?\]', '', javob).strip()
            if no_bracket and no_bracket != raw_clean: answers.append(no_bracket)
            bracket_words = re.findall(r'\[(.*?)\]', javob)
            for bw in bracket_words:
                if bw.strip() and len(bw.strip()) > 1: answers.append(bw.strip())

        if qabul:
            qabul_clean = qabul.replace('"', '').replace("'", '').strip()
            if qabul_clean: answers.append(qabul_clean)

        unique_answers = list(dict.fromkeys(answers))
        return {
            'text': q_text,
            'accepted_answers': unique_answers or ["Javob berilmadi"],
            'explanation': izoh
        }

    def ai_parse_block(self, block_text, api_key):
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            prompt = f"""You are an expert Zakovat quiz question parsing agent.
Parse the following raw question text into structured JSON:

RAW QUESTION:
{block_text}

JSON Schema:
{{
  "text": "Complete question body text preserving 4-digit years (e.g. 1883-yilda) and centuries intact. Strip only the question index (e.g. '12-savol' or '1.').",
  "accepted_answers": ["Primary Answer", "Alternative Answer"],
  "explanation": "Detailed izoh or lore explanation."
}}
Return ONLY valid raw JSON without codeblocks."""

            response = client.models.generate_content(
                model='gemini-3.5-flash',
                contents=prompt
            )
            clean_json = re.sub(r'```json|```', '', response.text).strip()
            return json.loads(clean_json)
        except Exception as err:
            return None

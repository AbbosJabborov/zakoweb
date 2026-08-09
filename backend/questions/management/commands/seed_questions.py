from django.core.management.base import BaseCommand
from questions.models import QuestionPack, Question

SEED_PACKS = [
    {
        'title': "Zakovat O'zbekiston Saralangan Savollar Vol.1",
        'description': "Mantiqiy va qiziqarli Zakovat savollari to'plami. Do'stlar davrasida o'ynash uchun mo'ljallangan.",
        'language': 'uz',
        'is_official': True,
        'questions': [
            {
                'text': "Ushbu narsani XIX asrda ixtiro qilishgan. Bugungi kunda har bir xonadonda topiladi. Uning nomi grekcha 'ubiquitous' va 'vision' so'zlaridan kelib chiqqan. Gap nima haqida ketmoqda?",
                'accepted_answers': ["Televizor", "TV", "Televideniye"],
                'category': "Mantiqiy savol",
                'explanation': "Televizor so'zi grekcha 'tele' (uzoq) va lotincha 'visio' (ko'rish) birikmasidan olingan."
            },
            {
                'text': "Qadimgi Rimda uni 'oq oltin' deyishgan va askarlarga maosh o'rniga berishgan. Bugungi kunda oshxonamizda ishlatamiz. Bu nima?",
                'accepted_answers': ["Tuz", "Namak", "Osh tuzi"],
                'category': "Tarixiy zakovat",
                'explanation': "Lotincha 'salarium' (ish haqi) so'zi tuz (sal) sotib olish uchun askarlarga beriladigan puldan kelib chiqqan."
            },
            {
                'text': "Gipokrat bemorlarga ushbu ichimlikni shamollashga qarshi dori sifatida tavsiya qilgan. Bugun u dunyodagi eng ommabop issiq ichimliklardan biri. Diqqat savol: u nima?",
                'accepted_answers': ["Choy", "Issiq choy", "Ko'k choy", "Qora choy"],
                'category': "Tibbiyot va Tarix",
                'explanation': "Choy uzoq asrlar davomida dori vositasi sifatli foydalanilgan."
            },
            {
                'text': "U doimo oldinga harakat qiladi, uni to'xtatib ham, ortga qaytarib ham bo'lmaydi. U nimani anglatadi?",
                'accepted_answers': ["Vaqt", "Vaqtlar", "Time"],
                'category': "Mantiqiy jumboq",
                'explanation': "Vaqt uzluksiz oqim bo'lib, uning bir yo'nalishli harakati fiziologik va fizik qonuniyatdir."
            },
            {
                'text': "Shaxmat taxtasida eng ko'p harakat imkoniyatiga ega bo'lgan figura qaysi?",
                'accepted_answers': ["Farzin", "Vazir", "Queen"],
                'category': "Sport va Mantiq",
                'explanation': "Farzin (Vazir) gorizontal, vertikal va diagonal bo'ylab istalgancha katak harakatlana oladi."
            },
            {
                'text': "U yig'laydi lekin ko'zlari yo'q, u uchadi lekin qanotlari yo'q. Bu nima?",
                'accepted_answers': ["Bulut", "Yomg'ir buluti", "Cloud"],
                'category': "Topishmoq",
                'explanation': "Bulut ko'zi bo'lmay turib yomg'ir (yosh) to'kadi va shamolda uchadi."
            },
            {
                'text': "Dunyo xaritasida 5 ta okean bor. Maydoni bo'yicha eng katta okean qaysi?",
                'accepted_answers': ["Tinch okeani", "Tinch", "Pacific ocean", "Pacific"],
                'category': "Geografiya",
                'explanation': "Tinch okeani Yer yuzasining 30% dan ortig'ini egallaydi."
            },
            {
                'text': "Qaysi mashhur ixtirochi elektr lampani ommaviylashtirgan va 1000 dan ortiq patentga ega bo'lgan?",
                'accepted_answers': ["Tomas Edison", "Edison", "Thomas Edison"],
                'category': "Fan va Texnika",
                'explanation': "Tomas Edison 1879 yili amaliy foydalanishga yaraydigan lampochkani namoyish etgan."
            }
        ]
    },
    {
        'title': "Global Trivia & Pop Culture (English)",
        'description': "Engaging global trivia questions suitable for party matches.",
        'language': 'en',
        'is_official': True,
        'questions': [
            {
                'text': "What planet in our solar system is known as the Red Planet?",
                'accepted_answers': ["Mars"],
                'category': "Astronomy",
                'explanation': "Mars appears red due to iron oxide (rust) on its surface."
            },
            {
                'text': "Which element has the chemical symbol 'Au' on the periodic table?",
                'accepted_answers': ["Gold"],
                'category': "Science",
                'explanation': "'Au' comes from the Latin word for gold, 'Aurum'."
            },
            {
                'text': "What is the capital city of Japan?",
                'accepted_answers': ["Tokyo"],
                'category': "Geography",
                'explanation': "Tokyo is the world's most populous metropolitan region."
            },
            {
                'text': "Who painted the Mona Lisa?",
                'accepted_answers': ["Leonardo da Vinci", "Da Vinci", "Leonardo"],
                'category': "Art History",
                'explanation': "Leonardo da Vinci painted the Mona Lisa in the early 16th century."
            },
            {
                'text': "What is the hardest natural substance on Earth?",
                'accepted_answers': ["Diamond"],
                'category': "Geology",
                'explanation': "Diamond scores 10 on the Mohs scale of mineral hardness."
            }
        ]
    }
]

class Command(BaseCommand):
    help = "Seed initial Zakovat question packs into database"

    def handle(self, *args, **options):
        self.stdout.write("Seeding Zakoweb question packs...")
        for pack_data in SEED_PACKS:
            questions_data = pack_data.pop('questions')
            pack, created = QuestionPack.objects.get_or_create(
                title=pack_data['title'],
                defaults=pack_data
            )
            for q_item in questions_data:
                Question.objects.get_or_create(
                    pack=pack,
                    text=q_item['text'],
                    defaults={
                        'accepted_answers': q_item['accepted_answers'],
                        'category': q_item['category'],
                        'explanation': q_item['explanation']
                    }
                )
        self.stdout.write(self.style.SUCCESS("Successfully seeded default Zakoweb question packs!"))

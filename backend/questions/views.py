import datetime
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from questions.models import Question, QuestionPack
from questions.serializers import QuestionSerializer, QuestionPackSerializer

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all().order_by('-created_at')
    serializer_class = QuestionSerializer

    @action(detail=False, methods=['get'])
    def daily(self, request):
        """
        Returns today's deterministic daily Zakovat question.
        Rotates daily based on calendar date.
        """
        today = datetime.date.today()
        day_num = today.toordinal()
        questions = list(Question.objects.all().order_by('id'))

        if not questions:
            return Response({'error': 'No questions available in database'}, status=404)

        idx = day_num % len(questions)
        q = questions[idx]

        return Response({
            'date': today.isoformat(),
            'day_number': day_num,
            'question_number': idx + 1,
            'total_questions': len(questions),
            'id': q.id,
            'text': q.text,
            'category': q.category,
            'media_url': q.media_url,
            'accepted_answers': q.accepted_answers,
            'explanation': q.explanation
        })

class QuestionPackViewSet(viewsets.ModelViewSet):
    queryset = QuestionPack.objects.all().order_by('-created_at')
    serializer_class = QuestionPackSerializer

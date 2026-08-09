from rest_framework import viewsets
from questions.models import Question, QuestionPack
from questions.serializers import QuestionSerializer, QuestionPackSerializer

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all().order_by('-created_at')
    serializer_class = QuestionSerializer

class QuestionPackViewSet(viewsets.ModelViewSet):
    queryset = QuestionPack.objects.all().order_by('-created_at')
    serializer_class = QuestionPackSerializer

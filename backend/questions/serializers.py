from rest_framework import serializers
from questions.models import Question, QuestionPack

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'pack', 'text', 'accepted_answers', 'explanation', 'category', 'media_url', 'created_at']

class QuestionPackSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    question_count = serializers.IntegerField(source='questions.count', read_only=True)

    class Meta:
        model = QuestionPack
        fields = ['id', 'title', 'description', 'language', 'is_official', 'question_count', 'questions', 'created_at']

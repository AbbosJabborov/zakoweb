from rest_framework import serializers
from rooms.models import Room, RoomSettings
from gameplay.models import Player
from questions.models import Question, QuestionPack

class RoomSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomSettings
        fields = [
            'question_count', 'time_per_question', 'answers_per_player',
            'answering_cooldown', 'recap_duration', 'answer_visibility',
            'host_participates', 'max_players', 'speed_bonus_enabled'
        ]

class PlayerSerializer(serializers.ModelSerializer):
    score = serializers.SerializerMethodField()

    class Meta:
        model = Player
        fields = ['id', 'nickname', 'avatar', 'is_host_player', 'connected', 'score', 'session_token']

    def get_score(self, obj):
        from django.db.models import Sum
        total = obj.answers.filter(is_correct=True).aggregate(Sum('points_awarded'))['points_awarded__sum']
        return total or 0

class RoomDetailSerializer(serializers.ModelSerializer):
    settings = RoomSettingsSerializer()
    players = PlayerSerializer(many=True, read_only=True)

    class Meta:
        model = Room
        fields = ['id', 'code', 'status', 'host_token', 'current_question_index', 'settings', 'players', 'created_at']

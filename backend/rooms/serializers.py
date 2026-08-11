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
            'host_participates', 'max_players', 'speed_bonus_enabled', 'is_public'
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

class PublicRoomSerializer(serializers.ModelSerializer):
    player_count = serializers.SerializerMethodField()
    question_count = serializers.SerializerMethodField()
    time_per_question = serializers.SerializerMethodField()
    is_public = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = ['id', 'code', 'status', 'current_question_index', 'player_count', 'question_count', 'time_per_question', 'is_public', 'created_at']

    def get_player_count(self, obj):
        return obj.players.filter(connected=True).count() or obj.players.count()

    def get_question_count(self, obj):
        return obj.settings.question_count if hasattr(obj, 'settings') else 10

    def get_time_per_question(self, obj):
        return obj.settings.time_per_question if hasattr(obj, 'settings') else 60

    def get_is_public(self, obj):
        return obj.settings.is_public if hasattr(obj, 'settings') else True

import uuid
from django.db import models
from django.contrib.auth.models import User

def generate_room_code():
    import random, string
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

class Room(models.Model):
    STATUS_CHOICES = [
        ('lobby', 'Lobby'),
        ('active', 'Active'),
        ('ended', 'Ended'),
    ]

    code = models.CharField(max_length=10, unique=True, default=generate_room_code)
    host = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    host_token = models.CharField(max_length=64, default=uuid.uuid4)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='lobby')
    current_question_index = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Room {self.code} ({self.status})"

class RoomSettings(models.Model):
    ANSWER_MODE_CHOICES = [
        ('multiple', 'Multiple (Skribbl-style chat feed)'),
        ('single', 'Single (Classic 1 guess lockout)'),
    ]
    VISIBILITY_CHOICES = [
        ('as_submitted', 'Visible as submitted in live feed'),
        ('hidden_until_reveal', 'Hidden until round reveal'),
    ]

    room = models.OneToOneField(Room, on_delete=models.CASCADE, related_name='settings')
    question_count = models.IntegerField(default=10)
    time_per_question = models.IntegerField(default=60)
    answers_per_player = models.CharField(max_length=20, choices=ANSWER_MODE_CHOICES, default='multiple')
    answering_cooldown = models.IntegerField(default=0, help_text="Cooldown in seconds between guesses in multiple mode")
    recap_duration = models.IntegerField(default=8)
    answer_visibility = models.CharField(max_length=25, choices=VISIBILITY_CHOICES, default='as_submitted')
    host_participates = models.BooleanField(default=True)
    max_players = models.IntegerField(default=50)
    speed_bonus_enabled = models.BooleanField(default=True)
    is_public = models.BooleanField(default=True)

    def __str__(self):
        return f"Settings for Room {self.room.code}"

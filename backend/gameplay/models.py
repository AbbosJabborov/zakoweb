import uuid
from django.db import models
from rooms.models import Room
from questions.models import Question

class Player(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='players')
    nickname = models.CharField(max_length=50)
    avatar = models.CharField(max_length=50, default='🧠')
    session_token = models.CharField(max_length=64, default=uuid.uuid4)
    is_host_player = models.BooleanField(default=False)
    connected = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('room', 'nickname')

    def __str__(self):
        return f"{self.nickname} in Room {self.room.code}"

class RoomQuestion(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='room_questions')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    order_index = models.IntegerField(default=0)
    started_at = models.DateTimeField(null=True, blank=True)
    locked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['order_index']

    def __str__(self):
        return f"Q{self.order_index + 1} for Room {self.room.code}"

class Answer(models.Model):
    GRADED_BY_CHOICES = [
        ('auto', 'Auto-Graded'),
        ('host', 'Host Override'),
        ('none', 'Not Graded'),
    ]

    room_question = models.ForeignKey(RoomQuestion, on_delete=models.CASCADE, related_name='answers')
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='answers')
    text = models.CharField(max_length=255)
    submitted_at = models.DateTimeField(auto_now_add=True)
    is_correct = models.BooleanField(null=True, blank=True)
    points_awarded = models.IntegerField(default=0)
    graded_by = models.CharField(max_length=20, choices=GRADED_BY_CHOICES, default='none')

    def __str__(self):
        return f"{self.player.nickname}: '{self.text}' (Correct={self.is_correct})"

class PlayerQuestionState(models.Model):
    room_question = models.ForeignKey(RoomQuestion, on_delete=models.CASCADE, related_name='player_states')
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='question_states')
    solved = models.BooleanField(default=False)
    solved_at = models.DateTimeField(null=True, blank=True)
    attempts_count = models.IntegerField(default=0)
    last_submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('room_question', 'player')

    def __str__(self):
        return f"{self.player.nickname} - Solved: {self.solved}"

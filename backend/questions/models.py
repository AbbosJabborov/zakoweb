from django.db import models

class QuestionPack(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    language = models.CharField(max_length=10, default='uz')
    is_official = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.language})"

class Question(models.Model):
    pack = models.ForeignKey(QuestionPack, on_delete=models.SET_NULL, null=True, blank=True, related_name='questions')
    text = models.TextField()
    accepted_answers = models.JSONField(help_text="List of accepted alternative answers")
    explanation = models.TextField(blank=True, help_text="Additional background lore or commentary")
    category = models.CharField(max_length=100, default='General Trivia')
    media_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.text[:50]

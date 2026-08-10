import uuid
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rooms.models import Room, RoomSettings
from rooms.serializers import RoomDetailSerializer, RoomSettingsSerializer, PlayerSerializer
from gameplay.models import Player, RoomQuestion, Answer
from questions.models import Question

@api_view(['POST'])
def create_room(api_request):
    """
    Creates a new game room with custom settings and populates RoomQuestions.
    """
    settings_data = api_request.data.get('settings', {})
    pack_id = api_request.data.get('pack_id', None)

    room = Room.objects.create(status='lobby')
    
    # Save settings
    room_settings, _ = RoomSettings.objects.get_or_create(room=room)
    for key, val in settings_data.items():
        if hasattr(room_settings, key):
            setattr(room_settings, key, val)
    room_settings.save()

    # Select questions
    if pack_id:
        questions = list(Question.objects.filter(pack_id=pack_id))
    else:
        questions = list(Question.objects.all())

    import random
    random.shuffle(questions)
    selected = questions[:room_settings.question_count]

    for idx, q in enumerate(selected):
        RoomQuestion.objects.create(room=room, question=q, order_index=idx)

    serializer = RoomDetailSerializer(room)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
def join_room(api_request, code):
    """
    Player joins room using 6-character room code.
    """
    try:
        room = Room.objects.get(code__iexact=code)
    except Room.DoesNotExist:
        return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)

    nickname = api_request.data.get('nickname', '').strip()
    avatar = api_request.data.get('avatar', '🧠')
    is_host_player = api_request.data.get('is_host_player', False)

    if not nickname:
        return Response({'error': 'Nickname is required'}, status=status.HTTP_400_BAD_REQUEST)

    # Check max players limit
    if room.players.count() >= room.settings.max_players:
        return Response({'error': 'Room is full'}, status=status.HTTP_400_BAD_REQUEST)

    # Re-use existing player session if same nickname joins
    player, created = Player.objects.get_or_create(
        room=room,
        nickname=nickname,
        defaults={
            'avatar': avatar,
            'is_host_player': is_host_player,
            'session_token': str(uuid.uuid4()),
            'connected': True
        }
    )

    if not created:
        player.avatar = avatar
        player.connected = True
        player.save()

    return Response({
        'room': RoomDetailSerializer(room).data,
        'player': PlayerSerializer(player).data,
        'session_token': player.session_token
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
def get_room_snapshot(api_request, code):
    """
    Returns full room snapshot for page reloads / state recovery.
    Includes active_question with timer, answers feed, and lock state
    so the frontend REST polling fallback provides complete game state.
    """
    from django.utils import timezone as django_timezone

    try:
        room = Room.objects.get(code__iexact=code)
    except Room.DoesNotExist:
        return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)

    data = RoomDetailSerializer(room).data

    # Compute active_question if game is in progress
    if room.status == 'active':
        rq = room.room_questions.filter(order_index=room.current_question_index).first()
        if rq:
            q = rq.question
            now = django_timezone.now()
            elapsed = (now - rq.started_at).total_seconds() if rq.started_at else 0
            time_remaining = max(0, room.settings.time_per_question - elapsed)

            answers = Answer.objects.filter(room_question=rq).order_by('submitted_at')
            feed = []
            for a in answers:
                is_vis = (room.settings.answer_visibility == 'as_submitted') or rq.locked_at is not None
                feed.append({
                    'id': a.id,
                    'player_nickname': a.player.nickname,
                    'player_avatar': a.player.avatar,
                    'text': a.text if is_vis else '••••••••',
                    'is_correct': a.is_correct,
                    'points': a.points_awarded,
                    'submitted_at': a.submitted_at.isoformat()
                })

            data['active_question'] = {
                'index': rq.order_index,
                'total_questions': room.room_questions.count(),
                'text': q.text,
                'category': q.category,
                'media_url': q.media_url,
                'duration': room.settings.time_per_question,
                'time_remaining': time_remaining,
                'is_locked': rq.locked_at is not None,
                'explanation': q.explanation if rq.locked_at else None,
                'accepted_answers': q.accepted_answers if rq.locked_at else None,
                'answers_feed': feed
            }

    return Response(data, status=status.HTTP_200_OK)

@api_view(['GET'])
def get_room_results(api_request, code):
    """
    Returns post-game summary and detailed player scores.
    """
    try:
        room = Room.objects.get(code__iexact=code)
    except Room.DoesNotExist:
        return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)

    players = PlayerSerializer(room.players.all(), many=True).data
    # Sort by score descending
    players.sort(key=lambda p: p['score'], reverse=True)

    return Response({
        'room_code': room.code,
        'status': room.status,
        'leaderboard': players,
        'total_questions': room.room_questions.count()
    }, status=status.HTTP_200_OK)

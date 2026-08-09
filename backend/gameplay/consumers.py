import json
import logging
from datetime import datetime, timezone
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone as django_timezone
from rooms.models import Room, RoomSettings
from gameplay.models import Player, RoomQuestion, Answer, PlayerQuestionState
from gameplay.grading import check_answer_correctness, calculate_points

logger = logging.getLogger(__name__)

class RoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_code = self.scope['url_route']['kwargs']['room_code'].upper()
        self.room_group_name = f'room_{self.room_code}'
        self.player = None

        # Join channel group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        if self.player:
            await self.set_player_connection(self.player.id, False)
            players_list = await self.get_room_players(self.room_code)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'broadcast_event',
                    'event': 'players_updated',
                    'data': {
                        'players': players_list,
                        'left_player': {
                            'nickname': self.player.nickname,
                            'id': self.player.id
                        }
                    }
                }
            )

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            payload = json.loads(text_data)
        except json.JSONDecodeError:
            return

        action = payload.get('action')
        data = payload.get('data', {})

        if action == 'join_room':
            await self.handle_join_room(data)
        elif action == 'submit_answer':
            await self.handle_submit_answer(data)
        elif action == 'host_start_game':
            await self.handle_start_game(data)
        elif action == 'host_lock_question':
            await self.handle_lock_question(data)
        elif action == 'host_override_grade':
            await self.handle_override_grade(data)
        elif action == 'host_next_question':
            await self.handle_next_question(data)
        elif action == 'host_end_game':
            await self.handle_end_game(data)

    async def handle_join_room(self, data):
        session_token = data.get('session_token')
        self.player = await self.get_player_by_token(self.room_code, session_token)

        if not self.player:
            await self.send_json({'event': 'error', 'message': 'Player session invalid'})
            return

        await self.set_player_connection(self.player.id, True)

        # Send full room snapshot to connecting client
        snapshot = await self.get_room_state_snapshot(self.room_code, self.player)
        await self.send_json({'event': 'room_snapshot', 'data': snapshot})

        # Broadcast updated player list to room group
        players_list = await self.get_room_players(self.room_code)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'broadcast_event',
                'event': 'players_updated',
                'data': {
                    'players': players_list,
                    'joined_player': {
                        'nickname': self.player.nickname,
                        'avatar': self.player.avatar
                    }
                }
            }
        )

    async def handle_submit_answer(self, data):
        if not self.player:
            session_token = data.get('session_token')
            if session_token:
                self.player = await self.get_player_by_token(self.room_code, session_token)

        if not self.player:
            await self.send_json({'event': 'error', 'message': 'Player not authenticated on WS'})
            return

        text = data.get('text', '').strip()
        if not text:
            return

        res = await self.process_answer_submission(self.room_code, self.player.id, text)

        if not res.get('success'):
            if res.get('reason') == 'cooldown':
                await self.send_json({
                    'event': 'answer_rejected',
                    'data': {
                        'reason': 'cooldown',
                        'remaining_seconds': res.get('remaining')
                    }
                })
            elif res.get('reason') == 'time_expired':
                # Auto lock question when time expired
                await self.handle_lock_question({'host_token': 'auto_expired'})
            return

        # Broadcast submitted answer feed item
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'broadcast_event',
                'event': 'answer_submitted',
                'data': res['answer_data']
            }
        )

        # If player solved it on this guess
        if res.get('solved'):
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'broadcast_event',
                    'event': 'player_solved',
                    'data': {
                        'player_id': self.player.id,
                        'nickname': self.player.nickname,
                        'avatar': self.player.avatar,
                        'points': res.get('points'),
                        'text_masked': res.get('text_masked')
                    }
                }
            )

            # Send leaderboard update
            leaderboard = await self.get_current_leaderboard(self.room_code)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'broadcast_event',
                    'event': 'leaderboard_update',
                    'data': {'leaderboard': leaderboard}
                }
            )

    async def handle_start_game(self, data):
        host_token = data.get('host_token')
        if not await self.verify_host(self.room_code, host_token):
            await self.send_json({'event': 'error', 'message': 'Unauthorized host action'})
            return

        start_res = await self.start_game_question(self.room_code, index=0)
        if start_res:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'broadcast_event',
                    'event': 'question_started',
                    'data': start_res
                }
            )

    async def handle_lock_question(self, data):
        host_token = data.get('host_token')
        # Allow auto_expired trigger or verified host token
        if host_token != 'auto_expired' and not await self.verify_host(self.room_code, host_token):
            await self.send_json({'event': 'error', 'message': 'Unauthorized host action'})
            return

        reveal_res = await self.lock_current_question(self.room_code)
        if reveal_res:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'broadcast_event',
                    'event': 'question_locked',
                    'data': reveal_res
                }
            )
            leaderboard = await self.get_current_leaderboard(self.room_code)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'broadcast_event',
                    'event': 'leaderboard_update',
                    'data': {'leaderboard': leaderboard}
                }
            )

    async def handle_override_grade(self, data):
        host_token = data.get('host_token')
        if not await self.verify_host(self.room_code, host_token):
            await self.send_json({'event': 'error', 'message': 'Unauthorized host action'})
            return

        answer_id = data.get('answer_id')
        is_correct = data.get('is_correct')
        override_res = await self.apply_host_grade_override(answer_id, is_correct)

        if override_res:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'broadcast_event',
                    'event': 'grade_overridden',
                    'data': override_res
                }
            )
            leaderboard = await self.get_current_leaderboard(self.room_code)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'broadcast_event',
                    'event': 'leaderboard_update',
                    'data': {'leaderboard': leaderboard}
                }
            )

    async def handle_next_question(self, data):
        host_token = data.get('host_token')
        if not await self.verify_host(self.room_code, host_token):
            await self.send_json({'event': 'error', 'message': 'Unauthorized host action'})
            return

        next_res = await self.advance_next_question(self.room_code)
        if next_res.get('action') == 'question_started':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'broadcast_event',
                    'event': 'question_started',
                    'data': next_res['data']
                }
            )
        elif next_res.get('action') == 'game_over':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'broadcast_event',
                    'event': 'game_over',
                    'data': next_res['data']
                }
            )

    async def handle_end_game(self, data):
        host_token = data.get('host_token')
        if not await self.verify_host(self.room_code, host_token):
            await self.send_json({'event': 'error', 'message': 'Unauthorized host action'})
            return

        res = await self.finish_game(self.room_code)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'broadcast_event',
                'event': 'game_over',
                'data': res
            }
        )

    async def broadcast_event(self, event):
        await self.send_json({
            'event': event['event'],
            'data': event.get('data', {})
        })

    async def send_json(self, content):
        await self.send(text_data=json.dumps(content))

    # --- DB Helper Methods ---
    @database_sync_to_async
    def get_player_by_token(self, room_code, token):
        if not token:
            return None
        token_str = str(token).strip()
        try:
            return Player.objects.get(room__code__iexact=room_code, session_token=token_str)
        except Player.DoesNotExist:
            try:
                return Player.objects.filter(room__code__iexact=room_code, session_token__iexact=token_str).first()
            except Exception:
                return None

    @database_sync_to_async
    def set_player_connection(self, player_id, status_bool):
        Player.objects.filter(id=player_id).update(connected=status_bool)

    @database_sync_to_async
    def verify_host(self, room_code, host_token):
        if not host_token:
            return False
        return Room.objects.filter(code__iexact=room_code, host_token=str(host_token).strip()).exists()

    @database_sync_to_async
    def get_room_players(self, room_code):
        from rooms.serializers import PlayerSerializer
        room = Room.objects.get(code__iexact=room_code)
        return PlayerSerializer(room.players.all(), many=True).data

    @database_sync_to_async
    def get_room_state_snapshot(self, room_code, current_player=None):
        from rooms.serializers import RoomDetailSerializer
        room = Room.objects.get(code__iexact=room_code)
        data = RoomDetailSerializer(room).data

        # If current player is the host, attach host_token so frontend restores host rights automatically!
        if current_player and current_player.is_host_player:
            data['host_token'] = room.host_token

        rq = room.room_questions.filter(order_index=room.current_question_index).first()
        if rq and room.status == 'active':
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
        return data

    @database_sync_to_async
    def process_answer_submission(self, room_code, player_id, text):
        room = Room.objects.get(code__iexact=room_code)
        if room.status != 'active':
            return {'success': False, 'reason': 'not_active'}

        player = Player.objects.get(id=player_id)
        rq = room.room_questions.filter(order_index=room.current_question_index).first()
        if not rq or rq.locked_at is not None:
            return {'success': False, 'reason': 'locked'}

        now = django_timezone.now()

        # Check if question time has expired
        if rq.started_at:
            elapsed = (now - rq.started_at).total_seconds()
            if elapsed > room.settings.time_per_question:
                return {'success': False, 'reason': 'time_expired'}

        pstate, _ = PlayerQuestionState.objects.get_or_create(room_question=rq, player=player)

        if room.settings.answers_per_player == 'single' and pstate.attempts_count >= 1:
            return {'success': False, 'reason': 'single_mode_limit'}

        if room.settings.answers_per_player == 'multiple' and pstate.last_submitted_at:
            delta = (now - pstate.last_submitted_at).total_seconds()
            if delta < room.settings.answering_cooldown:
                return {'success': False, 'reason': 'cooldown', 'remaining': round(room.settings.answering_cooldown - delta, 1)}

        pstate.attempts_count += 1
        pstate.last_submitted_at = now
        pstate.save()

        is_correct, matched_canonical = check_answer_correctness(text, rq.question.accepted_answers)

        points = 0
        just_solved = False
        if is_correct and not pstate.solved:
            just_solved = True
            pstate.solved = True
            pstate.solved_at = now
            pstate.save()

            elapsed = (now - rq.started_at).total_seconds() if rq.started_at else 0
            time_remaining = max(0, room.settings.time_per_question - elapsed)
            solved_count = PlayerQuestionState.objects.filter(room_question=rq, solved=True).count()
            points = calculate_points(
                time_remaining=time_remaining,
                duration=room.settings.time_per_question,
                speed_bonus_enabled=room.settings.speed_bonus_enabled,
                solve_order=solved_count
            )

        answer_obj = Answer.objects.create(
            room_question=rq,
            player=player,
            text=text,
            is_correct=is_correct if is_correct else False,
            points_awarded=points,
            graded_by='auto'
        )

        return {
            'success': True,
            'solved': just_solved,
            'points': points,
            'answer_data': {
                'id': answer_obj.id,
                'player_id': player.id,
                'player_nickname': player.nickname,
                'player_avatar': player.avatar,
                'text': text if room.settings.answer_visibility == 'as_submitted' else '••••••••',
                'is_correct': is_correct,
                'points': points,
                'submitted_at': answer_obj.submitted_at.isoformat()
            }
        }

    @database_sync_to_async
    def start_game_question(self, room_code, index=0):
        room = Room.objects.get(code__iexact=room_code)
        room.status = 'active'
        room.current_question_index = index
        room.save()

        rq = room.room_questions.filter(order_index=index).first()
        if not rq:
            return None

        now = django_timezone.now()
        rq.started_at = now
        rq.locked_at = None
        rq.save()

        q = rq.question
        return {
            'index': index,
            'total_questions': room.room_questions.count(),
            'text': q.text,
            'category': q.category,
            'media_url': q.media_url,
            'duration': room.settings.time_per_question,
            'started_at': now.isoformat()
        }

    @database_sync_to_async
    def lock_current_question(self, room_code):
        room = Room.objects.get(code__iexact=room_code)
        rq = room.room_questions.filter(order_index=room.current_question_index).first()
        if not rq:
            return None

        now = django_timezone.now()
        rq.locked_at = now
        rq.save()

        q = rq.question
        answers = Answer.objects.filter(room_question=rq).order_by('submitted_at')
        feed = [{
            'id': a.id,
            'player_nickname': a.player.nickname,
            'player_avatar': a.player.avatar,
            'text': a.text,
            'is_correct': a.is_correct,
            'points': a.points_awarded
        } for a in answers]

        return {
            'question_index': room.current_question_index,
            'accepted_answers': q.accepted_answers,
            'explanation': q.explanation,
            'answers_feed': feed
        }

    @database_sync_to_async
    def apply_host_grade_override(self, answer_id, is_correct):
        try:
            answer = Answer.objects.get(id=answer_id)
        except Answer.DoesNotExist:
            return None

        rq = answer.room_question
        player = answer.player
        pstate, _ = PlayerQuestionState.objects.get_or_create(room_question=rq, player=player)

        previous_points = answer.points_awarded
        answer.is_correct = is_correct
        answer.graded_by = 'host'

        if is_correct:
            if previous_points == 0:
                elapsed = (answer.submitted_at - rq.started_at).total_seconds() if rq.started_at else 0
                time_remaining = max(0, rq.room.settings.time_per_question - elapsed)
                solved_count = PlayerQuestionState.objects.filter(room_question=rq, solved=True).count() + 1
                new_points = calculate_points(
                    time_remaining=time_remaining,
                    duration=rq.room.settings.time_per_question,
                    speed_bonus_enabled=rq.room.settings.speed_bonus_enabled,
                    solve_order=solved_count
                )
                answer.points_awarded = new_points
                pstate.solved = True
                pstate.save()
        else:
            answer.points_awarded = 0
            other_correct = Answer.objects.filter(room_question=rq, player=player, is_correct=True).exclude(id=answer.id).exists()
            if not other_correct:
                pstate.solved = False
                pstate.save()

        answer.save()
        return {
            'answer_id': answer.id,
            'player_id': player.id,
            'is_correct': answer.is_correct,
            'points': answer.points_awarded
        }

    @database_sync_to_async
    def advance_next_question(self, room_code):
        room = Room.objects.get(code__iexact=room_code)
        next_index = room.current_question_index + 1

        if next_index >= room.room_questions.count():
            room.status = 'ended'
            room.save()
            from rooms.serializers import PlayerSerializer
            leaderboard = PlayerSerializer(room.players.all(), many=True).data
            leaderboard.sort(key=lambda p: p['score'], reverse=True)
            return {'action': 'game_over', 'data': {'leaderboard': leaderboard}}
        else:
            room.current_question_index = next_index
            room.save()

            rq = room.room_questions.filter(order_index=next_index).first()
            now = django_timezone.now()
            rq.started_at = now
            rq.locked_at = None
            rq.save()

            q = rq.question
            return {
                'action': 'question_started',
                'data': {
                    'index': next_index,
                    'total_questions': room.room_questions.count(),
                    'text': q.text,
                    'category': q.category,
                    'media_url': q.media_url,
                    'duration': room.settings.time_per_question,
                    'started_at': now.isoformat()
                }
            }

    @database_sync_to_async
    def finish_game(self, room_code):
        room = Room.objects.get(code__iexact=room_code)
        room.status = 'ended'
        room.save()

        from rooms.serializers import PlayerSerializer
        leaderboard = PlayerSerializer(room.players.all(), many=True).data
        leaderboard.sort(key=lambda p: p['score'], reverse=True)
        return {'leaderboard': leaderboard}

    @database_sync_to_async
    def get_current_leaderboard(self, room_code):
        room = Room.objects.get(code__iexact=room_code)
        from rooms.serializers import PlayerSerializer
        players = PlayerSerializer(room.players.all(), many=True).data
        players.sort(key=lambda p: p['score'], reverse=True)
        return players

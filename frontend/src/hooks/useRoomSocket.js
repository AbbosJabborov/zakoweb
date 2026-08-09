import { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../utils/sound';

export function useRoomSocket(roomCode, sessionToken) {
  const [isConnected, setIsConnected] = useState(false);
  const [roomData, setRoomData] = useState(null);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [answersFeed, setAnswersFeed] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [playerSolved, setPlayerSolved] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [lastNotification, setLastNotification] = useState(null);

  const socketRef = useRef(null);
  const cooldownTimerRef = useRef(null);

  const connect = useCallback(() => {
    if (!roomCode || !sessionToken) return;

    // Build WS URL dynamically based on environment
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    // If running in Vite dev mode (port 5173), target port 8000 directly unless proxied
    const wsHost = host.includes('5173') ? 'localhost:8000' : host;
    const wsUrl = `${protocol}//${wsHost}/ws/room/${roomCode.toUpperCase()}/`;

    console.log('[WS] Connecting to:', wsUrl);
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected');
      setIsConnected(true);
      // Join room with session token
      ws.send(JSON.stringify({
        action: 'join_room',
        data: { room_code: roomCode, session_token: sessionToken }
      }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const { event: evtName, data } = msg;

        switch (evtName) {
          case 'room_snapshot':
            setRoomData(data);
            setLeaderboard(data.players || []);
            if (data.active_question) {
              setActiveQuestion(data.active_question);
              setAnswersFeed(data.active_question.answers_feed || []);
            }
            break;

          case 'player_joined':
            setRoomData(prev => prev ? {
              ...prev,
              players: [...(prev.players || []).filter(p => p.nickname !== data.nickname), data]
            } : prev);
            break;

          case 'player_left':
            setRoomData(prev => prev ? {
              ...prev,
              players: (prev.players || []).map(p => p.nickname === data.nickname ? { ...p, connected: false } : p)
            } : prev);
            break;

          case 'question_started':
            sound.init();
            setActiveQuestion({
              ...data,
              is_locked: false,
              time_remaining: data.duration,
              answers_feed: []
            });
            setAnswersFeed([]);
            setPlayerSolved(false);
            setRoomData(prev => prev ? { ...prev, status: 'active', current_question_index: data.index } : prev);
            break;

          case 'answer_submitted':
            setAnswersFeed(prev => [...prev, data]);
            break;

          case 'player_solved':
            sound.playCorrect();
            setLastNotification(`${data.avatar} ${data.nickname} solved the question! (+${data.points} pts)`);
            setTimeout(() => setLastNotification(null), 4000);
            break;

          case 'question_locked':
            sound.playBuzzer();
            setActiveQuestion(prev => prev ? {
              ...prev,
              is_locked: true,
              accepted_answers: data.accepted_answers,
              explanation: data.explanation,
              answers_feed: data.answers_feed || []
            } : prev);
            if (data.answers_feed) {
              setAnswersFeed(data.answers_feed);
            }
            break;

          case 'leaderboard_update':
            setLeaderboard(data.leaderboard || []);
            break;

          case 'grade_overridden':
            setAnswersFeed(prev => prev.map(a => a.id === data.answer_id ? { ...a, is_correct: data.is_correct, points: data.points } : a));
            break;

          case 'game_over':
            sound.playFanfare();
            setRoomData(prev => prev ? { ...prev, status: 'ended' } : prev);
            setLeaderboard(data.leaderboard || []);
            break;

          case 'answer_rejected':
            if (data.reason === 'cooldown') {
              startCooldown(data.remaining_seconds || 3);
            }
            break;

          default:
            break;
        }
      } catch (err) {
        console.error('[WS] Parse error:', err);
      }
    };

    ws.onclose = () => {
      console.log('[WS] Disconnected');
      setIsConnected(false);
    };

    ws.onerror = (err) => {
      console.error('[WS] Error:', err);
    };

  }, [roomCode, sessionToken]);

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const startCooldown = (secs) => {
    setCooldownRemaining(secs);
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    cooldownTimerRef.current = setInterval(() => {
      setCooldownRemaining(prev => {
        if (prev <= 0.2) {
          clearInterval(cooldownTimerRef.current);
          return 0;
        }
        return prev - 0.2;
      });
    }, 200);
  };

  // Dispatchers
  const submitAnswer = (text) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        action: 'submit_answer',
        data: { text }
      }));
    }
  };

  const hostStartGame = (hostToken) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        action: 'host_start_game',
        data: { host_token: hostToken }
      }));
    }
  };

  const hostLockQuestion = (hostToken) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        action: 'host_lock_question',
        data: { host_token: hostToken }
      }));
    }
  };

  const hostOverrideGrade = (hostToken, answerId, isCorrect) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        action: 'host_override_grade',
        data: { host_token: hostToken, answer_id: answerId, is_correct: isCorrect }
      }));
    }
  };

  const hostNextQuestion = (hostToken) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        action: 'host_next_question',
        data: { host_token: hostToken }
      }));
    }
  };

  const hostEndGame = (hostToken) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        action: 'host_end_game',
        data: { host_token: hostToken }
      }));
    }
  };

  return {
    isConnected,
    roomData,
    activeQuestion,
    answersFeed,
    leaderboard,
    cooldownRemaining,
    lastNotification,
    submitAnswer,
    hostStartGame,
    hostLockQuestion,
    hostOverrideGrade,
    hostNextQuestion,
    hostEndGame
  };
}

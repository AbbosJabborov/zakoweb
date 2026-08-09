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
  const heartbeatTimerRef = useRef(null);

  const connect = useCallback(() => {
    if (!roomCode || !sessionToken) return;

    const isDev = window.location.host.includes('5173') || window.location.host.includes('localhost');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const targetHost = isDev ? 'localhost:8000' : 'api-zakoweb.claive.uz';
    const wsUrl = `${protocol}//${targetHost}/ws/room/${roomCode.toUpperCase()}/`;

    console.log('[WS] Connecting to:', wsUrl);
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected');
      setIsConnected(true);

      // Send join room action with session token
      ws.send(JSON.stringify({
        action: 'join_room',
        data: { room_code: roomCode, session_token: sessionToken }
      }));

      // Setup 15s heartbeat ping
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ action: 'ping' }));
        }
      }, 15000);
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

          case 'players_updated':
            setRoomData(prev => prev ? { ...prev, players: data.players } : { code: roomCode, players: data.players, status: 'lobby' });
            setLeaderboard(data.players || []);
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
            setRoomData(prev => ({
              ...(prev || { code: roomCode }),
              status: 'active',
              current_question_index: data.index
            }));
            break;

          case 'answer_submitted':
            setAnswersFeed(prev => [...prev, data]);
            break;

          case 'player_solved':
            sound.playCorrect();
            setLastNotification(`${data.nickname} solved the question! (+${data.points} pts)`);
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
            setRoomData(prev => ({
              ...(prev || { code: roomCode }),
              status: 'ended'
            }));
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
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
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
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
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
        data: { text, session_token: sessionToken }
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

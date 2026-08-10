import { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../utils/sound';

export function useRoomSocket(roomCode, sessionToken) {
  const [isConnected, setIsConnected] = useState(false);
  const [roomData, setRoomData] = useState(null);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [answersFeed, setAnswersFeed] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [lastNotification, setLastNotification] = useState(null);

  const socketRef = useRef(null);
  const cooldownTimerRef = useRef(null);
  const heartbeatTimerRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const pollTimerRef = useRef(null);

  const isDev = typeof window !== 'undefined' && (window.location.host.includes('5173') || window.location.host.includes('localhost'));
  const apiBase = isDev ? '' : 'https://api-zakoweb.claive.uz';

  // Fetch REST snapshot as instant sync fallback
  const fetchSnapshot = useCallback(async () => {
    if (!roomCode) return;
    try {
      const res = await fetch(`${apiBase}/api/rooms/${roomCode.toUpperCase()}/snapshot/`);
      if (res.ok) {
        const data = await res.json();
        setRoomData(data);
        setLeaderboard(data.players || []);
        if (data.active_question) {
          setActiveQuestion(data.active_question);
          setAnswersFeed(data.active_question.answers_feed || []);
        }
      }
    } catch (err) {
      console.warn('[WS Fallback] Fetch snapshot failed:', err);
    }
  }, [roomCode, apiBase]);

  const connect = useCallback(() => {
    if (!roomCode || !sessionToken) return;

    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const targetHost = isDev ? 'localhost:8000' : 'api-zakoweb.claive.uz';
    const wsUrl = `${protocol}//${targetHost}/ws/room/${roomCode.toUpperCase()}/`;

    console.log('[WS] Connecting to:', wsUrl);
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected successfully');
      setIsConnected(true);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);

      // Join room with session token
      ws.send(JSON.stringify({
        action: 'join_room',
        data: { room_code: roomCode, session_token: sessionToken }
      }));

      // Instant snapshot sync
      fetchSnapshot();

      // 15s heartbeat
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
            setRoomData(prev => ({
              ...(prev || { code: roomCode }),
              status: 'active',
              current_question_index: data.index
            }));
            break;

          case 'answer_submitted':
            setAnswersFeed(prev => {
              if (prev.some(a => a.id === data.id)) return prev;
              return [...prev, data];
            });
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
      console.log('[WS] Disconnected, scheduling auto-reconnect...');
      setIsConnected(false);
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);

      // Auto-reconnect after 1.5s
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, 1500);
    };

    ws.onerror = (err) => {
      console.error('[WS] Error:', err);
      ws.close();
    };

  }, [roomCode, sessionToken, fetchSnapshot, isDev]);

  useEffect(() => {
    if (roomCode && sessionToken) {
      connect();
      fetchSnapshot();

      // Poll room state every 3 seconds so UI NEVER freezes or requires manual page refresh
      pollTimerRef.current = setInterval(() => {
        fetchSnapshot();
      }, 3000);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [connect, fetchSnapshot, roomCode, sessionToken]);

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

  const sendMsg = (action, data = {}) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      connect();
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action, data }));
    } else {
      // Retry send after short delay if socket is connecting
      setTimeout(() => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ action, data }));
        }
      }, 500);
    }
  };

  // Dispatchers
  const submitAnswer = (text) => sendMsg('submit_answer', { text, session_token: sessionToken });
  const hostStartGame = (hostToken) => sendMsg('host_start_game', { host_token: hostToken });
  const hostLockQuestion = (hostToken) => sendMsg('host_lock_question', { host_token: hostToken });
  const hostOverrideGrade = (hostToken, answerId, isCorrect) => sendMsg('host_override_grade', { host_token: hostToken, answer_id: answerId, is_correct: isCorrect });
  const hostNextQuestion = (hostToken) => sendMsg('host_next_question', { host_token: hostToken });
  const hostEndGame = (hostToken) => sendMsg('host_end_game', { host_token: hostToken });

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
    hostEndGame,
    refreshState: fetchSnapshot
  };
}

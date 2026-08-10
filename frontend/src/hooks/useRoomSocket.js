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
  // Track whether this hook instance is still mounted
  const mountedRef = useRef(true);
  // Stable refs for roomCode/sessionToken to avoid dependency churn
  const roomCodeRef = useRef(roomCode);
  const sessionTokenRef = useRef(sessionToken);

  roomCodeRef.current = roomCode;
  sessionTokenRef.current = sessionToken;

  const isDev = typeof window !== 'undefined' && (window.location.host.includes('5173') || window.location.host.includes('localhost'));
  const apiBase = isDev ? '' : 'https://api-zakoweb.claive.uz';

  // Apply a full snapshot (from REST or WS) to all state atomically
  const applySnapshot = useCallback((data) => {
    if (!mountedRef.current) return;
    setRoomData(data);
    setLeaderboard(data.players || []);
    if (data.active_question) {
      setActiveQuestion(data.active_question);
      setAnswersFeed(data.active_question.answers_feed || []);
    }
  }, []);

  // Fetch REST snapshot as instant sync fallback
  // Uses the correct URL: /api/rooms/<CODE>/ (not /snapshot/)
  const fetchSnapshot = useCallback(async () => {
    const code = roomCodeRef.current;
    if (!code) return;
    try {
      const res = await fetch(`${apiBase}/api/rooms/${code.toUpperCase()}/`);
      if (res.ok) {
        const data = await res.json();
        applySnapshot(data);
      }
    } catch (err) {
      console.warn('[REST Fallback] Fetch snapshot failed:', err);
    }
  }, [apiBase, applySnapshot]);

  // Stable connect function that reads roomCode/sessionToken from refs
  const connect = useCallback(() => {
    const code = roomCodeRef.current;
    const token = sessionTokenRef.current;
    if (!code || !token) return;

    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const targetHost = isDev ? 'localhost:8000' : 'api-zakoweb.claive.uz';
    const wsUrl = `${protocol}//${targetHost}/ws/room/${code.toUpperCase()}/`;

    console.log('[WS] Connecting to:', wsUrl);
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected successfully');
      if (!mountedRef.current) { ws.close(); return; }
      setIsConnected(true);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);

      // Join room with session token
      ws.send(JSON.stringify({
        action: 'join_room',
        data: { room_code: code, session_token: token }
      }));

      // Instant snapshot sync via REST as backup
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
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(event.data);
        const { event: evtName, data } = msg;

        switch (evtName) {
          case 'room_snapshot':
            applySnapshot(data);
            break;

          case 'players_updated':
            setRoomData(prev => prev ? { ...prev, players: data.players } : { code, players: data.players, status: 'lobby' });
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
              ...(prev || { code }),
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
            setTimeout(() => {
              if (mountedRef.current) setLastNotification(null);
            }, 4000);
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
              ...(prev || { code }),
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
      if (!mountedRef.current) return;
      setIsConnected(false);
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);

      // Auto-reconnect after 1.5s
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, 1500);
    };

    ws.onerror = (err) => {
      console.error('[WS] Error:', err);
      ws.close();
    };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDev, apiBase, applySnapshot, fetchSnapshot]);

  // Main lifecycle: connect WS + start REST polling
  useEffect(() => {
    mountedRef.current = true;

    if (roomCode && sessionToken) {
      connect();
      fetchSnapshot();

      // Poll room state every 3 seconds so UI NEVER freezes or requires manual page refresh
      pollTimerRef.current = setInterval(() => {
        fetchSnapshot();
      }, 3000);
    }

    return () => {
      mountedRef.current = false;
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [roomCode, sessionToken, connect, fetchSnapshot]);

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

  const sendMsg = useCallback((action, data = {}) => {
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
  }, [connect]);

  // Dispatchers
  const submitAnswer = useCallback((text) => sendMsg('submit_answer', { text, session_token: sessionTokenRef.current }), [sendMsg]);
  const hostStartGame = useCallback((hostToken) => sendMsg('host_start_game', { host_token: hostToken }), [sendMsg]);
  const hostLockQuestion = useCallback((hostToken) => sendMsg('host_lock_question', { host_token: hostToken }), [sendMsg]);
  const hostOverrideGrade = useCallback((hostToken, answerId, isCorrect) => sendMsg('host_override_grade', { host_token: hostToken, answer_id: answerId, is_correct: isCorrect }), [sendMsg]);
  const hostNextQuestion = useCallback((hostToken) => sendMsg('host_next_question', { host_token: hostToken }), [sendMsg]);
  const hostEndGame = useCallback((hostToken) => sendMsg('host_end_game', { host_token: hostToken }), [sendMsg]);

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

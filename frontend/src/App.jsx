import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import JoinCard from './components/JoinCard';
import CreateRoomModal from './components/CreateRoomModal';
import PlayerLobby from './components/PlayerLobby';
import PlayScreen from './components/PlayScreen';
import HostPanel from './components/HostPanel';
import Leaderboard from './components/Leaderboard';
import DailyChallenge from './components/DailyChallenge';
import InfiniteMode from './components/InfiniteMode';
import StatsModal from './components/StatsModal';
import { useRoomSocket } from './hooks/useRoomSocket';

const isDev = typeof window !== 'undefined' && (window.location.host.includes('5173') || window.location.host.includes('localhost'));
export const API_BASE = isDev ? '' : 'https://api-zakoweb.claive.uz';

export default function App() {
  // English & Infinite Mode set as defaults!
  const [activeTab, setActiveTab] = useState('infinite'); // 'infinite', 'daily', 'party'
  const [lang, setLang] = useState(() => localStorage.getItem('zakoweb_lang') || 'en');
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [pendingCode, setPendingCode] = useState('');

  const [sessionState, setSessionState] = useState(() => {
    const savedCode = localStorage.getItem('zakoweb_room_code') || '';
    const savedToken = localStorage.getItem('zakoweb_session_token') || '';
    const savedHostToken = localStorage.getItem('zakoweb_host_token') || '';
    const savedNickname = localStorage.getItem('zakoweb_nickname') || '';
    return { roomCode: savedCode, sessionToken: savedToken, hostToken: savedHostToken, nickname: savedNickname };
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Check URL params for room code on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam) {
      const upperCode = codeParam.toUpperCase();
      const savedCode = localStorage.getItem('zakoweb_room_code') || '';
      const savedToken = localStorage.getItem('zakoweb_session_token') || '';

      if (savedCode === upperCode && savedToken) {
        setSessionState(prev => ({ ...prev, roomCode: upperCode, sessionToken: savedToken }));
      } else {
        setPendingCode(upperCode);
        setSessionState(prev => ({ ...prev, roomCode: '', sessionToken: '' }));
      }
      setActiveTab('party');
    }
  }, []);

  const {
    isConnected,
    roomData,
    activeQuestion,
    answersFeed,
    leaderboard,
    cooldownRemaining,
    lastNotification,
    lobbyChatMessages,
    skipVoteData,
    submitAnswer,
    sendLobbyChat,
    hostUpdateSettings,
    voteSkipQuestion,
    hostStartGame,
    hostLockQuestion,
    hostOverrideGrade,
    hostNextQuestion,
    hostEndGame
  } = useRoomSocket(sessionState.roomCode, sessionState.sessionToken);

  // Update browser URL query string whenever active room code changes
  useEffect(() => {
    if (sessionState.roomCode) {
      const newUrl = `${window.location.pathname}?code=${sessionState.roomCode}`;
      window.history.pushState({ roomCode: sessionState.roomCode }, '', newUrl);
    } else if (!window.location.search.includes('code=')) {
      window.history.pushState({}, '', window.location.pathname);
    }
  }, [sessionState.roomCode]);

  // Host Migration & Auto recover hostToken from roomData snapshot
  useEffect(() => {
    if (roomData?.host_token && roomData.host_token !== sessionState.hostToken) {
      localStorage.setItem('zakoweb_host_token', roomData.host_token);
      setSessionState(prev => ({ ...prev, hostToken: roomData.host_token }));
    }
  }, [roomData, sessionState.hostToken]);

  // Handle Player Join
  const handleJoin = async ({ nickname, code, avatar }) => {
    const upperCode = code.trim().toUpperCase();
    const res = await fetch(`${API_BASE}/api/rooms/${upperCode}/join/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, avatar, is_host_player: false })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Join room failed');
    }

    localStorage.setItem('zakoweb_room_code', upperCode);
    localStorage.setItem('zakoweb_session_token', data.session_token);
    localStorage.setItem('zakoweb_nickname', nickname);

    window.history.pushState({}, '', `?code=${upperCode}`);

    setSessionState({
      roomCode: upperCode,
      sessionToken: data.session_token,
      hostToken: '',
      nickname: nickname
    });
    setPendingCode('');
    setActiveTab('party');
  };

  // Handle Host Room Creation
  const handleCreateRoom = async ({ hostNickname, hostAvatar, settings, pack_id }) => {
    const res = await fetch(`${API_BASE}/api/rooms/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings, pack_id })
    });

    const roomObj = await res.json();
    if (!res.ok) {
      throw new Error('Create room failed');
    }

    const finalHostName = hostNickname || 'Host';
    const finalHostAvatar = hostAvatar || 'crown';

    const joinRes = await fetch(`${API_BASE}/api/rooms/${roomObj.code}/join/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: finalHostName, avatar: finalHostAvatar, is_host_player: true })
    });

    const joinData = await joinRes.json();

    localStorage.setItem('zakoweb_room_code', roomObj.code);
    localStorage.setItem('zakoweb_session_token', joinData.session_token);
    localStorage.setItem('zakoweb_host_token', roomObj.host_token);
    localStorage.setItem('zakoweb_nickname', finalHostName);

    window.history.pushState({}, '', `?code=${roomObj.code}`);

    setSessionState({
      roomCode: roomObj.code,
      sessionToken: joinData.session_token,
      hostToken: roomObj.host_token,
      nickname: finalHostName
    });

    setIsCreateModalOpen(false);
    setPendingCode('');
    setActiveTab('party');
  };

  const handleLeave = () => {
    localStorage.removeItem('zakoweb_room_code');
    localStorage.removeItem('zakoweb_session_token');
    localStorage.removeItem('zakoweb_host_token');
    localStorage.removeItem('zakoweb_nickname');
    setSessionState({ roomCode: '', sessionToken: '', hostToken: '', nickname: '' });
    setPendingCode('');
    window.history.pushState({}, '', window.location.pathname);
  };

  const currentPlayer = (roomData?.players || []).find(p => p.nickname === sessionState.nickname) || {
    nickname: sessionState.nickname,
    avatar: 'brain'
  };

  const isHost = Boolean(sessionState.hostToken);
  const status = roomData?.status || (sessionState.roomCode ? 'lobby' : 'home');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        roomCode={sessionState.roomCode}
        isConnected={isConnected}
        onLeave={handleLeave}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenStats={() => setIsStatsOpen(true)}
        lang={lang}
        setLang={setLang}
      />

      <main style={{ flex: 1, padding: '1.5rem 1rem 6rem 1rem' }}>
        {!sessionState.roomCode || status === 'home' ? (
          activeTab === 'infinite' ? (
            <InfiniteMode
              apiBase={API_BASE}
              lang={lang}
            />
          ) : activeTab === 'daily' ? (
            <DailyChallenge
              apiBase={API_BASE}
              onOpenStats={() => setIsStatsOpen(true)}
              lang={lang}
            />
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
              <JoinCard
                initialCode={pendingCode}
                onJoin={handleJoin}
                onCreateOpen={() => setIsCreateModalOpen(true)}
                lang={lang}
              />
            </div>
          )
        ) : status === 'lobby' ? (
          <PlayerLobby
            roomData={roomData}
            isHost={isHost}
            hostToken={sessionState.hostToken}
            onStartGame={hostStartGame}
            onUpdateSettings={(settings) => hostUpdateSettings(sessionState.hostToken, settings)}
            lobbyChatMessages={lobbyChatMessages}
            onSendLobbyChat={sendLobbyChat}
          />
        ) : status === 'active' ? (
          <>
            <PlayScreen
              activeQuestion={activeQuestion}
              answersFeed={answersFeed}
              leaderboard={leaderboard}
              cooldownRemaining={cooldownRemaining}
              lastNotification={lastNotification}
              onSubmitAnswer={submitAnswer}
              currentPlayer={currentPlayer}
              roomSettings={roomData?.settings}
              isHost={isHost}
              onLockQuestion={() => hostLockQuestion(sessionState.hostToken)}
              skipVoteData={skipVoteData}
              onVoteSkip={voteSkipQuestion}
            />

            {isHost && (
              <HostPanel
                isHost={isHost}
                hostToken={sessionState.hostToken}
                activeQuestion={activeQuestion}
                answersFeed={answersFeed}
                onLockQuestion={hostLockQuestion}
                onNextQuestion={hostNextQuestion}
                onEndGame={hostEndGame}
                onOverrideGrade={hostOverrideGrade}
              />
            )}
          </>
        ) : status === 'ended' ? (
          <Leaderboard
            leaderboard={leaderboard}
            onPlayAgain={() => {
              if (isHost) hostStartGame(sessionState.hostToken);
            }}
            onHome={handleLeave}
          />
        ) : null}
      </main>

      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateRoom}
      />

      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        lang={lang}
      />
    </div>
  );
}

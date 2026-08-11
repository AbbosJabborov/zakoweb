import React, { useState, useRef, useEffect } from 'react';
import { Users, Play, QrCode, Copy, Check, Crown, Sparkles, Settings, MessageSquare, Send, Clock, Flame } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { AvatarIcon } from '../utils/avatars';

export default function PlayerLobby({ roomData, isHost, hostToken, onStartGame, onUpdateSettings, lobbyChatMessages = [], onSendLobbyChat }) {
  const [showQR, setShowQR] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef(null);

  const players = roomData?.players || [];
  const roomCode = roomData?.code || '';
  const settings = roomData?.settings || { time_per_question: 60, answering_cooldown: 0, question_count: 10 };
  const joinUrl = `${window.location.origin}?code=${roomCode}`;

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [lobbyChatMessages]);

  const copyShareLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSettingsChange = (key, val) => {
    if (!isHost || !onUpdateSettings) return;
    onUpdateSettings({
      ...settings,
      [key]: val
    });
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !onSendLobbyChat) return;
    onSendLobbyChat(chatInput.trim());
    setChatInput('');
  };

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header Banner */}
      <div className="glass-panel glass-panel-glow" style={{ padding: '1.75rem 1.5rem', textAlign: 'center', position: 'relative' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.85rem', borderRadius: '2rem', background: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.35)', color: '#c084fc', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.65rem' }}>
          <Sparkles size={16} /> MULTIPLAYER LOBBY
        </div>

        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.35rem', color: '#ffffff' }}>
          Waiting for Party...
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Share the room code or QR code with your friends to join!
        </p>

        {/* Room Code Box */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '1.25rem',
          background: 'rgba(11, 15, 25, 0.85)',
          border: '2px dashed rgba(139, 92, 246, 0.5)',
          padding: '0.85rem 1.5rem',
          borderRadius: '1.25rem',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px' }}>ROOM CODE</div>
            <div style={{ fontSize: '2.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', letterSpacing: '4px', color: '#c084fc' }}>
              {roomCode}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={copyShareLink} className="btn-secondary" style={{ padding: '0.55rem 0.9rem', fontSize: '0.85rem' }}>
              {copiedLink ? <Check size={16} color="#10b981" /> : <Copy size={16} />} {copiedLink ? 'Copied' : 'Copy Link'}
            </button>
            <button onClick={() => setShowQR(true)} className="btn-secondary" style={{ padding: '0.55rem 0.9rem', fontSize: '0.85rem' }}>
              <QrCode size={16} /> QR Code
            </button>
          </div>
        </div>

        {/* Host Launch Action */}
        {isHost && (
          <div>
            <button
              onClick={() => onStartGame(hostToken)}
              className="btn-success"
              style={{ fontSize: '1.15rem', padding: '0.95rem 2.5rem', gap: '0.6rem', width: '100%', maxWidth: '380px' }}
            >
              <Play size={22} fill="#ffffff" /> START GAME ({players.length} Ready)
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Live Settings + Players List + Lobby Chat */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem' }}>
        
        {/* Left Column: Live Settings & Players Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Live Settings Panel */}
          <div className="glass-panel" style={{ padding: '1.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.65rem' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ffffff' }}>
                <Settings size={18} color="#c084fc" /> Match Settings {isHost ? '(Host Editable)' : '(Live)'}
              </h2>
              {isHost && (
                <span style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '0.2rem 0.6rem', borderRadius: '0.4rem', fontWeight: 700 }}>
                  Host Controls Enabled
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              
              {/* Question Duration */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} /> TIME PER QUESTION
                </label>
                {isHost ? (
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {[30, 60, 90, 120].map(secs => (
                      <button
                        key={secs}
                        type="button"
                        onClick={() => handleSettingsChange('time_per_question', secs)}
                        style={{
                          flex: 1,
                          padding: '0.45rem',
                          borderRadius: '0.4rem',
                          background: (settings.time_per_question || 60) === secs ? '#538d4e' : '#121213',
                          border: (settings.time_per_question || 60) === secs ? 'none' : '1px solid #3a3a3c',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        {secs}s {secs === 60 ? '★' : ''}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ background: '#121213', padding: '0.55rem 0.85rem', borderRadius: '0.4rem', border: '1px solid #3a3a3c', color: '#ffffff', fontWeight: 800, fontSize: '0.95rem' }}>
                    ⏱️ {settings.time_per_question || 60} seconds
                  </div>
                )}
              </div>

              {/* Cooldown Freeze Time */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  <Flame size={14} style={{ display: 'inline', marginRight: '4px' }} /> FREEZE / COOLDOWN TIME
                </label>
                {isHost ? (
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {[0, 2, 3, 5].map(cd => (
                      <button
                        key={cd}
                        type="button"
                        onClick={() => handleSettingsChange('answering_cooldown', cd)}
                        style={{
                          flex: 1,
                          padding: '0.45rem',
                          borderRadius: '0.4rem',
                          background: (settings.answering_cooldown ?? 0) === cd ? '#538d4e' : '#121213',
                          border: (settings.answering_cooldown ?? 0) === cd ? 'none' : '1px solid #3a3a3c',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        {cd}s {cd === 0 ? '★' : ''}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ background: '#121213', padding: '0.55rem 0.85rem', borderRadius: '0.4rem', border: '1px solid #3a3a3c', color: '#ffffff', fontWeight: 800, fontSize: '0.95rem' }}>
                    ⚡ {(settings.answering_cooldown ?? 0) === 0 ? '0s (Instant)' : `${settings.answering_cooldown}s cooldown`}
                  </div>
                )}
              </div>

              {/* Question Count */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  QUESTION COUNT
                </label>
                {isHost ? (
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {[5, 10, 15, 20, 999].map(cnt => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => handleSettingsChange('question_count', cnt)}
                        style={{
                          flex: 1,
                          padding: '0.45rem',
                          borderRadius: '0.4rem',
                          background: (settings.question_count || 10) === cnt ? '#538d4e' : '#121213',
                          border: (settings.question_count || 10) === cnt ? 'none' : '1px solid #3a3a3c',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        {cnt === 999 ? '♾️ Inf' : `${cnt} Qs`}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ background: '#121213', padding: '0.55rem 0.85rem', borderRadius: '0.4rem', border: '1px solid #3a3a3c', color: '#ffffff', fontWeight: 800, fontSize: '0.95rem' }}>
                    🎯 {(settings.question_count >= 999) ? '♾️ Infinite Mode (No Limit)' : `${settings.question_count || 10} Questions`}
                  </div>
                )}
              </div>

              {/* Room Visibility: Public vs Private */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  ROOM VISIBILITY
                </label>
                {isHost ? (
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={() => handleSettingsChange('is_public', true)}
                      style={{
                        flex: 1,
                        padding: '0.45rem',
                        borderRadius: '0.4rem',
                        background: (settings.is_public ?? true) ? '#538d4e' : '#121213',
                        border: (settings.is_public ?? true) ? 'none' : '1px solid #3a3a3c',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      🌐 Public
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSettingsChange('is_public', false)}
                      style={{
                        flex: 1,
                        padding: '0.45rem',
                        borderRadius: '0.4rem',
                        background: !(settings.is_public ?? true) ? '#c9b458' : '#121213',
                        border: !(settings.is_public ?? true) ? 'none' : '1px solid #3a3a3c',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      🔒 Private
                    </button>
                  </div>
                ) : (
                  <div style={{ background: '#121213', padding: '0.55rem 0.85rem', borderRadius: '0.4rem', border: '1px solid #3a3a3c', color: '#ffffff', fontWeight: 800, fontSize: '0.95rem' }}>
                    {(settings.is_public ?? true) ? '🌐 Public Room' : '🔒 Private Room'}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Joined Players Grid */}
          <div className="glass-panel" style={{ padding: '1.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ffffff' }}>
                <Users size={18} color="#c084fc" /> Joined Players ({players.length})
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Max: {settings.max_players || 50}
              </span>
            </div>

            {players.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No players have joined yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
                {players.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '0.85rem',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    <AvatarIcon id={p.avatar} size={18} />
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.nickname}
                      </div>
                      {p.is_host_player && (
                        <div style={{ fontSize: '0.7rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 700 }}>
                          <Crown size={11} /> Host
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Lobby Chat Feed */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '480px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.65rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ffffff' }}>
              <MessageSquare size={18} color="#c084fc" /> Lobby Chat
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.06)', padding: '0.15rem 0.45rem', borderRadius: '0.4rem' }}>
              {lobbyChatMessages.length} msgs
            </span>
          </div>

          <div ref={chatScrollRef} style={{ flex: 1, overflowY: 'auto', paddingRight: '0.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {lobbyChatMessages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 1rem', fontSize: '0.85rem' }}>
                Say hello to the party while waiting! 👋
              </div>
            ) : (
              lobbyChatMessages.map((msg, idx) => (
                <div key={msg.id || idx} style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.55rem 0.75rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem' }}>
                    <AvatarIcon id={msg.player_avatar} size={14} />
                    <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#c084fc' }}>{msg.player_nickname}</span>
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#ffffff', wordBreak: 'break-word' }}>
                    {msg.text}
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleChatSubmit} style={{ marginTop: '0.85rem', position: 'relative' }}>
            <input
              type="text"
              placeholder="Chat with players..."
              className="input-custom"
              style={{ paddingRight: '3.2rem', fontSize: '0.9rem' }}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button
              type="submit"
              className="btn-primary"
              style={{ position: 'absolute', right: '0.3rem', top: '50%', transform: 'translateY(-50%)', padding: '0.45rem 0.75rem' }}
              disabled={!chatInput.trim()}
            >
              <Send size={15} />
            </button>
          </form>
        </div>

      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 300,
          padding: '1rem'
        }}>
          <div className="glass-panel animate-pop-in" style={{ padding: '2.25rem', textAlign: 'center', background: '#0b0f19', maxWidth: '340px', width: '100%' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.3rem' }}>Scan to Join</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>Point phone camera at QR code</p>
            <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '1.25rem', display: 'inline-block', marginBottom: '1.5rem' }}>
              <QRCodeSVG value={joinUrl} size={200} />
            </div>
            <div>
              <button onClick={() => setShowQR(false)} className="btn-secondary" style={{ width: '100%' }}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

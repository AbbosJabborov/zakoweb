import React, { useState, useEffect } from 'react';
import { Sparkles, Flame, Trophy, Check, X, ArrowRight, Lightbulb, HelpCircle, RefreshCw } from 'lucide-react';
import { sound } from '../utils/sound';
import { translations } from '../utils/i18n';

export default function InfiniteMode({ apiBase, lang = 'uz' }) {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userGuess, setUserGuess] = useState('');
  const [isSolved, setIsSolved] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [seenIds, setSeenIds] = useState([]);

  const t = translations[lang] || translations.uz;

  useEffect(() => {
    fetchRandomQuestion();
  }, []);

  const fetchRandomQuestion = async () => {
    setLoading(true);
    setIsSolved(false);
    setIsRevealed(false);
    setShowHint(false);
    setUserGuess('');
    setError(null);

    try {
      const excludeParam = seenIds.slice(-20).join(',');
      const res = await fetch(`${apiBase}/api/questions/random_question/?exclude=${excludeParam}`);
      if (!res.ok) throw new Error('Could not fetch question');
      const data = await res.json();
      setCurrentQuestion(data);
      if (data.id) {
        setSeenIds(prev => [...prev, data.id]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuessSubmit = (e) => {
    e.preventDefault();
    if (!userGuess.trim() || isSolved || isRevealed || !currentQuestion) return;

    const currentText = userGuess.trim();
    const acceptedList = currentQuestion.accepted_answers || [];

    const normalizedInput = currentText.toLowerCase().replace(/['"`ʻʼ]/g, '').trim();
    const isCorrect = acceptedList.some(ans => {
      const normAns = String(ans).toLowerCase().replace(/['"`ʻʼ]/g, '').trim();
      return normAns === normalizedInput || normalizedInput.includes(normAns) || normAns.includes(normalizedInput);
    });

    if (isCorrect) {
      sound.playCorrect();
      setIsSolved(true);
      const earned = showHint ? 5 : 10;
      setScore(prev => prev + earned);
      setSolvedCount(prev => prev + 1);
      setStreak(prev => prev + 1);
    } else {
      sound.playBuzzer();
      setUserGuess('');
    }
  };

  const handleReveal = () => {
    sound.playBuzzer();
    setIsRevealed(true);
    setStreak(0);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
        <Sparkles className="animate-spin" size={28} style={{ marginBottom: '0.75rem', color: '#538d4e' }} />
        <div>{lang === 'uz' ? 'Yangi savol yuklanmoqda...' : 'Loading next question...'}</div>
      </div>
    );
  }

  if (error || !currentQuestion) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#f43f5e' }}>
        <div>Error loading question.</div>
        <button onClick={fetchRandomQuestion} className="btn-secondary" style={{ marginTop: '1rem' }}>
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  const primaryAnswer = currentQuestion.accepted_answers?.[0] || '';

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Top Header Card */}
      <div className="wordle-card" style={{ padding: '0.85rem 1.15rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#6aaa64', letterSpacing: '1px', textTransform: 'uppercase' }}>
              ∞ {t.infiniteTab}
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              {t.infiniteTitle}
            </h2>
          </div>

          <span style={{ background: '#272729', padding: '0.3rem 0.65rem', borderRadius: '0.4rem', fontSize: '0.78rem', fontWeight: 700, color: '#818384', border: '1px solid #3a3a3c' }}>
            {currentQuestion.category || 'Zakovat'}
          </span>
        </div>

        {/* 3 Stats Counters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
          <div className="stat-box">
            <div className="stat-val" style={{ color: '#6aaa64', fontSize: '1.25rem' }}>{score}</div>
            <div className="stat-lbl">{t.scoreLabel}</div>
          </div>
          <div className="stat-box">
            <div className="stat-val" style={{ fontSize: '1.25rem' }}>{solvedCount}</div>
            <div className="stat-lbl">{t.solvedLabel}</div>
          </div>
          <div className="stat-box">
            <div className="stat-val" style={{ color: '#f59e0b', fontSize: '1.25rem' }}>
              {streak} <Flame size={13} style={{ display: 'inline' }} />
            </div>
            <div className="stat-lbl">{t.streakLabel}</div>
          </div>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="wordle-card animate-pop-in" style={{ padding: '1.35rem' }}>
        
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, lineHeight: 1.45, color: '#ffffff', marginBottom: '1.15rem' }}>
          {currentQuestion.text}
        </h3>

        {currentQuestion.media_url && (
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <img src={currentQuestion.media_url} alt="Savol rasmi" style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '0.5rem' }} />
          </div>
        )}

        {/* Hint Box */}
        {showHint && primaryAnswer && !isSolved && !isRevealed && (
          <div style={{ marginBottom: '0.85rem', padding: '0.75rem', borderRadius: '0.5rem', background: '#272729', border: '1px solid #3a3a3c', fontSize: '0.85rem', color: '#c9b458', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Lightbulb size={16} />
            <span>
              <strong>{t.hint}:</strong> {primaryAnswer.length} {lang === 'uz' ? 'ta harf' : 'letters'}, {lang === 'uz' ? 'bosh harf' : 'starts with'}: "{primaryAnswer[0].toUpperCase()}"
            </span>
          </div>
        )}

        {/* Play Controls & Form */}
        {!isSolved && !isRevealed ? (
          <div>
            <form onSubmit={handleGuessSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <input
                type="text"
                placeholder={t.typeAnswer}
                className="wordle-input"
                value={userGuess}
                onChange={(e) => setUserGuess(e.target.value)}
                autoFocus
              />
              <button type="submit" className="wordle-btn-submit" disabled={!userGuess.trim()}>
                {t.check}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowHint(true)}
                className="wordle-icon-btn"
                style={{ flex: 1, padding: '0.55rem' }}
                disabled={showHint}
              >
                <Lightbulb size={15} color="#c9b458" /> {t.showHint}
              </button>

              <button
                type="button"
                onClick={handleReveal}
                className="wordle-icon-btn"
                style={{ flex: 1, padding: '0.55rem', color: '#fb7185' }}
              >
                <HelpCircle size={15} color="#f43f5e" /> {t.giveUp}
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-pop-in" style={{ padding: '1.15rem', borderRadius: '0.5rem', background: isSolved ? 'rgba(83, 141, 78, 0.2)' : 'rgba(244, 63, 94, 0.15)', border: `1.5px solid ${isSolved ? '#538d4e' : '#f43f5e'}` }}>
            <div style={{ fontWeight: 800, fontSize: '0.98rem', color: isSolved ? '#6aaa64' : '#fb7185', marginBottom: '0.6rem' }}>
              {isSolved ? t.solved : t.failed}
            </div>

            <div style={{ fontSize: '0.88rem', color: '#ffffff', marginBottom: '0.65rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
              <strong>{t.correctAnswer}:</strong> <span style={{ color: '#6aaa64', fontWeight: 800 }}>{(currentQuestion.accepted_answers || []).join(' / ')}</span>
            </div>

            {currentQuestion.explanation && (
              <div style={{ fontSize: '0.85rem', color: '#d7dadc', lineHeight: 1.45, marginBottom: '1rem' }}>
                <strong>{t.explanation}:</strong> {currentQuestion.explanation}
              </div>
            )}

            {/* NEXT QUESTION BUTTON */}
            <button
              onClick={fetchRandomQuestion}
              className="wordle-btn-submit"
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
            >
              {t.nextQuestion}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

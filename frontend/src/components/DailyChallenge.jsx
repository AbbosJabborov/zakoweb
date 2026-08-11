import React, { useState, useEffect } from 'react';
import { Sparkles, Trophy, Share2, Flame, HelpCircle, Check, X, Clock, Lightbulb, Copy } from 'lucide-react';
import { sound } from '../utils/sound';

export default function DailyChallenge({ apiBase, onOpenStats }) {
  const [dailyData, setDailyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userGuess, setUserGuess] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [isSolved, setIsSolved] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Load Saved Daily State from LocalStorage
  useEffect(() => {
    fetchDailyQuestion();
    loadSavedProgress();
  }, []);

  // Countdown timer to midnight
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diffMs = tomorrow - now;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      setTimeUntilNext(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDailyQuestion = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/questions/daily/`);
      if (!res.ok) throw new Error('Daily question unavailable');
      const data = await res.json();
      setDailyData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedProgress = () => {
    const saved = localStorage.getItem(`zakoweb_daily_${todayStr}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setGuesses(parsed.guesses || []);
        setIsSolved(parsed.isSolved || false);
        setIsFailed(parsed.isFailed || false);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const saveProgress = (newGuesses, solved, failed) => {
    localStorage.setItem(`zakoweb_daily_${todayStr}`, JSON.stringify({
      guesses: newGuesses,
      isSolved: solved,
      isFailed: failed
    }));

    // Update Global Stats
    const statsRaw = localStorage.getItem('zakoweb_wordle_stats');
    let stats = statsRaw ? JSON.parse(statsRaw) : { played: 0, wins: 0, currentStreak: 0, maxStreak: 0, lastDate: '' };

    if (stats.lastDate !== todayStr) {
      stats.played += 1;
      if (solved) {
        stats.wins += 1;
        // Check if consecutive day
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yestStr = yesterday.toISOString().split('T')[0];
        if (stats.lastDate === yestStr) {
          stats.currentStreak += 1;
        } else {
          stats.currentStreak = 1;
        }
        stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
      } else if (failed) {
        stats.currentStreak = 0;
      }
      stats.lastDate = todayStr;
      localStorage.setItem('zakoweb_wordle_stats', JSON.stringify(stats));
    }
  };

  const handleGuessSubmit = (e) => {
    e.preventDefault();
    if (!userGuess.trim() || isSolved || isFailed || !dailyData) return;

    const currentText = userGuess.trim();
    const acceptedList = dailyData.accepted_answers || [];

    // Check correctness (fuzzy string match)
    const normalizedInput = currentText.toLowerCase().replace(/['"`ʻʼ]/g, '').trim();
    const isCorrect = acceptedList.some(ans => {
      const normAns = String(ans).toLowerCase().replace(/['"`ʻʼ]/g, '').trim();
      return normAns === normalizedInput || normalizedInput.includes(normAns) || normAns.includes(normalizedInput);
    });

    const newGuesses = [...guesses, { text: currentText, isCorrect }];
    setGuesses(newGuesses);
    setUserGuess('');

    if (isCorrect) {
      sound.playCorrect();
      setIsSolved(true);
      saveProgress(newGuesses, true, false);
    } else {
      sound.playBuzzer();
      if (newGuesses.length >= 3) {
        setIsFailed(true);
        saveProgress(newGuesses, false, true);
      } else {
        saveProgress(newGuesses, false, false);
      }
    }
  };

  const handleShare = () => {
    if (!dailyData) return;
    const attemptStr = isSolved ? `${guesses.length}/3` : 'X/3';
    const gridEmojis = guesses.map(g => g.isCorrect ? '🟩' : '⬛').join('');
    
    const statsRaw = localStorage.getItem('zakoweb_wordle_stats');
    const stats = statsRaw ? JSON.parse(statsRaw) : { currentStreak: 1 };

    const shareText = `Zakoweb Kun Savoli #${dailyData.question_number} 🧠 ${attemptStr}\n${gridEmojis}\nStreak: ${stats.currentStreak} 🔥\nhttps://zakoweb.claive.uz`;

    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
        <Sparkles className="animate-spin" size={32} style={{ marginBottom: '1rem', color: '#6aaa64' }} />
        <div>Bugungi Kun Savoli yuklanmoqda...</div>
      </div>
    );
  }

  if (error || !dailyData) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#f43f5e' }}>
        <div>Savol yuklashda xatolik yuz berdi. Metod qaytadan urinib ko'ring.</div>
      </div>
    );
  }

  const primaryAnswer = dailyData.accepted_answers?.[0] || 'Javob';

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header Bar */}
      <div className="wordle-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6aaa64', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            KUN SAVOLI #{dailyData.question_number}
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Daily Zakovat Challenge
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            onClick={onOpenStats}
            className="wordle-icon-btn"
            title="Statistika"
          >
            <Trophy size={18} color="#c9b458" />
          </button>
          <div style={{ background: '#272729', padding: '0.4rem 0.75rem', borderRadius: '0.6rem', fontSize: '0.82rem', fontWeight: 700, color: '#d7dadc', border: '1px solid #3a3a3c' }}>
            {new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })}
          </div>
        </div>
      </div>

      {/* Main Question Tile */}
      <div className="wordle-card animate-pop-in" style={{ padding: '1.5rem', border: '1.5px solid #3a3a3c' }}>
        
        {/* Category Tag */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <span style={{ background: 'rgba(106, 170, 100, 0.15)', color: '#6aaa64', padding: '0.25rem 0.65rem', borderRadius: '0.4rem', fontSize: '0.78rem', fontWeight: 800, border: '1px solid rgba(106, 170, 100, 0.3)' }}>
            • {dailyData.category || 'Mantiqiy savol'}
          </span>
          <span style={{ fontSize: '0.8rem', color: '#818384', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Clock size={14} /> Yangilanish: {timeUntilNext}
          </span>
        </div>

        {/* Question Text */}
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.45, color: '#ffffff', marginBottom: '1.25rem' }}>
          {dailyData.text}
        </h3>

        {dailyData.media_url && (
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <img src={dailyData.media_url} alt="Savol rasmi" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '0.6rem' }} />
          </div>
        )}

        {/* Progressive Hints Unlocked on Guesses */}
        {guesses.length > 0 && !isSolved && (
          <div style={{ marginBottom: '1rem', padding: '0.85rem', borderRadius: '0.6rem', background: '#272729', border: '1px solid #3a3a3c', fontSize: '0.85rem', color: '#c9b458', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lightbulb size={16} />
            <span>
              <strong>Yordam:</strong> Javob {primaryAnswer.length} ta harfdan iborat, bosh harfi: "{primaryAnswer[0].toUpperCase()}"
            </span>
          </div>
        )}

        {/* Guesses Tile History (Wordle Style) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
          {[0, 1, 2].map((idx) => {
            const g = guesses[idx];
            return (
              <div
                key={idx}
                className={`wordle-tile ${g ? (g.isCorrect ? 'correct' : 'wrong') : 'empty'}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.6rem',
                  background: g ? (g.isCorrect ? '#538d4e' : '#3a3a3c') : '#121213',
                  border: g ? 'none' : '1.5px dashed #3a3a3c',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  transition: 'all 0.3s ease'
                }}
              >
                <span>{g ? `"${g.text}"` : `Urinish #${idx + 1}`}</span>
                {g && (
                  <span>{g.isCorrect ? <Check size={18} color="#ffffff" /> : <X size={18} color="#818384" />}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Input Form */}
        {!isSolved && !isFailed ? (
          <form onSubmit={handleGuessSubmit} style={{ display: 'flex', gap: '0.6rem' }}>
            <input
              type="text"
              placeholder="Javobingizni yozing..."
              className="wordle-input"
              value={userGuess}
              onChange={(e) => setUserGuess(e.target.value)}
              autoFocus
            />
            <button type="submit" className="wordle-btn-submit" disabled={!userGuess.trim()}>
              TEKSHIRISH
            </button>
          </form>
        ) : (
          /* Result & Lore Box */
          <div className="animate-pop-in" style={{ padding: '1.25rem', borderRadius: '0.75rem', background: isSolved ? 'rgba(83, 141, 78, 0.2)' : 'rgba(244, 63, 94, 0.15)', border: `1.5px solid ${isSolved ? '#538d4e' : '#f43f5e'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: isSolved ? '#6aaa64' : '#fb7185', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {isSolved ? '🎉 TABRIKLAYMIZ! SAVOLNI TOPDINGIZ' : '❌ UCHALA URINISH HAM TUGADI'}
              </div>

              <button onClick={handleShare} className="wordle-btn-share">
                <Share2 size={15} /> {copied ? 'NUSXALANDI!' : 'ULASHISH'}
              </button>
            </div>

            <div style={{ fontSize: '0.92rem', color: '#ffffff', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.65rem' }}>
              <strong>To'g'ri javob:</strong> <span style={{ color: '#6aaa64', fontWeight: 800 }}>{(dailyData.accepted_answers || []).join(' / ')}</span>
            </div>

            {dailyData.explanation && (
              <div style={{ fontSize: '0.88rem', color: '#d7dadc', lineHeight: 1.45 }}>
                <strong>Izoh:</strong> {dailyData.explanation}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

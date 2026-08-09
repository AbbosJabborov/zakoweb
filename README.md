# Zakoweb — Live Multiplayer Zakovat Party Game

Zakoweb is a real-time, browser-based online party quiz game replicating **Zakovat** ("What? Where? When?"). Hosts create custom rooms, players join from their mobile phones or laptops using a 6-character room code or QR code, and type free-text answers into a real-time skribbl.io-style chat feed.

## 🚀 Key Features

- **Skribbl-Style Live Answer Feed**: Answers stream in real-time. Fast correct answers earn speed bonus points.
- **Auto-Grading & Host Override**: Normalizes text (Uzbek Latin & Cyrillic, diacritics, punctuation) and fuzzy matches synonyms. The Host has a live drawer to manually accept (`✓`) or reject (`✗`) answers.
- **Audio Synthesizer & Web Audio FX**: Built-in sound effects (timer tick, correct chime, wrong buzzer, victory fanfare) with no external MP3 dependencies.
- **Configurable Room Settings**:
  - `answers_per_player`: `multiple` (live chat feed) or `single` (classic Zakovat)
  - `answering_cooldown`: 3s/5s delay between chat submissions to prevent spam
  - `answer_visibility`: `as_submitted` vs `hidden_until_reveal`
  - `question_count` & `time_per_question` (15s to 90s)
- **Built-in Zakovat Question Packs**: Pre-loaded with Uzbek Saralangan Savollar & English Global Trivia decks.
- **Victory Podium & Confetti**: Top 3 celebration with interactive standings.

## 🛠️ Stack & Infrastructure

- **Frontend**: React + Vite + Canvas Confetti + QRCode + Web Audio API (Hosted on Cloudflare Pages)
- **Backend**: Django 5 + Django Channels + Daphne ASGI + Python 3.12 (Hosted on VPS via Docker Compose)
- **Database & Cache**: PostgreSQL 16 + Redis 7

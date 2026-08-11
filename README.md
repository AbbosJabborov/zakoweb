# Zakoweb — Official Zakovat Puzzles & Intellectual Gaming Platform

Zakoweb is an official online platform bringing **Zakovat** ("What? Where? When?") to everyone. It features daily Wordle-style corporate puzzles, infinite single-player practice with 500+ official questions and Tarqatma material images, and real-time live multiplayer quiz rooms.

## 🚀 Key Modes & Features

- **Daily Corporate Puzzle**: 1 official daily Zakovat challenge with streak tracking, hint systems, and shareable result grids.
- **Infinite Practice Mode**: Non-stop single-player practice with 500+ official questions, Tarqatma media image rendering, and detailed explanations.
- **Live Multiplayer Arena**: Skribbl-style real-time answer feed, speed bonuses, customizable cooldowns, and host override controls.
- **AI Question Ingestion Agent**: Gemini 3.5 Flash powered ingestion pipeline that parses `.docx` files, preserves historical dates, synthesizes alternate answers, and extracts Tarqatma media assets.
- **Auto-Grading & Host Override**: Normalizes text (Uzbek Latin & Cyrillic, diacritics, punctuation) and fuzzy matches synonyms.
- **Web Audio FX & Audio Synthesizer**: Built-in sound effects (timer ticks, correct chimes, wrong buzzers, fanfare) with no external media files.

## 🛠️ Stack & Infrastructure

- **Frontend**: React + Vite + Lucide Icons + Canvas Confetti + Web Audio API (Hosted on Cloudflare Pages)
- **Backend**: Django 5 + Django Channels + Daphne ASGI + Python 3.12 (Hosted on VPS via Docker Compose)
- **Database & Cache**: PostgreSQL 16 + Redis 7
- **AI Engine**: Google Gemini 3.5 Flash API

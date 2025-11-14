# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LeanEnglish is an IELTS vocabulary learning platform built with Vue 3 + Node.js + MySQL. The application provides learning modes, quiz functionality, and reading practice with AI-generated content and Aliyun TTS audio.

## Essential Commands

### Backend Development
```bash
cd backend

# Start backend server
npm start                      # Production mode
npm run dev                    # Development mode (with --watch)

# Database operations
npm run init-db               # Initialize database schema
npm run import                # Import vocabulary data into database
npm run scrape                # Scrape vocabulary from local file
npm run scrape-web            # Scrape from web source

# Data enhancement
npm run add-memory-field      # Add memory_tip field to database
npm run enhance-vocabulary    # Enhance words with phonetics, roots, memory tips
npm run enrich-words          # Enrich all words with additional data

# Reading feature
npm run generate-readings     # Generate reading articles
npm run generate-ai-readings  # Generate AI-powered reading content
npm run clear-readings        # Clear all readings

# Audio generation (Aliyun TTS)
npm run add-audio-field       # Add audio_url field to database
npm run generate-audio        # Generate TTS audio for readings and upload to OSS
npm run test-aliyun           # Test Aliyun TTS configuration
```

### Frontend Development
```bash
cd frontend

# Start frontend dev server
npm run dev                   # Runs on http://localhost:5174

# Build for production
npm run build                 # Output to dist/
npm run preview               # Preview production build
```

### Docker Deployment
```bash
cd docker
cp env.example .env           # Configure environment
docker compose build
docker compose up -d
docker compose exec backend npm run import  # First-time data import
```

## Architecture

### Data Flow Architecture

**Vocabulary Import Pipeline:**
1. `scripts/scraper.js` → Scrapes vocabulary from source (web or local JSON)
2. `scripts/import-data.js` → Imports to MySQL (`categories`, `learning_units`, `words`, `unit_words`)
3. `scripts/enhance-vocabulary.js` → Enriches words with phonetics, word roots, memory tips
4. API serves data → Frontend displays

**Audio Generation Pipeline:**
1. `scripts/generate-audio.js` → Splits long reading texts into chunks (<400 chars)
2. Aliyun NLS TTS API → Generates MP3 audio for each chunk
3. OSS Upload → Stores audio files to Aliyun OSS (`creatimage` bucket)
4. Database Update → Saves OSS URLs to `unit_readings.audio_url`

**Client-Server Flow:**
- Frontend (Vue 3) → API Client (`frontend/src/api/index.js`) → Backend Express Routes
- Backend routes in `backend/src/routes/`: `units.js`, `words.js`, `quiz.js`, `readings.js`, `categories.js`
- Database connection pool managed in `backend/src/config/database.js`

### Key Database Relationships

```
categories (1) ───→ (N) learning_units
                 └─→ (N) words

learning_units (1) ───→ (N) unit_words ───→ (N) words
               (1) ───→ (N) unit_readings

unit_readings (1) ───→ (N) reading_sentences
```

**Important Fields:**
- `words.audio_url`: Youdao Dict API for word pronunciation
- `words.example_audio_url`: TTS audio for example sentences
- `words.memory_tip`: Memory mnemonics for learning
- `unit_readings.audio_url`: Concatenated OSS URLs for full reading audio (format: `url1|url2|url3`)

### Frontend State Management

**Pinia Store (`frontend/src/stores/progress.js`):**
- Manages learning progress in localStorage (key: `ielts_vocabulary_progress`)
- Tracks per-unit: `learnedWords[]`, `quizScores[]`, `lastStudied`, `progress%`
- No backend persistence - fully client-side

**Router Structure (`frontend/src/router/index.js`):**
- `/` - Home (unit selection)
- `/learn/:unitId` - Learning mode with word cards
- `/quiz/:unitId` - Quiz mode (multiple choice, fill-in, listening)
- `/reading/:unitId` - Reading articles with sentence translations

### Backend Services

**Word Enhancement (`backend/src/services/wordEnhancer.js`):**
- Runtime enhancement of words if missing phonetics/memory tips
- Should be used sparingly; prefer batch enhancement via scripts

### Environment Configuration

**Backend `.env` (critical for production):**
```
DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME  # MySQL connection
ALIYUN_ACCESS_KEY_ID, ALIYUN_ACCESS_KEY_SECRET    # OSS & TTS
ALIYUN_TTS_APP_KEY                                 # NLS TTS AppKey
OSS_REGION, OSS_BUCKET                             # OSS storage
CORS_ORIGIN                                        # Frontend origin
```

**Frontend environment:**
- Uses `import.meta.env.VITE_API_BASE_URL` for API base (defaults to `/api`)
- Vite proxy not configured - expects backend on `http://localhost:3000` in dev

## Important Implementation Details

### Audio Text Chunking
- Aliyun TTS has a ~400 character limit per synchronous request
- `generate-audio.js` splits reading content by sentences, ensuring chunks don't exceed limit
- Multiple audio files are uploaded to OSS and URLs are stored pipe-separated (`url1|url2|url3`)
- Frontend must split these URLs and play sequentially

### Quiz Generation
- `POST /api/quiz/generate` with `{ unitId, count, types }`
- Types: `choice` (multiple choice), `fill` (fill-in-blank), `listening` (audio-based)
- Generates random questions from unit's words

### Static Audio Serving
- Backend serves local audio files from `backend/public/audio/` via `/audio/*`
- Used for cached word pronunciations (not currently implemented - uses Youdao API directly)

### Database Connection
- Uses `mysql2/promise` with connection pooling
- Pool config: 10 connection limit, keep-alive enabled
- All routes use async/await with the shared pool

## Common Pitfalls

1. **Aliyun TTS Token Expiry:** Tokens expire after ~1 hour. `generate-audio.js` caches tokens and auto-refreshes 5 minutes before expiry.

2. **Text Length Limits:** Never send texts >400 chars to TTS API. Always chunk first.

3. **OSS Region Mismatch:** Ensure `OSS_REGION` matches bucket region (`oss-cn-beijing` for `creatimage` bucket).

4. **Frontend Audio URLs:** Reading audio URLs in DB are pipe-separated. Must `.split('|')` and handle as array.

5. **Progress Store Loading:** Must call `loadFromStorage()` on app mount to restore localStorage data.

6. **CORS Issues:** Ensure backend `.env` has correct `CORS_ORIGIN` (e.g., `http://localhost:5174` for dev).

## Database Schema Notes

- All tables use `utf8mb4_unicode_ci` for proper emoji/Chinese support
- Timestamps: `created_at`, `updated_at` auto-managed
- Foreign keys: Cascading deletes for `learning_units` → `unit_words`, `unit_readings` → `reading_sentences`
- Indexes on: `category_id`, `word`, `difficulty_level`, `unit_id`, `reading_id`

## Script Execution Order (Initial Setup)

```bash
# 1. Initialize database structure
npm run init-db

# 2. Scrape vocabulary data
npm run scrape

# 3. Import to database
npm run import

# 4. Add enhancement fields (if not in schema)
npm run add-memory-field
npm run add-audio-field

# 5. Enhance vocabulary data
npm run enhance-vocabulary

# 6. Generate readings (optional)
npm run generate-ai-readings

# 7. Generate audio for readings (optional)
npm run generate-audio

# 8. Start server
npm start
```

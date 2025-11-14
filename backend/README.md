# IELTS Vocabulary Learning - Backend API

Backend API server for the IELTS Vocabulary Learning Platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Initialize database:
```bash
npm run init-db
```

4. Scrape vocabulary data:
```bash
npm run scrape
```

5. Import data to database:
```bash
npm run import
```

6. Start the server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

## API Endpoints

### Health Check
- `GET /api/health` - Check API and database status

### Units
- `GET /api/units` - List all learning units
- `GET /api/units/:id` - Get unit details
- `GET /api/units/:id/words` - Get all words in a unit

### Words
- `GET /api/words` - List words with pagination
- `GET /api/words/:id` - Get word details
- `GET /api/words/random?unitId=X&count=N` - Get random words

### Quiz
- `POST /api/quiz/generate` - Generate quiz questions
  - Body: `{ unitId, questionCount, types: ['multiple', 'fill', 'listening'] }`

### Audio
- `GET /audio/:filename.mp3` - Stream audio file

## Database Schema

- `categories` - Word categories
- `words` - Vocabulary words with details
- `learning_units` - Learning units (70 words per week)
- `unit_words` - Many-to-many relationship between units and words



Backend API server for the IELTS Vocabulary Learning Platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Initialize database:
```bash
npm run init-db
```

4. Scrape vocabulary data:
```bash
npm run scrape
```

5. Import data to database:
```bash
npm run import
```

6. Start the server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

## API Endpoints

### Health Check
- `GET /api/health` - Check API and database status

### Units
- `GET /api/units` - List all learning units
- `GET /api/units/:id` - Get unit details
- `GET /api/units/:id/words` - Get all words in a unit

### Words
- `GET /api/words` - List words with pagination
- `GET /api/words/:id` - Get word details
- `GET /api/words/random?unitId=X&count=N` - Get random words

### Quiz
- `POST /api/quiz/generate` - Generate quiz questions
  - Body: `{ unitId, questionCount, types: ['multiple', 'fill', 'listening'] }`

### Audio
- `GET /audio/:filename.mp3` - Stream audio file

## Database Schema

- `categories` - Word categories
- `words` - Vocabulary words with details
- `learning_units` - Learning units (70 words per week)
- `unit_words` - Many-to-many relationship between units and words


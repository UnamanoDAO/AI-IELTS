# IELTS Vocabulary Learning Platform - Setup Guide

## 📋 Prerequisites

- Node.js (v16 or higher)
- MySQL database access (Alibaba Cloud RDS configured)
- Modern web browser (Chrome, Firefox, Safari, or Edge)

## 🔧 Installation Steps

### Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment Variables

The `.env` file should already be created with your database credentials:

```env
DB_HOST=rm-2ze58tvrta52qmyz1lo.mysql.rds.aliyuncs.com
DB_PORT=3306
DB_USER=zhizhijuan
DB_PASSWORD=Xj196210*
DB_NAME=english
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5174
```

### Step 3: Initialize Database Schema

This will create all necessary tables in your MySQL database:

```bash
npm run init-db
```

Expected output:
```
✓ Database connected successfully
Executing: CREATE TABLE IF NOT EXISTS categories...
Executing: CREATE TABLE IF NOT EXISTS words...
Executing: CREATE TABLE IF NOT EXISTS learning_units...
Executing: CREATE TABLE IF NOT EXISTS unit_words...
✓ Database schema created successfully
```

### Step 4: Scrape and Import Vocabulary Data

First, scrape the vocabulary data:

```bash
npm run scrape
```

This will:
- Attempt to fetch data from https://hefengxian.github.io/my-ielts/data/vocabulary.json
- Fall back to parsing the `自然.md` file if needed
- Create `backend/data/categories.json` and `backend/data/words.json`

Then import the data into the database:

```bash
npm run import
```

This will:
- Import all categories and words
- Create learning units (70 words per unit)
- Link words to their respective units

Expected output:
```
Found 1 categories and 241 words
✓ Imported 1 categories
✓ Imported 241 words
✓ Created 4 learning units
✓ Data import completed successfully
```

### Step 5: Start Backend Server

```bash
npm start
```

Or for development mode with auto-reload:

```bash
npm run dev
```

Expected output:
```
✓ Database connected successfully
✓ Server running on http://localhost:3000
✓ Environment: development
✓ CORS enabled for: http://localhost:5174

API Endpoints:
  - Health: http://localhost:3000/api/health
  - Units:  http://localhost:3000/api/units
  - Words:  http://localhost:3000/api/words
  - Quiz:   http://localhost:3000/api/quiz
```

### Step 6: Install Frontend Dependencies

Open a new terminal:

```bash
cd frontend
npm install
```

### Step 7: Start Frontend Development Server

```bash
npm run dev
```

Expected output:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5174/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

### Step 8: Access the Application

Open your browser and navigate to:
```
http://localhost:5174
```

## ✅ Verification

### Test Backend API

1. Check health endpoint:
```bash
curl http://localhost:3000/api/health
```

Should return:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-11-09T..."
}
```

2. Check units endpoint:
```bash
curl http://localhost:3000/api/units
```

Should return list of learning units.

### Test Frontend

1. You should see the home page with unit cards
2. Click "开始学习" on any unit to enter learning mode
3. Click "开始测验" to take a quiz

## 🎯 Usage Guide

### Learning Mode Features

- **Navigate**: Use arrow keys (← →) or buttons to move between words
- **Mark as Learned**: Click the circle icon or press Space
- **Audio**: Click the speaker icon to hear pronunciation
- **Progress**: Your progress is automatically saved to browser localStorage

### Quiz Mode Features

- **Question Types**: 
  - Multiple Choice (40%): Select the correct English word
  - Fill in Blank (30%): Type the English word
  - Listening (30%): Listen and select/type the word
- **Feedback**: Immediate feedback after each answer
- **Review**: Detailed answer review at the end
- **Scoring**: Scores are saved to localStorage

## 🐛 Troubleshooting

### Database Connection Issues

If you see "Database connection failed":

1. Verify your database credentials in `.env`
2. Check if the database server is accessible
3. Ensure the database `english` exists

### Port Already in Use

If port 3000 or 5174 is already in use:

**Backend**: Change `PORT` in `backend/.env`
**Frontend**: Change `server.port` in `frontend/vite.config.js`

### CORS Issues

If you encounter CORS errors:

1. Make sure backend is running
2. Verify `CORS_ORIGIN` in `backend/.env` matches your frontend URL
3. Check proxy configuration in `frontend/vite.config.js`

### Audio Not Playing

If audio doesn't play:

1. Check browser console for errors
2. Verify audio URLs are accessible
3. Try a different browser (Chrome recommended)

## 📦 Building for Production

### Backend

```bash
cd backend
npm start
```

Set `NODE_ENV=production` in `.env` for production mode.

### Frontend

```bash
cd frontend
npm run build
```

This creates a `dist` folder with optimized static files that can be served by any web server.

## 🔄 Updating Vocabulary Data

To add more vocabulary or update existing data:

1. Edit the source data or modify `backend/scripts/scraper.js`
2. Run `npm run scrape` to regenerate data files
3. Run `npm run import` to reimport to database

Note: This will clear existing data and reimport everything.

## 📱 Accessing on Mobile

1. Find your computer's local IP address
2. Update `CORS_ORIGIN` in `backend/.env` to include your IP
3. Access `http://YOUR_IP:5174` from your mobile device

Example:
```env
CORS_ORIGIN=http://192.168.1.100:5174
```

## 🎓 Next Steps

1. Study words systematically unit by unit
2. Take quizzes to test your knowledge
3. Review incorrect answers
4. Track your progress over time

Happy learning! 📚✨



## 📋 Prerequisites

- Node.js (v16 or higher)
- MySQL database access (Alibaba Cloud RDS configured)
- Modern web browser (Chrome, Firefox, Safari, or Edge)

## 🔧 Installation Steps

### Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment Variables

The `.env` file should already be created with your database credentials:

```env
DB_HOST=rm-2ze58tvrta52qmyz1lo.mysql.rds.aliyuncs.com
DB_PORT=3306
DB_USER=zhizhijuan
DB_PASSWORD=Xj196210*
DB_NAME=english
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5174
```

### Step 3: Initialize Database Schema

This will create all necessary tables in your MySQL database:

```bash
npm run init-db
```

Expected output:
```
✓ Database connected successfully
Executing: CREATE TABLE IF NOT EXISTS categories...
Executing: CREATE TABLE IF NOT EXISTS words...
Executing: CREATE TABLE IF NOT EXISTS learning_units...
Executing: CREATE TABLE IF NOT EXISTS unit_words...
✓ Database schema created successfully
```

### Step 4: Scrape and Import Vocabulary Data

First, scrape the vocabulary data:

```bash
npm run scrape
```

This will:
- Attempt to fetch data from https://hefengxian.github.io/my-ielts/data/vocabulary.json
- Fall back to parsing the `自然.md` file if needed
- Create `backend/data/categories.json` and `backend/data/words.json`

Then import the data into the database:

```bash
npm run import
```

This will:
- Import all categories and words
- Create learning units (70 words per unit)
- Link words to their respective units

Expected output:
```
Found 1 categories and 241 words
✓ Imported 1 categories
✓ Imported 241 words
✓ Created 4 learning units
✓ Data import completed successfully
```

### Step 5: Start Backend Server

```bash
npm start
```

Or for development mode with auto-reload:

```bash
npm run dev
```

Expected output:
```
✓ Database connected successfully
✓ Server running on http://localhost:3000
✓ Environment: development
✓ CORS enabled for: http://localhost:5174

API Endpoints:
  - Health: http://localhost:3000/api/health
  - Units:  http://localhost:3000/api/units
  - Words:  http://localhost:3000/api/words
  - Quiz:   http://localhost:3000/api/quiz
```

### Step 6: Install Frontend Dependencies

Open a new terminal:

```bash
cd frontend
npm install
```

### Step 7: Start Frontend Development Server

```bash
npm run dev
```

Expected output:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5174/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

### Step 8: Access the Application

Open your browser and navigate to:
```
http://localhost:5174
```

## ✅ Verification

### Test Backend API

1. Check health endpoint:
```bash
curl http://localhost:3000/api/health
```

Should return:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-11-09T..."
}
```

2. Check units endpoint:
```bash
curl http://localhost:3000/api/units
```

Should return list of learning units.

### Test Frontend

1. You should see the home page with unit cards
2. Click "开始学习" on any unit to enter learning mode
3. Click "开始测验" to take a quiz

## 🎯 Usage Guide

### Learning Mode Features

- **Navigate**: Use arrow keys (← →) or buttons to move between words
- **Mark as Learned**: Click the circle icon or press Space
- **Audio**: Click the speaker icon to hear pronunciation
- **Progress**: Your progress is automatically saved to browser localStorage

### Quiz Mode Features

- **Question Types**: 
  - Multiple Choice (40%): Select the correct English word
  - Fill in Blank (30%): Type the English word
  - Listening (30%): Listen and select/type the word
- **Feedback**: Immediate feedback after each answer
- **Review**: Detailed answer review at the end
- **Scoring**: Scores are saved to localStorage

## 🐛 Troubleshooting

### Database Connection Issues

If you see "Database connection failed":

1. Verify your database credentials in `.env`
2. Check if the database server is accessible
3. Ensure the database `english` exists

### Port Already in Use

If port 3000 or 5174 is already in use:

**Backend**: Change `PORT` in `backend/.env`
**Frontend**: Change `server.port` in `frontend/vite.config.js`

### CORS Issues

If you encounter CORS errors:

1. Make sure backend is running
2. Verify `CORS_ORIGIN` in `backend/.env` matches your frontend URL
3. Check proxy configuration in `frontend/vite.config.js`

### Audio Not Playing

If audio doesn't play:

1. Check browser console for errors
2. Verify audio URLs are accessible
3. Try a different browser (Chrome recommended)

## 📦 Building for Production

### Backend

```bash
cd backend
npm start
```

Set `NODE_ENV=production` in `.env` for production mode.

### Frontend

```bash
cd frontend
npm run build
```

This creates a `dist` folder with optimized static files that can be served by any web server.

## 🔄 Updating Vocabulary Data

To add more vocabulary or update existing data:

1. Edit the source data or modify `backend/scripts/scraper.js`
2. Run `npm run scrape` to regenerate data files
3. Run `npm run import` to reimport to database

Note: This will clear existing data and reimport everything.

## 📱 Accessing on Mobile

1. Find your computer's local IP address
2. Update `CORS_ORIGIN` in `backend/.env` to include your IP
3. Access `http://YOUR_IP:5174` from your mobile device

Example:
```env
CORS_ORIGIN=http://192.168.1.100:5174
```

## 🎓 Next Steps

1. Study words systematically unit by unit
2. Take quizzes to test your knowledge
3. Review incorrect answers
4. Track your progress over time

Happy learning! 📚✨


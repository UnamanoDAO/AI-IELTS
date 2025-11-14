# Troubleshooting Guide

## Issue 1: Database Connection Error

### Error Message:
```
✗ Database initialization failed: Access denied for user ''@'localhost' (using password: NO)
```

### Cause:
The `.env` file is missing or not being read properly.

### Solution:

**Option A: Create .env file manually**

Create a file named `.env` in the `backend/` directory with this content:

```env
# Database Configuration
DB_HOST=rm-2ze58tvrta52qmyz1lo.mysql.rds.aliyuncs.com
DB_PORT=3306
DB_USER=zhizhijuan
DB_PASSWORD=Xj196210*
DB_NAME=english

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5174
```

**Option B: Use setup script**

```bash
cd backend
npm run setup-env
```

Then verify the file exists:
```bash
# Windows PowerShell
dir .env

# Should show the .env file
```

### Verify Database Connection:

After creating .env, test the connection:

```bash
npm run init-db
```

You should see:
```
✓ Database connected successfully
✓ Database schema created successfully
```

---

## Issue 2: Scraper Can't Find Markdown File

### Error Message:
```
Markdown file not found
```

### Cause:
The scraper is looking for `自然.md` but can't find it in the expected locations.

### Solution:

**Check file location:**

The `自然.md` file should be in the root directory: `D:\Buiding3\LeanEnglish\自然.md`

Verify it exists:
```bash
# From backend directory
cd ..
dir 自然.md
```

**Run scraper again:**

```bash
cd backend
npm run scrape
```

You should see:
```
Starting vocabulary scraping...
Error fetching vocabulary data: Request failed with status code 404
Attempting fallback parsing...
Using fallback data parsing method...
Found markdown file at: [path]
✓ Parsed 1 categories and 241 words from markdown
```

---

## Issue 3: No Words After Import

### Symptoms:
- Database initialized successfully
- Import completed but no words showing in frontend

### Solution:

1. Check if scraper created data files:
```bash
cd backend
dir data
```

You should see `categories.json` and `words.json`

2. If files are missing, run scraper first:
```bash
npm run scrape
```

3. Then run import:
```bash
npm run import
```

Expected output:
```
Found 1 categories and 241 words
✓ Imported 1 categories
✓ Imported 241 words
✓ Created 4 learning units
✓ Data import completed successfully
```

---

## Complete Setup Sequence

Here's the correct order to set everything up:

```bash
# 1. Navigate to backend
cd backend

# 2. Install dependencies
npm install

# 3. Create .env file (if needed)
npm run setup-env

# 4. Initialize database
npm run init-db

# 5. Scrape vocabulary data
npm run scrape

# 6. Import data to database
npm run import

# 7. Start backend server
npm start
```

In a **new terminal**:

```bash
# 8. Navigate to frontend
cd frontend

# 9. Install dependencies
npm install

# 10. Start frontend server
npm run dev
```

---

## Verification Steps

### 1. Check Backend Health

Open browser or use curl:
```bash
curl http://localhost:3000/api/health
```

Should return:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "..."
}
```

### 2. Check Units Data

```bash
curl http://localhost:3000/api/units
```

Should return list of learning units.

### 3. Check Frontend

Open browser to `http://localhost:5174`

You should see:
- Home page with unit cards
- Unit progress indicators
- "开始学习" and "开始测验" buttons

---

## Common Port Issues

### Backend Port 3000 Already in Use

Edit `backend/.env`:
```env
PORT=3001
```

### Frontend Port 5174 Already in Use

Edit `frontend/vite.config.js`:
```javascript
server: {
  port: 5174,  // Change this
  // ...
}
```

---

## Database Connection Issues

### Can't Connect to Alibaba Cloud Database

Check these:

1. **Network connectivity:**
   ```bash
   ping rm-2ze58tvrta52qmyz1lo.mysql.rds.aliyuncs.com
   ```

2. **Credentials:** Verify in `.env` file

3. **Firewall:** Ensure port 3306 is not blocked

4. **Database exists:** The `english` database must exist on the server

---

## Windows PowerShell Specific Issues

### Execution Policy Error

If you see "cannot be loaded because running scripts is disabled":

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### File Encoding Issues

Ensure `.env` file is saved with UTF-8 encoding (no BOM).

---

## Getting Help

If issues persist:

1. Check backend console for error messages
2. Check browser console (F12) for frontend errors
3. Verify all services are running:
   - Backend: http://localhost:3000
   - Frontend: http://localhost:5174
4. Try restarting both servers

---

## Quick Reset

If you want to start fresh:

```bash
# Backend
cd backend
rm -rf node_modules data
npm install
npm run setup-env
npm run init-db
npm run scrape
npm run import

# Frontend
cd ../frontend
rm -rf node_modules
npm install
```

Then start both servers again.



## Issue 1: Database Connection Error

### Error Message:
```
✗ Database initialization failed: Access denied for user ''@'localhost' (using password: NO)
```

### Cause:
The `.env` file is missing or not being read properly.

### Solution:

**Option A: Create .env file manually**

Create a file named `.env` in the `backend/` directory with this content:

```env
# Database Configuration
DB_HOST=rm-2ze58tvrta52qmyz1lo.mysql.rds.aliyuncs.com
DB_PORT=3306
DB_USER=zhizhijuan
DB_PASSWORD=Xj196210*
DB_NAME=english

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5174
```

**Option B: Use setup script**

```bash
cd backend
npm run setup-env
```

Then verify the file exists:
```bash
# Windows PowerShell
dir .env

# Should show the .env file
```

### Verify Database Connection:

After creating .env, test the connection:

```bash
npm run init-db
```

You should see:
```
✓ Database connected successfully
✓ Database schema created successfully
```

---

## Issue 2: Scraper Can't Find Markdown File

### Error Message:
```
Markdown file not found
```

### Cause:
The scraper is looking for `自然.md` but can't find it in the expected locations.

### Solution:

**Check file location:**

The `自然.md` file should be in the root directory: `D:\Buiding3\LeanEnglish\自然.md`

Verify it exists:
```bash
# From backend directory
cd ..
dir 自然.md
```

**Run scraper again:**

```bash
cd backend
npm run scrape
```

You should see:
```
Starting vocabulary scraping...
Error fetching vocabulary data: Request failed with status code 404
Attempting fallback parsing...
Using fallback data parsing method...
Found markdown file at: [path]
✓ Parsed 1 categories and 241 words from markdown
```

---

## Issue 3: No Words After Import

### Symptoms:
- Database initialized successfully
- Import completed but no words showing in frontend

### Solution:

1. Check if scraper created data files:
```bash
cd backend
dir data
```

You should see `categories.json` and `words.json`

2. If files are missing, run scraper first:
```bash
npm run scrape
```

3. Then run import:
```bash
npm run import
```

Expected output:
```
Found 1 categories and 241 words
✓ Imported 1 categories
✓ Imported 241 words
✓ Created 4 learning units
✓ Data import completed successfully
```

---

## Complete Setup Sequence

Here's the correct order to set everything up:

```bash
# 1. Navigate to backend
cd backend

# 2. Install dependencies
npm install

# 3. Create .env file (if needed)
npm run setup-env

# 4. Initialize database
npm run init-db

# 5. Scrape vocabulary data
npm run scrape

# 6. Import data to database
npm run import

# 7. Start backend server
npm start
```

In a **new terminal**:

```bash
# 8. Navigate to frontend
cd frontend

# 9. Install dependencies
npm install

# 10. Start frontend server
npm run dev
```

---

## Verification Steps

### 1. Check Backend Health

Open browser or use curl:
```bash
curl http://localhost:3000/api/health
```

Should return:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "..."
}
```

### 2. Check Units Data

```bash
curl http://localhost:3000/api/units
```

Should return list of learning units.

### 3. Check Frontend

Open browser to `http://localhost:5174`

You should see:
- Home page with unit cards
- Unit progress indicators
- "开始学习" and "开始测验" buttons

---

## Common Port Issues

### Backend Port 3000 Already in Use

Edit `backend/.env`:
```env
PORT=3001
```

### Frontend Port 5174 Already in Use

Edit `frontend/vite.config.js`:
```javascript
server: {
  port: 5174,  // Change this
  // ...
}
```

---

## Database Connection Issues

### Can't Connect to Alibaba Cloud Database

Check these:

1. **Network connectivity:**
   ```bash
   ping rm-2ze58tvrta52qmyz1lo.mysql.rds.aliyuncs.com
   ```

2. **Credentials:** Verify in `.env` file

3. **Firewall:** Ensure port 3306 is not blocked

4. **Database exists:** The `english` database must exist on the server

---

## Windows PowerShell Specific Issues

### Execution Policy Error

If you see "cannot be loaded because running scripts is disabled":

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### File Encoding Issues

Ensure `.env` file is saved with UTF-8 encoding (no BOM).

---

## Getting Help

If issues persist:

1. Check backend console for error messages
2. Check browser console (F12) for frontend errors
3. Verify all services are running:
   - Backend: http://localhost:3000
   - Frontend: http://localhost:5174
4. Try restarting both servers

---

## Quick Reset

If you want to start fresh:

```bash
# Backend
cd backend
rm -rf node_modules data
npm install
npm run setup-env
npm run init-db
npm run scrape
npm run import

# Frontend
cd ../frontend
rm -rf node_modules
npm install
```

Then start both servers again.


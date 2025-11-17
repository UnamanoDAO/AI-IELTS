import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { testConnection } from './config/database.js'
import unitsRouter from './routes/units.js'
import wordsRouter from './routes/words.js'
import quizRouter from './routes/quiz.js'
import categoriesRouter from './routes/categories.js'
import readingsRouter from './routes/readings.js'
import assistantRouter from './routes/assistant.js'
import authRouter from './routes/auth.js'
import vocabularyBookRouter from './routes/vocabulary-book.js'
import vocabularyTestRouter from './routes/vocabulary-test.js'
import articlesRouter from './routes/articles.js'
import vocabularyRouter from './routes/vocabulary.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
  })
)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/audio', express.static(path.join(__dirname, '../public/audio')))

app.use('/api/categories', categoriesRouter)
app.use('/api/units', unitsRouter)
app.use('/api/words', wordsRouter)
app.use('/api/quiz', quizRouter)
app.use('/api', readingsRouter)
app.use('/api/assistant', assistantRouter)
app.use('/api/auth', authRouter)
app.use('/api/vocabulary-book', vocabularyBookRouter)
app.use('/api/vocabulary-test', vocabularyTestRouter)
app.use('/api/articles', articlesRouter)
app.use('/api/vocabulary', vocabularyRouter)

app.get('/api/health', async (req, res) => {
  const connected = await testConnection()
  res.json({
    status: 'ok',
    database: connected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  })
})

app.get('/', (req, res) => {
  res.json({
    message: 'IELTS Vocabulary Learning API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      categories: '/api/categories',
      units: '/api/units',
      words: '/api/words',
      quiz: '/api/quiz',
      auth: '/api/auth',
      vocabularyBook: '/api/vocabulary-book',
      vocabularyTest: '/api/vocabulary-test',
      articles: '/api/articles',
      vocabulary: '/api/vocabulary'
    }
  })
})

app.use((err, req, res, next) => {
  console.error('Error handler:', err)
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  })
})

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found'
  })
})

async function startServer() {
  const connected = await testConnection()
  if (!connected) {
    console.error('Failed to connect to database. Exiting...')
    process.exit(1)
  }

  app.listen(PORT, () => {
    console.log(`\n✓ Server running on http://localhost:${PORT}`)
    console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`)
    console.log(`✓ CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`)
  })
}

startServer()
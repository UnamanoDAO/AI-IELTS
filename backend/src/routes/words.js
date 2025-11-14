import express from 'express'
import pool from '../config/database.js'
import { enhanceWordIfNeeded } from '../services/wordEnhancer.js'

const router = express.Router()

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, categoryId, search } = req.query
    const pageNumber = Math.max(Number(page) || 1, 1)
    const pageSize = Math.max(Number(limit) || 50, 1)
    const offset = (pageNumber - 1) * pageSize

    const filters = []
    const filterParams = []

    if (categoryId) {
      filters.push('w.category_id = ?')
      filterParams.push(categoryId)
    }

    if (search) {
      const keyword = `%${search}%`
      filters.push(
        '(w.word LIKE ? OR w.base_form LIKE ? OR w.variants LIKE ? OR w.chinese_meaning LIKE ? OR w.word_root LIKE ?)'
      )
      filterParams.push(keyword, keyword, keyword, keyword, keyword)
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : ''

    const dataQuery = `
      SELECT
        w.id,
        w.word,
        w.base_form,
        w.variants,
        w.phonetic,
        w.part_of_speech,
        w.chinese_meaning,
        w.word_root,
        w.example_sentence,
        w.example_translation,
        w.audio_url,
        w.example_audio_url,
        w.memory_tip,
        w.difficulty_level,
        w.source_extra,
        c.name AS category_name
      FROM words w
      LEFT JOIN categories c ON w.category_id = c.id
      ${whereClause}
      ORDER BY w.id ASC
      LIMIT ? OFFSET ?
    `

    const [rows] = await pool.query(dataQuery, [...filterParams, pageSize, offset])

    const countQuery = `SELECT COUNT(*) AS total FROM words w ${whereClause}`
    const [countRows] = await pool.query(countQuery, filterParams)

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total: Number(countRows[0].total)
      }
    })
  } catch (error) {
    next(error)
  }
})

router.get('/random', async (req, res, next) => {
  try {
    const { unitId, count = 10 } = req.query
    if (!unitId) {
      return res.status(400).json({ success: false, error: 'unitId 参数必需' })
    }

    const [rows] = await pool.query(
      `SELECT w.id, w.word, w.chinese_meaning, w.phonetic, w.audio_url
       FROM words w
       INNER JOIN unit_words uw ON w.id = uw.word_id
       WHERE uw.unit_id = ?
       ORDER BY RAND()
       LIMIT ?`,
      [unitId, Number(count)]
    )

    res.json({ success: true, data: rows })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const [rows] = await pool.query(
      `SELECT w.*, c.name AS category_name
       FROM words w
       LEFT JOIN categories c ON w.category_id = c.id
       WHERE w.id = ?`,
      [id]
    )

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Word not found' })
    }

    const enhancedWord = await enhanceWordIfNeeded(rows[0])

    res.json({ success: true, data: enhancedWord })
  } catch (error) {
    next(error)
  }
})

export default router
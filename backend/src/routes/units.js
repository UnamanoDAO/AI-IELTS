import express from 'express'
import pool from '../config/database.js'

const router = express.Router()

router.get('/', async (req, res, next) => {
  try {
    const { categoryId } = req.query
    const filters = []
    const params = []

    if (categoryId) {
      filters.push('u.category_id = ?')
      params.push(categoryId)
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : ''

    const [rows] = await pool.query(
      `SELECT
         u.id,
         u.category_id,
         u.unit_name,
         u.unit_code,
         u.unit_number,
         u.order_in_category,
         u.description,
         u.estimated_days,
         u.total_words,
         u.created_at,
         c.name AS category_name,
         c.slug AS category_slug,
         c.bundle_key AS category_key
       FROM learning_units u
       LEFT JOIN categories c ON u.category_id = c.id
       ${whereClause}
       ORDER BY c.order_index ASC, u.order_in_category ASC, u.unit_number ASC`,
      params
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
      `SELECT
         u.id,
         u.category_id,
         u.unit_name,
         u.unit_code,
         u.unit_number,
         u.order_in_category,
         u.description,
         u.estimated_days,
         u.total_words,
         u.created_at,
         c.name AS category_name,
         c.slug AS category_slug,
         c.bundle_key AS category_key
       FROM learning_units u
       LEFT JOIN categories c ON u.category_id = c.id
       WHERE u.id = ?`,
      [id]
    )

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Unit not found' })
    }

    res.json({ success: true, data: rows[0] })
  } catch (error) {
    next(error)
  }
})

router.get('/:id/words', async (req, res, next) => {
  try {
    const { id } = req.params

    const [unitRows] = await pool.query('SELECT id FROM learning_units WHERE id = ?', [id])

    if (!unitRows.length) {
      return res.status(404).json({ success: false, error: 'Unit not found' })
    }

    const [wordRows] = await pool.query(
      `SELECT
         w.id,
         w.category_id,
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
         uw.order_in_unit,
         c.name AS category_name
       FROM words w
       INNER JOIN unit_words uw ON w.id = uw.word_id
       LEFT JOIN categories c ON w.category_id = c.id
       WHERE uw.unit_id = ?
       ORDER BY uw.order_in_unit ASC`,
      [id]
    )

    res.json({ success: true, data: wordRows })
  } catch (error) {
    next(error)
  }
})

export default router

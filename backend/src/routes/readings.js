import express from 'express'
import pool from '../config/database.js'

const router = express.Router()

// Get all reading articles for a specific unit
router.get('/units/:unitId/readings', async (req, res, next) => {
  try {
    const { unitId } = req.params

    const [rows] = await pool.query(
      `SELECT 
        id,
        unit_id,
        title,
        order_index,
        created_at
      FROM unit_readings
      WHERE unit_id = ?
      ORDER BY order_index ASC`,
      [unitId]
    )

    res.json({
      success: true,
      data: rows
    })
  } catch (error) {
    next(error)
  }
})

// Get a specific reading article with sentences and translations
router.get('/readings/:readingId', async (req, res, next) => {
  try {
    const { readingId } = req.params

    // Get reading article details
    const [readingRows] = await pool.query(
      `SELECT 
        r.id,
        r.unit_id,
        r.title,
        r.content,
        r.audio_url,
        r.order_index,
        u.unit_name,
        u.unit_code
      FROM unit_readings r
      LEFT JOIN learning_units u ON r.unit_id = u.id
      WHERE r.id = ?`,
      [readingId]
    )

    if (!readingRows.length) {
      return res.status(404).json({
        success: false,
        error: 'Reading article not found'
      })
    }

    // Get sentences with translations
    const [sentenceRows] = await pool.query(
      `SELECT 
        id,
        sentence_text,
        translation,
        order_index
      FROM reading_sentences
      WHERE reading_id = ?
      ORDER BY order_index ASC`,
      [readingId]
    )

    const reading = readingRows[0]
    reading.sentences = sentenceRows

    res.json({
      success: true,
      data: reading
    })
  } catch (error) {
    next(error)
  }
})

export default router


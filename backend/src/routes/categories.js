import express from 'express'
import pool from '../config/database.js'

const router = express.Router()

// GET /api/categories - list all categories
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         id,
         bundle_key,
         name,
         slug,
         description,
         order_index,
         audio_filename,
         total_groups,
         total_words,
         created_at
       FROM categories
       ORDER BY order_index ASC, id ASC`
    )

    res.json({
      success: true,
      data: rows
    })
  } catch (error) {
    next(error)
  }
})

export default router


























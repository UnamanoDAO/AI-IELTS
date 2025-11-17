/**
 * User Vocabulary Routes
 * Manages user's personal word book
 */

import express from 'express';
import db from '../config/database.js';

const router = express.Router();

/**
 * GET /api/vocabulary
 * Get all words in user's vocabulary book
 * Query params: mastery_level?, article_id?
 */
router.get('/', async (req, res) => {
  try {
    const { mastery_level, article_id } = req.query;

    let query = 'SELECT * FROM user_vocabulary WHERE 1=1';
    const params = [];

    if (mastery_level) {
      query += ' AND mastery_level = ?';
      params.push(mastery_level);
    }

    if (article_id) {
      query += ' AND article_id = ?';
      params.push(article_id);
    }

    query += ' ORDER BY added_at DESC';

    const [words] = await db.execute(query, params);
    res.json(words);
  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    res.status(500).json({ error: 'Failed to fetch vocabulary' });
  }
});

/**
 * GET /api/vocabulary/stats
 * Get vocabulary statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const [stats] = await db.execute(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN mastery_level = 'new' THEN 1 ELSE 0 END) as new_words,
        SUM(CASE WHEN mastery_level = 'learning' THEN 1 ELSE 0 END) as learning,
        SUM(CASE WHEN mastery_level = 'familiar' THEN 1 ELSE 0 END) as familiar,
        SUM(CASE WHEN mastery_level = 'mastered' THEN 1 ELSE 0 END) as mastered
      FROM user_vocabulary
    `);

    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching vocabulary stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * POST /api/vocabulary
 * Add a word to vocabulary book
 * Body: { word, translation, article_id?, context_sentence? }
 */
router.post('/', async (req, res) => {
  try {
    const { word, translation, article_id, context_sentence } = req.body;

    if (!word || !translation) {
      return res.status(400).json({ error: 'Word and translation are required' });
    }

    const normalizedWord = word.toLowerCase().trim();

    // Check if word already exists
    const [existing] = await db.execute(
      'SELECT id FROM user_vocabulary WHERE word = ?',
      [normalizedWord]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        error: 'Word already exists in vocabulary',
        id: existing[0].id
      });
    }

    // Add new word
    const [result] = await db.execute(
      `INSERT INTO user_vocabulary (word, translation, article_id, context_sentence)
       VALUES (?, ?, ?, ?)`,
      [normalizedWord, translation, article_id || null, context_sentence || null]
    );

    const [newWord] = await db.execute(
      'SELECT * FROM user_vocabulary WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newWord[0]);
  } catch (error) {
    console.error('Error adding word to vocabulary:', error);
    res.status(500).json({ error: 'Failed to add word' });
  }
});

/**
 * PUT /api/vocabulary/:id
 * Update a vocabulary word
 * Body: { mastery_level?, review_count? }
 */
router.put('/:id', async (req, res) => {
  try {
    const { mastery_level, review_count } = req.body;
    const wordId = req.params.id;

    const updates = [];
    const values = [];

    if (mastery_level !== undefined) {
      updates.push('mastery_level = ?');
      values.push(mastery_level);
    }

    if (review_count !== undefined) {
      updates.push('review_count = ?');
      values.push(review_count);
    }

    // Always update last_reviewed_at when updating
    updates.push('last_reviewed_at = NOW()');

    if (updates.length === 1) { // Only last_reviewed_at
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(wordId);

    await db.execute(
      `UPDATE user_vocabulary SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [updated] = await db.execute(
      'SELECT * FROM user_vocabulary WHERE id = ?',
      [wordId]
    );

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Word not found' });
    }

    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating vocabulary word:', error);
    res.status(500).json({ error: 'Failed to update word' });
  }
});

/**
 * DELETE /api/vocabulary/:id
 * Remove a word from vocabulary book
 */
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.execute(
      'DELETE FROM user_vocabulary WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Word not found' });
    }

    res.json({ message: 'Word removed from vocabulary' });
  } catch (error) {
    console.error('Error deleting vocabulary word:', error);
    res.status(500).json({ error: 'Failed to delete word' });
  }
});

/**
 * POST /api/vocabulary/:id/review
 * Mark a word as reviewed (increments review_count)
 */
router.post('/:id/review', async (req, res) => {
  try {
    const wordId = req.params.id;

    await db.execute(
      `UPDATE user_vocabulary
       SET review_count = review_count + 1, last_reviewed_at = NOW()
       WHERE id = ?`,
      [wordId]
    );

    const [updated] = await db.execute(
      'SELECT * FROM user_vocabulary WHERE id = ?',
      [wordId]
    );

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Word not found' });
    }

    res.json(updated[0]);
  } catch (error) {
    console.error('Error marking word as reviewed:', error);
    res.status(500).json({ error: 'Failed to mark as reviewed' });
  }
});

/**
 * POST /api/vocabulary/check
 * Check if a word exists in vocabulary
 * Body: { word }
 */
router.post('/check', async (req, res) => {
  try {
    const { word } = req.body;

    if (!word) {
      return res.status(400).json({ error: 'Word is required' });
    }

    const normalizedWord = word.toLowerCase().trim();

    const [result] = await db.execute(
      'SELECT id, mastery_level FROM user_vocabulary WHERE word = ?',
      [normalizedWord]
    );

    res.json({
      exists: result.length > 0,
      data: result.length > 0 ? result[0] : null
    });
  } catch (error) {
    console.error('Error checking word:', error);
    res.status(500).json({ error: 'Failed to check word' });
  }
});

export default router;

/**
 * Custom Articles Routes
 * Handles user-imported reading comprehension articles
 */

import express from 'express';
import db from '../config/database.js';
import aliyunTranslator from '../services/aliyunTranslator.js';

const router = express.Router();

/**
 * GET /api/articles
 * Get all custom articles
 */
router.get('/', async (req, res) => {
  try {
    const [articles] = await db.execute(
      'SELECT * FROM custom_articles ORDER BY created_at DESC'
    );
    res.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

/**
 * GET /api/articles/:id
 * Get a specific article by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const [articles] = await db.execute(
      'SELECT * FROM custom_articles WHERE id = ?',
      [req.params.id]
    );

    if (articles.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(articles[0]);
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

/**
 * POST /api/articles
 * Create a new custom article
 * Body: { title, content, source?, difficulty? }
 */
router.post('/', async (req, res) => {
  try {
    const { title, content, source, difficulty = 'intermediate' } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Calculate word count
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

    const [result] = await db.execute(
      `INSERT INTO custom_articles (title, content, source, difficulty, word_count)
       VALUES (?, ?, ?, ?, ?)`,
      [title, content, source || null, difficulty, wordCount]
    );

    const [newArticle] = await db.execute(
      'SELECT * FROM custom_articles WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newArticle[0]);
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ error: 'Failed to create article' });
  }
});

/**
 * PUT /api/articles/:id
 * Update an existing article
 */
router.put('/:id', async (req, res) => {
  try {
    const { title, content, source, difficulty } = req.body;
    const articleId = req.params.id;

    // Check if article exists
    const [existing] = await db.execute(
      'SELECT id FROM custom_articles WHERE id = ?',
      [articleId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (content !== undefined) {
      updates.push('content = ?');
      values.push(content);
      // Recalculate word count
      const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
      updates.push('word_count = ?');
      values.push(wordCount);
    }
    if (source !== undefined) {
      updates.push('source = ?');
      values.push(source);
    }
    if (difficulty !== undefined) {
      updates.push('difficulty = ?');
      values.push(difficulty);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(articleId);

    await db.execute(
      `UPDATE custom_articles SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [updated] = await db.execute(
      'SELECT * FROM custom_articles WHERE id = ?',
      [articleId]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({ error: 'Failed to update article' });
  }
});

/**
 * DELETE /api/articles/:id
 * Delete an article
 */
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.execute(
      'DELETE FROM custom_articles WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

/**
 * POST /api/articles/:id/translate
 * Get translation for a word from the article
 * Body: { word, sentence? }
 */
router.post('/:id/translate', async (req, res) => {
  try {
    const { word, sentence } = req.body;

    if (!word) {
      return res.status(400).json({ error: 'Word is required' });
    }

    const normalizedWord = word.toLowerCase().trim();

    // Check cache first
    const [cached] = await db.execute(
      'SELECT * FROM word_translations WHERE word = ?',
      [normalizedWord]
    );

    if (cached.length > 0) {
      return res.json(cached[0]);
    }

    // Get translation from Aliyun
    const definition = await aliyunTranslator.getWordDefinition(normalizedWord);

    // Store in cache
    await db.execute(
      `INSERT INTO word_translations (word, translation, phonetic, word_type)
       VALUES (?, ?, ?, ?)`,
      [definition.word, definition.translation, definition.phonetic, definition.wordType]
    );

    res.json(definition);
  } catch (error) {
    console.error('Error translating word:', error);
    res.status(500).json({ error: 'Failed to translate word' });
  }
});

export default router;

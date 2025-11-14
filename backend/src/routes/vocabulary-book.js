import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { analyzeWord } from '../services/wordAnalyzer.js';

const router = express.Router();

// Get all words in user's vocabulary book
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { masteredOnly, unmasteredOnly } = req.query;

    let query = 'SELECT * FROM user_vocabulary_book WHERE user_id = ?';
    const params = [userId];

    if (masteredOnly === 'true') {
      query += ' AND is_mastered = TRUE';
    } else if (unmasteredOnly === 'true') {
      query += ' AND is_mastered = FALSE';
    }

    query += ' ORDER BY added_at DESC';

    const [words] = await pool.query(query, params);

    // Parse JSON fields (handle both string and already-parsed JSON)
    const parsedWords = words.map(word => ({
      ...word,
      usage_examples: typeof word.usage_examples === 'string'
        ? (word.usage_examples ? JSON.parse(word.usage_examples) : [])
        : (word.usage_examples || [])
    }));

    res.json({
      total: parsedWords.length,
      words: parsedWords
    });
  } catch (error) {
    console.error('Get vocabulary book error:', error);
    res.status(500).json({ error: 'Failed to get vocabulary book' });
  }
});

// Get a single word by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    const [words] = await pool.query(
      'SELECT * FROM user_vocabulary_book WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (words.length === 0) {
      return res.status(404).json({ error: 'Word not found' });
    }

    const word = words[0];
    // Parse JSON field (handle both string and already-parsed JSON)
    word.usage_examples = typeof word.usage_examples === 'string'
      ? (word.usage_examples ? JSON.parse(word.usage_examples) : [])
      : (word.usage_examples || []);

    res.json(word);
  } catch (error) {
    console.error('Get word error:', error);
    res.status(500).json({ error: 'Failed to get word' });
  }
});

// Add a new word to vocabulary book (with AI analysis in background)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { word } = req.body;

    if (!word || typeof word !== 'string' || word.trim().length === 0) {
      return res.status(400).json({ error: 'Word is required' });
    }

    const wordLower = word.trim().toLowerCase();

    // Check if word already exists for this user
    const [existing] = await pool.query(
      'SELECT id FROM user_vocabulary_book WHERE user_id = ? AND word = ?',
      [userId, wordLower]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Word already exists in your vocabulary book' });
    }

    // Insert word with placeholder data first (instant response)
    const [result] = await pool.query(
      `INSERT INTO user_vocabulary_book
       (user_id, word, phonetic, pronunciation_audio_url, chinese_meaning, word_breakdown,
        memory_technique, derived_words, common_usage, usage_examples)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        wordLower,
        '', // Will be filled by background task
        '', // pronunciation_audio_url - will be filled by background task
        'AI 分析中...',
        '',
        '',
        '',
        '',
        JSON.stringify([]) // Stringify for mysql2 - it will be stored as JSON
      ]
    );

    const wordId = result.insertId;

    // Respond immediately to user
    res.status(201).json({
      message: 'Word added successfully, AI analysis in progress',
      id: wordId,
      word: wordLower,
      analyzing: true
    });

    // Run AI analysis in background (non-blocking)
    (async () => {
      try {
        console.log(`🔍 Starting AI analysis for word: ${wordLower} (ID: ${wordId})`);

        // Add timeout protection (60 seconds)
        const analysisPromise = analyzeWord(wordLower);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI analysis timeout after 60 seconds')), 60000)
        );

        const analysis = await Promise.race([analysisPromise, timeoutPromise]);

        // Update the word with AI analysis results
        await pool.query(
          `UPDATE user_vocabulary_book
           SET phonetic = ?, pronunciation_audio_url = ?, chinese_meaning = ?,
               word_breakdown = ?, memory_technique = ?, derived_words = ?,
               common_usage = ?, usage_examples = ?
           WHERE id = ? AND user_id = ?`,
          [
            analysis.phonetic,
            analysis.pronunciation_audio_url,
            analysis.chinese_meaning,
            analysis.word_breakdown,
            analysis.memory_technique,
            analysis.derived_words,
            analysis.common_usage,
            JSON.stringify(analysis.usage_examples), // Stringify for mysql2
            wordId,
            userId
          ]
        );
        console.log(`✅ AI analysis completed for word: ${wordLower} (ID: ${wordId})`);
      } catch (error) {
        console.error(`❌ Background AI analysis failed for word: ${wordLower}`, error.message);

        // 检查是否是拼写错误
        let errorMessage = `AI 分析失败: ${error.message}`;
        if (error.spellingError) {
          errorMessage = `⚠️ 拼写错误：单词 "${wordLower}" 未在词典中找到，请检查拼写是否正确`;
        }

        // Update with error message
        await pool.query(
          `UPDATE user_vocabulary_book
           SET chinese_meaning = ?
           WHERE id = ? AND user_id = ?`,
          [errorMessage, wordId, userId]
        );
      }
    })();

  } catch (error) {
    console.error('Add word error:', error);
    res.status(500).json({ error: 'Failed to add word: ' + error.message });
  }
});

// Mark a word as mastered/unmastered
router.patch('/:id/mastered', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const { is_mastered } = req.body;

    if (typeof is_mastered !== 'boolean') {
      return res.status(400).json({ error: 'is_mastered must be a boolean' });
    }

    const [result] = await pool.query(
      `UPDATE user_vocabulary_book
       SET is_mastered = ?, mastered_at = ?
       WHERE id = ? AND user_id = ?`,
      [is_mastered, is_mastered ? new Date() : null, id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Word not found' });
    }

    res.json({ message: 'Word status updated successfully' });
  } catch (error) {
    console.error('Update word mastered error:', error);
    res.status(500).json({ error: 'Failed to update word status' });
  }
});

// Regenerate word analysis with AI
router.post('/:id/regenerate', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    // First, check if word exists
    const [words] = await pool.query(
      'SELECT word FROM user_vocabulary_book WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (words.length === 0) {
      return res.status(404).json({ error: 'Word not found' });
    }

    const word = words[0].word;

    // Update word with placeholder (indicating regeneration in progress)
    await pool.query(
      `UPDATE user_vocabulary_book
       SET chinese_meaning = ?, phonetic = ?, word_breakdown = ?,
           memory_technique = ?, derived_words = ?, common_usage = ?,
           usage_examples = ?, pronunciation_audio_url = ?
       WHERE id = ? AND user_id = ?`,
      ['AI 分析中...', '', '', '', '', '', JSON.stringify([]), '', id, userId]
    );

    // Respond immediately
    res.json({
      message: 'Regenerating word analysis',
      id: parseInt(id),
      word: word,
      analyzing: true
    });

    // Run AI analysis in background
    (async () => {
      try {
        console.log(`🔄 Regenerating analysis for word: ${word} (ID: ${id})`);

        // Add timeout protection (60 seconds)
        const analysisPromise = analyzeWord(word);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI analysis timeout after 60 seconds')), 60000)
        );

        const analysis = await Promise.race([analysisPromise, timeoutPromise]);

        // Update with new analysis results
        await pool.query(
          `UPDATE user_vocabulary_book
           SET phonetic = ?, pronunciation_audio_url = ?, chinese_meaning = ?,
               word_breakdown = ?, memory_technique = ?, derived_words = ?,
               common_usage = ?, usage_examples = ?
           WHERE id = ? AND user_id = ?`,
          [
            analysis.phonetic,
            analysis.pronunciation_audio_url,
            analysis.chinese_meaning,
            analysis.word_breakdown,
            analysis.memory_technique,
            analysis.derived_words,
            analysis.common_usage,
            JSON.stringify(analysis.usage_examples),
            id,
            userId
          ]
        );
        console.log(`✅ Regeneration completed for word: ${word} (ID: ${id})`);
      } catch (error) {
        console.error(`❌ Regeneration failed for word: ${word}`, error.message);

        // 检查是否是拼写错误
        let errorMessage = `AI 分析失败: ${error.message}`;
        if (error.spellingError) {
          errorMessage = `⚠️ 拼写错误：单词 "${word}" 未在词典中找到，请检查拼写是否正确`;
        }

        await pool.query(
          `UPDATE user_vocabulary_book
           SET chinese_meaning = ?
           WHERE id = ? AND user_id = ?`,
          [errorMessage, id, userId]
        );
      }
    })();

  } catch (error) {
    console.error('Regenerate word error:', error);
    res.status(500).json({ error: 'Failed to regenerate word: ' + error.message });
  }
});

// Delete a word from vocabulary book
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM user_vocabulary_book WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Word not found' });
    }

    res.json({ message: 'Word deleted successfully' });
  } catch (error) {
    console.error('Delete word error:', error);
    res.status(500).json({ error: 'Failed to delete word' });
  }
});

// Get statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;

    const [stats] = await pool.query(
      `SELECT
        COUNT(*) as total_words,
        SUM(CASE WHEN is_mastered = TRUE THEN 1 ELSE 0 END) as mastered_count,
        SUM(CASE WHEN is_mastered = FALSE THEN 1 ELSE 0 END) as unmastered_count
       FROM user_vocabulary_book
       WHERE user_id = ?`,
      [userId]
    );

    res.json(stats[0]);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

export default router;

import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Generate matching game quiz (5 words from user's unmastered vocabulary)
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { count = 5 } = req.body;

    if (count < 2 || count > 10) {
      return res.status(400).json({ error: 'Count must be between 2 and 10' });
    }

    // Get unmastered words from user's vocabulary book
    const [words] = await pool.query(
      `SELECT id, word, chinese_meaning
       FROM user_vocabulary_book
       WHERE user_id = ? AND is_mastered = FALSE
       ORDER BY RAND()
       LIMIT ?`,
      [userId, count]
    );

    if (words.length < 2) {
      return res.status(400).json({
        error: 'Not enough words in vocabulary book. Add at least 2 unmastered words to start quiz.'
      });
    }

    // Prepare quiz data
    const englishWords = words.map(w => ({
      id: w.id,
      word: w.word
    }));

    const chineseMeanings = words.map(w => ({
      id: w.id,
      meaning: w.chinese_meaning
    }));

    // Shuffle Chinese meanings
    const shuffledMeanings = shuffleArray([...chineseMeanings]);

    res.json({
      quizId: Date.now().toString(),
      englishWords,
      chineseMeanings: shuffledMeanings,
      totalQuestions: words.length
    });
  } catch (error) {
    console.error('Generate quiz error:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

// Submit quiz answers and mark mastered words
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { answers, testDuration, failedWordIds = [] } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'Answers array is required' });
    }

    let correctCount = 0;
    const masteredWordIds = [];

    // Check each answer
    for (const answer of answers) {
      const { wordId, selectedMeaningId } = answer;

      if (!wordId || !selectedMeaningId) {
        continue;
      }

      // Verify the answer is correct
      const [words] = await pool.query(
        `SELECT id FROM user_vocabulary_book WHERE id = ? AND user_id = ?`,
        [wordId, userId]
      );

      if (words.length > 0 && wordId === selectedMeaningId) {
        correctCount++;

        // Only mark as mastered if the word was NEVER failed during the test
        if (!failedWordIds.includes(wordId)) {
          masteredWordIds.push(wordId);
        }
      }
    }

    // Mark correct answers (that were never failed) as mastered
    if (masteredWordIds.length > 0) {
      await pool.query(
        `UPDATE user_vocabulary_book
         SET is_mastered = TRUE, mastered_at = NOW()
         WHERE id IN (?) AND user_id = ?`,
        [masteredWordIds, userId]
      );
    }

    // Save test result
    await pool.query(
      `INSERT INTO vocabulary_test_results
       (user_id, total_questions, correct_count, test_duration_seconds, words_tested)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        answers.length,
        correctCount,
        testDuration || 0,
        JSON.stringify(answers.map(a => a.wordId))
      ]
    );

    res.json({
      message: 'Quiz submitted successfully',
      totalQuestions: answers.length,
      correctCount,
      masteredCount: masteredWordIds.length,
      accuracy: ((correctCount / answers.length) * 100).toFixed(1) + '%'
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

// Get test history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { limit = 10 } = req.query;

    const [history] = await pool.query(
      `SELECT id, test_date, total_questions, correct_count, test_duration_seconds
       FROM vocabulary_test_results
       WHERE user_id = ?
       ORDER BY test_date DESC
       LIMIT ?`,
      [userId, parseInt(limit)]
    );

    res.json({ history });
  } catch (error) {
    console.error('Get test history error:', error);
    res.status(500).json({ error: 'Failed to get test history' });
  }
});

// Utility function to shuffle array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default router;

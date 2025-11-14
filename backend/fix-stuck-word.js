import pool from './src/config/database.js';
import { analyzeWord } from './src/services/wordAnalyzer.js';

async function fixStuckWord() {
  try {
    console.log('🔧 Finding stuck words...');

    // Find words stuck in "AI 分析中..." state
    const [stuckWords] = await pool.query(
      `SELECT id, word, user_id FROM user_vocabulary_book
       WHERE chinese_meaning LIKE '%分析中%' OR chinese_meaning LIKE '%分析失败%'`
    );

    if (stuckWords.length === 0) {
      console.log('✅ No stuck words found!');
      await pool.end();
      return;
    }

    console.log(`Found ${stuckWords.length} stuck word(s):`);
    stuckWords.forEach(w => console.log(`  - ID: ${w.id}, Word: ${w.word}`));

    for (const wordData of stuckWords) {
      console.log(`\n🔄 Processing word: ${wordData.word} (ID: ${wordData.id})`);

      try {
        // Add timeout protection (60 seconds)
        const analysisPromise = analyzeWord(wordData.word);
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
            JSON.stringify(analysis.usage_examples),
            wordData.id,
            wordData.user_id
          ]
        );

        console.log(`✅ Successfully fixed word: ${wordData.word}`);
      } catch (error) {
        console.error(`❌ Failed to fix word: ${wordData.word}`, error.message);

        // Update with error message
        await pool.query(
          `UPDATE user_vocabulary_book
           SET chinese_meaning = ?
           WHERE id = ? AND user_id = ?`,
          [`AI 分析失败: ${error.message}. 请点击"重新生成"按钮重试。`, wordData.id, wordData.user_id]
        );
      }
    }

    console.log('\n✅ All stuck words processed!');
    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Script error:', error);
    await pool.end();
    process.exit(1);
  }
}

fixStuckWord();

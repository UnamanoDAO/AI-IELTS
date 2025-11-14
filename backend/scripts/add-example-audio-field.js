import pool from '../src/config/database.js';

async function addExampleAudioField() {
  console.log('Adding example_audio_url field to words table...');
  
  try {
    const connection = await pool.getConnection();
    
    try {
      // 检查字段是否已存在
      const [columns] = await connection.query(
        "SHOW COLUMNS FROM words LIKE 'example_audio_url'"
      );
      
      if (columns.length > 0) {
        console.log('✓ example_audio_url field already exists');
      } else {
        // 添加字段
        await connection.query(
          'ALTER TABLE words ADD COLUMN example_audio_url VARCHAR(500) AFTER example_translation'
        );
        console.log('✓ Successfully added example_audio_url field');
      }
      
      // 为现有单词生成example_audio_url
      console.log('Generating example audio URLs for existing words...');
      await connection.query(`
        UPDATE words 
        SET example_audio_url = CONCAT(
          'https://dict.youdao.com/dictvoice?audio=',
          REPLACE(example_sentence, ' ', '%20'),
          '&type=2'
        )
        WHERE example_sentence IS NOT NULL 
        AND example_sentence != '' 
        AND example_sentence != '-'
        AND example_audio_url IS NULL
      `);
      console.log('✓ Generated example audio URLs');
      
    } finally {
      connection.release();
    }
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

addExampleAudioField();


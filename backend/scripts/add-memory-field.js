import pool from '../src/config/database.js';

async function addMemoryField() {
  console.log('Adding memory_tip field to words table...');
  
  try {
    const connection = await pool.getConnection();
    
    try {
      // 检查字段是否已存在
      const [columns] = await connection.query(
        "SHOW COLUMNS FROM words LIKE 'memory_tip'"
      );
      
      if (columns.length > 0) {
        console.log('✓ memory_tip field already exists');
      } else {
        // 添加字段
        await connection.query(
          'ALTER TABLE words ADD COLUMN memory_tip TEXT AFTER audio_url'
        );
        console.log('✓ Successfully added memory_tip field');
      }
    } finally {
      connection.release();
    }
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

addMemoryField();



async function addMemoryField() {
  console.log('Adding memory_tip field to words table...');
  
  try {
    const connection = await pool.getConnection();
    
    try {
      // 检查字段是否已存在
      const [columns] = await connection.query(
        "SHOW COLUMNS FROM words LIKE 'memory_tip'"
      );
      
      if (columns.length > 0) {
        console.log('✓ memory_tip field already exists');
      } else {
        // 添加字段
        await connection.query(
          'ALTER TABLE words ADD COLUMN memory_tip TEXT AFTER audio_url'
        );
        console.log('✓ Successfully added memory_tip field');
      }
    } finally {
      connection.release();
    }
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

addMemoryField();


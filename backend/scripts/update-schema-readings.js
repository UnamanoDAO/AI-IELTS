import pool from '../src/config/database.js'

async function updateSchema() {
  console.log('🔄 开始更新数据库结构...')
  
  const connection = await pool.getConnection()
  
  try {
    // Create unit_readings table
    console.log('📝 创建 unit_readings 表...')
    await connection.query(`
      CREATE TABLE IF NOT EXISTS unit_readings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        unit_id INT NOT NULL,
        title VARCHAR(300) NOT NULL,
        content TEXT NOT NULL,
        order_index INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_unit_readings_unit
          FOREIGN KEY (unit_id) REFERENCES learning_units(id) ON DELETE CASCADE,
        INDEX idx_unit_readings_unit (unit_id),
        INDEX idx_unit_readings_order (unit_id, order_index)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    console.log('✅ unit_readings 表创建成功')
    
    // Create reading_sentences table
    console.log('📝 创建 reading_sentences 表...')
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reading_sentences (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reading_id INT NOT NULL,
        sentence_text TEXT NOT NULL,
        translation TEXT NOT NULL,
        order_index INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_reading_sentences_reading
          FOREIGN KEY (reading_id) REFERENCES unit_readings(id) ON DELETE CASCADE,
        INDEX idx_reading_sentences_reading (reading_id),
        INDEX idx_reading_sentences_order (reading_id, order_index)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    console.log('✅ reading_sentences 表创建成功')
    
    // Check if tables have data
    const [readingsCount] = await connection.query(
      'SELECT COUNT(*) as count FROM unit_readings'
    )
    
    if (readingsCount[0].count === 0) {
      console.log('\n📚 表已创建但没有数据')
      console.log('💡 请运行以下命令生成阅读文章：')
      console.log('   npm run generate-readings')
    } else {
      console.log(`\n✅ 数据库已包含 ${readingsCount[0].count} 篇阅读文章`)
    }
    
    console.log('\n🎉 数据库更新完成！')
    
  } catch (error) {
    console.error('❌ 更新失败:', error.message)
    throw error
  } finally {
    connection.release()
  }
}

// Run the script
updateSchema()
  .then(() => {
    process.exit(0)
  })
  .catch(error => {
    console.error('\n💥 脚本执行失败:', error)
    process.exit(1)
  })


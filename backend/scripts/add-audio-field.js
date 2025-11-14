import pool from '../src/config/database.js'

async function addAudioField() {
  console.log('📝 为 unit_readings 表添加 audio_url 字段...\n')

  try {
    // 检查字段是否已存在
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'unit_readings'
        AND COLUMN_NAME = 'audio_url'
    `)

    if (columns.length > 0) {
      console.log('✓ audio_url 字段已存在，无需添加')
      return
    }

    // 添加字段
    await pool.query(`
      ALTER TABLE unit_readings
      ADD COLUMN audio_url VARCHAR(500) DEFAULT NULL COMMENT '音频文件URL'
      AFTER content
    `)

    console.log('✅ audio_url 字段添加成功')
  } catch (error) {
    console.error('❌ 添加字段失败:', error)
    throw error
  } finally {
    process.exit(0)
  }
}

addAudioField()





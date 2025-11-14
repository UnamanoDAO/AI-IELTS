import pool from '../src/config/database.js'

async function clearReadings() {
  console.log('🗑️  正在清空旧的阅读文章数据...')
  
  try {
    await pool.query('DELETE FROM unit_readings')
    console.log('✅ 已清空所有阅读文章数据')
    console.log('💡 现在可以运行 npm run generate-ai-readings 生成新数据')
  } catch (error) {
    console.error('❌ 清空失败:', error.message)
    throw error
  }
}

clearReadings()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))


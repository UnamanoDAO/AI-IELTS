import pool from '../src/config/database.js'
import dotenv from 'dotenv'

dotenv.config()

async function clearAudio() {
  const readingId = process.argv[2]
  
  if (!readingId) {
    console.log('用法: node scripts/clear-audio.js <reading_id>')
    console.log('示例: node scripts/clear-audio.js 335')
    process.exit(1)
  }

  try {
    const [result] = await pool.query(
      'UPDATE unit_readings SET audio_url = NULL WHERE id = ?',
      [readingId]
    )
    
    if (result.affectedRows > 0) {
      console.log(`✅ 已清除文章 ${readingId} 的音频URL`)
    } else {
      console.log(`⚠️  文章 ${readingId} 不存在或没有音频URL`)
    }
    
    process.exit(0)
  } catch (error) {
    console.error('❌ 清除失败:', error.message)
    process.exit(1)
  }
}

clearAudio()


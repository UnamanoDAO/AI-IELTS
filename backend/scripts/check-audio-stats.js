import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
})

async function checkStats() {
  const [total] = await pool.query('SELECT COUNT(*) as count FROM unit_readings')
  const [withAudio] = await pool.query('SELECT COUNT(*) as count FROM unit_readings WHERE audio_url IS NOT NULL AND audio_url != ""')
  const [withoutAudio] = await pool.query('SELECT COUNT(*) as count FROM unit_readings WHERE audio_url IS NULL OR audio_url = ""')

  console.log('📊 音频生成统计：')
  console.log('   总文章数:', total[0].count)
  console.log('   已有音频:', withAudio[0].count)
  console.log('   缺少音频:', withoutAudio[0].count)
  console.log('   完成率:', ((withAudio[0].count / total[0].count) * 100).toFixed(2) + '%')

  if (withoutAudio[0].count > 0) {
    console.log('\n缺少音频的文章：')
    const [missing] = await pool.query(`
      SELECT ur.id, lu.unit_name, ur.title
      FROM unit_readings ur
      LEFT JOIN learning_units lu ON ur.unit_id = lu.id
      WHERE ur.audio_url IS NULL OR ur.audio_url = ""
      ORDER BY lu.unit_number, ur.order_index
    `)
    missing.forEach(r => {
      console.log(`   ID ${r.id}: ${r.unit_name} - ${r.title}`)
    })
  }

  process.exit(0)
}

checkStats()

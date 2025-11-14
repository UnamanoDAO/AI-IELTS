import pool from '../src/config/database.js'
import dotenv from 'dotenv'

dotenv.config()

async function fixChatContentField() {
  try {
    console.log('📝 修改 chat_messages.content 字段类型...')

    // 将 content 字段从 TEXT 改为 LONGTEXT (最多4GB)
    await pool.query(`
      ALTER TABLE chat_messages
      MODIFY COLUMN content LONGTEXT NOT NULL
    `)

    console.log('✅ 字段类型修改成功！content 已改为 LONGTEXT')

    // 验证修改
    const [columns] = await pool.query(`
      SHOW COLUMNS FROM chat_messages WHERE Field = 'content'
    `)

    console.log('📋 当前字段定义:', columns[0])

    process.exit(0)
  } catch (error) {
    console.error('❌ 修改失败:', error)
    process.exit(1)
  }
}

fixChatContentField()

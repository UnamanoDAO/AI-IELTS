import pool from '../src/config/database.js'
import dotenv from 'dotenv'

dotenv.config()

async function createChatHistoryTable() {
  try {
    console.log('📝 创建聊天记录表...')

    // 创建聊天会话表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(100) DEFAULT NULL COMMENT '用户ID，可以是session_id或其他标识',
        title VARCHAR(200) DEFAULT NULL COMMENT '会话标题（第一条用户消息）',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_conversations_user (user_id),
        INDEX idx_conversations_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 创建聊天消息表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id INT NOT NULL,
        role ENUM('user', 'assistant') NOT NULL,
        content TEXT NOT NULL,
        audio_url VARCHAR(500) DEFAULT NULL COMMENT '音频OSS地址',
        task_id VARCHAR(100) DEFAULT NULL COMMENT 'TTS任务ID（如果音频还在生成）',
        order_index INT DEFAULT 0 COMMENT '消息在会话中的顺序',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_chat_messages_conversation
          FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
        INDEX idx_chat_messages_conversation (conversation_id),
        INDEX idx_chat_messages_order (conversation_id, order_index),
        INDEX idx_chat_messages_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    console.log('✅ 聊天记录表创建成功！')
    process.exit(0)
  } catch (error) {
    console.error('❌ 创建表失败:', error)
    process.exit(1)
  }
}

createChatHistoryTable()



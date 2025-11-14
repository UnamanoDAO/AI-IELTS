import express from 'express'
import multer from 'multer'
import pool from '../config/database.js'
import { speechToText } from '../services/speechRecognition.js'
import { chatWithAssistant, queryLongTTSTaskStatus, audioTaskCache, CACHE_EXPIRE_TIME } from '../services/aiAssistant.js'

const router = express.Router()

// 获取或创建会话ID
async function getOrCreateConversation(userId = null) {
  // 暂时使用固定会话，后续可以基于userId或session创建
  // 这里简化处理，每次请求都使用最新会话或创建新会话
  const [rows] = await pool.query(
    `SELECT id FROM chat_conversations 
     WHERE user_id = ? OR user_id IS NULL
     ORDER BY created_at DESC 
     LIMIT 1`,
    [userId]
  )
  
  if (rows.length > 0) {
    return rows[0].id
  }
  
  // 创建新会话
  const [result] = await pool.query(
    `INSERT INTO chat_conversations (user_id, title) VALUES (?, ?)`,
    [userId, '新对话']
  )
  
  return result.insertId
}

// 保存消息到数据库
async function saveMessage(conversationId, role, content, audioUrl = null, taskId = null, orderIndex = 0) {
  await pool.query(
    `INSERT INTO chat_messages (conversation_id, role, content, audio_url, task_id, order_index)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [conversationId, role, content, audioUrl, taskId, orderIndex]
  )
}

// 更新消息的音频URL
async function updateMessageAudio(messageId, audioUrl) {
  await pool.query(
    `UPDATE chat_messages SET audio_url = ? WHERE id = ?`,
    [audioUrl, messageId]
  )
}

// 配置multer用于处理音频上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制
  },
  fileFilter: (req, file, cb) => {
    // 接受常见音频格式
    const allowedMimes = ['audio/wav', 'audio/pcm', 'audio/webm', 'audio/mp3', 'audio/mpeg']
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('只支持 WAV, PCM, WebM, MP3 格式的音频文件'))
    }
  }
})

// 语音转文字接口
router.post('/speech-to-text', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '请上传音频文件'
      })
    }

    const audioBuffer = req.file.buffer
    const result = await speechToText(audioBuffer)

    res.json({
      success: true,
      text: result
    })
  } catch (error) {
    console.error('语音识别错误:', error)
    res.status(500).json({
      success: false,
      error: error.message || '语音识别失败'
    })
  }
})

// AI对话接口 (包含TTS)
router.post('/chat', async (req, res) => {
  let conversationId = null
  let userMessageId = null
  
  try {
    const { message, conversationHistory = [], conversationId: reqConversationId, userId = null } = req.body

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: '请提供有效的消息内容'
      })
    }

    // 获取或创建会话
    if (reqConversationId) {
      conversationId = reqConversationId
    } else {
      conversationId = await getOrCreateConversation(userId)
    }

    // 获取当前会话的消息数量，用于确定order_index
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as count FROM chat_messages WHERE conversation_id = ?`,
      [conversationId]
    )
    const orderIndex = countRows[0].count

    // 保存用户消息
    await saveMessage(conversationId, 'user', message, null, null, orderIndex)
    userMessageId = orderIndex

    // 更新会话标题（如果是第一条消息）
    if (orderIndex === 0) {
      const title = message.length > 50 ? message.substring(0, 50) + '...' : message
      await pool.query(
        `UPDATE chat_conversations SET title = ? WHERE id = ?`,
        [title, conversationId]
      )
    }

    // 调用AI助手服务
    const response = await chatWithAssistant(message, conversationHistory)

    // 保存助手回复
    const assistantOrderIndex = orderIndex + 1
    await saveMessage(
      conversationId, 
      'assistant', 
      response.text, 
      response.audioUrl || null, 
      response.taskId || null,
      assistantOrderIndex
    )

    // 如果音频还在生成中，启动后台任务更新数据库
    if (response.taskId && !response.audioUrl) {
      // 后台更新音频URL
      updateAudioUrlWhenReady(conversationId, assistantOrderIndex, response.taskId).catch(err => {
        console.error('后台更新音频URL失败:', err)
      })
    }

    res.json({
      success: true,
      data: {
        ...response,
        conversationId: conversationId
      }
    })
  } catch (error) {
    console.error('AI对话错误:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'AI对话失败'
    })
  }
})

// 后台更新音频URL
async function updateAudioUrlWhenReady(conversationId, orderIndex, taskId) {
  const maxAttempts = 100
  let attempts = 0
  
  const checkAndUpdate = async () => {
    if (attempts >= maxAttempts) {
      console.warn('音频生成超时，停止更新')
      return
    }
    
    try {
      const cached = audioTaskCache.get(taskId)
      if (cached && cached.audioUrl) {
        // 更新数据库中的音频URL
        await pool.query(
          `UPDATE chat_messages 
           SET audio_url = ? 
           WHERE conversation_id = ? AND order_index = ? AND role = 'assistant'`,
          [cached.audioUrl, conversationId, orderIndex]
        )
        console.log('✅ 音频URL已更新到数据库')
        return
      }
      
      // 查询任务状态
      const status = await queryLongTTSTaskStatus(taskId)
      if (status.error_code === 20000000 && status.data && status.data.audio_address) {
        // 任务完成，但需要下载并上传到OSS
        // 这里简化处理，直接使用阿里云的临时URL
        // 实际应该等待后台任务完成并上传到OSS
        const audioUrl = status.data.audio_address
        await pool.query(
          `UPDATE chat_messages 
           SET audio_url = ? 
           WHERE conversation_id = ? AND order_index = ? AND role = 'assistant'`,
          [audioUrl, conversationId, orderIndex]
        )
        console.log('✅ 音频URL已更新到数据库（临时URL）')
        return
      }
      
      attempts++
      if (attempts < maxAttempts) {
        setTimeout(checkAndUpdate, 3000)
      }
    } catch (error) {
      console.error('检查音频状态失败:', error)
      attempts++
      if (attempts < maxAttempts) {
        setTimeout(checkAndUpdate, 5000)
      }
    }
  }
  
  setTimeout(checkAndUpdate, 3000)
}

// 查询音频生成状态
router.get('/audio-status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params
    
    // 先从缓存中查找
    const cached = audioTaskCache.get(taskId)
    if (cached) {
      // 检查是否过期
      if (Date.now() - cached.timestamp < CACHE_EXPIRE_TIME) {
        return res.json({
          success: true,
          data: {
            status: 'COMPLETED',
            audioUrl: cached.audioUrl
          }
        })
      } else {
        // 缓存过期，删除
        audioTaskCache.delete(taskId)
      }
    }
    
    // 缓存中没有，查询任务状态
    const { queryLongTTSTaskStatus } = await import('../services/aiAssistant.js')
    const status = await queryLongTTSTaskStatus(taskId)
    
    if (status.error_code === 20000000 && status.data && status.data.audio_address) {
      // 任务完成，但需要下载并上传到OSS
      // 这里简化处理，直接返回阿里云的临时URL
      // 实际应该下载并上传到OSS，然后更新缓存
      return res.json({
        success: true,
        data: {
          status: 'COMPLETED',
          audioUrl: status.data.audio_address
        }
      })
    } else if (status.data && status.data.task_status) {
      return res.json({
        success: true,
        data: {
          status: status.data.task_status
        }
      })
    } else {
      return res.json({
        success: false,
        data: {
          status: 'UNKNOWN'
        }
      })
    }
  } catch (error) {
    console.error('查询音频状态失败:', error)
    res.status(500).json({
      success: false,
      error: error.message || '查询失败'
    })
  }
})

// 获取聊天历史
router.get('/history', async (req, res) => {
  try {
    const { conversationId, userId = null, limit = 50 } = req.query

    let messages = []
    
    let convRows = []
    
    if (conversationId) {
      // 获取指定会话的消息
      const [rows] = await pool.query(
        `SELECT id, role, content, audio_url, created_at, order_index, conversation_id
         FROM chat_messages
         WHERE conversation_id = ?
         ORDER BY order_index ASC
         LIMIT ?`,
        [conversationId, parseInt(limit)]
      )
      messages = rows
    } else {
      // 获取最新会话的消息
      const [latestConvRows] = await pool.query(
        `SELECT id FROM chat_conversations
         WHERE user_id = ? OR user_id IS NULL
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId]
      )
      convRows = latestConvRows
      
      if (convRows.length > 0) {
        const [msgRows] = await pool.query(
          `SELECT id, role, content, audio_url, created_at, order_index, conversation_id
           FROM chat_messages
           WHERE conversation_id = ?
           ORDER BY order_index ASC
           LIMIT ?`,
          [convRows[0].id, parseInt(limit)]
        )
        messages = msgRows
      }
    }

    // 获取conversationId
    let finalConversationId = conversationId
    if (!finalConversationId && messages.length > 0) {
      finalConversationId = messages[0].conversation_id || null
    } else if (!finalConversationId && convRows && convRows.length > 0) {
      finalConversationId = convRows[0].id
    }

    res.json({
      success: true,
      data: {
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          audioUrl: msg.audio_url,
          timestamp: msg.created_at ? msg.created_at.getTime() : Date.now(),
          isGeneratingAudio: false // 历史记录中音频应该已经生成完成
        })),
        conversationId: finalConversationId
      }
    })
  } catch (error) {
    console.error('获取聊天历史失败:', error)
    res.status(500).json({
      success: false,
      error: error.message || '获取聊天历史失败'
    })
  }
})

// 获取会话列表
router.get('/conversations', async (req, res) => {
  try {
    const { userId = null, limit = 20 } = req.query

    const [rows] = await pool.query(
      `SELECT c.id, c.title, c.created_at, c.updated_at,
              COUNT(m.id) as message_count
       FROM chat_conversations c
       LEFT JOIN chat_messages m ON c.id = m.conversation_id
       WHERE c.user_id = ? OR c.user_id IS NULL
       GROUP BY c.id
       ORDER BY c.updated_at DESC
       LIMIT ?`,
      [userId, parseInt(limit)]
    )

    res.json({
      success: true,
      data: rows.map(row => ({
        id: row.id,
        title: row.title,
        messageCount: row.message_count,
        createdAt: row.created_at.getTime(),
        updatedAt: row.updated_at.getTime()
      }))
    })
  } catch (error) {
    console.error('获取会话列表失败:', error)
    res.status(500).json({
      success: false,
      error: error.message || '获取会话列表失败'
    })
  }
})

export default router

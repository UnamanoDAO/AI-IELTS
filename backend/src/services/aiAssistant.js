import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import OSS from 'ali-oss'
import RPCClient from '@alicloud/pop-core'
import crypto from 'crypto'
import https from 'https'
import http from 'http'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 阿里云配置
const ALIYUN_ACCESS_KEY_ID = process.env.ALIYUN_ACCESS_KEY_ID
const ALIYUN_ACCESS_KEY_SECRET = process.env.ALIYUN_ACCESS_KEY_SECRET
const ALIYUN_APP_KEY = process.env.ALIYUN_TTS_APP_KEY

// OSS配置
const OSS_REGION = 'oss-cn-beijing'
const OSS_BUCKET = 'creatimage'

// TTS配置
const TTS_ENDPOINT = 'https://nls-gateway-cn-beijing.aliyuncs.com'
const VOICE = 'zhixiaoxia'
const FORMAT = 'mp3'
const SAMPLE_RATE = 24000

// AI API配置 (使用 bltcy.ai 或其他AI服务)
const AI_API_KEY = process.env.AI_API_KEY || ''
// 如果环境变量只提供了基础URL，自动添加 /v1/chat/completions
let AI_API_URL = process.env.AI_API_URL || 'https://api.bltcy.ai/v1/chat/completions'
if (AI_API_URL && !AI_API_URL.includes('/v1/chat/completions')) {
  AI_API_URL = AI_API_URL.endsWith('/') 
    ? `${AI_API_URL}v1/chat/completions`
    : `${AI_API_URL}/v1/chat/completions`
}
const AI_MODEL = process.env.AI_MODEL || 'gemini-2.5-flash-image-preview' // 默认使用 gpt-4o

let ossClient = null
let cachedToken = null
let tokenExpireTime = 0

// 音频任务缓存（taskId -> { audioUrl, timestamp }）
export const audioTaskCache = new Map()
export const CACHE_EXPIRE_TIME = 10 * 60 * 1000 // 10分钟过期

// 初始化OSS客户端
function initOSSClient() {
  if (!ossClient) {
    ossClient = new OSS({
      region: OSS_REGION,
      accessKeyId: ALIYUN_ACCESS_KEY_ID,
      accessKeySecret: ALIYUN_ACCESS_KEY_SECRET,
      bucket: OSS_BUCKET
    })
  }
  return ossClient
}

// 获取NLS Token
async function getNLSToken() {
  if (cachedToken && Date.now() < tokenExpireTime) {
    return cachedToken
  }

  const regions = ['cn-shanghai', 'cn-beijing']

  for (const region of regions) {
    try {
      const client = new RPCClient({
        accessKeyId: ALIYUN_ACCESS_KEY_ID,
        accessKeySecret: ALIYUN_ACCESS_KEY_SECRET,
        endpoint: `https://nls-meta.${region}.aliyuncs.com`,
        apiVersion: '2019-02-28',
        opts: { timeout: 10000 }
      })

      const result = await client.request('CreateToken')

      if (result && result.Token && result.Token.Id) {
        cachedToken = result.Token.Id
        const expireTime = result.Token.ExpireTime || 3600
        tokenExpireTime = Date.now() + expireTime * 1000 - 5 * 60 * 1000
        return cachedToken
      }
    } catch (error) {
      console.error(`从 ${region} 获取 Token 失败:`, error.message)
    }
  }

  throw new Error('所有区域获取 Token 都失败了')
}

// 生成签名
function generateSignature(method, uri, headers, params, body, accessKeySecret) {
  const canonicalizedHeaders = Object.keys(headers)
    .filter(key => key.toLowerCase().startsWith('x-nls-'))
    .sort()
    .map(key => `${key.toLowerCase()}:${headers[key].trim()}`)
    .join('\n')

  let canonicalizedResource = uri
  if (params && Object.keys(params).length > 0) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&')
    canonicalizedResource += `?${sortedParams}`
  }

  const stringToSign = [
    method,
    headers['Accept'] || '',
    headers['Content-MD5'] || '',
    headers['Content-Type'] || '',
    headers['Date'] || '',
    canonicalizedHeaders ? canonicalizedHeaders : '',
    canonicalizedResource
  ].filter(item => item !== '').join('\n')

  const signature = crypto
    .createHmac('sha1', accessKeySecret)
    .update(stringToSign)
    .digest('base64')

  return signature
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 导出查询函数供路由使用
export async function queryLongTTSTaskStatus(taskId) {
  const token = await getNLSToken()
  const queryUrl = `https://nls-gateway-cn-shanghai.aliyuncs.com/rest/v1/tts/async?appkey=${ALIYUN_APP_KEY}&task_id=${taskId}&token=${token}`

  try {
    const response = await fetch(queryUrl)
    const result = await response.json()

    if (!response.ok) {
      throw new Error(`查询失败: ${result.error_message || response.statusText}`)
    }

    return result
  } catch (error) {
    console.error(`查询任务状态失败: ${error.message}`)
    throw error
  }
}

// 等待长文本TTS任务完成
async function waitForLongTTSTaskCompletion(taskId, maxWaitTime = 300000) {
  const startTime = Date.now()
  const checkInterval = 3000 // 每3秒检查一次

  console.log(`⏳ 等待长文本TTS任务完成 (Task ID: ${taskId})...`)

  while (Date.now() - startTime < maxWaitTime) {
    await delay(checkInterval)

    try {
      const status = await queryLongTTSTaskStatus(taskId)

      if (status.error_code === 20000000 && status.data && status.data.audio_address) {
        console.log(`✅ 长文本TTS任务完成！`)
        return status.data.audio_address
      } else if (status.data && status.data.task_status === 'RUNNING' || status.data?.task_status === 'QUEUEING') {
        console.log(`⏳ 任务状态: ${status.data.task_status}`)
      } else if (status.data && status.data.task_status === 'FAILED') {
        throw new Error(`任务失败: ${status.error_message || '未知错误'}`)
      }
    } catch (error) {
      if (error.message.includes('任务失败')) {
        throw error
      }
      console.warn(`⚠️ 检查状态时出错: ${error.message}`)
    }
  }

  throw new Error('长文本TTS任务超时（超过5分钟）')
}

// 下载音频文件
async function downloadAudioFromUrl(url) {
  console.log(`⬇️ 下载音频文件: ${url}`)
  
  const protocol = url.startsWith('https') ? https : http

  return new Promise((resolve, reject) => {
    protocol.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`下载失败: HTTP ${res.statusCode}`))
        return
      }
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => {
        const buffer = Buffer.concat(chunks)
        console.log(`✅ 下载完成 (${(buffer.length / 1024).toFixed(2)} KB)`)
        resolve(buffer)
      })
      res.on('error', reject)
    }).on('error', reject)
  })
}

// 文字转语音（异步版本，立即返回taskId）
async function textToSpeechAsync(text) {
  try {
    console.log(`🎙️ 开始生成长文本语音，文本长度: ${text.length} 字符`)
    
    const token = await getNLSToken()
    const timestamp = Date.now()
    const deviceId = `assistant_${timestamp}`

    // 使用长文本TTS API
    const LONG_TTS_URL = 'https://nls-gateway-cn-shanghai.aliyuncs.com/rest/v1/tts/async'
    
    const requestBody = {
      header: {
        appkey: ALIYUN_APP_KEY,
        token: token
      },
      context: {
        device_id: deviceId
      },
      payload: {
        enable_notify: false,
        tts_request: {
          text: text,
          voice: VOICE,
          format: FORMAT,
          sample_rate: SAMPLE_RATE,
          volume: 50,
          speech_rate: 0,
          enable_subtitle: false
        }
      }
    }

    console.log(`📤 提交长文本TTS任务...`)
    const response = await fetch(LONG_TTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const result = await response.json()

    if (!response.ok || result.error_code !== 20000000) {
      throw new Error(`提交任务失败: ${result.error_message || response.statusText}`)
    }

    const taskId = result.data.task_id
    console.log(`✅ 任务提交成功，Task ID: ${taskId}`)

    // 立即返回taskId，后台处理音频生成
    // 启动后台任务处理音频生成和上传
    processAudioInBackground(taskId, timestamp).catch(err => {
      console.error('后台音频处理失败:', err)
    })

    return {
      taskId: taskId,
      audioUrl: null // 异步生成，暂时为null
    }
  } catch (error) {
    console.error('❌ TTS任务提交失败:', error)
    throw error
  }
}

// 后台处理音频生成和上传
async function processAudioInBackground(taskId, timestamp) {
  try {
    console.log(`⏳ 后台处理音频生成 (Task ID: ${taskId})...`)
    
    // 等待任务完成
    const audioUrl = await waitForLongTTSTaskCompletion(taskId)

    // 下载音频文件
    const audioBuffer = await downloadAudioFromUrl(audioUrl)

    // 上传到OSS
    const client = initOSSClient()
    const ossObjectName = `assistant/audio/${timestamp}.mp3`

    console.log(`⬆️ 上传到OSS...`)
    await client.put(ossObjectName, audioBuffer, {
      headers: { 'Content-Type': 'audio/mpeg' }
    })

    const publicUrl = `https://${OSS_BUCKET}.${OSS_REGION}.aliyuncs.com/${ossObjectName}`
    console.log(`✅ 音频生成完成: ${publicUrl}`)
    
    // 存储到缓存中，供前端查询
    audioTaskCache.set(taskId, {
      audioUrl: publicUrl,
      timestamp: Date.now()
    })
    
    return publicUrl
  } catch (error) {
    console.error('❌ 后台音频处理失败:', error)
    throw error
  }
}

// 文字转语音（使用长文本TTS API，同步等待版本，保留用于兼容）
async function textToSpeech(text) {
  try {
    console.log(`🎙️ 开始生成长文本语音，文本长度: ${text.length} 字符`)
    
    const token = await getNLSToken()
    const timestamp = Date.now()
    const deviceId = `assistant_${timestamp}`

    // 使用长文本TTS API
    const LONG_TTS_URL = 'https://nls-gateway-cn-shanghai.aliyuncs.com/rest/v1/tts/async'
    
    const requestBody = {
      header: {
        appkey: ALIYUN_APP_KEY,
        token: token
      },
      context: {
        device_id: deviceId
      },
      payload: {
        enable_notify: false,
        tts_request: {
          text: text,
          voice: VOICE,
          format: FORMAT,
          sample_rate: SAMPLE_RATE,
          volume: 50,
          speech_rate: 0,
          enable_subtitle: false
        }
      }
    }

    console.log(`📤 提交长文本TTS任务...`)
    const response = await fetch(LONG_TTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const result = await response.json()

    if (!response.ok || result.error_code !== 20000000) {
      throw new Error(`提交任务失败: ${result.error_message || response.statusText}`)
    }

    const taskId = result.data.task_id
    console.log(`✅ 任务提交成功，Task ID: ${taskId}`)

    // 等待任务完成
    const audioUrl = await waitForLongTTSTaskCompletion(taskId)

    // 下载音频文件
    const audioBuffer = await downloadAudioFromUrl(audioUrl)

    // 上传到OSS
    const client = initOSSClient()
    const ossObjectName = `assistant/audio/${timestamp}.mp3`

    console.log(`⬆️ 上传到OSS...`)
    await client.put(ossObjectName, audioBuffer, {
      headers: { 'Content-Type': 'audio/mpeg' }
    })

    const publicUrl = `https://${OSS_BUCKET}.${OSS_REGION}.aliyuncs.com/${ossObjectName}`
    console.log(`✅ 音频生成完成: ${publicUrl}`)
    return publicUrl
  } catch (error) {
    console.error('❌ TTS转换失败:', error)
    throw error
  }
}

// 读取雅思助手提示词
function loadSystemPrompt() {
  try {
    const promptPath = path.join(__dirname, '../../..', 'IELTS_ASSISTANT_PROMPT.md')
    const promptContent = fs.readFileSync(promptPath, 'utf-8')
    return promptContent
  } catch (error) {
    console.error('读取提示词文件失败:', error)
    // 返回默认提示词
    return `你是一位经验丰富的雅思（IELTS）考试专业导师。
你的主要职责是帮助学生提升雅思成绩，在词汇、阅读、听力、写作和口语方面提供专业指导。
请用耐心、友好、专业的态度回答学生的问题，使用中文回答，关键词汇和例句使用英文。`
  }
}

/**
 * 与AI助手对话
 * @param {string} userMessage - 用户消息
 * @param {Array} conversationHistory - 对话历史
 * @returns {Promise<Object>} - { text: string, audioUrl: string }
 */
export async function chatWithAssistant(userMessage, conversationHistory = []) {
  try {
    // 检查AI API配置
    if (!AI_API_KEY) {
      console.error('❌ AI_API_KEY 未配置，请检查环境变量')
      throw new Error('AI服务未配置，请联系管理员')
    }

    if (!AI_API_URL) {
      console.error('❌ AI_API_URL 未配置')
      throw new Error('AI服务URL未配置')
    }

    // 构建消息数组
    const systemPrompt = loadSystemPrompt()

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...conversationHistory,
      {
        role: 'user',
        content: userMessage
      }
    ]

    console.log('🤖 调用AI API:', {
      url: AI_API_URL,
      model: AI_MODEL,
      messageCount: messages.length
    })

    // 根据模型类型设置超时时间
    // thinking 模型需要更长的思考时间
    const isThinkingModel = AI_MODEL.includes('thinking') || AI_MODEL.includes('o1') || AI_MODEL.includes('o3')
    const timeout = isThinkingModel ? 120000 : 60000 // thinking 模型 120 秒，普通模型 60 秒

    console.log(`⏱️ 超时设置: ${timeout / 1000}秒 (${isThinkingModel ? '思考模型' : '普通模型'})`)

    // 调用AI API
    const response = await axios.post(
      AI_API_URL,
      {
        model: AI_MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`
        },
        timeout: timeout
      }
    )

    if (!response.data || !response.data.choices || !response.data.choices[0]) {
      console.error('❌ AI API 返回格式异常:', response.data)
      throw new Error('AI服务返回格式异常')
    }

    const assistantMessage = response.data.choices[0].message.content

    if (!assistantMessage) {
      console.error('❌ AI API 返回空消息')
      throw new Error('AI服务返回空消息')
    }

    console.log('✅ AI响应成功，长度:', assistantMessage.length)

    // 异步生成语音（不阻塞文本返回）
    let audioUrl = null
    let taskId = null
    
    try {
      // 启动异步TTS任务
      const ttsResult = await textToSpeechAsync(assistantMessage)
      taskId = ttsResult.taskId
      console.log('✅ TTS任务已提交，Task ID:', taskId)
      
      // 如果任务很快完成（同步返回），直接返回audioUrl
      if (ttsResult.audioUrl) {
        audioUrl = ttsResult.audioUrl
        console.log('✅ TTS同步生成成功:', audioUrl)
      }
    } catch (ttsError) {
      console.warn('⚠️ TTS任务提交失败，继续返回文本回复:', ttsError.message)
      // TTS失败不影响返回文本
    }

    return {
      text: assistantMessage,
      audioUrl: audioUrl, // 如果同步完成则有值，否则为null
      taskId: taskId // 异步任务ID，用于前端轮询查询状态
    }
  } catch (error) {
    console.error('❌ AI对话失败:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        hasApiKey: !!AI_API_KEY,
        apiUrl: AI_API_URL
      }
    })
    
    // 提供更详细的错误信息
    if (error.response?.status === 401) {
      throw new Error('AI服务认证失败，请检查API密钥')
    } else if (error.response?.status === 429) {
      throw new Error('AI服务请求过于频繁，请稍后再试')
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('AI服务响应超时，请稍后再试')
    } else if (!AI_API_KEY) {
      throw new Error('AI服务未配置，请联系管理员')
    } else {
      throw new Error(error.message || 'AI助手暂时无法响应，请稍后再试')
    }
  }
}

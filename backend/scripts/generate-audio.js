import pool from '../src/config/database.js'
import OSS from 'ali-oss'
import crypto from 'crypto'
import dotenv from 'dotenv'
import RPCClient from '@alicloud/pop-core'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

const execAsync = promisify(exec)

// 加载环境变量
dotenv.config()

// 阿里云配置 - 请在 .env 文件中配置这些值
const ALIYUN_ACCESS_KEY_ID = process.env.ALIYUN_ACCESS_KEY_ID || ''
const ALIYUN_ACCESS_KEY_SECRET = process.env.ALIYUN_ACCESS_KEY_SECRET || ''
const ALIYUN_APP_KEY = process.env.ALIYUN_TTS_APP_KEY || ''

// OSS 配置
const OSS_REGION = 'oss-cn-beijing'
const OSS_BUCKET = 'creatimage'

// 语音合成配置
const TTS_ENDPOINT = 'https://nls-gateway-cn-beijing.aliyuncs.com'
const VOICE = 'zhixiaoxia' // 知小夏 - 普通话女声，适合阅读场景
const FORMAT = 'mp3'
const SAMPLE_RATE = 24000
const VOLUME = 50
const SPEECH_RATE = 0 // 语速，-500到500，0为正常

// 文本长度限制（阿里云同步模式单次请求限制，实际测试发现500字符可能被截断，改为400字符更安全）
const MAX_TEXT_LENGTH = 400

// 初始化 OSS 客户端
let ossClient = null
let cachedToken = null
let tokenExpireTime = 0

function initOSSClient() {
  if (!ALIYUN_ACCESS_KEY_ID || !ALIYUN_ACCESS_KEY_SECRET) {
    throw new Error('请在 .env 文件中配置 ALIYUN_ACCESS_KEY_ID 和 ALIYUN_ACCESS_KEY_SECRET')
  }

  ossClient = new OSS({
    region: OSS_REGION,
    accessKeyId: ALIYUN_ACCESS_KEY_ID,
    accessKeySecret: ALIYUN_ACCESS_KEY_SECRET,
    bucket: OSS_BUCKET
  })

  console.log('✓ OSS 客户端初始化成功')
}

// 获取 NLS Token（使用阿里云官方 SDK，带重试机制）
async function getNLSToken(retries = 3) {
  // 如果 token 还在有效期内，直接返回缓存的 token
  if (cachedToken && Date.now() < tokenExpireTime) {
    return cachedToken
  }

  if (!ALIYUN_ACCESS_KEY_ID || !ALIYUN_ACCESS_KEY_SECRET) {
    throw new Error('请在 .env 文件中配置 ALIYUN_ACCESS_KEY_ID 和 ALIYUN_ACCESS_KEY_SECRET')
  }

  // 尝试多个区域
  const regions = [
    'cn-shanghai',
    'cn-beijing'
  ]

  for (const region of regions) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 尝试获取 Token (区域: ${region}, 尝试 ${attempt}/${retries})...`)
        
        // 使用阿里云官方 SDK 获取 Token
        const client = new RPCClient({
          accessKeyId: ALIYUN_ACCESS_KEY_ID,
          accessKeySecret: ALIYUN_ACCESS_KEY_SECRET,
          endpoint: `https://nls-meta.${region}.aliyuncs.com`,
          apiVersion: '2019-02-28',
          opts: {
            timeout: 15000 // 15秒超时
          }
        })

        // 调用 CreateToken API
        const result = await client.request('CreateToken')

        if (result && result.Token && result.Token.Id) {
          cachedToken = result.Token.Id
          // Token 有效期，提前 5 分钟刷新
          const expireTime = result.Token.ExpireTime || 3600
          tokenExpireTime = Date.now() + expireTime * 1000 - 5 * 60 * 1000
          console.log(`✓ Token 获取成功 (区域: ${region})`)
          return cachedToken
        } else {
          // 检查是否是权限错误
          if (result && result.ErrCode) {
            const errCode = result.ErrCode
            const errMsg = result.ErrMsg || '未知错误'
            
            if (errCode === 40020503 || errCode === '40020503') {
              console.error('\n❌ 权限错误 (ErrCode: 40020503)')
              console.error('   错误信息:', errMsg)
              console.error('\n📋 解决方案：')
              console.error('   1. 登录阿里云控制台：https://ecs.console.aliyun.com/')
              console.error('   2. 开通"智能语音交互"服务：')
              console.error('      - 访问：https://nls.console.aliyun.com/')
              console.error('      - 或搜索"智能语音交互"并开通服务')
              console.error('   3. 确保您的 AccessKey 具有以下权限：')
              console.error('      - AliyunNLSFullAccess (智能语音交互管理权限)')
              console.error('      - 或至少包含 CreateToken 权限')
              console.error('   4. 如果已开通服务，请检查 AccessKey 是否正确配置\n')
              throw new Error(`权限错误: ${errMsg} (ErrCode: ${errCode})`)
            } else {
              console.error('Token 响应:', JSON.stringify(result, null, 2))
              throw new Error(`API 错误: ${errMsg} (ErrCode: ${errCode})`)
            }
          } else {
            console.error('Token 响应:', JSON.stringify(result, null, 2))
            throw new Error('Token 响应格式错误，未找到 Token.Id 字段')
          }
        }
      } catch (error) {
        const isLastAttempt = attempt === retries && region === regions[regions.length - 1]
        
        // 如果是权限错误，直接抛出，不重试
        if (error.message && error.message.includes('权限错误')) {
          throw error
        }
        
        if (isLastAttempt) {
          console.error(`❌ 获取 Token 失败 (区域: ${region}, 尝试 ${attempt}/${retries}): ${error.message}`)
          if (error.data) {
            console.error(`   错误详情: ${JSON.stringify(error.data, null, 2)}`)
          }
          // 如果是最后一个区域和最后一次尝试，抛出错误
          if (region === regions[regions.length - 1]) {
            throw error
          }
        } else {
          console.warn(`⚠️  尝试 ${attempt} 失败，${attempt < retries ? '2秒后重试' : '切换到下一个区域'}...`)
          if (attempt < retries) {
            await delay(2000)
          }
        }
      }
    }
  }

  throw new Error('所有区域和重试都失败，无法获取 Token')
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 文本分段函数（按句子和长度限制分段，支持中英文，确保不丢失任何字符）
function splitTextIntoChunks(text) {
  if (text.length <= MAX_TEXT_LENGTH) {
    return [text]
  }

  const chunks = []
  let currentChunk = ''
  let currentIndex = 0
  
  // 按句子分割（保留分隔符）
  // 匹配：句号、问号、感叹号（中英文）、换行符
  const sentenceEndRegex = /([。！？.!?\n])/
  const parts = text.split(sentenceEndRegex)
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    
    // 跳过空字符串（split可能产生）
    if (part === '') continue
    
    const testChunk = currentChunk + part
    
    if (testChunk.length <= MAX_TEXT_LENGTH) {
      // 可以添加到当前块
      currentChunk = testChunk
    } else {
      // 当前块已满
      if (currentChunk.length > 0) {
        chunks.push(currentChunk)
        currentIndex += currentChunk.length
      }
      
      // 处理新部分
      if (part.length > MAX_TEXT_LENGTH) {
        // 单个部分就超过限制，需要强制按字符分割
        let remainingPart = part
        while (remainingPart.length > MAX_TEXT_LENGTH) {
          // 尝试在合适的位置分割（优先在空格、逗号处）
          let splitPos = MAX_TEXT_LENGTH
          
          // 向前查找合适的分割点（空格、逗号、分号）
          for (let pos = MAX_TEXT_LENGTH; pos > MAX_TEXT_LENGTH - 50 && pos > 0; pos--) {
            const char = remainingPart[pos]
            if (char === ' ' || char === ',' || char === '，' || char === ';' || char === '；') {
              splitPos = pos + 1
              break
            }
          }
          
          const chunkPart = remainingPart.substring(0, splitPos)
          chunks.push(chunkPart)
          currentIndex += chunkPart.length
          remainingPart = remainingPart.substring(splitPos)
        }
        
        currentChunk = remainingPart
      } else {
        currentChunk = part
      }
    }
  }
  
  // 添加最后一个块
  if (currentChunk.length > 0) {
    chunks.push(currentChunk)
    currentIndex += currentChunk.length
  }

  // 验证：确保所有文本都被包含
  const totalChunkLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const originalLength = text.length
  const allChunksText = chunks.join('')
  
  // 调试信息：显示分段结果
  if (chunks.length > 1) {
    console.log(`    📊 分段详情:`)
    chunks.forEach((chunk, idx) => {
      const preview = chunk.substring(0, 60).replace(/\n/g, ' ')
      console.log(`      段 ${idx + 1}: ${chunk.length} 字符 - "${preview}${chunk.length > 60 ? '...' : ''}"`)
    })
    console.log(`    ✅ 分段验证: 原文 ${originalLength} 字符, 分段后 ${totalChunkLength} 字符`)
    
    if (totalChunkLength !== originalLength) {
      const missing = originalLength - totalChunkLength
      console.error(`    ❌ 错误: 丢失了 ${missing} 个字符！`)
      
      // 详细对比
      for (let i = 0; i < Math.min(originalLength, allChunksText.length); i++) {
        if (text[i] !== allChunksText[i]) {
          console.error(`    第一个差异位置: 第 ${i} 字符`)
          console.error(`    原文: "${text.substring(Math.max(0, i - 20), i + 20)}"`)
          console.error(`    分段: "${allChunksText.substring(Math.max(0, i - 20), i + 20)}"`)
          break
        }
      }
      
      if (allChunksText.length < originalLength) {
        const missingStart = allChunksText.length
        console.error(`    丢失的文本位置: 从第 ${missingStart} 字符开始`)
        console.error(`    丢失的文本内容: "${text.substring(missingStart, Math.min(missingStart + 300, originalLength))}"`)
      }
      
      // 抛出错误，防止继续处理
      throw new Error(`分段失败：丢失了 ${missing} 个字符`)
    }
    
    // 额外验证：逐字符对比
    if (text !== allChunksText) {
      console.error(`    ❌ 错误: 分段后的文本与原文不完全匹配！`)
      throw new Error('分段验证失败：文本内容不匹配')
    }
  }
  
  return chunks
}

// 检查 ffmpeg 是否可用
async function checkFFmpegAvailable() {
  try {
    await execAsync('ffmpeg -version')
    return true
  } catch {
    return false
  }
}

// 拼接多个 MP3 音频文件
async function concatenateAudioFiles(audioBuffers, outputPath) {
  const tempDir = path.join(os.tmpdir(), `audio-merge-${Date.now()}`)
  await fs.mkdir(tempDir, { recursive: true })

  try {
    // 保存所有音频片段到临时文件
    const tempFiles = []
    for (let i = 0; i < audioBuffers.length; i++) {
      const tempFile = path.join(tempDir, `part-${i}.mp3`)
      await fs.writeFile(tempFile, audioBuffers[i])
      tempFiles.push(tempFile)
    }

    // 创建文件列表（ffmpeg concat 需要）
    const fileListPath = path.join(tempDir, 'filelist.txt')
    const fileListContent = tempFiles.map(file => `file '${file.replace(/\\/g, '/')}'`).join('\n')
    await fs.writeFile(fileListPath, fileListContent)

    // 使用 ffmpeg 拼接
    const ffmpegCmd = `ffmpeg -f concat -safe 0 -i "${fileListPath}" -c copy "${outputPath}" -y`
    await execAsync(ffmpegCmd)

    // 读取拼接后的文件
    const mergedBuffer = await fs.readFile(outputPath)
    
    // 清理临时文件
    await fs.rm(tempDir, { recursive: true, force: true })
    
    return mergedBuffer
  } catch (error) {
    // 清理临时文件
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
    throw new Error(`音频拼接失败: ${error.message}`)
  }
}

// 生成签名
function generateSignature(method, uri, headers, params, body, accessKeySecret) {
  // 1. 构建 CanonicalizedHeaders
  const canonicalizedHeaders = Object.keys(headers)
    .filter(key => key.toLowerCase().startsWith('x-nls-'))
    .sort()
    .map(key => `${key.toLowerCase()}:${headers[key].trim()}`)
    .join('\n')

  // 2. 构建 CanonicalizedResource
  let canonicalizedResource = uri
  if (params && Object.keys(params).length > 0) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&')
    canonicalizedResource += `?${sortedParams}`
  }

  // 3. 构建待签名字符串
  const stringToSign = [
    method,
    headers['Accept'] || '',
    headers['Content-MD5'] || '',
    headers['Content-Type'] || '',
    headers['Date'] || '',
    canonicalizedHeaders ? canonicalizedHeaders : '',
    canonicalizedResource
  ].filter(item => item !== '').join('\n')

  // 4. 计算签名
  const signature = crypto
    .createHmac('sha1', accessKeySecret)
    .update(stringToSign)
    .digest('base64')

  return signature
}

// 提交长文本语音合成任务
async function submitTTSTask(text, taskId) {
  // 先获取 Token
  const token = await getNLSToken()
  
  const uri = '/stream/v1/tts'
  const date = new Date().toUTCString()

  const payload = {
    appkey: ALIYUN_APP_KEY,
    text: text,
    format: FORMAT,
    sample_rate: SAMPLE_RATE,
    voice: VOICE,
    volume: VOLUME,
    speech_rate: SPEECH_RATE,
    enable_subtitle: false
  }

  const body = JSON.stringify(payload)
  const contentMD5 = crypto.createHash('md5').update(body).digest('base64')

  const headers = {
    'Content-Type': 'application/json',
    'Content-MD5': contentMD5,
    'Date': date,
    'Accept': '*/*',
    'x-nls-token': token // 使用 Token 认证
  }

  // 生成签名
  const signature = generateSignature('POST', uri, headers, {}, body, ALIYUN_ACCESS_KEY_SECRET)
  headers['Authorization'] = `NLS ${ALIYUN_ACCESS_KEY_ID}:${signature}`

  try {
    const response = await fetch(`${TTS_ENDPOINT}${uri}`, {
      method: 'POST',
      headers: headers,
      body: body
    })

    // 检查响应类型
    const contentType = response.headers.get('content-type') || ''
    const isJson = contentType.includes('application/json') || contentType.includes('text/json')

    if (!response.ok) {
      let errorText
      if (isJson) {
        try {
          const errorJson = await response.json()
          errorText = JSON.stringify(errorJson, null, 2)
        } catch {
          errorText = await response.text()
        }
      } else {
        errorText = await response.text()
      }
      throw new Error(`TTS API 错误 (${response.status}): ${errorText}`)
    }

    // 解析响应
    let result
    if (isJson) {
      try {
        result = await response.json()
        // 检查是否是任务 ID 响应（异步模式）
        if (result.task_id) {
          console.log(`    ✓ 任务提交成功（异步模式），任务ID: ${result.task_id}`)
          return { type: 'async', task_id: result.task_id, data: result }
        } else {
          // JSON 响应但没有 task_id，可能是错误信息
          throw new Error(`API 返回错误: ${JSON.stringify(result)}`)
        }
      } catch (parseError) {
        // 如果 JSON 解析失败，尝试读取文本
        const text = await response.text()
        console.error('    ⚠️  响应不是有效的 JSON:', text.substring(0, 200))
        throw new Error(`响应解析失败: ${parseError.message}`)
      }
    } else if (contentType.includes('audio/')) {
      // 直接返回音频（同步模式）
      console.log(`    ✓ 音频生成成功（同步模式）`)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = Buffer.from(arrayBuffer)
      return { type: 'sync', audio: audioBuffer }
    } else {
      // 其他格式
      const text = await response.text()
      console.error('    ⚠️  意外的响应格式:', contentType, text.substring(0, 200))
      throw new Error(`意外的响应格式: ${contentType}`)
    }
  } catch (error) {
    console.error(`    ❌ 提交 TTS 任务失败: ${error.message}`)
    throw error
  }
}

// 查询任务状态
async function queryTaskStatus(taskId) {
  // 先获取 Token
  const token = await getNLSToken()
  
  const uri = `/stream/v1/tts?appkey=${ALIYUN_APP_KEY}&task_id=${taskId}`
  const date = new Date().toUTCString()

  const headers = {
    'Date': date,
    'Accept': '*/*',
    'x-nls-token': token // 使用 Token 认证
  }

  const signature = generateSignature('GET', '/stream/v1/tts', headers, {
    appkey: ALIYUN_APP_KEY,
    task_id: taskId
  }, '', ALIYUN_ACCESS_KEY_SECRET)
  
  headers['Authorization'] = `NLS ${ALIYUN_ACCESS_KEY_ID}:${signature}`

  try {
    const response = await fetch(`${TTS_ENDPOINT}${uri}`, {
      method: 'GET',
      headers: headers
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`查询状态失败 (${response.status}): ${errorText}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error(`    ⚠️  查询任务状态失败: ${error.message}`)
    throw error
  }
}

// 等待任务完成
async function waitForTaskCompletion(taskId, maxWaitTime = 180000) {
  const startTime = Date.now()
  const checkInterval = 5000 // 每5秒检查一次

  while (Date.now() - startTime < maxWaitTime) {
    await delay(checkInterval)

    try {
      const status = await queryTaskStatus(taskId)

      if (status.status === 'SUCCESS') {
        console.log(`    ✓ 任务完成，音频URL: ${status.audio_address}`)
        return status.audio_address
      } else if (status.status === 'RUNNING' || status.status === 'QUEUEING') {
        console.log(`    ⏳ 任务状态: ${status.status}`)
      } else {
        throw new Error(`任务失败，状态: ${status.status}`)
      }
    } catch (error) {
      console.error(`    ⚠️  检查状态时出错: ${error.message}`)
    }
  }

  throw new Error('任务超时')
}

// 下载音频文件
async function downloadAudio(url) {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`下载失败: ${response.status}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error(`    ❌ 下载音频失败: ${error.message}`)
    throw error
  }
}

// 上传到 OSS
async function uploadToOSS(buffer, objectName) {
  try {
    const result = await ossClient.put(objectName, buffer, {
      headers: {
        'Content-Type': 'audio/mpeg'
      }
    })
    console.log(`    ✓ 上传到 OSS 成功: ${result.name}`)
    return result.url
  } catch (error) {
    console.error(`    ❌ 上传到 OSS 失败: ${error.message}`)
    throw error
  }
}

// 为单篇文章生成音频
async function generateAudioForReading(reading) {
  console.log(`\n  文章 ${reading.id}: ${reading.title}`)
  console.log(`    📝 内容长度: ${reading.content.length} 字符`)

  try {
    // 1. 检查是否需要分段
    const textChunks = splitTextIntoChunks(reading.content)
    console.log(`    📦 文本分为 ${textChunks.length} 段`)

    if (textChunks.length === 1) {
      // 单段文本，直接处理
      console.log(`    🎙️  提交语音合成任务...`)
      const taskResult = await submitTTSTask(reading.content, `reading_${reading.id}`)

      let audioBuffer
      if (taskResult.type === 'sync') {
        console.log(`    ✓ 收到音频数据（${(taskResult.audio.length / 1024).toFixed(2)} KB）`)
        audioBuffer = taskResult.audio
      } else if (taskResult.type === 'async') {
        console.log(`    ⏳ 等待任务完成...`)
        const audioUrl = await waitForTaskCompletion(taskResult.task_id)
        console.log(`    ⬇️  下载音频文件...`)
        audioBuffer = await downloadAudio(audioUrl)
      } else {
        throw new Error('未知的响应类型')
      }

      // 上传到 OSS
      const ossObjectName = `readings/audio/${reading.unit_id}_${reading.id}.mp3`
      console.log(`    ⬆️  上传到 OSS...`)
      const ossUrl = await uploadToOSS(audioBuffer, ossObjectName)

      // 更新数据库
      const publicUrl = `https://${OSS_BUCKET}.${OSS_REGION}.aliyuncs.com/${ossObjectName}`
      await pool.query(
        'UPDATE unit_readings SET audio_url = ? WHERE id = ?',
        [publicUrl, reading.id]
      )

      console.log(`    ✅ 音频生成成功: ${publicUrl}`)
      return publicUrl
    } else {
      // 多段文本，需要分段生成并拼接
      console.log(`    🎙️  分段生成音频（共 ${textChunks.length} 段）...`)
      
      // 检查 ffmpeg 是否可用
      const hasFFmpeg = await checkFFmpegAvailable()
      if (!hasFFmpeg) {
        throw new Error('需要安装 ffmpeg 才能拼接多段音频。请访问 https://ffmpeg.org/download.html 下载安装。')
      }

      const audioBuffers = []
      const chunkInfo = [] // 记录每段的信息
      
      // 为每段生成音频
      for (let i = 0; i < textChunks.length; i++) {
        const chunkText = textChunks[i]
        console.log(`    📝 处理第 ${i + 1}/${textChunks.length} 段（${chunkText.length} 字符）...`)
        console.log(`       文本预览: "${chunkText.substring(0, 80)}${chunkText.length > 80 ? '...' : ''}"`)
        
        const taskResult = await submitTTSTask(chunkText, `reading_${reading.id}_chunk_${i}`)

        let chunkBuffer
        if (taskResult.type === 'sync') {
          chunkBuffer = taskResult.audio
          const sizeKB = (chunkBuffer.length / 1024).toFixed(2)
          console.log(`      ✓ 第 ${i + 1} 段生成成功（${sizeKB} KB）`)
          chunkInfo.push({
            index: i + 1,
            textLength: chunkText.length,
            audioSize: chunkBuffer.length,
            preview: chunkText.substring(0, 50)
          })
        } else if (taskResult.type === 'async') {
          const audioUrl = await waitForTaskCompletion(taskResult.task_id)
          chunkBuffer = await downloadAudio(audioUrl)
          const sizeKB = (chunkBuffer.length / 1024).toFixed(2)
          console.log(`      ✓ 第 ${i + 1} 段生成成功（${sizeKB} KB）`)
          chunkInfo.push({
            index: i + 1,
            textLength: chunkText.length,
            audioSize: chunkBuffer.length,
            preview: chunkText.substring(0, 50)
          })
        } else {
          throw new Error('未知的响应类型')
        }

        // 验证音频不为空
        if (!chunkBuffer || chunkBuffer.length === 0) {
          throw new Error(`第 ${i + 1} 段音频为空！`)
        }

        audioBuffers.push(chunkBuffer)
        
        // 在段之间添加短暂延迟，避免 API 限流
        if (i < textChunks.length - 1) {
          await delay(500)
        }
      }
      
      // 验证所有段都成功生成
      if (audioBuffers.length !== textChunks.length) {
        throw new Error(`音频段数量不匹配：期望 ${textChunks.length} 段，实际 ${audioBuffers.length} 段`)
      }
      
      console.log(`    ✅ 所有 ${audioBuffers.length} 段音频生成完成`)
      console.log(`    📊 音频段统计:`)
      
      // 验证每段音频的时长
      const tempDir = path.join(os.tmpdir(), `audio-check-${reading.id}-${Date.now()}`)
      await fs.mkdir(tempDir, { recursive: true })
      
      let totalExpectedDuration = 0
      let totalActualDuration = 0
      
      for (let i = 0; i < audioBuffers.length; i++) {
        const info = chunkInfo[i]
        const tempFile = path.join(tempDir, `chunk-${i}.mp3`)
        await fs.writeFile(tempFile, audioBuffers[i])
        
        // 获取音频时长
        try {
          const { stdout } = await execAsync(
            `ffprobe -v quiet -print_format json -show_format "${tempFile}"`
          )
          const audioInfo = JSON.parse(stdout)
          const duration = parseFloat(audioInfo.format.duration || 0)
          
          // 估算预期时长（每分钟150词，即每秒2.5词）
          const wordCount = textChunks[i].split(/\s+/).filter(w => w.length > 0).length
          const expectedDuration = wordCount / 2.5
          
          totalExpectedDuration += expectedDuration
          totalActualDuration += duration
          
          const ratio = duration / expectedDuration
          const status = ratio < 0.7 ? '⚠️' : ratio > 1.3 ? '⚠️' : '✅'
          
          console.log(`       段 ${info.index}: ${info.textLength} 字符, ${wordCount} 词 → ${(info.audioSize / 1024).toFixed(2)} KB, ${duration.toFixed(1)}秒 (预期${expectedDuration.toFixed(1)}秒) ${status}`)
          
          if (ratio < 0.7) {
            console.error(`         ⚠️  警告: 第 ${info.index} 段音频时长偏短，可能被截断！`)
            console.error(`         文本预览: "${textChunks[i].substring(0, 100)}..."`)
          }
        } catch (error) {
          console.warn(`       段 ${info.index}: 无法获取时长信息`)
        }
      }
      
      // 清理临时文件
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
      
      console.log(`    📈 总时长统计: 实际 ${totalActualDuration.toFixed(1)}秒 / 预期 ${totalExpectedDuration.toFixed(1)}秒 (${(totalActualDuration / totalExpectedDuration * 100).toFixed(1)}%)`)
      
      if (totalActualDuration / totalExpectedDuration < 0.8) {
        console.error(`    ⚠️  警告: 总音频时长明显偏短，可能某些段被截断！`)
      }

      // 拼接所有音频段
      console.log(`    🔗 拼接 ${audioBuffers.length} 段音频...`)
      const tempOutputPath = path.join(os.tmpdir(), `merged-${reading.id}-${Date.now()}.mp3`)
      const mergedBuffer = await concatenateAudioFiles(audioBuffers, tempOutputPath)
      console.log(`    ✓ 拼接完成（${(mergedBuffer.length / 1024).toFixed(2)} KB）`)

      // 清理临时文件
      await fs.unlink(tempOutputPath).catch(() => {})

      // 上传到 OSS
      const ossObjectName = `readings/audio/${reading.unit_id}_${reading.id}.mp3`
      console.log(`    ⬆️  上传到 OSS...`)
      const ossUrl = await uploadToOSS(mergedBuffer, ossObjectName)

      // 更新数据库
      const publicUrl = `https://${OSS_BUCKET}.${OSS_REGION}.aliyuncs.com/${ossObjectName}`
      await pool.query(
        'UPDATE unit_readings SET audio_url = ? WHERE id = ?',
        [publicUrl, reading.id]
      )

      console.log(`    ✅ 音频生成成功: ${publicUrl}`)
      return publicUrl
    }
  } catch (error) {
    console.error(`    ❌ 生成失败: ${error.message}`)
    return null
  }
}

// 主函数
async function generateAllAudio() {
  console.log('🎙️  开始为阅读文章生成语音...\n')

  try {
    // 初始化 OSS
    initOSSClient()

    // 检查是否强制重新生成
    const forceRegenerate = process.argv.includes('--force') || process.argv.includes('-f')
    
    // 获取需要生成音频的文章
    let query = `
      SELECT id, unit_id, title, content
      FROM unit_readings
    `
    
    if (!forceRegenerate) {
      // 只获取没有音频的文章
      query += ` WHERE audio_url IS NULL OR audio_url = ''`
    }
    
    query += ` ORDER BY unit_id, order_index`
    
    const [readings] = await pool.query(query)

    console.log(`📚 找到 ${readings.length} 篇需要生成音频的文章\n`)

    if (readings.length === 0) {
      console.log('✅ 所有文章都已有音频')
      return
    }

    // 检查是否有测试模式参数（数字参数）
    const numericArgs = process.argv.slice(2).filter(arg => !arg.startsWith('-')).map(arg => parseInt(arg)).filter(n => !isNaN(n))
    const limitCount = numericArgs.length > 0 ? numericArgs[0] : null
    if (limitCount) {
      console.log(`🎯 测试模式：本次只处理前 ${limitCount} 篇文章\n`)
      readings.splice(limitCount)
    }
    
    if (forceRegenerate) {
      console.log(`🔄 强制重新生成模式：将重新生成所有文章的音频\n`)
    }

    let successCount = 0
    let failCount = 0

    for (let i = 0; i < readings.length; i++) {
      console.log(`[${i + 1}/${readings.length}] 处理文章...`)
      const result = await generateAudioForReading(readings[i])

      if (result) {
        successCount++
      } else {
        failCount++
      }

      // 每篇文章之间延迟，避免请求过快
      if (i < readings.length - 1) {
        console.log(`    ⏸️  等待 3 秒...`)
        await delay(3000)
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ 完成！')
    console.log(`   成功生成: ${successCount} 个音频`)
    console.log(`   失败: ${failCount} 个`)
    console.log(`   总计: ${readings.length} 篇文章`)
    console.log('='.repeat(60))
  } catch (error) {
    console.error('\n💥 脚本执行失败:', error)
    throw error
  } finally {
    process.exit(0)
  }
}

// 运行
generateAllAudio().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})


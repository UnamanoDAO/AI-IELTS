import mysql from 'mysql2/promise'
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

// 创建数据库连接池（带超时配置）
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 30000, // 30秒连接超时
  acquireTimeout: 30000  // 30秒获取连接超时
})

// 阿里云配置
const ALIYUN_ACCESS_KEY_ID = process.env.ALIYUN_ACCESS_KEY_ID || ''
const ALIYUN_ACCESS_KEY_SECRET = process.env.ALIYUN_ACCESS_KEY_SECRET || ''
const ALIYUN_APP_KEY = process.env.ALIYUN_TTS_APP_KEY || ''

// OSS 配置
const OSS_REGION = 'oss-cn-beijing'
const OSS_BUCKET = 'creatimage'

// 语音合成配置
const TTS_ENDPOINT = 'https://nls-gateway-cn-beijing.aliyuncs.com'
const VOICE = 'zhixiaoxia'
const FORMAT = 'mp3'
const SAMPLE_RATE = 24000
const VOLUME = 50
const SPEECH_RATE = 0

// 文本长度限制（阿里云同步TTS建议不超过600字符）
const MAX_TEXT_LENGTH = 600

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

// 获取 NLS Token
async function getNLSToken(retries = 3) {
  if (cachedToken && Date.now() < tokenExpireTime) {
    return cachedToken
  }

  if (!ALIYUN_ACCESS_KEY_ID || !ALIYUN_ACCESS_KEY_SECRET) {
    throw new Error('请在 .env 文件中配置 ALIYUN_ACCESS_KEY_ID 和 ALIYUN_ACCESS_KEY_SECRET')
  }

  const regions = ['cn-shanghai', 'cn-beijing']

  for (const region of regions) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 尝试获取 Token (区域: ${region}, 尝试 ${attempt}/${retries})...`)

        const client = new RPCClient({
          accessKeyId: ALIYUN_ACCESS_KEY_ID,
          accessKeySecret: ALIYUN_ACCESS_KEY_SECRET,
          endpoint: `https://nls-meta.${region}.aliyuncs.com`,
          apiVersion: '2019-02-28',
          opts: {
            timeout: 15000
          }
        })

        const result = await client.request('CreateToken')

        if (result && result.Token && result.Token.Id) {
          cachedToken = result.Token.Id
          const expireTime = result.Token.ExpireTime || 3600
          tokenExpireTime = Date.now() + expireTime * 1000 - 5 * 60 * 1000
          console.log(`✓ Token 获取成功 (区域: ${region})`)
          return cachedToken
        } else {
          throw new Error('Token 响应格式错误')
        }
      } catch (error) {
        const isLastAttempt = attempt === retries && region === regions[regions.length - 1]

        if (isLastAttempt) {
          console.error(`❌ 获取 Token 失败: ${error.message}`)
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

// 文本分段函数
function splitTextIntoChunks(text) {
  if (text.length <= MAX_TEXT_LENGTH) {
    return [text]
  }

  const chunks = []
  let currentChunk = ''

  // 按句子分割
  const sentenceEndRegex = /([。！？.!?\n])/
  const parts = text.split(sentenceEndRegex)

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]

    if (part === '') continue

    const testChunk = currentChunk + part

    if (testChunk.length <= MAX_TEXT_LENGTH) {
      currentChunk = testChunk
    } else {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk)
      }

      if (part.length > MAX_TEXT_LENGTH) {
        let remainingPart = part
        while (remainingPart.length > MAX_TEXT_LENGTH) {
          let splitPos = MAX_TEXT_LENGTH

          for (let pos = MAX_TEXT_LENGTH; pos > MAX_TEXT_LENGTH - 50 && pos > 0; pos--) {
            const char = remainingPart[pos]
            if (char === ' ' || char === ',' || char === '，' || char === ';' || char === '；') {
              splitPos = pos + 1
              break
            }
          }

          const chunkPart = remainingPart.substring(0, splitPos)
          chunks.push(chunkPart)
          remainingPart = remainingPart.substring(splitPos)
        }

        currentChunk = remainingPart
      } else {
        currentChunk = part
      }
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk)
  }

  return chunks
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

// 提交语音合成任务
async function submitTTSTask(text, taskId) {
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
    'x-nls-token': token
  }

  const signature = generateSignature('POST', uri, headers, {}, body, ALIYUN_ACCESS_KEY_SECRET)
  headers['Authorization'] = `NLS ${ALIYUN_ACCESS_KEY_ID}:${signature}`

  try {
    const response = await fetch(`${TTS_ENDPOINT}${uri}`, {
      method: 'POST',
      headers: headers,
      body: body
    })

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

    if (contentType.includes('audio/')) {
      console.log(`    ✓ 音频生成成功（同步模式）`)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = Buffer.from(arrayBuffer)
      return { type: 'sync', audio: audioBuffer }
    } else {
      throw new Error(`意外的响应格式: ${contentType}`)
    }
  } catch (error) {
    console.error(`    ❌ 提交 TTS 任务失败: ${error.message}`)
    throw error
  }
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
    const tempFiles = []
    for (let i = 0; i < audioBuffers.length; i++) {
      const tempFile = path.join(tempDir, `part-${i}.mp3`)
      await fs.writeFile(tempFile, audioBuffers[i])
      tempFiles.push(tempFile)
    }

    const fileListPath = path.join(tempDir, 'filelist.txt')
    const fileListContent = tempFiles.map(file => `file '${file.replace(/\\/g, '/')}'`).join('\n')
    await fs.writeFile(fileListPath, fileListContent)

    const ffmpegCmd = `ffmpeg -f concat -safe 0 -i "${fileListPath}" -c copy "${outputPath}" -y`
    await execAsync(ffmpegCmd)

    const mergedBuffer = await fs.readFile(outputPath)

    await fs.rm(tempDir, { recursive: true, force: true })

    return mergedBuffer
  } catch (error) {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
    throw new Error(`音频拼接失败: ${error.message}`)
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

// 为单篇文章生成完整音频
async function generateFullAudioForReading(reading) {
  console.log(`\n  文章 ${reading.id}: ${reading.title}`)
  console.log(`    📝 内容长度: ${reading.content.length} 字符`)

  try {
    // 分段处理
    const textChunks = splitTextIntoChunks(reading.content)
    console.log(`    📦 文本分为 ${textChunks.length} 段`)

    // 显示每段的信息
    textChunks.forEach((chunk, idx) => {
      const preview = chunk.substring(0, 60).replace(/\n/g, ' ')
      console.log(`      段 ${idx + 1}: ${chunk.length} 字符 - "${preview}${chunk.length > 60 ? '...' : ''}"`)
    })

    if (textChunks.length === 1) {
      // 单段文本
      console.log(`    🎙️  提交语音合成任务...`)
      const taskResult = await submitTTSTask(reading.content, `reading_${reading.id}`)

      const audioBuffer = taskResult.audio
      console.log(`    ✓ 收到音频数据（${(audioBuffer.length / 1024).toFixed(2)} KB）`)

      // 上传到 OSS
      const ossObjectName = `readings/audio/${reading.unit_id}_${reading.id}.mp3`
      console.log(`    ⬆️  上传到 OSS...`)
      await uploadToOSS(audioBuffer, ossObjectName)

      // 更新数据库
      const publicUrl = `https://${OSS_BUCKET}.${OSS_REGION}.aliyuncs.com/${ossObjectName}`
      await pool.query(
        'UPDATE unit_readings SET audio_url = ? WHERE id = ?',
        [publicUrl, reading.id]
      )

      console.log(`    ✅ 音频生成成功: ${publicUrl}`)
      return publicUrl
    } else {
      // 多段文本
      console.log(`    🎙️  分段生成音频（共 ${textChunks.length} 段）...`)

      // 检查 ffmpeg
      const hasFFmpeg = await checkFFmpegAvailable()
      if (!hasFFmpeg) {
        throw new Error('需要安装 ffmpeg 才能拼接多段音频。')
      }

      const audioBuffers = []

      // 为每段生成音频
      for (let i = 0; i < textChunks.length; i++) {
        const chunkText = textChunks[i]
        console.log(`    📝 处理第 ${i + 1}/${textChunks.length} 段（${chunkText.length} 字符）...`)

        const taskResult = await submitTTSTask(chunkText, `reading_${reading.id}_chunk_${i}`)
        const chunkBuffer = taskResult.audio
        const sizeKB = (chunkBuffer.length / 1024).toFixed(2)
        console.log(`      ✓ 第 ${i + 1} 段生成成功（${sizeKB} KB）`)

        if (!chunkBuffer || chunkBuffer.length === 0) {
          throw new Error(`第 ${i + 1} 段音频为空！`)
        }

        audioBuffers.push(chunkBuffer)

        // 段之间延迟
        if (i < textChunks.length - 1) {
          await delay(1000)
        }
      }

      console.log(`    ✅ 所有 ${audioBuffers.length} 段音频生成完成`)

      // 拼接音频
      console.log(`    🔗 拼接 ${audioBuffers.length} 段音频...`)
      const tempOutputPath = path.join(os.tmpdir(), `merged-${reading.id}-${Date.now()}.mp3`)
      const mergedBuffer = await concatenateAudioFiles(audioBuffers, tempOutputPath)
      console.log(`    ✓ 拼接完成（${(mergedBuffer.length / 1024).toFixed(2)} KB）`)

      // 清理临时文件
      await fs.unlink(tempOutputPath).catch(() => {})

      // 上传到 OSS
      const ossObjectName = `readings/audio/${reading.unit_id}_${reading.id}.mp3`
      console.log(`    ⬆️  上传到 OSS...`)
      await uploadToOSS(mergedBuffer, ossObjectName)

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
    throw error
  }
}

// 测试数据库连接
async function testDatabaseConnection() {
  try {
    console.log('⏳ 测试数据库连接...')
    const connection = await pool.getConnection()
    console.log('✓ 数据库连接成功\n')
    connection.release()
    return true
  } catch (error) {
    console.error('✗ 数据库连接失败:', error.message)
    console.error('   错误代码:', error.code)
    console.error('\n💡 可能的解决方案:')
    console.error('   1. 检查网络连接')
    console.error('   2. 确认阿里云 RDS 白名单设置')
    console.error('   3. 检查 .env 文件中的数据库配置')
    console.error('   4. 确保后端服务正在运行（npm run dev）\n')
    return false
  }
}

// 主函数 - 重新生成指定单元的音频
async function regenerateAudio() {
  // 获取命令行参数
  const args = process.argv.slice(2)
  const unitNumber = args.find(arg => !arg.startsWith('-') && !isNaN(parseInt(arg)))
  const forceRegenerate = args.includes('--force') || args.includes('-f')
  const allUnits = args.includes('--all') || args.includes('-a')

  if (!unitNumber && !allUnits) {
    console.log('用法:')
    console.log('  npm run regenerate-full-audio -- <unit_number>       # 重新生成指定单元的音频')
    console.log('  npm run regenerate-full-audio -- --all               # 重新生成所有单元的音频')
    console.log('  npm run regenerate-full-audio -- <unit_number> --force  # 强制重新生成（即使已有音频）')
    console.log('\n或直接使用 node:')
    console.log('  node scripts/regenerate-full-audio.js 1              # 重新生成 Unit 1')
    console.log('  node scripts/regenerate-full-audio.js --all          # 重新生成所有单元')
    console.log('  node scripts/regenerate-full-audio.js 1 --force      # 强制重新生成 Unit 1')
    process.exit(0)
  }

  const unitDesc = allUnits ? '所有单元' : `Unit ${unitNumber}`
  console.log(`🎙️  开始为 ${unitDesc} 重新生成完整音频...\n`)

  try {
    // 测试数据库连接
    const dbConnected = await testDatabaseConnection()
    if (!dbConnected) {
      throw new Error('数据库连接失败，请检查配置')
    }

    // 初始化 OSS
    initOSSClient()

    // 构建查询
    let query = `
      SELECT ur.id, ur.unit_id, ur.title, ur.content, ur.audio_url, lu.unit_name, lu.unit_number
      FROM unit_readings ur
      LEFT JOIN learning_units lu ON ur.unit_id = lu.id
    `

    const params = []
    if (!allUnits) {
      query += ' WHERE lu.unit_number = ?'
      params.push(parseInt(unitNumber))
    }

    query += ' ORDER BY lu.unit_number, ur.order_index'

    const [readings] = await pool.query(query, params)

    console.log(`📚 找到 ${readings.length} 篇文章\n`)

    if (readings.length === 0) {
      console.log(`❌ 未找到 ${unitDesc} 的文章`)
      return
    }

    // 过滤出需要生成音频的文章
    const readingsToProcess = forceRegenerate
      ? readings
      : readings.filter(r => !r.audio_url || r.audio_url === '')

    if (readingsToProcess.length === 0) {
      console.log(`✅ 所有文章都已有音频。使用 --force 参数强制重新生成。`)
      return
    }

    console.log(`🎯 本次将处理 ${readingsToProcess.length} 篇文章${forceRegenerate ? '（强制重新生成）' : ''}`)
    console.log('')

    let successCount = 0
    let failCount = 0

    for (let i = 0; i < readingsToProcess.length; i++) {
      const reading = readingsToProcess[i]
      console.log(`[${i + 1}/${readingsToProcess.length}] ${reading.unit_name || 'Unit ' + reading.unit_number}`)

      try {
        await generateFullAudioForReading(reading)
        successCount++
      } catch (error) {
        console.error(`    ❌ 处理失败: ${error.message}`)
        failCount++
      }

      if (i < readingsToProcess.length - 1) {
        console.log(`    ⏸️  等待 2 秒...`)
        await delay(2000)
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ 完成！')
    console.log(`   成功: ${successCount} 篇`)
    console.log(`   失败: ${failCount} 篇`)
    console.log(`   总计: ${readingsToProcess.length} 篇`)
    console.log('='.repeat(60))
  } catch (error) {
    console.error('\n💥 脚本执行失败:', error)
    throw error
  } finally {
    process.exit(0)
  }
}

// 运行
regenerateAudio().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

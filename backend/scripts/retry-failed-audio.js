import mysql from 'mysql2/promise'
import OSS from 'ali-oss'
import dotenv from 'dotenv'
import RPCClient from '@alicloud/pop-core'
import https from 'https'
import http from 'http'

dotenv.config()

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
  connectTimeout: 30000,
  acquireTimeout: 30000
})

const ALIYUN_ACCESS_KEY_ID = process.env.ALIYUN_ACCESS_KEY_ID || ''
const ALIYUN_ACCESS_KEY_SECRET = process.env.ALIYUN_ACCESS_KEY_SECRET || ''
const ALIYUN_APP_KEY = process.env.ALIYUN_TTS_APP_KEY || ''

const OSS_REGION = 'oss-cn-beijing'
const OSS_BUCKET = 'creatimage'

const LONG_TTS_URL = 'https://nls-gateway-cn-shanghai.aliyuncs.com/rest/v1/tts/async'
const VOICE = 'zhixiaoxia'
const FORMAT = 'mp3'
const SAMPLE_RATE = 24000

let ossClient = null
let cachedToken = null
let tokenExpireTime = 0

function initOSSClient() {
  ossClient = new OSS({
    region: OSS_REGION,
    accessKeyId: ALIYUN_ACCESS_KEY_ID,
    accessKeySecret: ALIYUN_ACCESS_KEY_SECRET,
    bucket: OSS_BUCKET
  })
  console.log('✓ OSS 客户端初始化成功')
}

async function getNLSToken(retries = 3) {
  if (cachedToken && Date.now() < tokenExpireTime) {
    return cachedToken
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
          opts: { timeout: 15000 }
        })

        const result = await client.request('CreateToken')

        if (result && result.Token && result.Token.Id) {
          cachedToken = result.Token.Id
          const expireTime = result.Token.ExpireTime || 3600
          tokenExpireTime = Date.now() + expireTime * 1000 - 5 * 60 * 1000
          console.log(`✓ Token 获取成功 (区域: ${region})`)
          return cachedToken
        }
      } catch (error) {
        const isLastAttempt = attempt === retries && region === regions[regions.length - 1]
        if (isLastAttempt) throw error
        if (attempt < retries) await delay(2000)
      }
    }
  }
  throw new Error('所有区域和重试都失败，无法获取 Token')
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function submitLongTTSTask(text, readingId) {
  const token = await getNLSToken()

  const requestBody = {
    header: { appkey: ALIYUN_APP_KEY, token: token },
    context: { device_id: `reading_${readingId}` },
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

  console.log(`    🎙️  提交长文本 TTS 任务...`)
  const response = await fetch(LONG_TTS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  })

  const result = await response.json()
  if (!response.ok || result.error_code !== 20000000) {
    const errorMsg = result.error_message || response.statusText
    throw new Error(`提交任务失败: ${errorMsg}`)
  }

  const taskId = result.data.task_id
  console.log(`    ✓ 任务提交成功，Task ID: ${taskId}`)
  return taskId
}

async function queryTaskStatus(taskId) {
  const token = await getNLSToken()
  const queryUrl = `${LONG_TTS_URL}?appkey=${ALIYUN_APP_KEY}&task_id=${taskId}&token=${token}`
  const response = await fetch(queryUrl)
  const result = await response.json()
  if (!response.ok) {
    const errorMsg = result.error_message || response.statusText
    throw new Error(`查询失败: ${errorMsg}`)
  }
  return result
}

async function waitForTaskCompletion(taskId, maxWaitTime = 300000) {
  const startTime = Date.now()
  const checkInterval = 5000

  console.log(`    ⏳ 等待任务完成...`)
  while (Date.now() - startTime < maxWaitTime) {
    await delay(checkInterval)
    const status = await queryTaskStatus(taskId)

    if (status.error_code === 20000000 && status.data && status.data.audio_address) {
      console.log(`    ✓ 任务完成！`)
      return status.data.audio_address
    } else if (status.error_message === 'RUNNING' || status.error_message === 'QUEUEING') {
      console.log(`    ⏳ 任务状态: ${status.error_message}`)
    } else {
      throw new Error(`任务失败，状态: ${status.error_message}`)
    }
  }
  throw new Error('任务超时（超过5分钟）')
}

async function downloadAudio(url, maxRetries = 3) {
  console.log(`    ⬇️  下载音频文件...`)

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const protocol = url.startsWith('https') ? https : http

      return await new Promise((resolve, reject) => {
        const request = protocol.get(url, {
          timeout: 30000
        }, (res) => {
          const chunks = []
          res.on('data', chunk => chunks.push(chunk))
          res.on('end', () => {
            const buffer = Buffer.concat(chunks)
            console.log(`    ✓ 下载完成 (${(buffer.length / 1024).toFixed(2)} KB)`)
            resolve(buffer)
          })
          res.on('error', reject)
        })

        request.on('error', reject)
        request.on('timeout', () => {
          request.destroy()
          reject(new Error('下载超时'))
        })
      })
    } catch (error) {
      if (attempt < maxRetries) {
        console.log(`    ⚠️  下载失败 (尝试 ${attempt}/${maxRetries}): ${error.message}，3秒后重试...`)
        await delay(3000)
      } else {
        throw error
      }
    }
  }
}

async function uploadToOSS(buffer, objectName) {
  const result = await ossClient.put(objectName, buffer, {
    headers: { 'Content-Type': 'audio/mpeg' }
  })
  console.log(`    ✓ 上传到 OSS 成功: ${result.name}`)
  return result.url
}

async function generateLongTTSAudio(reading) {
  console.log(`\n  文章 ${reading.id}: ${reading.title}`)
  console.log(`    📝 内容长度: ${reading.content.length} 字符`)

  const taskId = await submitLongTTSTask(reading.content, reading.id)
  const audioAddress = await waitForTaskCompletion(taskId)
  const audioBuffer = await downloadAudio(audioAddress)

  const ossObjectName = `readings/audio/${reading.unit_id}_${reading.id}.mp3`
  console.log(`    ⬆️  上传到 OSS...`)
  await uploadToOSS(audioBuffer, ossObjectName)

  const publicUrl = `https://${OSS_BUCKET}.${OSS_REGION}.aliyuncs.com/${ossObjectName}`
  await pool.query(
    'UPDATE unit_readings SET audio_url = ? WHERE id = ?',
    [publicUrl, reading.id]
  )

  console.log(`    ✅ 音频生成成功: ${publicUrl}`)
  return publicUrl
}

async function main() {
  console.log('🎙️  重试失败的文章音频生成...\n')

  try {
    console.log('⏳ 测试数据库连接...')
    const connection = await pool.getConnection()
    console.log('✓ 数据库连接成功\n')
    connection.release()

    initOSSClient()

    const [readings] = await pool.query(`
      SELECT ur.id, ur.unit_id, ur.title, ur.content, ur.audio_url, lu.unit_name, lu.unit_number
      FROM unit_readings ur
      LEFT JOIN learning_units lu ON ur.unit_id = lu.id
      WHERE ur.audio_url IS NULL OR ur.audio_url = ''
      ORDER BY lu.unit_number, ur.order_index
    `)

    console.log(`📚 找到 ${readings.length} 篇缺少音频的文章\n`)

    if (readings.length === 0) {
      console.log('✅ 所有文章都已有音频！')
      return
    }

    let successCount = 0
    let failCount = 0

    for (let i = 0; i < readings.length; i++) {
      const reading = readings[i]
      console.log(`[${i + 1}/${readings.length}] ${reading.unit_name || 'Unit ' + reading.unit_number}`)

      try {
        await generateLongTTSAudio(reading)
        successCount++
      } catch (error) {
        console.error(`    ❌ 处理失败: ${error.message}`)
        failCount++
      }

      if (i < readings.length - 1) {
        console.log(`    ⏸️  等待 5 秒...`)
        await delay(5000)
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ 重试完成！')
    console.log(`   成功: ${successCount} 篇`)
    console.log(`   失败: ${failCount} 篇`)
    console.log(`   总计: ${readings.length} 篇`)
    console.log('='.repeat(60))
  } catch (error) {
    console.error('\n💥 脚本执行失败:', error)
    throw error
  } finally {
    process.exit(0)
  }
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

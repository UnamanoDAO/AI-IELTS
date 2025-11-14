import mysql from 'mysql2/promise'
import OSS from 'ali-oss'
import dotenv from 'dotenv'
import RPCClient from '@alicloud/pop-core'
import https from 'https'
import http from 'http'

// 加载环境变量
dotenv.config()

// 创建数据库连接池
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

// 阿里云配置
const ALIYUN_ACCESS_KEY_ID = process.env.ALIYUN_ACCESS_KEY_ID || ''
const ALIYUN_ACCESS_KEY_SECRET = process.env.ALIYUN_ACCESS_KEY_SECRET || ''
const ALIYUN_APP_KEY = process.env.ALIYUN_TTS_APP_KEY || ''

// OSS 配置
const OSS_REGION = 'oss-cn-beijing'
const OSS_BUCKET = 'creatimage'

// 长文本 TTS 配置
const LONG_TTS_URL = 'https://nls-gateway-cn-shanghai.aliyuncs.com/rest/v1/tts/async'
const VOICE = 'zhixiaoxia'
const FORMAT = 'mp3'
const SAMPLE_RATE = 24000

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

// 提交长文本语音合成任务
async function submitLongTTSTask(text, readingId) {
  const token = await getNLSToken()

  const requestBody = {
    header: {
      appkey: ALIYUN_APP_KEY,
      token: token
    },
    context: {
      device_id: `reading_${readingId}`
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

  console.log(`    🎙️  提交长文本 TTS 任务...`)
  console.log(`    文本长度: ${text.length} 字符`)

  try {
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
    console.log(`    ✓ 任务提交成功，Task ID: ${taskId}`)

    return taskId
  } catch (error) {
    console.error(`    ❌ 提交任务失败: ${error.message}`)
    throw error
  }
}

// 查询任务状态
async function queryTaskStatus(taskId) {
  const token = await getNLSToken()
  const queryUrl = `${LONG_TTS_URL}?appkey=${ALIYUN_APP_KEY}&task_id=${taskId}&token=${token}`

  try {
    const response = await fetch(queryUrl)
    const result = await response.json()

    if (!response.ok) {
      throw new Error(`查询失败: ${result.error_message || response.statusText}`)
    }

    return result
  } catch (error) {
    console.error(`    ⚠️  查询任务状态失败: ${error.message}`)
    throw error
  }
}

// 等待任务完成
async function waitForTaskCompletion(taskId, maxWaitTime = 300000) {
  const startTime = Date.now()
  const checkInterval = 5000 // 每5秒检查一次

  console.log(`    ⏳ 等待任务完成...`)

  while (Date.now() - startTime < maxWaitTime) {
    await delay(checkInterval)

    try {
      const status = await queryTaskStatus(taskId)

      if (status.error_code === 20000000 && status.data && status.data.audio_address) {
        console.log(`    ✓ 任务完成！`)
        return status.data.audio_address
      } else if (status.error_message === 'RUNNING' || status.error_message === 'QUEUEING') {
        console.log(`    ⏳ 任务状态: ${status.error_message}`)
      } else {
        throw new Error(`任务失败，状态: ${status.error_message}`)
      }
    } catch (error) {
      console.error(`    ⚠️  检查状态时出错: ${error.message}`)
    }
  }

  throw new Error('任务超时（超过5分钟）')
}

// 下载音频文件
async function downloadAudio(url) {
  console.log(`    ⬇️  下载音频文件...`)

  // 判断使用 http 还是 https
  const protocol = url.startsWith('https') ? https : http

  return new Promise((resolve, reject) => {
    protocol.get(url, (res) => {
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => {
        const buffer = Buffer.concat(chunks)
        console.log(`    ✓ 下载完成 (${(buffer.length / 1024).toFixed(2)} KB)`)
        resolve(buffer)
      })
      res.on('error', reject)
    }).on('error', reject)
  })
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
    return false
  }
}

// 为单篇文章生成完整音频（使用长文本 TTS）
async function generateLongTTSAudio(reading) {
  console.log(`\n  文章 ${reading.id}: ${reading.title}`)
  console.log(`    📝 内容长度: ${reading.content.length} 字符`)

  try {
    // 1. 提交长文本 TTS 任务
    const taskId = await submitLongTTSTask(reading.content, reading.id)

    // 2. 等待任务完成
    const audioAddress = await waitForTaskCompletion(taskId)

    // 3. 下载音频文件
    const audioBuffer = await downloadAudio(audioAddress)

    // 4. 上传到 OSS
    const ossObjectName = `readings/audio/${reading.unit_id}_${reading.id}.mp3`
    console.log(`    ⬆️  上传到 OSS...`)
    await uploadToOSS(audioBuffer, ossObjectName)

    // 5. 更新数据库
    const publicUrl = `https://${OSS_BUCKET}.${OSS_REGION}.aliyuncs.com/${ossObjectName}`
    await pool.query(
      'UPDATE unit_readings SET audio_url = ? WHERE id = ?',
      [publicUrl, reading.id]
    )

    console.log(`    ✅ 音频生成成功: ${publicUrl}`)
    return publicUrl
  } catch (error) {
    console.error(`    ❌ 生成失败: ${error.message}`)
    throw error
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2)
  const unitNumber = args.find(arg => !arg.startsWith('-') && !isNaN(parseInt(arg)))
  const forceRegenerate = args.includes('--force') || args.includes('-f')
  const allUnits = args.includes('--all') || args.includes('-a')

  if (!unitNumber && !allUnits) {
    console.log('用法:')
    console.log('  npm run regenerate-longtts -- <unit_number>       # 使用长文本TTS生成指定单元的音频')
    console.log('  npm run regenerate-longtts -- --all               # 为所有单元生成音频')
    console.log('  npm run regenerate-longtts -- <unit_number> --force  # 强制重新生成')
    console.log('\n示例:')
    console.log('  node scripts/generate-longtts-audio.js 1          # 生成 Unit 1')
    process.exit(0)
  }

  const unitDesc = allUnits ? '所有单元' : `Unit ${unitNumber}`
  console.log(`🎙️  使用长文本 TTS 为 ${unitDesc} 生成完整音频...\n`)

  try {
    // 测试数据库连接
    const dbConnected = await testDatabaseConnection()
    if (!dbConnected) {
      throw new Error('数据库连接失败')
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
        await generateLongTTSAudio(reading)
        successCount++
      } catch (error) {
        console.error(`    ❌ 处理失败: ${error.message}`)
        failCount++
      }

      if (i < readingsToProcess.length - 1) {
        console.log(`    ⏸️  等待 3 秒...`)
        await delay(3000)
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
main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

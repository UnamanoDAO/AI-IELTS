import dotenv from 'dotenv'
import crypto from 'crypto'
import RPCClient from '@alicloud/pop-core'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

dotenv.config()
const execAsync = promisify(exec)

const ALIYUN_ACCESS_KEY_ID = process.env.ALIYUN_ACCESS_KEY_ID || ''
const ALIYUN_ACCESS_KEY_SECRET = process.env.ALIYUN_ACCESS_KEY_SECRET || ''
const ALIYUN_APP_KEY = process.env.ALIYUN_TTS_APP_KEY || ''
const TTS_ENDPOINT = 'https://nls-gateway-cn-beijing.aliyuncs.com'
const VOICE = 'zhixiaoxia'
const FORMAT = 'mp3'
const SAMPLE_RATE = 24000

let cachedToken = null
let tokenExpireTime = 0

async function getNLSToken() {
  if (cachedToken && Date.now() < tokenExpireTime) {
    return cachedToken
  }

  const client = new RPCClient({
    accessKeyId: ALIYUN_ACCESS_KEY_ID,
    accessKeySecret: ALIYUN_ACCESS_KEY_SECRET,
    endpoint: 'https://nls-meta.cn-shanghai.aliyuncs.com',
    apiVersion: '2019-02-28'
  })

  const result = await client.request('CreateToken')
  if (result && result.Token && result.Token.Id) {
    cachedToken = result.Token.Id
    const expireTime = result.Token.ExpireTime || 3600
    tokenExpireTime = Date.now() + expireTime * 1000 - 5 * 60 * 1000
    return cachedToken
  }
  throw new Error('无法获取Token')
}

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

async function testChunk(text, chunkIndex) {
  console.log(`\n测试段 ${chunkIndex}:`)
  console.log(`  文本长度: ${text.length} 字符`)
  console.log(`  文本预览: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`)
  
  const token = await getNLSToken()
  const uri = '/stream/v1/tts'
  const date = new Date().toUTCString()

  const payload = {
    appkey: ALIYUN_APP_KEY,
    text: text,
    format: FORMAT,
    sample_rate: SAMPLE_RATE,
    voice: VOICE,
    volume: 50,
    speech_rate: 0,
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

  const response = await fetch(`${TTS_ENDPOINT}${uri}`, {
    method: 'POST',
    headers: headers,
    body: body
  })

  const contentType = response.headers.get('content-type') || ''
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API错误 (${response.status}): ${errorText}`)
  }

  if (contentType.includes('audio/')) {
    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = Buffer.from(arrayBuffer)
    
    // 保存到临时文件
    const tempFile = path.join(os.tmpdir(), `chunk-${chunkIndex}-${Date.now()}.mp3`)
    await fs.writeFile(tempFile, audioBuffer)
    
    // 获取音频时长
    const { stdout } = await execAsync(
      `ffprobe -v quiet -print_format json -show_format "${tempFile}"`
    )
    const info = JSON.parse(stdout)
    const duration = parseFloat(info.format.duration || 0)
    
    // 估算预期时长
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length
    const estimatedDuration = wordCount / 2.5
    
    console.log(`  生成结果:`)
    console.log(`    文件大小: ${(audioBuffer.length / 1024).toFixed(2)} KB`)
    console.log(`    实际时长: ${duration.toFixed(2)} 秒`)
    console.log(`    预期时长: ${estimatedDuration.toFixed(2)} 秒`)
    console.log(`    词数: ${wordCount} 词`)
    
    const ratio = duration / estimatedDuration
    if (ratio < 0.7) {
      console.log(`    ⚠️  警告: 音频时长偏短 (${(ratio * 100).toFixed(1)}%)`)
    } else if (ratio > 1.3) {
      console.log(`    ⚠️  注意: 音频时长偏长 (${(ratio * 100).toFixed(1)}%)`)
    } else {
      console.log(`    ✅ 时长正常 (${(ratio * 100).toFixed(1)}%)`)
    }
    
    // 清理临时文件
    await fs.unlink(tempFile).catch(() => {})
    
    return { duration, size: audioBuffer.length, wordCount }
  } else {
    const text = await response.text()
    throw new Error(`意外的响应格式: ${contentType}, 内容: ${text.substring(0, 200)}`)
  }
}

async function main() {
  const text = process.argv[2]
  
  if (!text) {
    console.log('用法: node scripts/test-single-chunk.js "<文本内容>"')
    console.log('示例: node scripts/test-single-chunk.js "Hello world"')
    process.exit(1)
  }

  try {
    await testChunk(text, 1)
    process.exit(0)
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    process.exit(1)
  }
}

main()


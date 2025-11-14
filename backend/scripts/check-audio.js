import pool from '../src/config/database.js'
import OSS from 'ali-oss'
import dotenv from 'dotenv'
import { exec } from 'child_process'
import { promisify } from 'util'

dotenv.config()
const execAsync = promisify(exec)

// 阿里云配置
const ALIYUN_ACCESS_KEY_ID = process.env.ALIYUN_ACCESS_KEY_ID || ''
const ALIYUN_ACCESS_KEY_SECRET = process.env.ALIYUN_ACCESS_KEY_SECRET || ''
const OSS_REGION = 'oss-cn-beijing'
const OSS_BUCKET = 'creatimage'

// 初始化 OSS 客户端
const ossClient = new OSS({
  region: OSS_REGION,
  accessKeyId: ALIYUN_ACCESS_KEY_ID,
  accessKeySecret: ALIYUN_ACCESS_KEY_SECRET,
  bucket: OSS_BUCKET
})

// 获取音频文件信息（使用 ffprobe）
async function getAudioInfo(url) {
  try {
    // 下载文件到临时位置
    const response = await fetch(url)
    if (!response.ok) {
      return { error: `无法下载文件: ${response.status}` }
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // 保存到临时文件
    const fs = await import('fs/promises')
    const path = await import('path')
    const os = await import('os')
    
    const tempFile = path.join(os.tmpdir(), `audio-check-${Date.now()}.mp3`)
    await fs.writeFile(tempFile, buffer)
    
    try {
      // 使用 ffprobe 获取音频信息
      const { stdout } = await execAsync(
        `ffprobe -v quiet -print_format json -show_format -show_streams "${tempFile}"`
      )
      
      const info = JSON.parse(stdout)
      const format = info.format || {}
      const stream = info.streams?.[0] || {}
      
      // 清理临时文件
      await fs.unlink(tempFile).catch(() => {})
      
      return {
        duration: parseFloat(format.duration || 0),
        size: parseInt(format.size || buffer.length),
        bitrate: parseInt(format.bit_rate || 0),
        codec: stream.codec_name || 'unknown',
        sampleRate: stream.sample_rate || 'unknown'
      }
    } catch (error) {
      // 清理临时文件
      await fs.unlink(tempFile).catch(() => {})
      throw error
    }
  } catch (error) {
    return { error: error.message }
  }
}

async function checkAudio() {
  const readingId = process.argv[2]
  
  if (!readingId) {
    console.log('用法: node scripts/check-audio.js <reading_id>')
    console.log('示例: node scripts/check-audio.js 335')
    process.exit(1)
  }

  try {
    // 1. 查询数据库中的音频信息
    const [readings] = await pool.query(
      `SELECT id, title, content, audio_url, 
              LENGTH(content) as content_length
       FROM unit_readings 
       WHERE id = ?`,
      [readingId]
    )

    if (readings.length === 0) {
      console.log(`❌ 文章 ${readingId} 不存在`)
      process.exit(1)
    }

    const reading = readings[0]
    console.log(`\n📄 文章信息:`)
    console.log(`   ID: ${reading.id}`)
    console.log(`   标题: ${reading.title}`)
    console.log(`   内容长度: ${reading.content_length} 字符`)
    console.log(`   音频URL: ${reading.audio_url || '无'}`)

    if (!reading.audio_url) {
      console.log(`\n⚠️  该文章没有音频URL`)
      process.exit(0)
    }

    // 2. 检查OSS上的文件
    console.log(`\n📦 OSS 文件信息:`)
    try {
      const objectName = reading.audio_url.split(`/${OSS_BUCKET}.${OSS_REGION}.aliyuncs.com/`)[1]
      if (objectName) {
        const headResult = await ossClient.head(objectName)
        console.log(`   文件大小: ${(headResult.size / 1024).toFixed(2)} KB`)
        console.log(`   最后修改: ${headResult.lastModified}`)
        console.log(`   内容类型: ${headResult.res.headers['content-type']}`)
      }
    } catch (error) {
      console.log(`   ⚠️  无法获取OSS文件信息: ${error.message}`)
    }

    // 3. 获取音频详细信息（时长等）
    console.log(`\n🎵 音频详细信息:`)
    const audioInfo = await getAudioInfo(reading.audio_url)
    
    if (audioInfo.error) {
      console.log(`   ❌ 无法获取音频信息: ${audioInfo.error}`)
    } else {
      console.log(`   时长: ${audioInfo.duration.toFixed(2)} 秒 (${(audioInfo.duration / 60).toFixed(2)} 分钟)`)
      console.log(`   文件大小: ${(audioInfo.size / 1024).toFixed(2)} KB`)
      console.log(`   比特率: ${audioInfo.bitrate} bps`)
      console.log(`   编码: ${audioInfo.codec}`)
      console.log(`   采样率: ${audioInfo.sampleRate} Hz`)
      
      // 估算：正常语速大约每分钟150-200字，英文可能更快
      const estimatedWords = reading.content.split(/\s+/).length
      const estimatedDuration = estimatedWords / 2.5 // 假设每分钟150词，即每秒2.5词
      
      console.log(`\n📊 分析:`)
      console.log(`   文章词数（估算）: ${estimatedWords} 词`)
      console.log(`   预期时长（估算）: ${estimatedDuration.toFixed(2)} 秒 (${(estimatedDuration / 60).toFixed(2)} 分钟)`)
      console.log(`   实际时长: ${audioInfo.duration.toFixed(2)} 秒`)
      
      const ratio = audioInfo.duration / estimatedDuration
      if (ratio < 0.3) {
        console.log(`\n   ⚠️  警告: 音频时长明显偏短！`)
        console.log(`   实际时长仅为预期的 ${(ratio * 100).toFixed(1)}%`)
        console.log(`   可能原因:`)
        console.log(`   1. 只生成了部分文本的音频`)
        console.log(`   2. 文本被截断了`)
        console.log(`   3. API返回了不完整的音频`)
      } else if (ratio < 0.7) {
        console.log(`\n   ⚠️  注意: 音频时长偏短`)
        console.log(`   实际时长约为预期的 ${(ratio * 100).toFixed(1)}%`)
      } else {
        console.log(`\n   ✅ 音频时长正常`)
      }
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ 检查失败:', error.message)
    process.exit(1)
  }
}

checkAudio()


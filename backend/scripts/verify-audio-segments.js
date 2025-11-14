import pool from '../src/config/database.js'
import OSS from 'ali-oss'
import dotenv from 'dotenv'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

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

// 获取音频时长
async function getAudioDuration(audioPath) {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v quiet -print_format json -show_format "${audioPath}"`
    )
    const info = JSON.parse(stdout)
    return parseFloat(info.format.duration || 0)
  } catch (error) {
    return null
  }
}

// 分段文本（与生成脚本相同的逻辑）
const MAX_TEXT_LENGTH = 500

function splitTextIntoChunks(text) {
  if (text.length <= MAX_TEXT_LENGTH) {
    return [text]
  }

  const chunks = []
  let currentChunk = ''
  
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
          chunks.push(remainingPart.substring(0, splitPos))
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

async function verifyAudio() {
  const readingId = process.argv[2]
  
  if (!readingId) {
    console.log('用法: node scripts/verify-audio-segments.js <reading_id>')
    process.exit(1)
  }

  try {
    // 获取文章信息
    const [readings] = await pool.query(
      `SELECT id, title, content, audio_url 
       FROM unit_readings 
       WHERE id = ?`,
      [readingId]
    )

    if (readings.length === 0) {
      console.log(`❌ 文章 ${readingId} 不存在`)
      process.exit(1)
    }

    const reading = readings[0]
    console.log(`\n📄 文章: ${reading.title}`)
    console.log(`   内容长度: ${reading.content.length} 字符`)
    console.log(`   音频URL: ${reading.audio_url || '无'}\n`)

    if (!reading.audio_url) {
      console.log(`⚠️  该文章没有音频`)
      process.exit(0)
    }

    // 分段文本
    const chunks = splitTextIntoChunks(reading.content)
    console.log(`📦 文本分为 ${chunks.length} 段:\n`)
    
    chunks.forEach((chunk, idx) => {
      const wordCount = chunk.split(/\s+/).filter(w => w.length > 0).length
      const estimatedDuration = wordCount / 2.5 // 每分钟150词
      console.log(`   段 ${idx + 1}: ${chunk.length} 字符, ${wordCount} 词, 预期时长约 ${estimatedDuration.toFixed(1)} 秒`)
      console.log(`      预览: "${chunk.substring(0, 80)}${chunk.length > 80 ? '...' : ''}"\n`)
    })

    // 下载完整音频
    console.log(`⬇️  下载完整音频文件...`)
    const response = await fetch(reading.audio_url)
    if (!response.ok) {
      throw new Error(`无法下载音频: ${response.status}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    const tempFile = path.join(os.tmpdir(), `audio-verify-${Date.now()}.mp3`)
    await fs.writeFile(tempFile, buffer)
    
    // 获取完整音频时长
    const totalDuration = await getAudioDuration(tempFile)
    console.log(`\n🎵 完整音频信息:`)
    console.log(`   文件大小: ${(buffer.length / 1024).toFixed(2)} KB`)
    console.log(`   总时长: ${totalDuration?.toFixed(2) || '未知'} 秒`)
    
    // 估算总预期时长
    const totalWords = reading.content.split(/\s+/).filter(w => w.length > 0).length
    const estimatedTotalDuration = totalWords / 2.5
    console.log(`   预期时长: ${estimatedTotalDuration.toFixed(2)} 秒 (${(estimatedTotalDuration / 60).toFixed(2)} 分钟)`)
    
    if (totalDuration) {
      const ratio = totalDuration / estimatedTotalDuration
      console.log(`   实际/预期比例: ${(ratio * 100).toFixed(1)}%`)
      
      if (ratio < 0.7) {
        console.log(`\n   ⚠️  警告: 音频时长明显偏短！`)
        console.log(`   可能原因:`)
        console.log(`   1. 某些段在API调用时被截断`)
        console.log(`   2. 某些段生成失败但没有报错`)
        console.log(`   3. 拼接时丢失了某些段`)
      } else if (ratio > 1.3) {
        console.log(`\n   ⚠️  注意: 音频时长偏长`)
      } else {
        console.log(`\n   ✅ 音频时长在合理范围内`)
      }
    }

    // 清理临时文件
    await fs.unlink(tempFile).catch(() => {})

    // 验证分段文本完整性
    const allChunksText = chunks.join('')
    if (allChunksText.length !== reading.content.length) {
      console.log(`\n❌ 分段文本验证失败:`)
      console.log(`   原文长度: ${reading.content.length}`)
      console.log(`   分段后长度: ${allChunksText.length}`)
      console.log(`   差异: ${reading.content.length - allChunksText.length} 字符`)
    } else {
      console.log(`\n✅ 分段文本验证通过: 所有字符都被包含`)
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ 验证失败:', error.message)
    process.exit(1)
  }
}

verifyAudio()


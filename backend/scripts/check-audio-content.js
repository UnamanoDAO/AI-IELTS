import https from 'https'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function downloadAndCheckAudio() {
  const audioUrl = 'https://creatimage.oss-cn-beijing.aliyuncs.com/readings/audio/1_334.mp3'
  const tempFile = path.join(os.tmpdir(), 'test-audio-334.mp3')

  console.log('📥 下载音频文件...')
  console.log('URL:', audioUrl)

  return new Promise((resolve, reject) => {
    https.get(audioUrl, (res) => {
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', async () => {
        const buffer = Buffer.concat(chunks)

        console.log('✅ 下载完成')
        console.log('文件大小:', (buffer.length / 1024).toFixed(2), 'KB')

        // 保存到临时文件
        await fs.writeFile(tempFile, buffer)
        console.log('保存到:', tempFile)

        // 使用 ffprobe 检查音频信息
        try {
          console.log('\n🔍 检查音频详情...')
          const { stdout } = await execAsync(
            `ffprobe -v quiet -print_format json -show_format "${tempFile}"`
          )

          const info = JSON.parse(stdout)
          const duration = parseFloat(info.format.duration || 0)
          const bitrate = parseInt(info.format.bit_rate || 0)

          console.log('\n音频信息:')
          console.log('  时长:', duration.toFixed(1), '秒')
          console.log('  码率:', (bitrate / 1000).toFixed(0), 'kbps')
          console.log('  格式:', info.format.format_name)

          // 估算应该包含的内容
          const firstChunkText = "In the study of physical geography, understanding the Earth's structure and the interconnected systems that govern it is crucial. The Earth is composed of several distinct layers, including the core, mantle, and crust. The core is the innermost part and is primarily made of iron and nickel. Surrounding the core is the mantle, a thick layer of semi-solid rock that moves slowly over time."

          const wordCount = firstChunkText.split(/\s+/).filter(w => w.length > 0).length
          const expectedDuration = wordCount / 2.5 // 每秒约2.5个词

          console.log('\n第1段文本分析:')
          console.log('  字符数:', firstChunkText.length)
          console.log('  单词数:', wordCount)
          console.log('  预期时长:', expectedDuration.toFixed(1), '秒')

          if (duration >= 60) {
            console.log('\n✅ 音频时长超过60秒，应该是完整的音频（包含所有8段）')
            console.log('   这说明 "Surrounding the core is the mantle" 这段话已经被转换成音频了')
          } else if (duration < 30) {
            console.log('\n⚠️ 音频时长少于30秒，可能只包含部分内容')
          }

          // 清理临时文件
          await fs.unlink(tempFile).catch(() => {})

          resolve()
        } catch (error) {
          console.error('检查音频信息失败:', error.message)
          await fs.unlink(tempFile).catch(() => {})
          reject(error)
        }
      })
    }).on('error', reject)
  })
}

downloadAndCheckAudio().then(() => {
  console.log('\n✅ 检查完成')
  process.exit(0)
}).catch(err => {
  console.error('错误:', err.message)
  process.exit(1)
})

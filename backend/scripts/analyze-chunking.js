import pool from '../src/config/database.js'

const MAX_TEXT_LENGTH = 400

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

async function analyzeChunking() {
  const [rows] = await pool.query('SELECT id, title, content FROM unit_readings WHERE id = 334')
  const article = rows[0]

  console.log('文章 334 分段详细分析\n')
  console.log('='.repeat(80))

  const chunks = splitTextIntoChunks(article.content)

  chunks.forEach((chunk, idx) => {
    console.log(`\n【段 ${idx + 1}】 长度: ${chunk.length} 字符`)
    console.log('-'.repeat(80))
    console.log(chunk)
    console.log('-'.repeat(80))

    // 检查是否以完整句子结束
    const lastChar = chunk[chunk.length - 1]
    if (lastChar === '.' || lastChar === '!' || lastChar === '?') {
      console.log('✅ 以完整句子结束')
    } else {
      console.log('⚠️ 未以句号结束，可能在句子中间断开')
    }
  })

  // 验证完整性
  const reassembled = chunks.join('')
  console.log('\n' + '='.repeat(80))
  console.log('完整性验证:')
  console.log('原文长度:', article.content.length)
  console.log('重组后长度:', reassembled.length)
  console.log('是否一致:', reassembled === article.content ? '✅ 是' : '❌ 否')

  if (reassembled !== article.content) {
    console.log('\n⚠️ 警告：分段后的文本与原文不一致！')
    console.log('丢失的字符数:', article.content.length - reassembled.length)
  }

  process.exit(0)
}

analyzeChunking()

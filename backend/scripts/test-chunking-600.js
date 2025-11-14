import pool from '../src/config/database.js'

const MAX_TEXT_LENGTH = 600

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

async function testChunking600() {
  const [rows] = await pool.query('SELECT id, title, content FROM unit_readings WHERE id = 334')
  const article = rows[0]

  console.log('文章 334 - 使用 600 字符限制分段\n')
  console.log('原文长度:', article.content.length, '字符\n')
  console.log('='.repeat(80))

  const chunks = splitTextIntoChunks(article.content)

  console.log('\n分段数量:', chunks.length, '段（之前是 8 段）\n')

  chunks.forEach((chunk, idx) => {
    console.log(`【段 ${idx + 1}】 长度: ${chunk.length} 字符`)
    console.log('-'.repeat(80))
    console.log(chunk)
    console.log('-'.repeat(80))
    console.log('')
  })

  // 验证完整性
  const reassembled = chunks.join('')
  console.log('='.repeat(80))
  console.log('完整性验证:')
  console.log('原文长度:', article.content.length)
  console.log('重组后长度:', reassembled.length)
  console.log('是否一致:', reassembled === article.content ? '✅ 是' : '❌ 否')

  process.exit(0)
}

testChunking600()

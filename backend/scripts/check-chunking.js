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

async function checkChunking() {
  const [rows] = await pool.query('SELECT id, title, content FROM unit_readings WHERE id = 334')
  const article = rows[0]

  console.log('文章 334:', article.title)
  console.log('内容长度:', article.content.length, '字符\n')

  const chunks = splitTextIntoChunks(article.content)

  console.log('分段结果:\n')
  chunks.forEach((chunk, idx) => {
    console.log(`段 ${idx + 1} (${chunk.length} 字符):`)
    console.log(chunk.substring(0, 80) + (chunk.length > 80 ? '...' : ''))
    console.log('')
  })

  console.log('========================================')
  console.log('检查用户提到的文本在哪个分段中:\n')

  const searchText = 'Surrounding the core is the mantle'
  let found = false

  chunks.forEach((chunk, idx) => {
    if (chunk.includes(searchText)) {
      console.log(`✅ 找到了！在第 ${idx + 1} 段`)
      console.log('\n完整分段内容:')
      console.log(chunk)
      console.log('')
      found = true
    }
  })

  if (!found) {
    console.log('❌ 文本没有在任何分段中找到！')
    console.log('\n原文中包含这段话吗？')
    console.log(article.content.includes(searchText) ? '是' : '否')
  }

  // 验证分段完整性
  const reassembled = chunks.join('')
  if (reassembled === article.content) {
    console.log('✅ 分段验证通过：所有文本都被正确分段')
  } else {
    console.log('❌ 分段验证失败：有文本丢失！')
    console.log('原文长度:', article.content.length)
    console.log('重组后长度:', reassembled.length)
  }

  process.exit(0)
}

checkChunking()

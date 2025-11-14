import pool from '../src/config/database.js'
import dotenv from 'dotenv'

dotenv.config()

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

async function main() {
  const readingId = process.argv[2] || '335'
  const chunkIndex = parseInt(process.argv[3] || '3') - 1 // 第4段，索引是3

  const [rows] = await pool.query('SELECT content FROM unit_readings WHERE id = ?', [readingId])
  if (rows.length === 0) {
    console.log('文章不存在')
    process.exit(1)
  }

  const chunks = splitTextIntoChunks(rows[0].content)
  console.log(`总共有 ${chunks.length} 段`)
  console.log(`\n第 ${chunkIndex + 1} 段 (索引 ${chunkIndex}):`)
  console.log(`长度: ${chunks[chunkIndex].length} 字符`)
  console.log(`\n完整文本:\n${chunks[chunkIndex]}`)
  
  process.exit(0)
}

main()


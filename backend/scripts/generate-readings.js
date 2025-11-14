import pool from '../src/config/database.js'

// AI API Configuration
const AI_API_KEY = 'sk-DmXFvfzgXeRi2FQ8NW44KKKTBLJ6IDz2poHu7DF5ckgl2DWO'
const AI_API_URL = 'https://api.bltcy.ai/v1/chat/completions'
const AI_MODEL = 'gpt-4o' // 使用 gpt-4o 模型，兼容 OpenAI 格式

// Article themes for variety
const articleThemes = [
  "现代世界中的应用与理解",
  "重要性与影响",
  "全面探索指南",
  "对日常生活的影响",
  "科学原理与实践"
]

// Function to call AI API with retry
async function callAI(prompt, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60秒超时
      
      const response = await fetch(AI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`
        },
        body: JSON.stringify({
          model: AI_MODEL,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        throw new Error(`AI API error: ${response.status} ${errorText.substring(0, 100)}`)
      }

      const data = await response.json()
      
      // Handle different response formats
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const content = data.choices[0].message.content.trim()
        
        // Debug: show if content is too short
        if (content.length < 50) {
          console.warn(`    ⚠️  AI 返回内容过短 (${content.length} 字符): "${content}"`)
        }
        
        return content
      } else if (data.content) {
        // Some models return content directly
        return data.content.trim()
      } else if (data.text) {
        // Or as text field
        return data.text.trim()
      } else {
        console.error('AI API 返回数据:', JSON.stringify(data, null, 2).substring(0, 500))
        throw new Error(`AI API 返回格式不支持，choices 为 ${data.choices}`)
      }
    } catch (error) {
      if (attempt === retries) {
        console.error(`AI API 调用失败 (重试 ${retries} 次后): ${error.message}`)
        throw error
      }
      console.warn(`    ⚠️  尝试 ${attempt} 失败，${2 ** attempt} 秒后重试...`)
      await delay(2000 * attempt) // 指数退避
    }
  }
}

// Generate article using AI
async function generateArticle(unitName, words, themeIndex) {
  const theme = articleThemes[themeIndex % articleThemes.length]
  const wordList = words.slice(0, 15).map(w => w.word).join(', ')
  
  const prompt = `Write an English article about "${unitName}" with 300-400 words.

Required vocabulary to use: ${wordList}

Requirements:
- Use at least 10 words from the vocabulary list
- Keep other words simple and easy to understand
- Write in an academic or popular science style
- Make 3-4 paragraphs
- Be natural and coherent

Output only the article content, no title or extra text.`

  console.log(`    调用 AI 生成文章...`)
  const content = await callAI(prompt)
  
  return content
}

// Generate title using AI
async function generateTitle(unitName, themeIndex) {
  const theme = articleThemes[themeIndex % articleThemes.length]
  
  const prompt = `Create a concise English title (max 10 words) for this topic:

Topic: ${unitName}
Focus: ${theme}

Output only the title, no quotes or explanations.`

  const title = await callAI(prompt)
  return title.replace(/^["']|["']$/g, '').trim()
}

// Split text into sentences
function splitIntoSentences(text) {
  // More sophisticated sentence splitting
  const sentences = text
    .replace(/([.!?])\s*\n/g, '$1 ') // Handle newlines after sentence endings
    .replace(/\n+/g, ' ') // Replace other newlines with spaces
    .match(/[^.!?]+[.!?]+["']?/g) || []
  
  return sentences
    .map(s => s.trim())
    .filter(s => s.length > 10) // Filter out very short fragments
}

// Translate sentences using AI - batch processing
async function translateSentences(sentences) {
  const BATCH_SIZE = 5 // 每次翻译5个句子，避免超时
  const allTranslations = []
  
  for (let i = 0; i < sentences.length; i += BATCH_SIZE) {
    const batch = sentences.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(sentences.length / BATCH_SIZE)
    
    console.log(`    翻译批次 ${batchNum}/${totalBatches} (${batch.length} 句)...`)
    
    try {
      // 使用明确的格式要求
      const sentencesText = batch.map((s, idx) => `[${idx + 1}] ${s}`).join('\n\n')
      
      const prompt = `Translate these English sentences to Chinese. Keep the same order and number format.

${sentencesText}

Output format:
- One translation per line
- Format: [number] Chinese translation
- Translate all ${batch.length} sentences
- No explanations

Example:
[1] 第一句的中文翻译
[2] 第二句的中文翻译`

      const translationsText = await callAI(prompt)
      
      // 解析翻译结果
      const lines = translationsText.split('\n').map(l => l.trim()).filter(l => l)
      const batchTranslations = []
      
      for (const line of lines) {
        // 尝试匹配 [数字] 翻译 格式
        const match = line.match(/^\[(\d+)\]\s*(.+)$/)
        if (match && match[2]) {
          batchTranslations.push(match[2].trim())
        } else if (!line.startsWith('[') && line.length > 3) {
          // 如果没有编号但看起来是翻译，也接受
          batchTranslations.push(line)
        }
      }
      
      // 确保翻译数量正确
      while (batchTranslations.length < batch.length) {
        console.warn(`    ⚠️  批次翻译不完整，使用备用翻译`)
        batchTranslations.push('【翻译待补充】')
      }
      
      allTranslations.push(...batchTranslations.slice(0, batch.length))
      console.log(`    ✓ 批次 ${batchNum} 完成`)
      
      // 批次间延迟，避免 API 限流
      if (i + BATCH_SIZE < sentences.length) {
        await delay(1500)
      }
      
    } catch (error) {
      console.error(`    ❌ 批次 ${batchNum} 翻译失败: ${error.message}`)
      // 失败时使用占位符
      for (let j = 0; j < batch.length; j++) {
        allTranslations.push('【翻译失败，请稍后重试】')
      }
    }
  }
  
  return allTranslations
}

// Delay function to avoid rate limiting
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function generateReadingsForAllUnits() {
  console.log('🚀 开始使用 AI 生成阅读文章...')
  console.log(`📡 API: ${AI_API_URL}`)
  console.log(`🤖 模型: ${AI_MODEL}\n`)
  
  // 支持命令行参数限制处理的单元数量（用于测试）
  const limitUnits = process.argv[2] ? parseInt(process.argv[2]) : null
  
  try {
    // Clear existing readings first
    console.log('🗑️  清除现有阅读文章...')
    await pool.query('DELETE FROM reading_sentences')
    await pool.query('DELETE FROM unit_readings')
    
    // Get all units
    const [units] = await pool.query(
      'SELECT id, unit_name, unit_code FROM learning_units ORDER BY unit_number'
    )
    
    const unitsToProcess = limitUnits ? units.slice(0, limitUnits) : units
    
    console.log(`📚 找到 ${units.length} 个学习单元`)
    if (limitUnits) {
      console.log(`🎯 测试模式：本次只处理前 ${limitUnits} 个单元`)
    }
    console.log()
    
    let totalReadings = 0
    let successCount = 0
    let failCount = 0
    
    for (let unitIndex = 0; unitIndex < unitsToProcess.length; unitIndex++) {
      const unit = unitsToProcess[unitIndex]
      console.log(`\n[${unitIndex + 1}/${unitsToProcess.length}] 处理单元: ${unit.unit_name}`)
      
      // Get words for this unit
      const [words] = await pool.query(
        `SELECT w.word, w.chinese_meaning 
         FROM words w
         INNER JOIN unit_words uw ON w.id = uw.word_id
         WHERE uw.unit_id = ?
         ORDER BY uw.order_in_unit`,
        [unit.id]
      )
      
      if (words.length === 0) {
        console.log(`  ⚠️  单元 ${unit.unit_name} 没有单词，跳过`)
        continue
      }
      
      console.log(`  📝 该单元包含 ${words.length} 个单词`)
      
      // Generate 5 articles for this unit
      for (let i = 0; i < 5; i++) {
        try {
          console.log(`\n  文章 ${i + 1}/5:`)
          
          // Generate title
          const title = await generateTitle(unit.unit_name, i)
          console.log(`    ✓ 标题: ${title}`)
          
          // Add delay to avoid rate limiting
          await delay(1000)
          
          // Generate article content
          const content = await generateArticle(unit.unit_name, words, i)
          const wordCount = content.split(/\s+/).length
          console.log(`    ✓ 内容生成完成 (${wordCount} 词)`)
          
          // Add delay
          await delay(1000)
          
          // Split into sentences
          const sentences = splitIntoSentences(content)
          console.log(`    ✓ 分割为 ${sentences.length} 个句子`)
          
          // Translate sentences
          const translations = await translateSentences(sentences)
          console.log(`    ✓ 翻译完成`)
          
          // Insert reading article (use pool directly to avoid connection timeout)
          const [readingResult] = await pool.query(
            `INSERT INTO unit_readings (unit_id, title, content, order_index)
             VALUES (?, ?, ?, ?)`,
            [unit.id, title, content, i]
          )
          
          const readingId = readingResult.insertId
          
          // Insert sentences with translations in batch
          if (sentences.length > 0) {
            const values = sentences.map((sentence, j) => [
              readingId,
              sentence,
              translations[j] || '【翻译待补充】',
              j
            ])
            
            const placeholders = values.map(() => '(?, ?, ?, ?)').join(', ')
            const flatValues = values.flat()
            
            await pool.query(
              `INSERT INTO reading_sentences (reading_id, sentence_text, translation, order_index)
               VALUES ${placeholders}`,
              flatValues
            )
          }
          
          totalReadings++
          successCount++
          console.log(`    ✅ 文章保存成功`)
          
          // Add delay between articles
          await delay(1500)
          
        } catch (error) {
          failCount++
          console.error(`    ❌ 生成失败: ${error.message}`)
          // Continue with next article even if this one fails
        }
      }
    }
    
    console.log(`\n${'='.repeat(60)}`)
    console.log(`✅ 完成！`)
    console.log(`   成功生成: ${successCount} 篇文章`)
    console.log(`   失败: ${failCount} 篇文章`)
    console.log(`   总计: ${totalReadings} 篇文章`)
    console.log(`${'='.repeat(60)}`)
    
  } catch (error) {
    console.error('❌ 生成失败:', error.message)
    throw error
  }
}

// Run the script
generateReadingsForAllUnits()
  .then(() => {
    console.log('\n🎉 脚本执行完成')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n💥 脚本执行失败:', error)
    process.exit(1)
  })

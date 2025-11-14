import pool from '../src/config/database.js'

const AI_API_KEY = 'sk-DmXFvfzgXeRi2FQ8NW44KKKTBLJ6IDz2poHu7DF5ckgl2DWO'
const AI_API_URL = 'https://api.bltcy.ai/v1/chat/completions'
const AI_MODEL = 'gemini-2.5-flash-preview-09-2025'

// Split text into sentences
function splitIntoSentences(text) {
  const sentenceRegex = /[^.!?]+[.!?]+/g
  const matches = text.match(sentenceRegex) || []
  return matches.map(s => s.trim()).filter(s => s.length > 0)
}

// Call AI API to generate article
async function generateArticle(unitName, unitWords, articleNumber) {
  const wordList = unitWords.slice(0, 30).join(', ') // Use first 30 words
  
  const prompt = `请生成一篇英文文章，要求如下：
1. 主题：与"${unitName}"相关
2. 长度：300-400词
3. 必须使用以下单词（尽可能多地使用）：${wordList}
4. 其他词汇使用简单常用词
5. 语言流畅自然，适合英语学习者阅读
6. 文章要有教育意义和趣味性

请直接输出英文文章内容，不要添加任何标题或说明。`

  try {
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content.trim()
  } catch (error) {
    console.error('  ❌ AI 生成失败:', error.message)
    return null
  }
}

// Translate sentences to Chinese
async function translateSentences(sentences) {
  const sentenceText = sentences.map((s, i) => `${i + 1}. ${s}`).join('\n')
  
  const prompt = `请将以下英文句子翻译成中文，要求：
1. 翻译准确、自然、流畅
2. 保持原文的语气和风格
3. 每行一个翻译，格式为"序号. 中文翻译"

英文句子：
${sentenceText}

请直接输出翻译结果，不要添加任何说明。`

  try {
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const translationText = data.choices[0].message.content.trim()
    
    // Parse translations
    const translations = []
    const lines = translationText.split('\n')
    for (const line of lines) {
      const match = line.match(/^\d+\.\s*(.+)$/)
      if (match) {
        translations.push(match[1].trim())
      }
    }
    
    return translations
  } catch (error) {
    console.error('  ❌ 翻译失败:', error.message)
    return sentences.map(() => '翻译失败')
  }
}

// Generate title for article
function generateTitle(unitName, articleNumber) {
  const templates = [
    `Understanding ${unitName}: A Comprehensive Guide`,
    `The Essential Guide to ${unitName}`,
    `Exploring ${unitName} in Modern Context`,
    `${unitName}: What You Need to Know`,
    `The Science and Art of ${unitName}`
  ]
  
  // Extract English part from unit name if exists
  const englishMatch = unitName.match(/[\w\s]+/)
  const cleanName = englishMatch ? englishMatch[0].trim() : unitName
  
  return templates[articleNumber - 1].replace(unitName, cleanName)
}

async function generateReadings() {
  console.log('🚀 开始使用 AI 生成高质量阅读文章...')
  
  try {
    // Get all units with their words
    const [units] = await pool.query(`
      SELECT u.id, u.unit_name, u.category
      FROM learning_units u
      ORDER BY u.id
    `)
    
    console.log(`📚 找到 ${units.length} 个学习单元\n`)
    
    let totalArticles = 0
    let successCount = 0
    let failCount = 0
    
    for (const unit of units) {
      console.log(`处理单元 ${unit.id}: ${unit.unit_name}`)
      
      // Get words for this unit
      const [words] = await pool.query(
        'SELECT word FROM vocabulary WHERE unit_id = ? LIMIT 50',
        [unit.id]
      )
      
      if (words.length === 0) {
        console.log('  ⚠️  该单元没有单词，跳过\n')
        continue
      }
      
      const unitWords = words.map(w => w.word)
      
      // Generate 5 articles for each unit
      for (let i = 1; i <= 5; i++) {
        totalArticles++
        
        const title = generateTitle(unit.unit_name, i)
        console.log(`  📝 正在生成文章 ${i}/5: ${title}`)
        
        // Generate article content using AI
        const content = await generateArticle(unit.unit_name, unitWords, i)
        
        if (!content) {
          failCount++
          console.log(`  ❌ 文章 ${i} 生成失败\n`)
          continue
        }
        
        // Split into sentences
        const sentences = splitIntoSentences(content)
        
        if (sentences.length === 0) {
          failCount++
          console.log(`  ❌ 文章 ${i} 无法分割句子\n`)
          continue
        }
        
        console.log(`  🔤 文章包含 ${sentences.length} 个句子，正在翻译...`)
        
        // Translate sentences
        const translations = await translateSentences(sentences)
        
        if (translations.length !== sentences.length) {
          console.log(`  ⚠️  翻译数量不匹配，使用默认翻译`)
          while (translations.length < sentences.length) {
            translations.push('翻译生成中...')
          }
        }
        
        // Insert into database
        const [result] = await pool.query(
          `INSERT INTO unit_readings (unit_id, title, content, order_index)
           VALUES (?, ?, ?, ?)`,
          [unit.id, title, content, i - 1]
        )
        
        const readingId = result.insertId
        
        // Insert sentences
        for (let j = 0; j < sentences.length; j++) {
          await pool.query(
            `INSERT INTO reading_sentences (reading_id, sentence_text, translation, order_index)
             VALUES (?, ?, ?, ?)`,
            [readingId, sentences[j], translations[j], j]
          )
        }
        
        successCount++
        console.log(`  ✅ 文章 ${i} 生成成功 (${sentences.length} 句)\n`)
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
    
    console.log(`\n✅ 完成！`)
    console.log(`📊 统计：`)
    console.log(`   - 总计: ${totalArticles} 篇`)
    console.log(`   - 成功: ${successCount} 篇`)
    console.log(`   - 失败: ${failCount} 篇`)
    console.log(`\n🎉 所有文章已生成并存入数据库`)
    
  } catch (error) {
    console.error('❌ 生成过程出错:', error)
    throw error
  }
}

// Run the script
generateReadings()
  .then(() => {
    process.exit(0)
  })
  .catch(error => {
    console.error('\n💥 脚本执行失败:', error)
    process.exit(1)
  })

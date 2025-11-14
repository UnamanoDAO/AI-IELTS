import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pool from '../src/config/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function importSampleReadings() {
  console.log('📚 开始导入示例阅读文章...')
  
  const connection = await pool.getConnection()
  
  try {
    await connection.beginTransaction()
    
    // 清空现有数据
    console.log('🗑️  清空现有阅读文章...')
    await connection.query('DELETE FROM reading_sentences')
    await connection.query('DELETE FROM unit_readings')
    
    // 读取示例数据
    const sampleFile = path.join(__dirname, '../data/sample-readings-unit1.json')
    const sampleData = JSON.parse(fs.readFileSync(sampleFile, 'utf-8'))
    
    let totalReadings = 0
    let totalSentences = 0
    
    for (const unitData of sampleData) {
      console.log(`\n处理单元: ${unitData.unit_name}`)
      
      // 获取真实的 unit_id
      const [units] = await connection.query(
        'SELECT id FROM learning_units WHERE unit_name = ? OR unit_code LIKE ?',
        [unitData.unit_name, `${unitData.unit_name.split('·')[0].trim()}%`]
      )
      
      if (units.length === 0) {
        console.log(`  ⚠️  找不到单元 ${unitData.unit_name}，跳过`)
        continue
      }
      
      const unitId = units[0].id
      
      for (let i = 0; i < unitData.readings.length; i++) {
        const reading = unitData.readings[i]
        
        // 插入阅读文章
        const [readingResult] = await connection.query(
          `INSERT INTO unit_readings (unit_id, title, content, order_index)
           VALUES (?, ?, ?, ?)`,
          [unitId, reading.title, reading.content, i]
        )
        
        const readingId = readingResult.insertId
        
        // 插入句子和翻译
        for (let j = 0; j < reading.sentences.length; j++) {
          const sentence = reading.sentences[j]
          
          await connection.query(
            `INSERT INTO reading_sentences (reading_id, sentence_text, translation, order_index)
             VALUES (?, ?, ?, ?)`,
            [readingId, sentence.text, sentence.translation, j]
          )
          
          totalSentences++
        }
        
        totalReadings++
        console.log(`  ✓ 导入文章 ${i + 1}: ${reading.title}`)
      }
    }
    
    await connection.commit()
    
    console.log(`\n✅ 导入完成！`)
    console.log(`   📊 总文章数: ${totalReadings}`)
    console.log(`   📊 总句子数: ${totalSentences}`)
    console.log(`\n💡 提示: 这些是高质量示例文章，你可以基于这个模板创建更多内容`)
    
  } catch (error) {
    await connection.rollback()
    console.error('❌ 导入失败:', error.message)
    throw error
  } finally {
    connection.release()
  }
}

// 运行脚本
importSampleReadings()
  .then(() => {
    console.log('\n🎉 脚本执行完成！\n')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n💥 脚本执行失败:', error)
    process.exit(1)
  })


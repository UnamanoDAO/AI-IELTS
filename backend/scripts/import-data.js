import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pool from '../src/config/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const WORDS_PER_UNIT = 70

async function importData() {
  console.log('🚚 Starting data import...')

  try {
    const categoriesPath = path.join(__dirname, '../data/categories.json')
    const wordsPath = path.join(__dirname, '../data/words.json')

    if (!fs.existsSync(categoriesPath) || !fs.existsSync(wordsPath)) {
      console.error('✗ Data files not found. Please run scraper first.')
      process.exit(1)
    }

    const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'))
    const words = JSON.parse(fs.readFileSync(wordsPath, 'utf8'))

    console.log(`• Loaded ${categories.length} categories and ${words.length} words from JSON`)

    const wordsByCategory = buildWordsByCategory(words)

    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      await clearExistingData(connection)
      await importCategories(connection, categories, wordsByCategory)
      await importWords(connection, words)
      await createLearningUnits(connection, categories, wordsByCategory)

      await connection.commit()
      console.log('\n✅ Data import completed successfully')
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('✗ Data import failed:', error.message)
    process.exit(1)
  }
}

function buildWordsByCategory(words) {
  const map = new Map()
  for (const word of words) {
    if (!map.has(word.category_id)) {
      map.set(word.category_id, [])
    }
    map.get(word.category_id).push(word)
  }
  for (const list of map.values()) {
    list.sort((a, b) => (a.order_in_category ?? 0) - (b.order_in_category ?? 0))
  }
  return map
}

async function clearExistingData(connection) {
  console.log('• Clearing existing data...')
  await connection.query('DELETE FROM unit_words')
  await connection.query('DELETE FROM learning_units')
  await connection.query('DELETE FROM words')
  await connection.query('DELETE FROM categories')

  await connection.query('ALTER TABLE categories AUTO_INCREMENT = 1')
  await connection.query('ALTER TABLE words AUTO_INCREMENT = 1')
  await connection.query('ALTER TABLE learning_units AUTO_INCREMENT = 1')
  console.log('✓ Tables truncated')
}

async function importCategories(connection, categories, wordsByCategory) {
  console.log('• Importing categories...')

  for (const category of categories) {
    const categoryWords = wordsByCategory.get(category.id) || []
    const totalWords = categoryWords.length
    const totalGroups = Array.isArray(categoryWords) && totalWords > 0
      ? Math.ceil(totalWords / WORDS_PER_UNIT)
      : category.total_groups || 0

    await connection.query(
      `INSERT INTO categories (
        bundle_key,
        name,
        slug,
        description,
        order_index,
        audio_filename,
        total_groups,
        total_words
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category.key || null,
        category.name,
        category.slug || null,
        category.description || '',
        category.order_index ?? 0,
        category.audio_filename || '',
        totalGroups,
        totalWords
      ]
    )
  }

  console.log(`✓ Imported ${categories.length} categories`)
}

async function importWords(connection, words) {
  console.log('• Importing words...')

  for (const word of words) {
    await connection.query(
      `INSERT INTO words (
        category_id,
        word,
        base_form,
        variants,
        phonetic,
        part_of_speech,
        chinese_meaning,
        word_root,
        example_sentence,
        example_translation,
        audio_url,
        example_audio_url,
        memory_tip,
        difficulty_level,
        order_in_category,
        source_extra
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        word.category_id,
        word.word,
        word.base_form || word.word,
        word.variants || '',
        word.phonetic || '',
        word.part_of_speech || '',
        word.chinese_meaning || '',
        word.word_root || '',
        word.example_sentence || '',
        word.example_translation || '',
        word.audio_url || '',
        word.example_audio_url || '',
        word.memory_tip || '',
        word.difficulty_level || 1,
        word.order_in_category ?? 0,
        word.source_extra || ''
      ]
    )
  }

  console.log(`✓ Imported ${words.length} words`)
}

async function createLearningUnits(connection, categories, wordsByCategory) {
  console.log('• Creating learning units...')

  let globalUnitNumber = 1
  let totalUnits = 0

  for (const category of categories) {
    const categoryWords = wordsByCategory.get(category.id) || []
    if (categoryWords.length === 0) {
      continue
    }

    const unitsInCategory = Math.ceil(categoryWords.length / WORDS_PER_UNIT)

    for (let unitIndex = 0; unitIndex < unitsInCategory; unitIndex++) {
      const start = unitIndex * WORDS_PER_UNIT
      const chunk = categoryWords.slice(start, start + WORDS_PER_UNIT)
      if (chunk.length === 0) continue

      const orderInCategory = unitIndex + 1
      const unitName = `${category.name} · Unit ${orderInCategory}`
      const unitCodeBase = category.key || category.slug || `cat-${category.id}`
      const unitCode = `${unitCodeBase}-${orderInCategory}`

      const [unitResult] = await connection.query(
        `INSERT INTO learning_units (
          category_id,
          unit_name,
          unit_code,
          unit_number,
          order_in_category,
          description,
          estimated_days,
          total_words
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          category.id,
          unitName,
          unitCode,
          globalUnitNumber,
          orderInCategory,
          `${category.name} 第 ${orderInCategory} 周学习（${chunk.length} 词）`,
          7,
          chunk.length
        ]
      )

      const unitId = unitResult.insertId

      for (let wordIndex = 0; wordIndex < chunk.length; wordIndex++) {
        await connection.query(
          'INSERT INTO unit_words (unit_id, word_id, order_in_unit) VALUES (?, ?, ?)',
          [unitId, chunk[wordIndex].id, wordIndex]
        )
      }

      globalUnitNumber++
      totalUnits++
    }
  }

  console.log(`✓ Created ${totalUnits} learning units`)
}

importData()
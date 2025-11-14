import axios from 'axios'
import fs from 'fs'
import path from 'path'
import vm from 'vm'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BASE_URL = 'https://hefengxian.github.io/my-ielts'
const OUTPUT_DIR = path.join(__dirname, '../data')

const MAIN_BUNDLE_REGEX = /<script\s+type="module"\s+crossorigin\s+src="\.\/assets\/index-([a-z0-9]+)\.js"><\/script>/i
const VOCAB_BUNDLE_REGEX = /"\.\/vocabulary-([a-z0-9]+)\.js"/i

async function main() {
  console.log('🚀 Starting vocabulary scraping...')

  try {
    const rawData = await fetchVocabularyBundle()
    const { categories, words } = transformVocabulary(rawData)
    writeOutput(categories, words)

    console.log(`\n✅ Scraping completed: ${categories.length} categories, ${words.length} words`)
  } catch (error) {
    console.error(`✗ Failed to scrape from website: ${error.message}`)
    console.log('▶ Attempting fallback markdown parsing...')
    const result = parseFallbackData()
    if (result.categories.length === 0 || result.words.length === 0) {
      process.exit(1)
    }
  }
}

async function fetchVocabularyBundle() {
  const indexHtml = await axios.get(`${BASE_URL}/`).then(res => res.data)
  const mainBundleMatch = indexHtml.match(MAIN_BUNDLE_REGEX)

  if (!mainBundleMatch) {
    throw new Error('Main bundle reference not found in index.html')
  }

  const mainBundleUrl = `${BASE_URL}/assets/index-${mainBundleMatch[1]}.js`
  const mainBundleCode = await axios.get(mainBundleUrl).then(res => res.data)

  const vocabMatch = mainBundleCode.match(VOCAB_BUNDLE_REGEX)
  if (!vocabMatch) {
    throw new Error('Vocabulary bundle reference not found in main bundle')
  }

  const vocabUrl = `${BASE_URL}/assets/vocabulary-${vocabMatch[1]}.js`
  const vocabCode = await axios.get(vocabUrl).then(res => res.data)

  return evaluateVocabularyModule(vocabCode)
}

function evaluateVocabularyModule(code) {
  const sanitised = code.replace(
    /export\{([a-zA-Z_$][\w$]*)\s+as\s+default\};?/,
    'module.exports = $1;'
  )

  const context = {
    module: { exports: {} },
    exports: {},
    require: undefined,
    console
  }

  try {
    vm.createContext(context)
    const script = new vm.Script(sanitised, { filename: 'vocabulary-bundle.js' })
    script.runInContext(context)
  } catch (error) {
    throw new Error(`Failed to execute vocabulary bundle: ${error.message}`)
  }

  const data = context.module.exports
  if (!data || typeof data !== 'object') {
    throw new Error('Vocabulary bundle did not export an object')
  }

  return data
}

function transformVocabulary(rawData) {
  const categoryEntries = Object.entries(rawData)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB, 'zh-Hans-CN', { numeric: true }))

  const categories = []
  const words = []
  let wordId = 1

  categoryEntries.forEach(([categoryKey, categoryValue], categoryIndex) => {
    const label = (categoryValue?.label || categoryKey || '').trim()
    const name = label || `Category ${categoryIndex + 1}`

    const categoryId = categoryIndex + 1
    categories.push({
      id: categoryId,
      key: categoryKey,
      name,
      slug: generateSlug(name),
      description: categoryValue?.description?.trim() || '',
      order_index: categoryIndex,
      audio_filename: categoryValue?.audio || '',
      total_groups: Array.isArray(categoryValue?.words) ? categoryValue.words.length : 0,
      total_words: Number(categoryValue?.wordCount) || 0
    })

    let orderInCategory = 0
    const wordGroups = Array.isArray(categoryValue?.words) ? categoryValue.words : []

    wordGroups.forEach(group => {
      if (!Array.isArray(group)) return

      group.forEach(entry => {
        if (!entry || typeof entry !== 'object') return

        const variants = normaliseVariants(entry.word)
        if (variants.length === 0) return

        const baseWord = variants[0]
        const displayWord = variants.join(' / ')

        const chineseMeaning = normaliseText(entry.meaning || entry.translation)
        if (!chineseMeaning) return

        words.push({
          id: wordId++,
          category_id: categoryId,
          word: displayWord,
          base_form: baseWord,
          variants: variants.length > 1 ? variants.slice(1).join(' / ') : '',
          phonetic: '',
          part_of_speech: normaliseText(entry.pos),
          chinese_meaning: chineseMeaning,
          word_root: '',
          example_sentence: sanitiseExample(entry.example),
          example_translation: '',
          audio_url: buildDefaultAudio(baseWord),
          example_audio_url: '',
          memory_tip: '',
          difficulty_level: 1,
          order_in_category: orderInCategory++,
          source_extra: normaliseExtra(entry.extra)
        })
      })
    })
  })

  return { categories, words }
}

function normaliseVariants(value) {
  if (!value) return []
  if (Array.isArray(value)) {
    return value
      .map(item => normaliseText(item))
      .filter(Boolean)
  }
  return [normaliseText(value)].filter(Boolean)
}

function sanitiseExample(value) {
  const text = normaliseText(value)
  if (!text || text === '-') return ''
  return text
}

function normaliseExtra(value) {
  const text = normaliseText(value)
  if (!text || text === '-') return ''
  return text
}

function normaliseText(value) {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim()
}

function generateSlug(value) {
  return normaliseText(value)
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function buildDefaultAudio(word) {
  if (!word) return ''
  return `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=1`
}

function writeOutput(categories, words) {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'categories.json'),
    JSON.stringify(categories, null, 2),
    'utf8'
  )

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'words.json'),
    JSON.stringify(words, null, 2),
    'utf8'
  )

  console.log('\n📁 Data saved to backend/data/categories.json and backend/data/words.json')
}

function parseFallbackData() {
  console.log('🔁 Using fallback data parsing method (自然.md)...')

  try {
    const possiblePaths = [
      path.join(process.cwd(), '自然.md'),
      path.join(__dirname, '../../自然.md'),
      path.join(__dirname, '../../../自然.md')
    ]

    const mdFilePath = possiblePaths.find(p => fs.existsSync(p))

    if (!mdFilePath) {
      console.error('✗ Markdown file 自然.md not found')
      return { categories: [], words: [] }
    }

    const content = fs.readFileSync(mdFilePath, 'utf8')
    const lines = content.split('\n').map(line => line.replace(/\r$/, ''))

    const categoryName = lines[0] ? lines[0].trim() : '01_自然地理'
    const categoryDesc = lines[1] ? lines[1].trim() : ''

    const categories = [{
      id: 1,
      key: '01_自然地理',
      name: categoryName,
      slug: generateSlug(categoryName),
      description: categoryDesc,
      order_index: 0,
      audio_filename: '',
      total_groups: 0,
      total_words: 0
    }]

    const words = []
    let wordId = 1
    let orderInCategory = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!/^\d+$/.test(line)) continue

      let wordLineIndex = i + 1
      while (wordLineIndex < lines.length && !lines[wordLineIndex].trim()) {
        wordLineIndex++
      }
      if (wordLineIndex >= lines.length) continue

      const wordText = normaliseText(lines[wordLineIndex])
      if (!wordText) continue

      let detailLineIndex = wordLineIndex + 1
      let detailLine = ''
      while (detailLineIndex < lines.length) {
        const candidate = lines[detailLineIndex].trim()
        if (!candidate) {
          detailLineIndex++
          continue
        }
        if (candidate.includes('\t')) {
          detailLine = candidate
          break
        }
        detailLineIndex++
      }

      if (!detailLine) {
        i = detailLineIndex
        continue
      }

      const parts = detailLine.split('\t').map(p => normaliseText(p))
      const meaning = parts[1] && parts[1] !== '-' ? parts[1] : ''
      if (!meaning) continue

      words.push({
        id: wordId++,
        category_id: 1,
        word: wordText,
        base_form: wordText,
        variants: '',
        phonetic: '',
        part_of_speech: parts[0] === '-' ? '' : parts[0],
        chinese_meaning: meaning,
        word_root: parts[3] && parts[3] !== '-' ? parts[3] : '',
        example_sentence: parts[2] && parts[2] !== '-' ? parts[2] : '',
        example_translation: '',
        audio_url: buildDefaultAudio(wordText),
        example_audio_url: '',
        memory_tip: '',
        difficulty_level: 1,
        order_in_category: orderInCategory++,
        source_extra: ''
      })

      i = detailLineIndex
    }

    writeOutput(categories, words)
    console.log(`✓ Parsed fallback dataset with ${words.length} words`)
    return { categories, words }
  } catch (error) {
    console.error('✗ Fallback parsing failed:', error.message)
    return { categories: [], words: [] }
  }
}

main()
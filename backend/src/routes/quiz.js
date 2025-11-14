import express from 'express'
import pool from '../config/database.js'

const router = express.Router()

router.post('/generate', async (req, res, next) => {
  try {
    const {
      unitId,
      questionCount = 20,
      types = ['multiple', 'fill', 'listening']
    } = req.body || {}

    if (!unitId) {
      return res.status(400).json({ success: false, error: 'unitId is required' })
    }

    const [wordRows] = await pool.query(
      `SELECT w.id, w.word, w.phonetic, w.chinese_meaning, w.audio_url
       FROM words w
       INNER JOIN unit_words uw ON w.id = uw.word_id
       WHERE uw.unit_id = ?
       ORDER BY uw.order_in_unit ASC`,
      [unitId]
    )

    if (!wordRows.length) {
      return res.status(404).json({ success: false, error: 'No words found for this unit' })
    }

    const totalQuestions = Math.min(Number(questionCount), wordRows.length)
    const selectedWords = shuffle([...wordRows]).slice(0, totalQuestions)
    const typeDistribution = buildDistribution(totalQuestions, types)

    const availableWords = shuffle([...wordRows])
    const questions = []
    let multipleCount = 0
    let fillCount = 0
    let listeningCount = 0

    selectedWords.forEach((word) => {
      let type = 'multiple'
      if (listeningCount < typeDistribution.listening) {
        type = 'listening'
        listeningCount += 1
      } else if (fillCount < typeDistribution.fill) {
        type = 'fill'
        fillCount += 1
      } else if (multipleCount < typeDistribution.multiple) {
        type = 'multiple'
        multipleCount += 1
      }

      questions.push(createQuestion(word, type, availableWords))
    })

    res.json({
      success: true,
      data: {
        unitId,
        questions
      }
    })
  } catch (error) {
    next(error)
  }
})

function buildDistribution(total, types) {
  const hasMultiple = types.includes('multiple')
  const hasFill = types.includes('fill')
  const hasListening = types.includes('listening')

  const distribution = { multiple: 0, fill: 0, listening: 0 }

  if (hasMultiple && hasFill && hasListening) {
    distribution.multiple = Math.floor(total * 0.4)
    distribution.fill = Math.floor(total * 0.3)
    distribution.listening = total - distribution.multiple - distribution.fill
  } else if (hasMultiple && hasFill) {
    distribution.multiple = Math.ceil(total * 0.6)
    distribution.fill = total - distribution.multiple
  } else if (hasMultiple && hasListening) {
    distribution.multiple = Math.ceil(total * 0.6)
    distribution.listening = total - distribution.multiple
  } else if (hasFill && hasListening) {
    distribution.fill = Math.ceil(total * 0.5)
    distribution.listening = total - distribution.fill
  } else if (hasMultiple) {
    distribution.multiple = total
  } else if (hasFill) {
    distribution.fill = total
  } else if (hasListening) {
    distribution.listening = total
  } else {
    distribution.multiple = total
  }

  return distribution
}

function createQuestion(word, type, pool) {
  const base = {
    id: `${type}-${word.id}`,
    wordId: word.id,
    type,
    correctAnswer: word.word
  }

  if (type === 'multiple') {
    const options = buildOptions(word.word, pool)
    return {
      ...base,
      question: word.chinese_meaning || '请选择对应的英文单词',
      options
    }
  }

  if (type === 'fill') {
    return {
      ...base,
      question: word.chinese_meaning || '请输入对应的英文单词',
      placeholder: word.phonetic ? `提示：${word.phonetic}` : ''
    }
  }

  if (type === 'listening') {
    const options = buildOptions(word.word, pool)
    return {
      ...base,
      question: '请听音频，选择正确的单词',
      audioUrl: word.audio_url,
      options
    }
  }

  return {
    ...base,
    question: word.chinese_meaning || '请选择答案',
    options: buildOptions(word.word, pool)
  }
}

function buildOptions(correctWord, pool) {
  const candidates = shuffle(pool)
    .map((item) => item.word)
    .filter((word) => word && word.toLowerCase() !== correctWord.toLowerCase())

  const options = [correctWord]
  for (const candidate of candidates) {
    if (options.length >= 4) break
    if (!options.includes(candidate)) {
      options.push(candidate)
    }
  }

  while (options.length < 4) {
    options.push(`${correctWord}-${options.length}`)
  }

  return shuffle(options)
}

function shuffle(list) {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export default router
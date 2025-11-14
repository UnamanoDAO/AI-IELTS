import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'ielts_vocabulary_progress'

export const useProgressStore = defineStore('progress', () => {
  const units = ref({})

  const getUnitProgress = computed(() => (unitId) => {
    return (
      units.value[unitId] || {
        learnedWords: [],
        quizScores: [],
        lastStudied: null,
        progress: 0
      }
    )
  })

  function ensureUnit(unitId) {
    if (!units.value[unitId]) {
      units.value[unitId] = {
        learnedWords: [],
        quizScores: [],
        lastStudied: null,
        progress: 0
      }
    }
    return units.value[unitId]
  }

  function loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && typeof parsed === 'object') {
          units.value = parsed
        }
      }
    } catch (error) {
      console.error('Failed to load progress from storage:', error)
    }
  }

  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(units.value))
    } catch (error) {
      console.error('Failed to save progress to storage:', error)
    }
  }

  function markWordLearned(unitId, wordId, totalWords) {
    const unit = ensureUnit(unitId)
    if (!unit.learnedWords.includes(wordId)) {
      unit.learnedWords.push(wordId)
    }
    unit.lastStudied = new Date().toISOString()
    unit.progress = totalWords ? Math.round((unit.learnedWords.length / totalWords) * 100) : unit.progress
    saveToStorage()
  }

  function toggleWord(unitId, wordId, totalWords) {
    const unit = ensureUnit(unitId)
    if (unit.learnedWords.includes(wordId)) {
      unit.learnedWords = unit.learnedWords.filter((id) => id !== wordId)
    } else {
      unit.learnedWords.push(wordId)
    }
    unit.lastStudied = new Date().toISOString()
    unit.progress = totalWords ? Math.round((unit.learnedWords.length / totalWords) * 100) : unit.progress
    saveToStorage()
  }

  function saveQuizScore(unitId, score) {
    const unit = ensureUnit(unitId)
    unit.quizScores.push({ score, date: new Date().toISOString() })
    if (unit.quizScores.length > 50) {
      unit.quizScores = unit.quizScores.slice(-50)
    }
    unit.lastStudied = new Date().toISOString()
    saveToStorage()
  }

  function resetUnitProgress(unitId) {
    if (units.value[unitId]) {
      delete units.value[unitId]
      saveToStorage()
    }
  }

  function clearAllProgress() {
    units.value = {}
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    units,
    getUnitProgress,
    loadFromStorage,
    saveToStorage,
    markWordLearned,
    toggleWord,
    saveQuizScore,
    resetUnitProgress,
    clearAllProgress
  }
})
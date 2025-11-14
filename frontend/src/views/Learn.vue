<template>
  <section class="learn" v-if="!loading && !error">
    <div class="container">
      <header class="learn-header">
        <button class="btn-link" @click="goBack" aria-label="返回首页">← 返回</button>
        <span class="learn-progress">{{ currentIndex + 1 }} / {{ words.length }}</span>
      </header>

      <div class="word-card-container">
        <div
          class="word-card-wrapper"
          :style="cardStyle"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
        >
          <WordCard
            v-if="currentWord"
            :key="currentWord.id"
            :word="currentWord"
            :is-learned="isLearned(currentWord.id)"
            @toggle-learned="toggleLearned"
          />
        </div>
      </div>

      <footer class="learn-controls">
        <button class="btn btn-outline" @click="prevWord" :disabled="currentIndex === 0">
          ← 上一个
        </button>
        <button class="btn btn-primary" @click="nextWord" :disabled="currentIndex === words.length - 1">
          下一个 →
        </button>
      </footer>
    </div>
  </section>

  <section v-else class="container">
    <div class="state-card" v-if="loading">加载中...</div>
    <div class="state-card error" v-else>{{ error }}</div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { unitsAPI, wordsAPI } from '@/api'
import { useProgressStore } from '@/stores/progress'
import WordCard from '@/components/WordCard.vue'

const route = useRoute()
const router = useRouter()
const unitId = computed(() => route.params.unitId)
const unitInfo = ref(null)
const words = ref([])
const loading = ref(true)
const error = ref('')
const currentIndex = ref(0)
const progressStore = useProgressStore()

const currentWord = computed(() => words.value[currentIndex.value] || null)
const learnedCount = computed(() => progressStore.getUnitProgress(unitId.value).learnedWords.length)

// 触摸滑动相关
const touchStartX = ref(0)
const touchStartY = ref(0)
const slideDirection = ref('slide')
const isDragging = ref(false)
const dragOffsetX = ref(0)
const dragOffsetY = ref(0)
const cardRotation = ref(0)

async function fetchData() {
  loading.value = true
  error.value = ''
  currentIndex.value = 0
  try {
    const [unitData, wordsData] = await Promise.all([
      unitsAPI.getById(unitId.value),
      unitsAPI.getWords(unitId.value)
    ])
    unitInfo.value = unitData.data
    words.value = (wordsData.data || []).map((word) => ({
      ...word,
      chinese_meaning: word.chinese_meaning || '暂无释义'
    }))
    if (words.value.length) {
      ensureWordDetails(words.value[0])
    }
    if (!words.value.length) {
      error.value = '该单元暂无单词，请选择其他单元'
    }
  } catch (err) {
    console.error(err)
    error.value = '加载单词失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push({ name: 'Home' })
}

function nextWord() {
  if (currentIndex.value < words.value.length - 1) {
    slideDirection.value = 'slide-left'
    currentIndex.value += 1
  }
}

function prevWord() {
  if (currentIndex.value > 0) {
    slideDirection.value = 'slide-right'
    currentIndex.value -= 1
  }
}

// 触摸事件处理 - Tinder 风格
function handleTouchStart(event) {
  touchStartX.value = event.touches[0].clientX
  touchStartY.value = event.touches[0].clientY
  isDragging.value = true
}

function handleTouchMove(event) {
  if (!isDragging.value) return
  
  const currentX = event.touches[0].clientX
  const currentY = event.touches[0].clientY
  const deltaX = currentX - touchStartX.value
  const deltaY = currentY - touchStartY.value
  
  // 如果横向滑动距离大于纵向，阻止默认滚动
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
    event.preventDefault()
    
    // 更新卡片位置和旋转
    dragOffsetX.value = deltaX
    dragOffsetY.value = deltaY * 0.3 // 纵向移动减弱
    cardRotation.value = deltaX * 0.05 // 根据横向距离计算旋转角度
  }
}

function handleTouchEnd(event) {
  if (!isDragging.value) return
  
  isDragging.value = false
  const swipeThreshold = 100 // 滑动阈值
  
  // 判断是否达到滑动阈值
  if (Math.abs(dragOffsetX.value) > swipeThreshold) {
    // 滑动距离足够，执行切换
    if (dragOffsetX.value > 0) {
      // 向右滑动 - 上一个
      animateCardOut('right', () => {
        prevWord()
        resetCardPosition()
      })
    } else {
      // 向左滑动 - 下一个
      animateCardOut('left', () => {
        nextWord()
        resetCardPosition()
      })
    }
  } else {
    // 滑动距离不够，回弹
    resetCardPosition()
  }
}

function animateCardOut(direction, callback) {
  const targetX = direction === 'left' ? -window.innerWidth : window.innerWidth
  dragOffsetX.value = targetX
  dragOffsetY.value = -100
  cardRotation.value = direction === 'left' ? -30 : 30
  
  setTimeout(() => {
    callback()
  }, 300)
}

function resetCardPosition() {
  dragOffsetX.value = 0
  dragOffsetY.value = 0
  cardRotation.value = 0
}

const cardStyle = computed(() => {
  if (!isDragging.value && dragOffsetX.value === 0) {
    return {}
  }
  
  return {
    transform: `translate(${dragOffsetX.value}px, ${dragOffsetY.value}px) rotate(${cardRotation.value}deg)`,
    transition: isDragging.value ? 'none' : 'transform 0.3s ease-out',
    opacity: isDragging.value ? Math.max(0.5, 1 - Math.abs(dragOffsetX.value) / 300) : 1
  }
})

function isLearned(wordId) {
  return progressStore.getUnitProgress(unitId.value).learnedWords.includes(wordId)
}

function toggleLearned() {
  const word = currentWord.value
  if (!word) return
  progressStore.toggleWord(unitId.value, word.id, words.value.length)
}

function needsDetails(word) {
  if (!word) return false
  return !word.phonetic || !word.audio_url || !word.word_root || !word.memory_tip
}

async function ensureWordDetails(word) {
  if (!word || word.__loadingDetails || word.__detailsLoaded === true) {
    return
  }

  if (!needsDetails(word)) {
    word.__detailsLoaded = true
    return
  }

  Object.assign(word, {
    __loadingDetails: true,
    __detailsError: ''
  })

  try {
    const data = await wordsAPI.getById(word.id)
    if (data?.data) {
      Object.assign(word, data.data, {
        __loadingDetails: false,
        __detailsLoaded: true,
        __detailsError: ''
      })
    } else {
      Object.assign(word, {
        __loadingDetails: false,
        __detailsError: '详情加载失败'
      })
    }
  } catch (detailsError) {
    console.error(detailsError)
    Object.assign(word, {
      __loadingDetails: false,
      __detailsError: '详情加载失败'
    })
  }
}

function handleKeydown(event) {
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    nextWord()
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    prevWord()
  } else if (event.key === ' ') {
    event.preventDefault()
    toggleLearned()
  }
}

onMounted(async () => {
  progressStore.loadFromStorage()
  await fetchData()
  window.addEventListener('keydown', handleKeydown)
})

watch(
  () => unitId.value,
  async () => {
    await fetchData()
  }
)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})

watch(
  () => currentWord.value,
  (word) => {
    if (word) {
      ensureWordDetails(word)
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.learn-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  margin-bottom: 1rem;
}

.btn-link {
  background: none;
  border: none;
  padding: 0.5rem;
  color: var(--primary-color);
  cursor: pointer;
  font-size: 1rem;
  text-decoration: none;
  font-weight: 500;
}

.btn-link:hover {
  text-decoration: underline;
}

.learn-progress {
  font-weight: 600;
  font-size: 1rem;
  color: var(--primary-color);
}

.learn-controls {
  margin: 1.5rem 0 1rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.state-card {
  margin: 3rem auto;
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 1rem;
  box-shadow: var(--shadow);
}

.state-card.error {
  color: var(--danger-color);
}

.word-card-container {
  position: relative;
  min-height: 400px;
  perspective: 1000px;
}

.word-card-wrapper {
  touch-action: none;
  user-select: none;
  cursor: grab;
  will-change: transform;
}

.word-card-wrapper:active {
  cursor: grabbing;
}

/* 左滑动画（下一个） */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s ease;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}

/* 右滑动画（上一个） */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-100%);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* 默认滑动动画 */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(25px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-25px);
}

@media (max-width: 768px) {
  .learn-header {
    padding: 0.5rem 0;
    margin-bottom: 0.75rem;
  }

  .btn-link {
    font-size: 0.95rem;
    padding: 0.25rem;
  }

  .learn-progress {
    font-size: 0.95rem;
  }

  .word-card-container {
    min-height: 300px;
  }

  .learn-controls {
    margin: 1rem 0 0.5rem;
    gap: 0.75rem;
  }

  .learn-controls .btn {
    flex: 1;
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }
}
</style>
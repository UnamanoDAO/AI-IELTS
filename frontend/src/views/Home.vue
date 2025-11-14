<template>
  <section class="home">
    <div class="container">
      <section class="units-section">
        <header class="section-header">
          <div class="header-content">
            <div class="header-icon">
              <BookMarked :size="40" :stroke-width="2" />
            </div>
            <div class="header-text">
              <h2>学习单元</h2>
              <p>系统化学习雅思词汇，进度自动保存</p>
            </div>
          </div>
          <div class="category-filter" v-if="categories.length">
            <label class="filter-label" for="category-select">分类筛选</label>
            <select
              id="category-select"
              v-model="selectedCategory"
              class="filter-select"
              aria-label="选择词汇分类"
            >
              <option value="all">全部分类 · {{ overallSummary }}</option>
              <option
                v-for="category in categories"
                :key="category.id"
                :value="String(category.id)"
              >
                {{ category.name }} · {{ category.total_words || 0 }} 词
              </option>
            </select>
          </div>
        </header>

        <div v-if="loading" class="state-card">加载中...</div>
        <div v-else-if="error" class="state-card error">{{ error }}</div>
        <div v-else-if="units.length === 0" class="state-card">
          <p v-if="selectedCategory === 'all'">
            <BookMarked :size="24" style="display: inline-block; vertical-align: middle; margin-right: 8px;" /> 暂未安排学习单元，请稍后再试。
          </p>
          <p v-else>
          当前分类暂未安排学习单元，请选择其他分类。
          </p>
        </div>
        <div v-else class="units-grid">
          <article v-for="unit in units" :key="unit.id" class="unit-card card">
            <p v-if="unit.category_name" class="unit-category">
              <span class="chip">{{ unit.category_name }}</span>
            </p>
            <header class="unit-header">
              <h3>{{ unit.unit_name }}</h3>
              <span class="unit-badge">{{ unit.total_words }} 词</span>
            </header>
            <p class="unit-description">{{ unit.description || '系统提升雅思词汇量的专项单元' }}</p>

            <div class="unit-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: getProgress(unit.id) + '%' }"></div>
              </div>
              <div class="progress-meta">
                <span>{{ getLearnedCount(unit.id) }} / {{ unit.total_words }} 已学习</span>
                <span>{{ getProgress(unit.id) }}%</span>
              </div>
            </div>

            <footer class="unit-actions">
              <router-link :to="{ name: 'Learn', params: { unitId: unit.id } }" class="btn btn-primary">
                <BookOpen :size="18" /> 开始学习
              </router-link>
              <router-link :to="{ name: 'Reading', params: { unitId: unit.id } }" class="btn btn-outline">
                <BookMarked :size="18" /> 阅读文章
              </router-link>
              <router-link :to="{ name: 'Quiz', params: { unitId: unit.id } }" class="btn btn-outline">
                <FileEdit :size="18" /> 开始测验
              </router-link>
            </footer>
          </article>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { categoriesAPI, unitsAPI } from '@/api'
import { useProgressStore } from '@/stores/progress'
import { BookMarked, BookOpen, FileEdit } from 'lucide-vue-next'

const units = ref([])
const loading = ref(true)
const error = ref('')
const categories = ref([])
const selectedCategory = ref('all')
const progressStore = useProgressStore()

const CATEGORY_FILTER_KEY = 'ielts_vocabulary_selected_category'

const loadCategories = async () => {
  try {
    const data = await categoriesAPI.getAll()
    categories.value = data.data || []
  } catch (err) {
    console.error('加载分类失败:', err)
  }
}

const fetchUnits = async () => {
  try {
  const params =
    selectedCategory.value === 'all'
      ? {}
      : { categoryId: selectedCategory.value }

    console.log('📡 请求学习单元，参数:', params)
  const data = await unitsAPI.getAll(params)
    console.log('📦 API响应:', data)

    // 检查响应是否是 HTML（说明代理可能有问题）
    if (typeof data === 'string' && data.includes('<!DOCTYPE')) {
      console.error('❌ API 返回了 HTML 而不是 JSON！')
      console.error('可能的原因：')
      console.error('1. Vite 代理配置未生效，请重启 Vite 开发服务器')
      console.error('2. 后端服务未运行，请检查 http://localhost:3000/api/units')
      units.value = []
      error.value = '无法连接到后端服务，请检查后端是否运行在 http://localhost:3000'
      return
    }

    // API拦截器已经处理了response.data，所以data就是{success, data}
    if (data && data.success !== false) {
  units.value = data.data || []
      console.log(`✅ 加载了 ${units.value.length} 个学习单元`)
    } else {
      units.value = []
      error.value = data?.error || '加载学习单元失败'
      console.warn('⚠️ API返回失败:', data)
    }
  } catch (err) {
    console.error('❌ 获取学习单元失败:', err)
    units.value = []
    error.value = '加载学习单元失败，请稍后重试'
    throw err
  }
}

onMounted(async () => {
  progressStore.loadFromStorage()
  const savedCategory = localStorage.getItem(CATEGORY_FILTER_KEY)
  if (savedCategory) {
    selectedCategory.value = savedCategory
  }

  loading.value = true
  error.value = ''

  try {
    await loadCategories()
    await fetchUnits()
    
    // 如果初始选择的分类没有单元，自动切换到"全部分类"
    if (units.value.length === 0 && selectedCategory.value !== 'all') {
      console.log(`初始分类 ${selectedCategory.value} 没有单元，切换到全部分类`)
      selectedCategory.value = 'all'
      await fetchUnits()
    }
  } catch (err) {
    console.error(err)
    error.value = '加载学习单元失败，请稍后重试'
  } finally {
    loading.value = false
  }
})

watch(selectedCategory, async (value, previous) => {
  if (value !== 'all') {
    localStorage.setItem(CATEGORY_FILTER_KEY, value)
  } else {
    localStorage.removeItem(CATEGORY_FILTER_KEY)
  }

  if (previous === undefined) {
    return
  }

  loading.value = true
  error.value = ''

  try {
    await fetchUnits()
    // 如果选择的分类没有单元，且不是"全部分类"，自动切换到"全部分类"
    if (units.value.length === 0 && value !== 'all' && previous !== undefined) {
      console.log(`分类 ${value} 没有单元，切换到全部分类`)
      selectedCategory.value = 'all'
      await fetchUnits()
    }
  } catch (err) {
    console.error(err)
    error.value = '加载学习单元失败，请稍后重试'
  } finally {
    loading.value = false
  }
})

const getProgress = (unitId) => progressStore.getUnitProgress(unitId).progress
const getLearnedCount = (unitId) => progressStore.getUnitProgress(unitId).learnedWords.length

const overallSummary = computed(() => {
  if (!categories.value.length) return '0 词'
  const totalWords = categories.value.reduce((sum, item) => sum + (Number(item.total_words) || 0), 0)
  return `${totalWords} 词`
})
</script>

<style scoped>
.home {
  padding-bottom: 1.5rem;
}

.hero {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  align-items: center;
  gap: 2rem;
  margin-bottom: 2.5rem;
  overflow: hidden;
  background: rgba(237, 176, 29, 0.05);
}

.hero-content h1 {
  font-size: clamp(2.2rem, 3vw, 2.8rem);
  margin-bottom: 0.75rem;
  color: var(--text-primary);
}

.hero-content p {
  font-size: 1.05rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.hero-illustration {
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
  display: block;
}

.btn-large {
  padding: 0.85rem 2.75rem;
  font-size: 1.05rem;
}

.section-header {
  margin-bottom: 2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  background: white;
  border-radius: 1rem;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  color: #EDB01D;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 2px 4px rgba(237, 176, 29, 0.3));
}

.header-text h2 {
  font-size: 1.75rem;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
  font-weight: 700;
}

.header-text p {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin: 0;
}

.category-filter {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.filter-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.filter-select {
  appearance: none;
  border: 2px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 0.6rem 2.5rem 0.6rem 1rem;
  background: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%232B82AC' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")
    no-repeat right 1rem center / 12px 8px,
    white;
  min-width: 220px;
  color: var(--text-primary);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:hover {
  border-color: #EDB01D;
  box-shadow: 0 2px 8px rgba(237, 176, 29, 0.2);
}

.filter-select:focus {
  outline: none;
  border-color: #EDB01D;
  box-shadow: 0 0 0 3px rgba(237, 176, 29, 0.15);
}

.state-card {
  padding: 2rem;
  text-align: center;
  background: white;
  border-radius: 1rem;
  box-shadow: var(--shadow);
  color: var(--text-secondary);
}

.state-card.error {
  color: var(--danger-color);
}

.units-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.unit-category {
  margin: 0;
}

.chip {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background: rgba(237, 176, 29, 0.12);
  color: #21232A;
  font-size: 0.75rem;
  font-weight: 600;
}

.unit-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 260px;
}

.unit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.unit-header h3 {
  font-size: 1.25rem;
  color: var(--text-primary);
}

.unit-badge {
  background: #EDB01D;
  color: #21232A;
  padding: 0.25rem 0.9rem;
  border-radius: 999px;
  font-size: 0.85rem;
}

.unit-description {
  color: var(--text-secondary);
  line-height: 1.6;
}

.unit-progress {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-bar {
  position: relative;
  height: 8px;
  border-radius: 999px;
  background: var(--border-color);
  overflow: hidden;
}

.progress-fill {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: #EDB01D;
}

.progress-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.unit-actions {
  margin-top: auto;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

@media (max-width: 768px) {
  .hero {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  .hero-content h1 {
    font-size: 1.75rem;
  }

  .hero-content p {
    font-size: 0.95rem;
  }

  .hero-illustration {
    max-width: 240px;
  }

  .btn-large {
    padding: 0.7rem 1.5rem;
    font-size: 0.95rem;
    width: 100%;
  }

  .section-header {
    padding: 1rem;
    gap: 1rem;
  }

  .header-icon {
    font-size: 2rem;
  }

  .header-text h2 {
    font-size: 1.35rem;
  }

  .header-text p {
    font-size: 0.85rem;
  }

  .category-filter {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .filter-select {
    width: 100%;
    min-width: auto;
  }

  .units-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .unit-card {
    min-height: auto;
  }

  .unit-header h3 {
    font-size: 1.1rem;
  }
}

@media (max-width: 640px) {
  .hero {
    text-align: center;
  }

  .unit-actions {
    grid-template-columns: 1fr;
  }
}

/* 超小屏幕优化 */
@media (max-width: 375px) {
  .hero-content h1 {
    font-size: 1.5rem;
  }

  .section-header {
    padding: 0.75rem;
  }

  .header-text h2 {
    font-size: 1.2rem;
  }

  .unit-header h3 {
    font-size: 1rem;
  }
}
</style>
<template>
  <section class="reading">
    <div class="container">
      <header class="reading-header">
        <button class="btn-link" @click="goBack" aria-label="返回首页">← 返回</button>
        <h2 v-if="unitInfo">{{ unitInfo.unit_name }}</h2>
      </header>

      <div v-if="loading" class="state-card">加载中...</div>
      <div v-else-if="error" class="state-card error">{{ error }}</div>

      <div v-else class="reading-content">
        <!-- Reading List -->
        <div v-if="!selectedReading" class="readings-list">
          <h3 class="section-title"><BookMarked :size="24" style="display: inline-block; vertical-align: middle; margin-right: 8px;" /> 选择一篇文章开始阅读</h3>
          <div class="reading-cards">
            <article 
              v-for="(reading, index) in readings" 
              :key="reading.id" 
              class="reading-card card"
              @click="selectReading(reading.id)"
            >
              <div class="reading-number">{{ index + 1 }}</div>
              <h4>{{ reading.title }}</h4>
              <button class="btn btn-primary">开始阅读 →</button>
            </article>
          </div>
        </div>

        <!-- Reading Article -->
        <div v-else class="article-view">
          <button class="btn-link mb-3" @click="backToList">
            ← 返回文章列表
          </button>

          <article class="article-content card">
            <h1 class="article-title">{{ selectedReading.title }}</h1>
            
            <!-- Audio Player -->
            <div v-if="selectedReading.audio_url" class="audio-player">
              <div class="audio-header">
                <Headphones :size="24" class="audio-icon" />
                <span class="audio-label">听文章</span>
              </div>
              <audio 
                controls 
                :src="selectedReading.audio_url"
                class="audio-control"
              >
                您的浏览器不支持音频播放
              </audio>
            </div>

            <div class="article-text">
              <p v-for="(sentence, index) in selectedReading.sentences" :key="index">
                <span 
                  class="sentence"
                  :class="{ active: activeSentence === index }"
                  @click="toggleTranslation(index)"
                >
                  {{ sentence.sentence_text }}
                </span>
                <span 
                  v-if="activeSentence === index" 
                  class="translation-popup"
                >
                  {{ sentence.translation }}
                </span>
              </p>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { unitsAPI } from '@/api'
import axios from 'axios'
import { BookMarked, Headphones } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const unitId = computed(() => route.params.unitId)

const unitInfo = ref(null)
const readings = ref([])
const selectedReading = ref(null)
const activeSentence = ref(null)
const loading = ref(true)
const error = ref('')

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

async function fetchData() {
  loading.value = true
  error.value = ''

  try {
    // Get unit info
    const unitData = await unitsAPI.getById(unitId.value)
    unitInfo.value = unitData.data

    // Get reading articles for this unit
    const readingsResponse = await axios.get(
      `${API_BASE_URL}/units/${unitId.value}/readings`
    )
    readings.value = readingsResponse.data.data || []

    if (readings.value.length === 0) {
      error.value = '该单元暂无阅读文章'
    }
  } catch (err) {
    console.error(err)
    error.value = '加载阅读文章失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

async function selectReading(readingId) {
  loading.value = true
  try {
    const response = await axios.get(`${API_BASE_URL}/readings/${readingId}`)
    selectedReading.value = response.data.data
    activeSentence.value = null
  } catch (err) {
    console.error(err)
    error.value = '加载文章详情失败'
  } finally {
    loading.value = false
  }
}

function toggleTranslation(index) {
  activeSentence.value = activeSentence.value === index ? null : index
}

function backToList() {
  selectedReading.value = null
  activeSentence.value = null
}

function goBack() {
  router.push({ name: 'Home' })
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.reading {
  padding: 2rem 0;
  min-height: 100vh;
}

.reading-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--border-color);
}

.reading-header h2 {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin: 0;
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

.mb-3 {
  margin-bottom: 1.5rem;
}

.state-card {
  padding: 3rem;
  text-align: center;
  background: white;
  border-radius: 1rem;
  box-shadow: var(--shadow);
  color: var(--text-secondary);
}

.state-card.error {
  color: var(--danger-color);
}

.section-title {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  text-align: center;
}

.reading-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.reading-card {
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}

.reading-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.reading-number {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #EDB01D;
  color: #21232A;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
}

.reading-card h4 {
  font-size: 1.25rem;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.4;
}

.reading-card .btn {
  margin-top: auto;
}

.article-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 3rem;
}

.article-title {
  font-size: 2rem;
  color: var(--text-primary);
  margin-bottom: 2rem;
  text-align: center;
  line-height: 1.3;
}

.audio-player {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(237, 176, 29, 0.05);
  border-radius: 1rem;
  border: 2px solid rgba(237, 176, 29, 0.15);
}

.audio-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.audio-icon {
  color: #EDB01D;
}

.audio-label {
  font-size: 1.125rem;
}

.audio-control {
  width: 100%;
  height: 48px;
  border-radius: 0.5rem;
  outline: none;
}

.audio-control::-webkit-media-controls-panel {
  background-color: white;
  border-radius: 0.5rem;
}

.article-text {
  font-size: 1.125rem;
  line-height: 1.8;
  color: var(--text-primary);
}

.article-text p {
  margin-bottom: 1.5rem;
  position: relative;
}

.sentence {
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  padding: 0.25rem 0;
  border-radius: 4px;
}

.sentence:hover {
  background-color: rgba(237, 176, 29, 0.1);
  color: var(--primary-color);
}

.sentence.active {
  background-color: rgba(237, 176, 29, 0.15);
  font-weight: 500;
}

.translation-popup {
  display: block;
  margin-top: 0.75rem;
  padding: 1rem 1.25rem;
  background: #EDB01D;
  color: #21232A;
  border-radius: 0.75rem;
  font-size: 1rem;
  line-height: 1.6;
  box-shadow: 0 4px 12px rgba(237, 176, 29, 0.3);
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .reading {
    padding: 1rem 0;
  }

  .reading-header {
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
  }

  .reading-header h2 {
    font-size: 1.25rem;
  }

  .section-title {
    font-size: 1.25rem;
  }

  .reading-cards {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .article-content {
    padding: 1.5rem;
  }

  .article-title {
    font-size: 1.5rem;
  }

  .audio-player {
    padding: 1rem;
  }

  .audio-header {
    font-size: 1rem;
  }

  .audio-icon {
    font-size: 1.25rem;
  }

  .audio-label {
    font-size: 1rem;
  }

  .audio-control {
    height: 40px;
  }

  .article-text {
    font-size: 1rem;
    line-height: 1.7;
  }

  .translation-popup {
    font-size: 0.9rem;
    padding: 0.75rem 1rem;
  }
}
</style>


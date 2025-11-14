<template>
  <section class="reading-detail">
    <div class="container">
      <header class="detail-header">
        <button class="btn-link" @click="goBackToList" aria-label="返回文章列表">← 返回文章列表</button>
      </header>

      <div v-if="loading" class="state-card">加载中...</div>
      <div v-else-if="error" class="state-card error">{{ error }}</div>

      <article v-else class="article-content card">
        <h1 class="article-title">{{ reading.title }}</h1>

        <!-- Audio Player -->
        <div v-if="reading.audio_url" class="audio-player">
          <div class="audio-header">
            <Headphones :size="24" class="audio-icon" />
            <span class="audio-label">听文章</span>
          </div>
          <audio
            controls
            :src="reading.audio_url"
            class="audio-control"
          >
            您的浏览器不支持音频播放
          </audio>
        </div>

        <div class="article-text">
          <p v-for="(sentence, index) in reading.sentences" :key="index">
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
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { Headphones } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const unitId = computed(() => route.params.unitId)
const readingId = computed(() => route.params.readingId)

const reading = ref(null)
const activeSentence = ref(null)
const loading = ref(true)
const error = ref('')

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

async function fetchReading() {
  loading.value = true
  error.value = ''

  try {
    const response = await axios.get(`${API_BASE_URL}/readings/${readingId.value}`)
    reading.value = response.data.data
  } catch (err) {
    console.error(err)
    error.value = '加载文章详情失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

function toggleTranslation(index) {
  activeSentence.value = activeSentence.value === index ? null : index
}

function goBackToList() {
  router.push({ name: 'Reading', params: { unitId: unitId.value } })
}

onMounted(() => {
  fetchReading()
})
</script>

<style scoped>
.reading-detail {
  padding: 2rem 0;
  min-height: 100vh;
}

.detail-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--border-color);
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
  .reading-detail {
    padding: 1rem 0;
  }

  .detail-header {
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
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

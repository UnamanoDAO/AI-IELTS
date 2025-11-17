<template>
  <div class="vocabulary-page">
    <div class="container">
      <div class="header">
        <h1>我的单词本</h1>
        <button @click="goBack" class="btn-secondary">返回</button>
      </div>

      <!-- Statistics Card -->
      <div class="stats-card">
        <div class="stat-item">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">总词汇</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ stats.new_words }}</div>
          <div class="stat-label">新单词</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ stats.learning }}</div>
          <div class="stat-label">学习中</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ stats.familiar }}</div>
          <div class="stat-label">熟悉</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ stats.mastered }}</div>
          <div class="stat-label">已掌握</div>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="filter-tabs">
        <button
          v-for="level in masteryLevels"
          :key="level.value"
          :class="['tab', { active: currentFilter === level.value }]"
          @click="currentFilter = level.value"
        >
          {{ level.label }}
        </button>
      </div>

      <!-- Vocabulary List -->
      <div v-if="loading" class="loading">加载中...</div>

      <div v-else-if="filteredWords.length === 0" class="empty-state">
        <div class="empty-icon">📖</div>
        <p>{{ currentFilter === 'all' ? '单词本是空的' : `没有${getCurrentFilterLabel()}的单词` }}</p>
      </div>

      <div v-else class="vocabulary-list">
        <div v-for="word in filteredWords" :key="word.id" class="word-card">
          <div class="word-main">
            <div class="word-info">
              <h3>{{ word.word }}</h3>
              <div class="translation">{{ word.translation }}</div>
              <div v-if="word.context_sentence" class="context">
                <span class="context-label">例句:</span>
                {{ word.context_sentence }}
              </div>
            </div>
          </div>

          <div class="word-actions">
            <div class="mastery-selector">
              <label>掌握程度:</label>
              <select
                :value="word.mastery_level"
                @change="updateMasteryLevel(word.id, $event.target.value)"
              >
                <option value="new">新单词</option>
                <option value="learning">学习中</option>
                <option value="familiar">熟悉</option>
                <option value="mastered">已掌握</option>
              </select>
            </div>
            <div class="word-meta">
              <span class="review-count">复习 {{ word.review_count }} 次</span>
              <button @click="reviewWord(word.id)" class="btn-review">
                ✓ 复习
              </button>
              <button @click="deleteWord(word.id)" class="btn-delete">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';

const router = useRouter();

const currentFilter = ref('all');
const loading = ref(false);

const masteryLevels = [
  { value: 'all', label: '全部' },
  { value: 'new', label: '新单词' },
  { value: 'learning', label: '学习中' },
  { value: 'familiar', label: '熟悉' },
  { value: 'mastered', label: '已掌握' }
];

const stats = computed(() => vocabularyStore.stats);

const filteredWords = computed(() => {
  if (currentFilter.value === 'all') {
    return vocabularyStore.words;
  }
  return vocabularyStore.wordsByLevel(currentFilter.value);
});

const getCurrentFilterLabel = () => {
  const level = masteryLevels.find(l => l.value === currentFilter.value);
  return level ? level.label : '';
};

const updateMasteryLevel = async (id, level) => {
  try {
    await vocabularyStore.updateWord(id, { mastery_level: level });
  } catch (error) {
    alert('更新失败: ' + error.message);
  }
};

const reviewWord = async (id) => {
  try {
    await vocabularyStore.reviewWord(id);
    alert('已标记为复习！');
  } catch (error) {
    alert('操作失败: ' + error.message);
  }
};

const deleteWord = async (id) => {
  if (!confirm('确定要从单词本中删除这个单词吗？')) return;

  try {
    await vocabularyStore.deleteWord(id);
  } catch (error) {
    alert('删除失败: ' + error.message);
  }
};

const goBack = () => {
  router.push('/reading-comprehension');
};

onMounted(async () => {
  loading.value = true;
  await Promise.all([
    vocabularyStore.fetchVocabulary(),
    vocabularyStore.fetchStats()
  ]);
  loading.value = false;
});
</script>

<style scoped>
.vocabulary-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 1rem;
}

.container {
  max-width: 900px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  color: white;
}

.header h1 {
  font-size: 2rem;
  margin: 0;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.3);
}

.stats-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.tab {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.tab:hover {
  background: rgba(255, 255, 255, 0.3);
}

.tab.active {
  background: white;
  color: #667eea;
}

.loading {
  text-align: center;
  padding: 4rem;
  color: white;
  font-size: 1.2rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state p {
  font-size: 1.2rem;
  color: #666;
  margin: 0;
}

.vocabulary-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.word-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.word-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.word-main {
  margin-bottom: 1rem;
}

.word-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.4rem;
  color: #333;
}

.translation {
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 0.75rem;
}

.context {
  background: #f8f9fa;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #555;
  line-height: 1.6;
  margin-top: 0.75rem;
}

.context-label {
  font-weight: 600;
  color: #667eea;
  margin-right: 0.5rem;
}

.word-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #eee;
  flex-wrap: wrap;
  gap: 1rem;
}

.mastery-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.mastery-selector label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 600;
}

.mastery-selector select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: border-color 0.2s;
}

.mastery-selector select:focus {
  outline: none;
  border-color: #667eea;
}

.word-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.review-count {
  font-size: 0.85rem;
  color: #999;
}

.btn-review,
.btn-delete {
  background: none;
  border: 1px solid #ddd;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-review:hover {
  background: #d4edda;
  border-color: #28a745;
  color: #155724;
}

.btn-delete:hover {
  background: #f8d7da;
  border-color: #dc3545;
  color: #721c24;
}

@media (max-width: 768px) {
  .stats-card {
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    padding: 1.5rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .word-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .mastery-selector {
    flex-direction: column;
    align-items: stretch;
  }

  .mastery-selector select {
    width: 100%;
  }

  .word-meta {
    justify-content: space-between;
  }
}
</style>

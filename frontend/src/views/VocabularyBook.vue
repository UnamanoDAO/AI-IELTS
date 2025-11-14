<template>
  <div class="vocabulary-book-container">
    <div class="header">
      <h1>我的单词本</h1>
      <div class="header-actions">
        <button
          v-if="words.length >= 2"
          @click="startTest"
          class="btn-test-header"
        >
          开始连线测试
        </button>
        <button @click="showAddWordModal = true" class="btn-add">+ 添加单词</button>
      </div>
    </div>

    <div class="stats">
      <div class="stat-item">
        <div class="stat-value">{{ stats.total_words || 0 }}</div>
        <div class="stat-label">总单词数</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ stats.mastered_count || 0 }}</div>
        <div class="stat-label">已掌握</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ stats.unmastered_count || 0 }}</div>
        <div class="stat-label">待掌握</div>
      </div>
    </div>

    <div class="filter-tabs">
      <button
        :class="['tab', { active: filter === 'all' }]"
        @click="filter = 'all'; loadWords()"
      >
        全部
      </button>
      <button
        :class="['tab', { active: filter === 'unmastered' }]"
        @click="filter = 'unmastered'; loadWords()"
      >
        待掌握
      </button>
      <button
        :class="['tab', { active: filter === 'mastered' }]"
        @click="filter = 'mastered'; loadWords()"
      >
        已掌握
      </button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="words.length === 0" class="empty-state">
      <p>还没有添加单词</p>
      <button @click="showAddWordModal = true" class="btn-add-large">添加第一个单词</button>
    </div>

    <div v-else class="word-list">
      <div
        v-for="word in words"
        :key="word.id"
        :class="['word-item', { analyzing: isWordAnalyzing(word), 'spelling-error': isWordSpellingError(word) }]"
        @click="viewWordDetail(word.id)"
      >
        <div class="word-content">
          <div class="word-header">
            <h3>{{ word.word }}</h3>
            <span v-if="isWordSpellingError(word)" class="badge-error">⚠️ 拼写错误</span>
            <span v-else-if="isWordAnalyzing(word)" class="badge-analyzing">🔄 AI分析中...</span>
            <span v-else-if="word.is_mastered" class="badge-mastered">✓ 已掌握</span>
          </div>
          <p class="phonetic">{{ word.phonetic }}</p>
          <p class="meaning">{{ word.chinese_meaning }}</p>
        </div>
        <div class="word-actions">
          <button @click.stop="deleteWord(word.id)" class="btn-delete">删除</button>
        </div>
      </div>
    </div>

    <!-- Add Word Modal -->
    <div v-if="showAddWordModal" class="modal-overlay" @click="showAddWordModal = false">
      <div class="modal-content" @click.stop>
        <h2>添加单词</h2>
        <input
          v-model="newWord"
          type="text"
          placeholder="输入英文单词"
          class="input-word"
          @keyup.enter="addWord"
        />
        <div v-if="addError" class="error">{{ addError }}</div>
        <div class="modal-actions">
          <button @click="showAddWordModal = false" class="btn-cancel">取消</button>
          <button @click="addWord" :disabled="addingWord" class="btn-confirm">
            {{ addingWord ? 'AI分析中...' : '添加' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Custom Dialog -->
    <CustomDialog
      :show="dialogState.show"
      :title="dialogState.title"
      :message="dialogState.message"
      :type="dialogState.type"
      :confirmText="dialogState.confirmText"
      @confirm="handleConfirm"
      @cancel="handleCancel"
      @close="handleClose"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api';
import CustomDialog from '@/components/CustomDialog.vue';
import { useDialog } from '@/composables/useDialog.js';

const router = useRouter();

const words = ref([]);
const stats = ref({});
const loading = ref(false);
const filter = ref('all');
const showAddWordModal = ref(false);
const newWord = ref('');
const addingWord = ref(false);
const addError = ref('');
const pollingIntervals = ref([]); // 存储轮询定时器

const { dialogState, showAlert, showConfirm, handleConfirm, handleCancel, handleClose } = useDialog();

onMounted(() => {
  loadWords();
  loadStats();
});

onUnmounted(() => {
  // 清理所有轮询定时器
  pollingIntervals.value.forEach(interval => clearInterval(interval));
  pollingIntervals.value = [];
});

// 检查是否有单词正在分析中
function hasAnalyzingWords() {
  return words.value.some(word => isWordAnalyzing(word));
}

// 检查单个单词是否正在分析中
function isWordAnalyzing(word) {
  return (
    word.chinese_meaning === 'AI 分析中...' ||
    word.chinese_meaning.includes('分析中') ||
    (word.chinese_meaning.includes('分析失败') && !word.chinese_meaning.includes('拼写错误'))
  );
}

// 检查单词是否有拼写错误
function isWordSpellingError(word) {
  return word.chinese_meaning && word.chinese_meaning.includes('拼写错误');
}

// 开始轮询检查AI分析状态
function startPollingForAnalysis(wordId = null) {
  // 如果已经有轮询在进行，不重复添加
  if (pollingIntervals.value.length > 0) return;

  console.log('🔄 开始轮询AI分析状态...');

  let attemptCount = 0;
  const maxAttempts = 20; // 最多轮询20次（60秒）

  const interval = setInterval(async () => {
    attemptCount++;

    // 静默重新加载单词列表（不显示loading状态，避免闪烁）
    await loadWords(true);

    // 检查是否还有正在分析的单词
    const stillAnalyzing = hasAnalyzingWords();

    if (!stillAnalyzing) {
      console.log('✅ AI分析完成，停止轮询');
      clearInterval(interval);
      pollingIntervals.value = pollingIntervals.value.filter(i => i !== interval);
      await loadStats(); // 更新统计
    } else if (attemptCount >= maxAttempts) {
      console.log('⏱️ 轮询超时，停止轮询');
      clearInterval(interval);
      pollingIntervals.value = pollingIntervals.value.filter(i => i !== interval);
    } else {
      console.log(`🔄 第${attemptCount}次轮询，仍有单词在分析中...`);
    }
  }, 3000); // 每3秒检查一次

  pollingIntervals.value.push(interval);
}

async function loadWords(silent = false) {
  if (!silent) loading.value = true;
  try {
    const params = {};
    if (filter.value === 'mastered') params.masteredOnly = 'true';
    if (filter.value === 'unmastered') params.unmasteredOnly = 'true';

    const data = await api.get('/vocabulary-book', { params });
    words.value = data.words;

    // 检查是否有正在分析的单词，如果有则启动轮询
    if (hasAnalyzingWords() && pollingIntervals.value.length === 0) {
      console.log('📋 发现有单词正在分析中，启动轮询...');
      startPollingForAnalysis();
    }
  } catch (error) {
    console.error('Load words error:', error);
    await showAlert('加载失败：' + (error.response?.data?.error || error.message), '错误');
  } finally {
    if (!silent) loading.value = false;
  }
}

async function loadStats() {
  try {
    const data = await api.get('/vocabulary-book/stats/summary');
    stats.value = data;
  } catch (error) {
    console.error('Load stats error:', error);
  }
}

async function addWord() {
  if (!newWord.value.trim()) {
    addError.value = '请输入单词';
    return;
  }

  addingWord.value = true;
  addError.value = '';

  try {
    const result = await api.post('/vocabulary-book', { word: newWord.value.trim() });

    // 创建一个临时的单词对象，立即添加到列表中（不刷新页面）
    const tempWord = {
      id: result.id,
      word: result.word || newWord.value.trim(),
      chinese_meaning: 'AI 分析中...',
      phonetic: '',
      word_breakdown: '',
      memory_technique: '',
      is_mastered: false,
      created_at: new Date().toISOString()
    };

    // 将新单词添加到列表开头
    words.value.unshift(tempWord);

    newWord.value = '';
    showAddWordModal.value = false;

    // 静默更新统计数据
    await loadStats();

    // If AI is analyzing in background, start polling to check status
    if (result.analyzing) {
      console.log('📝 单词已添加，AI正在后台分析...');
      startPollingForAnalysis(result.id);
    }
  } catch (error) {
    addError.value = error.response?.data?.error || error.message || '添加失败';
  } finally {
    addingWord.value = false;
  }
}

async function deleteWord(id) {
  try {
    const confirmed = await showConfirm('确定要删除这个单词吗？', '确认删除');
    if (!confirmed) return;
  } catch {
    return;
  }

  try {
    await api.delete(`/vocabulary-book/${id}`);
    loadWords();
    loadStats();
  } catch (error) {
    await showAlert('删除失败：' + (error.response?.data?.error || error.message), '错误');
  }
}

function viewWordDetail(id) {
  router.push(`/vocabulary-book/${id}`);
}

async function startTest() {
  // 检查未掌握单词数量
  const unmasteredCount = stats.value.unmastered_count || 0;

  if (unmasteredCount < 2) {
    await showAlert(
      `请添加至少 2 个未掌握的单词才可以开始测试！\n\n当前未掌握单词数：${unmasteredCount}`,
      '无法开始测试'
    );
    return;
  }

  router.push('/vocabulary-test');
}
</script>

<style scoped>
.vocabulary-book-container {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.header h1 {
  font-size: 24px;
  color: #333;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn-test-header {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  background: #4caf50;
  color: white;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
}

.btn-test-header:hover {
  transform: scale(1.03);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.btn-add {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  background: #EDB01D;
  color: #21232A;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.btn-add::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 2px,
    rgba(33, 35, 42, 0.1) 2px,
    rgba(33, 35, 42, 0.1) 4px
  );
  pointer-events: none;
}

.btn-add:hover {
  transform: scale(1.03);
  box-shadow: 0 4px 12px rgba(237, 176, 29, 0.3);
}

.btn-add:hover::before {
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 2px,
    rgba(33, 35, 42, 0.2) 2px,
    rgba(33, 35, 42, 0.2) 4px
  );
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.stat-item {
  background: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #EDB01D;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 5px;
}

.filter-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tab {
  flex: 1;
  padding: 12px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.tab.active {
  background: #EDB01D;
  color: #21232A;
  border-color: transparent;
}

.loading,
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.btn-add-large {
  margin-top: 15px;
  padding: 12px 24px;
  background: #EDB01D;
  color: #21232A;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.btn-add-large::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 2px,
    rgba(33, 35, 42, 0.1) 2px,
    rgba(33, 35, 42, 0.1) 4px
  );
  pointer-events: none;
}

.btn-add-large:hover {
  transform: scale(1.03);
  box-shadow: 0 4px 12px rgba(237, 176, 29, 0.3);
}

.word-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.word-item {
  background: white;
  border-radius: 12px;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.word-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.word-item.analyzing {
  border: 2px solid #EDB01D;
  background: rgba(237, 176, 29, 0.03);
  animation: pulse 2s ease-in-out infinite;
}

.word-item.spelling-error {
  border: 2px solid #f44336;
  background: rgba(244, 67, 54, 0.03);
}

@keyframes pulse {
  0%, 100% {
    border-color: #EDB01D;
    box-shadow: 0 2px 8px rgba(237, 176, 29, 0.15);
  }
  50% {
    border-color: #F5C542;
    box-shadow: 0 4px 16px rgba(237, 176, 29, 0.25);
  }
}

.word-content {
  flex: 1;
}

.word-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
}

.word-header h3 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.badge-mastered {
  padding: 4px 8px;
  background: #4caf50;
  color: white;
  border-radius: 4px;
  font-size: 12px;
}

.badge-error {
  padding: 4px 8px;
  background: #f44336;
  color: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

.badge-analyzing {
  padding: 4px 8px;
  background: #EDB01D;
  color: #21232A;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  animation: blink 1.5s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.phonetic {
  color: #999;
  font-size: 14px;
  margin: 5px 0;
}

.meaning {
  color: #666;
  font-size: 14px;
  margin: 5px 0;
}

.word-actions {
  display: flex;
  gap: 8px;
}

.btn-delete {
  padding: 6px 12px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 30px;
  width: 90%;
  max-width: 400px;
}

.modal-content h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
}

.input-word {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  box-sizing: border-box;
}

.input-word:focus {
  outline: none;
  border-color: #EDB01D;
}

.error {
  color: #f44336;
  font-size: 14px;
  margin-top: 10px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

.btn-cancel {
  background: #e0e0e0;
  color: #333;
}

.btn-confirm {
  background: #21232A;
  color: white;
  position: relative;
  overflow: hidden;
}

.btn-confirm::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 2px,
    rgba(255, 255, 255, 0.05) 2px,
    rgba(255, 255, 255, 0.05) 4px
  );
  pointer-events: none;
}

.btn-confirm:hover:not(:disabled) {
  transform: scale(1.03);
  box-shadow: 0 4px 12px rgba(33, 35, 42, 0.3);
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .vocabulary-book {
    padding: 1rem;
  }

  .page-header h1 {
    font-size: 1.5rem;
  }

  .stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .stat-value {
    font-size: 22px;
  }

  .stat-label {
    font-size: 12px;
  }

  .controls {
    flex-direction: column;
    gap: 0.75rem;
  }

  .search-box {
    width: 100%;
  }

  .filter-tabs {
    overflow-x: auto;
    scrollbar-width: none;
  }

  .filter-tabs::-webkit-scrollbar {
    display: none;
  }

  .words-grid {
    grid-template-columns: 1fr;
    gap: 0.85rem;
  }

  .word-card {
    padding: 0.85rem;
  }

  .word-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .word-actions .btn {
    width: 100%;
  }
}

@media (max-width: 375px) {
  .vocabulary-book {
    padding: 0.75rem;
  }

  .stats {
    grid-template-columns: 1fr;
  }

  .page-header h1 {
    font-size: 1.35rem;
  }
}
</style>

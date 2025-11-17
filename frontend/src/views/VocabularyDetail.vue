<template>
  <div class="word-detail-container">
    <div class="header">
      <button @click="goBack" class="btn-back">← 返回</button>
      <h1>单词详情</h1>
      <div class="spacer"></div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="word" class="word-detail">
      <!-- Word Header -->
      <div class="word-header">
        <h2>{{ word.word }}</h2>
        <div class="header-actions">
          <button
            @click="regenerateWord"
            :disabled="regenerating"
            class="btn-regenerate"
          >
            <RefreshCw :size="16" style="display: inline-block; vertical-align: middle; margin-right: 4px;" :class="{ spinning: regenerating }" />
            {{ regenerating ? '重新生成中...' : '重新生成' }}
          </button>
          <button
            @click="toggleMastered"
            :class="['btn-mastered', { active: word.is_mastered }]"
          >
            <CheckCircle :size="16" style="display: inline-block; vertical-align: middle; margin-right: 4px;" />
            {{ word.is_mastered ? '已掌握' : '标记为已掌握' }}
          </button>
        </div>
      </div>

      <!-- Phonetic & Pronunciation -->
      <div class="section">
        <h3>发音</h3>
        <div class="phonetic-section">
          <span class="phonetic">{{ word.phonetic }}</span>
          <button v-if="word.pronunciation_audio_url" @click="playAudio(word.pronunciation_audio_url)" class="btn-audio">
            <Volume2 :size="18" style="display: inline-block; vertical-align: middle; margin-right: 4px;" /> 播放
          </button>
        </div>
      </div>

      <!-- Chinese Meaning -->
      <div class="section">
        <h3>中文释义</h3>
        <div class="meaning-content">
          <div
            v-for="(line, index) in meaningLines"
            :key="index"
            :class="['meaning-line', { 'has-type': hasWordType(line) }]"
          >
            <span v-html="formatMeaningLine(line)"></span>
          </div>
        </div>
      </div>

      <!-- Word Breakdown -->
      <div class="section">
        <h3>词根拆解</h3>
        <p>{{ word.word_breakdown || '暂无拆解信息' }}</p>
      </div>

      <!-- Memory Technique -->
      <div class="section">
        <h3>记忆技巧</h3>
        <p>{{ word.memory_technique || '暂无记忆技巧' }}</p>
      </div>

      <!-- Derived Words -->
      <div v-if="derivedWordsData.length > 0" class="section">
        <h3>衍生词</h3>
        <div class="derived-words-list">
          <div v-for="(derived, index) in derivedWordsData" :key="index" class="derived-word-item">
            <div class="derived-word-header">
              <span class="derived-word-text">{{ derived.word }}</span>
              <span v-if="derived.phonetic" class="derived-word-phonetic">{{ derived.phonetic }}</span>
            </div>
            <div v-if="derived.meaning" class="derived-word-meaning">{{ derived.meaning }}</div>
            <div v-if="derived.usage" class="derived-word-usage">{{ derived.usage }}</div>
          </div>
        </div>
      </div>
      <div v-else-if="word.derived_words" class="section">
        <h3>衍生词</h3>
        <p>{{ word.derived_words }}</p>
      </div>

      <!-- Common Usage -->
      <div v-if="commonUsageData.length > 0" class="section">
        <h3>常用用法</h3>
        <div class="common-usage-list">
          <div v-for="(usage, index) in commonUsageData" :key="index" class="usage-item">
            <div class="usage-phrase">
              <span class="phrase-icon">📌</span>
              <span class="phrase-text">{{ usage.phrase }}</span>
            </div>
            <div v-if="usage.meaning" class="usage-meaning">含义：{{ usage.meaning }}</div>
            <div v-if="usage.example" class="usage-example">例句：{{ usage.example }}</div>
          </div>
        </div>
      </div>
      <div v-else-if="word.common_usage" class="section">
        <h3>常用用法</h3>
        <p>{{ word.common_usage }}</p>
      </div>

      <!-- Usage Examples -->
      <div v-if="usageExamples.length > 0" class="section">
        <h3>例句</h3>
        <div v-for="(example, index) in usageExamples" :key="index" class="example-item">
          <div class="example-header">
            <span class="example-number">例句 {{ index + 1 }}</span>
            <button
              v-if="example.audio_url"
              @click="playAudio(example.audio_url)"
              class="btn-audio-sm"
            >
              <Volume2 :size="14" />
            </button>
          </div>
          <p class="example-sentence">{{ example.sentence }}</p>
          <p class="example-translation">{{ example.translation }}</p>
        </div>
      </div>
    </div>

    <!-- Audio Player -->
    <audio ref="audioPlayer" style="display: none;"></audio>

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
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '@/api';
import { Volume2, CheckCircle, RefreshCw } from 'lucide-vue-next';
import CustomDialog from '@/components/CustomDialog.vue';
import { useDialog } from '@/composables/useDialog.js';

const router = useRouter();
const route = useRoute();
const word = ref(null);
const loading = ref(false);
const regenerating = ref(false);
const audioPlayer = ref(null);
const wordId = ref(route.params.id); // 保存 ID 引用

const { dialogState, showAlert, showConfirm, handleConfirm, handleCancel, handleClose } = useDialog();

const usageExamples = computed(() => {
  if (!word.value?.usage_examples) return [];
  if (typeof word.value.usage_examples === 'string') {
    try {
      return JSON.parse(word.value.usage_examples);
    } catch {
      return [];
    }
  }
  return Array.isArray(word.value.usage_examples) ? word.value.usage_examples : [];
});

const meaningLines = computed(() => {
  if (!word.value?.chinese_meaning) return [];
  return word.value.chinese_meaning.split('\n').filter(line => line.trim());
});

const derivedWordsData = computed(() => {
  if (!word.value?.derived_words) return [];

  // Try to parse as JSON (new format)
  if (word.value.derived_words.startsWith('[')) {
    try {
      const parsed = JSON.parse(word.value.derived_words);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse derived_words as JSON:', e);
    }
  }

  // Old format or parse failed
  return [];
});

const commonUsageData = computed(() => {
  if (!word.value?.common_usage) return [];

  // Try to parse as JSON (new format)
  if (word.value.common_usage.startsWith('[')) {
    try {
      const parsed = JSON.parse(word.value.common_usage);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse common_usage as JSON:', e);
    }
  }

  // Old format or parse failed
  return [];
});

const hasWordType = (line) => {
  return /【[a-z\.]+】/.test(line);
};

const formatMeaningLine = (line) => {
  // Format: 【n.】meaning → <span class="word-type">n.</span> meaning
  return line.replace(/【([^】]+)】/g, '<span class="word-type">$1</span>');
};

onMounted(() => {
  loadWordDetail();
});

async function loadWordDetail() {
  loading.value = true;
  try {
    const data = await api.get(`/vocabulary-book/${wordId.value}`);
    word.value = data;
  } catch (error) {
    console.error('Load word detail error:', error);
    await showAlert('加载失败：' + (error.response?.data?.error || error.message), '错误');
    goBack();
  } finally {
    loading.value = false;
  }
}

async function toggleMastered() {
  try {
    const newStatus = !word.value.is_mastered;
    await api.patch(`/vocabulary-book/${word.value.id}/mastered`, {
      is_mastered: newStatus
    });
    word.value.is_mastered = newStatus;
  } catch (error) {
    await showAlert('更新失败：' + (error.response?.data?.error || error.message), '错误');
  }
}

async function regenerateWord() {
  try {
    const confirmed = await showConfirm(
      '确定要重新生成这个单词的内容吗？这将替换掉现有的所有内容。',
      '确认重新生成'
    );

    if (!confirmed) {
      return;
    }
  } catch {
    return;
  }

  regenerating.value = true;
  try {
    const data = await api.post(`/vocabulary-book/${word.value.id}/regenerate`);

    // 立即更新为分析中状态
    word.value.chinese_meaning = 'AI 分析中...';
    word.value.phonetic = '';
    word.value.word_breakdown = '';
    word.value.memory_technique = '';

    // 显示提示并跳转回列表页
    await showAlert(
      '重新生成请求已提交，AI 正在后台分析中...\n\n分析完成后会自动更新，请在列表中查看进度。',
      '重新生成中'
    );

    // 跳转回列表页
    router.push('/vocabulary-book');

  } catch (error) {
    console.error('Regenerate word error:', error);
    await showAlert('重新生成失败：' + (error.response?.data?.error || error.message), '错误');
    regenerating.value = false;
  }
}

function playAudio(url) {
  if (audioPlayer.value && url) {
    audioPlayer.value.src = url;
    audioPlayer.value.play();
  }
}

function goBack() {
  router.push('/vocabulary-book');
}
</script>

<style scoped>
.word-detail-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.header h1 {
  font-size: 24px;
  color: #333;
  margin: 0;
}

.spacer {
  width: 80px;
}

.btn-back {
  padding: 8px 16px;
  background: #e0e0e0;
  color: #333;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.word-detail {
  max-width: 800px;
  margin: 0 auto;
}

.word-header {
  background: white;
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.word-header h2 {
  margin: 0;
  font-size: 36px;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.btn-regenerate {
  padding: 10px 20px;
  border: 2px solid #2B82AC;
  background: white;
  color: #2B82AC;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn-regenerate:hover:not(:disabled) {
  background: #2B82AC;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(43, 130, 172, 0.3);
}

.btn-regenerate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.btn-mastered {
  padding: 10px 20px;
  border: 2px solid #4caf50;
  background: white;
  color: #4caf50;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn-mastered.active {
  background: #4caf50;
  color: white;
}

.section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #2B82AC;
  font-size: 18px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 10px;
}

.section p {
  margin: 0;
  color: #333;
  line-height: 1.8;
  font-size: 16px;
}

.meaning-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.meaning-line {
  color: #333;
  line-height: 1.8;
  font-size: 16px;
  padding: 0.5rem 0;
}

.meaning-line.has-type {
  border-left: 3px solid #EDB01D;
  padding-left: 1rem;
  margin-left: -0.25rem;
}

.meaning-line :deep(.word-type) {
  color: #EDB01D;
  font-weight: 700;
  font-size: 0.9em;
  margin-right: 0.5rem;
  display: inline-block;
  min-width: 40px;
}

.phonetic-section {
  display: flex;
  align-items: center;
  gap: 15px;
}

.phonetic {
  font-size: 20px;
  color: #666;
  font-family: 'Courier New', monospace;
}

.btn-audio {
  padding: 8px 16px;
  background: #EDB01D;
  color: #21232A;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.btn-audio::before {
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

.btn-audio:hover {
  transform: scale(1.03);
  box-shadow: 0 4px 12px rgba(237, 176, 29, 0.3);
}

.example-item {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.example-item:last-child {
  margin-bottom: 0;
}

.example-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.example-number {
  font-weight: bold;
  color: #2B82AC;
  font-size: 14px;
}

.btn-audio-sm {
  padding: 4px 8px;
  background: #EDB01D;
  color: #21232A;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}

.btn-audio-sm:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(237, 176, 29, 0.3);
}

.example-sentence {
  font-size: 16px;
  color: #333;
  margin: 8px 0;
  font-style: italic;
}

.example-translation {
  font-size: 14px;
  color: #666;
  margin: 5px 0 0 0;
}

/* Derived Words Styles */
.derived-words-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.derived-word-item {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border-left: 3px solid #EDB01D;
}

.derived-word-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.derived-word-text {
  font-size: 18px;
  font-weight: 700;
  color: #2B82AC;
}

.derived-word-phonetic {
  font-size: 14px;
  color: #666;
  font-family: 'Courier New', monospace;
  font-style: italic;
}

.derived-word-meaning {
  font-size: 15px;
  color: #333;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.derived-word-usage {
  font-size: 14px;
  color: #555;
  line-height: 1.6;
  padding-left: 1rem;
  border-left: 2px solid #ddd;
}

/* Common Usage Styles */
.common-usage-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.usage-item {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border-left: 3px solid #2B82AC;
}

.usage-phrase {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.phrase-icon {
  font-size: 16px;
}

.phrase-text {
  font-size: 16px;
  font-weight: 700;
  color: #2B82AC;
}

.usage-meaning {
  font-size: 14px;
  color: #333;
  margin-bottom: 0.5rem;
  padding-left: 1.5rem;
}

.usage-example {
  font-size: 14px;
  color: #555;
  font-style: italic;
  line-height: 1.6;
  padding-left: 1.5rem;
  border-left: 2px solid #ddd;
  margin-left: 1.5rem;
}

@media (max-width: 768px) {
  .word-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .word-header h2 {
    font-size: 28px;
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
  }

  .btn-regenerate,
  .btn-mastered {
    width: 100%;
  }

  .phonetic-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .btn-audio {
    width: 100%;
  }
}
</style>

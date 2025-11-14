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
        <div class="meaning-text" v-html="formattedMeaning"></div>
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
      <div v-if="word.derived_words" class="section">
        <h3>衍生词</h3>
        <p>{{ word.derived_words }}</p>
      </div>

      <!-- Common Usage -->
      <div v-if="word.common_usage" class="section">
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

const formattedMeaning = computed(() => {
  if (!word.value?.chinese_meaning) return '';
  // Convert newlines to <br> tags for proper display
  return word.value.chinese_meaning.replace(/\n/g, '<br>');
});

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

.meaning-text {
  color: #333;
  line-height: 1.8;
  font-size: 16px;
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

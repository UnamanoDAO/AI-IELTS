<template>
  <div class="vocabulary-test-container">
    <div class="header">
      <button @click="goBack" class="btn-back">← 返回</button>
      <h1>连线测试</h1>
      <div v-if="quizStarted && !quizFinished" class="countdown-timer" :class="{ urgent: timeLeft <= 10 }">
        ⏱️ {{ formatTime(timeLeft) }}
      </div>
    </div>

    <div v-if="loading" class="loading">生成测试题目中...</div>

    <div v-else-if="!quizStarted" class="start-screen">
      <div class="instructions">
        <h2>游戏规则</h2>
        <p>将左边的英文单词与右边对应的中文释义连线</p>
        <p>⏱️ <strong>{{ timeLimit }}秒</strong>内完成所有连线</p>
        <p>❌ 连错会显示红色提示并扣除3秒</p>
        <p>✅ 全部连线正确后自动提交评分</p>
      </div>
      <button @click="startQuiz" class="btn-start">开始测试</button>
    </div>

    <div v-else-if="quizFinished" class="result-screen">
      <h2>{{ timeoutFailure ? '⏱️ 时间到！' : '🎉 测试完成！' }}</h2>
      <div class="result-stats">
        <div class="result-item">
          <div class="result-label">正确率</div>
          <div class="result-value" :class="{ excellent: accuracy >= 80, good: accuracy >= 60 }">
            {{ accuracy }}%
          </div>
        </div>
        <div class="result-item">
          <div class="result-label">正确 / 总题数</div>
          <div class="result-value">{{ correctCount }} / {{ totalQuestions }}</div>
        </div>
        <div class="result-item">
          <div class="result-label">用时</div>
          <div class="result-value">{{ formatTime(timeUsed) }}</div>
        </div>
        <div class="result-item">
          <div class="result-label">错误次数</div>
          <div class="result-value">{{ wrongAttempts }}</div>
        </div>
      </div>
      <div class="result-actions">
        <button @click="restartQuiz" class="btn-retry">再测一次</button>
        <button @click="goBack" class="btn-finish">返回单词本</button>
      </div>
    </div>

    <div v-else class="quiz-content">
      <div class="progress-info">
        <div class="progress-text">已完成：{{ answeredCount }} / {{ totalQuestions }}</div>
        <div v-if="wrongAttempts > 0" class="error-count">❌ 错误：{{ wrongAttempts }} 次</div>
      </div>

      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: `${(answeredCount / totalQuestions) * 100}%` }"
        ></div>
      </div>

      <div class="matching-area">
        <!-- English Words Column -->
        <div class="word-column">
          <h3>英文单词</h3>
          <div
            v-for="word in englishWords"
            :key="word.id"
            :class="[
              'word-box',
              { selected: selectedEnglish === word.id },
              { matched: isMatched(word.id) },
              { wrong: isWrong(word.id, 'english') }
            ]"
            @click="selectEnglish(word.id)"
          >
            {{ word.word }}
          </div>
        </div>

        <!-- Chinese Meanings Column -->
        <div class="word-column">
          <h3>中文释义</h3>
          <div
            v-for="meaning in chineseMeanings"
            :key="meaning.id"
            :class="[
              'word-box',
              { selected: selectedChinese === meaning.id },
              { matched: isMatched(meaning.id) },
              { wrong: isWrong(meaning.id, 'chinese') }
            ]"
            @click="selectChinese(meaning.id)"
          >
            {{ meaning.meaning }}
          </div>
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api';
import CustomDialog from '@/components/CustomDialog.vue';
import { useDialog } from '@/composables/useDialog.js';

const router = useRouter();

const { dialogState, showAlert, showConfirm, handleConfirm, handleCancel, handleClose } = useDialog();

const loading = ref(false);
const quizStarted = ref(false);
const quizFinished = ref(false);
const englishWords = ref([]);
const chineseMeanings = ref([]);
const selectedEnglish = ref(null);
const selectedChinese = ref(null);
const answers = ref([]); // 正确配对的答案
const wrongPairs = ref([]); // 错误配对（用于显示红色）
const failedWordIds = ref(new Set()); // 记录曾经失败过的单词ID（用于判断是否掌握）
const timerInterval = ref(null);

// 倒计时相关
const timeLimit = ref(30); // 根据题目数量动态调整：每题6秒
const timeLeft = ref(30);
const timeUsed = ref(0);
const timeoutFailure = ref(false);

// 统计数据
const correctCount = ref(0);
const totalQuestions = ref(0);
const accuracy = ref(0);
const wrongAttempts = ref(0);

const answeredCount = computed(() => answers.value.length);

onMounted(() => {
  generateQuiz();
});

onUnmounted(() => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
  }
});

async function generateQuiz() {
  loading.value = true;
  try {
    const data = await api.post('/vocabulary-test/generate', {
      count: 5
    });

    englishWords.value = data.englishWords;
    chineseMeanings.value = data.chineseMeanings;
    totalQuestions.value = data.totalQuestions;

    // 根据题目数量设置时间限制（每题6秒）
    timeLimit.value = totalQuestions.value * 6;
    timeLeft.value = timeLimit.value;
  } catch (error) {
    console.error('Generate quiz error:', error);
    const errorMsg = error.response?.data?.error || error.message;

    // 检查是否是单词数量不足的错误
    if (errorMsg.includes('Not enough words') || errorMsg.includes('至少')) {
      await showAlert(
        '请添加至少 2 个未掌握的单词才可以开始测试！\n\n请返回单词本添加更多单词。',
        '无法开始测试'
      );
    } else {
      await showAlert('生成测试失败：' + errorMsg, '错误');
    }

    goBack();
  } finally {
    loading.value = false;
  }
}

function startQuiz() {
  quizStarted.value = true;
  startCountdown();
}

function startCountdown() {
  const startTime = Date.now();

  timerInterval.value = setInterval(() => {
    timeLeft.value--;

    if (timeLeft.value <= 0) {
      // 时间到了，强制结束
      timeoutFailure.value = true;
      timeUsed.value = timeLimit.value;
      autoSubmitAnswers();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
    timerInterval.value = null;
    timeUsed.value = timeLimit.value - timeLeft.value;
  }
}

function selectEnglish(id) {
  if (isMatched(id)) return;
  selectedEnglish.value = id;
  checkMatch();
}

function selectChinese(id) {
  if (isMatched(id)) return;
  selectedChinese.value = id;
  checkMatch();
}

function checkMatch() {
  if (selectedEnglish.value && selectedChinese.value) {
    const englishId = selectedEnglish.value;
    const chineseId = selectedChinese.value;

    // 检查是否匹配正确
    if (englishId === chineseId) {
      // 正确匹配
      answers.value.push({
        wordId: englishId,
        selectedMeaningId: chineseId
      });

      // 清除选择
      selectedEnglish.value = null;
      selectedChinese.value = null;

      // 检查是否全部完成
      if (answers.value.length === totalQuestions.value) {
        // 全部完成，自动提交
        setTimeout(() => {
          autoSubmitAnswers();
        }, 300); // 延迟300ms让用户看到最后一个匹配
      }
    } else {
      // 错误匹配，显示红色提示
      wrongAttempts.value++;

      // 记录失败的单词ID
      failedWordIds.value.add(englishId);

      // 添加到错误列表
      wrongPairs.value.push({
        englishId,
        chineseId,
        timestamp: Date.now()
      });

      // 扣除3秒时间
      timeLeft.value = Math.max(0, timeLeft.value - 3);

      // 500ms后清除红色提示和选择
      setTimeout(() => {
        wrongPairs.value = wrongPairs.value.filter(
          pair => pair.englishId !== englishId || pair.chineseId !== chineseId
        );
        selectedEnglish.value = null;
        selectedChinese.value = null;
      }, 500);
    }
  }
}

function isMatched(id) {
  return answers.value.some(
    a => a.wordId === id || a.selectedMeaningId === id
  );
}

function isWrong(id, type) {
  return wrongPairs.value.some(pair => {
    if (type === 'english') {
      return pair.englishId === id;
    } else {
      return pair.chineseId === id;
    }
  });
}

async function autoSubmitAnswers() {
  stopTimer();

  try {
    const data = await api.post('/vocabulary-test/submit', {
      answers: answers.value,
      testDuration: timeUsed.value,
      failedWordIds: Array.from(failedWordIds.value) // 传递失败过的单词ID
    });

    correctCount.value = data.correctCount;
    accuracy.value = parseFloat(data.accuracy);
    quizFinished.value = true;
  } catch (error) {
    console.error('Submit error:', error);
    await showAlert('提交失败：' + (error.response?.data?.error || error.message), '错误');
  }
}

function restartQuiz() {
  quizStarted.value = false;
  quizFinished.value = false;
  answers.value = [];
  wrongPairs.value = [];
  failedWordIds.value = new Set(); // 清空失败记录
  selectedEnglish.value = null;
  selectedChinese.value = null;
  wrongAttempts.value = 0;
  timeoutFailure.value = false;
  generateQuiz();
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function goBack() {
  router.push('/vocabulary-book');
}
</script>

<style scoped>
.vocabulary-test-container {
  min-height: 100vh;
  padding: 20px;
  background: var(--bg-secondary);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header h1 {
  margin: 0;
  font-size: 28px;
  color: var(--text-primary);
}

.countdown-timer {
  font-size: 32px;
  font-weight: bold;
  color: #EDB01D;
  padding: 10px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 120px;
  text-align: center;
  transition: all 0.3s ease;
}

.countdown-timer.urgent {
  color: #E53935;
  animation: urgentPulse 1s ease-in-out infinite;
  box-shadow: 0 0 20px rgba(229, 57, 53, 0.3);
}

@keyframes urgentPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.btn-back {
  padding: 10px 20px;
  background: white;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
}

.btn-back:hover {
  background: var(--bg-secondary);
  border-color: var(--primary-color);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 0 10px;
}

.progress-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.error-count {
  font-size: 16px;
  font-weight: 600;
  color: #E53935;
  animation: shake 0.5s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.word-box {
  background: white;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  font-size: 16px;
  text-align: center;
}

.word-box:hover:not(.matched) {
  background: rgba(237, 176, 29, 0.05);
  border-color: var(--primary-color);
}

.word-box.selected {
  background: #EDB01D;
  color: #21232A;
  font-weight: 600;
  border-color: #EDB01D;
  transform: scale(1.03);
}

.word-box.matched {
  background: #4CAF50;
  color: white;
  cursor: not-allowed;
  opacity: 0.8;
}

.word-box.wrong {
  background: #E53935;
  color: white;
  border-color: #E53935;
  animation: wrongShake 0.5s ease;
}

@keyframes wrongShake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.result-value.excellent {
  color: #4CAF50;
}

.result-value.good {
  color: #EDB01D;
}

.start-screen,
.result-screen {
  max-width: 600px;
  margin: 60px auto;
  background: white;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.instructions h2 {
  color: var(--text-primary);
  margin-bottom: 20px;
}

.instructions p {
  color: var(--text-secondary);
  line-height: 1.8;
  margin: 12px 0;
  font-size: 16px;
}

.btn-start {
  width: 100%;
  padding: 16px;
  background: #EDB01D;
  color: #21232A;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 20px;
}

.btn-start:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 16px rgba(237, 176, 29, 0.3);
}

.result-screen h2 {
  font-size: 32px;
  margin-bottom: 30px;
  color: var(--text-primary);
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.result-item {
  background: var(--bg-secondary);
  padding: 20px;
  border-radius: 12px;
}

.result-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.result-value {
  font-size: 28px;
  font-weight: bold;
  color: var(--text-primary);
}

.result-actions {
  display: flex;
  gap: 15px;
}

.btn-retry,
.btn-finish {
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-retry {
  background: #EDB01D;
  color: #21232A;
  border: none;
}

.btn-finish {
  background: white;
  color: var(--text-primary);
  border: 2px solid var(--border-color);
}

.matching-area {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30px;
  margin: 30px 0;
}

.word-column h3 {
  font-size: 18px;
  margin-bottom: 15px;
  color: var(--text-primary);
  text-align: center;
}

@media (max-width: 768px) {
  .matching-area {
    grid-template-columns: 1fr;
  }

  .word-column h3 {
    font-size: 14px;
  }

  .word-box {
    font-size: 14px;
    padding: 12px;
  }

  .countdown-timer {
    font-size: 24px;
    padding: 8px 16px;
    min-width: 100px;
  }

  .result-stats {
    grid-template-columns: 1fr;
  }

  .result-actions {
    flex-direction: column;
  }
}
</style>

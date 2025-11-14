<template>
  <section class="quiz" v-if="!loading && !error">
    <div class="container">
      <div v-if="!quizStarted" class="quiz-intro card">
        <h2>{{ unitInfo?.unit_name || '单元测验' }}</h2>
        <p>本次测验将随机抽取 {{ questions.length }} 道题，包含选择题、填空题与听力题。</p>
        <div class="intro-actions">
          <button class="btn btn-primary" @click="startQuiz" :disabled="questions.length === 0">
            开始测验
          </button>
          <button class="btn btn-outline" @click="goBack">返回首页</button>
        </div>
      </div>

      <div v-else-if="!quizFinished" class="quiz-body card">
        <header class="quiz-header">
          <button class="btn-link" @click="confirmExit">← 退出测验</button>
          <h2>{{ unitInfo?.unit_name }} 测验</h2>
          <span class="quiz-progress">{{ currentQuestionIndex + 1 }} / {{ questions.length }}</span>
        </header>

        <div class="progress-indicator">
          <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
        </div>

        <component
          :is="currentQuestionComponent"
          :question="currentQuestion"
          :answer="userAnswers[currentQuestionIndex]"
          :show-feedback="showFeedback"
          @answer="handleAnswer"
        />

        <footer class="quiz-controls">
          <button
            class="btn btn-primary"
            :disabled="!showFeedback"
            @click="nextQuestion"
          >
            {{ isLastQuestion ? '查看结果' : '下一题' }} →
          </button>
        </footer>
      </div>

      <div v-else class="quiz-result card">
        <header class="result-header">
          <h2>测验完成！</h2>
          <div class="score-circle" :class="scoreClass">
            <span class="score-value">{{ score }}</span>
            <span class="score-label">分</span>
          </div>
        </header>

        <section class="result-stats">
          <div class="stat">
            <span class="stat-value">{{ correctCount }}</span>
            <span class="stat-label">答对</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ wrongCount }}</span>
            <span class="stat-label">答错</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ accuracy }}%</span>
            <span class="stat-label">正确率</span>
          </div>
        </section>

        <section class="result-review">
          <h3>答题回顾</h3>
          <div
            v-for="(question, index) in questions"
            :key="question.id"
            class="review-item"
            :class="{ correct: userAnswers[index] === question.correctAnswer }"
          >
            <div class="review-header">
              <span>第 {{ index + 1 }} 题 · {{ formatType(question.type) }}</span>
              <span class="review-status">
                <CheckCircle v-if="userAnswers[index] === question.correctAnswer" :size="16" style="display: inline-block; vertical-align: middle; margin-right: 4px;" />
                <XCircle v-else :size="16" style="display: inline-block; vertical-align: middle; margin-right: 4px;" />
                {{ userAnswers[index] === question.correctAnswer ? '正确' : '错误' }}
              </span>
            </div>
            <p class="review-question">{{ question.question }}</p>
            <p class="review-answer">
              你的回答：<strong>{{ userAnswers[index] || '未作答' }}</strong>
            </p>
            <p v-if="userAnswers[index] !== question.correctAnswer" class="review-correct">
              正确答案：<strong>{{ question.correctAnswer }}</strong>
            </p>
          </div>
        </section>

        <footer class="result-actions">
          <button class="btn btn-primary" @click="retakeQuiz">重新测验</button>
          <button class="btn btn-outline" @click="goBack">返回首页</button>
        </footer>
      </div>
    </div>
  </section>

  <section v-else class="container">
    <div class="state-card" v-if="loading">加载中...</div>
    <div class="state-card error" v-else>{{ error }}</div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { unitsAPI, quizAPI } from '@/api'
import { useProgressStore } from '@/stores/progress'
import QuizMultipleChoice from '@/components/QuizMultipleChoice.vue'
import QuizFillBlank from '@/components/QuizFillBlank.vue'
import QuizListening from '@/components/QuizListening.vue'
import { CheckCircle, XCircle } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const unitId = computed(() => route.params.unitId)
const unitInfo = ref(null)
const questions = ref([])
const loading = ref(true)
const error = ref('')
const quizStarted = ref(false)
const quizFinished = ref(false)
const currentQuestionIndex = ref(0)
const userAnswers = ref([])
const showFeedback = ref(false)
const progressStore = useProgressStore()

const questionComponentMap = {
  multiple: QuizMultipleChoice,
  fill: QuizFillBlank,
  listening: QuizListening
}

const currentQuestion = computed(() => questions.value[currentQuestionIndex.value])
const currentQuestionComponent = computed(
  () => questionComponentMap[currentQuestion.value?.type] || QuizMultipleChoice
)
const isLastQuestion = computed(() => currentQuestionIndex.value === questions.value.length - 1)
const progressPercentage = computed(() => {
  if (!questions.value.length) return 0
  return Math.round(((currentQuestionIndex.value + 1) / questions.value.length) * 100)
})
const correctCount = computed(() =>
  questions.value.reduce((acc, question, index) => {
    return acc + (userAnswers.value[index]?.toString().toLowerCase() === question.correctAnswer.toLowerCase() ? 1 : 0)
  }, 0)
)
const wrongCount = computed(() => questions.value.length - correctCount.value)
const accuracy = computed(() => (questions.value.length ? Math.round((correctCount.value / questions.value.length) * 100) : 0))
const score = computed(() => accuracy.value)
const scoreClass = computed(() => {
  if (score.value >= 90) return 'excellent'
  if (score.value >= 70) return 'good'
  if (score.value >= 60) return 'pass'
  return 'fail'
})

function formatType(type) {
  if (type === 'multiple') return '选择题'
  if (type === 'fill') return '填空题'
  if (type === 'listening') return '听力题'
  return '题目'
}

async function fetchQuiz() {
  loading.value = true
  error.value = ''
  quizStarted.value = false
  quizFinished.value = false
  currentQuestionIndex.value = 0
  userAnswers.value = []
  showFeedback.value = false

  try {
    const [unitData, quizData] = await Promise.all([
      unitsAPI.getById(unitId.value),
      quizAPI.generate({
        unitId: unitId.value,
        questionCount: 20,
        types: ['multiple', 'fill', 'listening']
      })
    ])

    unitInfo.value = unitData.data
    const payload = quizData.data || {}
    questions.value = payload.questions || []
    userAnswers.value = new Array(questions.value.length).fill(null)

    if (!questions.value.length) {
      error.value = '生成测验题目失败，请稍后再试'
    }
  } catch (err) {
    console.error(err)
    error.value = '加载测验数据失败，请稍后再试'
  } finally {
    loading.value = false
  }
}

function startQuiz() {
  quizStarted.value = true
}

function handleAnswer(answer) {
  userAnswers.value[currentQuestionIndex.value] = answer
  showFeedback.value = true
}

function nextQuestion() {
  if (!showFeedback.value) return
  if (isLastQuestion.value) {
    finishQuiz()
  } else {
    currentQuestionIndex.value += 1
    showFeedback.value = false
  }
}

function finishQuiz() {
  quizFinished.value = true
  showFeedback.value = false
  progressStore.saveQuizScore(unitId.value, score.value)
}

function retakeQuiz() {
  quizFinished.value = false
  quizStarted.value = false
  currentQuestionIndex.value = 0
  userAnswers.value = new Array(questions.value.length).fill(null)
  showFeedback.value = false
}

function confirmExit() {
  if (confirm('确定要退出当前测验吗？进度将不会保存。')) {
    goBack()
  }
}

function goBack() {
  router.push({ name: 'Home' })
}

onMounted(async () => {
  progressStore.loadFromStorage()
  await fetchQuiz()
})

watch(
  () => unitId.value,
  async () => {
    await fetchQuiz()
  }
)
</script>

<style scoped>
.quiz-intro,
.quiz-body,
.quiz-result {
  max-width: 880px;
  margin: 0 auto;
  padding: 2rem 2.5rem;
}

.quiz-intro h2 {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
}

.quiz-intro p {
  color: var(--text-secondary);
  margin-bottom: 1.25rem;
}

.intro-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.quiz-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.btn-link {
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.quiz-progress {
  font-weight: 600;
  color: var(--primary-color);
}

.progress-indicator {
  height: 6px;
  background: var(--border-color);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.progress-fill {
  height: 100%;
  background: #EDB01D;
}

.quiz-controls {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
}

.result-header {
  text-align: center;
  margin-bottom: 2rem;
}

.score-circle {
  width: 160px;
  height: 160px;
  margin: 0 auto;
  border-radius: 50%;
  border: 10px solid;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  transition: transform 0.2s ease;
}

.score-circle.excellent { border-color: var(--success-color); background: rgba(76, 175, 80, 0.1); }
.score-circle.good { border-color: var(--secondary-blue); background: rgba(43, 130, 172, 0.1); }
.score-circle.pass { border-color: var(--warning-color); background: rgba(255, 181, 71, 0.1); }
.score-circle.fail { border-color: var(--danger-color); background: rgba(229, 57, 53, 0.1); }

.score-value {
  font-size: 3rem;
  color: var(--text-primary);
}

.score-label {
  color: var(--text-secondary);
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.result-stats .stat {
  background: var(--bg-secondary);
  border-radius: 1rem;
  padding: 1.25rem;
  text-align: center;
}

.result-stats .stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--primary-color);
}

.result-review {
  margin-bottom: 2rem;
}

.review-item {
  border-left: 4px solid var(--danger-color);
  background: var(--bg-secondary);
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  margin-bottom: 1rem;
}

.review-item.correct {
  border-color: var(--success-color);
}

.review-header {
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.review-question {
  color: var(--text-primary);
  margin-bottom: 0.35rem;
}

.review-answer,
.review-correct {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.result-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.state-card {
  margin: 3rem auto;
  padding: 2rem;
  text-align: center;
  background: white;
  border-radius: 1rem;
  box-shadow: var(--shadow);
}

.state-card.error {
  color: var(--danger-color);
}

@media (max-width: 768px) {
  .quiz-container {
    padding: 1rem;
  }

  .quiz-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .quiz-info h2 {
    font-size: 1.25rem;
  }

  .quiz-meta {
    font-size: 0.85rem;
  }

  .quiz-controls {
    width: 100%;
    justify-content: stretch;
    gap: 0.5rem;
  }

  .quiz-controls .btn {
    flex: 1;
  }

  .quiz-content {
    padding: 1rem;
  }

  .progress-bar {
    margin-bottom: 1.5rem;
  }

  .result-header h2 {
    font-size: 1.5rem;
  }

  .result-message {
    font-size: 1rem;
  }

  .score-circle {
    width: 140px;
    height: 140px;
    margin: 1.5rem auto;
  }

  .score-value {
    font-size: 2.5rem;
  }

  .result-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .result-stats .stat {
    padding: 1rem;
  }

  .result-stats .stat-value {
    font-size: 1.5rem;
  }

  .result-actions {
    flex-direction: column;
    gap: 0.75rem;
  }

  .result-actions .btn {
    width: 100%;
  }

  .review-item {
    padding: 0.85rem 1rem;
  }

  .state-card {
    margin: 2rem auto;
    padding: 1.5rem;
  }
}

/* 超小屏幕 */
@media (max-width: 375px) {
  .quiz-container {
    padding: 0.75rem;
  }

  .quiz-info h2 {
    font-size: 1.1rem;
  }

  .score-circle {
    width: 120px;
    height: 120px;
  }

  .score-value {
    font-size: 2rem;
  }

  .result-stats {
    grid-template-columns: 1fr;
  }
}
</style>
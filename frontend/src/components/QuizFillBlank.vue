<template>
  <div class="quiz-question card">
    <div class="question-type-badge fill">填空题</div>
    
    <div class="question-text">
      <h3>{{ question.question }}</h3>
      <p class="hint">{{ question.placeholder || '请输入英文单词' }}</p>
    </div>

    <div class="input-container">
      <input
        v-model="userInput"
        type="text"
        class="answer-input"
        :class="{
          correct: showFeedback && isCorrect,
          wrong: showFeedback && !isCorrect
        }"
        :placeholder="question.placeholder || '请输入英文单词'"
        :disabled="showFeedback"
        @keyup.enter="submitAnswer"
      />
      <button
        v-if="!showFeedback"
        @click="submitAnswer"
        class="btn btn-primary"
        :disabled="!userInput.trim()"
      >
        提交
      </button>
    </div>

    <div v-if="showFeedback" class="feedback" :class="isCorrect ? 'correct' : 'wrong'">
      <CheckCircle v-if="isCorrect" :size="24" class="feedback-icon" />
      <XCircle v-else :size="24" class="feedback-icon" />
      <span class="feedback-text">
        {{ isCorrect ? '回答正确！' : `正确答案是：${question.correctAnswer}` }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { CheckCircle, XCircle } from 'lucide-vue-next'

const props = defineProps({
  question: {
    type: Object,
    required: true
  },
  answer: {
    type: String,
    default: null
  },
  showFeedback: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['answer'])

const userInput = ref(props.answer || '')

const isCorrect = computed(() => {
  return userInput.value.trim().toLowerCase() === props.question.correctAnswer.toLowerCase()
})

const submitAnswer = () => {
  if (!userInput.value.trim() || props.showFeedback) return
  emit('answer', userInput.value.trim())
}

watch(() => props.answer, (newVal) => {
  if (newVal) {
    userInput.value = newVal
  }
})
</script>

<style scoped>
.quiz-question {
  max-width: 700px;
  margin: 0 auto;
  padding: 2rem;
}

.question-type-badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  background-color: var(--warning-color);
  color: white;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
}

.question-text {
  margin-bottom: 2rem;
}

.question-text h3 {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.hint {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.input-container {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.answer-input {
  flex: 1;
  padding: 0.875rem 1rem;
  font-size: 1.125rem;
  border: 2px solid var(--border-color);
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.answer-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.answer-input:disabled {
  background-color: var(--bg-secondary);
  cursor: not-allowed;
}

.answer-input.correct {
  border-color: var(--success-color);
  background-color: rgba(76, 175, 80, 0.05);
}

.answer-input.wrong {
  border-color: var(--danger-color);
  background-color: rgba(229, 57, 53, 0.05);
}

.feedback {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
}

.feedback.correct {
  background-color: rgba(76, 175, 80, 0.1);
  color: var(--success-color);
}

.feedback.wrong {
  background-color: rgba(229, 57, 53, 0.1);
  color: var(--danger-color);
}

.feedback-icon {
  color: inherit;
}

.feedback-text {
  font-size: 1rem;
}

@media (max-width: 768px) {
  .quiz-question {
    padding: 1rem;
  }

  .question-text h3 {
    font-size: 1.15rem;
  }

  .input-container {
    flex-direction: column;
  }

  .input-container .btn {
    width: 100%;
  }

  .answer-input {
    padding: 0.7rem 0.9rem;
    font-size: 0.95rem;
  }

  .feedback {
    padding: 0.85rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 375px) {
  .quiz-question {
    padding: 0.75rem;
  }

  .question-text h3 {
    font-size: 1.05rem;
  }
}
</style>

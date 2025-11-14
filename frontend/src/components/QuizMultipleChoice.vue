<template>
  <div class="quiz-question card">
    <div class="question-type-badge">选择题</div>
    
    <div class="question-text">
      <h3>{{ question.question }}</h3>
      <p class="hint">请选择对应的英文单词</p>
    </div>

    <div class="options">
      <button
        v-for="(option, index) in question.options"
        :key="index"
        @click="selectOption(option)"
        class="option-btn"
        :class="{
          selected: selectedOption === option,
          correct: showFeedback && option === question.correctAnswer,
          wrong: showFeedback && selectedOption === option && option !== question.correctAnswer
        }"
        :disabled="showFeedback"
      >
        <span class="option-letter">{{ String.fromCharCode(65 + index) }}</span>
        <span class="option-text">{{ option }}</span>
        <span v-if="showFeedback && option === question.correctAnswer" class="option-icon">✓</span>
        <span v-else-if="showFeedback && selectedOption === option && option !== question.correctAnswer" class="option-icon">✗</span>
      </button>
    </div>

    <div v-if="showFeedback" class="feedback" :class="isCorrect ? 'correct' : 'wrong'">
      <span class="feedback-icon">{{ isCorrect ? '✓' : '✗' }}</span>
      <span class="feedback-text">
        {{ isCorrect ? '回答正确！' : `正确答案是：${question.correctAnswer}` }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

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

const selectedOption = ref(props.answer)

const isCorrect = computed(() => {
  return selectedOption.value === props.question.correctAnswer
})

const selectOption = (option) => {
  if (props.showFeedback) return
  selectedOption.value = option
  emit('answer', option)
}

watch(() => props.answer, (newVal) => {
  selectedOption.value = newVal
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
  background: var(--gradient-main);
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

.options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.option-btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background-color: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  font-size: 1rem;
}

.option-btn:hover:not(:disabled) {
  border-color: var(--primary-color);
  transform: translateX(4px);
}

.option-btn:disabled {
  cursor: not-allowed;
}

.option-btn.selected {
  background: linear-gradient(135deg, #C8B5E8 0%, #8AC9D8 60%, #7FE8D8 100%);
  border-color: transparent;
  color: white;
}

.option-btn.correct {
  background-color: var(--success-color);
  border-color: var(--success-color);
  color: white;
}

.option-btn.wrong {
  background-color: var(--danger-color);
  border-color: var(--danger-color);
  color: white;
}

.option-letter {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.1);
  font-weight: 600;
  flex-shrink: 0;
}

.option-btn.selected .option-letter,
.option-btn.correct .option-letter,
.option-btn.wrong .option-letter {
  background-color: rgba(255, 255, 255, 0.3);
}

.option-text {
  flex: 1;
  font-size: 1.125rem;
}

.option-icon {
  font-size: 1.5rem;
  margin-left: auto;
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
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--danger-color);
}

.feedback-icon {
  font-size: 1.5rem;
}

.feedback-text {
  font-size: 1rem;
}

@media (max-width: 768px) {
  .quiz-question {
    padding: 1rem;
  }

  .question-type-badge {
    font-size: 0.8rem;
    padding: 0.3rem 0.65rem;
  }

  .question-text h3 {
    font-size: 1.15rem;
  }

  .hint {
    font-size: 0.8rem;
  }

  .option-btn {
    padding: 0.85rem 1rem;
  }

  .option-label {
    font-size: 1rem;
    min-width: 28px;
    height: 28px;
  }

  .option-text {
    font-size: 0.95rem;
  }

  .feedback {
    padding: 0.85rem;
    font-size: 0.9rem;
  }

  .feedback-icon {
    font-size: 1.25rem;
  }
}

@media (max-width: 375px) {
  .quiz-question {
    padding: 0.75rem;
  }

  .question-text h3 {
    font-size: 1.05rem;
  }

  .option-btn {
    padding: 0.75rem 0.85rem;
  }
}
</style>

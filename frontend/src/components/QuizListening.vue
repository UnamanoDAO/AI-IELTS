<template>
  <div class="quiz-question card">
    <div class="question-type-badge listening">听力题</div>
    
    <div class="question-text">
      <h3>{{ question.question }}</h3>
      <p class="hint">点击播放按钮听音频，然后选择正确的单词</p>
    </div>

    <div class="audio-player">
      <button @click="playAudio" class="btn-play" :disabled="isPlaying">
        <Volume2 :size="24" class="play-icon" />
        <span>{{ isPlaying ? '播放中...' : '播放音频' }}</span>
      </button>
      <audio ref="audioRef" :src="question.audioUrl" @ended="isPlaying = false"></audio>
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
        <CheckCircle v-if="showFeedback && option === question.correctAnswer" :size="20" class="option-icon" />
        <XCircle v-else-if="showFeedback && selectedOption === option && option !== question.correctAnswer" :size="20" class="option-icon" />
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
import { ref, computed, watch, onMounted } from 'vue'
import { Volume2, CheckCircle, XCircle } from 'lucide-vue-next'

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

const audioRef = ref(null)
const isPlaying = ref(false)
const selectedOption = ref(props.answer)

const isCorrect = computed(() => {
  return selectedOption.value === props.question.correctAnswer
})

const playAudio = async () => {
  if (!audioRef.value || isPlaying.value) return

  try {
    isPlaying.value = true
    audioRef.value.currentTime = 0
    await audioRef.value.play()
  } catch (error) {
    console.error('Audio playback failed:', error)
    isPlaying.value = false
  }
}

const selectOption = (option) => {
  if (props.showFeedback) return
  selectedOption.value = option
  emit('answer', option)
}

watch(() => props.answer, (newVal) => {
  selectedOption.value = newVal
})

// Auto-play audio when question loads
onMounted(() => {
  setTimeout(() => {
    playAudio()
  }, 500)
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
  background-color: #8b5cf6;
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

.audio-player {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.btn-play {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 500;
  background: var(--gradient-button);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-play:hover:not(:disabled) {
  filter: brightness(1.05);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(138, 201, 216, 0.2);
}

.btn-play:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.play-icon {
  color: inherit;
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
  background: var(--gradient-button);
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
  margin-left: auto;
  color: inherit;
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

  .btn-play {
    padding: 0.75rem 1.5rem;
    font-size: 0.95rem;
  }

  .option-btn {
    padding: 0.85rem 1rem;
  }

  .option-text {
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

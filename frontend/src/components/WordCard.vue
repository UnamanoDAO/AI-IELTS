<template>
  <div class="word-card card">
    <div class="word-header">
      <h1 class="word-text">{{ word.word }}</h1>
      <button
        @click="$emit('toggle-learned', word.id)"
        class="btn-learned"
        :class="{ learned: isLearned }"
      >
        {{ isLearned ? '已学会' : '学会了' }}
      </button>
    </div>

    <div class="word-phonetic" v-if="showPhoneticSection">
      <span class="phonetic-text">
        <template v-if="word.phonetic">
          {{ word.phonetic }}
        </template>
        <template v-else-if="word.__loadingDetails">
          音标加载中...
        </template>
        <template v-else-if="word.__detailsError">
          暂无法获取音标
        </template>
        <template v-else>
          音标待补充
        </template>
      </span>
      <button
        v-if="word.audio_url || word.__loadingDetails"
        @click="playAudio"
        class="btn-audio"
        :disabled="isPlaying || !word.audio_url"
      >
        <Volume2 :size="20" />
      </button>
    </div>

    <div class="word-pos" v-if="word.part_of_speech && word.part_of_speech !== '-'">
      <span class="pos-tag">{{ word.part_of_speech }}</span>
    </div>

    <div class="word-meaning">
      <h3>中文释义</h3>
      <p>{{ word.chinese_meaning }}</p>
    </div>

    <div class="word-root" v-if="showWordRoot">
      <h3>词根拆解</h3>
      <p>{{ wordRootText }}</p>
    </div>

    <div class="word-example" v-if="word.example_sentence && word.example_sentence !== '-'">
      <h3>例句</h3>
      <p class="example-en">
        {{ word.example_sentence }}
        <button
          v-if="word.example_audio_url"
          @click="playExampleAudio"
          class="btn-audio-example"
          :disabled="isExamplePlaying"
        >
          <Volume2 :size="16" />
        </button>
      </p>
      <p class="example-zh" v-if="word.example_translation && word.example_translation !== '-'">
        {{ word.example_translation }}
      </p>
    </div>

    <div class="word-memory" v-if="showMemoryTip">
      <h3><Lightbulb :size="18" style="display: inline-block; vertical-align: middle; margin-right: 4px;" /> 记忆方法</h3>
      <p class="memory-tip">{{ memoryTipText }}</p>
    </div>

    <audio ref="audioRef" :src="word.audio_url" @ended="isPlaying = false"></audio>
    <audio
      v-if="word.example_audio_url"
      ref="exampleAudioRef"
      :src="word.example_audio_url"
      @ended="isExamplePlaying = false"
    ></audio>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Volume2, Lightbulb } from 'lucide-vue-next'

const props = defineProps({
  word: {
    type: Object,
    required: true
  },
  isLearned: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggle-learned'])

const audioRef = ref(null)
const isPlaying = ref(false)
const exampleAudioRef = ref(null)
const isExamplePlaying = ref(false)

const showPhoneticSection = computed(() => {
  const current = props.word || {}
  return Boolean(
    current.phonetic ||
      current.audio_url ||
      current.__loadingDetails ||
      current.__detailsError
  )
})

const showWordRoot = computed(() => {
  const current = props.word || {}
  return Boolean(
    (current.word_root && current.word_root !== '-') ||
      current.__loadingDetails ||
      current.__detailsError
  )
})

const showMemoryTip = computed(() => {
  const current = props.word || {}
  return Boolean(current.memory_tip || current.__loadingDetails || current.__detailsError)
})

const wordRootText = computed(() => {
  const current = props.word || {}
  if (current.word_root && current.word_root !== '-') {
    return current.word_root
  }
  if (current.__loadingDetails) {
    return '词根拆解加载中...'
  }
  if (current.__detailsError) {
    return '词根信息获取失败，请稍后重试'
  }
  return '词源信息待补充'
})

const memoryTipText = computed(() => {
  const current = props.word || {}
  if (current.memory_tip) {
    return current.memory_tip
  }
  if (current.__loadingDetails) {
    return '记忆方法加载中...'
  }
  if (current.__detailsError) {
    return '暂无法获取记忆方法，请稍后重试'
  }
  return '记忆方法：结合实际语境反复复习，加深印象。'
})

const playAudio = async () => {
  if (!audioRef.value || !props.word?.audio_url) return

  try {
    isPlaying.value = true
    audioRef.value.currentTime = 0
    await audioRef.value.play()
  } catch (error) {
    console.error('Audio playback failed:', error)
    isPlaying.value = false
  }
}

const playExampleAudio = async () => {
  if (!exampleAudioRef.value || !props.word?.example_audio_url) return

  try {
    isExamplePlaying.value = true
    exampleAudioRef.value.currentTime = 0
    await exampleAudioRef.value.play()
  } catch (error) {
    console.error('Example audio playback failed:', error)
    isExamplePlaying.value = false
  }
}
</script>

<style scoped>
.word-card {
  max-width: 800px;
  margin: 0 auto;
  padding: 2.5rem;
}

.word-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.word-text {
  font-size: 3rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.btn-learned {
  padding: 0.5rem 1rem;
  border-radius: 1.5rem;
  border: 2px solid var(--primary-color);
  background-color: white;
  color: var(--primary-color);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  flex-shrink: 0;
  white-space: nowrap;
}

.btn-learned:hover {
  background-color: var(--primary-color);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(237, 176, 29, 0.3);
}

.btn-learned.learned {
  background-color: var(--success-color);
  border-color: var(--success-color);
  color: white;
}

.btn-learned.learned:hover {
  background-color: #3E8E41;
  border-color: #3E8E41;
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
}

.word-phonetic {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.phonetic-text {
  font-size: 1.25rem;
  color: var(--text-secondary);
  font-family: 'Courier New', monospace;
}

.btn-audio {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: #EDB01D;
  color: #21232A;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
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

.btn-audio:hover:not(:disabled) {
  transform: scale(1.1);
  box-shadow: 0 4px 16px rgba(237, 176, 29, 0.3);
}

.btn-audio:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.word-pos {
  margin-bottom: 1.5rem;
}

.pos-tag {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background-color: var(--warning-color);
  color: white;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.word-meaning,
.word-root,
.word-example,
.word-memory {
  margin-bottom: 2rem;
}

.word-meaning h3,
.word-root h3,
.word-example h3,
.word-memory h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.word-meaning p {
  font-size: 1.5rem;
  color: var(--text-primary);
  line-height: 1.6;
}

.word-root p {
  font-size: 1.125rem;
  color: var(--text-primary);
  line-height: 1.6;
  padding: 1rem;
  background-color: var(--bg-secondary);
  border-radius: 0.5rem;
}

.example-en {
  font-size: 1.125rem;
  color: var(--text-primary);
  line-height: 1.8;
  margin-bottom: 0.75rem;
  font-style: italic;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-audio-example {
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-audio-example:hover:not(:disabled) {
  background-color: var(--accent-dark);
}

.btn-audio-example:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.example-zh {
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.memory-tip {
  font-size: 1rem;
  color: var(--primary-color);
  line-height: 1.8;
  padding: 1rem;
  background: rgba(200, 181, 232, 0.05);
  border-left: 4px solid var(--primary-color);
  border-radius: 0.5rem;
}

@media (max-width: 768px) {
  .word-card {
    padding: 1rem;
  }

  .word-header {
    margin-bottom: 1rem;
  }

  .word-text {
    font-size: 1.75rem;
    line-height: 1.2;
  }

  .btn-learned {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }

  .word-phonetic {
    margin-bottom: 1rem;
  }

  .phonetic-text {
    font-size: 1rem;
  }

  .btn-audio {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }

  .word-pos {
    margin-bottom: 1rem;
  }

  .pos-tag {
    font-size: 0.75rem;
    padding: 0.2rem 0.6rem;
  }

  .word-meaning,
  .word-root,
  .word-example,
  .word-memory {
    margin-bottom: 1.25rem;
  }

  .word-meaning h3,
  .word-root h3,
  .word-example h3,
  .word-memory h3 {
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
  }

  .word-meaning p {
    font-size: 1.15rem;
    line-height: 1.5;
  }

  .word-root p {
    font-size: 0.95rem;
    padding: 0.75rem;
    line-height: 1.5;
  }

  .example-en {
    font-size: 0.95rem;
    line-height: 1.6;
  }

  .example-zh {
    font-size: 0.85rem;
  }

  .memory-tip {
    font-size: 0.9rem;
    padding: 0.75rem;
    line-height: 1.6;
  }

  .btn-audio-example {
    width: 24px;
    height: 24px;
    font-size: 0.75rem;
  }
}
</style>

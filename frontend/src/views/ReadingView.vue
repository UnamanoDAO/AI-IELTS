<template>
  <div class="reading-page">
    <div class="container">
      <div v-if="loading" class="loading">加载中...</div>

      <div v-else-if="article" class="reading-container">
        <div class="article-header">
          <button @click="goBack" class="btn-back">← 返回</button>
          <div class="header-info">
            <h1>{{ article.title }}</h1>
            <div class="meta">
              <span class="difficulty-badge" :class="article.difficulty">
                {{ difficultyLabel(article.difficulty) }}
              </span>
              <span class="word-count">{{ article.word_count }} 词</span>
            </div>
          </div>
        </div>

        <div class="reading-content">
          <div
            class="text-content"
            @mouseup="handleTextSelect"
            @touchend="handleTextSelect"
          >
            <span
              v-for="(word, index) in words"
              :key="index"
              :class="getWordClass(word)"
              @click="handleWordClick(word, $event)"
            >{{ word.text }}</span>
          </div>
        </div>

        <!-- Word Translation Popup -->
        <transition name="popup">
          <div
            v-if="selectedWord"
            class="word-popup"
            :style="popupStyle"
            @click.stop
          >
            <div class="popup-content">
              <div class="popup-header">
                <h3>{{ selectedWord.word }}</h3>
                <button @click="closePopup" class="btn-close">×</button>
              </div>

              <div v-if="translating" class="popup-loading">
                翻译中...
              </div>

              <div v-else-if="translation" class="popup-body">
                <div v-if="translation.phonetic" class="phonetic-row">
                  <span v-if="translation.ukPhone" class="phonetic">
                    UK [{{ translation.ukPhone }}]
                  </span>
                  <span v-if="translation.usPhone" class="phonetic">
                    US [{{ translation.usPhone }}]
                  </span>
                  <span v-if="!translation.ukPhone && !translation.usPhone && translation.phonetic" class="phonetic">
                    [{{ translation.phonetic }}]
                  </span>
                </div>

                <!-- Display all word types and meanings -->
                <div v-if="translation.translations && translation.translations.length > 0" class="translations-list">
                  <div
                    v-for="(group, index) in translation.translations"
                    :key="index"
                    class="translation-group"
                  >
                    <div class="translation-item">
                      <span v-if="group.type" class="word-type">{{ group.type }}</span>
                      <span class="meanings">
                        {{ group.meanings.join('；') }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Fallback for simple translation -->
                <div v-else-if="translation.translation" class="translation">
                  <span v-if="translation.word_type" class="word-type">
                    {{ translation.word_type }}
                  </span>
                  {{ translation.translation }}
                </div>

                <div v-if="selectedWord.sentence" class="context">
                  <div class="context-label">上下文:</div>
                  <div class="context-text">{{ selectedWord.sentence }}</div>
                </div>
              </div>

              <div class="popup-actions">
                <button
                  v-if="!wordInVocabulary"
                  @click="addToVocabulary"
                  class="btn-add"
                  :disabled="adding"
                >
                  {{ adding ? '添加中...' : '➕ 加入单词本' }}
                </button>
                <button v-else class="btn-added" disabled>
                  ✓ 已在单词本
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { articlesAPI } from '../api';
import api from '../api';

const route = useRoute();
const router = useRouter();

const article = ref(null);
const loading = ref(false);
const selectedWord = ref(null);
const translation = ref(null);
const translating = ref(false);
const adding = ref(false);
const popupPosition = ref({ x: 0, y: 0 });
const vocabularyWords = ref(new Set()); // Track words in vocabulary book

const words = computed(() => {
  if (!article.value) return [];

  // Split content into words and preserve punctuation
  const text = article.value.content;
  const tokens = [];
  let currentWord = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (/[a-zA-Z]/.test(char)) {
      currentWord += char;
    } else {
      if (currentWord) {
        tokens.push({ text: currentWord, type: 'word' });
        currentWord = '';
      }
      if (char.trim()) {
        tokens.push({ text: char, type: 'punctuation' });
      } else {
        tokens.push({ text: char, type: 'space' });
      }
    }
  }

  if (currentWord) {
    tokens.push({ text: currentWord, type: 'word' });
  }

  return tokens;
});

const wordInVocabulary = computed(() => {
  if (!selectedWord.value || !translation.value) return false;
  return vocabularyWords.value.has(translation.value.word);
});

const popupStyle = computed(() => {
  return {
    left: `${popupPosition.value.x}px`,
    top: `${popupPosition.value.y}px`
  };
});

const difficultyLabel = (level) => {
  const labels = {
    beginner: '初级',
    intermediate: '中级',
    advanced: '高级'
  };
  return labels[level] || level;
};

const getWordClass = (wordObj) => {
  const classes = [];

  if (wordObj.type === 'word') {
    classes.push('clickable-word');

    // Check if word is in vocabulary
    if (vocabularyWords.value.has(wordObj.text.toLowerCase())) {
      classes.push('in-vocabulary');
    }
  } else if (wordObj.type === 'space') {
    classes.push('word-space');
  } else {
    classes.push('word-punctuation');
  }

  return classes.join(' ');
};

const fetchArticle = async () => {
  loading.value = true;
  try {
    article.value = await articlesAPI.getById(route.params.id);
  } catch (error) {
    console.error('Failed to fetch article:', error);
    alert('加载文章失败');
    router.push('/reading-comprehension');
  } finally {
    loading.value = false;
  }
};

const handleWordClick = async (wordObj, event) => {
  if (wordObj.type !== 'word') return;

  event.stopPropagation();

  const word = wordObj.text.toLowerCase().trim();

  // Get sentence context (50 chars before and after)
  const fullText = article.value.content;
  const wordIndex = fullText.toLowerCase().indexOf(word);
  const start = Math.max(0, wordIndex - 50);
  const end = Math.min(fullText.length, wordIndex + word.length + 50);
  const sentence = fullText.slice(start, end).trim();

  selectedWord.value = { word, sentence };

  // Position popup near click with boundary checking
  const rect = event.target.getBoundingClientRect();
  const popupWidth = 340; // Popup width including padding
  const popupMaxHeight = 400; // Estimated max height
  const margin = 10; // Margin from edges

  let x = rect.left;
  let y = rect.bottom + margin;

  // Check right boundary
  if (x + popupWidth > window.innerWidth - margin) {
    x = window.innerWidth - popupWidth - margin;
  }

  // Check left boundary
  if (x < margin) {
    x = margin;
  }

  // Check bottom boundary
  if (y + popupMaxHeight > window.innerHeight - margin) {
    // Show above the word instead
    y = rect.top - margin;
  }

  // Check top boundary (if showing above)
  if (y < margin) {
    y = margin;
  }

  popupPosition.value = { x, y };

  // Fetch translation
  await fetchTranslation(word, sentence);
};

const handleTextSelect = () => {
  // Optional: handle text selection for mobile
};

const fetchTranslation = async (word, sentence) => {
  translating.value = true;
  translation.value = null;

  try {
    translation.value = await articlesAPI.translateWord(
      route.params.id,
      word,
      sentence
    );
  } catch (error) {
    console.error('Failed to translate word:', error);
    translation.value = {
      word,
      translation: '翻译失败',
      phonetic: '',
      word_type: ''
    };
  } finally {
    translating.value = false;
  }
};

const addToVocabulary = async () => {
  if (!translation.value) return;

  adding.value = true;
  try {
    // Use existing vocabulary-book API
    await api.post('/vocabulary-book', {
      word: translation.value.word
    });

    // Add to local set
    vocabularyWords.value.add(translation.value.word);

    // No alert, just visual feedback (button changes to "已在单词本")
  } catch (error) {
    if (error.response?.status === 409) {
      // Word already exists, just update local state
      vocabularyWords.value.add(translation.value.word);
    } else {
      // Only show alert for actual errors
      console.error('Failed to add word:', error);
    }
  } finally {
    adding.value = false;
  }
};

const closePopup = () => {
  selectedWord.value = null;
  translation.value = null;
};

const goBack = () => {
  router.push('/reading-comprehension');
};

// Close popup when clicking outside
const handleClickOutside = (event) => {
  if (selectedWord.value && !event.target.closest('.word-popup')) {
    closePopup();
  }
};

onMounted(async () => {
  await fetchArticle();
  // Load user's vocabulary words
  try {
    const response = await api.get('/vocabulary-book');
    if (response.words) {
      vocabularyWords.value = new Set(
        response.words.map(w => w.word.toLowerCase())
      );
    }
  } catch (error) {
    console.error('Failed to load vocabulary:', error);
  }
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.reading-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 2rem 1rem;
}

.container {
  max-width: 900px;
  margin: 0 auto;
}

.loading {
  text-align: center;
  padding: 4rem;
  font-size: 1.2rem;
  color: #666;
}

.reading-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.article-header {
  padding: 2rem;
  background: linear-gradient(135deg, #EDB01D 0%, #d99b0f 100%);
  color: #21232A;
}

.btn-back {
  background: rgba(33, 35, 42, 0.1);
  color: #21232A;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  margin-bottom: 1rem;
  transition: background 0.2s;
  font-weight: 500;
}

.btn-back:hover {
  background: rgba(33, 35, 42, 0.15);
}

.header-info h1 {
  margin: 0 0 0.5rem 0;
  font-size: 1.8rem;
}

.meta {
  display: flex;
  gap: 1rem;
  align-items: center;
  font-size: 0.9rem;
}

.difficulty-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  background: rgba(33, 35, 42, 0.1);
  color: #21232A;
}

.reading-content {
  padding: 2.5rem;
}

.text-content {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #333;
  text-align: justify;
}

.clickable-word {
  cursor: pointer;
  transition: all 0.2s;
  padding: 0.1rem 0.15rem;
  border-radius: 3px;
}

.clickable-word:hover {
  background: #fff3cd;
  color: #856404;
}

.clickable-word.in-vocabulary {
  background: #d4edda;
  color: #155724;
  font-weight: 500;
}

.word-space {
  white-space: pre;
}

.word-punctuation {
  color: #333;
}

.word-popup {
  position: fixed;
  width: 320px;
  max-width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  transform-origin: top left;
}

.popup-content {
  padding: 1rem;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.popup-header h3 {
  margin: 0;
  font-size: 1.3rem;
  color: #EDB01D;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  line-height: 1;
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
}

.popup-loading {
  padding: 1rem;
  text-align: center;
  color: #666;
}

.popup-body {
  margin-bottom: 1rem;
}

.phonetic-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.phonetic {
  color: #666;
  font-style: italic;
  font-size: 0.9rem;
}

.translations-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.translation-group {
  border-left: 3px solid #EDB01D;
  padding-left: 0.75rem;
}

.translation-item {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  line-height: 1.6;
}

.word-type {
  color: #EDB01D;
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
  min-width: 35px;
}

.meanings {
  color: #333;
  font-size: 1rem;
  flex: 1;
}

.translation {
  font-size: 1.05rem;
  color: #333;
  margin-bottom: 1rem;
  line-height: 1.6;
}

.context {
  background: #f8f9fa;
  padding: 0.75rem;
  border-radius: 8px;
  margin-top: 1rem;
  font-size: 0.9rem;
}

.context-label {
  color: #666;
  font-weight: 600;
  margin-bottom: 0.25rem;
  font-size: 0.85rem;
}

.context-text {
  color: #555;
  line-height: 1.6;
}

.popup-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-add,
.btn-added {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add {
  background: #EDB01D;
  color: #21232A;
}

.btn-add:hover:not(:disabled) {
  background: #d99b0f;
  transform: translateY(-1px);
}

.btn-add:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-added {
  background: #d4edda;
  color: #155724;
  cursor: default;
  position: relative;
  font-weight: 600;
}

.btn-added::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 8px;
  padding: 2px;
  background: linear-gradient(135deg, #28a745, #20c997);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: borderPulse 2s ease-in-out;
}

@keyframes borderPulse {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}

.popup-enter-active,
.popup-leave-active {
  transition: all 0.2s ease;
}

.popup-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

.popup-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}

@media (max-width: 768px) {
  .reading-content {
    padding: 1.5rem;
  }

  .text-content {
    font-size: 1rem;
  }

  .word-popup {
    position: fixed !important;
    left: 50% !important;
    top: 50% !important;
    transform: translate(-50%, -50%) !important;
  }
}
</style>

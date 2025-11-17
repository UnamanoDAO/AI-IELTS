import { defineStore } from 'pinia';
import { vocabularyAPI } from '../api';

export const useVocabularyStore = defineStore('vocabulary', {
  state: () => ({
    words: [],
    stats: {
      total: 0,
      new_words: 0,
      learning: 0,
      familiar: 0,
      mastered: 0
    },
    loading: false,
    error: null
  }),

  getters: {
    // Get words by mastery level
    wordsByLevel: (state) => (level) => {
      return state.words.filter(word => word.mastery_level === level);
    },

    // Get words from a specific article
    wordsByArticle: (state) => (articleId) => {
      return state.words.filter(word => word.article_id === articleId);
    },

    // Check if a word exists in vocabulary
    hasWord: (state) => (word) => {
      const normalizedWord = word.toLowerCase().trim();
      return state.words.some(w => w.word === normalizedWord);
    },

    // Get learning progress percentage
    learningProgress: (state) => {
      if (state.stats.total === 0) return 0;
      const learned = state.stats.familiar + state.stats.mastered;
      return Math.round((learned / state.stats.total) * 100);
    }
  },

  actions: {
    // Fetch all vocabulary words
    async fetchVocabulary(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        this.words = await vocabularyAPI.getAll(params);
      } catch (error) {
        this.error = error.message;
        console.error('Failed to fetch vocabulary:', error);
      } finally {
        this.loading = false;
      }
    },

    // Fetch vocabulary statistics
    async fetchStats() {
      try {
        this.stats = await vocabularyAPI.getStats();
      } catch (error) {
        console.error('Failed to fetch vocabulary stats:', error);
      }
    },

    // Add a word to vocabulary
    async addWord(wordData) {
      try {
        const newWord = await vocabularyAPI.add(wordData);
        this.words.unshift(newWord);
        await this.fetchStats(); // Update stats
        return newWord;
      } catch (error) {
        if (error.response?.status === 409) {
          throw new Error('单词已在单词本中');
        }
        throw new Error('添加单词失败');
      }
    },

    // Update word mastery level
    async updateWord(id, data) {
      try {
        const updated = await vocabularyAPI.update(id, data);
        const index = this.words.findIndex(w => w.id === id);
        if (index !== -1) {
          this.words[index] = updated;
        }
        await this.fetchStats(); // Update stats
        return updated;
      } catch (error) {
        throw new Error('更新单词失败');
      }
    },

    // Remove word from vocabulary
    async deleteWord(id) {
      try {
        await vocabularyAPI.delete(id);
        this.words = this.words.filter(w => w.id !== id);
        await this.fetchStats(); // Update stats
      } catch (error) {
        throw new Error('删除单词失败');
      }
    },

    // Mark word as reviewed
    async reviewWord(id) {
      try {
        const updated = await vocabularyAPI.review(id);
        const index = this.words.findIndex(w => w.id === id);
        if (index !== -1) {
          this.words[index] = updated;
        }
        return updated;
      } catch (error) {
        throw new Error('复习记录失败');
      }
    },

    // Check if word exists (API call for accuracy)
    async checkWord(word) {
      try {
        const result = await vocabularyAPI.check(word);
        return result.exists;
      } catch (error) {
        console.error('Failed to check word:', error);
        return false;
      }
    }
  }
});

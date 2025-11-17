/**
 * Aliyun Translation Service
 * Uses Aliyun Machine Translation API to translate English words to Chinese
 */

import Core from '@alicloud/pop-core';
import axios from 'axios';

class AliyunTranslator {
  constructor() {
    // Only initialize Aliyun client if credentials are available
    if (process.env.ALIYUN_ACCESS_KEY_ID && process.env.ALIYUN_ACCESS_KEY_SECRET) {
      this.client = new Core({
        accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
        accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
        endpoint: 'https://mt.cn-hangzhou.aliyuncs.com',
        apiVersion: '2018-10-12'
      });
      console.log('✓ Aliyun Translation client initialized');
    } else {
      console.warn('⚠️ Aliyun credentials not found, will use Youdao API only');
      this.client = null;
    }
  }

  /**
   * Translate English text to Chinese
   * @param {string} text - English text to translate
   * @param {string} sourceLanguage - Source language code (default: 'en')
   * @param {string} targetLanguage - Target language code (default: 'zh')
   * @returns {Promise<string>} Translated text
   */
  async translate(text, sourceLanguage = 'en', targetLanguage = 'zh') {
    // If no Aliyun client, skip to Youdao fallback
    if (!this.client) {
      throw new Error('Aliyun client not initialized');
    }

    try {
      const params = {
        FormatType: 'text',
        SourceLanguage: sourceLanguage,
        TargetLanguage: targetLanguage,
        SourceText: text,
        Scene: 'general'
      };

      const requestOption = {
        method: 'POST'
      };

      const response = await this.client.request('TranslateGeneral', params, requestOption);

      if (response.Code === '200' && response.Data) {
        return response.Data.Translated;
      } else {
        throw new Error(`Translation failed: ${response.Message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Aliyun translation error:', error.message);
      throw error;
    }
  }

  /**
   * Batch translate multiple words
   * @param {string[]} words - Array of English words
   * @returns {Promise<Object>} Map of word to translation
   */
  async batchTranslate(words) {
    const translations = {};

    // Translate words in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < words.length; i += batchSize) {
      const batch = words.slice(i, i + batchSize);
      const promises = batch.map(async word => {
        try {
          const translation = await this.translate(word);
          return { word, translation };
        } catch (error) {
          console.error(`Failed to translate "${word}":`, error.message);
          return { word, translation: null };
        }
      });

      const results = await Promise.all(promises);
      results.forEach(({ word, translation }) => {
        if (translation) {
          translations[word] = translation;
        }
      });

      // Add delay to avoid rate limiting
      if (i + batchSize < words.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return translations;
  }

  /**
   * Get word definition from Youdao Dictionary API (fallback)
   * @param {string} word - English word
   * @returns {Promise<Object>} Word definition with all translations and phonetic
   */
  async getWordDefinition(word) {
    try {
      // Try to get from Youdao API first (already used in the project)
      const youdaoUrl = `https://dict.youdao.com/jsonapi?q=${encodeURIComponent(word)}`;
      const response = await axios.get(youdaoUrl, { timeout: 5000 });
      const data = response.data;

      if (data.ec && data.ec.word) {
        const wordData = data.ec.word[0];

        // Extract all translations with word types
        const translations = [];
        if (wordData.trs && wordData.trs.length > 0) {
          wordData.trs.forEach(tr => {
            if (tr.tr && tr.tr.length > 0) {
              tr.tr.forEach(item => {
                if (item.l && item.l.i) {
                  item.l.i.forEach(meaning => {
                    if (meaning && meaning.trim()) {
                      translations.push(meaning.trim());
                    }
                  });
                }
              });
            }
          });
        }

        // Group translations by word type
        const groupedTranslations = this.groupTranslationsByType(translations);

        return {
          word: word.toLowerCase(),
          phonetic: wordData.ukphone || wordData.usphone || '',
          ukPhone: wordData.ukphone || '',
          usPhone: wordData.usphone || '',
          translations: groupedTranslations, // Array of {type, meanings}
          // Keep simple translation for backward compatibility
          translation: translations.join('；') || '',
          wordType: groupedTranslations.length > 0 ? groupedTranslations[0].type : ''
        };
      }

      // Fallback to Aliyun translation if available
      if (this.client) {
        const translation = await this.translate(word);
        return {
          word: word.toLowerCase(),
          translation,
          translations: [{ type: '', meanings: [translation] }],
          phonetic: '',
          ukPhone: '',
          usPhone: '',
          wordType: ''
        };
      }

      // If no translation available, return placeholder
      return {
        word: word.toLowerCase(),
        translation: '(翻译不可用)',
        translations: [],
        phonetic: '',
        ukPhone: '',
        usPhone: '',
        wordType: ''
      };
    } catch (error) {
      console.error(`Failed to get definition for "${word}":`, error.message);

      // Last resort: try Aliyun if available
      if (this.client) {
        try {
          const translation = await this.translate(word);
          return {
            word: word.toLowerCase(),
            translation,
            translations: [{ type: '', meanings: [translation] }],
            phonetic: '',
            ukPhone: '',
            usPhone: '',
            wordType: ''
          };
        } catch (err) {
          console.error('Aliyun fallback also failed:', err.message);
        }
      }

      // Return placeholder when all methods fail
      return {
        word: word.toLowerCase(),
        translation: '(翻译失败)',
        translations: [],
        phonetic: '',
        ukPhone: '',
        usPhone: '',
        wordType: ''
      };
    }
  }

  /**
   * Group translations by word type
   * @param {string[]} translations - Array of translation strings
   * @returns {Array} Array of {type, meanings}
   */
  groupTranslationsByType(translations) {
    const groups = [];
    let currentType = '';
    let currentMeanings = [];

    translations.forEach(trans => {
      // Check if this line starts with a word type
      const typeMatch = trans.match(/^(n\.|v\.|adj\.|adv\.|prep\.|conj\.|pron\.|int\.|num\.|art\.|abbr\.)\s*/);

      if (typeMatch) {
        // Save previous group if exists
        if (currentMeanings.length > 0) {
          groups.push({
            type: currentType,
            meanings: currentMeanings
          });
        }

        // Start new group
        currentType = typeMatch[1];
        const meaning = trans.substring(typeMatch[0].length).trim();
        if (meaning) {
          currentMeanings = [meaning];
        } else {
          currentMeanings = [];
        }
      } else {
        // Add to current group
        if (trans.trim()) {
          currentMeanings.push(trans.trim());
        }
      }
    });

    // Add last group
    if (currentMeanings.length > 0) {
      groups.push({
        type: currentType,
        meanings: currentMeanings
      });
    }

    return groups;
  }

  /**
   * Extract word type from translation string
   * @param {string} translation - Translation string
   * @returns {string} Word type
   */
  extractWordType(translation) {
    if (!translation) return '';

    const typePatterns = [
      { pattern: /^n\.\s/, type: 'n.' },
      { pattern: /^v\.\s/, type: 'v.' },
      { pattern: /^adj\.\s/, type: 'adj.' },
      { pattern: /^adv\.\s/, type: 'adv.' },
      { pattern: /^prep\.\s/, type: 'prep.' },
      { pattern: /^conj\.\s/, type: 'conj.' },
      { pattern: /^pron\.\s/, type: 'pron.' }
    ];

    for (const { pattern, type } of typePatterns) {
      if (pattern.test(translation)) {
        return type;
      }
    }

    return '';
  }
}

export default new AliyunTranslator();

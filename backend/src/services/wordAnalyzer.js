import axios from 'axios';
import RPCClient from '@alicloud/pop-core';
import OSS from 'ali-oss';
import crypto from 'crypto';
import dotenv from 'dotenv';
import aliyunTranslator from './aliyunTranslator.js';

dotenv.config();

const ALIYUN_ACCESS_KEY_ID = process.env.ALIYUN_ACCESS_KEY_ID || '';
const ALIYUN_ACCESS_KEY_SECRET = process.env.ALIYUN_ACCESS_KEY_SECRET || '';
const ALIYUN_APP_KEY = process.env.ALIYUN_TTS_APP_KEY || '';
const OSS_REGION = 'oss-cn-beijing';
const OSS_BUCKET = 'creatimage';

let ossClient = null;
let cachedToken = null;
let tokenExpireTime = 0;

// Initialize OSS client
function initOSSClient() {
  if (!ossClient) {
    ossClient = new OSS({
      region: OSS_REGION,
      accessKeyId: ALIYUN_ACCESS_KEY_ID,
      accessKeySecret: ALIYUN_ACCESS_KEY_SECRET,
      bucket: OSS_BUCKET
    });
  }
  return ossClient;
}

// Get NLS Token
async function getNLSToken() {
  if (cachedToken && Date.now() < tokenExpireTime) {
    return cachedToken;
  }

  const client = new RPCClient({
    accessKeyId: ALIYUN_ACCESS_KEY_ID,
    accessKeySecret: ALIYUN_ACCESS_KEY_SECRET,
    endpoint: 'https://nls-meta.cn-shanghai.aliyuncs.com',
    apiVersion: '2019-02-28'
  });

  const result = await client.request('CreateToken');
  cachedToken = result.Token.Id;
  const expireTime = result.Token.ExpireTime || 3600;
  tokenExpireTime = Date.now() + expireTime * 1000 - 5 * 60 * 1000;

  return cachedToken;
}

// Generate TTS audio and upload to OSS
async function generateAndUploadAudio(text, filenamePrefix) {
  try {
    const token = await getNLSToken();
    const url = 'https://nls-gateway-cn-beijing.aliyuncs.com/stream/v1/tts';

    const params = {
      appkey: ALIYUN_APP_KEY,
      token: token,
      text: text,
      format: 'mp3',
      sample_rate: 24000,
      voice: 'zhixiaoxia',
      volume: 50,
      speech_rate: 0,
      pitch_rate: 0
    };

    const response = await axios({
      method: 'post',
      url: url,
      headers: {
        'Content-Type': 'application/json'
      },
      data: params,
      responseType: 'arraybuffer'
    });

    const audioBuffer = Buffer.from(response.data);
    const filename = `vocabulary-book/${filenamePrefix}-${Date.now()}.mp3`;

    const oss = initOSSClient();
    const result = await oss.put(filename, audioBuffer);

    return result.url;
  } catch (error) {
    console.error('Generate audio error:', error.message);
    throw new Error('Failed to generate audio: ' + error.message);
  }
}

// Fetch word definition from free dictionary API
async function fetchDictionaryData(word) {
  try {
    const response = await axios.get(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    );

    if (Array.isArray(response.data) && response.data.length > 0) {
      const entry = response.data[0];

      // Extract phonetic
      let phonetic = '';
      if (entry.phonetics && entry.phonetics.length > 0) {
        for (const p of entry.phonetics) {
          if (p.text) {
            phonetic = p.text;
            break;
          }
        }
      }

      // Extract meaning
      let meaning = '';
      if (entry.meanings && entry.meanings.length > 0) {
        const firstMeaning = entry.meanings[0];
        if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
          meaning = firstMeaning.definitions[0].definition;
        }
      }

      return { phonetic, meaning, entry, spellingError: false };
    }
  } catch (error) {
    // 404错误表示单词不存在（可能拼写错误）
    if (error.response?.status === 404) {
      console.warn(`⚠️ Word "${word}" not found in dictionary - possible spelling error`);
      return { phonetic: '', meaning: '', entry: null, spellingError: true };
    }
    console.warn('Dictionary API error:', error.message);
  }

  return { phonetic: '', meaning: '', entry: null, spellingError: false };
}

// Translate text to Chinese using free translation API
async function translateToChinese(text) {
  try {
    // Using a simple translation - you can replace with better APIs like Baidu/Youdao
    const response = await axios.get('https://api.mymemory.translated.net/get', {
      params: {
        q: text,
        langpair: 'en|zh-CN'
      }
    });

    if (response.data?.responseData?.translatedText) {
      return response.data.responseData.translatedText;
    }
  } catch (error) {
    console.warn('Translation API error:', error.message);
  }

  return text; // Fallback to original text
}

// Format phonetic to common notation (convert IPA to simplified format)
function formatPhonetic(phonetic) {
  if (!phonetic) return '';

  // 将IPA音标转换为更常见的格式
  return phonetic
    .replace(/ɹ/g, 'r')      // 齿龈近音 → r
    .replace(/ə/g, 'ə')      // schwa保持不变（这是常用符号）
    .replace(/ɡ/g, 'g')      // 小写字母g的IPA变体 → g
    .replace(/ː/g, ':')      // 长音符号 → 冒号
    .replace(/ˈ/g, "'")      // 主重音 → 单引号
    .replace(/ˌ/g, ',')      // 次重音 → 逗号
    .replace(/θ/g, 'θ')      // theta保持不变（常用）
    .replace(/ð/g, 'ð')      // eth保持不变（常用）
    .replace(/ʃ/g, 'ʃ')      // sh音保持不变（常用）
    .replace(/ʒ/g, 'ʒ')      // zh音保持不变（常用）
    .replace(/ŋ/g, 'ŋ')      // ng音保持不变（常用）
    .replace(/ɔ/g, 'ɔ');     // open o保持不变（常用）
}

// Use AI to analyze word comprehensively
async function analyzeWordWithAI(word) {
  const AI_API_KEY = process.env.AI_API_KEY || '';
  const AI_API_URL = process.env.AI_API_URL || 'https://api.openai.com';
  const AI_MODEL = process.env.AI_MODEL || process.env.AImodle || 'gemini-2.5-flash-preview-09-2025';

  const prompt = `分析英文单词 "${word}"，返回JSON格式：

{
  "chinese_meanings": [
    {
      "meaning": "简洁的中文词义（如：实践、练习）",
      "part_of_speech": "n./v./adj./adv.",
      "context": "使用场景（如：正式/口语）"
    }
  ],
  "word_breakdown": {
    "prefix": "前缀（如果有）",
    "prefix_meaning": "前缀含义",
    "root": "词根",
    "root_meaning": "词根含义",
    "suffix": "后缀（如果有）",
    "suffix_meaning": "后缀含义",
    "breakdown_text": "组合说明（如：pract(行为) + -ice(名词后缀) = practice）"
  },
  "memory_technique": "记忆技巧（联想、谐音等）",
  "derived_words": [
    {
      "word": "衍生词",
      "phonetic": "/音标/",
      "meaning": "中文释义",
      "usage": "用法说明或例句"
    }
  ],
  "common_usage": [
    {
      "phrase": "常用搭配或短语",
      "meaning": "中文意思",
      "example": "例句"
    }
  ],
  "ielts_examples": [
    {
      "sentence": "雅思风格例句",
      "translation": "中文翻译"
    }
  ]
}

重要要求：
1. chinese_meanings中的meaning必须简洁，只写词义，不要写完整句子。例如：
   ✅ 正确："实践；练习；惯例"
   ❌ 错误："处于液体和等离子体中间状态的物质..."

2. word_breakdown必须真正拆解词根词缀，不要返回"完整词根"。例如：
   ✅ 正确：breakdown_text: "ad(向) + vert(转) + ise(使) + ment(名词后缀) = advertisement(广告)"
   ❌ 错误：breakdown_text: "advertisement(完整词根)"

3. 如果单词确实无法拆解（如：go, cat等简单基础词），在breakdown_text中说明具体原因，例如：
   - "go 是古英语基础词汇，无词根词缀结构"
   - "cat 源自拉丁语 cattus，为单一词根"

4. memory_technique要实用且具体，针对该单词特点设计。例如：
   ✅ 正确："advertisements = ad(广告) + vert(转向) + ise(动词) + ment(名词)，想象广告把人们的注意力转向产品"
   ❌ 错误："将单词拆分成部分，理解每个部分的含义"

5. derived_words必须返回3-5个真实存在的衍生词，每个词都要包含：
   - word: 衍生词本身
   - phonetic: 音标（必须提供）
   - meaning: 中文释义（简洁）
   - usage: 用法说明或例句
   例如：对于单词"practice"，衍生词应该是：
   [
     {"word": "practical", "phonetic": "/ˈpræktɪkl/", "meaning": "实际的；实用的", "usage": "adj. 常用于描述注重实际应用的，如：practical experience（实践经验）"},
     {"word": "practically", "phonetic": "/ˈpræktɪkli/", "meaning": "实际上；几乎", "usage": "adv. 表示几乎、差不多，如：practically impossible（几乎不可能）"},
     {"word": "practitioner", "phonetic": "/prækˈtɪʃənə(r)/", "meaning": "从业者；执业医生", "usage": "n. 指某领域的从业人员，如：medical practitioner（执业医生）"}
   ]

6. common_usage必须返回2-4个真实的常用搭配，每个搭配要包含：
   - phrase: 短语或搭配
   - meaning: 中文意思
   - example: 实际例句
   例如：对于单词"practice"：
   [
     {"phrase": "in practice", "meaning": "实际上；在实践中", "example": "In practice, the new system works very well."},
     {"phrase": "put into practice", "meaning": "付诸实践", "example": "We need to put these ideas into practice."},
     {"phrase": "practice makes perfect", "meaning": "熟能生巧", "example": "Keep trying – practice makes perfect!"}
   ]

7. ielts_examples至少2个真实的雅思风格例句

只返回JSON，不要其他内容。确保每个字段都有具体、实用的内容。`;

  try {
    const response = await axios.post(
      `${AI_API_URL}/v1/chat/completions`,
      {
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a professional English etymology expert and IELTS vocabulary teacher. You specialize in breaking down words into their morphological components (prefixes, roots, suffixes) and providing concise, memorable definitions. Always return valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${AI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Invalid AI response format');
  } catch (error) {
    console.error('AI analysis error:', error.message);
    return null;
  }
}

// Analyze word with AI (enhanced version)
export async function analyzeWord(word) {
  try {
    console.log(`🔍 Starting comprehensive analysis for word: ${word}`);

    // 1. Fetch dictionary data
    const dictData = await fetchDictionaryData(word);

    // 检查拼写错误
    if (dictData.spellingError) {
      console.warn(`⚠️ Possible spelling error detected for: ${word}`);
      // 抛出特殊错误，包含拼写错误信息
      const error = new Error(`单词 "${word}" 可能拼写错误，未在词典中找到`);
      error.spellingError = true;
      error.word = word;
      throw error;
    }

    // 2. Get AI analysis
    const aiAnalysis = await analyzeWordWithAI(word);

    // 3. Generate phonetic and pronunciation audio
    const phonetic = formatPhonetic(dictData.phonetic) || `/${word}/`;
    let pronunciation_audio_url = '';

    try {
      pronunciation_audio_url = await generateAndUploadAudio(word, `word-${word}`);
      console.log(`✅ Word pronunciation audio generated: ${pronunciation_audio_url}`);
    } catch (error) {
      console.warn('⚠️ Failed to generate word audio, using Youdao fallback');
      pronunciation_audio_url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=1`;
    }

    // 4. Build Chinese meaning from Youdao API (with all parts of speech)
    let chinese_meaning = '';
    let youdaoData = null;

    try {
      // Get comprehensive translation from Youdao
      youdaoData = await aliyunTranslator.getWordDefinition(word);

      if (youdaoData && youdaoData.translations && youdaoData.translations.length > 0) {
        // Format: each word type on a new line
        chinese_meaning = youdaoData.translations
          .map(group => {
            const type = group.type ? `【${group.type}】` : '';
            const meanings = group.meanings.join('；');
            return `${type}${meanings}`;
          })
          .join('\n');
      } else if (youdaoData && youdaoData.translation) {
        chinese_meaning = youdaoData.translation;
      }
    } catch (error) {
      console.warn('Failed to get Youdao translation, using AI analysis:', error.message);
    }

    // Fallback to AI analysis if Youdao failed
    if (!chinese_meaning && aiAnalysis && aiAnalysis.chinese_meanings) {
      chinese_meaning = aiAnalysis.chinese_meanings
        .map(m => {
          const type = m.part_of_speech ? `【${m.part_of_speech}】` : '';
          return `${type}${m.meaning}`;
        })
        .join('\n');
    } else if (!chinese_meaning && dictData.meaning) {
      chinese_meaning = await translateToChinese(dictData.meaning);
    } else if (!chinese_meaning) {
      chinese_meaning = await translateToChinese(word);
    }

    // 5. Word breakdown analysis
    let word_breakdown = '';
    if (aiAnalysis?.word_breakdown) {
      // AI返回的是对象格式
      if (typeof aiAnalysis.word_breakdown === 'object') {
        word_breakdown = aiAnalysis.word_breakdown.breakdown_text || '';
      } else {
        word_breakdown = aiAnalysis.word_breakdown;
      }
    }

    // 如果AI没有返回有效内容（空或只是模板文本），使用本地分析
    if (!word_breakdown || word_breakdown === '' || word_breakdown.includes('完整词根')) {
      word_breakdown = analyzeWordStructure(word);
    }

    // 6. Memory technique
    let memory_technique = '';
    if (aiAnalysis?.memory_technique &&
        !aiAnalysis.memory_technique.includes('将单词拆分成部分') &&
        aiAnalysis.memory_technique.length > 20) {
      // AI返回了有效的记忆技巧
      memory_technique = aiAnalysis.memory_technique;
    } else {
      // 生成基于词根拆解的记忆技巧
      memory_technique = generateMemoryTechnique(word, word_breakdown);
    }

    // 7. Derived words
    let derived_words = '';
    if (aiAnalysis?.derived_words && Array.isArray(aiAnalysis.derived_words) && aiAnalysis.derived_words.length > 0) {
      // Check if it's the new detailed format (array of objects)
      if (typeof aiAnalysis.derived_words[0] === 'object' && aiAnalysis.derived_words[0].word) {
        // New format: store as JSON string
        derived_words = JSON.stringify(aiAnalysis.derived_words);
      } else {
        // Old format: simple string array
        derived_words = aiAnalysis.derived_words.join(', ');
      }
    } else {
      derived_words = generateDerivedWords(word, dictData.entry);
    }

    // 8. Common usage
    let common_usage = '';
    if (aiAnalysis?.common_usage && Array.isArray(aiAnalysis.common_usage) && aiAnalysis.common_usage.length > 0) {
      // New format: array of objects with phrase, meaning, example
      common_usage = JSON.stringify(aiAnalysis.common_usage);
    } else if (aiAnalysis?.common_usage &&
        typeof aiAnalysis.common_usage === 'string' &&
        !aiAnalysis.common_usage.includes('作为') &&
        !aiAnalysis.common_usage.includes('使用') &&
        aiAnalysis.common_usage.length > 10) {
      // Old format: AI returned a string
      common_usage = aiAnalysis.common_usage;
    } else if (dictData.entry?.meanings?.[0]) {
      // 从词典API提取常用搭配
      const meaning = dictData.entry.meanings[0];
      const examples = [];
      if (meaning.definitions) {
        for (const def of meaning.definitions.slice(0, 2)) {
          if (def.example) {
            examples.push(def.example);
          }
        }
      }
      if (examples.length > 0) {
        common_usage = '常见用法: ' + examples.join('; ');
      } else {
        common_usage = `${meaning.partOfSpeech || 'word'} - ${meaning.definitions[0]?.definition || ''}`.substring(0, 100);
      }
    } else {
      common_usage = '暂无常用用法信息';
    }

    // 9. Usage examples with audio
    let usage_examples = [];
    if (aiAnalysis && aiAnalysis.ielts_examples && aiAnalysis.ielts_examples.length > 0) {
      console.log(`🎯 Generating audio for ${aiAnalysis.ielts_examples.length} IELTS examples...`);
      for (const example of aiAnalysis.ielts_examples) {
        try {
          const audio_url = await generateAndUploadAudio(example.sentence, `example-${word}`);
          usage_examples.push({
            sentence: example.sentence,
            translation: example.translation,
            audio_url
          });
          console.log(`✅ Example audio generated: ${example.sentence.substring(0, 30)}...`);
        } catch (error) {
          console.warn('⚠️ Failed to generate example audio:', error.message);
          usage_examples.push({
            sentence: example.sentence,
            translation: example.translation,
            audio_url: ''
          });
        }
      }
    } else {
      // Fallback to dictionary examples
      usage_examples = await generateUsageExamples(word, dictData.entry);
    }

    console.log(`✅ Word analysis complete for: ${word}`);

    return {
      phonetic,
      pronunciation_audio_url,
      chinese_meaning,
      word_breakdown,
      memory_technique,
      derived_words,
      common_usage,
      usage_examples
    };
  } catch (error) {
    console.error('❌ Analyze word error:', error);
    throw error;
  }
}

// Analyze word structure
function analyzeWordStructure(word) {
  const prefixes = [
    { value: 'un', meaning: '不、非' },
    { value: 're', meaning: '再次、重新' },
    { value: 'pre', meaning: '预先、前' },
    { value: 'dis', meaning: '不、相反' },
    { value: 'mis', meaning: '错误' },
    { value: 'over', meaning: '过度' },
    { value: 'under', meaning: '不足' },
    { value: 'inter', meaning: '之间' },
    { value: 'trans', meaning: '跨越' },
    { value: 'super', meaning: '超级' },
    { value: 'sub', meaning: '在...下' },
    { value: 'anti', meaning: '反对' },
    { value: 'auto', meaning: '自动' },
    { value: 'bi', meaning: '两个' },
    { value: 'co', meaning: '共同' },
    { value: 'de', meaning: '去除、向下' },
    { value: 'ex', meaning: '向外' },
    { value: 'in', meaning: '在内、不' },
    { value: 'non', meaning: '非' },
    { value: 'post', meaning: '在...之后' }
  ];

  const suffixes = [
    { value: 'tion', meaning: '名词后缀' },
    { value: 'sion', meaning: '名词后缀' },
    { value: 'ment', meaning: '名词后缀' },
    { value: 'ness', meaning: '名词后缀' },
    { value: 'ity', meaning: '名词后缀' },
    { value: 'able', meaning: '能够...的' },
    { value: 'ible', meaning: '能够...的' },
    { value: 'ly', meaning: '副词后缀' },
    { value: 'ful', meaning: '充满...的' },
    { value: 'less', meaning: '无...的' },
    { value: 'ous', meaning: '充满...的' },
    { value: 'ive', meaning: '有...倾向的' },
    { value: 'er', meaning: '做...的人/物' },
    { value: 'or', meaning: '做...的人' },
    { value: 'ist', meaning: '...的人' },
    { value: 'ism', meaning: '主义、理论' },
    { value: 'ize', meaning: '使成为' },
    { value: 'ise', meaning: '使成为' },
    { value: 'ate', meaning: '使、做' }
  ];

  let breakdown = [];
  let remaining = word.toLowerCase();
  let foundPrefix = false;
  let foundSuffix = false;

  // Check prefix (按长度排序，优先匹配长前缀)
  const sortedPrefixes = prefixes.sort((a, b) => b.value.length - a.value.length);
  for (const prefix of sortedPrefixes) {
    if (remaining.startsWith(prefix.value) && remaining.length > prefix.value.length + 2) {
      breakdown.push(`${prefix.value}(${prefix.meaning})`);
      remaining = remaining.substring(prefix.value.length);
      foundPrefix = true;
      break;
    }
  }

  // Check suffix (按长度排序，优先匹配长后缀)
  const sortedSuffixes = suffixes.sort((a, b) => b.value.length - a.value.length);
  for (const suffix of sortedSuffixes) {
    if (remaining.endsWith(suffix.value) && remaining.length > suffix.value.length + 1) {
      const root = remaining.substring(0, remaining.length - suffix.value.length);
      if (root.length >= 2) {
        breakdown.push(`${root}(词根)`);
        breakdown.push(`${suffix.value}(${suffix.meaning})`);
        remaining = '';
        foundSuffix = true;
        break;
      }
    }
  }

  // 如果只找到前缀但没找到后缀
  if (foundPrefix && !foundSuffix && remaining) {
    breakdown.push(`${remaining}(词根)`);
  }

  // 如果既没找到前缀也没找到后缀
  if (!foundPrefix && !foundSuffix) {
    // 对于短单词，说明是基础词汇
    if (word.length <= 4) {
      return `${word} 是基础词汇，无明显词根词缀结构`;
    }
    // 对于长单词，尝试说明可能的来源
    return `${word} 可能源自外来语或专有词汇，建议整体记忆`;
  }

  return breakdown.join(' + ') + ` = ${word}`;
}

// Generate memory technique
function generateMemoryTechnique(word, breakdown) {
  // 如果breakdown已经包含了完整的拆解信息
  if (breakdown && breakdown.includes('+')) {
    return `记忆技巧：${breakdown}，通过理解各部分含义来记忆整体。`;
  }
  // 如果是基础词汇
  if (breakdown && (breakdown.includes('基础词汇') || breakdown.includes('整体记忆'))) {
    return `${breakdown}，建议通过例句和实际使用来加深记忆。`;
  }
  // 默认通用技巧
  return `建议结合单词的使用场景和例句来记忆 "${word}"，多做练习加深印象。`;
}

// Generate derived words
function generateDerivedWords(word, entry) {
  const derived = new Set(); // 使用Set避免重复
  const wordLower = word.toLowerCase();

  // 从词典API提取真实的同源词
  if (entry?.meanings) {
    for (const meaning of entry.meanings) {
      if (meaning.synonyms && Array.isArray(meaning.synonyms)) {
        meaning.synonyms.slice(0, 3).forEach(syn => derived.add(syn));
      }
      if (meaning.antonyms && Array.isArray(meaning.antonyms)) {
        meaning.antonyms.slice(0, 2).forEach(ant => derived.add(ant));
      }
    }
  }

  // 只在没有从词典获取到词的情况下才生成
  if (derived.size === 0) {
    // 智能生成常见变形
    const commonTransformations = [];

    // 动词变形
    if (!wordLower.endsWith('ed') && !wordLower.endsWith('ing') && !wordLower.endsWith('s')) {
      // 去除最后的e再加ing (如 make -> making)
      if (wordLower.endsWith('e') && wordLower.length > 3) {
        commonTransformations.push(wordLower.slice(0, -1) + 'ing');
      }
      // 双写最后字母加ing (如 run -> running)
      else if (wordLower.length >= 3 && /[aeiou][bcdfghjklmnpqrstvwxyz]$/.test(wordLower)) {
        commonTransformations.push(wordLower + wordLower.slice(-1) + 'ing');
      }
      // 直接加ing
      else {
        commonTransformations.push(wordLower + 'ing');
      }

      // 过去式
      if (wordLower.endsWith('e')) {
        commonTransformations.push(wordLower + 'd');
      } else {
        commonTransformations.push(wordLower + 'ed');
      }
    }

    // 名词/形容词变形
    if (!wordLower.endsWith('ly') && !wordLower.endsWith('ness')) {
      if (wordLower.endsWith('y') && wordLower.length > 3) {
        commonTransformations.push(wordLower.slice(0, -1) + 'ily'); // happy -> happily
      } else if (!wordLower.endsWith('ly')) {
        commonTransformations.push(wordLower + 'ly');
      }
    }

    // 限制数量
    commonTransformations.slice(0, 3).forEach(w => derived.add(w));
  }

  const result = Array.from(derived).slice(0, 5);
  return result.length > 0 ? result.join(', ') : '暂无衍生词';
}

// Generate usage examples
async function generateUsageExamples(word, entry) {
  const examples = [];

  // From dictionary API
  if (entry?.meanings) {
    for (const meaning of entry.meanings) {
      if (meaning.definitions) {
        for (const def of meaning.definitions) {
          if (def.example && examples.length < 2) {
            const sentence = def.example;
            const translation = await translateToChinese(sentence);

            try {
              const audio_url = await generateAndUploadAudio(sentence, `example-${word}`);
              examples.push({ sentence, translation, audio_url });
            } catch (error) {
              console.warn('Failed to generate example audio:', error.message);
              examples.push({ sentence, translation, audio_url: '' });
            }
          }
        }
      }
    }
  }

  // Add default example if none found
  if (examples.length === 0) {
    const sentence = `I need to learn the word "${word}".`;
    const translation = `我需要学习单词"${word}"。`;

    try {
      const audio_url = await generateAndUploadAudio(sentence, `example-${word}`);
      examples.push({ sentence, translation, audio_url });
    } catch (error) {
      examples.push({ sentence, translation, audio_url: '' });
    }
  }

  return examples;
}

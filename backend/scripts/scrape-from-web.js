import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 尝试从多个可能的数据源获取
async function fetchVocabularyFromWeb() {
  console.log('Fetching vocabulary from web...');
  
  try {
    // 1. 先获取主页，找到 vocabulary JS 文件
    console.log('Step 1: Fetching main page...');
    const mainPage = await axios.get('https://hefengxian.github.io/my-ielts/');
    const html = mainPage.data;
    
    // 查找 vocabulary JS 文件
    const vocabJsMatch = html.match(/assets\/(vocabulary-[a-f0-9]+\.js)/);
    
    if (vocabJsMatch) {
      const vocabJsFile = vocabJsMatch[0];
      const jsUrl = `https://hefengxian.github.io/my-ielts/${vocabJsFile}`;
      
      console.log(`Step 2: Found vocabulary JS: ${jsUrl}`);
      const jsResponse = await axios.get(jsUrl);
      const jsContent = jsResponse.data;
      
      // 从JS文件中提取词汇数据
      // 数据通常以 JSON 格式嵌入在 JS 中
      return extractVocabularyFromJS(jsContent);
    }
    
    console.log('⚠ Could not find vocabulary JS file in HTML');
    return null;
    
  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
    return null;
  }
}

// 从 JS 文件中提取词汇数据
function extractVocabularyFromJS(jsContent) {
  console.log('Step 3: Extracting vocabulary data from JS...');
  
  try {
    // 查找类似 JSON 的数组数据
    // 通常格式为：[{name:"...",words:[...]}, ...]
    const match = jsContent.match(/\[\s*\{\s*name\s*:\s*["'][\s\S]+?\]\s*\}/g);
    
    if (match) {
      // 尝试提取和解析数据
      let dataStr = match[0];
      
      // 转换为标准 JSON 格式（将单引号转双引号等）
      dataStr = dataStr.replace(/(\w+):/g, '"$1":').replace(/'/g, '"');
      
      try {
        const data = JSON.parse(dataStr);
        return processVocabularyData(data);
      } catch (e) {
        console.log('  Could not parse as JSON, trying eval...');
        // 如果JSON.parse失败，尝试使用eval（不安全但可能work）
        const data = eval(`(${dataStr})`);
        return processVocabularyData(data);
      }
    }
    
    console.log('⚠ Could not extract vocabulary data from JS');
    return null;
    
  } catch (error) {
    console.error(`✗ Extraction error: ${error.message}`);
    return null;
  }
}

// 处理获取到的词汇数据
function processVocabularyData(data) {
  const categories = [];
  const words = [];
  let wordIdCounter = 1;
  
  // 数据可能是数组或对象
  const vocabArray = Array.isArray(data) ? data : (data.vocabulary || data.words || []);
  
  if (vocabArray.length === 0) {
    console.log('⚠ No vocabulary data found in response');
    return { categories, words };
  }
  
  console.log(`\nProcessing ${vocabArray.length} categories...`);
  
  vocabArray.forEach((category, categoryIndex) => {
    const categoryId = categoryIndex + 1;
    
    // 添加分类
    categories.push({
      id: categoryId,
      name: category.name || category.title || `Category ${categoryId}`,
      description: category.description || category.desc || '',
      order_index: categoryIndex
    });
    
    // 处理该分类下的单词
    const categoryWords = category.words || category.list || category.vocabulary || [];
    
    console.log(`  Category ${categoryId}: ${category.name || 'Unknown'} (${categoryWords.length} words)`);
    
    categoryWords.forEach((wordData, wordIndex) => {
      const word = {
        id: wordIdCounter++,
        category_id: categoryId,
        word: wordData.word || wordData.name || wordData.text || '',
        phonetic: wordData.phonetic || wordData.pronunciation || wordData.phonetics || '',
        part_of_speech: wordData.pos || wordData.partOfSpeech || wordData.type || '',
        chinese_meaning: wordData.translation || wordData.meaning || wordData.chinese || wordData.trans || '',
        word_root: wordData.root || wordData.etymology || wordData.note || '',
        example_sentence: wordData.example || wordData.sentence || wordData.sen || '',
        example_translation: wordData.exampleTranslation || wordData.exampleTrans || '',
        audio_url: wordData.audio || `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(wordData.word || '')}&type=1`,
        difficulty_level: wordData.difficulty || wordData.level || 1,
        order_in_category: wordIndex
      };
      
      if (word.word) {
        words.push(word);
      }
    });
  });
  
  console.log(`\n✓ Processed ${categories.length} categories and ${words.length} words`);
  
  return { categories, words };
}

// 保存数据到文件
function saveToFiles(data) {
  const { categories, words } = data;
  
  const outputDir = path.join(__dirname, '../data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(outputDir, 'categories.json'),
    JSON.stringify(categories, null, 2)
  );
  
  fs.writeFileSync(
    path.join(outputDir, 'words.json'),
    JSON.stringify(words, null, 2)
  );
  
  console.log('\n✓ Data saved to backend/data/');
  console.log(`  - categories.json (${categories.length} categories)`);
  console.log(`  - words.json (${words.length} words)`);
}

// 主函数
async function main() {
  console.log('=== IELTS Vocabulary Web Scraper ===\n');
  
  const data = await fetchVocabularyFromWeb();
  
  if (data && data.words.length > 0) {
    saveToFiles(data);
    console.log('\n✅ Scraping completed successfully!');
  } else {
    console.log('\n❌ Scraping failed - no data retrieved');
    process.exit(1);
  }
}

main();


import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 尝试从多个可能的数据源获取
async function fetchVocabularyFromWeb() {
  console.log('Fetching vocabulary from web...');
  
  try {
    // 1. 先获取主页，找到 vocabulary JS 文件
    console.log('Step 1: Fetching main page...');
    const mainPage = await axios.get('https://hefengxian.github.io/my-ielts/');
    const html = mainPage.data;
    
    // 查找 vocabulary JS 文件
    const vocabJsMatch = html.match(/assets\/(vocabulary-[a-f0-9]+\.js)/);
    
    if (vocabJsMatch) {
      const vocabJsFile = vocabJsMatch[0];
      const jsUrl = `https://hefengxian.github.io/my-ielts/${vocabJsFile}`;
      
      console.log(`Step 2: Found vocabulary JS: ${jsUrl}`);
      const jsResponse = await axios.get(jsUrl);
      const jsContent = jsResponse.data;
      
      // 从JS文件中提取词汇数据
      // 数据通常以 JSON 格式嵌入在 JS 中
      return extractVocabularyFromJS(jsContent);
    }
    
    console.log('⚠ Could not find vocabulary JS file in HTML');
    return null;
    
  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
    return null;
  }
}

// 从 JS 文件中提取词汇数据
function extractVocabularyFromJS(jsContent) {
  console.log('Step 3: Extracting vocabulary data from JS...');
  
  try {
    // 查找类似 JSON 的数组数据
    // 通常格式为：[{name:"...",words:[...]}, ...]
    const match = jsContent.match(/\[\s*\{\s*name\s*:\s*["'][\s\S]+?\]\s*\}/g);
    
    if (match) {
      // 尝试提取和解析数据
      let dataStr = match[0];
      
      // 转换为标准 JSON 格式（将单引号转双引号等）
      dataStr = dataStr.replace(/(\w+):/g, '"$1":').replace(/'/g, '"');
      
      try {
        const data = JSON.parse(dataStr);
        return processVocabularyData(data);
      } catch (e) {
        console.log('  Could not parse as JSON, trying eval...');
        // 如果JSON.parse失败，尝试使用eval（不安全但可能work）
        const data = eval(`(${dataStr})`);
        return processVocabularyData(data);
      }
    }
    
    console.log('⚠ Could not extract vocabulary data from JS');
    return null;
    
  } catch (error) {
    console.error(`✗ Extraction error: ${error.message}`);
    return null;
  }
}

// 处理获取到的词汇数据
function processVocabularyData(data) {
  const categories = [];
  const words = [];
  let wordIdCounter = 1;
  
  // 数据可能是数组或对象
  const vocabArray = Array.isArray(data) ? data : (data.vocabulary || data.words || []);
  
  if (vocabArray.length === 0) {
    console.log('⚠ No vocabulary data found in response');
    return { categories, words };
  }
  
  console.log(`\nProcessing ${vocabArray.length} categories...`);
  
  vocabArray.forEach((category, categoryIndex) => {
    const categoryId = categoryIndex + 1;
    
    // 添加分类
    categories.push({
      id: categoryId,
      name: category.name || category.title || `Category ${categoryId}`,
      description: category.description || category.desc || '',
      order_index: categoryIndex
    });
    
    // 处理该分类下的单词
    const categoryWords = category.words || category.list || category.vocabulary || [];
    
    console.log(`  Category ${categoryId}: ${category.name || 'Unknown'} (${categoryWords.length} words)`);
    
    categoryWords.forEach((wordData, wordIndex) => {
      const word = {
        id: wordIdCounter++,
        category_id: categoryId,
        word: wordData.word || wordData.name || wordData.text || '',
        phonetic: wordData.phonetic || wordData.pronunciation || wordData.phonetics || '',
        part_of_speech: wordData.pos || wordData.partOfSpeech || wordData.type || '',
        chinese_meaning: wordData.translation || wordData.meaning || wordData.chinese || wordData.trans || '',
        word_root: wordData.root || wordData.etymology || wordData.note || '',
        example_sentence: wordData.example || wordData.sentence || wordData.sen || '',
        example_translation: wordData.exampleTranslation || wordData.exampleTrans || '',
        audio_url: wordData.audio || `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(wordData.word || '')}&type=1`,
        difficulty_level: wordData.difficulty || wordData.level || 1,
        order_in_category: wordIndex
      };
      
      if (word.word) {
        words.push(word);
      }
    });
  });
  
  console.log(`\n✓ Processed ${categories.length} categories and ${words.length} words`);
  
  return { categories, words };
}

// 保存数据到文件
function saveToFiles(data) {
  const { categories, words } = data;
  
  const outputDir = path.join(__dirname, '../data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(outputDir, 'categories.json'),
    JSON.stringify(categories, null, 2)
  );
  
  fs.writeFileSync(
    path.join(outputDir, 'words.json'),
    JSON.stringify(words, null, 2)
  );
  
  console.log('\n✓ Data saved to backend/data/');
  console.log(`  - categories.json (${categories.length} categories)`);
  console.log(`  - words.json (${words.length} words)`);
}

// 主函数
async function main() {
  console.log('=== IELTS Vocabulary Web Scraper ===\n');
  
  const data = await fetchVocabularyFromWeb();
  
  if (data && data.words.length > 0) {
    saveToFiles(data);
    console.log('\n✅ Scraping completed successfully!');
  } else {
    console.log('\n❌ Scraping failed - no data retrieved');
    process.exit(1);
  }
}

main();


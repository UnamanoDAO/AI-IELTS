import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 尝试多个可能的路径
const possiblePaths = [
  path.join(__dirname, '../../..', '自然.md'),
  path.join(__dirname, '../..', '自然.md'),
  path.join(process.cwd(), '../自然.md'),
  path.join(process.cwd(), '../../自然.md')
];

let mdFilePath = null;
for (const testPath of possiblePaths) {
  if (fs.existsSync(testPath)) {
    mdFilePath = testPath;
    console.log(`✓ Found file: ${testPath}\n`);
    break;
  }
}

if (!mdFilePath) {
  console.error('✗ File not found!');
  process.exit(1);
}

const content = fs.readFileSync(mdFilePath, 'utf8');
const lines = content.split('\n').map(line => line.replace(/\r$/, ''));

console.log(`Total lines: ${lines.length}\n`);
console.log('=== First 30 lines ===');
for (let i = 0; i < Math.min(30, lines.length); i++) {
  const line = lines[i];
  const display = line.trim() === '' ? '(empty)' : line;
  console.log(`Line ${i}: [${display}]`);
}

console.log('\n=== Looking for word pattern ===');
let foundCount = 0;
for (let i = 0; i < Math.min(100, lines.length); i++) {
  const line = lines[i].trim();
  
  if (/^\d+$/.test(line)) {
    console.log(`\n✓ Found number at line ${i}: "${line}"`);
    
    // Find word
    let wordLineIndex = i + 1;
    while (wordLineIndex < lines.length && lines[wordLineIndex].trim() === '') {
      wordLineIndex++;
    }
    
    if (wordLineIndex < lines.length) {
      const wordText = lines[wordLineIndex].trim();
      console.log(`  Word line ${wordLineIndex}: "${wordText}"`);
      
      // Find detail
      let detailLineIndex = wordLineIndex + 1;
      while (detailLineIndex < lines.length && lines[detailLineIndex].trim() === '') {
        detailLineIndex++;
      }
      
      if (detailLineIndex < lines.length) {
        const detailLine = lines[detailLineIndex];
        console.log(`  Detail line ${detailLineIndex}: "${detailLine}"`);
        const parts = detailLine.split('\t');
        console.log(`  Split into ${parts.length} parts:`, parts.map((p, idx) => `[${idx}]="${p.trim()}"`));
        
        if (parts.length >= 2 && parts[0] && parts[1]) {
          foundCount++;
          console.log(`  ✓ Valid word #${foundCount}: ${wordText}`);
        } else {
          console.log(`  ✗ Invalid: not enough parts or empty parts`);
        }
      }
    }
    
    if (foundCount >= 5) {
      console.log(`\n... (stopping after 5 words for brevity)`);
      break;
    }
  }
}

console.log(`\n=== Summary ===`);
console.log(`Found ${foundCount} valid words in first 100 lines`);


import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 尝试多个可能的路径
const possiblePaths = [
  path.join(__dirname, '../../..', '自然.md'),
  path.join(__dirname, '../..', '自然.md'),
  path.join(process.cwd(), '../自然.md'),
  path.join(process.cwd(), '../../自然.md')
];

let mdFilePath = null;
for (const testPath of possiblePaths) {
  if (fs.existsSync(testPath)) {
    mdFilePath = testPath;
    console.log(`✓ Found file: ${testPath}\n`);
    break;
  }
}

if (!mdFilePath) {
  console.error('✗ File not found!');
  process.exit(1);
}

const content = fs.readFileSync(mdFilePath, 'utf8');
const lines = content.split('\n').map(line => line.replace(/\r$/, ''));

console.log(`Total lines: ${lines.length}\n`);
console.log('=== First 30 lines ===');
for (let i = 0; i < Math.min(30, lines.length); i++) {
  const line = lines[i];
  const display = line.trim() === '' ? '(empty)' : line;
  console.log(`Line ${i}: [${display}]`);
}

console.log('\n=== Looking for word pattern ===');
let foundCount = 0;
for (let i = 0; i < Math.min(100, lines.length); i++) {
  const line = lines[i].trim();
  
  if (/^\d+$/.test(line)) {
    console.log(`\n✓ Found number at line ${i}: "${line}"`);
    
    // Find word
    let wordLineIndex = i + 1;
    while (wordLineIndex < lines.length && lines[wordLineIndex].trim() === '') {
      wordLineIndex++;
    }
    
    if (wordLineIndex < lines.length) {
      const wordText = lines[wordLineIndex].trim();
      console.log(`  Word line ${wordLineIndex}: "${wordText}"`);
      
      // Find detail
      let detailLineIndex = wordLineIndex + 1;
      while (detailLineIndex < lines.length && lines[detailLineIndex].trim() === '') {
        detailLineIndex++;
      }
      
      if (detailLineIndex < lines.length) {
        const detailLine = lines[detailLineIndex];
        console.log(`  Detail line ${detailLineIndex}: "${detailLine}"`);
        const parts = detailLine.split('\t');
        console.log(`  Split into ${parts.length} parts:`, parts.map((p, idx) => `[${idx}]="${p.trim()}"`));
        
        if (parts.length >= 2 && parts[0] && parts[1]) {
          foundCount++;
          console.log(`  ✓ Valid word #${foundCount}: ${wordText}`);
        } else {
          console.log(`  ✗ Invalid: not enough parts or empty parts`);
        }
      }
    }
    
    if (foundCount >= 5) {
      console.log(`\n... (stopping after 5 words for brevity)`);
      break;
    }
  }
}

console.log(`\n=== Summary ===`);
console.log(`Found ${foundCount} valid words in first 100 lines`);


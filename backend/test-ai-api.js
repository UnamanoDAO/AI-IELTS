// 测试 AI API 调用
const AI_API_KEY = 'sk-DmXFvfzgXeRi2FQ8NW44KKKTBLJ6IDz2poHu7DF5ckgl2DWO'
const AI_API_URL = 'https://api.bltcy.ai/v1/chat/completions'
const AI_MODEL = 'gemini-2.5-flash-preview-09-2025' // 使用标准聊天模型

async function testAPI() {
  console.log('测试 AI API...')
  console.log(`模型: ${AI_MODEL}`)
  console.log()
  
  const prompt = `Write an English article about "Natural Geography" with 300-400 words.

Required vocabulary to use: atmosphere, precipitation, erosion, climate, vegetation

Requirements:
- Use at least 5 words from the vocabulary list
- Keep other words simple and easy to understand
- Write in an academic or popular science style
- Make 3-4 paragraphs
- Be natural and coherent

Output only the article content, no title or extra text.`

  console.log('Prompt:')
  console.log(prompt)
  console.log('\n发送请求...\n')
  
  try {
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    console.log(`响应状态: ${response.status} ${response.statusText}`)
    
    const data = await response.json()
    console.log('\n完整响应:')
    console.log(JSON.stringify(data, null, 2))
    
    if (data.choices && data.choices[0]) {
      const content = data.choices[0].message.content
      console.log('\n\n生成的内容:')
      console.log('='.repeat(60))
      console.log(content)
      console.log('='.repeat(60))
      console.log(`\n内容长度: ${content.length} 字符`)
      console.log(`词数: ${content.split(/\s+/).length} 词`)
    }
    
  } catch (error) {
    console.error('错误:', error)
  }
}

testAPI()


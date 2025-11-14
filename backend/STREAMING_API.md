# AI助手流式API使用指南

## 概述

流式API使用Server-Sent Events (SSE)技术，可以实时接收AI助手的响应内容，提供更好的用户体验。

## API端点

### 流式聊天接口

**POST** `/api/assistant/chat/stream`

## 请求格式

```json
{
  "message": "用户的问题或消息",
  "conversationHistory": [
    {
      "role": "user",
      "content": "之前的用户消息"
    },
    {
      "role": "assistant",
      "content": "之前的AI回复"
    }
  ],
  "conversationId": 1,  // 可选，继续已有会话
  "userId": "user123"   // 可选，用户标识
}
```

## 响应格式 (SSE事件流)

响应使用`text/event-stream`格式，包含以下类型的事件：

### 1. 开始事件
```
data: {"type":"start","conversationId":1}
```

### 2. 内容块事件（多次）
```
data: {"type":"chunk","content":"你"}

data: {"type":"chunk","content":"好"}

data: {"type":"chunk","content":"，"}
```

### 3. 完成事件
```
data: {"type":"done","taskId":"abc123","audioUrl":"https://...","conversationId":1}
```

### 4. 错误事件
```
data: {"type":"error","error":"错误信息"}
```

## 前端使用示例

### 原生JavaScript (fetch + EventSource不直接支持POST，需用fetch)

```javascript
async function chatWithStream(message, conversationHistory = []) {
  const response = await fetch('/api/assistant/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      conversationHistory
    })
  })

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    const lines = chunk.split('\n')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6))

        switch (data.type) {
          case 'start':
            console.log('开始接收响应, conversationId:', data.conversationId)
            break

          case 'chunk':
            // 实时显示内容
            fullText += data.content
            updateUI(fullText) // 更新UI显示
            break

          case 'done':
            console.log('响应完成')
            console.log('音频任务ID:', data.taskId)
            console.log('音频URL:', data.audioUrl)
            break

          case 'error':
            console.error('错误:', data.error)
            break
        }
      }
    }
  }
}
```

### Vue 3 示例

```javascript
import { ref } from 'vue'

export function useChatStream() {
  const messages = ref([])
  const isStreaming = ref(false)

  async function sendMessage(message, conversationHistory = []) {
    isStreaming.value = true

    // 添加用户消息
    messages.value.push({
      role: 'user',
      content: message
    })

    // 创建AI消息占位
    const aiMessageIndex = messages.value.length
    messages.value.push({
      role: 'assistant',
      content: '',
      isStreaming: true
    })

    try {
      const response = await fetch('/api/assistant/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, conversationHistory })
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))

            if (data.type === 'chunk') {
              // 实时更新AI消息内容
              messages.value[aiMessageIndex].content += data.content
            } else if (data.type === 'done') {
              messages.value[aiMessageIndex].isStreaming = false
              messages.value[aiMessageIndex].audioUrl = data.audioUrl
              messages.value[aiMessageIndex].taskId = data.taskId
            } else if (data.type === 'error') {
              throw new Error(data.error)
            }
          }
        }
      }
    } catch (error) {
      console.error('流式聊天错误:', error)
      messages.value[aiMessageIndex].error = error.message
    } finally {
      isStreaming.value = false
    }
  }

  return {
    messages,
    isStreaming,
    sendMessage
  }
}
```

### React 示例

```javascript
import { useState } from 'react'

function ChatComponent() {
  const [messages, setMessages] = useState([])
  const [isStreaming, setIsStreaming] = useState(false)

  const sendMessage = async (message) => {
    setIsStreaming(true)

    // 添加用户消息
    setMessages(prev => [...prev, { role: 'user', content: message }])

    // AI消息
    const aiMessageId = Date.now()
    setMessages(prev => [...prev, {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      isStreaming: true
    }])

    try {
      const response = await fetch('/api/assistant/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationHistory: messages
        })
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))

            if (data.type === 'chunk') {
              setMessages(prev => prev.map(msg =>
                msg.id === aiMessageId
                  ? { ...msg, content: msg.content + data.content }
                  : msg
              ))
            } else if (data.type === 'done') {
              setMessages(prev => prev.map(msg =>
                msg.id === aiMessageId
                  ? { ...msg, isStreaming: false, audioUrl: data.audioUrl }
                  : msg
              ))
            }
          }
        }
      }
    } catch (error) {
      console.error('流式聊天错误:', error)
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    // ... UI组件
  )
}
```

## 非流式API（向后兼容）

如果不需要流式响应，仍可使用原有的非流式接口：

**POST** `/api/assistant/chat`

响应格式：
```json
{
  "success": true,
  "data": {
    "text": "AI的完整回复",
    "audioUrl": "https://...",
    "taskId": "abc123",
    "conversationId": 1
  }
}
```

## 性能优化建议

1. **流式渲染**：使用虚拟滚动或增量渲染避免大量文本更新导致的性能问题
2. **防抖处理**：对快速到达的chunk进行批量处理
3. **错误重试**：网络中断时提供重试机制
4. **音频延迟加载**：音频通过taskId异步查询，避免阻塞文本显示

## 注意事项

- SSE连接会保持打开直到响应完成，注意处理连接超时
- 音频生成是异步的，通过`taskId`查询音频状态
- 数据库保存在流式响应完成后进行
- 适合长文本响应，短文本可继续使用非流式API

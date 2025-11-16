<template>
  <div class="ielts-assistant">
    <!-- 悬浮按钮 -->
    <transition name="bounce">
      <div
        v-if="!isChatOpen"
        class="assistant-bubble"
        @click="toggleChat"
        :class="{ pulse: !hasInteracted }"
      >
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <div class="badge" v-if="unreadCount > 0">{{ unreadCount }}</div>
      </div>
    </transition>

    <!-- 聊天窗口 -->
    <transition name="slide-up">
      <div v-if="isChatOpen" class="chat-window">
        <!-- 头部 -->
        <div class="chat-header">
          <div class="header-content">
            <div class="assistant-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div class="title-area">
              <h3>雅思助手</h3>
              <p class="subtitle">IELTS Learning Assistant</p>
            </div>
          </div>
          <button class="close-btn" @click="toggleChat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 消息列表 -->
        <div class="messages-container" ref="messagesContainer">
          <div v-if="messages.length === 0" class="welcome-message">
            <div class="welcome-icon">👋</div>
            <h4>你好！我是你的雅思学习助手</h4>
            <p>有什么关于雅思学习的问题都可以问我哦~</p>
            <div class="quick-questions">
              <button
                v-for="(q, idx) in quickQuestions"
                :key="idx"
                @click="sendMessage(q)"
                class="quick-btn"
              >
                {{ q }}
              </button>
            </div>
          </div>

          <div v-for="(msg, index) in messages" :key="index" class="message" :class="msg.role">
            <div class="message-avatar" v-if="msg.role === 'assistant'">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
            </div>
            <div class="message-content">
              <div class="message-text" v-html="formatMessage(msg.content)"></div>
              <div class="message-footer">
                <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
                <div v-if="msg.role === 'assistant' && (msg.audioUrl || msg.isGeneratingAudio)" class="audio-player-container">
                  <!-- 音频生成中 -->
                  <div v-if="msg.isGeneratingAudio && !msg.audioUrl" class="audio-generating">
                    <div class="audio-loading-spinner"></div>
                    <span class="audio-generating-text">音频生成中...</span>
                  </div>
                  <!-- 音频已生成 -->
                  <template v-else-if="msg.audioUrl">
                    <button
                      @click="playAudio(msg.audioUrl, index)"
                      class="audio-btn"
                      :class="{ playing: playingIndex === index }"
                    >
                      <svg v-if="playingIndex !== index" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      <svg v-else viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                      </svg>
                    </button>
                    <div v-if="playingIndex === index" class="audio-progress-container">
                      <div class="audio-progress-bar">
                        <div 
                          class="audio-progress-fill" 
                          :style="{ width: audioProgress + '%' }"
                        ></div>
                      </div>
                      <span class="audio-time">
                        {{ formatAudioTime(currentTime) }} / {{ formatAudioTime(duration) }}
                      </span>
                    </div>
                  </template>
                </div>
              </div>
            </div>
            <div class="message-avatar" v-if="msg.role === 'user'">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
          </div>

          <div v-if="isLoading" class="message assistant">
            <div class="message-avatar">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
            </div>
            <div class="message-content">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-container">
          <button
            class="voice-btn"
            @mousedown="startRecording"
            @mouseup="stopRecording"
            @touchstart="startRecording"
            @touchend="stopRecording"
            :class="{ recording: isRecording }"
            :disabled="isLoading"
          >
            <svg v-if="!isRecording" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="8"/>
            </svg>
          </button>

          <textarea
            ref="messageInput"
            v-model="inputMessage"
            @keydown.enter.exact.prevent="sendTextMessage"
            @input="adjustTextareaHeight"
            placeholder="输入你的问题..."
            :disabled="isLoading"
            class="message-input"
            rows="1"
          ></textarea>

          <button
            @click="sendTextMessage"
            :disabled="!inputMessage.trim() || isLoading"
            class="send-btn"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>
    </transition>

    <!-- 音频播放器（隐藏） -->
    <audio ref="audioPlayer" @ended="onAudioEnded"></audio>
  </div>
</template>

<script>
import { ref, onMounted, nextTick, watch } from 'vue'
import api from '@/api'

export default {
  name: 'IELTSAssistant',
  setup() {
    const isChatOpen = ref(false)
    const hasInteracted = ref(false)
    const unreadCount = ref(0)
    const messages = ref([])
    const inputMessage = ref('')
    const isLoading = ref(false)
    const isRecording = ref(false)
    const playingIndex = ref(null)
    const messagesContainer = ref(null)
    const audioPlayer = ref(null)
    const audioProgress = ref(0)
    const currentTime = ref(0)
    const duration = ref(0)
    const messageInput = ref(null)
    const generatingAudio = ref(new Set()) // 正在生成音频的消息索引
    const currentConversationId = ref(null) // 当前会话ID
    const isLoadingHistory = ref(false) // 是否正在加载历史记录

    let mediaRecorder = null
    let audioChunks = []

    const quickQuestions = [
      'accumulate 是什么意思?',
      '如何提高雅思阅读速度?',
      '雅思写作有什么技巧?'
    ]

    // 使用统一的 API 客户端，会自动处理代理

    // 加载聊天历史
    const loadChatHistory = async () => {
      if (isLoadingHistory.value) return

      isLoadingHistory.value = true
      try {
        const data = await api.get('/assistant/history', {
          params: {
            conversationId: currentConversationId.value
          }
        })

        if (data.success && data.data.messages) {
          // 如果有历史记录，替换当前消息列表
          if (data.data.messages.length > 0) {
            messages.value = data.data.messages
            currentConversationId.value = data.data.conversationId
            nextTick(() => {
              scrollToBottom()
            })
          }
        }
      } catch (error) {
        console.error('加载聊天历史失败:', error)
      } finally {
        isLoadingHistory.value = false
      }
    }

    // 切换聊天窗口
    const toggleChat = () => {
      const wasOpen = isChatOpen.value
      isChatOpen.value = !isChatOpen.value
      hasInteracted.value = true
      
      if (isChatOpen.value) {
        unreadCount.value = 0
        // 打开窗口时加载历史记录
        if (!wasOpen) {
          loadChatHistory()
        }
        nextTick(() => {
          scrollToBottom()
        })
      }
    }

    // 格式化消息（支持markdown）
    const formatMessage = (text) => {
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
    }

    // 格式化时间
    const formatTime = (timestamp) => {
      const date = new Date(timestamp)
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }

    // 滚动到底部
    const scrollToBottom = async () => {
      await nextTick()
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    }

    // 发送文字消息
    const sendTextMessage = async () => {
      const text = inputMessage.value.trim()
      if (!text || isLoading.value) return

      await sendMessage(text)
      inputMessage.value = ''
    }

    // 调整textarea高度
    const adjustTextareaHeight = () => {
      nextTick(() => {
        if (messageInput.value) {
          messageInput.value.style.height = 'auto'
          const maxHeight = 120 // 最大高度（约5行）
          const newHeight = Math.min(messageInput.value.scrollHeight, maxHeight)
          messageInput.value.style.height = `${newHeight}px`
        }
      })
    }

    // 检查音频生成状态
    const checkAudioGenerationStatus = async (messageIndex, taskId) => {
      const maxAttempts = 100 // 最多检查100次（约5分钟）
      let attempts = 0
      
      const checkStatus = async () => {
        if (attempts >= maxAttempts) {
          generatingAudio.value.delete(messageIndex)
          if (messages.value[messageIndex]) {
            messages.value[messageIndex].isGeneratingAudio = false
          }
          console.warn('音频生成超时')
          return
        }
        
        try {
          const data = await api.get(`/assistant/audio-status/${taskId}`)

          if (data.success && data.data.audioUrl) {
            // 音频生成完成
            if (messages.value[messageIndex]) {
              messages.value[messageIndex].audioUrl = data.data.audioUrl
              messages.value[messageIndex].isGeneratingAudio = false
            }
            generatingAudio.value.delete(messageIndex)
            console.log('✅ 音频生成完成')
          } else if (data.data.status === 'RUNNING' || data.data.status === 'QUEUEING') {
            // 还在生成中，继续等待
            attempts++
            setTimeout(checkStatus, 3000) // 3秒后再次检查
          } else if (data.data.status === 'FAILED') {
            // 生成失败
            generatingAudio.value.delete(messageIndex)
            if (messages.value[messageIndex]) {
              messages.value[messageIndex].isGeneratingAudio = false
            }
            console.error('音频生成失败')
          }
        } catch (error) {
          console.error('检查音频状态失败:', error)
          attempts++
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 5000) // 5秒后重试
          } else {
            generatingAudio.value.delete(messageIndex)
            if (messages.value[messageIndex]) {
              messages.value[messageIndex].isGeneratingAudio = false
            }
          }
        }
      }
      
      // 首次检查延迟3秒
      setTimeout(checkStatus, 3000)
    }

    // 发送消息（核心函数）
    const sendMessage = async (text) => {
      // 添加用户消息
      messages.value.push({
        role: 'user',
        content: text,
        timestamp: Date.now()
      })
      scrollToBottom()

      // 重置输入框高度
      if (messageInput.value) {
        messageInput.value.style.height = 'auto'
      }

      isLoading.value = true

      try {
        // 构建对话历史
        const conversationHistory = messages.value.slice(0, -1).map(msg => ({
          role: msg.role,
          content: msg.content
        }))

        // 调用AI API (设置120秒超时,因为思考模型需要较长时间)
        const data = await api.post('/assistant/chat', {
          message: text,
          conversationHistory,
          conversationId: currentConversationId.value
        }, {
          timeout: 120000 // 120秒超时
        })

        const assistantMessage = data.data
        const messageIndex = messages.value.length
        
        // 更新会话ID
        if (assistantMessage.conversationId) {
          currentConversationId.value = assistantMessage.conversationId
        }
        
        // 先添加文字回复（立即显示）
        messages.value.push({
          role: 'assistant',
          content: assistantMessage.text,
          audioUrl: assistantMessage.audioUrl || null,
          isGeneratingAudio: !assistantMessage.audioUrl && !!assistantMessage.taskId, // 如果还没有音频URL但有taskId，标记为正在生成
          timestamp: Date.now()
        })
        
        scrollToBottom()

        // 如果音频还在生成中，显示加载状态并轮询检查
        if (!assistantMessage.audioUrl && assistantMessage.taskId) {
          generatingAudio.value.add(messageIndex)
          checkAudioGenerationStatus(messageIndex, assistantMessage.taskId)
        } else if (assistantMessage.audioUrl) {
          // 音频已生成，直接可用
          generatingAudio.value.delete(messageIndex)
        }

        // 如果窗口未打开，增加未读计数
        if (!isChatOpen.value) {
          unreadCount.value++
        }
      } catch (error) {
        console.error('发送消息失败:', error)
        messages.value.push({
          role: 'assistant',
          content: '抱歉，我暂时无法回答。请稍后再试。',
          timestamp: Date.now()
        })
        scrollToBottom()
      } finally {
        isLoading.value = false
      }
    }

    // 开始录音
    const startRecording = async () => {
      if (isLoading.value) return

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

        // 使用适合的MIME类型
        const mimeType = MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4'

        mediaRecorder = new MediaRecorder(stream, { mimeType })
        audioChunks = []

        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data)
        }

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: mimeType })
          await sendVoiceMessage(audioBlob)

          // 停止所有音轨
          stream.getTracks().forEach(track => track.stop())
        }

        mediaRecorder.start()
        isRecording.value = true
      } catch (error) {
        console.error('录音失败:', error)
        alert('无法访问麦克风，请检查浏览器权限')
      }
    }

    // 停止录音
    const stopRecording = () => {
      if (mediaRecorder && isRecording.value) {
        mediaRecorder.stop()
        isRecording.value = false
      }
    }

    // 发送语音消息
    const sendVoiceMessage = async (audioBlob) => {
      isLoading.value = true

      try {
        // 1. 先将语音转文字
        const formData = new FormData()
        formData.append('audio', audioBlob, 'voice.webm')

        const data = await api.post(
          '/assistant/speech-to-text',
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' }
          }
        )

        // API 拦截器已经处理了 response.data，所以 data 就是 { success, text }
        const recognizedText = data.text || data.data?.text

        // 2. 发送识别的文字
        await sendMessage(recognizedText)
      } catch (error) {
        console.error('语音识别失败:', error)
        messages.value.push({
          role: 'assistant',
          content: '抱歉，无法识别您的语音。请尝试文字输入。',
          timestamp: Date.now()
        })
        scrollToBottom()
      } finally {
        isLoading.value = false
      }
    }

    // 格式化音频时间
    const formatAudioTime = (seconds) => {
      if (!seconds || isNaN(seconds)) return '0:00'
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // 更新音频进度
    const updateAudioProgress = () => {
      if (audioPlayer.value) {
        currentTime.value = audioPlayer.value.currentTime || 0
        duration.value = audioPlayer.value.duration || 0
        if (duration.value > 0) {
          audioProgress.value = (currentTime.value / duration.value) * 100
        }
      }
    }

    // 播放音频
    const playAudio = (url, index) => {
      if (playingIndex.value === index) {
        audioPlayer.value.pause()
        playingIndex.value = null
        audioProgress.value = 0
        currentTime.value = 0
      } else {
        // 停止当前播放
        if (audioPlayer.value) {
          audioPlayer.value.pause()
        }
        
        // 设置新音频
        audioPlayer.value.src = url
        audioPlayer.value.currentTime = 0
        
        // 监听音频事件
        audioPlayer.value.onloadedmetadata = () => {
          duration.value = audioPlayer.value.duration || 0
        }
        
        audioPlayer.value.ontimeupdate = updateAudioProgress
        audioPlayer.value.onended = onAudioEnded
        
        // 播放
        audioPlayer.value.play().then(() => {
          playingIndex.value = index
        }).catch(err => {
          console.error('播放音频失败:', err)
        })
      }
    }

    // 音频播放结束
    const onAudioEnded = () => {
      playingIndex.value = null
      audioProgress.value = 0
      currentTime.value = 0
    }

    // 监听消息变化，如果是assistant消息且窗口未打开，自动播放
    watch(messages, (newMessages) => {
      const lastMessage = newMessages[newMessages.length - 1]
      if (lastMessage && lastMessage.role === 'assistant' && lastMessage.audioUrl && !isChatOpen.value) {
        playAudio(lastMessage.audioUrl, newMessages.length - 1)
      }
    }, { deep: true })

    return {
      isChatOpen,
      hasInteracted,
      unreadCount,
      messages,
      inputMessage,
      isLoading,
      isRecording,
      playingIndex,
      messagesContainer,
      audioPlayer,
      quickQuestions,
      toggleChat,
      formatMessage,
      formatTime,
      sendTextMessage,
      sendMessage,
      startRecording,
      stopRecording,
      playAudio,
      onAudioEnded,
      audioProgress,
      currentTime,
      duration,
      formatAudioTime,
      adjustTextareaHeight,
      messageInput,
      loadChatHistory,
      currentConversationId
    }
  }
}
</script>

<style scoped>
.ielts-assistant {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 悬浮球 */
.assistant-bubble {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #EDB01D;
  color: #21232A;
  box-shadow: 0 4px 20px rgba(237, 176, 29, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.assistant-bubble::before {
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

.assistant-bubble:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 25px rgba(237, 176, 29, 0.4);
}

.assistant-bubble:hover::before {
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 2px,
    rgba(33, 35, 42, 0.2) 2px,
    rgba(33, 35, 42, 0.2) 4px
  );
}

.assistant-bubble .icon {
  width: 30px;
  height: 30px;
  color: #21232A;
  position: relative;
  z-index: 1;
}

.assistant-bubble .badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.assistant-bubble.pulse {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }
  50% {
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
  }
}

/* 聊天窗口 */
.chat-window {
  width: 380px;
  height: 600px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  background: #EDB01D;
  color: #21232A;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}

.chat-header::before {
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
    rgba(33, 35, 42, 0.08) 2px,
    rgba(33, 35, 42, 0.08) 4px
  );
  pointer-events: none;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.assistant-avatar {
  width: 40px;
  height: 40px;
  background: rgba(33, 35, 42, 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.assistant-avatar svg {
  width: 24px;
  height: 24px;
}

.title-area h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  position: relative;
  z-index: 1;
}

.title-area .subtitle {
  margin: 0;
  font-size: 12px;
  opacity: 0.9;
  position: relative;
  z-index: 1;
}

.close-btn {
  background: none;
  border: none;
  color: #21232A;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
  position: relative;
  z-index: 1;
}

.close-btn:hover {
  background: rgba(33, 35, 42, 0.15);
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

/* 消息容器 */
.messages-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px;
  background: #F5EDE4;
}

.welcome-message {
  text-align: center;
  padding: 40px 20px;
}

.welcome-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.welcome-message h4 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #333;
}

.welcome-message p {
  margin: 0 0 24px 0;
  color: #666;
  font-size: 14px;
}

.quick-questions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quick-btn {
  background: white;
  border: 1px solid #e0e0e0;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #2B82AC;
  transition: all 0.2s;
}

.quick-btn:hover {
  background: rgba(237, 176, 29, 0.08);
  border-color: #EDB01D;
  color: #EDB01D;
}

/* 消息气泡 */
.message {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
}

.message.user .message-avatar {
  background: #EDB01D;
  color: #21232A;
}

.message.assistant .message-avatar {
  background: #e0e0e0;
  color: #666;
}

.message-avatar svg {
  width: 100%;
  height: 100%;
  padding: 6px;
}

.message-content {
  max-width: 70%;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.message.user .message-content {
  background: #EDB01D;
  color: #21232A;
  border-radius: 16px 16px 4px 16px;
}

.message.assistant .message-content {
  background: white;
  color: #333;
  border-radius: 16px 16px 16px 4px;
}

.message-text {
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.message-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 16px 8px;
  font-size: 11px;
  opacity: 0.7;
}

.audio-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
  color: inherit;
}

.audio-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.audio-btn svg {
  width: 16px;
  height: 16px;
}

.audio-btn.playing {
  color: #EDB01D;
}

.audio-player-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.audio-progress-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.audio-progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  overflow: hidden;
  min-width: 60px;
}

.audio-progress-fill {
  height: 100%;
  background: #EDB01D;
  border-radius: 2px;
  transition: width 0.1s linear;
}

.audio-time {
  font-size: 10px;
  color: #666;
  white-space: nowrap;
  min-width: 50px;
  text-align: right;
}

.audio-generating {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  color: #EDB01D;
  font-size: 12px;
}

.audio-loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(237, 176, 29, 0.2);
  border-top-color: #EDB01D;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.audio-generating-text {
  font-size: 11px;
  color: #EDB01D;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 输入中指示器 */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #999;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-8px);
  }
}

/* 输入区域 */
.input-container {
  display: flex;
  gap: 8px;
  padding: 16px;
  background: white;
  border-top: 1px solid #e0e0e0;
}

.voice-btn {
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  flex-shrink: 0;
  border-radius: 50%;
  border: none;
  background: #f5f5f5;
  color: #2B82AC;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.voice-btn:hover:not(:disabled) {
  background: #e8e8e8;
}

.voice-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.voice-btn.recording {
  background: #ff4757;
  color: white;
  animation: recordPulse 1s ease-in-out infinite;
}

@keyframes recordPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.4);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(255, 71, 87, 0);
  }
}

.voice-btn svg {
  width: 20px;
  height: 20px;
}

.message-input {
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  padding: 10px 16px;
  font-size: 14px;
  resize: none;
  overflow-y: auto;
  min-height: 40px;
  max-height: 120px;
  line-height: 1.5;
  font-family: inherit;
  outline: none;
  transition: border 0.2s;
}

.message-input:focus {
  border-color: #EDB01D;
}

.send-btn {
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  flex-shrink: 0;
  border-radius: 50%;
  border: none;
  background: #21232A;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.send-btn::before {
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
    rgba(255, 255, 255, 0.05) 2px,
    rgba(255, 255, 255, 0.05) 4px
  );
  pointer-events: none;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(33, 35, 42, 0.3);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn svg {
  width: 20px;
  height: 20px;
  position: relative;
  z-index: 1;
}

/* 过渡动画 */
.bounce-enter-active {
  animation: bounce-in 0.5s;
}

.bounce-leave-active {
  animation: bounce-out 0.3s;
}

@keyframes bounce-in {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes bounce-out {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0);
    opacity: 0;
  }
}

.slide-up-enter-active {
  animation: slide-up 0.3s ease-out;
}

.slide-up-leave-active {
  animation: slide-down 0.3s ease-in;
}

@keyframes slide-up {
  0% {
    transform: translateY(100%);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slide-down {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(100%);
    opacity: 0;
  }
}

/* 响应式 */
@media (max-width: 480px) {
  .chat-window {
    width: calc(100vw - 40px);
    height: calc(100vh - 100px);
  }
}
</style>

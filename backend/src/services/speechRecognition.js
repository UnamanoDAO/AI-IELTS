import Nls from 'alibabacloud-nls'
import RPCClient from '@alicloud/pop-core'
import dotenv from 'dotenv'

dotenv.config()

const ALIYUN_ACCESS_KEY_ID = process.env.ALIYUN_ACCESS_KEY_ID
const ALIYUN_ACCESS_KEY_SECRET = process.env.ALIYUN_ACCESS_KEY_SECRET
const ALIYUN_APP_KEY = process.env.ALIYUN_TTS_APP_KEY

const URL = 'wss://nls-gateway-cn-shanghai.aliyuncs.com/ws/v1'

let cachedToken = null
let tokenExpireTime = 0

// 获取NLS Token
async function getNLSToken() {
  // 如果token未过期，直接返回
  if (cachedToken && Date.now() < tokenExpireTime) {
    return cachedToken
  }

  const regions = ['cn-shanghai', 'cn-beijing']

  for (const region of regions) {
    try {
      console.log(`正在从 ${region} 获取 NLS Token...`)

      const client = new RPCClient({
        accessKeyId: ALIYUN_ACCESS_KEY_ID,
        accessKeySecret: ALIYUN_ACCESS_KEY_SECRET,
        endpoint: `https://nls-meta.${region}.aliyuncs.com`,
        apiVersion: '2019-02-28',
        opts: { timeout: 10000 }
      })

      const result = await client.request('CreateToken')

      if (result && result.Token && result.Token.Id) {
        cachedToken = result.Token.Id
        const expireTime = result.Token.ExpireTime || 3600
        // 提前5分钟过期
        tokenExpireTime = Date.now() + expireTime * 1000 - 5 * 60 * 1000
        console.log(`✓ Token 获取成功 (区域: ${region})`)
        return cachedToken
      }
    } catch (error) {
      console.error(`从 ${region} 获取 Token 失败:`, error.message)
      // 继续尝试下一个区域
    }
  }

  throw new Error('所有区域获取 Token 都失败了')
}

/**
 * 将音频buffer转换为PCM格式（如果需要）
 * 这是一个简化版本，实际项目中可能需要使用ffmpeg等工具进行更复杂的转换
 */
function convertToPCM(audioBuffer) {
  // 如果前端已经发送PCM格式，直接返回
  // 否则这里需要进行格式转换
  return audioBuffer
}

/**
 * 语音转文字
 * @param {Buffer} audioBuffer - 音频数据buffer
 * @returns {Promise<string>} - 识别的文字
 */
export async function speechToText(audioBuffer) {
  return new Promise(async (resolve, reject) => {
    try {
      const token = await getNLSToken()

      const sr = new Nls.SpeechRecognition({
        url: URL,
        appkey: ALIYUN_APP_KEY,
        token: token
      })

      let recognizedText = ''
      let hasError = false

      // 监听识别开始
      sr.on('started', (msg) => {
        console.log('语音识别已开始:', msg)
      })

      // 监听中间结果
      sr.on('changed', (msg) => {
        console.log('识别中间结果:', msg)
        try {
          const data = JSON.parse(msg)
          if (data.payload && data.payload.result) {
            recognizedText = data.payload.result
          }
        } catch (e) {
          console.error('解析中间结果失败:', e)
        }
      })

      // 监听识别完成
      sr.on('completed', (msg) => {
        console.log('语音识别完成:', msg)
        try {
          const data = JSON.parse(msg)
          if (data.payload && data.payload.result) {
            recognizedText = data.payload.result
          }
          if (!hasError) {
            resolve(recognizedText || '未识别到内容')
          }
        } catch (e) {
          console.error('解析完成结果失败:', e)
          if (!hasError) {
            hasError = true
            reject(new Error('解析识别结果失败'))
          }
        }
      })

      // 监听连接关闭
      sr.on('closed', () => {
        console.log('语音识别连接已关闭')
      })

      // 监听错误
      sr.on('failed', (msg) => {
        console.error('语音识别失败:', msg)
        if (!hasError) {
          hasError = true
          reject(new Error(`语音识别失败: ${msg}`))
        }
      })

      // 开始识别
      const params = sr.defaultStartParams()
      params.format = 'pcm' // 音频格式
      params.sample_rate = 16000 // 采样率
      params.enable_intermediate_result = true
      params.enable_punctuation_prediction = true
      params.enable_inverse_text_normalization = true

      await sr.start(params, true, 6000)

      // 转换音频格式（如果需要）
      const pcmBuffer = convertToPCM(audioBuffer)

      // 分块发送音频数据
      const chunkSize = 1024
      for (let i = 0; i < pcmBuffer.length; i += chunkSize) {
        const chunk = pcmBuffer.slice(i, Math.min(i + chunkSize, pcmBuffer.length))
        if (!sr.sendAudio(chunk)) {
          throw new Error('发送音频数据失败')
        }
        // 模拟实时发送，稍微延迟
        await new Promise(resolve => setTimeout(resolve, 20))
      }

      // 关闭识别
      await sr.close()

      // 设置超时，防止一直等待
      setTimeout(() => {
        if (!hasError && !recognizedText) {
          hasError = true
          reject(new Error('语音识别超时'))
        }
      }, 30000) // 30秒超时
    } catch (error) {
      console.error('语音识别异常:', error)
      reject(error)
    }
  })
}

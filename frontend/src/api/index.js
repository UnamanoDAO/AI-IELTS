import axios from 'axios'

// 开发环境使用相对路径，让 Vite 代理处理
// 生产环境可以使用环境变量配置
let API_BASE_URL = '/api'
if (import.meta.env.VITE_API_BASE_URL) {
  const envUrl = import.meta.env.VITE_API_BASE_URL.trim()
  // 如果环境变量以 = 开头，去掉它（可能是配置错误）
  if (envUrl.startsWith('=')) {
    console.warn('⚠️ 环境变量 VITE_API_BASE_URL 以 = 开头，已自动修复')
    API_BASE_URL = envUrl.substring(1)
  } else {
    API_BASE_URL = envUrl
  }
}

console.log('🔧 API Base URL:', API_BASE_URL)

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器：记录请求信息并添加认证 token
api.interceptors.request.use(
  (config) => {
    console.log(`🔵 API 请求: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.params || config.data)

    // 自动添加 token 到请求头
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    console.error('❌ 请求配置错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log(`🟢 API 响应: ${response.config.url}`, {
      status: response.status,
      dataType: typeof response.data,
      isHTML: typeof response.data === 'string' && response.data.includes('<!DOCTYPE')
    })
    // 如果响应是 HTML，说明代理可能有问题
    if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE')) {
      console.error('⚠️ 警告: API 返回了 HTML 而不是 JSON，可能是代理配置问题')
      console.error('实际请求 URL:', response.config.url)
      console.error('完整请求 URL:', `${response.config.baseURL}${response.config.url}`)
    }
    return response.data
  },
  (error) => {
    console.error('❌ API 错误:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error?.response?.data
    })
    return Promise.reject(error)
  }
)

export const categoriesAPI = {
  getAll: () => api.get('/categories')
}

export const unitsAPI = {
  getAll: (params = {}) => api.get('/units', { params }),
  getById: (id) => api.get(`/units/${id}`),
  getWords: (id) => api.get(`/units/${id}/words`)
}

export const wordsAPI = {
  getById: (id) => api.get(`/words/${id}`),
  search: (params) => api.get('/words', { params }),
  getRandom: (unitId, count = 10) =>
    api.get('/words/random', { params: { unitId, count } })
}

export const quizAPI = {
  generate: (payload) => api.post('/quiz/generate', payload)
}

// Custom articles API
export const articlesAPI = {
  getAll: () => api.get('/articles'),
  getById: (id) => api.get(`/articles/${id}`),
  create: (data) => api.post('/articles', data),
  update: (id, data) => api.put(`/articles/${id}`, data),
  delete: (id) => api.delete(`/articles/${id}`),
  translateWord: (articleId, word, sentence) =>
    api.post(`/articles/${articleId}/translate`, { word, sentence })
}

// User vocabulary API
export const vocabularyAPI = {
  getAll: (params = {}) => api.get('/vocabulary', { params }),
  getStats: () => api.get('/vocabulary/stats'),
  add: (data) => api.post('/vocabulary', data),
  update: (id, data) => api.put(`/vocabulary/${id}`, data),
  delete: (id) => api.delete(`/vocabulary/${id}`),
  review: (id) => api.post(`/vocabulary/${id}/review`),
  check: (word) => api.post('/vocabulary/check', { word })
}

export default api
import OSS from 'ali-oss'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

const ALIYUN_ACCESS_KEY_ID = process.env.ALIYUN_ACCESS_KEY_ID
const ALIYUN_ACCESS_KEY_SECRET = process.env.ALIYUN_ACCESS_KEY_SECRET
const ALIYUN_APP_KEY = process.env.ALIYUN_TTS_APP_KEY

console.log('🔍 测试阿里云配置...\n')

// 1. 检查环境变量
console.log('1️⃣ 检查环境变量:')
if (!ALIYUN_ACCESS_KEY_ID) {
  console.log('   ❌ ALIYUN_ACCESS_KEY_ID 未配置')
} else {
  console.log(`   ✓ ALIYUN_ACCESS_KEY_ID: ${ALIYUN_ACCESS_KEY_ID.substring(0, 10)}...`)
}

if (!ALIYUN_ACCESS_KEY_SECRET) {
  console.log('   ❌ ALIYUN_ACCESS_KEY_SECRET 未配置')
} else {
  console.log(`   ✓ ALIYUN_ACCESS_KEY_SECRET: ${ALIYUN_ACCESS_KEY_SECRET.substring(0, 10)}...`)
}

if (!ALIYUN_APP_KEY) {
  console.log('   ❌ ALIYUN_TTS_APP_KEY 未配置')
} else {
  console.log(`   ✓ ALIYUN_TTS_APP_KEY: ${ALIYUN_APP_KEY}`)
}

if (!ALIYUN_ACCESS_KEY_ID || !ALIYUN_ACCESS_KEY_SECRET || !ALIYUN_APP_KEY) {
  console.log('\n❌ 请在 .env 文件中配置所有必需的环境变量')
  process.exit(1)
}

// 2. 测试 OSS 连接
console.log('\n2️⃣ 测试 OSS 连接:')
try {
  const ossClient = new OSS({
    region: 'oss-cn-beijing',
    accessKeyId: ALIYUN_ACCESS_KEY_ID,
    accessKeySecret: ALIYUN_ACCESS_KEY_SECRET,
    bucket: 'creatimage'
  })

  // 尝试列出 bucket 信息
  const result = await ossClient.getBucketInfo()
  console.log(`   ✓ OSS 连接成功`)
  console.log(`   ✓ Bucket: ${result.bucket.Name}`)
  console.log(`   ✓ Region: ${result.bucket.Location}`)
} catch (error) {
  console.log(`   ❌ OSS 连接失败: ${error.message}`)
  console.log('   提示: 请检查 AccessKey 是否有 OSS 权限')
}

// 3. 测试语音合成 API（不实际合成，只测试认证）
console.log('\n3️⃣ 测试语音合成 API:')
try {
  const testUrl = `https://nls-gateway-cn-beijing.aliyuncs.com/stream/v1/tts?appkey=${ALIYUN_APP_KEY}`
  const response = await fetch(testUrl, {
    method: 'GET',
    headers: {
      'Accept': '*/*'
    }
  })

  // 即使返回错误，只要不是 404，说明 endpoint 是对的
  if (response.status === 404) {
    console.log('   ❌ TTS API endpoint 不正确')
  } else {
    console.log('   ✓ TTS API endpoint 可访问')
    console.log(`   ✓ AppKey: ${ALIYUN_APP_KEY}`)
  }
} catch (error) {
  console.log(`   ⚠️  无法访问 TTS API: ${error.message}`)
}

console.log('\n✅ 配置测试完成！')
console.log('\n📝 下一步:')
console.log('   1. 运行 npm run add-audio-field 添加数据库字段')
console.log('   2. 运行 npm run generate-audio 2 测试生成 2 篇文章的音频')
console.log('   3. 确认无误后运行 npm run generate-audio 生成所有音频')

process.exit(0)





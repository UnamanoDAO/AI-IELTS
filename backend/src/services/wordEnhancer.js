import axios from 'axios'
import pool from '../config/database.js'

const DICTIONARY_ENDPOINT = 'https://api.dictionaryapi.dev/api/v2/entries/en/'
const FALLBACK_MEMORY_TIP = '记忆方法：结合实际语境反复复习，加深印象。'

const COMMON_PREFIXES = [
  { value: 'aero', meaning: '空气、飞行' },
  { value: 'agri', meaning: '田地、农业' },
  { value: 'anti', meaning: '反对、相反' },
  { value: 'aqua', meaning: '水' },
  { value: 'astro', meaning: '星星、太空' },
  { value: 'auto', meaning: '自己、自主' },
  { value: 'bio', meaning: '生命、生物' },
  { value: 'cardio', meaning: '心脏' },
  { value: 'chrono', meaning: '时间' },
  { value: 'circum', meaning: '环绕' },
  { value: 'geo', meaning: '地球、土地' },
  { value: 'hydro', meaning: '水' },
  { value: 'micro', meaning: '微小' },
  { value: 'multi', meaning: '多' },
  { value: 'photo', meaning: '光' },
  { value: 'tele', meaning: '远距离' },
  { value: 'thermo', meaning: '热' },
  { value: 'trans', meaning: '穿越、转变' },
  { value: 'uni', meaning: '单一' },
  { value: 'volcan', meaning: '火山、火焰' }
]

const COMMON_SUFFIXES = [
  { value: 'able', meaning: '能够…的' },
  { value: 'al', meaning: '…的，具有…性质的' },
  { value: 'ance', meaning: '状态、性质' },
  { value: 'ation', meaning: '动作或过程' },
  { value: 'er', meaning: '人或物' },
  { value: 'ful', meaning: '充满…的' },
  { value: 'ic', meaning: '…的，具有…特征' },
  { value: 'ion', meaning: '动作或结果' },
  { value: 'ism', meaning: '主义、现象' },
  { value: 'ist', meaning: '从事…的人' },
  { value: 'ity', meaning: '性质、状态' },
  { value: 'ize', meaning: '使…化' },
  { value: 'logy', meaning: '…学、研究' },
  { value: 'ment', meaning: '行为或结果' },
  { value: 'ous', meaning: '充满…的' }
]

const MANUAL_ENHANCEMENTS = {
  'atmosphere': {
    phonetic: '/ˈætməsfɪr/',
    word_root: 'atmo-(蒸汽,气体) + sphere(球体) = 气体包围的球体 → 大气层',
    memory_tip: "atmosphere可分解为at-mos-phere，想象'在(at)大气层(atmosphere)中感受氛围'"
  },
  'hydrosphere': {
    phonetic: '/ˈhaɪdrəsfɪr/',
    word_root: 'hydro-(水) + sphere(球体) = 水的球体 → 水圈',
    memory_tip: 'hydro-表示水(想想hydrogen氢气)，sphere是球体，地球上的水圈'
  },
  'lithosphere': {
    phonetic: '/ˈlɪθəsfɪr/',
    word_root: 'litho-(岩石) + sphere(球体) = 岩石球体 → 岩石圈',
    memory_tip: 'litho-表示石头(lithograph石版画)，sphere球体，地球的岩石外壳'
  },
  'oxygen': {
    phonetic: '/ˈɑːksɪdʒən/',
    word_root: 'oxy-(酸的) + gen(产生) = 产生酸的元素 → 氧气',
    memory_tip: 'oxygen谐音\'我可生\'，想象氧气让我可以生存'
  },
  'oxide': {
    phonetic: '/ˈɑːksaɪd/',
    word_root: 'oxy-(氧) + ide(化合物) = 氧的化合物 → 氧化物',
    memory_tip: 'oxide就是oxygen去掉gen加ide，氧气的化合物'
  },
  'carbon dioxide': {
    phonetic: '/ˌkɑːrbən daɪˈɑːksaɪd/',
    word_root: 'carbon(碳) + di-(二) + oxide(氧化物) = 二氧化碳',
    memory_tip: 'carbon是碳，dioxide是二氧化物(di-表示2)，合起来就是CO₂'
  },
  'hydrogen': {
    phonetic: '/ˈhaɪdrədʒən/',
    word_root: 'hydro-(水) + gen(产生) = 产生水的元素 → 氢气',
    memory_tip: 'hydro-水 + gen产生，氢气燃烧生成水，产水的元素'
  },
  'core': {
    phonetic: '/kɔːr/',
    word_root: 'cor-(心脏,中心) = 核心,地核',
    memory_tip: "core谐音'靠',地核就是地球最'靠'里面的核心部分"
  },
  'crust': {
    phonetic: '/krʌst/',
    word_root: 'crust(硬皮,外壳) = 地壳',
    memory_tip: '面包的crust是硬皮外壳，地球的crust是地壳外壳'
  },
  'mantle': {
    phonetic: '/ˈmæntl/',
    word_root: 'mantle(斗篷,覆盖物) = 地幔',
    memory_tip: 'mantle像披在地核外的一层斗篷，就是地幔层'
  },
  'longitude': {
    phonetic: '/ˈlɑːndʒɪtuːd/',
    word_root: 'long-(长) + itude(名词后缀) = 长度 → 经度',
    memory_tip: 'longitude有long(长)，经线是纵向的长线'
  },
  'latitude': {
    phonetic: '/ˈlætɪtuːd/',
    word_root: 'lat-(宽) + itude(名词后缀) = 宽度 → 纬度',
    memory_tip: 'latitude有lat(宽的词根)，纬线是横向宽度的线'
  },
  'horizon': {
    phonetic: '/həˈraɪzn/',
    word_root: 'horiz-(界限) + on(名词后缀) = 地平线,视野',
    memory_tip: "horizon谐音'好rise(升起)'，太阳从地平线升起"
  },
  'altitude': {
    phonetic: '/ˈæltɪtuːd/',
    word_root: 'alt-(高) + itude(名词后缀) = 高度',
    memory_tip: 'altitude有alt(高的词根，如altar祭坛在高处)，海拔高度'
  },
  'disaster': {
    phonetic: '/dɪˈzæstər/',
    word_root: 'dis-(坏) + aster(星) = 星相不好 → 灾难',
    memory_tip: "disaster有dis-(坏)前缀，古人认为星相(aster)不好会带来灾难"
  },
  'mishap': {
    phonetic: '/ˈmɪshæp/',
    word_root: 'mis-(坏,错) + hap(运气,机会) = 坏运气 → 小灾难',
    memory_tip: "mishap = mis(错) + hap(happen发生)，不好的事情发生了"
  },
  'catastrophic': {
    phonetic: '/ˌkætəˈstrɑːfɪk/',
    word_root: 'cata-(向下) + strophe(转) + ic(形容词) = 急转直下的 → 灾难性的',
    memory_tip: 'catastrophic很长很可怕，就像灾难catastrophe一样可怕'
  },
  'calamity': {
    phonetic: '/kəˈlæməti/',
    word_root: 'calam-(不幸) + ity(名词后缀) = 灾难',
    memory_tip: "calamity谐音'苦啦迷题'，灾难来了真苦，像个迷题"
  },
  'endanger': {
    phonetic: '/ɪnˈdeɪndʒər/',
    word_root: 'en-(使) + danger(危险) = 使危险',
    memory_tip: "en-是'使动'前缀，endanger就是使...处于danger(危险)"
  },
  'jeopardise': {
    phonetic: '/ˈdʒepərdaɪz/',
    word_root: 'jeopardy(危险) + ise(动词后缀) = 危害',
    memory_tip: "jeopardize想象成'借钱怕倒债'，会危及财产安全"
  },
  'destructive': {
    phonetic: '/dɪˈstrʌktɪv/',
    word_root: 'de-(向下,完全) + struct(建造) + ive(形容词) = 摧毁性的',
    memory_tip: 'de-向下 + struct建造 = destruct破坏，像把建筑推倒'
  },
  'el nino': {
    phonetic: '/el ˈniːnjoʊ/',
    word_root: '西班牙语：El(定冠词) + Niño(男孩,圣婴) = 圣婴现象',
    memory_tip: "El Niño在圣诞节前后出现，西班牙语'圣婴'指耶稣诞生"
  },
  'greenhouse': {
    phonetic: '/ˈɡriːnhaʊs/',
    word_root: 'green(绿色的) + house(房子) = 温室',
    memory_tip: 'greenhouse就是绿色植物生长的glass house玻璃房'
  },
  'phenomenon': {
    phonetic: '/fəˈnɑːmɪnɑːn/',
    word_root: 'pheno-(显现) + menon(被观察的) = 现象',
    memory_tip: "phenomenon谐音'费脑们'，奇特现象让人费脑研究"
  },
  'pebble': {
    phonetic: '/ˈpebl/',
    word_root: 'pebble(小圆石) = 鹅卵石',
    memory_tip: "pebble谐音'屁宝'，小小的鹅卵石像小宝贝"
  },
  'magnet': {
    phonetic: '/ˈmæɡnət/',
    word_root: 'magnet-(磁石) = 磁铁',
    memory_tip: 'magnet像magic net(魔法网)，磁铁有神奇的吸引力'
  },
  'ore': {
    phonetic: '/ɔːr/',
    word_root: 'ore(矿石) = 未加工的矿物',
    memory_tip: "ore谐音'哦'，在矿山发现ore会'哦'一声惊喜"
  },
  'mineral': {
    phonetic: '/ˈmɪnərəl/',
    word_root: 'miner-(矿) + al(名词) = 矿物',
    memory_tip: 'mineral含mine(矿山)，从矿山开采出的矿物质'
  },
  'marble': {
    phonetic: '/ˈmɑːrbl/',
    word_root: 'marble(大理石,玻璃球) = 大理石',
    memory_tip: "marble谐音'马波'，大理石表面光滑像水波"
  },
  'quartz': {
    phonetic: '/kwɔːrts/',
    word_root: 'quartz(石英) = 一种矿物',
    memory_tip: "quartz谐音'夸子'，石英晶体漂亮值得夸"
  },
  'granite': {
    phonetic: '/ˈɡrænɪt/',
    word_root: 'gran-(颗粒) + ite(石) = 颗粒状的石头 → 花岗岩',
    memory_tip: 'granite含grain(颗粒)，花岗岩是颗粒状结晶岩石'
  },
  'gust': {
    phonetic: '/ɡʌst/',
    word_root: 'gust(一阵强风) = 狂风',
    memory_tip: "gust谐音'嘎死特'，一阵狂风吹得人'嘎死'"
  },
  'breeze': {
    phonetic: '/briːz/',
    word_root: 'breeze(微风) = 和风',
    memory_tip: "breeze谐音'不累子'，微风吹来很舒服不累"
  },
  'monsoon': {
    phonetic: '/mɑːnˈsuːn/',
    word_root: '阿拉伯语mausim(季节) = 季风',
    memory_tip: "monsoon谐音'忙sun(太阳)'，季风季节总是忙着看天气"
  },
  'gale': {
    phonetic: '/ɡeɪl/',
    word_root: 'gale(大风) = 强风',
    memory_tip: "gale谐音'给哦'，大风来了赶紧'给'我避风的地方"
  },
  'hurricane': {
    phonetic: '/ˈhɜːrɪkeɪn/',
    word_root: '源自加勒比语huracan(风神) = 飓风',
    memory_tip: "hurricane谐音'哈瑞肯'，飓风像疯狂的Harry肯定很猛"
  },
  'tornado': {
    phonetic: '/tɔːrˈneɪdoʊ/',
    word_root: 'torn-(旋转) + ado(名词) = 龙卷风',
    memory_tip: "tornado含torn(撕裂)，龙卷风把东西撕裂卷走"
  },
  'typhoon': {
    phonetic: '/taɪˈfuːn/',
    word_root: "希腊typhon(旋风) + 中文'大风' = 台风",
    memory_tip: "typhoon谐音'太疯'，台风来了太疯狂了"
  },
  'volcano': {
    phonetic: '/vɑːlˈkeɪnoʊ/',
    word_root: 'Vulcan(火神) + o = 火山',
    memory_tip: 'volcano来自罗马火神Vulcan，火山是火神的家'
  },
  'erupt': {
    phonetic: '/ɪˈrʌpt/',
    word_root: 'e-(出) + rupt(破裂) = 爆发',
    memory_tip: "erupt想象成'一 rupt(破裂)'，火山一下子爆裂喷发"
  },
  'magma': {
    phonetic: '/ˈmæɡmə/',
    word_root: '希腊magma(软膏,厚液) = 岩浆',
    memory_tip: "magma谐音'马哥吗'，岩浆像流动的浓稠液体"
  },
  'thermodynamic': {
    phonetic: '/ˌθɜːrmoʊdaɪˈnæmɪk/',
    word_root: 'thermo-(热) + dynamic(动力的) = 热力学的',
    memory_tip: 'thermo-热(thermos保温瓶) + dynamic动力，热与动力的学问'
  },
  'smog': {
    phonetic: '/smɑːɡ/',
    word_root: 'smoke(烟) + fog(雾) = 烟雾',
    memory_tip: 'smog = smoke + fog的混成词，烟加雾等于雾霾'
  },
  'fume': {
    phonetic: '/fjuːm/',
    word_root: 'fume(烟雾,气体) = 废气',
    memory_tip: "fume谐音'肥毛'，难闻的烟气像肥腻的烟雾"
  },
  'mist': {
    phonetic: '/mɪst/',
    word_root: 'mist(薄雾) = 水汽',
    memory_tip: "mist和miss很像，雾中容易miss(错过)方向"
  },
  'tsunami': {
    phonetic: '/tsuːˈnɑːmi/',
    word_root: '日语：tsu(港) + nami(波) = 海啸',
    memory_tip: "tsunami日语'津波'，巨大的海浪涌入港口"
  },
  'drought': {
    phonetic: '/draʊt/',
    word_root: 'drought(干旱) = 长期无雨',
    memory_tip: "drought谐音'抓特'，干旱时特别想抓住一滴水"
  },
  'flooding': {
    phonetic: '/ˈflʌdɪŋ/',
    word_root: 'flood(洪水) + ing = 洪水泛滥',
    memory_tip: "flood想象成'浮拉的'，洪水让东西都浮起来拉走"
  },
  'torrent': {
    phonetic: '/ˈtɔːrənt/',
    word_root: 'torr-(烧,热) + ent = 激流(像被烤热的急流)',
    memory_tip: "torrent谐音'涛润特'，激流的波涛特别汹涌"
  },
  'earthquake': {
    phonetic: '/ˈɜːrθkweɪk/',
    word_root: 'earth(地球) + quake(震动) = 地震',
    memory_tip: 'earthquake就是earth(地)在quake(震动摇晃)'
  }
}

function normaliseWord(raw) {
  return (raw || '').toLowerCase().replace(/[^a-z]/gi, '')
}

function buildRootInfo(word) {
  const plain = normaliseWord(word)
  if (!plain) {
    return { description: '', parts: [] }
  }

  let matchedPrefix = null
  for (const prefix of COMMON_PREFIXES) {
    if (plain.startsWith(prefix.value) && (!matchedPrefix || prefix.value.length > matchedPrefix.value.length)) {
      matchedPrefix = prefix
    }
  }

  let matchedSuffix = null
  for (const suffix of COMMON_SUFFIXES) {
    if (plain.endsWith(suffix.value) && (!matchedSuffix || suffix.value.length > matchedSuffix.value.length)) {
      matchedSuffix = suffix
    }
  }

  const baseStart = matchedPrefix ? matchedPrefix.value.length : 0
  const baseEnd = matchedSuffix ? plain.length - matchedSuffix.value.length : plain.length
  const base = plain.slice(baseStart, baseEnd)

  const parts = []
  if (matchedPrefix) {
    parts.push(`${matchedPrefix.value}-(${matchedPrefix.meaning})`)
  }
  if (base) {
    parts.push(`${base}(词根，核心含义)`)
  }
  if (matchedSuffix) {
    parts.push(`${matchedSuffix.value}-(${matchedSuffix.meaning})`)
  }

  return {
    description: parts.join(' + '),
    parts
  }
}

function buildMemoryTip(word, rootInfo, translation, definition) {
  const pieces = []
  if (rootInfo.parts.length > 0) {
    pieces.push(`词根拆解：${rootInfo.parts.join(' + ')}`)
  }
  if (definition) {
    pieces.push(`英文释义提示：${definition}`)
  }
  if (translation) {
    pieces.push(`联想中文意思“${translation}”，将单词与实际场景联系起来记忆`)
  }

  if (!pieces.length) {
    return FALLBACK_MEMORY_TIP
  }

  return `记忆方法：${pieces.join('；')}。`
}

async function fetchDictionaryEntry(word) {
  const candidates = [
    word,
    word.replace(/\s+/g, '-'),
    word.replace(/\s+/g, '')
  ]

  for (const candidate of candidates) {
    try {
      const response = await axios.get(`${DICTIONARY_ENDPOINT}${encodeURIComponent(candidate)}`)
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data[0]
      }
    } catch (error) {
      if (error.response?.status === 404) {
        continue
      }
      console.warn(`dictionary lookup failed for ${word}: ${error.message}`)
      break
    }
  }

  return null
}

function extractPhonetic(entry) {
  if (!entry || !Array.isArray(entry.phonetics)) {
    return { text: '', audio: '' }
  }

  for (const item of entry.phonetics) {
    if (item.text && item.audio) {
      return { text: item.text, audio: item.audio }
    }
  }

  for (const item of entry.phonetics) {
    if (item.text || item.audio) {
      return {
        text: item.text || '',
        audio: item.audio || ''
      }
    }
  }

  return { text: '', audio: '' }
}

function extractDefinition(entry) {
  if (!entry || !Array.isArray(entry.meanings)) {
    return ''
  }

  for (const meaning of entry.meanings) {
    if (Array.isArray(meaning.definitions) && meaning.definitions.length > 0) {
      const def = meaning.definitions[0]
      if (def.definition) {
        return def.definition
      }
    }
  }

  return ''
}

function extractOrigin(entry) {
  if (entry && typeof entry.origin === 'string' && entry.origin.trim()) {
    return entry.origin.trim()
  }
  return ''
}

function buildUpdateQuery(wordId, updates) {
  const fields = []
  const params = []

  if (updates.phonetic !== undefined) {
    fields.push('phonetic = ?')
    params.push(updates.phonetic)
  }
  if (updates.audio_url !== undefined) {
    fields.push('audio_url = ?')
    params.push(updates.audio_url)
  }
  if (updates.word_root !== undefined) {
    fields.push('word_root = ?')
    params.push(updates.word_root)
  }
  if (updates.memory_tip !== undefined) {
    fields.push('memory_tip = ?')
    params.push(updates.memory_tip)
  }

  if (!fields.length) {
    return null
  }

  params.push(wordId)
  return {
    sql: `UPDATE words SET ${fields.join(', ')} WHERE id = ?`,
    params
  }
}

export async function enhanceWordIfNeeded(word) {
  if (!word) return word

  let needsPhonetic = !word.phonetic
  let needsAudio = !word.audio_url
  let needsRoot = !word.word_root
  let needsMemory = !word.memory_tip

  if (!(needsPhonetic || needsAudio || needsRoot || needsMemory)) {
    return word
  }

  const updates = {}
  const lowerWord = word.word?.toLowerCase()
  const manual = lowerWord ? MANUAL_ENHANCEMENTS[lowerWord] : null

  if (manual) {
    if (needsPhonetic && manual.phonetic) {
      updates.phonetic = manual.phonetic
      needsPhonetic = false
    }
    if (needsRoot && manual.word_root) {
      updates.word_root = manual.word_root
      needsRoot = false
    }
    if (needsMemory && manual.memory_tip) {
      updates.memory_tip = manual.memory_tip
      needsMemory = false
    }
  }

  let entry = null
  let phoneticInfo = { text: '', audio: '' }
  let definition = ''
  let originText = ''

  if (needsPhonetic || needsAudio || needsRoot || needsMemory) {
    entry = await fetchDictionaryEntry(word.word)
    phoneticInfo = extractPhonetic(entry)
    definition = extractDefinition(entry)
    originText = extractOrigin(entry)
  }

  if (needsPhonetic && phoneticInfo.text) {
    updates.phonetic = phoneticInfo.text
    needsPhonetic = false
  }

  if (needsAudio) {
    if (phoneticInfo.audio) {
      updates.audio_url = phoneticInfo.audio
      needsAudio = false
    } else if (!word.audio_url) {
      updates.audio_url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word.word)}&type=1`
      needsAudio = false
    }
  }

  if (needsRoot) {
    if (originText) {
      updates.word_root = originText
      needsRoot = false
    } else {
      const rootInfo = buildRootInfo(word.word)
      if (rootInfo.description) {
        updates.word_root = rootInfo.description
      } else {
        updates.word_root = '词源信息待补充'
      }
      needsRoot = false
    }
  }

  if (needsMemory) {
    const rootInfo = buildRootInfo(word.word)
    const translation = word.chinese_meaning ? String(word.chinese_meaning).split(/[；;,，]/)[0].trim() : ''
    updates.memory_tip = buildMemoryTip(word.word, rootInfo, translation, definition)
    needsMemory = false
  }

  const query = buildUpdateQuery(word.id, updates)
  if (query) {
    try {
      await pool.query(query.sql, query.params)
    } catch (error) {
      console.warn(`failed to persist enhancements for word ${word.id}: ${error.message}`)
    }
  }

  return { ...word, ...updates }
}


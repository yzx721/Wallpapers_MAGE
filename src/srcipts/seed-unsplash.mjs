import 'dotenv/config'
import bcrypt from 'bcryptjs'
import prisma from '../utils/prisma.js'

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY
// 每次运行随机抽取，配合随机翻页，反复跑就能持续加图
const KEYWORDS = [
  'nature', 'cyberpunk', 'minimal', 'architecture', 'neon', 'ocean', 'mountain', 'abstract',
  'space', 'galaxy', 'night', 'sunset', 'city', 'forest', 'water', 'desert',
  'winter', 'aurora', 'technology', 'dark', 'travel', 'portrait', 'texture', 'vintage',
  'macro', 'car', 'flower', 'beach', 'sky', 'snow', 'rain', 'fire',
  'animals', 'birds', 'cats', 'dogs', 'wildlife', 'moon', 'stars', 'clouds',
  'fog', 'leaf', 'grass', 'rock', 'canyon', 'valley', 'river', 'lake',
  'island', 'tropical', 'japan', 'tokyo', 'kyoto', 'paris', 'venice', 'new-york',
  'coffee', 'food', 'drink', 'fruit', 'light', 'shadow', 'silhouette', 'neon-city',
]
const PER_PAGE = 30

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

async function getBotUser() {
  const existing = await prisma.user.findUnique({ where: { username: 'wallpaper-bot' } })
  if (existing) return existing
  const hash = await bcrypt.hash('unsplash-seed-' + Math.random(), 10)
  return prisma.user.create({
    data: { username: 'wallpaper-bot', email: `bot${Date.now()}@local.dev`, passwordHash: hash },
  })
}

async function fetchKeyword(keyword, page) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&per_page=${PER_PAGE}&page=${page}`
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${ACCESS_KEY}` } })
  if (res.status === 429) throw new Error('Unsplash 429 限流，等一会儿再跑')
  if (!res.ok) throw new Error(`Unsplash ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.results || []
}

// 用法：node/tsx seed-unsplash.mjs [批次数]  默认 12，受 50 次/小时 限流约束
const BATCH = Math.max(1, Number(process.argv[2]) || 12)
const picked = shuffle(KEYWORDS).slice(0, BATCH).map((kw) => ({ kw, page: 1 + Math.floor(Math.random() * 3) }))

let created = 0
let updated = 0
let skipped = 0
const user = await getBotUser()

console.log(`本次抽取 ${picked.length} 个主题：`, picked.map((p) => `${p.kw}#${p.page}`).join(', '))

for (const { kw, page } of picked) {
  let photos
  try {
    photos = await fetchKeyword(kw, page)
  } catch (e) {
    console.log(`[${kw}#${page}] fetch failed:`, e.message.slice(0, 90))
    continue
  }
  for (const p of photos) {
    const apiUrl = p.links?.html
    if (!apiUrl) continue
    // search 接口不返回 tags，用 breadcrumbs（分类）+ topic_submissions（主题）拼标签
    const tags = [
      ...(p.breadcrumbs || []).map((b) => b.title),
      ...Object.keys(p.topic_submissions || {}),
    ].filter(Boolean).slice(0, 8)
    const data = {
      userId: user.id,
      title: p.alt_description || `${kw} wallpaper`,
      description: p.alt_description || null,
      filePath: p.urls?.regular || p.urls?.full,
      thumbnailPath: p.urls?.small || p.urls?.thumb,
      width: p.width || null,
      height: p.height || null,
      tags,
      source: 'api',
      apiSourceUrl: apiUrl,
      viewCount: p.likes || 0,
      downloadCount: Math.max(1, Math.floor((p.likes || 0) / 5)),
    }
    const exist = await prisma.image.findFirst({ where: { apiSourceUrl: apiUrl } })
    if (exist) {
      // 已存在：只补 tags（上次导入时 tags 为空）
      if ((exist.tags || []).length === 0 && tags.length) {
        await prisma.image.update({ where: { id: exist.id }, data: { tags } })
        updated++
      } else {
        skipped++
      }
      continue
    }
    await prisma.image.create({ data })
    created++
  }
  console.log(`[${kw}#${page}] fetched ${photos.length} → created=${created}, updated=${updated}, skipped=${skipped}`)
}

console.log(`done: created=${created}, updated=${updated}, skipped=${skipped}`)
await prisma.$disconnect()

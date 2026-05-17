<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { fetch as tauriFetch } from '@tauri-apps/plugin-http'
import { openUrl } from '@tauri-apps/plugin-opener'

type Status = 'idle' | 'loading' | 'success' | 'error'

interface ModuleState<T = any> {
  status: Status
  data: T | null
  error: string
  expanded?: boolean
}

const QUOTE = 'https://60s.viki.moe/v2/hitokoto'
const ENDPOINTS = {
  weather: 'https://60s.viki.moe/v2/weather?query=%E8%8F%8F%E6%B3%BD%E5%B8%82',
  fuel:    'https://60s.viki.moe/v2/fuel-price?region=%E8%8F%8F%E6%B3%BD%E5%B8%82',
  gold:    'https://60s.viki.moe/v2/gold-price',
  world:   'https://60s.viki.moe/v2/60s',
  aiNews:  'https://60s.viki.moe/v2/ai-news',
  history: 'https://60s.viki.moe/v2/today-in-history',
  audio:   'https://60s.viki.moe/v2/changya',
}

const quote = ref<ModuleState>({ status: 'idle', data: null, error: '' })
const weather = ref<ModuleState>({ status: 'idle', data: null, error: '' })
const fuel = ref<ModuleState>({ status: 'idle', data: null, error: '' })
const gold = ref<ModuleState>({ status: 'idle', data: null, error: '' })
const world = ref<ModuleState>({ status: 'idle', data: null, error: '', expanded: false })
const aiNews = ref<ModuleState>({ status: 'idle', data: null, error: '', expanded: false })
const history = ref<ModuleState>({ status: 'idle', data: null, error: '', expanded: false })
const audio = ref<ModuleState>({ status: 'idle', data: null, error: '' })

const refreshing = ref(false)
const lastRefresh = ref<string>('')
const audioPlaying = ref(false)
const audioEl = ref<HTMLAudioElement | null>(null)
const clock = ref(new Date())
let clockTimer: number | null = null

const greeting = computed(() => {
  const h = clock.value.getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const clockText = computed(() => {
  const d = clock.value
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
})

const dateText = computed(() => {
  const d = clock.value
  const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日 · ${week}`
})

async function fetchJson(url: string): Promise<{ ok: true; data: any } | { ok: false; error: string }> {
  try {
    const res = await tauriFetch(url, { method: 'GET' })
    const json: any = await res.json()
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
    if (json.code !== 200) return { ok: false, error: json.message || '接口异常' }
    return { ok: true, data: json.data }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '网络错误' }
  }
}

const modules = { weather, fuel, gold, world, aiNews, history, audio }
type ModuleKey = keyof typeof modules

async function loadModule(key: ModuleKey) {
  const state = modules[key]
  state.value = { ...state.value, status: 'loading', error: '' }
  const r = await fetchJson(ENDPOINTS[key])
  if (r.ok) state.value = { ...state.value, status: 'success', data: r.data }
  else state.value = { ...state.value, status: 'error', error: r.error }
}

async function loadQuote() {
  quote.value = { ...quote.value, status: 'loading' }
  const r = await fetchJson(QUOTE)
  if (r.ok) quote.value = { status: 'success', data: r.data, error: '' }
  else quote.value = { status: 'error', data: null, error: r.error }
}

async function refreshAll() {
  if (refreshing.value) return
  refreshing.value = true
  await Promise.allSettled([
    loadQuote(),
    loadModule('weather'),
    loadModule('fuel'),
    loadModule('gold'),
    loadModule('world'),
    loadModule('aiNews'),
    loadModule('history'),
    loadModule('audio'),
  ])
  lastRefresh.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  refreshing.value = false
}

function toggleAudio() {
  const url = audio.value.data?.audio?.url?.replace(/^http:\/\//, 'https://')
  if (!url) return
  if (!audioEl.value) {
    audioEl.value = new Audio(url)
    audioEl.value.addEventListener('ended', () => { audioPlaying.value = false })
    audioEl.value.addEventListener('error', () => { audioPlaying.value = false })
  } else if (audioEl.value.src !== url) {
    audioEl.value.src = url
  }
  if (audioPlaying.value) {
    audioEl.value.pause()
    audioPlaying.value = false
  } else {
    audioEl.value.play().then(() => { audioPlaying.value = true }).catch(() => { audioPlaying.value = false })
  }
}

async function refreshAudio() {
  if (audioEl.value) { audioEl.value.pause(); audioEl.value = null }
  audioPlaying.value = false
  await loadModule('audio')
}

function fmtNum(v: any): string {
  const n = Number(v)
  return Number.isNaN(n) ? '--' : n.toLocaleString('zh-CN')
}

function openLink(url: string) {
  if (url) openUrl(url)
}

onMounted(() => {
  refreshAll()
  clockTimer = window.setInterval(() => { clock.value = new Date() }, 1000)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
  if (audioEl.value) { audioEl.value.pause(); audioEl.value = null }
})
</script>

<template>
  <div class="ent-page">
    <div class="ent-bg">
      <div class="orb orb-cyan"></div>
      <div class="orb orb-violet"></div>
      <div class="orb orb-emerald"></div>
      <div class="grid-noise"></div>
    </div>

    <div class="ent-scroll">
      <!-- Hero / Toolbar -->
      <section class="hero">
        <div class="hero-left">
          <div class="hero-greet">
            <span class="hero-greet-emoji">✨</span>
            <span class="hero-greet-text">{{ greeting }}，欢迎来到</span>
          </div>
          <h1 class="hero-title">娱乐中心</h1>
          <p class="hero-date">{{ dateText }}</p>
        </div>
        <div class="hero-right">
          <div class="hero-clock">{{ clockText }}</div>
          <div class="hero-actions">
            <span v-if="lastRefresh" class="hero-meta">最近刷新 {{ lastRefresh }}</span>
            <button class="btn-refresh" :class="{ spinning: refreshing }" :disabled="refreshing" @click="refreshAll">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
              {{ refreshing ? '同步中' : '刷新全部' }}
            </button>
          </div>
        </div>
      </section>

      <!-- Quote ribbon -->
      <section class="quote-ribbon">
        <svg class="quote-mark" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h2c1 0 1 1 1 1v1c0 1-1 2-2 2s-2 .25-2 1.5V21h0zM15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h2c1 0 1 1 1 1v1c0 1-1 2-2 2s-2 .25-2 1.5V21h0z"/></svg>
        <div class="quote-text" v-if="quote.status === 'success'">{{ quote.data?.hitokoto || '—' }}</div>
        <div class="quote-text quote-loading" v-else-if="quote.status === 'loading'">载入静谧瞬间…</div>
        <div class="quote-text quote-error" v-else>诗意暂时缺席</div>
        <button class="quote-refresh" @click="loadQuote" title="换一句">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 11-3-6.7L21 8"/><polyline points="21 3 21 8 16 8"/></svg>
        </button>
      </section>

      <!-- Bento grid -->
      <section class="bento">
        <!-- Weather (large hero) -->
        <article class="card card-weather span-2">
          <div class="card-aura aura-cyan"></div>
          <header class="card-head">
            <div class="card-kicker"><span class="kicker-dot dot-cyan"></span>实时天气</div>
            <button class="icon-btn" @click="loadModule('weather')" :disabled="weather.status === 'loading'" title="刷新">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10"/></svg>
            </button>
          </header>
          <div v-if="weather.status === 'success' && weather.data" class="weather-body">
            <div class="weather-main">
              <div class="weather-temp">
                <span class="temp-num">{{ weather.data.weather?.temperature ?? '--' }}</span>
                <span class="temp-unit">°C</span>
              </div>
              <div class="weather-info">
                <div class="weather-cond">{{ weather.data.weather?.condition || '—' }}</div>
                <div class="weather-loc">{{ weather.data.location?.name || '菏泽市' }}</div>
              </div>
            </div>
            <div class="weather-meta">
              <div class="meta-pill">
                <span class="meta-label">AQI</span>
                <span class="meta-value">{{ weather.data.air_quality?.aqi ?? '--' }} · {{ weather.data.air_quality?.quality || '—' }}</span>
              </div>
              <div class="meta-pill">
                <span class="meta-label">风</span>
                <span class="meta-value">{{ weather.data.weather?.wind_direction || '—' }} {{ weather.data.weather?.wind_power || '' }}级</span>
              </div>
              <div class="meta-pill">
                <span class="meta-label">湿度</span>
                <span class="meta-value">{{ weather.data.weather?.humidity ?? '--' }}%</span>
              </div>
              <div class="meta-pill">
                <span class="meta-label">气压</span>
                <span class="meta-value">{{ weather.data.weather?.pressure ?? '--' }} hPa</span>
              </div>
            </div>
          </div>
          <div v-else-if="weather.status === 'loading'" class="skel-block"><div class="skel-bar w70"></div><div class="skel-bar w50"></div><div class="skel-bar w90"></div></div>
          <div v-else class="card-error">{{ weather.error || '加载失败' }}</div>
        </article>

        <!-- 60s World -->
        <article class="card card-world span-2 row-2">
          <div class="card-aura aura-blue"></div>
          <header class="card-head">
            <div class="card-kicker"><span class="kicker-dot dot-blue"></span>60 秒读懂世界</div>
            <button class="icon-btn" @click="loadModule('world')" :disabled="world.status === 'loading'">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10"/></svg>
            </button>
          </header>
          <div v-if="world.status === 'success' && world.data" class="world-body">
            <div class="world-date">{{ world.data.date }} · {{ world.data.day_of_week }}</div>
            <ol class="world-list">
              <li v-for="(item, i) in (world.data.news || []).slice(0, world.expanded ? 12 : 6)" :key="i">
                <span class="world-num">{{ String(i + 1).padStart(2, '0') }}</span>
                <span class="world-text">{{ item }}</span>
              </li>
            </ol>
            <button v-if="(world.data.news || []).length > 6" class="link-btn" @click="world.expanded = !world.expanded">
              {{ world.expanded ? '收起' : `展开剩余 ${(world.data.news || []).length - 6} 条` }}
            </button>
          </div>
          <div v-else-if="world.status === 'loading'" class="skel-block">
            <div class="skel-bar w40"></div>
            <div class="skel-bar w90"></div><div class="skel-bar w80"></div><div class="skel-bar w95"></div><div class="skel-bar w75"></div>
          </div>
          <div v-else class="card-error">{{ world.error || '加载失败' }}</div>
        </article>

        <!-- Audio -->
        <article class="card card-audio span-2">
          <div class="card-aura aura-violet"></div>
          <header class="card-head">
            <div class="card-kicker"><span class="kicker-dot dot-violet"></span>今日推荐</div>
            <button class="icon-btn" @click="refreshAudio" :disabled="audio.status === 'loading'" title="换一首">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10"/></svg>
            </button>
          </header>
          <div v-if="audio.status === 'success' && audio.data" class="audio-body">
            <div class="audio-cover" :class="{ playing: audioPlaying }" @click="toggleAudio">
              <img v-if="audio.data.user?.avatar_url" :src="audio.data.user.avatar_url.replace(/^http:\/\//, 'https://')" />
              <div v-else class="cover-fallback">{{ (audio.data.user?.nickname || '唱').slice(0, 1) }}</div>
              <div class="audio-play">
                <svg v-if="!audioPlaying" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>
              </div>
            </div>
            <div class="audio-info">
              <div class="audio-title">{{ audio.data.song?.name || '未知曲目' }}</div>
              <div class="audio-singer">{{ audio.data.song?.singer || audio.data.user?.nickname || '匿名' }}</div>
              <div class="audio-stats">
                <span>♥ {{ fmtNum(audio.data.audio?.like_count) }}</span>
                <span v-if="audio.data.audio?.duration">⏱ {{ Math.round((audio.data.audio.duration || 0) / 1000) }}s</span>
              </div>
            </div>
          </div>
          <div v-else-if="audio.status === 'loading'" class="skel-block"><div class="skel-circle"></div><div class="skel-bar w70"></div><div class="skel-bar w40"></div></div>
          <div v-else class="card-error">{{ audio.error || '加载失败' }}</div>
        </article>

        <!-- Fuel -->
        <article class="card card-fuel span-2">
          <div class="card-aura aura-amber"></div>
          <header class="card-head">
            <div class="card-kicker"><span class="kicker-dot dot-amber"></span>菏泽油价</div>
            <button class="icon-btn" @click="loadModule('fuel')" :disabled="fuel.status === 'loading'">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10"/></svg>
            </button>
          </header>
          <div v-if="fuel.status === 'success' && fuel.data" class="fuel-body">
            <div class="fuel-trend" v-if="fuel.data.trend?.description">{{ fuel.data.trend.description }}</div>
            <div class="fuel-grid">
              <div v-for="item in (fuel.data.items || [])" :key="item.name" class="fuel-cell">
                <div class="fuel-name">{{ item.name }}</div>
                <div class="fuel-price">{{ item.price_desc || '--' }}</div>
              </div>
            </div>
          </div>
          <div v-else-if="fuel.status === 'loading'" class="skel-block"><div class="skel-bar w50"></div><div class="skel-bar w90"></div></div>
          <div v-else class="card-error">{{ fuel.error || '加载失败' }}</div>
        </article>

        <!-- Gold -->
        <article class="card card-gold span-2">
          <div class="card-aura aura-gold"></div>
          <header class="card-head">
            <div class="card-kicker"><span class="kicker-dot dot-gold"></span>贵金属行情</div>
            <button class="icon-btn" @click="loadModule('gold')" :disabled="gold.status === 'loading'">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10"/></svg>
            </button>
          </header>
          <div v-if="gold.status === 'success' && gold.data" class="gold-body">
            <div v-for="(metal, i) in (gold.data.metals || []).slice(0, 4)" :key="metal.name" class="gold-row" :class="{ first: i === 0 }">
              <div class="gold-name">{{ metal.name }}</div>
              <div class="gold-price">{{ metal.today_price || '--' }}</div>
              <div class="gold-range">
                <span class="gold-high">高 {{ metal.high_price || '--' }}</span>
                <span class="gold-low">低 {{ metal.low_price || '--' }}</span>
              </div>
            </div>
          </div>
          <div v-else-if="gold.status === 'loading'" class="skel-block"><div class="skel-bar w90"></div><div class="skel-bar w90"></div><div class="skel-bar w90"></div></div>
          <div v-else class="card-error">{{ gold.error || '加载失败' }}</div>
        </article>

        <!-- AI News -->
        <article class="card card-ai span-3">
          <div class="card-aura aura-fuchsia"></div>
          <header class="card-head">
            <div class="card-kicker"><span class="kicker-dot dot-fuchsia"></span>AI 资讯快报</div>
            <button class="icon-btn" @click="loadModule('aiNews')" :disabled="aiNews.status === 'loading'">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10"/></svg>
            </button>
          </header>
          <div v-if="aiNews.status === 'success' && aiNews.data" class="ai-body">
            <div v-for="(item, i) in (aiNews.data.news || []).slice(0, aiNews.expanded ? 8 : 4)" :key="i"
                 class="ai-item" :class="{ clickable: item?.link || item?.url }"
                 @click="openLink(item?.link || item?.url || '')">
              <div class="ai-title">{{ item?.title || item?.name || '未命名资讯' }}</div>
              <div class="ai-meta">{{ item?.source || 'AI 快报' }}<span v-if="item?.date"> · {{ item.date }}</span></div>
              <div v-if="item?.detail || item?.summary || item?.desc" class="ai-detail">{{ item?.detail || item?.summary || item?.desc }}</div>
            </div>
            <button v-if="(aiNews.data.news || []).length > 4" class="link-btn" @click="aiNews.expanded = !aiNews.expanded">
              {{ aiNews.expanded ? '收起' : '展开更多' }}
            </button>
          </div>
          <div v-else-if="aiNews.status === 'loading'" class="skel-block"><div class="skel-bar w80"></div><div class="skel-bar w60"></div><div class="skel-bar w90"></div></div>
          <div v-else class="card-error">{{ aiNews.error || '加载失败' }}</div>
        </article>

        <!-- History -->
        <article class="card card-history span-3">
          <div class="card-aura aura-rose"></div>
          <header class="card-head">
            <div class="card-kicker"><span class="kicker-dot dot-rose"></span>历史上的今天</div>
            <button class="icon-btn" @click="loadModule('history')" :disabled="history.status === 'loading'">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10"/></svg>
            </button>
          </header>
          <div v-if="history.status === 'success' && history.data" class="history-body">
            <div class="timeline">
              <div v-for="(item, i) in (history.data.items || []).slice(0, history.expanded ? 12 : 5)" :key="i"
                   class="time-item" :class="{ clickable: item.link }" @click="openLink(item.link || '')">
                <div class="time-year">{{ item.year || '--' }}</div>
                <div class="time-line"><div class="time-dot"></div></div>
                <div class="time-content">
                  <div class="time-title">{{ item.title || '历史事件' }}</div>
                  <div class="time-desc" v-if="item.description">{{ item.description }}</div>
                </div>
              </div>
            </div>
            <button v-if="(history.data.items || []).length > 5" class="link-btn" @click="history.expanded = !history.expanded">
              {{ history.expanded ? '收起' : '展开更多' }}
            </button>
          </div>
          <div v-else-if="history.status === 'loading'" class="skel-block"><div class="skel-bar w50"></div><div class="skel-bar w90"></div><div class="skel-bar w80"></div></div>
          <div v-else class="card-error">{{ history.error || '加载失败' }}</div>
        </article>
      </section>

      <p class="page-foot">数据来源 60s.viki.moe · 仅供娱乐参考</p>
    </div>
  </div>
</template>

<style scoped>
.ent-page {
  position: relative;
  height: 100%;
  overflow: hidden;
  background: var(--bg-primary, #0a0f16);
}

.ent-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}
.orb {
  position: absolute;
  width: 380px;
  height: 380px;
  border-radius: 50%;
  filter: blur(110px);
  opacity: 0.18;
}
.orb-cyan   { top: -120px; left: -80px;  background: #38bdf8; }
.orb-violet { top: 200px;  right: -100px; background: #a855f7; opacity: 0.14; }
.orb-emerald{ bottom: -120px; left: 30%; background: #10b981; opacity: 0.10; }
.grid-noise {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(to right, rgba(148,163,184,0.06) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(148,163,184,0.06) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
}

.ent-scroll {
  position: relative;
  z-index: 1;
  height: 100%;
  overflow-y: auto;
  padding: 24px 28px 40px;
  scrollbar-width: thin;
  scrollbar-color: #1a2435 transparent;
}

/* Hero */
.hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 18px;
  padding: 22px 26px;
  border-radius: 22px;
  border: 1px solid var(--border-color, #1a2435);
  background: linear-gradient(135deg, rgba(56,189,248,0.06), rgba(168,85,247,0.04) 50%, rgba(15,23,42,0.0));
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  margin-bottom: 14px;
}
.hero-greet { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-secondary, #94a3b8); font-weight: 500; }
.hero-greet-emoji { font-size: 14px; }
.hero-title {
  font-size: 28px; font-weight: 800; margin: 6px 0 4px;
  background: linear-gradient(135deg, #38bdf8 0%, #a78bfa 50%, #f472b6 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  letter-spacing: -0.02em;
}
.hero-date { font-size: 12px; color: var(--text-muted, #64748b); margin: 0; }
.hero-right { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
.hero-clock {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary, #e2e8f0);
  letter-spacing: 0.05em;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 24px rgba(56,189,248,0.3);
}
.hero-actions { display: flex; align-items: center; gap: 10px; }
.hero-meta { font-size: 11px; color: var(--text-muted, #64748b); }
.btn-refresh {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border: none; border-radius: 999px;
  color: white; font-size: 12px; font-weight: 600; cursor: pointer;
  box-shadow: 0 6px 18px rgba(59,130,246,0.32);
  transition: transform 0.15s, box-shadow 0.15s;
}
.btn-refresh:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 22px rgba(59,130,246,0.42); }
.btn-refresh:disabled { opacity: 0.7; cursor: wait; }
.btn-refresh.spinning svg { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Quote ribbon */
.quote-ribbon {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 18px;
  margin-bottom: 18px;
  border-radius: 16px;
  border: 1px solid var(--border-color, #1a2435);
  background: var(--bg-secondary, rgba(19,27,39,0.6));
  backdrop-filter: blur(10px);
}
.quote-mark { color: #a78bfa; opacity: 0.7; flex-shrink: 0; }
.quote-text {
  flex: 1; min-width: 0;
  font-size: 13px; line-height: 1.6;
  color: var(--text-secondary, #cbd5e1); font-style: italic;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.quote-loading { opacity: 0.6; }
.quote-error { color: var(--text-muted, #64748b); }
.quote-refresh {
  flex-shrink: 0;
  width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  background: transparent; border: 1px solid var(--border-color, #1a2435);
  color: var(--text-muted, #64748b); border-radius: 50%; cursor: pointer;
  transition: color 0.15s, border-color 0.15s, transform 0.2s;
}
.quote-refresh:hover { color: #a78bfa; border-color: rgba(167,139,250,0.4); transform: rotate(180deg); }

/* Bento grid */
.bento {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
}
.span-2 { grid-column: span 2; }
.span-3 { grid-column: span 3; }
.row-2  { grid-row: span 2; }

@media (max-width: 1100px) {
  .span-3 { grid-column: span 3; }
  .row-2  { grid-row: auto; }
  .bento { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
@media (max-width: 720px) {
  .bento { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .span-2, .span-3 { grid-column: span 2; }
}

/* Card base */
.card {
  position: relative;
  padding: 18px 20px;
  border-radius: 18px;
  border: 1px solid var(--border-color, #1a2435);
  background: linear-gradient(180deg, rgba(19,27,39,0.85), rgba(10,15,22,0.7));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  overflow: hidden;
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 36px rgba(0,0,0,0.32);
}

:root:not(.dark) .card {
  background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(248,250,252,0.85));
}

.card-aura {
  position: absolute;
  top: -50%;
  right: -30%;
  width: 320px;
  height: 320px;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.18;
  pointer-events: none;
}
.aura-cyan    { background: radial-gradient(circle, #38bdf8, transparent 70%); }
.aura-blue    { background: radial-gradient(circle, #60a5fa, transparent 70%); }
.aura-violet  { background: radial-gradient(circle, #a78bfa, transparent 70%); }
.aura-amber   { background: radial-gradient(circle, #f59e0b, transparent 70%); }
.aura-gold    { background: radial-gradient(circle, #fbbf24, transparent 70%); }
.aura-fuchsia { background: radial-gradient(circle, #e879f9, transparent 70%); }
.aura-rose    { background: radial-gradient(circle, #fb7185, transparent 70%); }

.card > *:not(.card-aura) { position: relative; z-index: 1; }

.card-head {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 14px;
}
.card-kicker {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 11px; font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-secondary, #94a3b8);
}
.kicker-dot {
  width: 6px; height: 6px; border-radius: 50%;
  box-shadow: 0 0 8px currentColor;
}
.dot-cyan    { background: #38bdf8; color: #38bdf8; }
.dot-blue    { background: #60a5fa; color: #60a5fa; }
.dot-violet  { background: #a78bfa; color: #a78bfa; }
.dot-amber   { background: #f59e0b; color: #f59e0b; }
.dot-gold    { background: #fbbf24; color: #fbbf24; }
.dot-fuchsia { background: #e879f9; color: #e879f9; }
.dot-rose    { background: #fb7185; color: #fb7185; }

.icon-btn {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
  color: var(--text-secondary, #94a3b8);
  border-radius: 8px; cursor: pointer;
  transition: all 0.15s;
}
.icon-btn:hover:not(:disabled) {
  background: rgba(255,255,255,0.08);
  color: var(--text-primary, #e2e8f0);
}
.icon-btn:disabled svg { animation: spin 1s linear infinite; opacity: 0.6; }

/* Skeleton & error */
.skel-block { display: flex; flex-direction: column; gap: 10px; padding: 4px 0; }
.skel-bar { height: 10px; border-radius: 6px; background: linear-gradient(90deg, rgba(148,163,184,0.1), rgba(148,163,184,0.18), rgba(148,163,184,0.1)); background-size: 200% 100%; animation: shimmer 1.4s linear infinite; }
.skel-bar.w40 { width: 40%; } .skel-bar.w50 { width: 50%; } .skel-bar.w60 { width: 60%; } .skel-bar.w70 { width: 70%; } .skel-bar.w75 { width: 75%; } .skel-bar.w80 { width: 80%; } .skel-bar.w90 { width: 90%; } .skel-bar.w95 { width: 95%; }
.skel-circle { width: 60px; height: 60px; border-radius: 50%; background: rgba(148,163,184,0.14); animation: shimmer 1.4s linear infinite; background-size: 200% 100%; }
@keyframes shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }

.card-error {
  padding: 12px;
  border-radius: 10px;
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.2);
  color: #fca5a5;
  font-size: 12px;
}

/* Weather */
.weather-body { display: flex; flex-direction: column; gap: 14px; }
.weather-main { display: flex; align-items: flex-end; gap: 16px; }
.weather-temp { display: inline-flex; align-items: baseline; }
.temp-num {
  font-size: 56px; font-weight: 200;
  line-height: 0.9;
  color: var(--text-primary, #e2e8f0);
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
}
.temp-unit { font-size: 18px; color: var(--text-secondary, #94a3b8); margin-left: 2px; }
.weather-info { padding-bottom: 4px; }
.weather-cond { font-size: 16px; font-weight: 600; color: var(--text-primary, #e2e8f0); }
.weather-loc { font-size: 11px; color: var(--text-muted, #64748b); margin-top: 2px; letter-spacing: 0.05em; }
.weather-meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.meta-pill {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 12px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 10px;
  font-size: 12px;
}
.meta-label { color: var(--text-muted, #64748b); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; }
.meta-value { color: var(--text-primary, #e2e8f0); font-weight: 600; }

/* World news */
.world-body { display: flex; flex-direction: column; gap: 8px; }
.world-date {
  display: inline-block; align-self: flex-start;
  padding: 3px 10px; border-radius: 999px;
  background: rgba(96,165,250,0.12); color: #93c5fd;
  font-size: 11px; font-weight: 600;
  margin-bottom: 4px;
}
.world-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; max-height: 100%; }
.world-list li {
  display: flex; gap: 10px; align-items: flex-start;
  padding: 6px 0;
  border-bottom: 1px dashed rgba(148,163,184,0.1);
  font-size: 12px; line-height: 1.55;
  color: var(--text-secondary, #cbd5e1);
}
.world-list li:last-child { border-bottom: none; }
.world-num {
  flex-shrink: 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; font-weight: 700;
  color: #60a5fa;
  min-width: 20px;
}
.world-text { flex: 1; }

/* Audio */
.audio-body { display: flex; align-items: center; gap: 14px; }
.audio-cover {
  position: relative;
  width: 72px; height: 72px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  cursor: pointer;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  box-shadow: 0 6px 20px rgba(168,85,247,0.3);
  transition: transform 0.2s;
}
.audio-cover:hover { transform: scale(1.05); }
.audio-cover.playing { animation: rotate 4s linear infinite; }
.audio-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
.cover-fallback {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; font-weight: 700; color: white;
}
.audio-play {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.4);
  color: white;
  opacity: 0;
  transition: opacity 0.2s;
}
.audio-cover:hover .audio-play, .audio-cover.playing .audio-play { opacity: 1; }
@keyframes rotate { to { transform: rotate(360deg); } }

.audio-info { flex: 1; min-width: 0; }
.audio-title {
  font-size: 14px; font-weight: 700;
  color: var(--text-primary, #e2e8f0);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.audio-singer { font-size: 12px; color: var(--text-secondary, #94a3b8); margin-top: 3px; }
.audio-stats { display: flex; gap: 12px; margin-top: 8px; font-size: 11px; color: var(--text-muted, #64748b); }

/* Fuel */
.fuel-body { display: flex; flex-direction: column; gap: 10px; }
.fuel-trend {
  display: inline-block; align-self: flex-start;
  padding: 4px 10px; border-radius: 999px;
  background: rgba(245,158,11,0.12);
  color: #fbbf24;
  font-size: 11px; font-weight: 600;
}
.fuel-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.fuel-cell {
  padding: 10px 12px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(245,158,11,0.12);
  border-radius: 10px;
}
.fuel-name { font-size: 11px; color: var(--text-muted, #64748b); letter-spacing: 0.08em; }
.fuel-price { font-size: 18px; font-weight: 700; color: var(--text-primary, #e2e8f0); margin-top: 4px; font-variant-numeric: tabular-nums; }

/* Gold */
.gold-body { display: flex; flex-direction: column; gap: 8px; }
.gold-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 10px;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(251,191,36,0.08);
  border-radius: 10px;
}
.gold-row.first { background: rgba(251,191,36,0.08); border-color: rgba(251,191,36,0.22); }
.gold-name { font-size: 12px; color: var(--text-secondary, #94a3b8); font-weight: 600; }
.gold-price {
  font-size: 16px; font-weight: 700;
  color: #fbbf24;
  font-variant-numeric: tabular-nums;
  text-align: center;
}
.gold-range { display: flex; gap: 8px; justify-content: flex-end; font-size: 10px; }
.gold-high { color: #34d399; }
.gold-low { color: #fb7185; }

/* AI News */
.ai-body { display: flex; flex-direction: column; gap: 8px; }
.ai-item {
  padding: 10px 14px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(232,121,249,0.08);
  border-radius: 12px;
  transition: border-color 0.15s, transform 0.15s;
}
.ai-item.clickable { cursor: pointer; }
.ai-item.clickable:hover { border-color: rgba(232,121,249,0.3); transform: translateX(2px); }
.ai-title { font-size: 13px; font-weight: 600; color: var(--text-primary, #e2e8f0); line-height: 1.45; }
.ai-meta { font-size: 10px; color: var(--text-muted, #64748b); margin-top: 4px; letter-spacing: 0.06em; text-transform: uppercase; }
.ai-detail {
  font-size: 12px; line-height: 1.55;
  color: var(--text-secondary, #94a3b8);
  margin-top: 6px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

/* History timeline */
.history-body { display: flex; flex-direction: column; gap: 6px; }
.timeline { position: relative; display: flex; flex-direction: column; gap: 4px; }
.time-item {
  display: grid;
  grid-template-columns: 50px 18px 1fr;
  gap: 10px;
  padding: 8px 0;
  align-items: flex-start;
  transition: opacity 0.15s;
}
.time-item.clickable { cursor: pointer; }
.time-item.clickable:hover .time-title { color: #fb7185; }
.time-year {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px; font-weight: 700;
  color: #fb7185;
  text-align: right;
  padding-top: 1px;
  font-variant-numeric: tabular-nums;
}
.time-line {
  position: relative;
  width: 18px; align-self: stretch;
  display: flex; justify-content: center;
}
.time-line::before {
  content: ''; position: absolute;
  top: 0; bottom: 0;
  width: 1px;
  background: linear-gradient(to bottom, transparent, rgba(251,113,133,0.3) 20%, rgba(251,113,133,0.3) 80%, transparent);
}
.time-dot {
  position: relative;
  margin-top: 6px;
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #fb7185;
  box-shadow: 0 0 8px rgba(251,113,133,0.6);
}
.time-content { min-width: 0; padding-bottom: 4px; }
.time-title {
  font-size: 13px; font-weight: 600;
  color: var(--text-primary, #e2e8f0);
  line-height: 1.4;
  transition: color 0.15s;
}
.time-desc {
  font-size: 11px; line-height: 1.55;
  color: var(--text-muted, #64748b);
  margin-top: 4px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

/* Link button */
.link-btn {
  align-self: flex-start;
  margin-top: 6px;
  padding: 5px 12px;
  background: transparent;
  border: 1px solid var(--border-color, #1a2435);
  color: var(--text-secondary, #94a3b8);
  border-radius: 999px;
  font-size: 11px; font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.link-btn:hover { border-color: var(--accent, #3b82f6); color: var(--text-primary, #e2e8f0); }

/* Footer */
.page-foot {
  text-align: center;
  margin-top: 22px;
  font-size: 11px;
  color: var(--text-muted, #64748b);
  letter-spacing: 0.06em;
}

/* Light mode adjustments */
:root:not(.dark) .meta-pill,
:root:not(.dark) .fuel-cell,
:root:not(.dark) .gold-row,
:root:not(.dark) .ai-item {
  background: rgba(0,0,0,0.02);
  border-color: rgba(0,0,0,0.06);
}
:root:not(.dark) .gold-row.first { background: rgba(251,191,36,0.12); border-color: rgba(251,191,36,0.4); }
:root:not(.dark) .icon-btn { background: rgba(0,0,0,0.03); border-color: rgba(0,0,0,0.08); }
:root:not(.dark) .quote-ribbon { background: rgba(255,255,255,0.7); }
:root:not(.dark) .grid-noise {
  background-image:
    linear-gradient(to right, rgba(15,23,42,0.04) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(15,23,42,0.04) 1px, transparent 1px);
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { openUrl } from '@tauri-apps/plugin-opener'
import { useAppStore } from '../stores/app'
import { useServiceManager } from '../composables/useServiceManager'
import { SERVICES } from '../types/services'

const version = '0.4.0'
const store = useAppStore()
const { loadedServices } = useServiceManager()

const stats = computed(() => {
  const sessions = store.sessions
  const totalMsgs = sessions.reduce((sum, s) => sum + s.messages.length, 0)
  const userMsgs = sessions.reduce(
    (sum, s) => sum + s.messages.filter(m => m.role === 'user').length, 0
  )
  const aiMsgs = totalMsgs - userMsgs

  const chatServices = SERVICES.filter(s => s.category === 'chat').length
  const visualServices = SERVICES.filter(s => s.category === 'visual').length
  const domesticServices = SERVICES.filter(s => s.region === 'domestic').length
  const intlServices = SERVICES.filter(s => s.region === 'international').length

  return {
    sessions: sessions.length,
    totalMsgs,
    userMsgs,
    aiMsgs,
    chatServices,
    visualServices,
    domesticServices,
    intlServices,
    totalServices: SERVICES.length,
    loadedCount: loadedServices.size,
  }
})

const recentSessions = computed(() => {
  return [...store.sessions]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 5)
})

function formatTime(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins} 分钟前`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} 小时前`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days} 天前`
  return new Date(ts).toLocaleDateString()
}

function openExternal(url: string) {
  openUrl(url)
}

const techStack = [
  { name: 'Tauri 2', desc: '跨平台桌面框架' },
  { name: 'Vue 3', desc: '响应式前端框架' },
  { name: 'TypeScript', desc: '类型安全' },
  { name: 'Pinia', desc: '状态管理' },
  { name: 'Vite', desc: '构建工具' },
  { name: 'Rust', desc: '原生后端' },
]

const features = [
  { icon: '🌐', title: '多服务聚合', desc: '一个窗口聚合 18+ 主流 AI 服务' },
  { icon: '🎨', title: '视觉生成', desc: '内置图像与视频生成服务入口' },
  { icon: '💬', title: '免费公益对话', desc: '内置公益 AI 对话渠道' },
  { icon: '⚡', title: '原生性能', desc: '基于 Tauri 的轻量原生 WebView' },
  { icon: '🌓', title: '主题切换', desc: '支持浅色 / 深色 / 跟随系统' },
  { icon: '🔒', title: '本地优先', desc: '会话数据存于本地，不上传' },
]
</script>

<template>
  <div class="about-page">
    <div class="about-scroll">
      <!-- Hero -->
      <section class="hero">
        <div class="hero-glow"></div>
        <img src="/chatplex-logo.png" class="hero-logo" alt="ChatPlex" />
        <h1 class="hero-title">ChatPlex</h1>
        <p class="hero-version">v{{ version }}</p>
        <p class="hero-desc">一站式 AI 对话与创作桌面应用</p>
        <div class="hero-actions">
          <button class="btn-primary" @click="openExternal('https://github.com/gitlcb/ChatPlex')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            GitHub 仓库
          </button>
          <button class="btn-ghost" @click="openExternal('https://github.com/gitlcb/ChatPlex/blob/master/LICENSE')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            MIT License
          </button>
          <button class="btn-ghost" @click="openExternal('https://github.com/gitlcb/ChatPlex/releases')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            发行版本
          </button>
        </div>
      </section>

      <!-- Stats -->
      <section class="grid-section">
        <h2 class="section-title">数据看板</h2>
        <div class="stat-grid">
          <div class="stat-card stat-blue">
            <div class="stat-icon">💬</div>
            <div class="stat-num">{{ stats.sessions }}</div>
            <div class="stat-label">对话会话</div>
          </div>
          <div class="stat-card stat-purple">
            <div class="stat-icon">📨</div>
            <div class="stat-num">{{ stats.totalMsgs }}</div>
            <div class="stat-label">消息总数</div>
          </div>
          <div class="stat-card stat-pink">
            <div class="stat-icon">👤</div>
            <div class="stat-num">{{ stats.userMsgs }}</div>
            <div class="stat-label">我的提问</div>
          </div>
          <div class="stat-card stat-green">
            <div class="stat-icon">🤖</div>
            <div class="stat-num">{{ stats.aiMsgs }}</div>
            <div class="stat-label">AI 回复</div>
          </div>
          <div class="stat-card stat-orange">
            <div class="stat-icon">🌐</div>
            <div class="stat-num">{{ stats.totalServices }}</div>
            <div class="stat-label">接入服务</div>
          </div>
          <div class="stat-card stat-cyan">
            <div class="stat-icon">⚡</div>
            <div class="stat-num">{{ stats.loadedCount }}</div>
            <div class="stat-label">已加载</div>
          </div>
        </div>
      </section>

      <!-- Service Distribution -->
      <section class="grid-section">
        <h2 class="section-title">服务分布</h2>
        <div class="dist-grid">
          <div class="dist-card">
            <div class="dist-head">
              <span>对话 / 视觉</span>
              <span class="dist-total">{{ stats.totalServices }}</span>
            </div>
            <div class="dist-bar">
              <div
                class="dist-bar-fill blue"
                :style="{ width: (stats.chatServices / stats.totalServices * 100) + '%' }"
              ></div>
              <div
                class="dist-bar-fill purple"
                :style="{ width: (stats.visualServices / stats.totalServices * 100) + '%' }"
              ></div>
            </div>
            <div class="dist-legend">
              <span><span class="dot blue"></span>对话 {{ stats.chatServices }}</span>
              <span><span class="dot purple"></span>视觉 {{ stats.visualServices }}</span>
            </div>
          </div>

          <div class="dist-card">
            <div class="dist-head">
              <span>国内 / 国际</span>
              <span class="dist-total">{{ stats.totalServices }}</span>
            </div>
            <div class="dist-bar">
              <div
                class="dist-bar-fill green"
                :style="{ width: (stats.domesticServices / stats.totalServices * 100) + '%' }"
              ></div>
              <div
                class="dist-bar-fill orange"
                :style="{ width: (stats.intlServices / stats.totalServices * 100) + '%' }"
              ></div>
            </div>
            <div class="dist-legend">
              <span><span class="dot green"></span>国内 {{ stats.domesticServices }}</span>
              <span><span class="dot orange"></span>国际 {{ stats.intlServices }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section class="grid-section">
        <h2 class="section-title">核心特性</h2>
        <div class="feature-grid">
          <div v-for="f in features" :key="f.title" class="feature-card">
            <div class="feature-icon">{{ f.icon }}</div>
            <div class="feature-info">
              <div class="feature-title">{{ f.title }}</div>
              <div class="feature-desc">{{ f.desc }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Recent Sessions -->
      <section v-if="recentSessions.length > 0" class="grid-section">
        <h2 class="section-title">最近对话</h2>
        <div class="recent-list">
          <div v-for="s in recentSessions" :key="s.id" class="recent-item">
            <div class="recent-icon">💬</div>
            <div class="recent-info">
              <div class="recent-title">{{ s.title }}</div>
              <div class="recent-meta">{{ s.messages.length }} 条消息 · {{ s.model || '未指定模型' }}</div>
            </div>
            <div class="recent-time">{{ formatTime(s.updatedAt) }}</div>
          </div>
        </div>
      </section>

      <!-- Tech Stack -->
      <section class="grid-section">
        <h2 class="section-title">技术栈</h2>
        <div class="tech-grid">
          <div v-for="t in techStack" :key="t.name" class="tech-card">
            <div class="tech-name">{{ t.name }}</div>
            <div class="tech-desc">{{ t.desc }}</div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="page-footer">
        <p>ChatPlex © {{ new Date().getFullYear() }} · MIT Licensed</p>
        <p class="footer-sub">应用不收集任何用户数据，所有第三方 AI 服务通过系统原生 WebView 加载</p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.about-page {
  height: 100%;
  overflow: hidden;
  background: var(--bg-primary, #0a0f16);
}
.about-scroll {
  height: 100%;
  overflow-y: auto;
  padding: 32px 40px 60px;
  scrollbar-width: thin;
  scrollbar-color: #1a2435 transparent;
}

/* Hero */
.hero {
  position: relative;
  text-align: center;
  padding: 36px 0 32px;
  margin-bottom: 24px;
  overflow: hidden;
}
.hero-glow {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  width: 360px;
  height: 220px;
  background: radial-gradient(circle, rgba(96,165,250,0.18), rgba(167,139,250,0.05) 60%, transparent 80%);
  filter: blur(20px);
  pointer-events: none;
  z-index: 0;
}
.hero-logo {
  width: 88px;
  height: 88px;
  border-radius: 22px;
  margin-bottom: 14px;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 8px 24px rgba(96,165,250,0.3));
}
.hero-title {
  font-size: 32px;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #60a5fa, #a78bfa, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;
  z-index: 1;
}
.hero-version {
  display: inline-block;
  margin: 8px 0;
  padding: 3px 10px;
  background: rgba(59,130,246,0.12);
  border: 1px solid rgba(59,130,246,0.3);
  border-radius: 999px;
  font-size: 12px;
  color: #60a5fa;
  font-weight: 500;
  position: relative;
  z-index: 1;
}
.hero-desc {
  font-size: 14px;
  color: var(--text-secondary, #94a3b8);
  margin: 6px 0 20px;
  position: relative;
  z-index: 1;
}
.hero-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}
.btn-primary, .btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s;
  border: 1px solid transparent;
}
.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  box-shadow: 0 4px 12px rgba(59,130,246,0.3);
}
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(59,130,246,0.4); }
.btn-ghost {
  background: var(--bg-secondary, #131b27);
  border-color: var(--border-color, #1a2435);
  color: var(--text-secondary, #94a3b8);
}
.btn-ghost:hover { border-color: #3b82f6; color: var(--text-primary, #e2e8f0); }

/* Sections */
.grid-section { margin-bottom: 28px; }
.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary, #94a3b8);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 12px;
  padding-left: 4px;
}

/* Stats grid */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}
.stat-card {
  position: relative;
  padding: 16px;
  background: var(--bg-secondary, #131b27);
  border: 1px solid var(--border-color, #1a2435);
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.18s, border-color 0.18s;
}
.stat-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--card-glow, transparent);
  opacity: 0.5;
  pointer-events: none;
}
.stat-card:hover { transform: translateY(-2px); }
.stat-blue   { --card-glow: radial-gradient(circle at top right, rgba(59,130,246,0.15), transparent 60%); }
.stat-blue:hover { border-color: rgba(59,130,246,0.5); }
.stat-purple { --card-glow: radial-gradient(circle at top right, rgba(139,92,246,0.15), transparent 60%); }
.stat-purple:hover { border-color: rgba(139,92,246,0.5); }
.stat-pink   { --card-glow: radial-gradient(circle at top right, rgba(236,72,153,0.15), transparent 60%); }
.stat-pink:hover { border-color: rgba(236,72,153,0.5); }
.stat-green  { --card-glow: radial-gradient(circle at top right, rgba(34,197,94,0.15), transparent 60%); }
.stat-green:hover { border-color: rgba(34,197,94,0.5); }
.stat-orange { --card-glow: radial-gradient(circle at top right, rgba(245,158,11,0.15), transparent 60%); }
.stat-orange:hover { border-color: rgba(245,158,11,0.5); }
.stat-cyan   { --card-glow: radial-gradient(circle at top right, rgba(6,182,212,0.15), transparent 60%); }
.stat-cyan:hover { border-color: rgba(6,182,212,0.5); }
.stat-icon { font-size: 22px; margin-bottom: 8px; position: relative; }
.stat-num {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary, #e2e8f0);
  line-height: 1;
  position: relative;
}
.stat-label {
  font-size: 12px;
  color: var(--text-muted, #64748b);
  margin-top: 6px;
  position: relative;
}

/* Distribution cards */
.dist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}
.dist-card {
  padding: 18px;
  background: var(--bg-secondary, #131b27);
  border: 1px solid var(--border-color, #1a2435);
  border-radius: 12px;
}
.dist-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12px;
}
.dist-head > span:first-child {
  font-size: 13px;
  color: var(--text-secondary, #94a3b8);
  font-weight: 500;
}
.dist-total {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary, #e2e8f0);
}
.dist-bar {
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  background: rgba(0,0,0,0.3);
  margin-bottom: 10px;
}
.dist-bar-fill {
  transition: width 0.6s cubic-bezier(0.32,0.72,0,1);
}
.dist-bar-fill.blue { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
.dist-bar-fill.purple { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
.dist-bar-fill.green { background: linear-gradient(90deg, #10b981, #22c55e); }
.dist-bar-fill.orange { background: linear-gradient(90deg, #f59e0b, #fb923c); }
.dist-legend {
  display: flex;
  gap: 18px;
  font-size: 12px;
  color: var(--text-muted, #64748b);
}
.dist-legend > span { display: inline-flex; align-items: center; gap: 6px; }
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.dot.blue { background: #3b82f6; }
.dot.purple { background: #8b5cf6; }
.dot.green { background: #10b981; }
.dot.orange { background: #f59e0b; }

/* Features */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}
.feature-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  background: var(--bg-secondary, #131b27);
  border: 1px solid var(--border-color, #1a2435);
  border-radius: 10px;
  transition: border-color 0.18s, background 0.18s;
}
.feature-card:hover {
  border-color: rgba(59,130,246,0.4);
  background: rgba(59,130,246,0.04);
}
.feature-icon {
  font-size: 20px;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59,130,246,0.1);
  border-radius: 8px;
}
.feature-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #e2e8f0);
  margin-bottom: 3px;
}
.feature-desc {
  font-size: 12px;
  color: var(--text-muted, #64748b);
  line-height: 1.4;
}

/* Recent sessions */
.recent-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.recent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--bg-secondary, #131b27);
  border: 1px solid var(--border-color, #1a2435);
  border-radius: 10px;
  transition: border-color 0.15s;
}
.recent-item:hover { border-color: rgba(59,130,246,0.4); }
.recent-icon { font-size: 18px; flex-shrink: 0; }
.recent-info { flex: 1; min-width: 0; }
.recent-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary, #e2e8f0);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.recent-meta { font-size: 11px; color: var(--text-muted, #64748b); margin-top: 2px; }
.recent-time { font-size: 11px; color: var(--text-muted, #64748b); flex-shrink: 0; }

/* Tech */
.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
}
.tech-card {
  padding: 12px 14px;
  background: var(--bg-secondary, #131b27);
  border: 1px solid var(--border-color, #1a2435);
  border-radius: 10px;
  transition: border-color 0.15s, transform 0.15s;
}
.tech-card:hover { border-color: rgba(59,130,246,0.4); transform: translateY(-1px); }
.tech-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #e2e8f0);
  margin-bottom: 2px;
}
.tech-desc { font-size: 11px; color: var(--text-muted, #64748b); }

/* Footer */
.page-footer {
  text-align: center;
  padding-top: 20px;
  margin-top: 16px;
  border-top: 1px solid var(--border-color, #1a2435);
}
.page-footer p {
  font-size: 12px;
  color: var(--text-muted, #64748b);
  margin: 4px 0;
}
.footer-sub { font-size: 11px; opacity: 0.7; }
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { openUrl } from '@tauri-apps/plugin-opener'
import { useUpdater } from '../composables/useUpdater'

const { release, currentVersion, showModal, dismissModal, skipVersion } = useUpdater()

const installerAsset = computed(() => {
  if (!release.value) return null
  return release.value.assets.find(a => /setup\.exe$/i.test(a.name))
    || release.value.assets.find(a => /\.exe$/i.test(a.name))
    || release.value.assets.find(a => /\.msi$/i.test(a.name))
    || release.value.assets[0]
    || null
})

const sizeText = computed(() => {
  const s = installerAsset.value?.size
  if (!s) return ''
  const mb = s / 1024 / 1024
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(s / 1024).toFixed(0)} KB`
})

const publishedText = computed(() => {
  if (!release.value?.publishedAt) return ''
  try { return new Date(release.value.publishedAt).toLocaleDateString('zh-CN') }
  catch { return release.value.publishedAt }
})

function downloadNow() {
  const url = installerAsset.value?.browser_download_url || release.value?.htmlUrl
  if (url) openUrl(url)
}

function viewOnGitHub() {
  if (release.value?.htmlUrl) openUrl(release.value.htmlUrl)
}

function skip() {
  if (release.value) skipVersion(release.value.version)
  dismissModal()
}
</script>

<template>
  <Transition name="um-fade">
    <div v-if="showModal && release" class="um-overlay" @click.self="dismissModal">
      <div class="um-card">
        <div class="um-glow"></div>
        <header class="um-head">
          <div class="um-badge">
            <span class="um-dot"></span>
            <span>NEW VERSION</span>
          </div>
          <button class="um-close" @click="dismissModal" title="关闭">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </header>

        <div class="um-title-row">
          <h2 class="um-title">发现新版本</h2>
          <div class="um-versions">
            <span class="um-cur">v{{ currentVersion }}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            <span class="um-new">v{{ release.version }}</span>
          </div>
        </div>

        <div class="um-meta">
          <span v-if="publishedText">📅 {{ publishedText }}</span>
          <span v-if="sizeText">📦 {{ sizeText }}</span>
          <span v-if="installerAsset">💻 {{ installerAsset.name }}</span>
        </div>

        <div v-if="release.notes" class="um-notes">
          <div class="um-notes-label">更新说明</div>
          <pre class="um-notes-body">{{ release.notes }}</pre>
        </div>

        <footer class="um-actions">
          <button class="um-btn um-btn-ghost" @click="skip">跳过此版本</button>
          <button class="um-btn um-btn-secondary" @click="viewOnGitHub">查看详情</button>
          <button class="um-btn um-btn-primary" @click="downloadNow">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            立即下载
          </button>
        </footer>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.um-overlay {
  position: fixed; inset: 0; z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.um-card {
  position: relative;
  width: 100%; max-width: 520px;
  max-height: 84vh;
  display: flex; flex-direction: column;
  border-radius: 18px;
  border: 1px solid var(--border-color, #1a2435);
  background: linear-gradient(180deg, rgba(19,27,39,0.96), rgba(10,15,22,0.94));
  box-shadow: 0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04);
  overflow: hidden;
}
:root:not(.dark) .um-card {
  background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96));
}

.um-glow {
  position: absolute;
  top: -100px; right: -60px;
  width: 280px; height: 280px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99,102,241,0.3), transparent 70%);
  filter: blur(40px);
  pointer-events: none;
}

.um-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 18px 22px 0;
  position: relative;
}
.um-badge {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 4px 12px; border-radius: 999px;
  background: rgba(99,102,241,0.14);
  border: 1px solid rgba(99,102,241,0.3);
  font-size: 10px; font-weight: 700; letter-spacing: 0.18em;
  color: #a5b4fc;
}
.um-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #818cf8;
  box-shadow: 0 0 0 0 rgba(129,140,248,0.6);
  animation: um-pulse 1.6s infinite;
}
@keyframes um-pulse {
  70% { box-shadow: 0 0 0 8px rgba(129,140,248,0); }
  100% { box-shadow: 0 0 0 0 rgba(129,140,248,0); }
}
.um-close {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
  color: var(--text-secondary, #94a3b8);
  border-radius: 8px; cursor: pointer;
  transition: all 0.15s;
}
.um-close:hover { background: rgba(239,68,68,0.12); color: #f87171; border-color: rgba(239,68,68,0.3); }

.um-title-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 22px 6px;
  position: relative;
  flex-wrap: wrap;
  gap: 12px;
}
.um-title {
  margin: 0;
  font-size: 22px; font-weight: 800;
  color: var(--text-primary, #e2e8f0);
  letter-spacing: -0.015em;
}
.um-versions {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 5px 12px;
  border-radius: 999px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px; font-weight: 600;
  color: var(--text-secondary, #94a3b8);
}
.um-cur { color: var(--text-muted, #64748b); text-decoration: line-through; }
.um-new {
  background: linear-gradient(135deg, #6366f1, #ec4899);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  font-weight: 700;
}

.um-meta {
  display: flex; flex-wrap: wrap; gap: 14px;
  padding: 0 22px 14px;
  font-size: 11px; color: var(--text-muted, #64748b);
  position: relative;
}

.um-notes {
  margin: 0 22px 14px;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  overflow-y: auto;
  max-height: 260px;
  position: relative;
}
:root:not(.dark) .um-notes { background: rgba(0,0,0,0.03); border-color: rgba(0,0,0,0.06); }
.um-notes-label {
  font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--text-muted, #64748b);
  margin-bottom: 8px;
}
.um-notes-body {
  margin: 0;
  font-family: inherit;
  font-size: 12px; line-height: 1.7;
  color: var(--text-secondary, #cbd5e1);
  white-space: pre-wrap; word-break: break-word;
}

.um-actions {
  display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px;
  padding: 14px 22px 18px;
  border-top: 1px solid var(--border-color, #1a2435);
  position: relative;
}
.um-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 13px; font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
}
.um-btn-ghost {
  background: transparent;
  color: var(--text-muted, #64748b);
}
.um-btn-ghost:hover { color: var(--text-secondary, #94a3b8); background: rgba(255,255,255,0.04); }
.um-btn-secondary {
  background: rgba(255,255,255,0.04);
  border-color: rgba(255,255,255,0.08);
  color: var(--text-secondary, #94a3b8);
}
.um-btn-secondary:hover {
  border-color: rgba(99,102,241,0.4);
  color: var(--text-primary, #e2e8f0);
}
:root:not(.dark) .um-btn-secondary {
  background: rgba(0,0,0,0.04);
  border-color: rgba(0,0,0,0.08);
}
.um-btn-primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  box-shadow: 0 6px 18px rgba(99,102,241,0.32);
}
.um-btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 22px rgba(99,102,241,0.42);
}

.um-fade-enter-active, .um-fade-leave-active { transition: opacity 0.2s; }
.um-fade-enter-from, .um-fade-leave-to { opacity: 0; }
.um-fade-enter-active .um-card, .um-fade-leave-active .um-card { transition: transform 0.25s cubic-bezier(0.32,0.72,0,1); }
.um-fade-enter-from .um-card { transform: translateY(20px) scale(0.96); }
.um-fade-leave-to .um-card { transform: translateY(20px) scale(0.96); }
</style>

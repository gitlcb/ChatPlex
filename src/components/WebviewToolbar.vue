<script setup lang="ts">
import { computed, ref } from 'vue'
import { openUrl } from '@tauri-apps/plugin-opener'
import { useServiceManager } from '../composables/useServiceManager'
import { useAppStore } from '../stores/app'
import { SERVICES } from '../types/services'

const {
  activeServiceId,
  serviceUrls,
  refreshService,
  runActiveWebviewScript,
} = useServiceManager()

const store = useAppStore()
const copied = ref(false)

const activeService = computed(() => {
  if (!activeServiceId.value) return null
  return SERVICES.find(s => s.id === activeServiceId.value)
    || store.customServices.find(s => s.id === activeServiceId.value)
    || null
})

const currentUrl = computed(() => {
  if (!activeServiceId.value) return ''
  return serviceUrls.get(activeServiceId.value) || activeService.value?.url || ''
})

const hostLabel = computed(() => {
  try {
    return new URL(currentUrl.value).host
  } catch {
    return currentUrl.value || '当前网页'
  }
})

async function goBack() {
  await runActiveWebviewScript('history.back();')
}

async function goForward() {
  await runActiveWebviewScript('history.forward();')
}

async function reloadPage() {
  await runActiveWebviewScript('location.reload();')
}

async function hardReloadService() {
  if (activeServiceId.value) await refreshService(activeServiceId.value)
}

async function copyUrl() {
  if (!currentUrl.value) return
  await navigator.clipboard.writeText(currentUrl.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 1200)
}

function openExternal() {
  if (currentUrl.value) openUrl(currentUrl.value)
}
</script>

<template>
  <div class="webview-toolbar">
    <div class="toolbar-left">
      <button class="tool-btn" title="后退" @click="goBack">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <button class="tool-btn" title="前进" @click="goForward">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <button class="tool-btn" title="刷新网页" @click="reloadPage">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M21 12a9 9 0 0 1-15.2 6.5M3 12A9 9 0 0 1 18.2 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M21 4v6h-6M3 20v-6h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <div class="address-pill" :title="currentUrl">
      <span class="secure-dot"></span>
      <span class="address-text">{{ hostLabel }}</span>
    </div>

    <div class="toolbar-right">
      <button class="tool-btn wide" :title="copied ? '已复制' : '复制当前链接'" @click="copyUrl">
        <svg v-if="!copied" width="16" height="16" viewBox="0 0 24 24" fill="none">
          <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/>
          <rect x="2" y="2" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/>
        </svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <button class="tool-btn" title="外部浏览器打开" @click="openExternal">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M14 3h7v7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <button class="tool-btn" title="重新加载服务" @click="hardReloadService">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M3 12a9 9 0 1 0 3-6.7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M3 4v6h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.webview-toolbar {
  position: absolute;
  inset: 0 0 auto 0;
  z-index: 20;
  height: 44px;
  display: grid;
  grid-template-columns: auto minmax(120px, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  background: var(--bg-primary, #0a0f16);
  border-bottom: 1px solid var(--border-color, #1a2435);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tool-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--text-secondary, #94a3b8);
  background: transparent;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease, border-color 0.16s ease;
}

.tool-btn:hover {
  color: var(--text-primary, #e2e8f0);
  background: rgba(255, 255, 255, 0.06);
  border-color: var(--border-color, rgba(255, 255, 255, 0.1));
}

:global(:root.dark) .tool-btn {
  color: var(--text-secondary, #cbd5e1);
}

:global(:root.dark) .tool-btn:hover {
  background: rgba(96, 165, 250, 0.12);
  color: var(--text-primary, #f8fafc);
}

.address-pill {
  min-width: 0;
  height: 32px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border-radius: 9px;
  background: var(--bg-secondary, #131b27);
  border: 1px solid var(--border-color, #1a2435);
  color: var(--text-secondary, #94a3b8);
}

:global(:root.dark) .address-pill {
  color: var(--text-secondary, #cbd5e1);
}

.secure-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12);
  flex-shrink: 0;
}

.address-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 600;
}
</style>

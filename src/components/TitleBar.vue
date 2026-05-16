<script setup lang="ts">
import { computed } from 'vue'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useAppStore } from '../stores/app'
import { useServiceManager } from '../composables/useServiceManager'
import { SERVICES } from '../types/services'

const store = useAppStore()
const { activeServiceId } = useServiceManager()
const win = getCurrentWindow()

const activeServiceName = computed(() => {
  if (!activeServiceId.value) return 'ChatPlex'
  const svc = SERVICES.find(s => s.id === activeServiceId.value)
  return svc?.name || 'ChatPlex'
})

function minimize() { win.minimize() }
function toggleMaximize() { win.toggleMaximize() }
function closeToTray() { win.hide() }
</script>

<template>
  <div class="titlebar" data-tauri-drag-region>
    <div class="tb-left" data-tauri-drag-region>
      <img src="/chatplex-logo.png" class="tb-logo" />
      <span class="tb-title">{{ activeServiceName }}</span>
    </div>
    <div class="tb-right">
      <button class="tb-btn" @click="store.showSettings = true" title="设置">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
      </button>
      <button class="tb-btn tb-min" @click="minimize" title="最小化">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
      <button class="tb-btn tb-max" @click="toggleMaximize" title="最大化">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
      </button>
      <button class="tb-btn tb-close" @click="closeToTray" title="最小化到托盘">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.titlebar {
  display: flex; align-items: center; justify-content: space-between;
  height: 36px; background: var(--bg-sidebar, #0c1017);
  border-bottom: 1px solid var(--border-color, #1a2435);
  padding: 0 8px 0 12px; flex-shrink: 0; user-select: none;
  -webkit-app-region: drag;
}
.tb-left { display: flex; align-items: center; gap: 8px; pointer-events: none; }
.tb-logo { width: 20px; height: 20px; border-radius: 4px; }
.tb-title { font-size: 13px; color: var(--text-secondary, #94a3b8); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 300px; }
.tb-right { display: flex; align-items: center; -webkit-app-region: no-drag; }
.tb-btn {
  width: 36px; height: 28px; display: flex; align-items: center; justify-content: center;
  background: none; border: none; color: var(--text-secondary, #94a3b8); cursor: pointer;
  transition: all 0.15s; border-radius: 6px;
}
.tb-btn:hover { background: rgba(255,255,255,0.08); color: var(--text-primary, #e2e8f0); }
.tb-close:hover { background: #ef4444; color: white; }
</style>

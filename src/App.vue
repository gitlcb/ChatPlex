<script setup lang="ts">
import { onMounted, onUnmounted, computed, watch } from 'vue'
import TitleBar from './components/TitleBar.vue'
import Sidebar from './components/Sidebar.vue'
import RightSidebar from './components/RightSidebar.vue'
import WelcomeScreen from './components/WelcomeScreen.vue'
import FreeChat from './components/FreeChat.vue'
import FreeDraw from './components/FreeDraw.vue'
import AboutPage from './components/AboutPage.vue'
import EntertainmentPage from './components/EntertainmentPage.vue'
import VibeCodingPage from './components/VibeCodingPage.vue'
import SettingsModal from './components/SettingsModal.vue'
import UpdateModal from './components/UpdateModal.vue'
import { useServiceManager } from './composables/useServiceManager'
import { useAppStore } from './stores/app'
import { useUpdater } from './composables/useUpdater'
import { SERVICES } from './types/services'
import { listen } from '@tauri-apps/api/event'

const {
  activeServiceId,
  loadingServiceId,
  activeRightPanel,
  debugLogs,
  showDebug,
  handleWindowResize,
  hideActiveWebview,
  showActiveWebview,
} = useServiceManager()
const store = useAppStore()
const { checkForUpdate } = useUpdater()

const activeService = computed(() => activeServiceId.value ? SERVICES.find(s => s.id === activeServiceId.value) : null)
const activeIsChat = computed(() => activeService.value?.type === 'chat')
const activeIsVisual = computed(() => activeService.value?.type === 'visual' && activeService.value?.id === 'free-draw')

watch(() => store.showSettings, async (open) => {
  if (open) await hideActiveWebview()
  else await showActiveWebview()
})

onMounted(() => {
  window.addEventListener('resize', handleWindowResize)
  store.loadSettings()

  setTimeout(() => { checkForUpdate({ silent: true }) }, 3000)

  // Global keyboard shortcuts (frontend fallback)
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'f' && store.activeSession) {
      e.preventDefault()
      store.toggleSearch()
    }
    if (e.ctrlKey && e.key === ',') {
      e.preventDefault()
      store.showSettings = true
    }
    if (e.ctrlKey && e.key === 'n' && store.activeSessionId) {
      e.preventDefault()
      store.createNewSession()
    }
  })

  // Tauri global shortcuts
  listen<string>('global-shortcut', (event) => {
    switch (event.payload) {
      case 'N': store.createNewSession(); break
      case '/': /* focus input */ break
      case ',': store.showSettings = true; break
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize)
})
</script>

<template>
  <div class="app-layout" :class="{ 'has-titlebar': true }">
    <TitleBar />
    <div class="app-body">
      <Sidebar />
      <main class="content-area">
        <!-- Right panel pages -->
        <AboutPage v-if="activeRightPanel === 'about'" />
        <EntertainmentPage v-else-if="activeRightPanel === 'entertainment'" />
        <VibeCodingPage v-else-if="activeRightPanel === 'vibe-coding'" />

        <!-- Normal content (hidden when right panel is active) -->
        <template v-if="!activeRightPanel">
          <WelcomeScreen v-if="!activeServiceId && !loadingServiceId" />

          <div v-if="loadingServiceId && !activeServiceId" class="loading-overlay">
            <div class="loading-spinner-large">
              <svg class="spinner-large" width="40" height="40" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.2"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
              </svg>
            </div>
            <p class="loading-text">正在加载服务...</p>
          </div>

          <FreeChat v-if="activeServiceId && activeIsChat" />
          <FreeDraw v-else-if="activeServiceId && activeIsVisual" />
        </template>
      </main>
      <RightSidebar />
    </div>

    <!-- Settings Modal -->
    <SettingsModal />
    <UpdateModal />

    <!-- Debug Log Panel -->
    <div v-if="showDebug" class="debug-panel">
      <div class="debug-header">
        <span>调试日志 (Ctrl+Shift+D 切换)</span>
        <button @click="showDebug = false" class="debug-close">✕</button>
      </div>
      <div class="debug-logs">
        <div v-for="(log, i) in debugLogs" :key="i" class="debug-log-line">{{ log }}</div>
        <div v-if="debugLogs.length === 0" class="debug-log-line empty">暂无日志，点击左侧AI服务试试</div>
      </div>
    </div>
  </div>
</template>

<style>
/* ========== Global Reset & Theme Variables ========== */
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  /* Light theme (default) */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --bg-tertiary: #e8e8e8;
  --bg-sidebar: #f8f9fa;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --text-muted: #999999;
  --border-color: #e0e0e0;
  --accent: #2563eb;
  --code-bg: #f6f8fa;
  --chat-text: #1a1a1a;
  --chat-user: #e3f2fd;

  --sidebar-width: 200px;
  --sidebar-collapsed-width: 56px;
}

:root.dark {
  --bg-primary: #0a0f16;
  --bg-secondary: #131b27;
  --bg-tertiary: #1a2435;
  --bg-sidebar: #0c1017;
  --text-primary: #e2e8f0;
  --text-secondary: #94a3b8;
  --text-muted: #475569;
  --border-color: #1a2435;
  --accent: #3b82f6;
  --code-bg: #0d1117;
  --chat-text: #e2e8f0;
  --chat-user: #1e3a5f;
}

html, body, #app {
  width: 100%; height: 100%; overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans SC', sans-serif;
  -webkit-font-smoothing: antialiased;
  background: var(--bg-primary);
  color: var(--text-primary);
}
body { user-select: none; overflow: hidden; }

::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--bg-tertiary); border-radius: 3px; }
</style>

<style scoped>
.app-layout {
  display: flex; flex-direction: column; width: 100vw; height: 100vh;
  overflow: hidden; background: var(--bg-primary);
}
.app-body { display: flex; flex: 1; overflow: hidden; }

.content-area {
  flex: 1; height: 100%; overflow: hidden;
  position: relative; background: var(--bg-primary);
}

/* Loading */
.loading-overlay {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  height: 100%; gap: 16px;
}
.spinner-large { animation: spin 0.8s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.loading-text { font-size: 14px; color: var(--text-muted); }

/* Debug Panel */
.debug-panel {
  position: fixed; bottom: 0; left: 0; right: 0;
  max-height: 200px; background: rgba(0,0,0,0.92);
  border-top: 1px solid #333; z-index: 9999;
  display: flex; flex-direction: column;
  font-family: 'Cascadia Code', 'Fira Code', monospace;
  font-size: 12px;
}
.debug-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 12px; background: #111; color: #60a5fa;
  border-bottom: 1px solid #333; font-size: 11px;
}
.debug-close {
  background: none; border: none; color: #f87171; cursor: pointer;
  font-size: 14px; padding: 0 4px;
}
.debug-logs { overflow-y: auto; padding: 4px 12px; flex: 1; }
.debug-log-line { padding: 2px 0; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.03); }
.debug-log-line.empty { color: #475569; font-style: italic; }
</style>

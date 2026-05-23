<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue'
import TitleBar from './components/TitleBar.vue'
import Sidebar from './components/Sidebar.vue'
import RightSidebar from './components/RightSidebar.vue'
import WebviewToolbar from './components/WebviewToolbar.vue'
import WelcomeScreen from './components/WelcomeScreen.vue'
import FreeChat from './components/FreeChat.vue'
import FreeDraw from './components/FreeDraw.vue'
import AboutPage from './components/AboutPage.vue'
import EntertainmentPage from './components/EntertainmentPage.vue'
import VibeCodingPage from './components/VibeCodingPage.vue'
import CommandCenterPage from './components/CommandCenterPage.vue'
import SettingsPage from './components/SettingsPage.vue'
import UpdateModal from './components/UpdateModal.vue'
import { useServiceManager } from './composables/useServiceManager'
import { useAppStore } from './stores/app'
import { useUpdater } from './composables/useUpdater'
import {
  dismissDownloadNotification,
  downloadNotifications,
  initDownloadNotifications,
  stopDownloadNotifications,
} from './composables/useDownloadNotifications'
import { SERVICES } from './types/services'
import { listen } from '@tauri-apps/api/event'

const {
  activeServiceId,
  loadingServiceId,
  activeRightPanel,
  debugLogs,
  showDebug,
  handleWindowResize,
  toggleRightPanel,
  setServiceNavigation,
  syncWebviewTheme,
} = useServiceManager()
const store = useAppStore()
const { checkForUpdate } = useUpdater()

function findService(id: string) {
  return SERVICES.find(s => s.id === id) || store.customServices.find(s => s.id === id)
}

const activeService = computed(() => activeServiceId.value ? findService(activeServiceId.value) : null)
const activeIsChat = computed(() => activeService.value?.type === 'chat')
const activeIsVisual = computed(() => activeService.value?.type === 'visual' && activeService.value?.id === 'free-draw')
const activeIsWebview = computed(() => Boolean(activeServiceId.value && activeService.value?.type !== 'chat'))

interface ServiceNavigationPayload {
  label: string
  url: string
}

function handleThemeChanged(event: Event) {
  const theme = (event as CustomEvent<'light' | 'dark'>).detail
  syncWebviewTheme(theme)
}

onMounted(() => {
  window.addEventListener('resize', handleWindowResize)
  window.addEventListener('chatplex-theme-changed', handleThemeChanged)
  store.loadSettings()

  setTimeout(() => { checkForUpdate({ silent: true }) }, 3000)
  initDownloadNotifications().catch(() => {})

  // Global keyboard shortcuts (frontend fallback)
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'f' && store.activeSession) {
      e.preventDefault()
      store.toggleSearch()
    }
    if (e.ctrlKey && e.key === ',') {
      e.preventDefault()
      toggleRightPanel('settings')
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
      case ',': toggleRightPanel('settings'); break
    }
  })

  listen<ServiceNavigationPayload>('service-navigation', (event) => {
    setServiceNavigation(event.payload.label, event.payload.url)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize)
  window.removeEventListener('chatplex-theme-changed', handleThemeChanged)
  stopDownloadNotifications()
})
</script>

<template>
  <div class="app-layout" :class="{ 'has-titlebar': true }">
    <TitleBar />
    <div class="app-body">
      <Sidebar />
      <main class="content-area">
        <!-- Right panel pages -->
        <SettingsPage v-if="activeRightPanel === 'settings'" />
        <AboutPage v-else-if="activeRightPanel === 'about'" />
        <EntertainmentPage v-else-if="activeRightPanel === 'entertainment'" />
        <VibeCodingPage v-else-if="activeRightPanel === 'vibe-coding'" />
        <CommandCenterPage v-else-if="activeRightPanel === 'command-center'" />

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
          <WebviewToolbar v-else-if="activeIsWebview" />
        </template>
      </main>
      <RightSidebar />
    </div>

    <!-- Update Modal -->
    <UpdateModal />

    <!-- Download Notifications -->
    <div v-if="downloadNotifications.length" class="download-stack">
      <div
        v-for="item in downloadNotifications"
        :key="item.id"
        class="download-toast"
        :class="item.tone"
      >
        <div class="download-icon">
          <svg v-if="item.tone === 'success'" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else-if="item.tone === 'error'" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 8v5M12 17h.01" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
          </svg>
          <svg v-else-if="item.tone === 'warning'" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
          </svg>
          <svg v-else class="download-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.25"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="download-copy">
          <div class="download-title">{{ item.title }}</div>
          <div class="download-detail" :title="item.path || item.fileName">{{ item.detail }}</div>
        </div>
        <button class="download-close" @click="dismissDownloadNotification(item.id)" title="关闭">×</button>
      </div>
    </div>

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
  --bg-hover: #eeeeee;
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

:root.dark,
body.dark {
  --bg-primary: #0a0f16;
  --bg-secondary: #131b27;
  --bg-tertiary: #1a2435;
  --bg-hover: #1f2d42;
  --bg-sidebar: #0c1017;
  --text-primary: #e2e8f0;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --border-color: #1f2a3d;
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
html.dark,
html.dark body,
html.dark #app,
body.dark,
body.dark #app {
  background: #0a0f16;
  color: #e2e8f0;
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

/* Download Notifications */
.download-stack {
  position: fixed;
  right: 84px;
  bottom: 18px;
  z-index: 12000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: min(360px, calc(100vw - 120px));
  pointer-events: none;
}

.download-toast {
  pointer-events: auto;
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) 24px;
  align-items: center;
  gap: 10px;
  padding: 10px 10px 10px 12px;
  border-radius: 12px;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.22);
}

.download-toast.success { border-color: rgba(34, 197, 94, 0.35); }
.download-toast.warning { border-color: rgba(245, 158, 11, 0.38); }
.download-toast.error { border-color: rgba(239, 68, 68, 0.38); }

.download-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  background: rgba(59, 130, 246, 0.12);
}

.download-toast.success .download-icon { color: #22c55e; background: rgba(34, 197, 94, 0.12); }
.download-toast.warning .download-icon { color: #f59e0b; background: rgba(245, 158, 11, 0.12); }
.download-toast.error .download-icon { color: #ef4444; background: rgba(239, 68, 68, 0.12); }
.download-spinner { animation: spin 0.8s linear infinite; }

.download-copy { min-width: 0; }
.download-title {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.3;
}
.download-detail {
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.download-close {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 7px;
  color: var(--text-muted);
  background: transparent;
  cursor: pointer;
  font-size: 17px;
  line-height: 1;
}
.download-close:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
}

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

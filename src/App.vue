<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import Sidebar from './components/Sidebar.vue';
import WelcomeScreen from './components/WelcomeScreen.vue';
import FreeChat from './components/FreeChat.vue';
import { useServiceManager } from './composables/useServiceManager';
import { SERVICES } from './types/services';

const { activeServiceId, loadingServiceId, debugLogs, showDebug, handleWindowResize } = useServiceManager();

const activeIsChat = () => activeServiceId.value ? SERVICES.find(s => s.id === activeServiceId.value)?.type === 'chat' : false;

onMounted(() => {
  window.addEventListener('resize', handleWindowResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize);
});
</script>

<template>
  <div class="app-layout">
    <Sidebar />
    <main class="content-area">
      <!-- Welcome screen when no service is active -->
      <WelcomeScreen v-if="!activeServiceId && !loadingServiceId" />

      <!-- Loading overlay -->
      <div v-if="loadingServiceId && !activeServiceId" class="loading-overlay">
        <div class="loading-spinner-large">
          <svg class="spinner-large" width="40" height="40" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.2"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
        <p class="loading-text">正在加载服务...</p>
      </div>

      <!-- Built-in chat page (公益AI etc.) -->
      <FreeChat v-if="activeServiceId && activeIsChat()" />

      <!--
        When a webview-type service is active, a Tauri Webview overlays this area.
        The webview is positioned at (sidebarWidth, 0) and sized to fill
        the remaining space. It sits on top of this content area.
      -->
    </main>

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
/* ========== Global Reset & Variables ========== */
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --sidebar-width: 200px;
  --sidebar-collapsed-width: 56px;
  --bg-primary: #0a0f16;
  --bg-sidebar: #0c1017;
  --border-color: #1a2435;
  --text-primary: #e2e8f0;
  --text-secondary: #94a3b8;
  --text-muted: #475569;
  --accent: #3b82f6;
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
::-webkit-scrollbar-thumb { background: #1e2a3a; border-radius: 3px; }
</style>

<style scoped>
.app-layout {
  display: flex; width: 100vw; height: 100vh;
  overflow: hidden; background: var(--bg-primary);
}

.content-area {
  flex: 1; height: 100vh; overflow: hidden;
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
.loading-text { font-size: 14px; color: #64748b; }

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
.debug-logs {
  overflow-y: auto; padding: 4px 12px; flex: 1;
}
.debug-log-line {
  padding: 2px 0; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.03);
}
.debug-log-line.empty { color: #475569; font-style: italic; }
</style>
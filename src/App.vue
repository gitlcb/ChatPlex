<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import Sidebar from './components/Sidebar.vue';
import WelcomeScreen from './components/WelcomeScreen.vue';
import { useServiceManager } from './composables/useServiceManager';

const { activeServiceId, handleWindowResize } = useServiceManager();

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
      <WelcomeScreen v-if="!activeServiceId" />
      <!--
        When a service is active, a Tauri Webview overlays this area.
        The webview is positioned at (sidebarWidth, 0) and sized to fill
        the remaining space. It sits on top of this content area.
      -->
    </main>
  </div>
</template>

<style>
/* ========== Global Reset & Variables ========== */
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --sidebar-width: 256px;
  --sidebar-collapsed-width: 56px;
  --bg-primary: #0a0f16;
  --bg-sidebar: #0c1017;
  --bg-sidebar-hover: rgba(255, 255, 255, 0.04);
  --bg-sidebar-active: rgba(59, 130, 246, 0.10);
  --border-color: #1a2435;
  --text-primary: #e2e8f0;
  --text-secondary: #94a3b8;
  --text-muted: #475569;
  --accent: #3b82f6;
  --accent-light: #60a5fa;
}

html, body, #app {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: var(--bg-primary);
  color: var(--text-primary);
}

body {
  user-select: none;
  overflow: hidden;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 5px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #1e2a3a;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #2a3a4a;
}
</style>

<style scoped>
.app-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-primary);
}

.content-area {
  flex: 1;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background: var(--bg-primary);
}
</style>
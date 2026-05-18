<script setup lang="ts">
import { useServiceManager } from '../composables/useServiceManager'

const { activeRightPanel, toggleRightPanel } = useServiceManager()
</script>

<template>
  <aside class="right-sidebar">
    <button
      class="rs-btn"
      :class="{ active: activeRightPanel === 'settings' }"
      title="设置"
      @click="toggleRightPanel('settings')"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
      </svg>
      <span class="rs-indicator" :class="{ visible: activeRightPanel === 'settings' }"></span>
    </button>

    <button
      class="rs-btn"
      :class="{ active: activeRightPanel === 'about' }"
      title="关于"
      @click="toggleRightPanel('about')"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
      </svg>
      <span class="rs-indicator" :class="{ visible: activeRightPanel === 'about' }"></span>
    </button>

    <button
      class="rs-btn"
      :class="{ active: activeRightPanel === 'entertainment' }"
      title="娱乐中心"
      @click="toggleRightPanel('entertainment')"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-3.5 6a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm7 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM12 17.5c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z"/>
      </svg>
      <span class="rs-indicator" :class="{ visible: activeRightPanel === 'entertainment' }"></span>
    </button>

    <button
      class="rs-btn"
      :class="{ active: activeRightPanel === 'vibe-coding' }"
      title="Vibe Coding 推荐"
      @click="toggleRightPanel('vibe-coding')"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
      </svg>
      <span class="rs-indicator" :class="{ visible: activeRightPanel === 'vibe-coding' }"></span>
    </button>
  </aside>
</template>

<style scoped>
.right-sidebar {
  width: 48px;
  height: 100%;
  background: #0c1017;
  border-left: 1px solid #1a2435;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
  gap: 4px;
  flex-shrink: 0;
  z-index: 100;
}

.rs-btn {
  position: relative;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #64748b;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.rs-btn:hover { background: rgba(255,255,255,0.04); color: #e2e8f0; }
.rs-btn.active { background: rgba(59,130,246,0.12); color: #e2e8f0; }

.rs-indicator {
  position: absolute;
  right: -6px;
  top: 50%;
  transform: translateY(-50%) scaleY(0);
  width: 3px;
  height: 20px;
  border-radius: 3px 0 0 3px;
  background: #3b82f6;
  transition: transform 0.2s cubic-bezier(0.4,0,0.2,1);
}
.rs-indicator.visible { transform: translateY(-50%) scaleY(1); }
</style>

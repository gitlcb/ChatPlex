<script setup lang="ts">
import { useServiceManager } from '../composables/useServiceManager'

const { activeRightPanel, toggleRightPanel } = useServiceManager()
</script>

<template>
  <div class="rs-container">
    <aside class="right-sidebar">
      <div class="rs-group">
        <button
          class="rs-btn"
          :class="{ active: activeRightPanel === 'settings' }"
          title="设置"
          @click="toggleRightPanel('settings')"
        >
          <div class="rs-icon-wrapper">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"></path>
            </svg>
          </div>
        </button>

        <button
          class="rs-btn"
          :class="{ active: activeRightPanel === 'about' }"
          title="关于"
          @click="toggleRightPanel('about')"
        >
          <div class="rs-icon-wrapper">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
            </svg>
          </div>
        </button>
      </div>

      <div class="rs-divider"></div>

      <div class="rs-group">
        <button
          class="rs-btn"
          :class="{ active: activeRightPanel === 'entertainment' }"
          title="娱乐中心"
          @click="toggleRightPanel('entertainment')"
        >
          <div class="rs-icon-wrapper">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="2"></rect>
              <path d="M12 12h.01"></path>
              <path d="M17 12h.01"></path>
              <path d="M7 12h.01"></path>
            </svg>
          </div>
        </button>

        <button
          class="rs-btn"
          :class="{ active: activeRightPanel === 'command-center' }"
          title="命令中心"
          @click="toggleRightPanel('command-center')"
        >
          <div class="rs-icon-wrapper">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2"></rect>
              <path d="M7 8h10"></path>
              <path d="M7 12h6"></path>
              <path d="M7 16h8"></path>
            </svg>
          </div>
        </button>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.rs-container {
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
  background: var(--bg-primary, #ffffff);
  padding: 0 12px 0 12px; 
  flex-shrink: 0;
  z-index: 200;
  border-left: 1px solid var(--border-color, #e0e0e0);
}

.right-sidebar {
  width: 48px;
  background: var(--bg-secondary, #f5f5f5);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 1px solid var(--border-color, #e0e0e0);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12), inset 0 1px 0 rgba(255,255,255,0.55);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
  gap: 12px;
  flex-shrink: 0;
}

:global(:root.dark) .right-sidebar {
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255,255,255,0.08);
}

.rs-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  align-items: center;
}

.rs-divider {
  width: 24px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border-color, #e0e0e0), transparent);
  margin: 4px 0;
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
  border-radius: 12px;
  color: var(--text-secondary, #666666);
  cursor: pointer;
  outline: none;
}

.rs-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  background: transparent;
}

.rs-btn:hover .rs-icon-wrapper {
  background: var(--bg-tertiary, #e8e8e8);
  color: var(--text-primary, #1a1a1a);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(15,23,42,0.12);
}

.rs-btn.active .rs-icon-wrapper {
  background: rgba(37, 99, 235, 0.12);
  color: var(--accent, #2563eb);
  box-shadow: 0 8px 20px rgba(37,99,235,0.16), inset 0 1px 1px rgba(255,255,255,0.25);
  transform: scale(1);
}

:global(:root.dark) .rs-btn:hover .rs-icon-wrapper {
  background: rgba(96, 165, 250, 0.12);
}

:global(:root.dark) .rs-btn.active .rs-icon-wrapper {
  background: rgba(96, 165, 250, 0.18);
  color: #bfdbfe;
}
</style>

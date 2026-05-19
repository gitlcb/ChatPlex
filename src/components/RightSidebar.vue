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
          :class="{ active: activeRightPanel === 'vibe-coding' }"
          title="Vibe Coding"
          @click="toggleRightPanel('vibe-coding')"
        >
          <div class="rs-icon-wrapper">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
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
  background: var(--bg-primary, #0a0f16); /* Add a solid base behind the glass to prevent webview bleed if necessary */
  padding: 0 12px 0 12px; 
  flex-shrink: 0; /* Prevent shrinking in flex container */
  z-index: 200;
  border-left: 1px solid rgba(255, 255, 255, 0.05); /* Clean separator from content area */
}

.right-sidebar {
  width: 48px;
  background: rgba(20, 20, 20, 0.6);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
  gap: 12px;
  flex-shrink: 0;
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
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
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
  color: #a1a1aa; /* Zinc 400 */
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
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.rs-btn.active .rs-icon-wrapper {
  background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05));
  color: #ffffff;
  box-shadow: 0 8px 20px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.2);
  transform: scale(1);
}
</style>
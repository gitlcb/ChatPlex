<script setup lang="ts">
import { ref } from 'vue'
import GeneralTab from './settings/GeneralTab.vue'
import SidebarTab from './settings/SidebarTab.vue'
import AITab from './settings/AITab.vue'
import AboutTab from './settings/AboutTab.vue'

const tab = ref<'general' | 'sidebar' | 'ai' | 'about'>('general')

const tabs = [
  { id: 'general', label: '常规设置', icon: '⚙️' },
  { id: 'sidebar', label: '服务管理', icon: '📋' },
  { id: 'ai', label: '可用模型', icon: '🤖' },
  { id: 'about', label: '关于', icon: 'ℹ️' },
] as const
</script>

<template>
  <div class="settings-page">
    <div class="sp-layout">
      <!-- Sidebar Navigation -->
      <aside class="sp-sidebar">
        <div class="sp-header">
          <h2>偏好设置</h2>
        </div>
        <nav class="sp-nav">
          <button
            v-for="t in tabs"
            :key="t.id"
            class="sp-nav-btn"
            :class="{ active: tab === t.id }"
            @click="tab = t.id as any"
          >
            <span class="sp-nav-icon">{{ t.icon }}</span>
            <span class="sp-nav-label">{{ t.label }}</span>
          </button>
        </nav>
      </aside>

      <!-- Main Content Area -->
      <main class="sp-main">
        <div class="sp-content">
          <transition name="fade-slide" mode="out-in">
            <GeneralTab v-if="tab === 'general'" />
            <SidebarTab v-else-if="tab === 'sidebar'" />
            <AITab v-else-if="tab === 'ai'" />
            <AboutTab v-else-if="tab === 'about'" />
          </transition>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-primary, #0a0f16);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.sp-layout {
  display: flex;
  height: 100%;
  width: 100%;
}

.sp-sidebar {
  width: 240px;
  background: var(--bg-secondary, rgba(255, 255, 255, 0.02));
  border-right: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  padding: 24px 16px;
}

.sp-header {
  padding: 0 12px 24px;
}

.sp-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary, #ffffff);
  margin: 0;
  letter-spacing: -0.5px;
}

.sp-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sp-nav-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--text-secondary, #94a3b8);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.sp-nav-btn:hover {
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary, #ffffff);
}

.sp-nav-btn.active {
  background: var(--accent, #3b82f6);
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
}

.sp-nav-icon { 
  font-size: 18px; 
  width: 24px; 
  text-align: center; 
  flex-shrink: 0; 
  opacity: 0.9;
}

.sp-nav-btn.active .sp-nav-icon {
  opacity: 1;
}

.sp-nav-label { 
  white-space: nowrap; 
}

.sp-main {
  flex: 1;
  overflow-y: auto;
  background: var(--bg-primary, #0a0f16);
}

.sp-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>

<script setup lang="ts">
import { ref } from 'vue'
import GeneralTab from './settings/GeneralTab.vue'
import SidebarTab from './settings/SidebarTab.vue'
import AITab from './settings/AITab.vue'
import AboutTab from './settings/AboutTab.vue'

const tab = ref<'general' | 'sidebar' | 'ai' | 'about'>('general')

const tabs = [
  { id: 'general', label: '常规', icon: '⚙️' },
  { id: 'sidebar', label: '侧栏', icon: '📋' },
  { id: 'ai', label: 'AI', icon: '🤖' },
  { id: 'about', label: '关于', icon: 'ℹ️' },
] as const
</script>

<template>
  <div class="settings-page">
    <div class="sp-header">
      <h2>设置</h2>
    </div>
    <div class="sp-body">
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
      <div class="sp-content">
        <GeneralTab v-if="tab === 'general'" />
        <SidebarTab v-if="tab === 'sidebar'" />
        <AITab v-if="tab === 'ai'" />
        <AboutTab v-if="tab === 'about'" />
      </div>
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
}

.sp-header {
  padding: 20px 28px 16px;
  flex-shrink: 0;
}
.sp-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary, #e2e8f0);
}

.sp-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sp-nav {
  width: 180px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 12px 20px 20px;
  flex-shrink: 0;
  overflow-y: auto;
}

.sp-nav-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--text-secondary, #94a3b8);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}
.sp-nav-btn:hover {
  background: rgba(255,255,255,0.04);
  color: var(--text-primary, #e2e8f0);
}
.sp-nav-btn.active {
  background: rgba(59,130,246,0.1);
  color: var(--accent, #3b82f6);
}

.sp-nav-icon { font-size: 16px; width: 20px; text-align: center; flex-shrink: 0; }
.sp-nav-label { white-space: nowrap; }

.sp-content {
  flex: 1;
  padding: 0 28px 20px 20px;
  overflow-y: auto;
}
</style>

<script setup lang="ts">
import { useAppStore, type Theme } from '../../stores/app'
const store = useAppStore()

const themes: { value: Theme; label: string; icon: string }[] = [
  { value: 'light', label: '浅色', icon: '☀️' },
  { value: 'dark', label: '深色', icon: '🌙' },
  { value: 'system', label: '跟随系统', icon: '💻' },
]
</script>

<template>
  <div class="general-tab">
    <div class="setting-group">
      <label class="setting-label">主题</label>
      <div class="theme-cards">
        <div v-for="t in themes" :key="t.value"
          class="theme-card" :class="{ active: store.theme === t.value }"
          @click="store.setTheme(t.value)">
          <span class="theme-icon">{{ t.icon }}</span>
          <span class="theme-name">{{ t.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.general-tab { display: flex; flex-direction: column; gap: 24px; }
.setting-group { display: flex; flex-direction: column; gap: 10px; }
.setting-label { font-size: 13px; font-weight: 600; color: var(--text-primary, #e2e8f0); }
.theme-cards { display: flex; gap: 10px; }
.theme-card {
  flex: 1; padding: 16px; border-radius: 12px; cursor: pointer; text-align: center;
  border: 2px solid var(--border-color, #1a2435); background: var(--bg-secondary, #131b27);
  transition: all 0.2s; display: flex; flex-direction: column; gap: 8px; align-items: center;
}
.theme-card:hover { border-color: rgba(59,130,246,0.3); }
.theme-card.active { border-color: var(--accent, #3b82f6); background: rgba(59,130,246,0.08); }
.theme-icon { font-size: 24px; }
.theme-name { font-size: 13px; color: var(--text-secondary, #94a3b8); font-weight: 500; }
</style>

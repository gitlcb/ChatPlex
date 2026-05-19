<script setup lang="ts">
import { useAppStore, type Theme } from '../../stores/app'
const store = useAppStore()

const themes: { value: Theme; label: string; icon: string; desc: string }[] = [
  { value: 'light', label: '浅色模式', icon: '☀️', desc: '清爽明亮的界面' },
  { value: 'dark', label: '深色模式', icon: '🌙', desc: '专注且护眼的界面' },
  { value: 'system', label: '跟随系统', icon: '💻', desc: '自动适配系统外观' },
]
</script>

<template>
  <div class="settings-panel">
    <div class="settings-section">
      <h3 class="section-title">外观设置</h3>
      <p class="section-desc">选择您喜欢的应用主题，或让它跟随系统自动切换。</p>
      
      <div class="theme-grid">
        <div v-for="t in themes" :key="t.value"
          class="theme-card" :class="{ active: store.theme === t.value }"
          @click="store.setTheme(t.value)">
          <div class="theme-card-icon">{{ t.icon }}</div>
          <div class="theme-card-info">
            <div class="theme-name">{{ t.label }}</div>
            <div class="theme-desc">{{ t.desc }}</div>
          </div>
          <div class="theme-check" v-if="store.theme === t.value">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 32px;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #e2e8f0);
  margin: 0;
}

.section-desc {
  font-size: 13px;
  color: var(--text-secondary, #94a3b8);
  margin: 0 0 16px 0;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.theme-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  border-radius: 16px;
  cursor: pointer;
  background: var(--bg-secondary, rgba(255,255,255,0.02));
  border: 1px solid var(--border-color, rgba(255,255,255,0.05));
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-card:hover {
  background: var(--bg-hover, rgba(255,255,255,0.04));
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateY(-2px);
}

.theme-card.active {
  background: rgba(59, 130, 246, 0.08);
  border-color: var(--accent, #3b82f6);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.theme-card-icon {
  font-size: 28px;
  line-height: 1;
  background: rgba(255,255,255,0.05);
  padding: 12px;
  border-radius: 12px;
}

.theme-card.active .theme-card-icon {
  background: rgba(59, 130, 246, 0.15);
}

.theme-card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.theme-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #ffffff);
}

.theme-desc {
  font-size: 12px;
  color: var(--text-secondary, #94a3b8);
  line-height: 1.4;
}

.theme-check {
  position: absolute;
  top: 20px;
  right: 20px;
  color: var(--accent, #3b82f6);
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popIn {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: scale(1); }
}
</style>

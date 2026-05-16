<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '../stores/app'
import GeneralTab from './settings/GeneralTab.vue'
import AITab from './settings/AITab.vue'
import AboutTab from './settings/AboutTab.vue'

const store = useAppStore()
const tab = ref<'general' | 'ai' | 'about'>('general')
</script>

<template>
  <Teleport to="body">
    <div v-if="store.showSettings" class="settings-overlay" @click.self="store.showSettings = false">
      <div class="settings-modal">
        <div class="sm-header">
          <h2>设置</h2>
          <button class="sm-close" @click="store.showSettings = false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="sm-tabs">
          <button :class="{ active: tab === 'general' }" @click="tab = 'general'">常规</button>
          <button :class="{ active: tab === 'ai' }" @click="tab = 'ai'">AI</button>
          <button :class="{ active: tab === 'about' }" @click="tab = 'about'">关于</button>
        </div>
        <div class="sm-body">
          <GeneralTab v-if="tab === 'general'" />
          <AITab v-if="tab === 'ai'" />
          <AboutTab v-if="tab === 'about'" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.settings-overlay {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
}
.settings-modal {
  width: 520px; max-height: 600px; background: var(--bg-primary, #0f1520);
  border: 1px solid var(--border-color, #1a2435); border-radius: 16px;
  display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}
.sm-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; border-bottom: 1px solid var(--border-color, #1a2435);
}
.sm-header h2 { font-size: 16px; font-weight: 600; }
.sm-close {
  background: none; border: none; color: var(--text-secondary, #94a3b8); cursor: pointer;
  padding: 4px; border-radius: 6px; display: flex; transition: all 0.15s;
}
.sm-close:hover { background: rgba(255,255,255,0.08); color: var(--text-primary); }
.sm-tabs {
  display: flex; gap: 0; padding: 0 20px; border-bottom: 1px solid var(--border-color, #1a2435);
}
.sm-tabs button {
  padding: 10px 16px; background: none; border: none; border-bottom: 2px solid transparent;
  color: var(--text-secondary, #94a3b8); font-size: 13px; cursor: pointer; transition: all 0.15s; font-weight: 500;
}
.sm-tabs button:hover { color: var(--text-primary); }
.sm-tabs button.active { color: var(--accent, #3b82f6); border-bottom-color: var(--accent, #3b82f6); }
.sm-body { padding: 20px; overflow-y: auto; flex: 1; }
</style>

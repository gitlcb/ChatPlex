<script setup lang="ts">
import { useAppStore } from '../../stores/app'
const store = useAppStore()
</script>

<template>
  <div class="ai-tab">
    <div class="setting-group">
      <label class="setting-label">可用模型</label>
      <div class="model-list">
        <div v-for="m in store.modelList" :key="m.name" class="model-item">
          <span class="model-dot" :class="m.type"></span>
          <span class="model-name">{{ m.name }}</span>
          <span v-if="m.type === 'chatimages'" class="model-tag">多模态</span>
        </div>
        <div v-if="store.modelList.length === 0" class="empty-hint">模型列表将在启动聊天时自动加载</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-tab { display: flex; flex-direction: column; gap: 28px; }
.setting-group { display: flex; flex-direction: column; gap: 12px; }
.setting-label { font-size: 13px; font-weight: 600; color: var(--text-primary, #e2e8f0); }
.model-list { display: flex; flex-direction: column; gap: 4px; max-height: 400px; overflow-y: auto; }
.model-item { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 6px; font-size: 13px; color: var(--text-secondary, #94a3b8); }
.model-dot { width: 6px; height: 6px; border-radius: 50%; background: #475569; }
.model-dot.chatimages { background: #8b5cf6; }
.model-name { flex: 1; }
.model-tag { font-size: 10px; background: rgba(139,92,246,0.15); color: #a78bfa; padding: 1px 6px; border-radius: 4px; }
.empty-hint { font-size: 12px; color: var(--text-muted, #475569); font-style: italic; padding: 8px 0; }
</style>

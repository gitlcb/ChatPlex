<script setup lang="ts">
import { useAppStore } from '../../stores/app'
const store = useAppStore()
</script>

<template>
  <div class="settings-panel">
    <div class="settings-section">
      <h3 class="section-title">可用模型列表</h3>
      <p class="section-desc">此处展示了当前所有配置就绪、可用于对话的 AI 模型。支持多模态（识图）的模型会被特别标注。</p>
      
      <div class="model-grid" v-if="store.modelList.length > 0">
        <div v-for="m in store.modelList" :key="m.name" class="model-card">
          <div class="model-icon" :class="m.type">
            <svg v-if="m.type === 'chatimages'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          </div>
          <div class="model-info">
            <span class="model-name" :title="m.name">{{ m.name }}</span>
            <span v-if="m.type === 'chatimages'" class="model-tag multimodal">多模态支持</span>
            <span v-else class="model-tag text-only">纯文本</span>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <div class="empty-icon">🤖</div>
        <h4 class="empty-title">暂无模型数据</h4>
        <p class="empty-desc">可用模型列表将在启动聊天或同步自定义配置后自动更新。</p>
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
  line-height: 1.5;
}

.model-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.model-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-secondary, rgba(255,255,255,0.02));
  border: 1px solid var(--border-color, rgba(255,255,255,0.05));
  border-radius: 12px;
  transition: all 0.2s ease;
}

.model-card:hover {
  background: var(--bg-hover, rgba(255,255,255,0.04));
  border-color: rgba(255,255,255,0.1);
  transform: translateY(-1px);
}

.model-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255,255,255,0.05);
  color: var(--text-secondary, #94a3b8);
  flex-shrink: 0;
}

.model-icon.chatimages {
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
}

.model-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.model-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #e2e8f0);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.model-tag {
  font-size: 10px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;
  width: max-content;
}

.model-tag.multimodal {
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
}

.model-tag.text-only {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-muted, #64748b);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  text-align: center;
  background: var(--bg-secondary, rgba(255,255,255,0.01));
  border: 1px dashed var(--border-color, rgba(255,255,255,0.05));
  border-radius: 16px;
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 12px;
  opacity: 0.8;
}

.empty-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #e2e8f0);
  margin: 0 0 8px 0;
}

.empty-desc {
  font-size: 13px;
  color: var(--text-secondary, #94a3b8);
  margin: 0;
  max-width: 300px;
}
</style>

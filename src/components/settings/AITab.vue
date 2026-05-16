<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '../../stores/app'
const store = useAppStore()

const showKey = ref(false)
const tempKey = ref(store.customApiKey)
const tempUrl = ref(store.customApiUrl)

function saveApi() {
  store.customApiKey = tempKey.value.trim()
  store.customApiUrl = tempUrl.value.trim()
  store.saveSettings()
}

function resetApi() {
  tempKey.value = ''
  tempUrl.value = ''
  store.customApiKey = ''
  store.customApiUrl = ''
  store.saveSettings()
}
</script>

<template>
  <div class="ai-tab">
    <div class="setting-group">
      <label class="setting-label">API 配置</label>
      <p class="setting-hint">留空则使用默认公益 API。自定义配置后优先使用您的 API。</p>

      <div class="field">
        <label>API Key</label>
        <div class="key-input">
          <input :type="showKey ? 'text' : 'password'" v-model="tempKey" placeholder="sk-...（留空使用公益 API）" />
          <button class="key-toggle" @click="showKey = !showKey">
            {{ showKey ? '🙈' : '👁️' }}
          </button>
        </div>
      </div>

      <div class="field">
        <label>API Base URL</label>
        <input type="text" v-model="tempUrl" placeholder="https://api.example.com/v1（留空使用默认）" />
      </div>

      <div class="field-actions">
        <button class="btn-primary" @click="saveApi">保存</button>
        <button class="btn-secondary" @click="resetApi">恢复默认</button>
      </div>
    </div>

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
.setting-hint { font-size: 12px; color: var(--text-secondary, #94a3b8); margin: -4px 0 4px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 12px; color: var(--text-secondary, #94a3b8); font-weight: 500; }
.field input, .key-input input {
  width: 100%; padding: 8px 12px; background: var(--bg-secondary, #131b27);
  border: 1px solid var(--border-color, #1a2435); border-radius: 8px;
  color: var(--text-primary, #e2e8f0); font-size: 13px; outline: none; transition: border-color 0.15s;
}
.field input:focus, .key-input input:focus { border-color: var(--accent, #3b82f6); }
.key-input { display: flex; gap: 0; }
.key-input input { border-radius: 8px 0 0 8px; flex: 1; }
.key-toggle {
  padding: 0 12px; background: var(--bg-secondary, #131b27);
  border: 1px solid var(--border-color, #1a2435); border-left: none;
  border-radius: 0 8px 8px 0; cursor: pointer; font-size: 16px;
}
.field-actions { display: flex; gap: 8px; margin-top: 4px; }
.btn-primary {
  padding: 8px 20px; background: var(--accent, #3b82f6); color: white;
  border: none; border-radius: 8px; font-size: 13px; cursor: pointer; font-weight: 500; transition: all 0.15s;
}
.btn-primary:hover { filter: brightness(1.1); }
.btn-secondary {
  padding: 8px 20px; background: var(--bg-secondary, #131b27); color: var(--text-secondary, #94a3b8);
  border: 1px solid var(--border-color, #1a2435); border-radius: 8px; font-size: 13px; cursor: pointer; transition: all 0.15s;
}
.btn-secondary:hover { border-color: var(--accent, #3b82f6); color: var(--text-primary); }
.model-list { display: flex; flex-direction: column; gap: 4px; max-height: 200px; overflow-y: auto; }
.model-item { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 6px; font-size: 13px; color: var(--text-secondary, #94a3b8); }
.model-dot { width: 6px; height: 6px; border-radius: 50%; background: #475569; }
.model-dot.chatimages { background: #8b5cf6; }
.model-name { flex: 1; }
.model-tag { font-size: 10px; background: rgba(139,92,246,0.15); color: #a78bfa; padding: 1px 6px; border-radius: 4px; }
.empty-hint { font-size: 12px; color: var(--text-muted, #475569); font-style: italic; padding: 8px 0; }
</style>

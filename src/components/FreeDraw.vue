<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '../stores/app'

const store = useAppStore()

const prompt = ref('')
const size = ref('1024x1024')
const loading = ref(false)
const imageUrl = ref('')
const error = ref('')

const API_URL = store.effectiveApiUrl
const API_KEY = store.effectiveApiKey

async function generate() {
  if (!prompt.value.trim() || loading.value) return
  loading.value = true
  error.value = ''
  imageUrl.value = ''

  try {
    const body = {
      model: 'black-forest-labs/FLUX.1-schnell',
      prompt: prompt.value.trim(),
      image_size: size.value,
      batch_size: 1,
    }

    const res = await fetch(`${API_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`HTTP ${res.status}: ${text}`)
    }

    const data = await res.json()
    if (data.data?.[0]?.url) {
      imageUrl.value = data.data[0].url
    } else if (data.data?.[0]?.b64_json) {
      imageUrl.value = `data:image/png;base64,${data.data[0].b64_json}`
    } else {
      throw new Error('未收到图片数据')
    }
  } catch (e) {
    error.value = '生成失败: ' + (e instanceof Error ? e.message : String(e))
  } finally {
    loading.value = false
  }
}

function download() {
  if (!imageUrl.value) return
  const a = document.createElement('a')
  a.href = imageUrl.value
  a.download = `chatplex-draw-${Date.now()}.png`
  a.click()
}

async function copyImage() {
  if (!imageUrl.value) return
  try {
    const res = await fetch(imageUrl.value)
    const blob = await res.blob()
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
  } catch { /* fallback: copy url */ }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generate() }
}
</script>

<template>
  <div class="free-draw">
    <div class="fd-header">
      <img src="/chatplex-logo.png" class="fd-logo" />
      <h2>AI 绘图</h2>
      <p class="fd-hint">输入文字描述，AI 为你生成图片</p>
    </div>

    <div class="fd-input-area">
      <textarea v-model="prompt" placeholder="描述你想生成的图片，例如：一只猫坐在月球上，赛博朋克风格..." rows="3" @keydown="onKeydown" />
      <div class="fd-controls">
        <select v-model="size">
          <option value="1024x1024">1024x1024</option>
          <option value="512x512">512x512</option>
          <option value="768x1024">768x1024（竖版）</option>
          <option value="1024x768">1024x768（横版）</option>
        </select>
        <button class="fd-generate" :disabled="!prompt.trim() || loading" @click="generate">
          <span v-if="loading" class="fd-spinner"></span>
          {{ loading ? '生成中...' : '生成图片' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="fd-error">{{ error }}</div>

    <div v-if="imageUrl" class="fd-result">
      <img :src="imageUrl" class="fd-image" />
      <div class="fd-actions">
        <button @click="download" class="fd-action-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          下载
        </button>
        <button @click="copyImage" class="fd-action-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          复制
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.free-draw {
  display: flex; flex-direction: column; align-items: center;
  height: 100%; overflow-y: auto; padding: 40px 24px;
  background: var(--bg-primary, #0a0f16);
}
.fd-header { text-align: center; margin-bottom: 32px; }
.fd-logo { width: 64px; height: 64px; border-radius: 16px; margin-bottom: 12px; }
.fd-header h2 { font-size: 22px; font-weight: 600; margin-bottom: 8px; }
.fd-hint { font-size: 13px; color: var(--text-secondary, #94a3b8); }
.fd-input-area { width: 100%; max-width: 600px; }
.fd-input-area textarea {
  width: 100%; padding: 14px 16px; background: var(--bg-secondary, #131b27);
  border: 1px solid var(--border-color, #243447); border-radius: 14px;
  color: var(--text-primary, #e2e8f0); font-size: 14px; resize: vertical;
  outline: none; transition: border-color 0.2s; font-family: inherit; line-height: 1.5;
}
.fd-input-area textarea:focus { border-color: var(--accent, #3b82f6); }
.fd-controls { display: flex; gap: 10px; margin-top: 12px; }
.fd-controls select {
  padding: 10px 14px; background: var(--bg-secondary, #131b27);
  border: 1px solid var(--border-color, #243447); border-radius: 10px;
  color: var(--text-primary, #e2e8f0); font-size: 13px; outline: none;
}
.fd-generate {
  flex: 1; padding: 10px 20px; background: var(--accent, #3b82f6); color: white;
  border: none; border-radius: 10px; font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;
}
.fd-generate:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
.fd-generate:disabled { opacity: 0.5; cursor: not-allowed; }
.fd-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.fd-error { margin-top: 16px; padding: 10px 16px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: 10px; color: #f87171; font-size: 13px; width: 100%; max-width: 600px; }
.fd-result { margin-top: 24px; width: 100%; max-width: 600px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.fd-image { width: 100%; border-radius: 14px; border: 1px solid var(--border-color, #1a2435); }
.fd-actions { display: flex; gap: 8px; }
.fd-action-btn {
  display: flex; align-items: center; gap: 6px; padding: 8px 16px;
  background: var(--bg-secondary, #131b27); border: 1px solid var(--border-color, #243447);
  border-radius: 8px; color: var(--text-secondary, #94a3b8); font-size: 13px;
  cursor: pointer; transition: all 0.15s;
}
.fd-action-btn:hover { border-color: var(--accent, #3b82f6); color: var(--text-primary); }
</style>

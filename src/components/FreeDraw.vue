<script setup lang="ts">
import { ref } from 'vue'
import { DEFAULT_API_URL, DEFAULT_API_KEY } from '../stores/app'

const prompt = ref('')
const size = ref('1024x1024')
const loading = ref(false)
const imageUrl = ref('')
const error = ref('')

const API_URL = DEFAULT_API_URL
const API_KEY = DEFAULT_API_KEY

async function generate() {
  if (!prompt.value.trim() || loading.value) return
  loading.value = true
  error.value = ''
  const previousImage = imageUrl.value

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
    imageUrl.value = previousImage // restore on fail
  } finally {
    loading.value = false
  }
}

import { save } from '@tauri-apps/plugin-dialog'
import { writeFile } from '@tauri-apps/plugin-fs'

async function download() {
  if (!imageUrl.value) return
  try {
    const defaultPath = `chatplex-draw-${Date.now()}.png`
    const path = await save({
      defaultPath,
      filters: [{ name: 'Image', extensions: ['png'] }]
    })
    
    if (!path) return // User cancelled
    
    // Fetch image data and convert to Uint8Array for writeFile
    const res = await fetch(imageUrl.value)
    const arrayBuffer = await res.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    await writeFile(path, uint8Array)
  } catch (e) {
    error.value = '保存失败: ' + (e instanceof Error ? e.message : String(e))
  }
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
    <!-- Premium Ambient Background -->
    <div class="ambient-bg">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
      <div class="noise-overlay"></div>
    </div>

    <div class="fd-content" :class="{ 'has-result': !!imageUrl || loading }">
      <!-- Hero Section -->
      <div class="fd-hero">
        <h2 class="fd-title">Imagine & Create</h2>
        <p class="fd-subtitle">将灵感转化为令人惊叹的视觉艺术作品。</p>
      </div>

      <!-- Input Area -->
      <div class="fd-prompt-wrapper">
        <div class="fd-prompt-box">
          <textarea 
            v-model="prompt" 
            placeholder="描述您的画面。例如：赛博朋克风格的未来城市，霓虹闪烁，雨夜，超高画质..." 
            rows="3" 
            @keydown="onKeydown" 
          />
          
          <div class="fd-controls">
            <div class="select-wrapper">
              <select v-model="size">
                <option value="1024x1024">1024 × 1024</option>
                <option value="768x1024">768 × 1024</option>
                <option value="1024x768">1024 × 768</option>
                <option value="512x512">512 × 512</option>
              </select>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            
            <button class="fd-generate-btn" :class="{ loading }" :disabled="!prompt.trim() || loading" @click="generate">
              <span v-if="loading" class="spinner"></span>
              <span v-else>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              </span>
              {{ loading ? '绘制中...' : '生成图像' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="error" class="fd-error">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        {{ error }}
      </div>

      <!-- Result Area -->
      <div v-if="imageUrl" class="fd-gallery" :class="{ 'is-generating': loading }">
        <div class="image-frame">
          <img :src="imageUrl" class="result-image" />
          <div class="image-overlay">
            <div class="overlay-actions">
              <button @click="download" class="action-btn" title="下载原图">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                下载高清图
              </button>
              <button @click="copyImage" class="action-btn icon-only" title="复制到剪贴板">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading Skeleton -->
      <div v-if="loading && !imageUrl" class="fd-gallery skeleton">
        <div class="image-frame placeholder">
          <div class="scan-line"></div>
          <svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
          <p class="loading-text">正在注入灵魂...</p>
        </div>
      </div>
      
    </div>
  </div>
</template>

<style scoped>
.free-draw {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  overflow-y: auto;
  background: #000000;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* Premium Ambient Background */
.ambient-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.blob {
  position: absolute;
  filter: blur(120px);
  border-radius: 50%;
  animation: float 20s infinite alternate ease-in-out;
  opacity: 0.4;
}

.blob-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: rgba(59, 130, 246, 0.4); }
.blob-2 { bottom: -10%; right: -10%; width: 60vw; height: 60vw; background: rgba(168, 85, 247, 0.4); animation-delay: -5s; }
.blob-3 { top: 40%; left: 40%; width: 40vw; height: 40vw; background: rgba(236, 72, 153, 0.3); animation-delay: -10s; }

@keyframes float {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(5%, 10%) scale(1.1); }
}

.noise-overlay {
  position: absolute;
  inset: 0;
  background-image: url('data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)"/%3E%3C/svg%3E');
  opacity: 0.04;
  mix-blend-mode: overlay;
}

/* Content Area */
.fd-content {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 900px;
  padding: 80px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  margin: auto;
}

.fd-content.has-result {
  padding-top: 40px;
}

/* Hero Section */
.fd-hero {
  text-align: center;
  margin-bottom: 48px;
  transition: all 0.5s ease;
}

.has-result .fd-hero {
  margin-bottom: 24px;
  transform: scale(0.92);
}

.fd-title {
  font-size: 56px;
  font-weight: 800;
  letter-spacing: -0.04em;
  background: linear-gradient(180deg, #ffffff 0%, #a1a1aa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 16px 0;
}

.has-result .fd-title {
  font-size: 36px;
}

.fd-subtitle {
  font-size: 18px;
  color: #a1a1aa; /* Zinc 400 */
  margin: 0;
  font-weight: 500;
}

/* Prompt Box */
.fd-prompt-wrapper {
  width: 100%;
  padding: 1px;
  background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.02));
  border-radius: 28px;
  box-shadow: 0 32px 64px rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;
}

.fd-prompt-wrapper:focus-within {
  background: linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.05));
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.6), 0 0 0 4px rgba(255,255,255,0.05);
}

.fd-prompt-box {
  background: rgba(10, 10, 10, 0.6);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border-radius: 27px;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
}

textarea {
  width: 100%;
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 16px;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  font-family: inherit;
  min-height: 80px;
  padding: 8px 0;
}

textarea::placeholder {
  color: #52525b; /* Zinc 600 */
}

.fd-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255,255,255,0.08);
  gap: 16px;
}

.select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.select-wrapper select {
  appearance: none;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  padding: 10px 36px 10px 16px;
  border-radius: 12px;
  color: #e4e4e7;
  font-size: 14px;
  font-weight: 600;
  outline: none;
  cursor: pointer;
  transition: all 0.2s;
}

.select-wrapper select:hover {
  background: rgba(255,255,255,0.1);
}

.select-wrapper select:focus {
  border-color: rgba(255,255,255,0.3);
}

.select-wrapper svg {
  position: absolute;
  right: 14px;
  color: #a1a1aa;
  pointer-events: none;
}

.fd-generate-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  background: #ffffff;
  color: #000000;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
}

.fd-generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 255, 255, 0.3);
}

.fd-generate-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.fd-generate-btn.loading {
  background: rgba(255,255,255,0.8);
}

/* Error */
.fd-error {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
  padding: 16px 24px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 16px;
  color: #fca5a5;
  font-size: 14px;
  font-weight: 500;
  width: 100%;
  backdrop-filter: blur(10px);
  animation: popIn 0.3s ease;
}

/* Gallery / Result */
.fd-gallery {
  width: 100%;
  margin-top: 40px;
  display: flex;
  justify-content: center;
  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.fd-gallery.is-generating {
  opacity: 0.4;
  filter: blur(8px) grayscale(0.5);
  pointer-events: none;
}

.image-frame {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05);
  background: #000;
}

.result-image {
  display: block;
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  transition: transform 0.4s ease;
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 50%);
  opacity: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 32px;
  transition: opacity 0.4s ease;
}

.image-frame:hover .image-overlay {
  opacity: 1;
}

.overlay-actions {
  display: flex;
  gap: 16px;
  transform: translateY(20px);
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.image-frame:hover .overlay-actions {
  transform: translateY(0);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 30px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.icon-only {
  padding: 12px;
}

.action-btn:hover {
  background: rgba(255,255,255,0.2);
  transform: scale(1.05);
  border-color: rgba(255,255,255,0.3);
}

/* Skeleton Placeholder */
.image-frame.placeholder {
  width: 100%;
  aspect-ratio: 1 / 1;
  max-height: 512px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.02);
  color: #52525b;
  gap: 20px;
}

.placeholder-icon {
  width: 64px;
  height: 64px;
  opacity: 0.3;
}

.loading-text {
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(255,255,255,0.8);
  box-shadow: 0 0 20px 4px rgba(255,255,255,0.4);
  animation: scan 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  opacity: 0.8;
}

/* Animations */
@keyframes spin { 
  to { transform: rotate(360deg); } 
}

.spinner { 
  width: 18px; 
  height: 18px; 
  border: 2px solid rgba(0,0,0,0.2); 
  border-top-color: #000; 
  border-radius: 50%; 
  animation: spin 0.6s linear infinite; 
}

@keyframes popIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scan {
  0% { transform: translateY(-10px); }
  100% { transform: translateY(520px); }
}
</style>
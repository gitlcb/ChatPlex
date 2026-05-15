<script setup lang="ts">
import { useServiceManager } from '../composables/useServiceManager';
import { SERVICES } from '../types/services';

const { openService } = useServiceManager();
</script>

<template>
  <div class="welcome">
    <div class="welcome-hero">
      <div class="welcome-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="url(#gradient)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#60a5fa"/>
              <stop offset="100%" stop-color="#a78bfa"/>
            </linearGradient>
          </defs>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
      </div>
      <h1 class="welcome-title">ChatPlex</h1>
      <p class="welcome-subtitle">国产AI，一站式对话</p>
      <div class="welcome-divider"></div>
      <p class="welcome-desc">
        告别在多个网站之间来回切换的烦恼<br/>
        选择左侧的AI服务即可开始对话<br/>
        <span class="highlight">登录一次，后续自动保持</span>
      </p>
    </div>

    <div class="quick-launch">
      <div class="quick-grid">
        <button
          v-for="service in SERVICES"
          :key="service.id"
          class="quick-card"
          :style="{ '--card-color': service.color }"
          @click="openService(service.id)"
        >
          <span class="quick-icon">{{ service.icon }}</span>
          <span class="quick-name">{{ service.name }}</span>
        </button>
      </div>
    </div>

    <div class="welcome-features">
      <div class="feature">
        <div class="feature-icon-wrap">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="8" width="10" height="6" rx="1"/>
            <path d="M5 8V5a3 3 0 016 0v3"/>
          </svg>
        </div>
        <span class="feature-text">自动保持登录</span>
      </div>
      <div class="feature">
        <div class="feature-icon-wrap">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="1" y="2" width="6" height="12" rx="1"/>
            <rect x="9" y="2" width="6" height="7" rx="1"/>
          </svg>
        </div>
        <span class="feature-text">多标签不丢失</span>
      </div>
      <div class="feature">
        <div class="feature-icon-wrap">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M8 1v6M5 4l3 3 3-3"/>
            <path d="M2 10v3a1 1 0 001 1h10a1 1 0 001-1v-3"/>
          </svg>
        </div>
        <span class="feature-text">轻量快速启动</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px 32px;
  color: #94a3b8;
  overflow-y: auto;
}

.welcome-hero {
  text-align: center;
  margin-bottom: 40px;
}

.welcome-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.15);
  margin-bottom: 20px;
}

.welcome-title {
  font-size: 32px;
  font-weight: 800;
  color: #e2e8f0;
  margin: 0 0 6px 0;
  background: linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-subtitle {
  font-size: 15px;
  color: #64748b;
  margin: 0 0 16px 0;
  font-weight: 500;
  letter-spacing: 2px;
}

.welcome-divider {
  width: 40px;
  height: 2px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 1px;
  margin: 0 auto 16px;
}

.welcome-desc {
  font-size: 13px;
  color: #475569;
  line-height: 2;
  max-width: 360px;
  margin: 0 auto;
}

.highlight {
  color: #60a5fa;
  font-weight: 500;
}

.quick-launch {
  margin-bottom: 36px;
  width: 100%;
  max-width: 520px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.quick-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  color: #94a3b8;
  position: relative;
  overflow: hidden;
}

.quick-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, var(--card-color, #3b82f6), transparent 70%);
  opacity: 0;
  transition: opacity 0.3s;
}

.quick-card:hover::before {
  opacity: 0.06;
}

.quick-card:hover {
  border-color: rgba(var(--card-color, #3b82f6), 0.3);
  color: #e2e8f0;
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.1);
}

.quick-icon {
  font-size: 24px;
  position: relative;
  z-index: 1;
}

.quick-name {
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  position: relative;
  z-index: 1;
  white-space: nowrap;
}

.quick-card:hover .quick-name {
  color: #e2e8f0;
}

.welcome-features {
  display: flex;
  gap: 28px;
  justify-content: center;
  flex-wrap: wrap;
}

.feature {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #475569;
}

.feature-icon-wrap {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: rgba(59, 130, 246, 0.08);
  color: #60a5fa;
  flex-shrink: 0;
}

.feature-text {
  color: #64748b;
  white-space: nowrap;
}
</style>
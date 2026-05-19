<script setup lang="ts">
const version = '0.4.4'
</script>

<template>
  <div class="settings-panel">
    <div class="about-content">
      <div class="about-hero">
        <div class="logo-wrapper">
          <img src="/chatplex-logo.png" class="about-logo" alt="ChatPlex" />
          <div class="logo-glow"></div>
        </div>
        <h2 class="app-name">ChatPlex</h2>
        <span class="app-version">Version {{ version }}</span>
        <p class="app-slogan">AI 一站式对话桌面应用</p>
      </div>

      <div class="about-links">
        <a href="https://github.com/gitlcb/ChatPlex" target="_blank" class="link-card">
          <div class="link-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          </div>
          <div class="link-info">
            <span class="link-title">GitHub 仓库</span>
            <span class="link-desc">查看源码或提交 Issue</span>
          </div>
          <div class="link-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </div>
        </a>

        <a href="https://github.com/gitlcb/ChatPlex/blob/master/LICENSE" target="_blank" class="link-card">
          <div class="link-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
          <div class="link-info">
            <span class="link-title">MIT License</span>
            <span class="link-desc">开源协议说明</span>
          </div>
          <div class="link-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </div>
        </a>
      </div>

      <div class="about-footer">
        <div class="footer-icon">🔒</div>
        <p>应用不收集任何用户数据，所有第三方 AI 服务通过系统原生 WebView 加载，确保您的隐私安全。</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: fadeIn 0.3s ease-out;
  padding-top: 20px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.about-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 520px;
  gap: 40px;
}

.about-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.logo-wrapper {
  position: relative;
  margin-bottom: 20px;
}

.about-logo {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: 24px;
  z-index: 2;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.logo-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120px;
  height: 120px;
  background: var(--accent, #3b82f6);
  filter: blur(40px);
  opacity: 0.3;
  transform: translate(-50%, -50%);
  z-index: 1;
}

.app-name {
  font-size: 28px;
  font-weight: 800;
  color: var(--text-primary, #ffffff);
  margin: 0 0 6px 0;
  letter-spacing: -0.5px;
}

.app-version {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(59, 130, 246, 0.15);
  color: var(--accent, #60a5fa);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 12px;
}

.app-slogan {
  font-size: 15px;
  color: var(--text-secondary, #94a3b8);
  margin: 0;
}

.about-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.link-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: var(--bg-secondary, rgba(255,255,255,0.02));
  border: 1px solid var(--border-color, rgba(255,255,255,0.05));
  border-radius: 16px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.link-card:hover {
  background: var(--bg-hover, rgba(255,255,255,0.04));
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateY(-2px);
}

.link-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255,255,255,0.05);
  color: var(--text-primary, #ffffff);
}

.link-card:hover .link-icon {
  background: var(--accent, #3b82f6);
}

.link-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.link-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #ffffff);
}

.link-desc {
  font-size: 13px;
  color: var(--text-secondary, #94a3b8);
}

.link-arrow {
  color: var(--text-muted, #475569);
  transition: transform 0.2s ease, color 0.2s ease;
}

.link-card:hover .link-arrow {
  color: var(--accent, #60a5fa);
  transform: translateX(4px);
}

.about-footer {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  background: rgba(16, 185, 129, 0.05);
  border-radius: 12px;
  color: #10b981;
  max-width: 100%;
}

.footer-icon {
  font-size: 18px;
}

.about-footer p {
  font-size: 13px;
  line-height: 1.5;
  margin: 0;
  opacity: 0.9;
}
</style>

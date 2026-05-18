<script setup lang="ts">
const version = '0.4.3'
</script>

<template>
  <div class="about-tab">
    <div class="about-center">
      <img src="/chatplex-logo.png" class="about-logo" alt="ChatPlex" />
      <h2>ChatPlex</h2>
      <p class="about-ver">v{{ version }}</p>
      <p class="about-desc">AI 一站式对话桌面应用</p>
    </div>

    <div class="about-links">
      <a href="https://github.com/gitlcb/ChatPlex" target="_blank" class="about-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
        GitHub 仓库
      </a>
      <a href="https://github.com/gitlcb/ChatPlex/blob/master/LICENSE" target="_blank" class="about-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        MIT License
      </a>
    </div>

    <p class="about-footer">应用不收集任何用户数据，所有第三方 AI 服务通过系统原生 WebView 加载。</p>
  </div>
</template>

<style scoped>
.about-tab { display: flex; flex-direction: column; align-items: center; gap: 20px; }
.about-center { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.about-logo { width: 72px; height: 72px; border-radius: 18px; margin-bottom: 8px; filter: drop-shadow(0 4px 12px rgba(96,165,250,0.2)); }
.about-center h2 { font-size: 20px; font-weight: 700; }
.about-ver { font-size: 14px; color: var(--accent, #3b82f6); font-weight: 500; }
.about-desc { font-size: 13px; color: var(--text-secondary, #94a3b8); }
.about-links { display: flex; gap: 12px; }
.about-link {
  display: flex; align-items: center; gap: 6px; padding: 8px 16px;
  background: var(--bg-secondary, #131b27); border: 1px solid var(--border-color, #1a2435);
  border-radius: 8px; color: var(--text-secondary, #94a3b8); text-decoration: none;
  font-size: 13px; transition: all 0.15s;
}
.about-link:hover { border-color: var(--accent, #3b82f6); color: var(--text-primary, #e2e8f0); }
.about-footer { font-size: 11px; color: var(--text-muted, #475569); text-align: center; max-width: 360px; line-height: 1.5; }
</style>

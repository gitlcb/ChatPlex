<script setup lang="ts">
import { openUrl } from '@tauri-apps/plugin-opener'

interface CodingTool {
  name: string
  desc: string
  category: string
  url: string
  icon: string
  iconBg: string
  features: string[]
  paid?: 'free' | 'freemium' | 'paid'
}

const internationalTools: CodingTool[] = [
  {
    name: 'Claude Code',
    desc: 'Anthropic 官方 CLI 编程助手，深度上下文理解',
    category: 'CLI Agent',
    url: 'https://claude.com/claude-code',
    icon: 'C',
    iconBg: 'linear-gradient(135deg, #d97706, #b45309)',
    features: ['Agent 模式', '长上下文', '多文件编辑'],
    paid: 'paid',
  },
  {
    name: 'Cursor',
    desc: 'AI 优先的代码编辑器，VS Code 分支',
    category: 'IDE',
    url: 'https://cursor.com',
    icon: 'C',
    iconBg: 'linear-gradient(135deg, #1e293b, #0f172a)',
    features: ['Tab 自动补全', 'Composer', 'Bug Finder'],
    paid: 'freemium',
  },
  {
    name: 'Windsurf',
    desc: 'Codeium 出品，主打 Cascade Flow 协作流',
    category: 'IDE',
    url: 'https://windsurf.com',
    icon: 'W',
    iconBg: 'linear-gradient(135deg, #06b6d4, #0891b2)',
    features: ['Cascade', 'Flows', '实时同步'],
    paid: 'freemium',
  },
  {
    name: 'GitHub Copilot',
    desc: '微软 GitHub 老牌代码 AI，集成度最广',
    category: '插件',
    url: 'https://github.com/features/copilot',
    icon: 'G',
    iconBg: 'linear-gradient(135deg, #24292e, #1a1f24)',
    features: ['Chat', 'Edits', 'Workspace'],
    paid: 'paid',
  },
  {
    name: 'Cline',
    desc: 'VS Code 开源 Agent 插件，自带终端控制',
    category: '插件',
    url: 'https://cline.bot',
    icon: 'L',
    iconBg: 'linear-gradient(135deg, #10b981, #059669)',
    features: ['开源', 'Agent', '自带终端'],
    paid: 'free',
  },
  {
    name: 'Aider',
    desc: '终端原生 AI 编程伙伴，git 集成出色',
    category: 'CLI Agent',
    url: 'https://aider.chat',
    icon: 'A',
    iconBg: 'linear-gradient(135deg, #f43f5e, #e11d48)',
    features: ['Git 友好', '多模型', '终端原生'],
    paid: 'free',
  },
  {
    name: 'Bolt.new',
    desc: 'StackBlitz 出品，浏览器内全栈应用生成',
    category: '在线生成',
    url: 'https://bolt.new',
    icon: 'B',
    iconBg: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    features: ['浏览器运行', '全栈', '一键部署'],
    paid: 'freemium',
  },
  {
    name: 'v0',
    desc: 'Vercel 推出的 UI 生成 AI，Next.js 友好',
    category: '在线生成',
    url: 'https://v0.app',
    icon: 'V',
    iconBg: 'linear-gradient(135deg, #0f172a, #000)',
    features: ['UI 生成', 'shadcn/ui', '一键部署'],
    paid: 'freemium',
  },
  {
    name: 'Zed',
    desc: '高性能 Rust 编辑器，原生协作 AI',
    category: 'IDE',
    url: 'https://zed.dev',
    icon: 'Z',
    iconBg: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    features: ['Rust 实现', '协作', '原生 AI'],
    paid: 'free',
  },
  {
    name: 'Continue',
    desc: '开源代码助手，支持自托管模型',
    category: '插件',
    url: 'https://continue.dev',
    icon: 'C',
    iconBg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    features: ['开源', '自托管', '可定制'],
    paid: 'free',
  },
  {
    name: 'opencode',
    desc: 'SST 出品的开源终端 AI 编程 agent',
    category: 'CLI Agent',
    url: 'https://opencode.ai',
    icon: 'O',
    iconBg: 'linear-gradient(135deg, #18181b, #3f3f46)',
    features: ['开源', '终端原生', '多 Provider'],
    paid: 'free',
  },
  {
    name: 'Pieces',
    desc: '代码片段 + 上下文 AI 助手，本地优先',
    category: '插件',
    url: 'https://pieces.app',
    icon: 'P',
    iconBg: 'linear-gradient(135deg, #22c55e, #15803d)',
    features: ['本地运行', '片段管理', '长期记忆'],
    paid: 'freemium',
  },
  {
    name: 'Pi',
    desc: 'Inflection AI 出品，个人 AI 编程伙伴',
    category: 'AI Agent',
    url: 'https://pi.dev',
    icon: 'π',
    iconBg: 'linear-gradient(135deg, #f97316, #ea580c)',
    features: ['对话式', '个人助手', '编程辅助'],
    paid: 'freemium',
  },
  {
    name: 'Gemini Code Assist',
    desc: 'Google 出品，基于 Gemini 大模型的编程助手',
    category: '插件',
    url: 'https://cloud.google.com/gemini/docs/codeassist/overview',
    icon: 'G',
    iconBg: 'linear-gradient(135deg, #4285f4, #1a73e8)',
    features: ['Gemini 模型', '代码补全', 'Cloud 集成'],
    paid: 'freemium',
  },
]

const domesticTools: CodingTool[] = [
  {
    name: 'Trae',
    desc: '字节跳动出品，国际版免费用 Claude',
    category: 'IDE',
    url: 'https://www.trae.ai',
    icon: 'T',
    iconBg: 'linear-gradient(135deg, #ef4444, #dc2626)',
    features: ['国内/国际版', 'Builder 模式', '中文友好'],
    paid: 'freemium',
  },
  {
    name: 'CodeBuddy',
    desc: '腾讯云推出的 AI 编程助手',
    category: '插件',
    url: 'https://copilot.tencent.com',
    icon: 'B',
    iconBg: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
    features: ['代码生成', '智能问答', '云端部署'],
    paid: 'freemium',
  },
  {
    name: '通义灵码',
    desc: '阿里云出品，集成通义千问 Coder',
    category: '插件',
    url: 'https://lingma.aliyun.com',
    icon: '通',
    iconBg: 'linear-gradient(135deg, #ff6a00, #ee0979)',
    features: ['免费', 'Qwen Coder', 'Agent 模式'],
    paid: 'free',
  },
  {
    name: 'MarsCode',
    desc: '字节豆包出品，云 IDE + AI 编程',
    category: '在线 IDE',
    url: 'https://www.marscode.cn',
    icon: 'M',
    iconBg: 'linear-gradient(135deg, #fb923c, #f97316)',
    features: ['云 IDE', '免费', '中文'],
    paid: 'free',
  },
  {
    name: '文心快码',
    desc: '百度推出，基于文心大模型',
    category: '插件',
    url: 'https://comate.baidu.com',
    icon: '文',
    iconBg: 'linear-gradient(135deg, #2563eb, #1e40af)',
    features: ['文心大模型', '中文优化', '免费'],
    paid: 'free',
  },
  {
    name: 'CodeGeeX',
    desc: '智谱 AI 出品，开源代码大模型',
    category: '插件',
    url: 'https://codegeex.cn',
    icon: 'X',
    iconBg: 'linear-gradient(135deg, #14b8a6, #0d9488)',
    features: ['开源模型', '免费', '多语言'],
    paid: 'free',
  },
  {
    name: 'iFlyCode',
    desc: '讯飞星火编码，多语言代码生成',
    category: '插件',
    url: 'https://xinghuo.xfyun.cn/code',
    icon: '飞',
    iconBg: 'linear-gradient(135deg, #06b6d4, #0e7490)',
    features: ['星火大模型', '中文', 'Bug 检测'],
    paid: 'free',
  },
  {
    name: 'Cline 中文社区',
    desc: 'Cline 国内 fork 与教程合集',
    category: '社区',
    url: 'https://cline.bot',
    icon: 'L',
    iconBg: 'linear-gradient(135deg, #84cc16, #65a30d)',
    features: ['中文文档', '教程', '配置示例'],
    paid: 'free',
  },
]

const paidLabel = (p?: string) => p === 'free' ? '免费' : p === 'paid' ? '付费' : '免费增值'
const paidColor = (p?: string) => p === 'free' ? 'free' : p === 'paid' ? 'paid' : 'freemium'

function openLink(url: string) {
  if (url) openUrl(url)
}
</script>

<template>
  <div class="vc-page">
    <div class="vc-bg">
      <div class="vc-orb vc-orb-1"></div>
      <div class="vc-orb vc-orb-2"></div>
      <div class="vc-orb vc-orb-3"></div>
    </div>

    <div class="vc-scroll">
      <header class="vc-hero">
        <div class="vc-eyebrow">
          <span class="dot-pulse"></span>
          <span>VIBE CODING · 软件推荐</span>
        </div>
        <h1 class="vc-title">让 AI 替你<span class="grad">写代码</span></h1>
        <p class="vc-desc">精选国际与国内主流 AI 编程工具，覆盖 IDE、插件、CLI Agent 与在线生成</p>
        <div class="vc-stats">
          <div class="stat-pill"><b>{{ internationalTools.length }}</b><span>国际工具</span></div>
          <div class="stat-pill"><b>{{ domesticTools.length }}</b><span>国内工具</span></div>
          <div class="stat-pill"><b>{{ internationalTools.length + domesticTools.length }}</b><span>合计</span></div>
        </div>
      </header>

      <section class="vc-section">
        <div class="vc-section-head">
          <div class="head-mark mark-blue"></div>
          <h2>国际 · International</h2>
          <span class="head-count">{{ internationalTools.length }}</span>
        </div>
        <div class="tool-grid">
          <article
            v-for="t in internationalTools"
            :key="t.name"
            class="tool-card"
            @click="openLink(t.url)"
          >
            <div class="tool-glow"></div>
            <div class="tool-head">
              <div class="tool-icon" :style="{ background: t.iconBg }">{{ t.icon }}</div>
              <div class="tool-meta">
                <div class="tool-name-row">
                  <span class="tool-name">{{ t.name }}</span>
                  <span class="tool-paid" :class="paidColor(t.paid)">{{ paidLabel(t.paid) }}</span>
                </div>
                <span class="tool-cat">{{ t.category }}</span>
              </div>
              <svg class="tool-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M7 17L17 7M9 7h8v8"/>
              </svg>
            </div>
            <p class="tool-desc">{{ t.desc }}</p>
            <div class="tool-tags">
              <span v-for="f in t.features" :key="f" class="tool-tag">{{ f }}</span>
            </div>
          </article>
        </div>
      </section>

      <section class="vc-section">
        <div class="vc-section-head">
          <div class="head-mark mark-red"></div>
          <h2>国内 · Domestic</h2>
          <span class="head-count">{{ domesticTools.length }}</span>
        </div>
        <div class="tool-grid">
          <article
            v-for="t in domesticTools"
            :key="t.name"
            class="tool-card"
            @click="openLink(t.url)"
          >
            <div class="tool-glow"></div>
            <div class="tool-head">
              <div class="tool-icon" :style="{ background: t.iconBg }">{{ t.icon }}</div>
              <div class="tool-meta">
                <div class="tool-name-row">
                  <span class="tool-name">{{ t.name }}</span>
                  <span class="tool-paid" :class="paidColor(t.paid)">{{ paidLabel(t.paid) }}</span>
                </div>
                <span class="tool-cat">{{ t.category }}</span>
              </div>
              <svg class="tool-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M7 17L17 7M9 7h8v8"/>
              </svg>
            </div>
            <p class="tool-desc">{{ t.desc }}</p>
            <div class="tool-tags">
              <span v-for="f in t.features" :key="f" class="tool-tag">{{ f }}</span>
            </div>
          </article>
        </div>
      </section>

      <p class="vc-foot">点击卡片访问官网 · 排序不分先后 · 仅供参考</p>
    </div>
  </div>
</template>

<style scoped>
.vc-page {
  position: relative;
  height: 100%;
  overflow: hidden;
  background: var(--bg-primary, #0a0f16);
}

.vc-bg { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 0; }
.vc-orb { position: absolute; border-radius: 50%; filter: blur(110px); }
.vc-orb-1 { width: 400px; height: 400px; top: -120px; left: -100px; background: #6366f1; opacity: 0.16; }
.vc-orb-2 { width: 360px; height: 360px; top: 30%; right: -80px; background: #ec4899; opacity: 0.12; }
.vc-orb-3 { width: 320px; height: 320px; bottom: -100px; left: 40%; background: #10b981; opacity: 0.10; }

.vc-scroll {
  position: relative;
  z-index: 1;
  height: 100%;
  overflow-y: auto;
  padding: 28px 32px 48px;
  scrollbar-width: thin;
  scrollbar-color: #1a2435 transparent;
}

/* Hero */
.vc-hero { padding: 8px 0 28px; margin-bottom: 12px; }
.vc-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 5px 14px; border-radius: 999px;
  background: rgba(99,102,241,0.12);
  border: 1px solid rgba(99,102,241,0.25);
  font-size: 11px; font-weight: 700;
  letter-spacing: 0.16em;
  color: #a5b4fc;
}
.dot-pulse {
  width: 6px; height: 6px; border-radius: 50%;
  background: #818cf8;
  box-shadow: 0 0 0 0 rgba(129,140,248,0.6);
  animation: pulse 1.8s infinite;
}
@keyframes pulse {
  70% { box-shadow: 0 0 0 8px rgba(129,140,248,0); }
  100% { box-shadow: 0 0 0 0 rgba(129,140,248,0); }
}
.vc-title {
  font-size: 36px;
  font-weight: 800;
  margin: 14px 0 8px;
  color: var(--text-primary, #e2e8f0);
  letter-spacing: -0.025em;
  line-height: 1.1;
}
.vc-title .grad {
  background: linear-gradient(135deg, #6366f1, #ec4899, #f59e0b);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  margin-left: 8px;
}
.vc-desc {
  font-size: 14px;
  color: var(--text-secondary, #94a3b8);
  margin: 0 0 18px;
  max-width: 540px;
}
.vc-stats { display: flex; gap: 10px; }
.stat-pill {
  display: inline-flex; align-items: baseline; gap: 6px;
  padding: 6px 14px;
  background: var(--bg-secondary, rgba(19,27,39,0.6));
  border: 1px solid var(--border-color, #1a2435);
  border-radius: 999px;
  backdrop-filter: blur(10px);
}
.stat-pill b {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary, #e2e8f0);
  font-variant-numeric: tabular-nums;
}
.stat-pill span {
  font-size: 11px;
  color: var(--text-muted, #64748b);
  letter-spacing: 0.06em;
}

/* Section heading */
.vc-section { margin-top: 28px; }
.vc-section-head {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color, #1a2435);
}
.head-mark {
  width: 4px; height: 18px; border-radius: 2px;
}
.mark-blue { background: linear-gradient(180deg, #60a5fa, #3b82f6); box-shadow: 0 0 12px rgba(96,165,250,0.5); }
.mark-red  { background: linear-gradient(180deg, #f87171, #dc2626); box-shadow: 0 0 12px rgba(248,113,113,0.5); }
.vc-section-head h2 {
  font-size: 16px; font-weight: 700;
  color: var(--text-primary, #e2e8f0);
  margin: 0;
  letter-spacing: 0.01em;
}
.head-count {
  margin-left: auto;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border-color, #1a2435);
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary, #94a3b8);
  font-variant-numeric: tabular-nums;
}

/* Tool grid */
.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.tool-card {
  position: relative;
  padding: 16px 18px;
  border-radius: 14px;
  border: 1px solid var(--border-color, #1a2435);
  background: linear-gradient(180deg, rgba(19,27,39,0.85), rgba(10,15,22,0.7));
  backdrop-filter: blur(12px);
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
}
.tool-card:hover {
  transform: translateY(-3px);
  border-color: rgba(99,102,241,0.4);
  box-shadow: 0 16px 40px rgba(99,102,241,0.16);
}
.tool-card:hover .tool-glow { opacity: 1; }
.tool-card:hover .tool-arrow { color: #a5b4fc; transform: translate(2px, -2px); }

:root:not(.dark) .tool-card {
  background: linear-gradient(180deg, rgba(255,255,255,0.94), rgba(248,250,252,0.88));
}

.tool-glow {
  position: absolute;
  top: -50%;
  right: -30%;
  width: 240px; height: 240px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99,102,241,0.18), transparent 70%);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}

.tool-head {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 10px;
  position: relative;
}
.tool-icon {
  width: 40px; height: 40px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.25);
}
.tool-meta { flex: 1; min-width: 0; }
.tool-name-row { display: flex; align-items: center; gap: 8px; }
.tool-name {
  font-size: 14px; font-weight: 700;
  color: var(--text-primary, #e2e8f0);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.tool-paid {
  flex-shrink: 0;
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 9px; font-weight: 700;
  letter-spacing: 0.04em;
}
.tool-paid.free { background: rgba(34,197,94,0.14); color: #4ade80; }
.tool-paid.freemium { background: rgba(96,165,250,0.14); color: #60a5fa; }
.tool-paid.paid { background: rgba(245,158,11,0.14); color: #fbbf24; }
.tool-cat {
  display: inline-block;
  margin-top: 3px;
  font-size: 10px;
  color: var(--text-muted, #64748b);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.tool-arrow {
  flex-shrink: 0;
  color: var(--text-muted, #64748b);
  transition: color 0.2s, transform 0.2s;
}

.tool-desc {
  font-size: 12px;
  line-height: 1.55;
  color: var(--text-secondary, #94a3b8);
  margin: 0 0 12px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.tool-tags {
  display: flex; flex-wrap: wrap; gap: 5px;
}
.tool-tag {
  padding: 2px 8px;
  font-size: 10px;
  border-radius: 6px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
  color: var(--text-secondary, #94a3b8);
  letter-spacing: 0.02em;
}

:root:not(.dark) .tool-tag {
  background: rgba(0,0,0,0.03);
  border-color: rgba(0,0,0,0.06);
}

.vc-foot {
  text-align: center;
  margin-top: 28px;
  font-size: 11px;
  color: var(--text-muted, #64748b);
  letter-spacing: 0.06em;
}
</style>

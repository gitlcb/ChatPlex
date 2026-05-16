# ChatPlex

> AI 一站式对话桌面应用 · 一个窗口对接 30+ 主流模型 · 自动保持登录

[![Release](https://img.shields.io/github/v/release/bing/ChatPlex?style=flat-square)](https://github.com/bing/ChatPlex/releases)
[![Downloads](https://img.shields.io/github/downloads/bing/ChatPlex/total?style=flat-square)](https://github.com/bing/ChatPlex/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Tauri 2.0](https://img.shields.io/badge/Tauri-2.0-FFC131?style=flat-square&logo=tauri)](https://tauri.app)

<p align="center">
  <img src="public/chatplex-logo.png" width="160" alt="ChatPlex" />
</p>

## ✨ 特性

- **多服务聚合** — 一个窗口对接 DeepSeek / Kimi / 通义千问 / 豆包 / 智谱清言 / 文心一言 / 腾讯混元 / 讯飞星火 / 百川 / 海螺 / ChatGPT / Claude / Gemini / Grok 等 30+ 主流 AI
- **内置公益 AI 聊天** — 流式输出、思考过程展示、多模态（图片）、会话管理（侧边栏 + 切换 + 重命名 + 删除）
- **内置公益 AI 绘图** — 自动注入 API Key 免登录使用
- **登录保持** — 基于系统原生 WebView 的 Cookie 持久化，登录一次长期保持
- **窗口状态记忆** — 自动记住上次大小和位置
- **单实例运行** — 第二次启动会聚焦已有窗口而非新开
- **轻量** — Tauri 2.0 + Vue 3，安装包约 9 MB

## 📦 下载

到 [Releases](https://github.com/bing/ChatPlex/releases) 页面下载对应平台的安装包：

| 平台 | 格式 |
|---|---|
| Windows | `.msi` / `.exe` (NSIS) |
| macOS | `.dmg` (Universal — Intel + Apple Silicon) |
| Linux | `.AppImage` / `.deb` |

## 🤖 内置公益 AI 模型

公益 AI 聊天通过 OpenAI 兼容接口接入以下模型，**全部免费、无需登录**：

| 厂商 | 模型 |
|---|---|
| DeepSeek | V4-Flash / V4-Pro |
| 小米 MiMo | V2.5 (多模态) / V2.5-Pro |

模型库 (`src/utils/modelCapabilities.ts`) 同时识别 GPT-5.x / Claude 4.7 / Gemini 2.5 / Qwen3.6 / GLM-5.1 / Kimi K2.6 / MiniMax M2.7 / Grok 4 等主流模型的多模态能力，未来公益 API 接入新模型时自动判别是否支持图片输入。

## 🏗️ 技术栈

| 层级 | 技术 |
|---|---|
| 桌面框架 | Tauri 2.0 (Rust + 系统 WebView) |
| 前端 | Vue 3 + TypeScript + Vite |
| 渲染 | WebView2 (Windows) / WebKit (macOS / Linux) |
| 流式 IPC | `chat_stream` Rust 命令 + `tauri::Emitter` 事件 |
| 会话存储 | sessionStorage (关闭即清空) |

### 多 Webview 架构

```
┌───────────────────────────────────────────┐
│  ChatPlex 主窗口                          │
├──────────┬────────────────────────────────┤
│          │                                │
│  侧边栏   │   AI 服务 Webview (独立实例)    │
│  (Vue)   │                                │
│          │   每个服务一个 Webview          │
│ DeepSeek │   切换=show/hide，不销毁        │
│ Kimi     │   Cookie 自动保持              │
│ 公益AI   │                                │
│ ...      │                                │
│          │                                │
└──────────┴────────────────────────────────┘
```

## 🛠️ 开发

### 环境要求
- Node.js 22+ & pnpm 9+
- Rust stable & Cargo
- Tauri 2.x 系统依赖（参考 [官方文档](https://tauri.app/start/prerequisites/)）

### 命令
```bash
pnpm install         # 安装依赖
pnpm tauri dev       # 开发模式
pnpm tauri build     # 构建发布
```

## 🔐 公益服务说明

公益 AI 聊天和绘图的 API Key **直接内嵌在客户端**，所有用户共享相同额度：

- 由作者自费支持，**不保证 100% 可用性**
- 当前模型无响应时，请切换其他模型尝试
- 请勿用于商业用途或大规模批量请求
- 如要长期稳定使用，建议自行接入官方 API

应用本身不收集任何用户数据，所有第三方 AI 服务通过系统原生 WebView 加载，与浏览器访问无异。

## 📋 Roadmap

- [ ] 系统托盘（最小化到托盘）
- [ ] 自定义标题栏（无装饰窗口）
- [ ] 全局快捷键（Ctrl+N 新对话、Ctrl+1-9 切服务、Ctrl+/ 聚焦输入）
- [ ] 自动更新（`tauri-plugin-updater`）
- [ ] 主题切换（深色 / 浅色）
- [ ] 设置面板（自定义 API Key、模型列表、主题）
- [ ] 对话导出（Markdown / JSON）
- [ ] 拖拽上传图片
- [ ] 消息操作（复制 / 重新生成 / 编辑 / 删除）
- [ ] 关于对话框 + 版本检查

## 📄 License

MIT

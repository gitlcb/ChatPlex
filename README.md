# ChatPlex - 国产AI一站式对话工具

> 打开一个应用，使用所有国产AI对话。登录一次，后续自动保持。

## 🚀 功能特性

- **多AI聚合**：集成 DeepSeek、Kimi、通义千问、豆包、智谱清言、文心一言、腾讯混元、讯飞星火、百川智能、海螺AI 等10个国产AI服务
- **登录保持**：基于 WebView2/WebKit 的 Cookie 持久化，登录一次即可长期保持
- **多标签切换**：每个 AI 服务独立 Webview 标签，切换不掉线不丢失对话
- **轻量高效**：基于 Tauri 2.0 + Vue 3，安装包仅约 9MB，远小于 Electron 方案
- **跨平台**：支持 Windows / macOS / Linux
- **侧边栏**：可收缩的侧边栏，快速切换 AI 服务

## 🏗️ 技术架构

### 技术栈
| 层级 | 技术 | 说明 |
|------|------|------|
| 框架 | **Tauri 2.0** | Rust + WebView，轻量跨平台桌面框架 |
| 前端 | **Vue 3 + TypeScript** | 响应式 UI 框架 |
| 后端 | **Rust** | Tauri 原生后端 |
| 渲染 | **WebView2** (Win) / **WebKit** (Mac/Linux) | 系统原生 WebView |

### 核心架构：多 Webview 模式

```
┌──────────────────────────────────────────────────────────┐
│ ChatPlex 主窗口                              ─ □ ✕      │
├───────────┬──────────────────────────────────────────────┤
│           │                                              │
│  侧边栏   │          AI 服务 Webview                     │
│  (Vue)    │     (独立 WebView 实例)                       │
│           │                                              │
│ 💟 DeepSeek│     ← 每个服务独立 Webview                  │
│ 🌙 Kimi    │     ← Cookie 自动保持                       │
│ 💬 通义千问 │     ← 切换时隐藏/显示，不销毁              │
│ ☀️ 豆包    │     ← 窗口调整自动适配                       │
│ 🧊 清言    │                                              │
│ 🎨 文心   │                                              │
│ 🌀 混元   │                                              │
│ ⚡ 星火   │                                              │
│ 🏔️ 百川  │                                              │
│ 🐚 海螺   │                                              │
│           │                                              │
└───────────┴──────────────────────────────────────────────┘
```

**关键设计：**
- 主窗口的 Vue Webview 只负责侧边栏 UI（256px/56px 宽）
- 每个 AI 服务创建独立的 Webview 实例，定位在侧边栏右侧
- 服务切换时通过 `show()`/`hide()` 控制可见性，保持对话状态不丢失
- WebView2/WebKit 自动管理 Cookie，跨会话保持登录状态

## 📂 项目结构

```
ChatPlex/
├── src/                          # Vue 前端
│   ├── App.vue                   # 主布局（侧边栏 + 内容区）
│   ├── main.ts                   # 入口文件
│   ├── types/
│   │   └── services.ts           # AI 服务定义列表
│   ├── composables/
│   │   └── useServiceManager.ts  # 核心逻辑：Webview 创建/切换/管理
│   └── components/
│       ├── Sidebar.vue           # 侧边栏组件
│       └── WelcomeScreen.vue     # 欢迎页组件
├── src-tauri/                    # Rust 后端
│   ├── src/
│   │   ├── main.rs               # 入口
│   │   └── lib.rs                # Tauri 应用初始化
│   ├── capabilities/
│   │   └── default.json          # 权限配置（Webview API）
│   ├── Cargo.toml                # Rust 依赖
│   └── tauri.conf.json          # Tauri 配置
├── package.json
└── vite.config.ts
```

## 🛠️ 开发

### 环境要求
- Node.js 22+ & pnpm
- Rust 1.70+ & Cargo
- Tauri CLI 2.x

### 安装依赖
```bash
pnpm install
```

### 开发模式
```bash
pnpm tauri dev
```

### 构建发布
```bash
pnpm tauri build
```

## 📦 支持的 AI 服务

| 服务 | URL | 说明 |
|------|-----|------|
| DeepSeek | chat.deepseek.com | 深度求索 |
| Kimi | kimi.moonshot.cn | 月之暗面 |
| 通义千问 | tongyi.aliyun.com/qianwen | 阿里 |
| 豆包 | doubao.com | 字节跳动 |
| 智谱清言 | chatglm.cn | 智谱AI |
| 文心一言 | yiyan.baidu.com | 百度 |
| 腾讯混元 | hunyuan.tencent.com | 腾讯 |
| 讯飞星火 | xinghuo.xfyun.cn | 科大讯飞 |
| 百川智能 | baichuan-ai.com/chat | 百川 |
| 海螺AI | hailuoai.com | MiniMax |

## 🔐 安全说明

- ChatPlex 不收集任何用户数据
- 所有 AI 服务通过系统原生 WebView 加载，与浏览器访问相同
- Cookie 由 WebView 引擎自动管理，存储在本地
- 无需 API Token，直接访问各 AI 官网

## 📋 后续规划

- [ ] 系统托盘（最小化到托盘）
- [ ] 自定义标题栏（无装饰窗口）
- [ ] 服务分组管理
- [ ] 快捷键支持（Ctrl+1~9 切换服务）
- [ ] 深色/浅色主题切换
- [ ] 自动更新
- [ ] 服务登录状态检测
- [ ] 移动端适配（Tauri 2.0 Android/iOS）

## 📄 License

MIT
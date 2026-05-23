<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { fetch as tauriFetch } from '@tauri-apps/plugin-http'
import { useAppStore, DEFAULT_API_KEY, DEFAULT_API_URL } from '../stores/app'
import { useServiceManager } from '../composables/useServiceManager'
import { getModelType } from '../utils/modelCapabilities'
import type { ChatMessage } from '../stores/app'
import type { CustomService, ApiType } from '../types/services'
import MarkdownRenderer from './MarkdownRenderer.vue'
import MessageActions from './MessageActions.vue'
import SearchBar from './SearchBar.vue'

const store = useAppStore()
const { chatRefreshKey, activeServiceId } = useServiceManager()

const input = ref('')
const imagePreview = ref('')
const messagesEnd = ref<HTMLDivElement>()
const chatScroll = ref<HTMLDivElement>()
const fileInput = ref<HTMLInputElement>()
const textareaRef = ref<HTMLTextAreaElement>()
const editingSessionId = ref<string | null>(null)
const editingTitle = ref('')
const hoverSessionId = ref<string | null>(null)
const hoveredMsgIndex = ref(-1)
const editingMsgIndex = ref(-1)
const editingMsgContent = ref('')

// Drag & drop
const isDragging = ref(false)
const systemThemeTick = ref(0)
let systemThemeMedia: MediaQueryList | null = null
let systemThemeListener: ((event: MediaQueryListEvent) => void) | null = null

/* ===== Computed ===== */
const searchHighlight = computed(() => store.showSearch ? store.searchQuery : '')
const isFreeChatLight = computed(() => {
  if (store.theme === 'light') return true
  if (store.theme === 'dark') return false
  systemThemeTick.value
  return !window.matchMedia('(prefers-color-scheme: dark)').matches
})

const activeApiConfig = computed(() => {
  if (!activeServiceId.value) {
    return { url: DEFAULT_API_URL, apiKey: DEFAULT_API_KEY, apiType: 'openai' as ApiType }
  }
  if (activeServiceId.value === 'free-chat') {
    return { url: DEFAULT_API_URL, apiKey: DEFAULT_API_KEY, apiType: 'openai' as ApiType }
  }
  const svc = store.customServices.find(s => s.id === activeServiceId.value) as CustomService | undefined
  if (svc?.apiBaseUrl && svc?.apiType) {
    return { url: svc.apiBaseUrl, apiKey: svc.apiKey || '', apiType: svc.apiType }
  }
  return { url: DEFAULT_API_URL, apiKey: DEFAULT_API_KEY, apiType: 'openai' as ApiType }
})

/* ===== Helpers ===== */
function scrollToBottom() { nextTick(() => messagesEnd.value?.scrollIntoView({ behavior: 'smooth' })) }
function scrollToBottomInstant() {
  nextTick(() => {
    let attempts = 0
    const scroll = () => {
      const el = chatScroll.value
      if (!el || attempts >= 6) return
      const prev = el.style.scrollBehavior
      el.style.scrollBehavior = 'auto'
      el.scrollTop = el.scrollHeight
      el.style.scrollBehavior = prev
      attempts++
      if (attempts < 6) requestAnimationFrame(scroll)
    }
    requestAnimationFrame(scroll)
    window.setTimeout(scroll, 80)
  })
}
function autoResize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 160) + 'px'
}

/* ===== Models ===== */
function getCustomAIService(): CustomService | undefined {
  if (!activeServiceId.value) return undefined
  const svc = store.customServices.find(s => s.id === activeServiceId.value) as CustomService | undefined
  return svc?.apiType ? svc : undefined
}

async function fetchModels() {
  // If active service is a custom AI with predefined models, use those
  const customAI = getCustomAIService()
  if (customAI?.models?.length) {
    store.modelList = customAI.models.map(m => ({ name: m.name, type: m.type }))
    if (!store.selectedModel) store.selectedModel = store.modelList[0]?.name || ''
    store.configError = ''
    return
  }

  try {
    const cfg = activeApiConfig.value
    if (cfg.apiType === 'anthropic') {
      store.configError = 'Anthropic 不支持自动获取模型，请手动添加'
      return
    }
    // Build models URL: try /v1/models first, fallback to /models
    const base = cfg.url.replace(/\/+$/, '')
    const urls = base.includes('/v1')
      ? [`${base}/models`]
      : [`${base}/v1/models`, `${base}/models`]

    let lastError = ''
    for (const modelsUrl of urls) {
      try {
        const res = await tauriFetch(modelsUrl, {
          method: 'GET',
          headers: cfg.apiKey ? { 'Authorization': `Bearer ${cfg.apiKey}` } : {},
        })
        if (!res.ok) { lastError = `HTTP ${res.status}`; continue }
        const data = await res.json()
        if (data.data?.length) {
          store.modelList = data.data.map((m: any) => ({ name: m.id, type: getModelType(m.id) }))
          if (!store.selectedModel) store.selectedModel = store.modelList[0]?.name || ''
          store.configError = ''
          return
        }
        lastError = '响应中没有模型列表'
      } catch { continue }
    }
    store.configError = `未获取到可用模型 (${lastError})`
  } catch (e) {
    store.configError = '加载模型列表失败: ' + (e instanceof Error ? e.message : String(e))
  }
}

/* ===== Session Management ===== */
function createNewSession() {
  store.createNewSession(activeServiceId.value || undefined)
}

function switchSession(id: string) {
  store.switchSession(id)
  if (store.activeSession) store.selectedModel = store.activeSession.model
  scrollToBottomInstant()
}

const serviceSessions = computed(() => {
  if (!activeServiceId.value) return []
  return store.getSortedServiceSessions(activeServiceId.value)
})

function deleteSession(id: string) { store.deleteSession(id) }

function startRename(id: string) {
  const s = store.sessions.find(s => s.id === id)
  if (!s) return
  editingSessionId.value = id
  editingTitle.value = s.title
}

function confirmRename() {
  if (!editingSessionId.value) return
  store.renameSession(editingSessionId.value, editingTitle.value)
  editingSessionId.value = null
}

function cancelRename() { editingSessionId.value = null }

/* ===== Send Message ===== */
async function sendMessage() {
  const text = input.value.trim()
  if ((!text && !imagePreview.value) || store.loading) return

  if (!store.activeSession) store.createNewSession(activeServiceId.value || undefined)
  const session = store.activeSession!
  const sessionId = session.id

  const msg: ChatMessage = { role: 'user', content: text }
  if (imagePreview.value) msg.image = imagePreview.value
  store.addMessage(sessionId, msg)
  input.value = ''
  imagePreview.value = ''
  store.loading = true
  nextTick(() => { textareaRef.value && (textareaRef.value.style.height = 'auto') })

  if (session.title === '新对话' && text) {
    session.title = text.slice(0, 25) + (text.length > 25 ? '...' : '')
  }
  session.model = store.selectedModel
  session.updatedAt = Date.now()

  store.addMessage(sessionId, { role: 'assistant', content: '', streaming: true })
  const assistantIdx = session.messages.length - 1
  const assistantMsg = session.messages[assistantIdx]
  scrollToBottom()

  const apiMessages = session.messages.slice(0, -1).map(m => {
    if (m.role === 'assistant') return { role: 'assistant', content: m.content }
    if (m.image) return { role: 'user', content: [{ type: 'text', text: m.content }, { type: 'image_url', image_url: { url: m.image } }] }
    return { role: 'user', content: m.content }
  })

  try {
    let chunkCount = 0
    const unlistenChunk = await listen<{ content: string; is_reasoning: boolean }>('chat-stream-chunk', (event) => {
      if (store.activeSessionId !== sessionId) return
      if (event.payload.is_reasoning) {
        if (!assistantMsg.reasoning) { assistantMsg.reasoning = ''; store.showReasoning[assistantIdx] = true }
        assistantMsg.reasoning += event.payload.content
      } else {
        if (assistantMsg.reasoning && store.showReasoning[assistantIdx]) store.showReasoning[assistantIdx] = false
        assistantMsg.content += event.payload.content
      }
      chunkCount++
      scrollToBottom()
    })
    const unlistenDone = await listen<{ done: boolean }>('chat-stream-done', () => { unlistenChunk(); unlistenDone() })

    const cfg = activeApiConfig.value
    await invoke('chat_stream', { req: { url: cfg.url, api_key: cfg.apiKey, model: store.selectedModel, messages: apiMessages, api_type: cfg.apiType } })
    unlistenChunk(); unlistenDone()
    if (chunkCount === 0 && !assistantMsg.reasoning) assistantMsg.content = '抱歉，未收到回复内容。'
  } catch (e) {
    assistantMsg.content += '\n\n请求失败: ' + (e instanceof Error ? e.message : String(e))
  } finally {
    assistantMsg.streaming = false
    store.loading = false
    scrollToBottom()
    store.persistSessions()
  }
}

function stopGeneration() {
  store.loading = false
  if (store.activeSession) {
    const msgs = store.activeSession.messages
    const last = msgs[msgs.length - 1]
    if (last?.role === 'assistant') last.streaming = false
  }
  store.persistSessions()
}

/* ===== Message Operations ===== */
function handleCopy(msg: ChatMessage) {
  navigator.clipboard.writeText(msg.content)
}

function handleRegenerate(msgIdx: number) {
  if (!store.activeSession) return
  const session = store.activeSession
  // Find the user message before this assistant message
  let userIdx = msgIdx - 1
  while (userIdx >= 0 && session.messages[userIdx].role !== 'user') userIdx--
  if (userIdx < 0) return
  const userContent = session.messages[userIdx].content
  const userImage = session.messages[userIdx].image
  store.removeMessagesFrom(session.id, userIdx)
  store.persistSessions()
  // Re-send
  input.value = userContent
  imagePreview.value = userImage || ''
  sendMessage()
}

function startEdit(msgIdx: number) {
  if (!store.activeSession) return
  editingMsgIndex.value = msgIdx
  editingMsgContent.value = store.activeSession.messages[msgIdx].content
}

function confirmEditMsg() {
  if (!store.activeSession || editingMsgIndex.value < 0) return
  const session = store.activeSession
  const content = editingMsgContent.value.trim()
  if (!content) return
  // Remove this message and everything after, then re-send
  store.removeMessagesFrom(session.id, editingMsgIndex.value)
  editingMsgIndex.value = -1
  input.value = content
  sendMessage()
}

function cancelEditMsg() { editingMsgIndex.value = -1 }

function handleRemove(msgIdx: number) {
  if (!store.activeSession) return
  store.removeMessagesFrom(store.activeSession.id, msgIdx)
  store.persistSessions()
}

import { save } from '@tauri-apps/plugin-dialog'
import { writeTextFile } from '@tauri-apps/plugin-fs'

// Export functions available via toolbar buttons
async function exportAsMarkdown() {
  if (!store.activeSession) return
  const s = store.activeSession
  let md = `# ${s.title}\n\n`
  for (const msg of s.messages) {
    md += `## ${msg.role === 'user' ? 'You' : 'AI'}\n\n${msg.content}\n\n---\n\n`
  }
  
  try {
    const path = await save({
      defaultPath: `${s.title.replace(/[\/\?<>\\:\*\|":]/g, '') || 'chat'}.md`,
      filters: [{ name: 'Markdown', extensions: ['md'] }]
    })
    
    if (path) {
      await writeTextFile(path, md)
    }
  } catch (e) {
    store.configError = '导出失败: ' + (e instanceof Error ? e.message : String(e))
  }
}

/* ===== File & Input ===== */
function onFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { imagePreview.value = reader.result as string }
  reader.readAsDataURL(file)
}

function onPaste(e: ClipboardEvent) {
  if (!store.isMultimodal) return
  const items = e.clipboardData?.items
  if (!items) return
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault()
      const blob = item.getAsFile()
      if (blob) { const reader = new FileReader(); reader.onload = () => { imagePreview.value = reader.result as string }; reader.readAsDataURL(blob) }
      return
    }
  }
}

function handleDrop(e: DragEvent) {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (!files) return
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue
    const reader = new FileReader()
    reader.onload = (ev) => { imagePreview.value = ev.target?.result as string }
    reader.readAsDataURL(file)
  }
}

function selectModel(name: string) { store.selectModel(name) }
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
}

/* ===== Lifecycle ===== */
watch(chatRefreshKey, () => { store.resetChat(); fetchModels() })
watch(activeServiceId, (newId, oldId) => {
  // Save current service state before switching
  if (oldId) store.saveServiceState(oldId)
  store.resetChat()
  // Restore new service state
  if (newId) store.restoreServiceState(newId)
  fetchModels()
  scrollToBottomInstant()
})
watch(() => store.activeSessionId, () => scrollToBottomInstant(), { flush: 'post' })
watch(() => store.messages.length, () => scrollToBottomInstant(), { flush: 'post' })
onMounted(() => {
  store.loadSessions()
  systemThemeMedia = window.matchMedia('(prefers-color-scheme: dark)')
  systemThemeListener = () => { systemThemeTick.value++ }
  systemThemeMedia.addEventListener('change', systemThemeListener)
  // Restore initial service state
  if (activeServiceId.value) store.restoreServiceState(activeServiceId.value)
  fetchModels()
  scrollToBottomInstant()
})

onUnmounted(() => {
  if (systemThemeMedia && systemThemeListener) {
    systemThemeMedia.removeEventListener('change', systemThemeListener)
  }
})
</script>

<template>
  <div class="fc-dark" :class="{ 'fc-light': isFreeChatLight }" @click="store.showModelPicker = false">
    <!-- Premium Ambient Background -->
    <div class="ambient-bg">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
      <div class="noise-overlay"></div>
    </div>

    <div v-if="store.configError" class="fc-error">{{ store.configError }}</div>

    <div class="fc-layout">
      <!-- ===== Conversation Sidebar ===== -->
      <aside class="conv-sidebar">
        <button class="new-chat-btn" @click="createNewSession">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          开启新对话
        </button>
        <div class="conv-list">
          <div v-for="s in serviceSessions" :key="s.id"
            class="conv-item" :class="{ active: s.id === store.activeSessionId }"
            @click="switchSession(s.id)"
            @mouseenter="hoverSessionId = s.id" @mouseleave="hoverSessionId = null"
            @dblclick.stop="startRename(s.id)">
            <div v-if="editingSessionId === s.id" class="conv-edit">
              <input v-model="editingTitle" class="conv-edit-input" @keydown.enter="confirmRename" @keydown.escape="cancelRename" @blur="confirmRename" @click.stop autofocus />
            </div>
            <template v-else>
              <svg class="conv-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              <span class="conv-title">{{ s.title }}</span>
              <button v-if="hoverSessionId === s.id" class="conv-del" @click.stop="deleteSession(s.id)" title="删除">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </template>
          </div>
        </div>
      </aside>

      <!-- ===== Chat Area ===== -->
      <main class="chat-area">
        <!-- Empty / Welcome State -->
        <div v-if="!store.activeSession || store.messages.length === 0" class="chat-welcome">
          <div class="welcome-inner">
            <div class="welcome-logo-wrapper">
              <div class="logo-glow"></div>
              <img src="/chatplex-logo.png" class="welcome-logo-img" alt="ChatPlex" />
            </div>
            <h1 class="welcome-title">What can I help you with?</h1>
            <p class="welcome-subtitle">选择模型以开始一段全新的智能对话</p>
            
            <button class="model-chip" @click.stop="store.showModelPicker = !store.showModelPicker">
              <span class="chip-dot"></span>
              <span class="chip-text">{{ store.selectedModel || '选择模型' }}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            
            <div v-if="store.showModelPicker && store.modelList.length > 1" class="dropdown" @click.stop>
              <div v-for="m in store.modelList" :key="m.name" class="dd-opt" :class="{ sel: store.selectedModel === m.name }" @click="selectModel(m.name)">
                <span class="dd-dot" :class="m.type"></span><span class="dd-name">{{ m.name }}</span>
                <span v-if="m.type === 'chatimages'" class="dd-tag">多模态</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Chat Messages -->
        <div v-else class="chat-messages-wrap">
          <SearchBar />
          
          <div class="chat-header-wrapper">
            <div class="chat-header" @click.stop>
              <button class="ch-btn" @click="store.toggleSearch()" title="搜索 (Ctrl+F)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </button>
              <button class="ch-btn" @click="exportAsMarkdown" title="导出 Markdown">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </button>
              <div class="ch-divider"></div>
              <button class="ch-model" @click="store.showModelPicker = !store.showModelPicker">
                <span class="ch-dot"></span>{{ store.selectedModel }}
                <svg v-if="store.modelList.length > 1" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
              <div v-if="store.showModelPicker && store.modelList.length > 1" class="dropdown dd-header" @click.stop>
                <div v-for="m in store.modelList" :key="m.name" class="dd-opt" :class="{ sel: store.selectedModel === m.name }" @click="selectModel(m.name)">
                  <span class="dd-dot" :class="m.type"></span><span class="dd-name">{{ m.name }}</span>
                  <span v-if="m.type === 'chatimages'" class="dd-tag">多模态</span>
                </div>
              </div>
            </div>
          </div>

          <div class="chat-scroll" ref="chatScroll">
            <div class="chat-msgs">
              <div v-for="(msg, i) in store.messages" :key="i"
                class="msg-row" :class="msg.role"
                @mouseenter="hoveredMsgIndex = i" @mouseleave="hoveredMsgIndex = -1">
                
                <div class="msg-avatar" :class="msg.role">
                  <svg v-if="msg.role === 'assistant'" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor"/><path d="M2 17l10 5 10-5" stroke="currentColor" stroke-width="2"/><path d="M2 12l10 5 10-5" stroke="currentColor" stroke-width="2"/></svg>
                </div>
                
                <div class="msg-content">
                  <MessageActions v-if="hoveredMsgIndex === i && !msg.streaming" :role="msg.role"
                    @copy="handleCopy(msg)"
                    @regenerate="handleRegenerate(i)"
                    @edit="startEdit(i)"
                    @remove="handleRemove(i)" />
                  <img v-if="msg.image" :src="msg.image" class="msg-img" />
                  
                  <div v-if="msg.reasoning" class="msg-reasoning">
                    <button class="reasoning-toggle" @click="store.showReasoning[i] = !store.showReasoning[i]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                      <span>{{ msg.streaming && !msg.content ? '深度思考中...' : '深度思考已完成' }}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="{ rot: store.showReasoning[i] }"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    <div v-if="store.showReasoning[i]" class="reasoning-body">
                      <MarkdownRenderer :content="msg.reasoning" />
                    </div>
                  </div>
                  
                  <!-- Edit mode -->
                  <div v-if="editingMsgIndex === i" class="msg-edit-box">
                    <textarea v-model="editingMsgContent" class="msg-edit-textarea" @keydown.enter.ctrl="confirmEditMsg" @keydown.escape="cancelEditMsg" />
                    <div class="msg-edit-actions">
                      <button @click="confirmEditMsg" class="edit-confirm">保存并发送</button>
                      <button @click="cancelEditMsg" class="edit-cancel">取消</button>
                    </div>
                  </div>
                  
                  <!-- Normal content -->
                  <template v-else>
                    <div v-if="msg.content" class="cm-text" :class="{ 'is-streaming': msg.streaming }">
                      <MarkdownRenderer :content="msg.content" :highlight="searchHighlight" />
                    </div>
                    <div v-if="msg.streaming && !msg.content && !msg.reasoning" class="cm-text"><div class="typing"><span></span><span></span><span></span></div></div>
                  </template>
                </div>
              </div>
            </div>
            <div ref="messagesEnd"></div>
          </div>
        </div>

        <!-- Float Input Zone -->
        <div class="input-zone-wrapper">
          <div class="input-zone"
            @dragover.prevent="isDragging = true"
            @dragleave="isDragging = false"
            @drop.prevent="handleDrop">
            
            <div v-if="isDragging" class="drag-overlay">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              松开鼠标以上传图片
            </div>
            
            <div v-if="imagePreview" class="img-preview">
              <img :src="imagePreview" /><button class="img-del" @click="imagePreview = ''"><svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            
            <div class="input-box">
              <button v-if="store.isMultimodal" class="ib-attach" @click="fileInput?.click()" title="上传图片">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
              </button>
              <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="onFileSelect" />
              <textarea ref="textareaRef" v-model="input" :placeholder="store.isMultimodal ? '发送消息或拖入图片...' : '给 AI 发送消息...'" rows="1" :disabled="!!store.configError" @keydown="onKeydown" @input="autoResize" @paste="onPaste" class="ib-text"></textarea>
              
              <button v-if="store.loading" class="ib-stop" @click="stopGeneration" title="停止生成">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="3"/></svg>
              </button>
              <button v-else class="ib-send" :class="{ 'has-content': input.trim() || imagePreview }" :disabled="(!input.trim() && !imagePreview) || !!store.configError" @click="sendMessage">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>
            
            <p class="input-hint">内容由 AI 生成，请注意甄别 · 公益服务不保证实时可用</p>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Base */
.fc-dark { 
  display: flex; flex-direction: column; height: 100%; 
  --fc-bg: #000000;
  --fc-surface: rgba(255, 255, 255, 0.05);
  --fc-surface-strong: rgba(15, 15, 15, 0.7);
  --fc-surface-soft: rgba(255, 255, 255, 0.03);
  --fc-hover: rgba(255, 255, 255, 0.08);
  --fc-active: rgba(255, 255, 255, 0.1);
  --fc-border: rgba(255, 255, 255, 0.1);
  --fc-border-soft: rgba(255, 255, 255, 0.06);
  --fc-shadow: 0 24px 48px rgba(0, 0, 0, 0.6);
  --fc-shadow-strong: 0 32px 64px rgba(0, 0, 0, 0.8);
  --fc-text: #ffffff;
  --fc-text-secondary: #a1a1aa;
  --fc-text-muted: #52525b;
  --fc-title-gradient: linear-gradient(180deg, #ffffff 0%, #a1a1aa 100%);
  --fc-user-bubble: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.02));
  --fc-user-border: rgba(255, 255, 255, 0.08);
  --fc-input-fade: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0) 100%);
  --fc-input-bg: rgba(20, 20, 20, 0.6);
  --fc-input-focus-bg: rgba(30, 30, 30, 0.7);
  --fc-reasoning-bg: rgba(167, 139, 250, 0.05);
  --fc-reasoning-border: rgba(167, 139, 250, 0.2);
  --fc-reasoning-text: #c4b5fd;
  --fc-success: #10b981;
  --fc-danger: #ef4444;
  background: var(--fc-bg); 
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Noto Sans SC', sans-serif; 
  color: var(--fc-text); 
  position: relative;
}

.fc-dark.fc-light {
  --fc-bg: var(--bg-primary, #ffffff);
  --fc-surface: rgba(255, 255, 255, 0.78);
  --fc-surface-strong: rgba(255, 255, 255, 0.92);
  --fc-surface-soft: rgba(248, 250, 252, 0.74);
  --fc-hover: rgba(37, 99, 235, 0.08);
  --fc-active: rgba(37, 99, 235, 0.12);
  --fc-border: var(--border-color, #e0e0e0);
  --fc-border-soft: rgba(15, 23, 42, 0.1);
  --fc-shadow: 0 18px 38px rgba(15, 23, 42, 0.12);
  --fc-shadow-strong: 0 24px 54px rgba(15, 23, 42, 0.16);
  --fc-text: var(--text-primary, #1a1a1a);
  --fc-text-secondary: var(--text-secondary, #666666);
  --fc-text-muted: var(--text-muted, #999999);
  --fc-title-gradient: linear-gradient(180deg, var(--text-primary, #111827) 0%, var(--text-secondary, #4b5563) 100%);
  --fc-user-bubble: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(14, 165, 233, 0.06));
  --fc-user-border: rgba(37, 99, 235, 0.18);
  --fc-input-fade: linear-gradient(to top, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0) 100%);
  --fc-input-bg: rgba(255, 255, 255, 0.9);
  --fc-input-focus-bg: rgba(255, 255, 255, 0.98);
  --fc-reasoning-bg: rgba(124, 58, 237, 0.06);
  --fc-reasoning-border: rgba(124, 58, 237, 0.18);
  --fc-reasoning-text: #6d28d9;
}

/* Ambient Background */
.ambient-bg {
  position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 0;
}
.blob {
  position: absolute; filter: blur(120px); border-radius: 50%; 
  animation: float 20s infinite alternate ease-in-out; opacity: 0.35;
}
.blob-1 { top: -20%; left: -10%; width: 50vw; height: 50vw; background: rgba(59, 130, 246, 0.4); }
.blob-2 { bottom: -10%; right: -10%; width: 60vw; height: 60vw; background: rgba(168, 85, 247, 0.3); animation-delay: -5s; }
.blob-3 { top: 30%; left: 30%; width: 40vw; height: 40vw; background: rgba(236, 72, 153, 0.2); animation-delay: -10s; }
.fc-dark.fc-light .blob { opacity: 0.18; }
.fc-dark.fc-light .blob-1 { background: rgba(59, 130, 246, 0.28); }
.fc-dark.fc-light .blob-2 { background: rgba(20, 184, 166, 0.16); }
.fc-dark.fc-light .blob-3 { background: rgba(124, 58, 237, 0.14); }
@keyframes float {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(3%, 5%) scale(1.1); }
}
.noise-overlay {
  position: absolute; inset: 0; 
  background-image: url('data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)"/%3E%3C/svg%3E'); 
  opacity: 0.04; mix-blend-mode: overlay;
}

.fc-error { 
  position: relative; z-index: 20; padding: 12px 16px; 
  background: rgba(239, 68, 68, 0.15); backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(239, 68, 68, 0.3); 
  color: var(--fc-danger); font-size: 14px; text-align: center; font-weight: 500; 
}

.fc-layout { position: relative; z-index: 10; flex: 1; display: flex; overflow: hidden; }

/* ===== Conversation Sidebar ===== */
.conv-sidebar { 
  width: 260px; 
  background: transparent; 
  border-right: 1px solid var(--fc-border-soft); 
  display: flex; flex-direction: column; flex-shrink: 0; 
}
.new-chat-btn { 
  display: flex; align-items: center; justify-content: center; gap: 8px; 
  margin: 20px 16px; padding: 12px; 
  background: var(--fc-surface-soft); 
  border: 1px solid var(--fc-border); 
  border-radius: 16px; color: var(--fc-text); font-size: 14px; 
  cursor: pointer; transition: all 0.2s; font-weight: 600; 
}
.new-chat-btn:hover { 
  background: var(--fc-hover); 
  transform: translateY(-1px); 
}
.conv-list { flex: 1; overflow-y: auto; padding: 0 12px; display: flex; flex-direction: column; gap: 4px; }
.conv-item { 
  display: flex; align-items: center; gap: 12px; padding: 12px 14px; 
  border-radius: 12px; cursor: pointer; transition: all 0.2s; position: relative; 
}
.conv-item:hover { background: var(--fc-hover); }
.conv-item.active { 
  background: var(--fc-active); 
  backdrop-filter: blur(10px);
  box-shadow: inset 0 1px 0 var(--fc-border-soft);
}
.conv-icon { color: var(--fc-text-muted); flex-shrink: 0; transition: color 0.2s; }
.conv-item.active .conv-icon { color: var(--accent, #2563eb); }
.conv-title { flex: 1; font-size: 14px; color: var(--fc-text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; transition: color 0.2s; }
.conv-item.active .conv-title { color: var(--fc-text); font-weight: 600; }
.conv-del { 
  background: none; border: none; color: var(--fc-text-muted); cursor: pointer; 
  padding: 4px; border-radius: 6px; display: flex; align-items: center; transition: all 0.2s; 
}
.conv-del:hover { color: #ef4444; background: rgba(239, 68, 68, 0.15); }

.conv-edit { flex: 1; }
.conv-edit-input { 
  width: 100%; background: var(--fc-surface-strong); 
  border: 1px solid var(--accent, #3b82f6); border-radius: 8px; 
  padding: 6px 10px; color: var(--fc-text); font-size: 14px; outline: none; 
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); 
}

/* ===== Chat Area ===== */
.chat-area { flex: 1; display: flex; flex-direction: column; min-width: 0; position: relative; background: transparent; }

/* Welcome State */
.chat-welcome { flex: 1; display: flex; align-items: center; justify-content: center; }
.welcome-inner { display: flex; flex-direction: column; align-items: center; position: relative; animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

.welcome-logo-wrapper { position: relative; margin-bottom: 32px; }
.logo-glow { position: absolute; top: 50%; left: 50%; width: 100px; height: 100px; background: var(--accent, #3b82f6); filter: blur(40px); opacity: 0.4; transform: translate(-50%, -50%); z-index: 1; }
.welcome-logo-img { position: relative; width: 100px; height: 100px; border-radius: 28px; z-index: 2; box-shadow: var(--fc-shadow), inset 0 1px 0 rgba(255,255,255,0.1); }

.welcome-title { 
  font-size: 40px; font-weight: 800; margin: 0 0 12px; letter-spacing: 0; 
  background: var(--fc-title-gradient);
  -webkit-background-clip: text; color: transparent;
}
.welcome-subtitle { font-size: 16px; color: var(--fc-text-secondary); margin: 0 0 32px; font-weight: 500; }

.model-chip { 
  display: inline-flex; align-items: center; gap: 10px; padding: 12px 24px; 
  background: var(--fc-surface); backdrop-filter: blur(20px);
  border: 1px solid var(--fc-border); border-radius: 30px; 
  font-size: 15px; color: var(--fc-text); cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); 
  font-weight: 600; box-shadow: var(--fc-shadow); 
}
.model-chip:hover { 
  background: var(--fc-surface-strong); border-color: var(--accent, #2563eb); 
  transform: translateY(-2px); box-shadow: var(--fc-shadow-strong);
}
.chip-dot { width: 10px; height: 10px; border-radius: 50%; background: #10b981; box-shadow: 0 0 10px rgba(16, 185, 129, 0.6); }

/* Dropdown */
.dropdown { 
  position: absolute; left: 50%; transform: translateX(-50%); margin-top: 16px; 
  background: var(--fc-surface-strong); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px);
  border: 1px solid var(--fc-border); border-radius: 20px; padding: 8px; 
  min-width: 280px; box-shadow: var(--fc-shadow-strong), inset 0 1px 0 rgba(255,255,255,0.05); 
  z-index: 200; animation: ddIn 0.25s cubic-bezier(0.16,1,0.3,1); 
}
.dd-header { top: 60px; left: 50%; }
@keyframes ddIn { from { opacity: 0; transform: translateX(-50%) translateY(-10px) scale(0.95); } to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); } }
.dd-opt { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 12px; cursor: pointer; transition: all 0.2s; font-size: 14px; color: var(--fc-text-secondary); }
.dd-opt:hover { background: var(--fc-hover); color: var(--fc-text); }
.dd-opt.sel { background: linear-gradient(135deg, rgba(59,130,246,0.18), rgba(59,130,246,0.06)); color: var(--accent, #2563eb); font-weight: 600; box-shadow: inset 0 1px 0 rgba(255,255,255,0.05); }
.dd-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--fc-text-muted); flex-shrink: 0; }
.dd-dot.chatimages { background: #a78bfa; box-shadow: 0 0 8px rgba(167, 139, 250, 0.5); }
.dd-name { flex: 1; }
.dd-tag { font-size: 10px; background: var(--fc-reasoning-bg); color: var(--fc-reasoning-text); padding: 2px 8px; border-radius: 6px; font-weight: 700; letter-spacing: 0; }

/* Chat Messages */
.chat-messages-wrap { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.chat-header-wrapper { display: flex; justify-content: center; padding: 16px; position: absolute; top: 0; left: 0; right: 0; z-index: 100; pointer-events: none; }
.chat-header { 
  pointer-events: auto; display: flex; align-items: center; gap: 8px; 
  padding: 8px 12px; border-radius: 24px;
  background: var(--fc-surface); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--fc-border); box-shadow: var(--fc-shadow);
}
.ch-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; color: var(--fc-text-secondary); cursor: pointer; border-radius: 50%; transition: all 0.2s; }
.ch-btn:hover { background: var(--fc-hover); color: var(--fc-text); }
.ch-divider { width: 1px; height: 20px; background: var(--fc-border); margin: 0 4px; }
.ch-model { 
  display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; 
  border-radius: 18px; font-size: 14px; color: var(--fc-text); cursor: pointer; font-weight: 600; 
  background: var(--fc-surface-soft); border: none; transition: all 0.2s; 
}
.ch-model:hover { background: var(--fc-hover); }
.ch-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px rgba(16, 185, 129, 0.5); }

.chat-scroll { flex: 1; overflow-y: auto; scroll-behavior: smooth; padding-top: 80px; } /* padding for absolute header */
.chat-msgs { max-width: 860px; margin: 0 auto; padding: 24px 24px 160px; display: flex; flex-direction: column; gap: 40px; }

.msg-row { display: flex; gap: 20px; animation: msgIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); position: relative; }
@keyframes msgIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.msg-avatar { 
  width: 38px; height: 38px; border-radius: 14px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; 
}
.msg-avatar.assistant { color: #ffffff; background: linear-gradient(135deg, #10b981, #0ea5e9); box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3); }
.msg-avatar.user { display: none; } /* Hide user avatar for cleaner look */
.msg-content { flex: 1; min-width: 0; position: relative; padding-top: 2px; }
.msg-row.user .msg-content { display: flex; flex-direction: column; align-items: flex-end; }
.msg-img { max-width: 360px; max-height: 280px; border-radius: 16px; object-fit: cover; margin-bottom: 12px; border: 1px solid var(--fc-border); box-shadow: var(--fc-shadow); }

.cm-text { font-size: 16px; line-height: 1.7; word-break: break-word; color: var(--fc-text); }
.msg-row.user .cm-text { 
  background: var(--fc-user-bubble);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  padding: 14px 22px; border-radius: 22px 22px 6px 22px; max-width: 80%; 
  border: 1px solid var(--fc-user-border); box-shadow: var(--fc-shadow);
}
.msg-row.assistant .cm-text { padding: 0; color: var(--fc-text); }
.cm-text.is-streaming::after { 
  content: ''; display: inline-block; width: 4px; height: 20px; 
  background: var(--accent, #60a5fa); margin-left: 6px; border-radius: 2px; 
  animation: blink 1s infinite cubic-bezier(0.4, 0, 0.2, 1); vertical-align: text-bottom; 
}

.msg-reasoning { 
  margin-bottom: 16px; border-radius: 16px; overflow: hidden; 
  border: 1px solid var(--fc-reasoning-border); background: var(--fc-reasoning-bg); 
}
.reasoning-toggle { 
  display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 20px; 
  border: none; background: none; cursor: pointer; font-size: 14px; color: var(--fc-reasoning-text); 
  font-weight: 600; transition: background 0.2s; 
}
.reasoning-toggle:hover { background: var(--fc-hover); }
.reasoning-toggle svg.rot { transform: rotate(180deg); }
.reasoning-toggle svg { transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); flex-shrink: 0; }
.reasoning-body { padding: 4px 20px 20px; font-size: 15px; line-height: 1.7; color: var(--fc-text-secondary); border-top: 1px solid var(--fc-reasoning-border); max-height: 500px; overflow-y: auto; }

.typing { display: flex; gap: 6px; padding: 10px 0; }
.typing span { width: 8px; height: 8px; border-radius: 50%; background: var(--fc-text-secondary); animation: dotB 1.4s infinite ease-in-out both; opacity: 0.8; }
.typing span:nth-child(1) { animation-delay: -0.32s; }
.typing span:nth-child(2) { animation-delay: -0.16s; }

/* Edit mode */
.msg-edit-box { display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 680px; }
.msg-edit-textarea { 
  width: 100%; min-height: 100px; padding: 16px; background: var(--fc-surface-strong); 
  border: 1px solid var(--fc-border); border-radius: 16px; color: var(--fc-text); 
  font-size: 16px; resize: vertical; outline: none; font-family: inherit; line-height: 1.6; 
  transition: all 0.3s;
}
.msg-edit-textarea:focus { border-color: var(--accent, #3b82f6); box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15); }
.msg-edit-actions { display: flex; gap: 12px; justify-content: flex-end; }
.edit-confirm { padding: 10px 24px; background: var(--accent, #2563eb); color: #ffffff; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
.edit-confirm:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(37,99,235,0.25); }
.edit-cancel { padding: 10px 24px; background: var(--fc-surface-soft); color: var(--fc-text); border: 1px solid var(--fc-border); border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.edit-cancel:hover { background: var(--fc-hover); }

/* ===== Floating Input Zone ===== */
.input-zone-wrapper {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 0 24px 32px;
  display: flex; justify-content: center;
  background: var(--fc-input-fade);
  pointer-events: none; /* Let clicks pass through gradient */
}
.input-zone { width: 100%; max-width: 860px; position: relative; pointer-events: auto; }
.drag-overlay { 
  position: absolute; inset: -16px; background: var(--fc-surface-strong); backdrop-filter: blur(8px); 
  border: 2px dashed var(--accent, #2563eb); border-radius: 36px; display: flex; align-items: center; justify-content: center; 
  gap: 12px; color: var(--fc-text); font-size: 18px; font-weight: 600; z-index: 10; pointer-events: none; animation: fadeIn 0.2s; 
}
.img-preview { display: flex; gap: 12px; padding-bottom: 16px; padding-left: 16px; }
.img-preview img { width: 80px; height: 80px; border-radius: 16px; object-fit: cover; border: 2px solid var(--fc-border); box-shadow: var(--fc-shadow); }
.img-del { width: 28px; height: 28px; border-radius: 50%; background: var(--fc-surface-strong); backdrop-filter: blur(4px); border: 1px solid var(--fc-border); color: var(--fc-text); cursor: pointer; display: flex; align-items: center; justify-content: center; transform: translate(-14px, -14px); transition: all 0.2s; }
.img-del:hover { background: #ef4444; border-color: #ef4444; transform: translate(-14px, -14px) scale(1.1); }

.input-box { 
  display: flex; align-items: flex-end; gap: 16px; 
  background: var(--fc-input-bg); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px);
  border: 1px solid var(--fc-border); border-radius: 32px; 
  padding: 12px 16px 12px 24px; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); 
  box-shadow: var(--fc-shadow), inset 0 1px 0 rgba(255,255,255,0.18); 
}
.input-box:focus-within { 
  border-color: var(--accent, #2563eb); background: var(--fc-input-focus-bg); 
  box-shadow: var(--fc-shadow-strong), inset 0 1px 0 rgba(255,255,255,0.22); 
}

.ib-attach { width: 44px; height: 44px; border-radius: 50%; background: transparent; border: none; color: var(--fc-text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s; }
.ib-attach:hover { color: var(--fc-text); background: var(--fc-hover); }

.ib-text { 
  flex: 1; background: transparent; border: none; outline: none; 
  color: var(--fc-text); font-size: 16px; line-height: 1.6; resize: none; 
  min-height: 26px; max-height: 240px; font-family: inherit; padding: 10px 0; 
}
.ib-text::placeholder { color: var(--fc-text-muted); }

.ib-send, .ib-stop { width: 44px; height: 44px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.ib-send { background: var(--fc-surface-soft); color: var(--fc-text-muted); }
.ib-send.has-content { background: var(--accent, #2563eb); color: #ffffff; box-shadow: 0 8px 24px rgba(37,99,235,0.28); }
.ib-send.has-content:hover:not(:disabled) { transform: scale(1.05); box-shadow: 0 12px 32px rgba(37,99,235,0.34); }
.ib-send:disabled { cursor: not-allowed; }

.ib-stop { background: #ef4444; color: #ffffff; box-shadow: 0 8px 24px rgba(239,68,68,0.4); animation: stopPulse 2s infinite; }
.ib-stop:hover { background: #dc2626; transform: scale(1.05); }
@keyframes stopPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); } 50% { box-shadow: 0 0 0 12px rgba(239,68,68,0); } }

.input-hint { font-size: 13px; color: var(--fc-text-muted); text-align: center; margin: 20px 0 0; font-weight: 500; letter-spacing: 0; }
</style>

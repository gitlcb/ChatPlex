<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted, watch } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { marked } from 'marked';
import { useServiceManager } from '../composables/useServiceManager';
import { getModelType } from '../utils/modelCapabilities';

const { chatRefreshKey } = useServiceManager();

/* ===== Types ===== */
interface ModelItem { name: string; type: 'chat' | 'chatimages' }
interface ChatMessage { role: 'user' | 'assistant'; content: string; image?: string; streaming?: boolean; reasoning?: string }
interface ChatSession { id: string; title: string; model: string; messages: ChatMessage[]; createdAt: number; updatedAt: number }

/* ===== Constants ===== */
const API_URL = 'https://api.snownk.xyz/v1';
const API_KEY = 'sk-2CkseLsdG29bdNQyFiy9keTs7AHylOGgbsbQIUZ55Bhb9NbX';
const STORAGE_KEY = 'chatplex_sessions';
const ACTIVE_KEY = 'chatplex_active_session';

/* ===== State ===== */
const sessions = ref<ChatSession[]>([]);
const activeSessionId = ref<string | null>(null);
const input = ref('');
const loading = ref(false);
const configError = ref('');
const messagesEnd = ref<HTMLDivElement>();
const selectedModel = ref('');
const imagePreview = ref('');
const fileInput = ref<HTMLInputElement>();
const textareaRef = ref<HTMLTextAreaElement>();
const showModelPicker = ref(false);
const showReasoning = reactive<Record<number, boolean>>({});
const modelList = ref<ModelItem[]>([]);
const editingSessionId = ref<string | null>(null);
const editingTitle = ref('');
const hoverSessionId = ref<string | null>(null);

/* ===== Computed ===== */
const activeSession = computed(() => sessions.value.find(s => s.id === activeSessionId.value) || null);
const messages = computed(() => activeSession.value?.messages || []);
const isMultimodal = computed(() => modelList.value.find(m => m.name === selectedModel.value)?.type === 'chatimages');
const sortedSessions = computed(() => [...sessions.value].sort((a, b) => b.updatedAt - a.updatedAt));

/* ===== Session Storage ===== */
function persistSessions() {
  const stripped = sessions.value.map(s => ({
    ...s,
    messages: s.messages.map(m => ({ ...m, image: undefined, streaming: undefined })),
  }));
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stripped)); } catch { /* quota exceeded */ }
  if (activeSessionId.value) sessionStorage.setItem(ACTIVE_KEY, activeSessionId.value);
}

function loadSessions() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) sessions.value = JSON.parse(raw);
    activeSessionId.value = sessionStorage.getItem(ACTIVE_KEY) || null;
    if (activeSessionId.value && activeSession.value) {
      selectedModel.value = activeSession.value.model;
    }
  } catch { /* corrupted */ }
}

/* ===== Session Management ===== */
function createNewSession() {
  const session: ChatSession = {
    id: crypto.randomUUID(),
    title: '新对话',
    model: selectedModel.value,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  sessions.value.push(session);
  activeSessionId.value = session.id;
  persistSessions();
}

function switchSession(id: string) {
  if (loading.value || id === activeSessionId.value) return;
  activeSessionId.value = id;
  const s = activeSession.value;
  if (s) selectedModel.value = s.model;
  sessionStorage.setItem(ACTIVE_KEY, id);
}

function deleteSession(id: string) {
  const idx = sessions.value.findIndex(s => s.id === id);
  if (idx === -1) return;
  sessions.value.splice(idx, 1);
  if (activeSessionId.value === id) {
    activeSessionId.value = sessions.value.length > 0 ? sessions.value[Math.max(0, idx - 1)].id : null;
  }
  persistSessions();
}

function startRename(id: string) {
  const s = sessions.value.find(s => s.id === id);
  if (!s) return;
  editingSessionId.value = id;
  editingTitle.value = s.title;
}

function confirmRename() {
  if (!editingSessionId.value) return;
  const s = sessions.value.find(s => s.id === editingSessionId.value);
  if (s && editingTitle.value.trim()) s.title = editingTitle.value.trim();
  editingSessionId.value = null;
  persistSessions();
}

function cancelRename() { editingSessionId.value = null; }

/* ===== Config & Models ===== */
function scrollToBottom() { nextTick(() => messagesEnd.value?.scrollIntoView({ behavior: 'smooth' })); }
function autoResize() {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 160) + 'px';
}

async function fetchModels() {
  try {
    const res = await tauriFetch(`${API_URL}/models`, { method: 'GET', headers: { 'Authorization': `Bearer ${API_KEY}` } });
    const data = await res.json();
    if (data.data?.length) {
      modelList.value = data.data.map((m: any) => ({ name: m.id, type: getModelType(m.id) }));
      if (!selectedModel.value) selectedModel.value = modelList.value[0]?.name || '';
    } else { configError.value = '未获取到可用模型'; }
  } catch (e) { configError.value = '加载模型列表失败: ' + (e instanceof Error ? e.message : String(e)); }
}

/* ===== Markdown ===== */
const renderer = new marked.Renderer();
renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
  const langLabel = lang || 'code';
  return `<div class="code-block"><div class="code-header"><span class="code-lang">${langLabel}</span><button class="copy-btn" onclick="(function(btn){const code=btn.closest('.code-block').querySelector('code');navigator.clipboard.writeText(code.textContent);btn.textContent='已复制';setTimeout(()=>btn.textContent='复制',1500)})(this)">复制</button></div><pre><code class="lang-${langLabel}">${text}</code></pre></div>`;
};
marked.setOptions({ renderer, breaks: true, gfm: true });
function renderMd(text: string): string { return marked.parse(text) as string; }

/* ===== Lifecycle ===== */
watch(chatRefreshKey, () => { sessions.value = []; activeSessionId.value = null; configError.value = ''; fetchModels(); showModelPicker.value = false; });
onMounted(() => { loadSessions(); fetchModels(); });

/* ===== Send Message ===== */
async function sendMessage() {
  const text = input.value.trim();
  if ((!text && !imagePreview.value) || loading.value) return;

  if (!activeSession.value) createNewSession();
  const session = activeSession.value!;

  const msg: ChatMessage = { role: 'user', content: text };
  if (imagePreview.value) msg.image = imagePreview.value;
  session.messages.push(msg);
  input.value = '';
  imagePreview.value = '';
  loading.value = true;
  nextTick(() => { textareaRef.value && (textareaRef.value.style.height = 'auto'); });

  if (session.title === '新对话' && text) {
    session.title = text.slice(0, 25) + (text.length > 25 ? '...' : '');
  }
  session.model = selectedModel.value;
  session.updatedAt = Date.now();

  session.messages.push({ role: 'assistant', content: '', streaming: true });
  const assistantMsg = session.messages[session.messages.length - 1];
  scrollToBottom();

  const apiMessages = session.messages.slice(0, -1).map(m => {
    if (m.role === 'assistant') return { role: 'assistant', content: m.content };
    if (m.image) return { role: 'user', content: [{ type: 'text', text: m.content }, { type: 'image_url', image_url: { url: m.image } }] };
    return { role: 'user', content: m.content };
  });

  try {
    let chunkCount = 0;
    const currentSessionId = session.id;
    const unlistenChunk = await listen<{ content: string; is_reasoning: boolean }>('chat-stream-chunk', (event) => {
      if (activeSessionId.value !== currentSessionId) return;
      if (event.payload.is_reasoning) {
        if (!assistantMsg.reasoning) { assistantMsg.reasoning = ''; showReasoning[session.messages.length - 1] = true; }
        assistantMsg.reasoning += event.payload.content;
      } else {
        if (assistantMsg.reasoning && showReasoning[session.messages.length - 1]) showReasoning[session.messages.length - 1] = false;
        assistantMsg.content += event.payload.content;
      }
      chunkCount++;
      scrollToBottom();
    });
    const unlistenDone = await listen<{ done: boolean }>('chat-stream-done', () => { unlistenChunk(); unlistenDone(); });

    await invoke('chat_stream', { req: { url: API_URL, api_key: API_KEY, model: selectedModel.value, messages: apiMessages } });

    unlistenChunk(); unlistenDone();
    if (chunkCount === 0 && !assistantMsg.reasoning) assistantMsg.content = '抱歉，未收到回复内容。';
  } catch (e) {
    assistantMsg.content += '\n\n请求失败: ' + (e instanceof Error ? e.message : String(e));
  } finally {
    assistantMsg.streaming = false;
    loading.value = false;
    scrollToBottom();
    persistSessions();
  }
}

function stopGeneration() {
  loading.value = false;
  if (activeSession.value) {
    const msgs = activeSession.value.messages;
    const last = msgs[msgs.length - 1];
    if (last?.role === 'assistant') last.streaming = false;
  }
  persistSessions();
}

/* ===== File & Input ===== */
function onFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { imagePreview.value = reader.result as string; };
  reader.readAsDataURL(file);
}
function onPaste(e: ClipboardEvent) {
  if (!isMultimodal.value) return;
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault();
      const blob = item.getAsFile();
      if (blob) { const reader = new FileReader(); reader.onload = () => { imagePreview.value = reader.result as string; }; reader.readAsDataURL(blob); }
      return;
    }
  }
}
function selectModel(name: string) { selectedModel.value = name; showModelPicker.value = false; if (activeSession.value) activeSession.value.model = name; }
function onKeydown(e: KeyboardEvent) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }
</script>

<template>
  <div class="fc-dark" @click="showModelPicker = false">
    <div v-if="configError" class="fc-error">{{ configError }}</div>

    <div class="fc-layout">
      <!-- ===== Conversation Sidebar ===== -->
      <aside class="conv-sidebar">
        <button class="new-chat-btn" @click="createNewSession">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          新对话
        </button>
        <div class="conv-list">
          <div v-for="s in sortedSessions" :key="s.id"
            class="conv-item" :class="{ active: s.id === activeSessionId }"
            @click="switchSession(s.id)"
            @mouseenter="hoverSessionId = s.id" @mouseleave="hoverSessionId = null"
            @dblclick.stop="startRename(s.id)">
            <div v-if="editingSessionId === s.id" class="conv-edit">
              <input v-model="editingTitle" class="conv-edit-input" @keydown.enter="confirmRename" @keydown.escape="cancelRename" @blur="confirmRename" @click.stop autofocus />
            </div>
            <template v-else>
              <svg class="conv-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
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
        <div v-if="!activeSession || messages.length === 0" class="chat-welcome">
          <div class="welcome-inner">
            <img src="/chatplex-logo.png" class="welcome-logo-img" alt="ChatPlex" />
            <h1 class="welcome-title">有什么可以帮你的？</h1>
            <button class="model-chip" @click.stop="showModelPicker = !showModelPicker">
              <span class="chip-dot"></span>{{ selectedModel || '选择模型' }}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
            </button>
            <div v-if="showModelPicker && modelList.length > 1" class="dropdown" @click.stop>
              <div v-for="m in modelList" :key="m.name" class="dd-opt" :class="{ sel: selectedModel === m.name }" @click="selectModel(m.name)">
                <span class="dd-dot" :class="m.type"></span><span class="dd-name">{{ m.name }}</span>
                <span v-if="m.type === 'chatimages'" class="dd-tag">多模态</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Chat Messages -->
        <div v-else class="chat-messages-wrap">
          <div class="chat-header" @click.stop>
            <button class="ch-model" @click="showModelPicker = !showModelPicker">
              <span class="ch-dot"></span>{{ selectedModel }}
              <svg v-if="modelList.length > 1" width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
            </button>
            <div v-if="showModelPicker && modelList.length > 1" class="dropdown dd-header" @click.stop>
              <div v-for="m in modelList" :key="m.name" class="dd-opt" :class="{ sel: selectedModel === m.name }" @click="selectModel(m.name)">
                <span class="dd-dot" :class="m.type"></span><span class="dd-name">{{ m.name }}</span>
                <span v-if="m.type === 'chatimages'" class="dd-tag">多模态</span>
              </div>
            </div>
          </div>
          <div class="chat-scroll">
            <div class="chat-msgs">
              <div v-for="(msg, i) in messages" :key="i" class="msg-row" :class="msg.role">
                <div class="msg-avatar" :class="msg.role">
                  <svg v-if="msg.role === 'assistant'" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" fill="rgba(255,255,255,0.9)"/><path d="M2 17l10 5 10-5" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/><path d="M2 12l10 5 10-5" stroke="rgba(255,255,255,0.7)" stroke-width="1.5"/></svg>
                  <span v-else>你</span>
                </div>
                <div class="msg-content">
                  <img v-if="msg.image" :src="msg.image" class="msg-img" />
                  <div v-if="msg.reasoning" class="msg-reasoning">
                    <button class="reasoning-toggle" @click="showReasoning[i] = !showReasoning[i]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                      <span>{{ msg.streaming && !msg.content ? '思考中...' : '已深度思考' }}</span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" :class="{ rot: showReasoning[i] }"><path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
                    </button>
                    <div v-if="showReasoning[i]" class="reasoning-body" v-html="renderMd(msg.reasoning)"></div>
                  </div>
                  <div v-if="msg.content" class="cm-text" :class="{ 'is-streaming': msg.streaming }" v-html="renderMd(msg.content)"></div>
                  <div v-if="msg.streaming && !msg.content && !msg.reasoning" class="cm-text"><div class="typing"><span></span><span></span><span></span></div></div>
                </div>
              </div>
            </div>
            <div ref="messagesEnd"></div>
          </div>
        </div>

        <!-- Input Zone (always visible) -->
        <div class="input-zone">
          <div v-if="imagePreview" class="img-preview">
            <img :src="imagePreview" /><button class="img-del" @click="imagePreview = ''">✕</button>
          </div>
          <div class="input-box">
            <button v-if="isMultimodal" class="ib-attach" @click="fileInput?.click()" title="上传图片">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
            </button>
            <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="onFileSelect" />
            <textarea ref="textareaRef" v-model="input" :placeholder="isMultimodal ? '发送消息或粘贴图片...' : '给 AI 发送消息...'" rows="1" :disabled="!!configError" @keydown="onKeydown" @input="autoResize" @paste="onPaste" class="ib-text"></textarea>
            <button v-if="loading" class="ib-stop" @click="stopGeneration" title="停止生成">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
            </button>
            <button v-else class="ib-send" :disabled="(!input.trim() && !imagePreview) || !!configError" @click="sendMessage">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
          <p class="input-hint">内容由 AI 生成，仅供参考 · 公益服务不保证实时可用，若当前模型无响应可切换其他模型尝试</p>
        </div>
      </main>
    </div>
  </div>
</template>

<style>
/* ===== Dark Theme Markdown (unscoped) ===== */
.fc-dark .cm-text h1, .fc-dark .cm-text h2, .fc-dark .cm-text h3, .fc-dark .cm-text h4 { margin: 16px 0 8px; font-weight: 600; color: #e2e8f0; }
.fc-dark .cm-text h1 { font-size: 20px; } .fc-dark .cm-text h2 { font-size: 18px; } .fc-dark .cm-text h3 { font-size: 16px; }
.fc-dark .cm-text p { margin: 6px 0; }
.fc-dark .cm-text ul, .fc-dark .cm-text ol { margin: 8px 0; padding-left: 24px; }
.fc-dark .cm-text li { margin: 3px 0; line-height: 1.7; }
.fc-dark .cm-text blockquote { border-left: 3px solid #334155; padding: 4px 12px; margin: 8px 0; color: #94a3b8; background: #1e293b; border-radius: 0 6px 6px 0; }
.fc-dark .cm-text table { border-collapse: collapse; margin: 8px 0; width: 100%; font-size: 13px; }
.fc-dark .cm-text th, .fc-dark .cm-text td { border: 1px solid #1e293b; padding: 6px 10px; text-align: left; }
.fc-dark .cm-text th { background: #1e293b; font-weight: 600; color: #e2e8f0; }
.fc-dark .cm-text td { color: #cbd5e1; }
.fc-dark .cm-text a { color: #60a5fa; text-decoration: none; } .fc-dark .cm-text a:hover { text-decoration: underline; }
.fc-dark .cm-text hr { border: none; border-top: 1px solid #1e293b; margin: 12px 0; }
.fc-dark .cm-text img { max-width: 100%; border-radius: 8px; margin: 8px 0; }
.fc-dark .code-block { margin: 10px 0; border-radius: 10px; overflow: hidden; border: 1px solid #1e293b; }
.fc-dark .code-header { display: flex; align-items: center; justify-content: space-between; padding: 6px 12px; background: #161b22; border-bottom: 1px solid #1e293b; }
.fc-dark .code-lang { font-size: 12px; color: #94a3b8; font-family: monospace; }
.fc-dark .copy-btn { font-size: 11px; color: #94a3b8; background: none; border: 1px solid #334155; border-radius: 4px; padding: 2px 8px; cursor: pointer; transition: all 0.15s; }
.fc-dark .copy-btn:hover { background: #1e293b; color: #e2e8f0; }
.fc-dark .code-block pre { margin: 0; padding: 12px 14px; background: #0d1117; overflow-x: auto; }
.fc-dark .code-block code { font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace; font-size: 13px; line-height: 1.6; color: #e2e8f0; }
.fc-dark .cm-text :not(pre) > code { background: #1e293b; padding: 1px 6px; border-radius: 4px; color: #f472b6; font-size: 13px; font-family: 'Cascadia Code', monospace; }
</style>

<style scoped>
.fc-dark { display: flex; flex-direction: column; height: 100vh; background: #0a0f16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Noto Sans SC', sans-serif; color: #e2e8f0; }
.fc-error { padding: 10px 16px; background: rgba(239,68,68,0.1); border-bottom: 1px solid rgba(239,68,68,0.2); color: #f87171; font-size: 13px; text-align: center; }
.fc-layout { flex: 1; display: flex; overflow: hidden; }

/* ===== Conversation Sidebar ===== */
.conv-sidebar { width: 260px; background: #0f1520; border-right: 1px solid #1a2435; display: flex; flex-direction: column; flex-shrink: 0; }
.new-chat-btn { display: flex; align-items: center; gap: 8px; margin: 12px; padding: 10px 16px; background: #1a2435; border: 1px solid #243447; border-radius: 10px; color: #e2e8f0; font-size: 14px; cursor: pointer; transition: all 0.15s; font-weight: 500; }
.new-chat-btn:hover { background: #243447; border-color: #3b82f6; }
.conv-list { flex: 1; overflow-y: auto; padding: 4px 8px; }
.conv-item { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 8px; cursor: pointer; transition: background 0.12s; position: relative; margin-bottom: 2px; }
.conv-item:hover { background: rgba(255,255,255,0.04); }
.conv-item.active { background: rgba(59,130,246,0.1); border-left: 3px solid #3b82f6; padding-left: 9px; }
.conv-icon { color: #64748b; flex-shrink: 0; }
.conv-title { flex: 1; font-size: 13px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.conv-item.active .conv-title { color: #e2e8f0; }
.conv-del { background: none; border: none; color: #64748b; cursor: pointer; padding: 2px; border-radius: 4px; display: flex; align-items: center; transition: color 0.15s; }
.conv-del:hover { color: #f87171; }
.conv-edit { flex: 1; }
.conv-edit-input { width: 100%; background: #1a2435; border: 1px solid #3b82f6; border-radius: 4px; padding: 4px 8px; color: #e2e8f0; font-size: 13px; outline: none; }

/* ===== Chat Area ===== */
.chat-area { flex: 1; display: flex; flex-direction: column; min-width: 0; position: relative; }

/* Welcome */
.chat-welcome { flex: 1; display: flex; align-items: center; justify-content: center; }
.welcome-inner { display: flex; flex-direction: column; align-items: center; position: relative; }
.welcome-logo-img { width: 88px; height: 88px; border-radius: 20px; margin-bottom: 20px; filter: drop-shadow(0 8px 24px rgba(96,165,250,0.2)); }
.welcome-title { font-size: 26px; font-weight: 600; color: #e2e8f0; margin: 0 0 20px; }

/* Model Chip & Dropdown */
.model-chip { display: inline-flex; align-items: center; gap: 6px; padding: 7px 16px; background: #1a2435; border: 1px solid #243447; border-radius: 24px; font-size: 13px; color: #94a3b8; cursor: pointer; transition: all 0.2s; font-weight: 500; }
.model-chip:hover { border-color: #3b82f6; color: #e2e8f0; }
.chip-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,0.4); }
.dropdown { position: absolute; left: 50%; transform: translateX(-50%); margin-top: 8px; background: #131b27; border: 1px solid #1e293b; border-radius: 12px; padding: 4px; min-width: 240px; box-shadow: 0 8px 30px rgba(0,0,0,0.4); z-index: 200; animation: ddIn 0.18s cubic-bezier(0.16,1,0.3,1); }
.dd-header { top: 44px; left: 50%; }
@keyframes ddIn { from { opacity: 0; transform: translateX(-50%) translateY(-6px) scale(0.97); } to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); } }
.dd-opt { display: flex; align-items: center; gap: 8px; padding: 9px 12px; border-radius: 8px; cursor: pointer; transition: background 0.12s; font-size: 13px; color: #94a3b8; }
.dd-opt:hover { background: #1a2435; color: #e2e8f0; }
.dd-opt.sel { background: rgba(59,130,246,0.15); color: #60a5fa; }
.dd-dot { width: 8px; height: 8px; border-radius: 50%; background: #475569; flex-shrink: 0; }
.dd-dot.chatimages { background: #8b5cf6; }
.dd-name { flex: 1; font-weight: 500; }
.dd-tag { font-size: 10px; background: rgba(139,92,246,0.15); color: #a78bfa; padding: 1px 6px; border-radius: 4px; font-weight: 500; }
</style>

<style scoped>
/* ===== Chat Messages Area ===== */
.chat-messages-wrap { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.chat-header { position: relative; display: flex; justify-content: center; padding: 12px 20px; border-bottom: 1px solid #1a2435; flex-shrink: 0; z-index: 100; }
.ch-model { display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px; border-radius: 16px; font-size: 13px; color: #94a3b8; cursor: pointer; font-weight: 500; background: none; border: none; transition: all 0.15s; }
.ch-model:hover { background: #1a2435; color: #e2e8f0; }
.ch-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,0.4); }
.chat-scroll { flex: 1; overflow-y: auto; scroll-behavior: smooth; }
.chat-msgs { max-width: 780px; margin: 0 auto; padding: 24px 24px 12px; display: flex; flex-direction: column; gap: 24px; }

/* Message Row */
.msg-row { display: flex; gap: 12px; animation: msgIn 0.25s ease; }
@keyframes msgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.msg-avatar { width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; }
.msg-avatar.assistant { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
.msg-avatar.user { background: linear-gradient(135deg, #3b82f6, #06b6d4); color: white; }
.msg-content { flex: 1; min-width: 0; }
.msg-row.user .msg-content { display: flex; flex-direction: column; align-items: flex-end; }
.msg-img { max-width: 300px; max-height: 220px; border-radius: 10px; object-fit: cover; margin-bottom: 6px; }

/* Message Text */
.cm-text { font-size: 14px; line-height: 1.75; word-break: break-word; color: #e2e8f0; }
.msg-row.user .cm-text { background: #1e3a5f; padding: 12px 16px; border-radius: 16px 16px 4px 16px; max-width: 70%; }
.msg-row.assistant .cm-text { padding: 4px 0; }
.cm-text.is-streaming::after { content: ''; display: inline-block; width: 2px; height: 16px; background: #60a5fa; margin-left: 2px; animation: blink 0.8s infinite; vertical-align: text-bottom; }
@keyframes blink { 0%,50% { opacity: 1; } 51%,100% { opacity: 0; } }

/* Reasoning */
.msg-reasoning { margin-bottom: 8px; border-radius: 10px; overflow: hidden; border: 1px solid rgba(99,102,241,0.2); background: rgba(99,102,241,0.06); }
.reasoning-toggle { display: flex; align-items: center; gap: 6px; width: 100%; padding: 8px 12px; border: none; background: none; cursor: pointer; font-size: 13px; color: #818cf8; font-weight: 500; transition: background 0.15s; }
.reasoning-toggle:hover { background: rgba(99,102,241,0.1); }
.reasoning-toggle svg.rot { transform: rotate(180deg); }
.reasoning-toggle svg { transition: transform 0.2s; flex-shrink: 0; }
.reasoning-body { padding: 0 12px 10px; font-size: 13px; line-height: 1.7; color: #94a3b8; border-top: 1px solid rgba(99,102,241,0.15); max-height: 300px; overflow-y: auto; }

/* Typing */
.typing { display: flex; gap: 5px; padding: 4px 0; }
.typing span { width: 7px; height: 7px; border-radius: 50%; background: #475569; animation: dotB 1.4s infinite; }
.typing span:nth-child(2) { animation-delay: 0.15s; }
.typing span:nth-child(3) { animation-delay: 0.3s; }
@keyframes dotB { 0%,80%,100% { transform: scale(0.5); opacity: 0.3; } 40% { transform: scale(1); opacity: 1; } }

/* ===== Input Zone ===== */
.input-zone { padding: 12px 24px 16px; max-width: 780px; width: 100%; margin: 0 auto; }
.img-preview { display: flex; gap: 6px; padding-bottom: 8px; }
.img-preview img { width: 64px; height: 64px; border-radius: 8px; object-fit: cover; border: 1px solid #1e293b; }
.img-del { width: 22px; height: 22px; border-radius: 50%; background: rgba(239,68,68,0.15); border: none; color: #f87171; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.input-box { display: flex; align-items: flex-end; gap: 8px; background: #131b27; border: 1px solid #243447; border-radius: 24px; padding: 10px 12px 10px 16px; transition: border-color 0.2s, box-shadow 0.2s; }
.input-box:focus-within { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.08), 0 4px 20px rgba(0,0,0,0.3); }
.ib-attach { width: 36px; height: 36px; border-radius: 50%; background: none; border: none; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.15s; }
.ib-attach:hover { color: #60a5fa; background: rgba(96,165,250,0.1); }
.ib-text { flex: 1; background: none; border: none; outline: none; color: #e2e8f0; font-size: 15px; line-height: 1.5; resize: none; min-height: 24px; max-height: 160px; font-family: inherit; padding: 6px 0; }
.ib-text::placeholder { color: #4b5563; }
.ib-send, .ib-stop { width: 36px; height: 36px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: all 0.2s; }
.ib-send { background: #3b82f6; color: white; box-shadow: 0 2px 8px rgba(59,130,246,0.3); }
.ib-send:hover:not(:disabled) { background: #2563eb; transform: scale(1.05); box-shadow: 0 4px 12px rgba(59,130,246,0.4); }
.ib-send:disabled { background: #1e293b; color: #475569; box-shadow: none; cursor: not-allowed; }
.ib-stop { background: #ef4444; color: white; box-shadow: 0 2px 8px rgba(239,68,68,0.3); animation: pulse 1.5s infinite; }
.ib-stop:hover { background: #dc2626; transform: scale(1.05); }
@keyframes pulse { 0%,100% { box-shadow: 0 2px 8px rgba(239,68,68,0.3); } 50% { box-shadow: 0 2px 16px rgba(239,68,68,0.5); } }
.input-hint { font-size: 12px; color: #475569; text-align: center; margin: 10px 0 0; }
</style>

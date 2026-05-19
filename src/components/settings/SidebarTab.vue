<script setup lang="ts">
import { ref, computed } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { fetch as tauriFetch } from '@tauri-apps/plugin-http'
import { useAppStore } from '../../stores/app'
import { SERVICES } from '../../types/services'
import type { ServiceRegion, ServiceCategory, ApiType, CustomModel } from '../../types/services'

const store = useAppStore()

const builtInServices = computed(() => SERVICES)
const customServices = computed(() => store.customServices)

function isHidden(id: string) { return store.hiddenServiceIds.includes(id) }
function toggleBuiltIn(id: string) { store.toggleServiceVisibility(id) }
function toggleCustom(id: string) { store.toggleCustomServiceVisibility(id) }
function removeCustom(id: string) { store.removeCustomService(id) }
function getRegionLabel(r: ServiceRegion) { return r === 'domestic' ? '国内' : '国际' }
function getCategoryLabel(c: ServiceCategory) { return c === 'chat' ? '对话' : '视觉' }

// ===== Website Add =====
const wName = ref('')
const wUrl = ref('')
const wRegion = ref<ServiceRegion>('domestic')
const wCategory = ref<ServiceCategory>('chat')
const wIcon = ref('')
const wAdding = ref(false)
const wError = ref('')

function onWIconUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 512 * 1024) { wError.value = '图标不能超过 512KB'; return }
  const reader = new FileReader()
  reader.onload = () => { wIcon.value = reader.result as string }
  reader.readAsDataURL(file)
}

async function addWebsite() {
  const name = wName.value.trim()
  const url = wUrl.value.trim()
  if (!name || !url) { wError.value = '请填写名称和网址'; return }
  wError.value = ''; wAdding.value = true
  let icon = wIcon.value || undefined
  if (!icon) {
    try { icon = (await invoke<string | null>('fetch_favicon', { url })) ?? undefined }
    catch { /* */ }
  }
  store.addCustomService({ name, url, region: wRegion.value, category: wCategory.value, customIcon: icon })
  wName.value = ''; wUrl.value = ''; wIcon.value = ''
  wAdding.value = false
}

// ===== AI Add =====
const aName = ref('')
const aApiType = ref<ApiType>('openai')
const aApiBaseUrl = ref('')
const aApiKey = ref('')
const aIcon = ref('')
// temp models before saving
const aModels = ref<CustomModel[]>([])
const aModelName = ref('')
const aModelType = ref<'chat' | 'chatimages'>('chat')
const aAdding = ref(false)
const aError = ref('')
const aFetchingModels = ref(false)

// ===== Edit =====
const editingId = ref<string | null>(null)
const eName = ref('')
const eApiType = ref<ApiType>('openai')
const eApiBaseUrl = ref('')
const eApiKey = ref('')
const eIcon = ref('')
const eModels = ref<CustomModel[]>([])
const eModelName = ref('')
const eModelType = ref<'chat' | 'chatimages'>('chat')
const eError = ref('')
const eFetchingModels = ref(false)

function startEdit(svc: typeof store.customServices[0]) {
  editingId.value = svc.id
  eName.value = svc.name
  eApiType.value = svc.apiType || 'openai'
  eApiBaseUrl.value = svc.apiBaseUrl || ''
  eApiKey.value = svc.apiKey || ''
  eIcon.value = svc.customIcon || ''
  eModels.value = svc.models ? svc.models.map(m => ({ ...m })) : []
  eError.value = ''
}
function cancelEdit() { editingId.value = null }

function onEIconUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 512 * 1024) { eError.value = '图标不能超过 512KB'; return }
  const reader = new FileReader()
  reader.onload = () => { eIcon.value = reader.result as string }
  reader.readAsDataURL(file)
}
function addEditModel() {
  const name = eModelName.value.trim()
  if (!name || eModels.value.find(m => m.name === name)) return
  eModels.value.push({ name, type: eModelType.value })
  eModelName.value = ''
}
function removeEditModel(name: string) {
  eModels.value = eModels.value.filter(m => m.name !== name)
}
function toggleEditModelType(name: string) {
  const m = eModels.value.find(m => m.name === name)
  if (m) m.type = m.type === 'chat' ? 'chatimages' : 'chat'
}
async function fetchEditModels() {
  const rawUrl = eApiBaseUrl.value.trim()
  if (!rawUrl) { eError.value = '请先填写 API 基础地址'; return }
  eFetchingModels.value = true; eError.value = ''
  try {
    const key = eApiKey.value.trim()
    const headers: Record<string, string> = {}
    if (key) headers['Authorization'] = `Bearer ${key}`
    const base = rawUrl.replace(/\/+$/, '')
    const urls = base.includes('/v1') ? [`${base}/models`] : [`${base}/v1/models`, `${base}/models`]
    let lastError = ''
    for (const modelsUrl of urls) {
      try {
        const res = await tauriFetch(modelsUrl, { method: 'GET', headers })
        if (!res.ok) { lastError = `HTTP ${res.status}`; continue }
        const data = await res.json()
        if (data.data?.length) {
          eModels.value = data.data.map((m: any) => ({
            name: m.id,
            type: (m.id.includes('vision') || m.id.includes('vl') || m.id.includes('gpt-4o') || m.id.includes('claude-3') || m.id.includes('gemini')) ? 'chatimages' as const : 'chat' as const
          }))
          eFetchingModels.value = false; return
        }
        lastError = '响应中没有模型列表'
      } catch { continue }
    }
    eError.value = `未获取到模型列表 (${lastError})`
  } catch (e) { eError.value = '获取模型失败: ' + (e instanceof Error ? e.message : String(e)) }
  eFetchingModels.value = false
}
function saveEdit() {
  const id = editingId.value
  if (!id) return
  const name = eName.value.trim()
  const baseUrl = eApiBaseUrl.value.trim()
  if (!name || !baseUrl) { eError.value = '请填写名称和 API 基础地址'; return }
  store.updateCustomService(id, {
    name,
    url: '',
    region: 'domestic',
    category: 'chat',
    apiType: eApiType.value,
    apiBaseUrl: baseUrl,
    apiKey: eApiKey.value.trim() || undefined,
    customIcon: eIcon.value || undefined,
    models: eModels.value.length > 0 ? [...eModels.value] : undefined,
  })
  editingId.value = null
}

function onAIconUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 512 * 1024) { aError.value = '图标不能超过 512KB'; return }
  const reader = new FileReader()
  reader.onload = () => { aIcon.value = reader.result as string }
  reader.readAsDataURL(file)
}

function addModel() {
  const name = aModelName.value.trim()
  if (!name) return
  if (aModels.value.find(m => m.name === name)) return
  aModels.value.push({ name, type: aModelType.value })
  aModelName.value = ''
}

function removeModel(name: string) {
  aModels.value = aModels.value.filter(m => m.name !== name)
}

function toggleModelType(name: string) {
  const m = aModels.value.find(m => m.name === name)
  if (m) m.type = m.type === 'chat' ? 'chatimages' : 'chat'
}

async function fetchModels() {
  const rawUrl = aApiBaseUrl.value.trim()
  if (!rawUrl) { aError.value = '请先填写 API 基础地址'; return }
  aFetchingModels.value = true
  aError.value = ''
  try {
    const key = aApiKey.value.trim()
    const headers: Record<string, string> = {}
    if (key) headers['Authorization'] = `Bearer ${key}`

    // Build models URL: try multiple patterns like FreeChat.vue
    const base = rawUrl.replace(/\/+$/, '')
    const urls = base.includes('/v1')
      ? [`${base}/models`]
      : [`${base}/v1/models`, `${base}/models`]

    let lastError = ''
    for (const modelsUrl of urls) {
      try {
        const res = await tauriFetch(modelsUrl, { method: 'GET', headers })
        if (!res.ok) { lastError = `HTTP ${res.status}`; continue }
        const data = await res.json()
        if (data.data?.length) {
          aModels.value = data.data.map((m: any) => ({
            name: m.id,
            type: (m.id.includes('vision') || m.id.includes('vl') || m.id.includes('gpt-4o') || m.id.includes('claude-3') || m.id.includes('gemini')) ? 'chatimages' as const : 'chat' as const
          }))
          aFetchingModels.value = false
          return
        }
        lastError = '响应中没有模型列表'
      } catch { continue }
    }
    aError.value = `未获取到模型列表 (${lastError})`
  } catch (e) {
    aError.value = '获取模型失败: ' + (e instanceof Error ? e.message : String(e))
  }
  aFetchingModels.value = false
}

async function addAI() {
  const name = aName.value.trim()
  const baseUrl = aApiBaseUrl.value.trim()
  if (!name || !baseUrl) { aError.value = '请填写名称和 API 基础地址'; return }
  aError.value = ''; aAdding.value = true
  let icon = aIcon.value || undefined
  if (!icon) {
    try { icon = (await invoke<string | null>('fetch_favicon', { url: baseUrl })) ?? undefined }
    catch { /* */ }
  }
  store.addCustomService({
    name,
    url: '',
    region: 'domestic',
    category: 'chat',
    customIcon: icon,
    apiType: aApiType.value,
    apiBaseUrl: baseUrl,
    apiKey: aApiKey.value.trim() || undefined,
    models: aModels.value.length > 0 ? [...aModels.value] : undefined,
  })
  aName.value = ''; aApiBaseUrl.value = ''; aApiKey.value = ''
  aIcon.value = ''; aModels.value = []
  aAdding.value = false
}
</script>

<template>
  <div class="settings-panel">
    <!-- Built-in Services -->
    <div class="settings-section">
      <h3 class="section-title">内置服务</h3>
      <p class="section-desc">管理默认提供的 AI 服务，您可以隐藏不需要的服务以简化侧边栏。</p>
      
      <div class="service-list">
        <div v-for="svc in builtInServices" :key="svc.id" class="service-row" :class="{ hidden: isHidden(svc.id) }">
          <span class="svc-icon">{{ svc.icon }}</span>
          <span class="svc-info">
            <span class="svc-name">{{ svc.name }}</span>
            <span class="svc-meta">{{ getCategoryLabel(svc.category) }} · {{ getRegionLabel(svc.region) }}</span>
          </span>
          <button class="toggle-switch" :class="{ active: !isHidden(svc.id) }" @click="toggleBuiltIn(svc.id)">
            <span class="toggle-thumb"></span>
          </button>
        </div>
      </div>
    </div>

    <!-- Custom Services List -->
    <div class="settings-section">
      <h3 class="section-title">自定义服务</h3>
      <p class="section-desc">您手动添加的第三方网站或 API 服务。</p>
      
      <div v-if="customServices.length === 0" class="empty-state">
        <p>暂无自定义服务，请在下方添加</p>
      </div>
      
      <div v-else class="service-list">
        <div v-for="svc in customServices" :key="svc.id" class="service-row custom" :class="{ hidden: svc.hidden }">
          <img v-if="svc.customIcon" :src="svc.customIcon" class="svc-icon custom-svc-icon" />
          <span v-else class="svc-icon first-char-badge" :style="{ background: svc.color }">{{ svc.name[0] }}</span>
          <span class="svc-info">
            <span class="svc-name">
              {{ svc.name }}
              <span v-if="svc.apiType" class="svc-badge" :class="svc.apiType">{{ svc.apiType }}</span>
            </span>
            <span class="svc-meta">{{ svc.url || svc.apiBaseUrl }} <span v-if="svc.models?.length">· {{ svc.models.length }} 模型</span></span>
          </span>
          
          <div class="svc-actions">
            <button class="toggle-switch" :class="{ active: !svc.hidden }" @click="toggleCustom(svc.id)">
              <span class="toggle-thumb"></span>
            </button>
            <div class="action-divider"></div>
            <button class="action-btn edit-btn" @click="startEdit(svc)" title="编辑">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            </button>
            <button class="action-btn delete-btn" @click="removeCustom(svc.id)" title="删除">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== Add Website ===== -->
    <div class="settings-section form-section">
      <h3 class="section-title">添加自定义网站</h3>
      <p class="section-desc">将任何网页作为一个标签页添加到侧边栏。</p>
      
      <div class="add-form">
        <div class="add-row">
          <input v-model="wName" class="form-input" placeholder="网站名称" :disabled="wAdding" />
          <select v-model="wRegion" class="form-select" :disabled="wAdding">
            <option value="domestic">国内服务</option>
            <option value="international">国际服务</option>
          </select>
          <select v-model="wCategory" class="form-select" :disabled="wAdding">
            <option value="chat">AI 对话</option>
            <option value="visual">视觉/绘图</option>
          </select>
        </div>
        <div class="add-row">
          <input v-model="wUrl" class="form-input" placeholder="完整网址 (如 https://chat.example.com)" :disabled="wAdding" />
        </div>
        <div class="add-row actions-row">
          <div class="file-upload">
            <input type="file" accept="image/*" class="file-input-hidden" id="w-icon-upload" :disabled="wAdding" @change="onWIconUpload" />
            <label for="w-icon-upload" class="file-label">
              <img v-if="wIcon" :src="wIcon" class="preview-icon" />
              <span v-else>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                自定义图标
              </span>
            </label>
            <button v-if="wIcon" class="clear-icon-btn" @click="wIcon = ''">清除</button>
          </div>
          <button class="primary-btn" :disabled="wAdding" @click="addWebsite">
            {{ wAdding ? '添加中...' : '添加网站' }}
          </button>
        </div>
        <div v-if="wError" class="error-msg">{{ wError }}</div>
      </div>
    </div>

    <!-- ===== Add Custom AI ===== -->
    <div class="settings-section form-section">
      <h3 class="section-title">添加兼容 API 的 AI</h3>
      <p class="section-desc">添加兼容 OpenAI 或 Anthropic 接口格式的大模型 API。</p>
      
      <div class="add-form">
        <div class="add-row">
          <input v-model="aName" class="form-input" placeholder="服务提供商名称" :disabled="aAdding" />
          <select v-model="aApiType" class="form-select" :disabled="aAdding">
            <option value="openai">OpenAI 兼容</option>
            <option value="anthropic">Anthropic 兼容</option>
          </select>
        </div>
        <div class="add-row">
          <input v-model="aApiBaseUrl" class="form-input" placeholder="API 基础地址 (如 https://api.openai.com/v1)" :disabled="aAdding" />
        </div>
        <div class="add-row">
          <input v-model="aApiKey" type="password" class="form-input" placeholder="API Key (如需验证)" :disabled="aAdding" />
        </div>

        <!-- Models -->
        <div class="sub-section">
          <div class="sub-section-header">
            <span class="sub-label">包含的模型</span>
            <button class="ghost-btn" :disabled="aFetchingModels || aAdding" @click="fetchModels">
              <svg v-if="aFetchingModels" class="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              尝试自动获取
            </button>
          </div>
          
          <div v-if="aModels.length > 0" class="chip-container">
            <span v-for="m in aModels" :key="m.name" class="chip" @click="toggleModelType(m.name)" :title="m.type === 'chat' ? '点击切换为多模态' : '点击切换为对话'">
              <span class="chip-dot" :class="m.type"></span>
              {{ m.name }}
              <button class="chip-rm" @click.stop="removeModel(m.name)">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </span>
          </div>
          
          <div class="inline-add-row">
            <input v-model="aModelName" class="form-input sm" placeholder="手动输入模型名 (如 gpt-4o)" @keydown.enter="addModel" />
            <select v-model="aModelType" class="form-select sm">
              <option value="chat">纯文本</option>
              <option value="chatimages">多模态(识图)</option>
            </select>
            <button class="secondary-btn" @click="addModel">添加</button>
          </div>
        </div>

        <div class="add-row actions-row">
          <div class="file-upload">
            <input type="file" accept="image/*" class="file-input-hidden" id="a-icon-upload" :disabled="aAdding" @change="onAIconUpload" />
            <label for="a-icon-upload" class="file-label">
              <img v-if="aIcon" :src="aIcon" class="preview-icon" />
              <span v-else>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                自定义图标
              </span>
            </label>
            <button v-if="aIcon" class="clear-icon-btn" @click="aIcon = ''">清除</button>
          </div>
          <button class="primary-btn" :disabled="aAdding" @click="addAI">
            {{ aAdding ? '添加中...' : '添加 API' }}
          </button>
        </div>
        <div v-if="aError" class="error-msg">{{ aError }}</div>
      </div>
    </div>

    <!-- ===== Edit Custom AI Modal ===== -->
    <div v-if="editingId" class="modal-overlay" @click.self="cancelEdit">
      <div class="modal-card">
        <div class="modal-header">
          <h3>编辑自定义服务</h3>
          <button class="modal-close" @click="cancelEdit">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div class="modal-body add-form">
          <div class="add-row">
            <input v-model="eName" class="form-input" placeholder="名称" />
            <select v-model="eApiType" class="form-select">
              <option value="openai">OpenAI 兼容</option>
              <option value="anthropic">Anthropic 兼容</option>
            </select>
          </div>
          <div class="add-row">
            <input v-model="eApiBaseUrl" class="form-input" placeholder="API 基础地址" />
          </div>
          <div class="add-row">
            <input v-model="eApiKey" type="password" class="form-input" placeholder="API Key" />
          </div>
          
          <div class="sub-section">
            <div class="sub-section-header">
              <span class="sub-label">包含的模型</span>
              <button class="ghost-btn" :disabled="eFetchingModels" @click="fetchEditModels">
                <svg v-if="eFetchingModels" class="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                <span>自动获取</span>
              </button>
            </div>
            
            <div v-if="eModels.length > 0" class="chip-container">
              <span v-for="m in eModels" :key="m.name" class="chip" @click="toggleEditModelType(m.name)">
                <span class="chip-dot" :class="m.type"></span>
                {{ m.name }}
                <button class="chip-rm" @click.stop="removeEditModel(m.name)">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </span>
            </div>
            
            <div class="inline-add-row">
              <input v-model="eModelName" class="form-input sm" placeholder="模型名" @keydown.enter="addEditModel" />
              <select v-model="eModelType" class="form-select sm">
                <option value="chat">纯文本</option>
                <option value="chatimages">多模态</option>
              </select>
              <button class="secondary-btn" @click="addEditModel">添加</button>
            </div>
          </div>
          
          <div class="add-row">
            <div class="file-upload">
              <input type="file" accept="image/*" class="file-input-hidden" id="e-icon-upload" @change="onEIconUpload" />
              <label for="e-icon-upload" class="file-label">
                <img v-if="eIcon" :src="eIcon" class="preview-icon" />
                <span v-else>更改图标</span>
              </label>
              <button v-if="eIcon" class="clear-icon-btn" @click="eIcon = ''">清除</button>
            </div>
          </div>
          <div v-if="eError" class="error-msg">{{ eError }}</div>
        </div>
        
        <div class="modal-footer">
          <button class="secondary-btn" @click="cancelEdit">取消</button>
          <button class="primary-btn" @click="saveEdit">保存修改</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 36px;
  animation: fadeIn 0.3s ease-out;
  padding-bottom: 24px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #e2e8f0);
  margin: 0;
}

.section-desc {
  font-size: 13px;
  color: var(--text-secondary, #94a3b8);
  margin: 0 0 4px 0;
  line-height: 1.5;
}

.service-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.service-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--bg-secondary, rgba(255,255,255,0.02));
  border: 1px solid var(--border-color, rgba(255,255,255,0.05));
  transition: all 0.2s ease;
}

.service-row:hover {
  background: var(--bg-hover, rgba(255,255,255,0.04));
  border-color: rgba(255,255,255,0.1);
}

.service-row.hidden {
  opacity: 0.5;
  filter: grayscale(0.5);
}

.svc-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.custom-svc-icon {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  object-fit: cover;
}

.first-char-badge {
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.svc-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.svc-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #e2e8f0);
  display: flex;
  align-items: center;
  gap: 8px;
}

.svc-meta {
  font-size: 12px;
  color: var(--text-secondary, #94a3b8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.svc-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.svc-badge.openai { background: rgba(16, 163, 127, 0.15); color: #10a37f; }
.svc-badge.anthropic { background: rgba(217, 119, 6, 0.15); color: #d97706; }

.toggle-switch {
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  flex-shrink: 0;
  outline: none;
}

.toggle-switch.active {
  background: var(--accent, #3b82f6);
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.toggle-switch.active .toggle-thumb {
  transform: translateX(20px);
}

.svc-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-divider {
  width: 1px;
  height: 20px;
  background: var(--border-color, rgba(255,255,255,0.1));
  margin: 0 4px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-secondary, #94a3b8);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.05);
}

.action-btn.edit-btn:hover { color: var(--accent, #60a5fa); background: rgba(59, 130, 246, 0.1); }
.action-btn.delete-btn:hover { color: #f87171; background: rgba(239, 68, 68, 0.1); }

.empty-state {
  font-size: 13px;
  color: var(--text-muted, #64748b);
  padding: 16px;
  text-align: center;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  border: 1px dashed var(--border-color, rgba(255, 255, 255, 0.1));
}

/* Forms */
.form-section {
  padding-top: 16px;
  border-top: 1px solid var(--border-color, rgba(255,255,255,0.05));
}

.add-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(255, 255, 255, 0.01);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--border-color, rgba(255,255,255,0.05));
}

.add-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.form-input, .form-select {
  flex: 1;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  border: 1px solid var(--border-color, rgba(255,255,255,0.1));
  background: var(--bg-primary, #0a0f16);
  color: var(--text-primary, #e2e8f0);
  outline: none;
  transition: all 0.2s ease;
  font-family: inherit;
}

.form-select {
  flex: 0 0 140px;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 32px;
}

.form-input:focus, .form-select:focus {
  border-color: var(--accent, #3b82f6);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.form-input:disabled, .form-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-input.sm, .form-select.sm {
  padding: 8px 12px;
  border-radius: 8px;
}

.actions-row {
  justify-content: space-between;
  margin-top: 4px;
}

.primary-btn {
  background: var(--accent, #3b82f6);
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.primary-btn:hover:not(:disabled) {
  background: #2563eb;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

.secondary-btn {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary, #e2e8f0);
  border: 1px solid var(--border-color, rgba(255,255,255,0.1));
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.secondary-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}

.ghost-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  color: var(--accent, #60a5fa);
  border: none;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s ease;
}

.ghost-btn:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.1);
}

.primary-btn:disabled, .secondary-btn:disabled, .ghost-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* File Upload */
.file-upload { display: flex; align-items: center; gap: 8px; }
.file-input-hidden { display: none; }
.file-label {
  display: flex; align-items: center;
  padding: 8px 14px; border-radius: 10px; font-size: 13px; font-weight: 500;
  cursor: pointer; border: 1px dashed rgba(255, 255, 255, 0.2);
  color: var(--text-secondary, #94a3b8);
  transition: all 0.2s ease;
}
.file-label:hover {
  border-color: var(--accent, #3b82f6);
  color: var(--text-primary, #e2e8f0);
  background: rgba(59, 130, 246, 0.05);
}
.preview-icon { width: 20px; height: 20px; border-radius: 6px; object-fit: cover; }
.clear-icon-btn { background: none; border: none; color: var(--text-muted, #64748b); cursor: pointer; font-size: 12px; }
.clear-icon-btn:hover { color: #f87171; }

.error-msg { font-size: 13px; color: #f87171; padding-left: 4px; }

/* Sub Section (Models) */
.sub-section {
  background: var(--bg-primary, #0a0f16);
  border: 1px solid var(--border-color, rgba(255,255,255,0.05));
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 4px;
}

.sub-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sub-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary, #94a3b8);
}

.chip-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 8px;
  cursor: pointer;
  background: rgba(255,255,255,0.03);
  color: var(--text-primary, #e2e8f0);
  border: 1px solid rgba(255,255,255,0.1);
  transition: all 0.2s ease;
}

.chip:hover {
  border-color: var(--accent, #3b82f6);
  background: rgba(59, 130, 246, 0.05);
}

.chip-dot { width: 6px; height: 6px; border-radius: 50%; background: #64748b; }
.chip-dot.chatimages { background: #a78bfa; box-shadow: 0 0 6px rgba(167, 139, 250, 0.5); }

.chip-rm {
  display: flex; align-items: center; justify-content: center;
  background: none; border: none; color: var(--text-muted, #64748b);
  cursor: pointer; padding: 2px; border-radius: 4px; margin-left: 2px;
}
.chip-rm:hover { color: #f87171; background: rgba(239, 68, 68, 0.1); }

.inline-add-row {
  display: flex;
  gap: 8px;
  align-items: center;
  border-top: 1px dashed rgba(255,255,255,0.1);
  padding-top: 12px;
}

/* Modals */
.modal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  animation: fadeIn 0.2s ease-out;
}

.modal-card {
  background: var(--bg-secondary, #131b27);
  border: 1px solid var(--border-color, rgba(255,255,255,0.1));
  border-radius: 16px;
  width: 520px;
  max-width: 90vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.05);
}

.modal-header h3 { font-size: 18px; font-weight: 600; margin: 0; }

.modal-close {
  background: none; border: none; color: var(--text-muted, #64748b);
  cursor: pointer; padding: 6px; border-radius: 8px; display: flex;
  transition: all 0.2s ease;
}

.modal-close:hover { background: rgba(255,255,255,0.05); color: var(--text-primary); }

.modal-body {
  padding: 24px;
  overflow-y: auto;
  border: none;
  background: transparent;
}

.modal-footer {
  display: flex; justify-content: flex-end; gap: 12px;
  padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.05);
  background: rgba(0,0,0,0.2);
}

@keyframes spin { to { transform: rotate(360deg); } }
.spinner { animation: spin 1s linear infinite; }
</style>
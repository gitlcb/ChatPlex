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
  <div class="sidebar-tab">
    <!-- Built-in Services -->
    <div class="setting-group">
      <label class="setting-label">内置服务</label>
      <div class="service-list">
        <div v-for="svc in builtInServices" :key="svc.id" class="service-row" :class="{ hidden: isHidden(svc.id) }">
          <span class="svc-icon">{{ svc.icon }}</span>
          <span class="svc-info">
            <span class="svc-name">{{ svc.name }}</span>
            <span class="svc-meta">{{ getCategoryLabel(svc.category) }} · {{ getRegionLabel(svc.region) }}</span>
          </span>
          <button class="toggle-btn" :class="{ off: isHidden(svc.id) }" @click="toggleBuiltIn(svc.id)" :title="isHidden(svc.id) ? '已隐藏' : '显示中'">
            <span class="toggle-knob"></span>
          </button>
        </div>
      </div>
    </div>

    <!-- Custom Services List -->
    <div class="setting-group">
      <label class="setting-label">自定义服务</label>
      <div v-if="customServices.length === 0" class="empty-hint">暂无，请在下方添加</div>
      <div class="service-list">
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
          <button class="toggle-btn" :class="{ off: svc.hidden }" @click="toggleCustom(svc.id)" :title="svc.hidden ? '已隐藏' : '显示中'">
            <span class="toggle-knob"></span>
          </button>
          <button class="edit-btn" @click="startEdit(svc)" title="编辑">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8.5 1.5l2 2-7 7H1.5v-2l7-7z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button class="delete-btn" @click="removeCustom(svc.id)" title="删除">
            <svg width="12" height="12" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- ===== Edit Custom AI Modal ===== -->
    <div v-if="editingId" class="modal-overlay" @click.self="cancelEdit">
      <div class="modal-content">
        <div class="modal-header">
          <span class="modal-title">编辑自定义 AI</span>
          <button class="modal-close" @click="cancelEdit">✕</button>
        </div>
        <div class="modal-body">
          <div class="add-row">
            <input v-model="eName" class="add-input" placeholder="名称" />
            <select v-model="eApiType" class="add-select">
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
          </div>
          <div class="add-row">
            <input v-model="eApiBaseUrl" class="add-input" placeholder="API 基础地址" />
          </div>
          <div class="add-row">
            <input v-model="eApiKey" class="add-input" placeholder="API Key (可选)" />
          </div>
          <div class="models-section">
            <div class="models-header">
              <span class="section-sub-label">模型列表</span>
              <button class="sm-btn" :disabled="eFetchingModels" @click="fetchEditModels">
                <svg v-if="eFetchingModels" class="spinner" width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                <span>自动获取</span>
              </button>
            </div>
            <div v-if="eModels.length > 0" class="model-chips">
              <span v-for="m in eModels" :key="m.name" class="model-chip" @click="toggleEditModelType(m.name)" :title="m.type === 'chat' ? '点击切换为多模态' : '点击切换为对话'">
                <span class="mc-dot" :class="m.type"></span>
                {{ m.name }}
                <span v-if="m.type === 'chatimages'" class="mc-badge">多模态</span>
                <button class="mc-rm" @click.stop="removeEditModel(m.name)">✕</button>
              </span>
            </div>
            <div v-if="eModels.length > 0" class="model-hint">点击模型可标记为多模态</div>
            <div class="add-model-row">
              <input v-model="eModelName" class="add-input" placeholder="模型名" @keydown.enter="addEditModel" />
              <select v-model="eModelType" class="add-select">
                <option value="chat">对话</option>
                <option value="chatimages">多模态</option>
              </select>
              <button class="sm-btn" @click="addEditModel">添加模型</button>
            </div>
          </div>
          <div class="add-row">
            <div class="file-upload">
              <input type="file" accept="image/*" class="file-input-hidden" id="e-icon-upload" @change="onEIconUpload" />
              <label for="e-icon-upload" class="file-label">
                <img v-if="eIcon" :src="eIcon" class="preview-icon" />
                <span v-else>图标(可选)</span>
              </label>
              <button v-if="eIcon" class="clear-icon-btn" @click="eIcon = ''">✕</button>
            </div>
          </div>
          <div v-if="eError" class="add-error">{{ eError }}</div>
        </div>
        <div class="modal-footer">
          <button class="add-btn" style="background: #334155;" @click="cancelEdit">取消</button>
          <button class="add-btn" @click="saveEdit">保存</button>
        </div>
      </div>
    </div>

    <!-- ===== Add Website ===== -->
    <div class="setting-group">
      <label class="setting-label">添加自定义网站</label>
      <div class="add-form">
        <div class="add-row">
          <input v-model="wName" class="add-input" placeholder="名称" :disabled="wAdding" />
          <select v-model="wRegion" class="add-select" :disabled="wAdding">
            <option value="domestic">国内</option>
            <option value="international">国际</option>
          </select>
          <select v-model="wCategory" class="add-select" :disabled="wAdding">
            <option value="chat">对话</option>
            <option value="visual">视觉</option>
          </select>
        </div>
        <div class="add-row">
          <input v-model="wUrl" class="add-input" placeholder="网址 https://..." :disabled="wAdding" />
        </div>
        <div class="add-row">
          <div class="file-upload">
            <input type="file" accept="image/*" class="file-input-hidden" id="w-icon-upload" :disabled="wAdding" @change="onWIconUpload" />
            <label for="w-icon-upload" class="file-label">
              <img v-if="wIcon" :src="wIcon" class="preview-icon" />
              <span v-else>图标(可选)</span>
            </label>
            <button v-if="wIcon" class="clear-icon-btn" @click="wIcon = ''">✕</button>
          </div>
          <button class="add-btn" :disabled="wAdding" @click="addWebsite">{{ wAdding ? '...' : '添加' }}</button>
        </div>
        <div v-if="wError" class="add-error">{{ wError }}</div>
      </div>
    </div>

    <!-- ===== Add Custom AI ===== -->
    <div class="setting-group">
      <label class="setting-label">添加自定义 AI</label>
      <div class="add-form">
        <div class="add-row">
          <input v-model="aName" class="add-input" placeholder="名称" :disabled="aAdding" />
          <select v-model="aApiType" class="add-select" :disabled="aAdding">
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
          </select>
        </div>
        <div class="add-row">
          <input v-model="aApiBaseUrl" class="add-input" placeholder="API 基础地址 https://api.example.com" :disabled="aAdding" />
        </div>
        <div class="add-row">
          <input v-model="aApiKey" class="add-input" placeholder="API Key (可选)" :disabled="aAdding" />
        </div>

        <!-- Models -->
        <div class="models-section">
          <div class="models-header">
            <span class="section-sub-label">模型列表</span>
            <button class="sm-btn" :disabled="aFetchingModels || aAdding" @click="fetchModels">
              <svg v-if="aFetchingModels" class="spinner" width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              <span>自动获取</span>
            </button>
          </div>
          <div v-if="aModels.length > 0" class="model-chips">
            <span v-for="m in aModels" :key="m.name" class="model-chip" @click="toggleModelType(m.name)" :title="m.type === 'chat' ? '点击切换为多模态' : '点击切换为对话'">
              <span class="mc-dot" :class="m.type"></span>
              {{ m.name }}
              <span v-if="m.type === 'chatimages'" class="mc-badge">多模态</span>
              <button class="mc-rm" @click.stop="removeModel(m.name)">✕</button>
            </span>
          </div>
          <div v-if="aModels.length > 0" class="model-hint">点击模型可标记为多模态</div>
          <div class="add-model-row">
            <input v-model="aModelName" class="add-input" placeholder="模型名" @keydown.enter="addModel" />
            <select v-model="aModelType" class="add-select">
              <option value="chat">对话</option>
              <option value="chatimages">多模态</option>
            </select>
            <button class="sm-btn" @click="addModel">添加模型</button>
          </div>
        </div>

        <div class="add-row">
          <div class="file-upload">
            <input type="file" accept="image/*" class="file-input-hidden" id="a-icon-upload" :disabled="aAdding" @change="onAIconUpload" />
            <label for="a-icon-upload" class="file-label">
              <img v-if="aIcon" :src="aIcon" class="preview-icon" />
              <span v-else>图标(可选)</span>
            </label>
            <button v-if="aIcon" class="clear-icon-btn" @click="aIcon = ''">✕</button>
          </div>
          <button class="add-btn" :disabled="aAdding" @click="addAI">{{ aAdding ? '...' : '添加' }}</button>
        </div>
        <div v-if="aError" class="add-error">{{ aError }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar-tab { display: flex; flex-direction: column; gap: 24px; }
.setting-group { display: flex; flex-direction: column; gap: 10px; }
.setting-label { font-size: 13px; font-weight: 600; color: var(--text-primary, #e2e8f0); }
.section-sub-label { font-size: 12px; font-weight: 600; color: var(--text-secondary, #94a3b8); }

.empty-hint { font-size: 12px; color: var(--text-muted, #475569); padding: 8px 0; }

.service-list { display: flex; flex-direction: column; gap: 6px; }
.service-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 10px;
  background: var(--bg-secondary, #131b27); border: 1px solid var(--border-color, #1a2435);
  transition: all 0.15s;
}
.service-row:hover { border-color: rgba(59,130,246,0.3); }
.service-row.hidden { opacity: 0.45; }
.service-row.custom { padding-right: 10px; }

.svc-icon { font-size: 18px; flex-shrink: 0; }
.custom-svc-icon { width: 22px; height: 22px; border-radius: 4px; object-fit: cover; }
.first-char-badge {
  font-size: 11px; font-weight: 700; color: #fff;
  width: 22px; height: 22px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center; line-height: 1;
}

.svc-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.svc-name { font-size: 13px; font-weight: 500; color: var(--text-primary, #e2e8f0); display: flex; align-items: center; gap: 6px; }
.svc-meta {
  font-size: 11px; color: var(--text-muted, #475569);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.svc-badge {
  font-size: 10px; padding: 1px 6px; border-radius: 4px; font-weight: 500;
}
.svc-badge.openai { background: rgba(16,163,127,0.15); color: #10a37f; }
.svc-badge.anthropic { background: rgba(217,119,6,0.15); color: #d97706; }

.toggle-btn {
  position: relative; width: 40px; height: 22px; border-radius: 11px;
  border: none; cursor: pointer; background: var(--accent, #3b82f6); transition: background 0.2s; flex-shrink: 0;
}
.toggle-btn.off { background: #334155; }
.toggle-knob {
  position: absolute; top: 2px; right: 2px; width: 18px; height: 18px;
  border-radius: 50%; background: #fff; transition: transform 0.2s;
}
.toggle-btn.off .toggle-knob { transform: translateX(-18px); }

.delete-btn {
  background: none; border: none; color: var(--text-muted, #475569);
  cursor: pointer; padding: 4px; border-radius: 4px; display: flex;
  transition: all 0.15s; flex-shrink: 0;
}
.delete-btn:hover { background: rgba(239,68,68,0.15); color: #f87171; }

.edit-btn {
  background: none; border: none; color: var(--text-muted, #475569);
  cursor: pointer; padding: 4px; border-radius: 4px; display: flex;
  transition: all 0.15s; flex-shrink: 0;
}
.edit-btn:hover { background: rgba(59,130,246,0.15); color: #60a5fa; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
}
.modal-content {
  background: var(--bg-primary, #0a0f16);
  border: 1px solid var(--border-color, #1a2435);
  border-radius: 14px; width: 480px; max-height: 80vh;
  display: flex; flex-direction: column; overflow: hidden;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px 12px; border-bottom: 1px solid var(--border-color, #1a2435);
}
.modal-title { font-size: 15px; font-weight: 600; color: var(--text-primary, #e2e8f0); }
.modal-close {
  background: none; border: none; color: var(--text-muted, #475569);
  cursor: pointer; font-size: 14px; padding: 4px 8px; border-radius: 6px;
}
.modal-close:hover { background: rgba(239,68,68,0.15); color: #f87171; }
.modal-body {
  padding: 16px 20px; display: flex; flex-direction: column; gap: 8px;
  overflow-y: auto; flex: 1;
}
.modal-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 12px 20px; border-top: 1px solid var(--border-color, #1a2435);
}

/* Add Form */
.add-form { display: flex; flex-direction: column; gap: 6px; }
.add-row { display: flex; gap: 8px; align-items: center; }
.add-input {
  flex: 1; padding: 7px 10px; border-radius: 8px; font-size: 13px;
  border: 1px solid var(--border-color, #1a2435);
  background: var(--bg-secondary, #131b27); color: var(--text-primary, #e2e8f0);
  outline: none; transition: border-color 0.15s;
}
.add-input:focus { border-color: var(--accent, #3b82f6); }
.add-input:disabled { opacity: 0.5; }

.file-upload { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
.file-input-hidden { display: none; }
.file-label {
  display: flex; align-items: center; justify-content: center; gap: 4px;
  padding: 6px 10px; border-radius: 8px; font-size: 12px; cursor: pointer;
  border: 1px dashed var(--border-color, #1a2435); color: var(--text-secondary, #94a3b8);
  transition: all 0.15s;
}
.file-label:hover { border-color: var(--accent, #3b82f6); color: var(--text-primary, #e2e8f0); }
.preview-icon { width: 18px; height: 18px; border-radius: 4px; object-fit: cover; }
.clear-icon-btn { background: none; border: none; color: var(--text-muted, #475569); cursor: pointer; font-size: 10px; }
.clear-icon-btn:hover { color: #f87171; }

.add-select {
  padding: 6px 8px; border-radius: 8px; font-size: 12px;
  border: 1px solid var(--border-color, #1a2435);
  background: var(--bg-secondary, #131b27); color: var(--text-primary, #e2e8f0);
  outline: none; cursor: pointer;
}
.add-select:focus { border-color: var(--accent, #3b82f6); }

.add-btn, .sm-btn {
  display: flex; align-items: center; gap: 4px; padding: 7px 14px;
  border-radius: 8px; border: none; cursor: pointer; transition: all 0.15s;
  font-size: 13px; font-weight: 500;
}
.add-btn { background: var(--accent, #3b82f6); color: #fff; flex-shrink: 0; }
.add-btn:hover:not(:disabled) { filter: brightness(1.15); }
.add-btn:disabled { opacity: 0.6; cursor: wait; }
.sm-btn {
  background: var(--bg-secondary, #131b27); color: var(--text-secondary, #94a3b8);
  border: 1px solid var(--border-color, #1a2435); padding: 5px 10px; font-size: 12px;
}
.sm-btn:hover:not(:disabled) { border-color: var(--accent, #3b82f6); color: var(--text-primary); }

.add-error { font-size: 12px; color: #f87171; }

/* Models */
.models-section {
  background: var(--bg-secondary, #131b27); border: 1px solid var(--border-color, #1a2435);
  border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 8px;
}
.models-header { display: flex; justify-content: space-between; align-items: center; }
.model-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.model-chip {
  display: inline-flex; align-items: center; gap: 4px; font-size: 11px;
  padding: 3px 8px; border-radius: 6px; cursor: pointer;
  background: var(--bg-primary, #0a0f16); color: var(--text-secondary, #94a3b8);
  border: 1px solid var(--border-color, #1a2435);
  transition: border-color 0.15s;
}
.model-chip:hover { border-color: var(--accent, #3b82f6); }
.mc-dot { width: 6px; height: 6px; border-radius: 50%; background: #475569; flex-shrink: 0; }
.mc-dot.chatimages { background: #8b5cf6; }
.mc-badge { font-size: 9px; background: rgba(139,92,246,0.15); color: #a78bfa; padding: 0 4px; border-radius: 3px; }
.mc-rm { background: none; border: none; color: var(--text-muted, #475569); cursor: pointer; font-size: 9px; padding: 0; }
.mc-rm:hover { color: #f87171; }
.model-hint { font-size: 11px; color: var(--text-muted, #475569); font-style: italic; }
.add-model-row { display: flex; gap: 6px; align-items: center; }
.add-model-row .add-input { flex: 1; font-size: 12px; padding: 5px 8px; }

@keyframes spin { to { transform: rotate(360deg); } }
.spinner { animation: spin 0.8s linear infinite; }
</style>

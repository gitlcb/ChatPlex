import { defineStore } from 'pinia'
import { getCurrentWindow } from '@tauri-apps/api/window'
import type { CustomService, CustomModel } from '../types/services'
import { PALETTE } from '../types/services'

export const DEFAULT_API_KEY = 'sk-2CkseLsdG29bdNQyFiy9keTs7AHylOGgbsbQIUZ55Bhb9NbX'
export const DEFAULT_API_URL = 'https://api.snownk.xyz/v1'

/* ===== Types ===== */
export interface ModelItem { name: string; type: 'chat' | 'chatimages' }

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  image?: string
  streaming?: boolean
  reasoning?: string
}

export interface ChatSession {
  id: string
  serviceId: string
  title: string
  model: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

export type Theme = 'light' | 'dark' | 'system'

/* ===== Store ===== */
export const useAppStore = defineStore('app', {
  state: () => ({
    // Chat sessions
    sessions: [] as ChatSession[],
    activeSessionId: null as string | null,
    selectedModel: '',
    modelList: [] as ModelItem[],
    configError: '',
    loading: false,

    // Per-service state (keyed by serviceId)
    serviceStates: {} as Record<string, { selectedModel: string; activeSessionId: string | null }>,

    // UI state
    showModelPicker: false,
    showReasoning: {} as Record<number, boolean>,
    showSearch: false,
    searchQuery: '',
    searchMatchIndex: 0,

    // Theme
    theme: 'system' as Theme,

    // Sidebar service management
    hiddenServiceIds: [] as string[],
    customServices: [] as CustomService[],
  }),

  getters: {
    activeSession(): ChatSession | undefined {
      return this.sessions.find(s => s.id === this.activeSessionId)
    },
    messages(): ChatMessage[] {
      return this.activeSession?.messages || []
    },
    isMultimodal(): boolean {
      return this.modelList.find(m => m.name === this.selectedModel)?.type === 'chatimages'
    },
    sortedSessions(): ChatSession[] {
      return [...this.sessions].sort((a, b) => b.updatedAt - a.updatedAt)
    },
    searchMatchIds(): string[] {
      if (!this.searchQuery || !this.activeSession) return []
      const q = this.searchQuery.toLowerCase()
      return this.activeSession.messages
        .filter(m => m.content.toLowerCase().includes(q))
        .map((_, i) => String(i))
    },
  },

  actions: {
    /* === Theme === */
    applyTheme() {
      let t = this.theme
      if (t === 'system') {
        t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      const isDark = t === 'dark'
      document.documentElement.classList.toggle('dark', isDark)
      document.documentElement.dataset.theme = t
      document.documentElement.style.colorScheme = t
      document.body?.classList.toggle('dark', isDark)
      if (document.body) {
        document.body.dataset.theme = t
        document.body.style.colorScheme = t
      }
      getCurrentWindow().setTheme(t).catch(() => {})
      window.dispatchEvent(new CustomEvent('chatplex-theme-changed', { detail: t }))
    },

    setTheme(t: Theme) {
      this.theme = t
      this.applyTheme()
      this.saveSettings()
    },

    /* === Settings Persistence === */
    async loadSettings() {
      try {
        const raw = localStorage.getItem('chatplex_settings')
        if (raw) {
          const s = JSON.parse(raw)
          this.theme = s.theme || 'system'
        }
      } catch { /* */ }
      this.applyTheme()
      this.loadServicePrefs()
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.theme === 'system') this.applyTheme()
      })
    },

    saveSettings() {
      localStorage.setItem('chatplex_settings', JSON.stringify({
        theme: this.theme,
      }))
      this.saveServicePrefs()
    },

    /* === Service Management === */
    loadServicePrefs() {
      try {
        const raw = localStorage.getItem('chatplex_services')
        if (raw) {
          const prefs = JSON.parse(raw)
          this.hiddenServiceIds = prefs.hiddenServiceIds || []
          this.customServices = prefs.customServices || []
        }
      } catch { /* */ }
    },

    saveServicePrefs() {
      localStorage.setItem('chatplex_services', JSON.stringify({
        hiddenServiceIds: this.hiddenServiceIds,
        customServices: this.customServices,
      }))
    },

    toggleServiceVisibility(id: string) {
      const idx = this.hiddenServiceIds.indexOf(id)
      if (idx >= 0) {
        this.hiddenServiceIds.splice(idx, 1)
      } else {
        this.hiddenServiceIds.push(id)
      }
      this.saveServicePrefs()
    },

    addCustomService(opts: {
      name: string
      url: string
      region: 'domestic' | 'international'
      category: 'chat' | 'visual'
      customIcon?: string
      apiType?: 'openai' | 'anthropic'
      apiBaseUrl?: string
      apiKey?: string
      models?: CustomModel[]
    }) {
      const isAiChat = !!(opts.apiType && opts.apiBaseUrl)
      const svc: CustomService = {
        id: `custom_${Date.now()}`,
        name: opts.name,
        url: isAiChat ? opts.apiBaseUrl!.replace(/\/+$/, '') : opts.url,
        icon: '🌐',
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        description: opts.name,
        region: opts.region,
        category: opts.category,
        type: isAiChat ? 'chat' : undefined,
        customIcon: opts.customIcon,
        hidden: false,
        apiType: opts.apiType,
        apiBaseUrl: opts.apiBaseUrl?.replace(/\/+$/, ''),
        apiKey: opts.apiKey,
        models: opts.models,
      }
      this.customServices.push(svc)
      this.saveServicePrefs()
    },

    removeCustomService(id: string) {
      const idx = this.customServices.findIndex(s => s.id === id)
      if (idx >= 0) this.customServices.splice(idx, 1)
      this.saveServicePrefs()
    },

    updateCustomService(id: string, opts: {
      name?: string
      url?: string
      region?: 'domestic' | 'international'
      category?: 'chat' | 'visual'
      customIcon?: string
      apiType?: 'openai' | 'anthropic'
      apiBaseUrl?: string
      apiKey?: string
      models?: CustomModel[]
    }) {
      const svc = this.customServices.find(s => s.id === id)
      if (!svc) return
      if (opts.name !== undefined) { svc.name = opts.name; svc.description = opts.name }
      if (opts.url !== undefined) svc.url = opts.url
      if (opts.region !== undefined) svc.region = opts.region
      if (opts.category !== undefined) svc.category = opts.category
      if (opts.customIcon !== undefined) svc.customIcon = opts.customIcon
      if (opts.apiType !== undefined) svc.apiType = opts.apiType
      if (opts.apiBaseUrl !== undefined) svc.apiBaseUrl = opts.apiBaseUrl.replace(/\/+$/, '')
      if (opts.apiKey !== undefined) svc.apiKey = opts.apiKey
      if (opts.models !== undefined) svc.models = opts.models
      this.saveServicePrefs()
    },

    toggleCustomServiceVisibility(id: string) {
      const svc = this.customServices.find(s => s.id === id)
      if (svc) {
        svc.hidden = !svc.hidden
        this.saveServicePrefs()
      }
    },

    addCustomModel(serviceId: string, model: CustomModel) {
      const svc = this.customServices.find(s => s.id === serviceId)
      if (!svc) return
      if (!svc.models) svc.models = []
      if (!svc.models.find(m => m.name === model.name)) {
        svc.models.push(model)
        this.saveServicePrefs()
      }
    },

    removeCustomModel(serviceId: string, modelName: string) {
      const svc = this.customServices.find(s => s.id === serviceId)
      if (!svc || !svc.models) return
      svc.models = svc.models.filter(m => m.name !== modelName)
      this.saveServicePrefs()
    },

    updateCustomModels(serviceId: string, models: CustomModel[]) {
      const svc = this.customServices.find(s => s.id === serviceId)
      if (!svc) return
      svc.models = models
      this.saveServicePrefs()
    },

    /* === Session Persistence === */
    loadSessions() {
      try {
        const raw = localStorage.getItem('chatplex_sessions')
        if (raw) this.sessions = JSON.parse(raw)
        const statesRaw = localStorage.getItem('chatplex_service_states')
        if (statesRaw) this.serviceStates = JSON.parse(statesRaw)
      } catch { /* */ }
    },

    persistSessions() {
      try {
        const stripped = this.sessions.map(s => ({
          ...s,
          messages: s.messages.map(m => ({ ...m, image: undefined, streaming: undefined })),
        }))
        localStorage.setItem('chatplex_sessions', JSON.stringify(stripped))
        localStorage.setItem('chatplex_service_states', JSON.stringify(this.serviceStates))
      } catch { /* quota exceeded */ }
    },

    /** Save current service state before switching */
    saveServiceState(serviceId: string) {
      if (!serviceId) return
      this.serviceStates[serviceId] = {
        selectedModel: this.selectedModel,
        activeSessionId: this.activeSessionId,
      }
      this.persistSessions()
    },

    /** Restore service state after switching */
    restoreServiceState(serviceId: string) {
      const st = this.serviceStates[serviceId]
      if (st) {
        this.selectedModel = st.selectedModel || ''
        this.activeSessionId = st.activeSessionId || null
      } else {
        this.selectedModel = ''
        this.activeSessionId = null
      }
    },

    /** Get sessions for a specific service */
    getServiceSessions(serviceId: string) {
      return this.sessions.filter(s => s.serviceId === serviceId)
    },

    /** Get sorted sessions for a specific service */
    getSortedServiceSessions(serviceId: string) {
      return this.getServiceSessions(serviceId).sort((a, b) => b.updatedAt - a.updatedAt)
    },

    /* === Session Management === */
    createNewSession(serviceId?: string) {
      const session: ChatSession = {
        id: crypto.randomUUID(),
        serviceId: serviceId || '',
        title: '新对话',
        model: this.selectedModel,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      this.sessions.push(session)
      this.activeSessionId = session.id
      this.persistSessions()
    },

    switchSession(id: string) {
      if (this.loading || id === this.activeSessionId) return
      this.activeSessionId = id
      const s = this.activeSession
      if (s) this.selectedModel = s.model
      this.persistSessions()
    },

    deleteSession(id: string) {
      const idx = this.sessions.findIndex(s => s.id === id)
      if (idx === -1) return
      this.sessions.splice(idx, 1)
      if (this.activeSessionId === id) {
        this.activeSessionId = this.sessions.length > 0 ? this.sessions[Math.max(0, idx - 1)].id : null
      }
      this.persistSessions()
    },

    renameSession(id: string, title: string) {
      const s = this.sessions.find(s => s.id === id)
      if (s && title.trim()) s.title = title.trim()
      this.persistSessions()
    },

    selectModel(name: string) {
      this.selectedModel = name
      this.showModelPicker = false
      if (this.activeSession) this.activeSession.model = name
    },

    /* === Message Operations === */
    addMessage(sessionId: string, msg: ChatMessage) {
      const s = this.sessions.find(s => s.id === sessionId)
      if (s) s.messages.push(msg)
    },

    removeMessagesFrom(sessionId: string, fromIndex: number) {
      const s = this.sessions.find(s => s.id === sessionId)
      if (s) s.messages.splice(fromIndex)
    },

    /* === Search === */
    toggleSearch() {
      this.showSearch = !this.showSearch
      if (!this.showSearch) {
        this.searchQuery = ''
        this.searchMatchIndex = 0
      }
    },

    nextSearchMatch() {
      if (this.searchMatchIds.length === 0) return
      this.searchMatchIndex = (this.searchMatchIndex + 1) % this.searchMatchIds.length
    },

    prevSearchMatch() {
      if (this.searchMatchIds.length === 0) return
      this.searchMatchIndex = (this.searchMatchIndex - 1 + this.searchMatchIds.length) % this.searchMatchIds.length
    },

    /* === Reset === */
    resetChat() {
      this.selectedModel = ''
      this.modelList = []
      this.configError = ''
      this.showModelPicker = false
      this.activeSessionId = null
    },
  },
})

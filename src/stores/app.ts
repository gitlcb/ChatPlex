import { defineStore } from 'pinia'

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

    // UI state
    showModelPicker: false,
    showReasoning: {} as Record<number, boolean>,
    showSettings: false,
    showSearch: false,
    searchQuery: '',
    searchMatchIndex: 0,

    // Theme
    theme: 'system' as Theme,

    // Custom API config (empty = use public)
    customApiKey: '',
    customApiUrl: '',
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
    effectiveApiKey(): string {
      return this.customApiKey || 'sk-2CkseLsdG29bdNQyFiy9keTs7AHylOGgbsbQIUZ55Bhb9NbX'
    },
    effectiveApiUrl(): string {
      return this.customApiUrl || 'https://api.snownk.xyz/v1'
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
      document.documentElement.classList.toggle('dark', t === 'dark')
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
          this.customApiKey = s.customApiKey || ''
          this.customApiUrl = s.customApiUrl || ''
        }
      } catch { /* */ }
      this.applyTheme()
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.theme === 'system') this.applyTheme()
      })
    },

    saveSettings() {
      localStorage.setItem('chatplex_settings', JSON.stringify({
        theme: this.theme,
        customApiKey: this.customApiKey,
        customApiUrl: this.customApiUrl,
      }))
    },

    /* === Session Persistence === */
    loadSessions() {
      try {
        const raw = localStorage.getItem('chatplex_sessions')
        if (raw) this.sessions = JSON.parse(raw)
        this.activeSessionId = localStorage.getItem('chatplex_active_session') || null
        if (this.activeSession) this.selectedModel = this.activeSession.model
      } catch { /* */ }
    },

    persistSessions() {
      try {
        const stripped = this.sessions.map(s => ({
          ...s,
          messages: s.messages.map(m => ({ ...m, image: undefined, streaming: undefined })),
        }))
        localStorage.setItem('chatplex_sessions', JSON.stringify(stripped))
        if (this.activeSessionId) localStorage.setItem('chatplex_active_session', this.activeSessionId)
      } catch { /* quota exceeded */ }
    },

    /* === Session Management === */
    createNewSession() {
      const session: ChatSession = {
        id: crypto.randomUUID(),
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
      localStorage.setItem('chatplex_active_session', id)
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
      this.sessions = []
      this.activeSessionId = null
      this.configError = ''
      this.showModelPicker = false
    },
  },
})

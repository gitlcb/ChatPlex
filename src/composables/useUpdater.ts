import { ref } from 'vue'
import { fetch as tauriFetch } from '@tauri-apps/plugin-http'
import { getVersion } from '@tauri-apps/api/app'

const REPO = 'gitlcb/ChatPlex'
const RELEASES_API = `https://api.github.com/repos/${REPO}/releases/latest`
const SKIPPED_KEY = 'chatplex_update_skipped'

export interface ReleaseAsset {
  name: string
  browser_download_url: string
  size: number
}

export interface ReleaseInfo {
  version: string
  tag: string
  name: string
  notes: string
  publishedAt: string
  htmlUrl: string
  assets: ReleaseAsset[]
}

export type UpdateStatus = 'idle' | 'checking' | 'available' | 'latest' | 'error'

const currentVersion = ref<string>('')
const status = ref<UpdateStatus>('idle')
const errorMessage = ref<string>('')
const release = ref<ReleaseInfo | null>(null)
const showModal = ref(false)
const lastCheckedAt = ref<number | null>(null)

function normalizeVersion(v: string): string {
  return v.replace(/^v/i, '').trim()
}

function compareVersions(a: string, b: string): number {
  const pa = normalizeVersion(a).split(/[.-]/).map(s => /^\d+$/.test(s) ? parseInt(s, 10) : s)
  const pb = normalizeVersion(b).split(/[.-]/).map(s => /^\d+$/.test(s) ? parseInt(s, 10) : s)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const x = pa[i] ?? 0
    const y = pb[i] ?? 0
    if (typeof x === 'number' && typeof y === 'number') {
      if (x !== y) return x - y
    } else {
      const sx = String(x), sy = String(y)
      if (sx !== sy) return sx < sy ? -1 : 1
    }
  }
  return 0
}

function isSkipped(version: string): boolean {
  try {
    return localStorage.getItem(SKIPPED_KEY) === version
  } catch { return false }
}

function skipVersion(version: string) {
  try { localStorage.setItem(SKIPPED_KEY, version) } catch { /* ignore */ }
}

function clearSkip() {
  try { localStorage.removeItem(SKIPPED_KEY) } catch { /* ignore */ }
}

async function ensureCurrentVersion(): Promise<string> {
  if (currentVersion.value) return currentVersion.value
  try {
    currentVersion.value = await getVersion()
  } catch {
    currentVersion.value = '0.0.0'
  }
  return currentVersion.value
}

async function checkForUpdate(opts: { silent?: boolean } = {}): Promise<void> {
  if (status.value === 'checking') return
  status.value = 'checking'
  errorMessage.value = ''

  try {
    const cur = await ensureCurrentVersion()
    const res = await tauriFetch(RELEASES_API, {
      method: 'GET',
      headers: { 'Accept': 'application/vnd.github+json' },
    })
    if (!res.ok) {
      status.value = 'error'
      errorMessage.value = `GitHub API ${res.status}`
      return
    }
    const data: any = await res.json()
    const info: ReleaseInfo = {
      version: normalizeVersion(data.tag_name || ''),
      tag: data.tag_name || '',
      name: data.name || data.tag_name || '',
      notes: data.body || '',
      publishedAt: data.published_at || '',
      htmlUrl: data.html_url || '',
      assets: Array.isArray(data.assets) ? data.assets.map((a: any) => ({
        name: a.name,
        browser_download_url: a.browser_download_url,
        size: a.size,
      })) : [],
    }
    release.value = info
    lastCheckedAt.value = Date.now()

    if (compareVersions(info.version, cur) > 0) {
      status.value = 'available'
      if (!(opts.silent && isSkipped(info.version))) showModal.value = true
    } else {
      status.value = 'latest'
    }
  } catch (e) {
    status.value = 'error'
    errorMessage.value = e instanceof Error ? e.message : String(e)
  }
}

function dismissModal() { showModal.value = false }

function openModalIfAvailable() {
  if (status.value === 'available' && release.value) showModal.value = true
}

export function useUpdater() {
  return {
    currentVersion,
    status,
    errorMessage,
    release,
    showModal,
    lastCheckedAt,
    checkForUpdate,
    skipVersion,
    clearSkip,
    dismissModal,
    openModalIfAvailable,
    ensureCurrentVersion,
  }
}

import { ref } from 'vue'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'

type ServiceDownloadStatus = 'requested' | 'selected' | 'finished' | 'canceled' | 'failed'
type DownloadTone = 'info' | 'success' | 'warning' | 'error'

interface ServiceDownloadPayload {
  status: ServiceDownloadStatus
  url: string
  file_name?: string | null
  path?: string | null
  success?: boolean | null
  message?: string | null
}

export interface DownloadNotification {
  id: number
  url: string
  fileName: string
  path: string
  title: string
  detail: string
  tone: DownloadTone
}

export const downloadNotifications = ref<DownloadNotification[]>([])

let nextId = 1
let unlisten: UnlistenFn | null = null
const activeIds = new Map<string, number>()
const timers = new Map<number, ReturnType<typeof setTimeout>>()

function fileNameFromUrl(url: string) {
  try {
    const parsed = new URL(url)
    const segment = parsed.pathname.split('/').filter(Boolean).pop()
    return segment ? decodeURIComponent(segment) : 'download'
  } catch {
    return 'download'
  }
}

function displayPath(path?: string | null) {
  if (!path) return ''
  const normalized = path.split('\\').join('/')
  const parts = normalized.split('/').filter(Boolean)
  return parts.length > 2 ? `.../${parts.slice(-2).join('/')}` : path
}

function clearTimer(id: number) {
  const timer = timers.get(id)
  if (timer) clearTimeout(timer)
  timers.delete(id)
}

function scheduleDismiss(id: number, delay = 5000) {
  clearTimer(id)
  timers.set(id, setTimeout(() => dismissDownloadNotification(id), delay))
}

function getNotificationId(payload: ServiceDownloadPayload) {
  const existing = activeIds.get(payload.url)
  if (existing) return existing

  const id = nextId++
  activeIds.set(payload.url, id)
  return id
}

function upsertNotification(payload: ServiceDownloadPayload) {
  const id = getNotificationId(payload)
  const fileName = payload.file_name || fileNameFromUrl(payload.url)
  const path = payload.path || ''
  let tone: DownloadTone = 'info'
  let title = '准备下载'
  let detail = payload.message || fileName
  let dismissDelay = 0

  if (payload.status === 'selected') {
    title = '正在下载'
    detail = displayPath(path) || fileName
  } else if (payload.status === 'finished') {
    tone = 'success'
    title = '下载完成'
    detail = displayPath(path) || fileName
    dismissDelay = 7000
    activeIds.delete(payload.url)
  } else if (payload.status === 'canceled') {
    tone = 'warning'
    title = '已取消下载'
    detail = fileName
    dismissDelay = 4000
    activeIds.delete(payload.url)
  } else if (payload.status === 'failed') {
    tone = 'error'
    title = '下载失败'
    detail = payload.message || fileName
    dismissDelay = 8000
    activeIds.delete(payload.url)
  }

  const item: DownloadNotification = {
    id,
    url: payload.url,
    fileName,
    path,
    title,
    detail,
    tone,
  }
  const idx = downloadNotifications.value.findIndex(n => n.id === id)
  if (idx >= 0) {
    downloadNotifications.value[idx] = item
  } else {
    downloadNotifications.value.unshift(item)
  }

  if (dismissDelay > 0) scheduleDismiss(id, dismissDelay)
}

export async function initDownloadNotifications() {
  if (unlisten) return
  unlisten = await listen<ServiceDownloadPayload>('service-download', (event) => {
    upsertNotification(event.payload)
  })
}

export function stopDownloadNotifications() {
  if (unlisten) {
    unlisten()
    unlisten = null
  }
  timers.forEach(timer => clearTimeout(timer))
  timers.clear()
  activeIds.clear()
}

export function dismissDownloadNotification(id: number) {
  downloadNotifications.value = downloadNotifications.value.filter(n => n.id !== id)
  clearTimer(id)
}

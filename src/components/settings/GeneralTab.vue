<script setup lang="ts">
import { useAppStore, type Theme } from '../../stores/app'
import { confirm, message, open, save } from '@tauri-apps/plugin-dialog'
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'

const store = useAppStore()

const themes: { value: Theme; label: string; icon: string; desc: string }[] = [
  { value: 'light', label: '浅色模式', icon: '☀️', desc: '清爽明亮的界面' },
  { value: 'dark', label: '深色模式', icon: '🌙', desc: '专注且护眼的界面' },
  { value: 'system', label: '跟随系统', icon: '💻', desc: '自动适配系统外观' },
]

const APP_VERSION = '0.5.0'
const BACKUP_SCHEMA_VERSION = 1
const BACKUP_KEYS = [
  'chatplex_settings',
  'chatplex_services',
  'chatplex_sessions',
  'chatplex_service_states',
] as const

type BackupKey = typeof BACKUP_KEYS[number]

interface ChatPlexBackup {
  schemaVersion: number
  exportedAt: string
  appVersion: string
  payload: Record<BackupKey, unknown>
}

function parseStoredValue(key: BackupKey) {
  const raw = localStorage.getItem(key)
  if (raw === null) return null

  try {
    return JSON.parse(raw)
  } catch {
    throw new Error(`${key} 数据不是有效 JSON`)
  }
}

function buildBackup(): ChatPlexBackup {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    payload: {
      chatplex_settings: parseStoredValue('chatplex_settings'),
      chatplex_services: parseStoredValue('chatplex_services'),
      chatplex_sessions: parseStoredValue('chatplex_sessions'),
      chatplex_service_states: parseStoredValue('chatplex_service_states'),
    },
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateBackupPayload(value: unknown): ChatPlexBackup {
  if (!isObject(value)) throw new Error('备份文件格式不正确')
  if (value.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new Error(`不支持的备份版本: ${String(value.schemaVersion ?? '未知')}`)
  }
  if (typeof value.exportedAt !== 'string' || typeof value.appVersion !== 'string') {
    throw new Error('备份文件缺少导出信息')
  }
  if (!isObject(value.payload)) throw new Error('备份文件缺少 payload')

  for (const key of BACKUP_KEYS) {
    if (!(key in value.payload)) throw new Error(`备份文件缺少 ${key}`)
  }

  return value as unknown as ChatPlexBackup
}

function countArray(value: unknown) {
  return Array.isArray(value) ? value.length : 0
}

function backupSummary(backup: ChatPlexBackup) {
  const services = isObject(backup.payload.chatplex_services) ? backup.payload.chatplex_services : {}
  const sessions = backup.payload.chatplex_sessions
  const serviceStates = backup.payload.chatplex_service_states
  const exportedDate = new Date(backup.exportedAt)
  const exportedAt = Number.isNaN(exportedDate.getTime())
    ? backup.exportedAt
    : exportedDate.toLocaleString()

  return [
    `导出时间: ${exportedAt}`,
    `应用版本: ${backup.appVersion}`,
    `自定义服务: ${countArray(services.customServices)} 个`,
    `隐藏服务: ${countArray(services.hiddenServiceIds)} 个`,
    `聊天会话: ${countArray(sessions)} 个`,
    `服务状态: ${isObject(serviceStates) ? Object.keys(serviceStates).length : 0} 个`,
  ].join('\n')
}

async function exportFullBackup() {
  try {
    const now = new Date()
    const date = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('')
    const path = await save({
      title: '导出 ChatPlex 备份',
      defaultPath: `chatplex-backup-${date}.json`,
      filters: [{ name: 'ChatPlex Backup', extensions: ['json'] }],
    })
    if (!path) return

    const backup = buildBackup()
    await writeTextFile(path, JSON.stringify(backup, null, 2))
    await message('备份已导出完成。', { title: 'ChatPlex', kind: 'info' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await message(`导出失败: ${msg}`, { title: 'ChatPlex', kind: 'error' })
  }
}

async function importFullBackup() {
  try {
    const selected = await open({
      title: '导入 ChatPlex 备份',
      multiple: false,
      filters: [{ name: 'ChatPlex Backup', extensions: ['json'] }],
    })
    if (!selected || Array.isArray(selected)) return

    const text = await readTextFile(selected)
    const backup = validateBackupPayload(JSON.parse(text))
    const ok = await confirm(
      `即将用备份内容替换当前本地数据。\n\n${backupSummary(backup)}\n\n继续导入吗？`,
      { title: '导入 ChatPlex 备份', kind: 'warning' },
    )
    if (!ok) return

    for (const key of BACKUP_KEYS) {
      const value = backup.payload[key]
      if (value === null || value === undefined) {
        localStorage.removeItem(key)
      } else {
        localStorage.setItem(key, JSON.stringify(value))
      }
    }

    await store.loadSettings()
    store.loadSessions()
    await message('备份已导入完成，数据已恢复。', { title: 'ChatPlex', kind: 'info' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await message(`导入失败: ${msg}`, { title: 'ChatPlex', kind: 'error' })
  }
}
</script>

<template>
  <div class="settings-panel">
    <div class="settings-section">
      <h3 class="section-title">外观设置</h3>
      <p class="section-desc">选择您喜欢的应用主题，或让它跟随系统自动切换。</p>
      
      <div class="theme-grid">
        <div v-for="t in themes" :key="t.value"
          class="theme-card" :class="{ active: store.theme === t.value }"
          @click="store.setTheme(t.value)">
          <div class="theme-card-icon">{{ t.icon }}</div>
          <div class="theme-card-info">
            <div class="theme-name">{{ t.label }}</div>
            <div class="theme-desc">{{ t.desc }}</div>
          </div>
          <div class="theme-check" v-if="store.theme === t.value">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <h3 class="section-title">数据管理</h3>
      <p class="section-desc">导出或导入完整本地数据，包含主题、自定义服务、隐藏服务、聊天会话和服务状态。</p>

      <div class="data-card">
        <div class="data-copy">
          <div class="data-title">完整备份</div>
          <div class="data-desc">导入备份会在确认后替换当前本地数据。</div>
        </div>
        <div class="data-actions">
          <button class="secondary-btn" @click="importFullBackup">导入备份</button>
          <button class="primary-btn" @click="exportFullBackup">导出备份</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 32px;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  margin: 0 0 16px 0;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.theme-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  border-radius: 16px;
  cursor: pointer;
  background: var(--bg-secondary, rgba(255,255,255,0.02));
  border: 1px solid var(--border-color, rgba(255,255,255,0.05));
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-card:hover {
  background: var(--bg-hover, rgba(255,255,255,0.04));
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateY(-2px);
}

.theme-card.active {
  background: rgba(59, 130, 246, 0.08);
  border-color: var(--accent, #3b82f6);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.theme-card-icon {
  font-size: 28px;
  line-height: 1;
  background: rgba(255,255,255,0.05);
  padding: 12px;
  border-radius: 12px;
}

.theme-card.active .theme-card-icon {
  background: rgba(59, 130, 246, 0.15);
}

.theme-card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.theme-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #ffffff);
}

.theme-desc {
  font-size: 12px;
  color: var(--text-secondary, #94a3b8);
  line-height: 1.4;
}

.theme-check {
  position: absolute;
  top: 20px;
  right: 20px;
  color: var(--accent, #3b82f6);
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popIn {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: scale(1); }
}

.data-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 16px;
  background: var(--bg-secondary, rgba(255,255,255,0.02));
  border: 1px solid var(--border-color, rgba(255,255,255,0.05));
}

.data-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.data-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary, #ffffff);
}

.data-desc {
  font-size: 12px;
  color: var(--text-secondary, #94a3b8);
  line-height: 1.5;
}

.data-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.primary-btn,
.secondary-btn {
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.primary-btn {
  padding: 10px 18px;
  color: #fff;
  background: var(--accent, #3b82f6);
}

.primary-btn:hover {
  background: #2563eb;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

.secondary-btn {
  padding: 9px 16px;
  color: var(--text-primary, #e2e8f0);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color, rgba(255,255,255,0.1));
}

.secondary-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

@media (max-width: 720px) {
  .data-card {
    align-items: stretch;
    flex-direction: column;
  }

  .data-actions {
    justify-content: flex-end;
  }
}
</style>

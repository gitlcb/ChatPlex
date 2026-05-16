<script setup lang="ts">
defineProps<{ role: 'user' | 'assistant' }>()
const emit = defineEmits<{
  copy: []
  regenerate: []
  edit: []
  remove: []
}>()
</script>

<template>
  <div class="msg-actions">
    <button v-if="role === 'assistant'" @click.stop="emit('copy')" title="复制">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
    </button>
    <button v-if="role === 'assistant'" @click.stop="emit('regenerate')" title="重新生成">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
    </button>
    <button v-if="role === 'user'" @click.stop="emit('edit')" title="编辑">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
    </button>
    <button @click.stop="emit('remove')" title="删除">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
    </button>
  </div>
</template>

<style scoped>
.msg-actions {
  position: absolute; top: -8px; right: 8px;
  display: flex; gap: 2px; padding: 3px;
  background: var(--bg-secondary, #1a2435); border: 1px solid var(--border-color, #243447);
  border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  opacity: 0; transition: opacity 0.15s; z-index: 10;
}
.msg-row:hover .msg-actions { opacity: 1; }
.msg-actions button {
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  background: none; border: none; color: var(--text-secondary, #94a3b8); cursor: pointer;
  border-radius: 6px; transition: all 0.12s;
}
.msg-actions button:hover { background: rgba(255,255,255,0.08); color: var(--text-primary, #e2e8f0); }
</style>

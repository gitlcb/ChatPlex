<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const inputRef = ref<HTMLInputElement>()

watch(() => store.showSearch, (v) => {
  if (v) nextTick(() => inputRef.value?.focus())
})

function close() {
  store.showSearch = false
  store.searchQuery = ''
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
  if (e.key === 'Enter') {
    if (e.shiftKey) store.prevSearchMatch()
    else store.nextSearchMatch()
  }
}
</script>

<template>
  <Transition name="search-slide">
    <div v-if="store.showSearch" class="search-bar">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input ref="inputRef" v-model="store.searchQuery" placeholder="搜索消息..." @keydown="onKeydown" class="search-input" />
      <span class="search-count" v-if="store.searchQuery">
        {{ store.searchMatchIds.length > 0 ? store.searchMatchIndex + 1 : 0 }}/{{ store.searchMatchIds.length }}
      </span>
      <button @click="store.prevSearchMatch" :disabled="store.searchMatchIds.length === 0" class="search-nav" title="上一个 (Shift+Enter)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
      </button>
      <button @click="store.nextSearchMatch" :disabled="store.searchMatchIds.length === 0" class="search-nav" title="下一个 (Enter)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <button @click="close" class="search-close" title="关闭 (Escape)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.search-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; background: var(--bg-secondary, #131b27);
  border-bottom: 1px solid var(--border-color, #1a2435);
  flex-shrink: 0;
}
.search-bar svg { color: var(--text-secondary, #64748b); flex-shrink: 0; }
.search-input {
  flex: 1; background: none; border: none; outline: none;
  color: var(--text-primary, #e2e8f0); font-size: 13px;
}
.search-input::placeholder { color: var(--text-muted, #475569); }
.search-count { font-size: 12px; color: var(--text-secondary, #94a3b8); white-space: nowrap; }
.search-nav, .search-close {
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  background: none; border: none; color: var(--text-secondary, #94a3b8); cursor: pointer;
  border-radius: 6px; transition: all 0.12s;
}
.search-nav:hover, .search-close:hover { background: rgba(255,255,255,0.08); color: var(--text-primary); }
.search-nav:disabled { opacity: 0.3; cursor: not-allowed; }

.search-slide-enter-active, .search-slide-leave-active { transition: all 0.2s ease; }
.search-slide-enter-from, .search-slide-leave-to { opacity: 0; transform: translateY(-8px); }
</style>

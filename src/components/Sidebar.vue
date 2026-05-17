<script setup lang="ts">
import { ref, computed } from 'vue';
import { useServiceManager } from '../composables/useServiceManager';
import { SERVICES } from '../types/services';
import type { ServiceRegion, ServiceCategory } from '../types/services';

const {
  activeServiceId,
  loadedServices,
  loadingServiceId,
  errorMessages,
  toggleSidebar,
  sidebarExpanded,
  activeRightPanel,
  openService,
  closeService,
  refreshService,
  clearError,
  activeRegion,
  activeCategory,
  filteredServices,
  setRegion,
  setCategory,
} = useServiceManager();

const hoveredService = ref<string | null>(null);

// Context menu
const contextMenu = ref<{ visible: boolean; x: number; y: number; serviceId: string }>({
  visible: false, x: 0, y: 0, serviceId: '',
});

function onContextMenu(e: MouseEvent, serviceId: string) {
  e.preventDefault();
  contextMenu.value = { visible: true, x: e.clientX, y: e.clientY, serviceId };
}

function handleContextAction(action: string) {
  const { serviceId } = contextMenu.value;
  if (action === 'refresh') refreshService(serviceId);
  else if (action === 'close') closeService(serviceId);
  contextMenu.value = { ...contextMenu.value, visible: false };
}

function hideContextMenu() {
  contextMenu.value = { ...contextMenu.value, visible: false };
}

const anyError = computed(() => errorMessages.size > 0);

const categoryOptions: { value: ServiceCategory; label: string }[] = [
  { value: 'chat', label: '对话' },
  { value: 'visual', label: '视觉' },
];

const regionOptions: { value: ServiceRegion; label: string }[] = [
  { value: 'domestic', label: '国内' },
  { value: 'international', label: '国际' },
];

const categoryIndicatorStyle = computed(() => {
  const idx = categoryOptions.findIndex(o => o.value === activeCategory.value);
  const count = categoryOptions.length;
  return { width: `${100 / count}%`, transform: `translateX(${idx * 100}%)` };
});

const regionIndicatorStyle = computed(() => {
  const idx = regionOptions.findIndex(o => o.value === activeRegion.value);
  const count = regionOptions.length;
  return { width: `${100 / count}%`, transform: `translateX(${idx * 100}%)` };
});

function getServiceName(serviceId: string): string {
  return SERVICES.find(s => s.id === serviceId)?.name ?? serviceId;
}

function handleServiceClick(serviceId: string) {
  clearError(serviceId);
  openService(serviceId);
}

function handleServiceClose(serviceId: string) {
  closeService(serviceId);
}
</script>

<template>
  <aside class="sidebar" :class="{ collapsed: !sidebarExpanded }">
    <!-- Header / Logo -->
    <div class="sidebar-header" @click="toggleSidebar()">
      <transition name="fade-width">
        <span v-if="sidebarExpanded" class="logo-text">ChatPlex</span>
      </transition>
      <transition name="fade-scale">
        <span v-if="!sidebarExpanded" class="expand-icon">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M9 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M4 3l4 5-4 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/>
          </svg>
        </span>
      </transition>
      <button
        v-if="sidebarExpanded"
        class="sidebar-toggle"
        @click.stop="toggleSidebar"
        title="收起侧栏"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M9 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <!-- Service List -->
    <nav class="service-list">
      <button
        v-for="service in filteredServices"
        :key="service.id"
        class="service-btn"
        :class="{
          active: activeServiceId === service.id && !activeRightPanel,
          loading: loadingServiceId === service.id,
          'has-error': errorMessages.has(service.id),
        }"
        @click="handleServiceClick(service.id)"
        @contextmenu="onContextMenu($event, service.id)"
        @mouseenter="hoveredService = service.id"
        @mouseleave="hoveredService = null"
        :title="sidebarExpanded ? '' : service.name"
      >
        <!-- Active indicator line -->
        <div
          class="service-indicator"
          :class="{ visible: activeServiceId === service.id && !activeRightPanel }"
          :style="{ '--service-color': service.color }"
        ></div>

        <!-- Loading spinner -->
        <span v-if="loadingServiceId === service.id" class="service-icon loading-spinner">
          <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.25"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </span>
        <span v-else class="service-icon">{{ service.icon }}</span>

        <transition name="fade-width">
          <span v-if="sidebarExpanded" class="service-info">
            <span class="service-name">{{ service.name }}</span>
            <span v-if="errorMessages.has(service.id)" class="error-dot" :title="errorMessages.get(service.id)">⚠️</span>
          </span>
        </transition>

        <transition name="fade-scale">
          <button
            v-if="sidebarExpanded && loadedServices.has(service.id) && hoveredService === service.id"
            class="service-close"
            @click.stop="handleServiceClose(service.id)"
            title="关闭"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
          </button>
        </transition>
      </button>
    </nav>

    <!-- Error toast -->
    <div v-if="anyError" class="sidebar-errors">
      <div v-for="[serviceId, msg] of errorMessages" :key="serviceId" class="error-toast">
        <span>{{ getServiceName(serviceId) }}: {{ msg }}</span>
        <button class="error-close" @click="clearError(serviceId)">✕</button>
      </div>
    </div>

    <!-- Footer — Segmented Control -->
    <div class="sidebar-footer" v-show="sidebarExpanded">
      <div class="seg-group">
        <div class="seg-track">
          <div class="seg-indicator" :style="categoryIndicatorStyle"></div>
          <button
            v-for="cat in categoryOptions"
            :key="cat.value"
            class="seg-btn"
            :class="{ active: activeCategory === cat.value }"
            @click="setCategory(cat.value)"
          >
            <svg v-if="activeCategory === cat.value" class="seg-check" width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6.5L5 9l4.5-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>{{ cat.label }}</span>
          </button>
        </div>
      </div>
      <div class="seg-group">
        <div class="seg-track">
          <div class="seg-indicator" :style="regionIndicatorStyle"></div>
          <button
            v-for="r in regionOptions"
            :key="r.value"
            class="seg-btn"
            :class="{ active: activeRegion === r.value }"
            @click="setRegion(r.value)"
          >
            <svg v-if="activeRegion === r.value" class="seg-check" width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6.5L5 9l4.5-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>{{ r.label }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Context Menu -->
    <Teleport to="body">
      <div v-if="contextMenu.visible" class="ctx-overlay" @click="hideContextMenu" @contextmenu.prevent="hideContextMenu">
        <div
          class="ctx-menu"
          :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
          @click.stop
        >
          <button class="ctx-item" @click="handleContextAction('refresh')">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M13.5 8a5.5 5.5 0 01-9.77 3.45M2.5 8a5.5 5.5 0 019.77-3.45" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
              <path d="M14 2v4h-4M2 14v-4h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>刷新</span>
          </button>
          <button class="ctx-item ctx-close" @click="handleContextAction('close')">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
            <span>关闭</span>
          </button>
        </div>
      </div>
    </Teleport>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 200px;
  height: 100%;
  background: #0c1017;
  border-right: 1px solid #1a2435;
  display: flex;
  flex-direction: column;
  transition: width 0.35s cubic-bezier(0.32, 0.72, 0, 1);
  overflow: hidden;
  user-select: none;
  flex-shrink: 0;
  position: relative;
  z-index: 100;
  will-change: width;
}

.sidebar.collapsed {
  width: 56px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  gap: 10px;
  border-bottom: 1px solid #1a2435;
  min-height: 52px;
  flex-shrink: 0;
  cursor: pointer;
}

.logo-text {
  font-size: 17px;
  font-weight: 700;
  white-space: nowrap;
  background: linear-gradient(135deg, #60a5fa, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sidebar-toggle {
  margin-left: auto;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}
.sidebar-toggle:hover { color: #e2e8f0; background: rgba(255,255,255,0.06); }

.expand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition: color 0.18s;
  flex-shrink: 0;
}
.sidebar-header:hover .expand-icon { color: #e2e8f0; }

/* Service List */
.service-list {
  flex: 1; overflow-y: auto; padding: 6px 6px;
  scrollbar-width: thin; scrollbar-color: #1a2435 transparent;
}

.service-btn {
  display: flex; align-items: center; width: 100%;
  padding: 9px 10px; margin-bottom: 1px;
  background: transparent; border: none; border-radius: 8px;
  color: #94a3b8; cursor: pointer; transition: all 0.18s ease;
  position: relative; gap: 10px; text-align: left; overflow: hidden;
}
.service-btn:hover { background: rgba(255,255,255,0.04); color: #e2e8f0; }
.service-btn.active { background: rgba(59,130,246,0.1); color: #e2e8f0; }
.service-btn.active:hover { background: rgba(59,130,246,0.15); }
.service-btn.has-error { color: #f87171; }

.service-indicator {
  position: absolute; left: 0; top: 50%;
  transform: translateY(-50%) scaleY(0);
  width: 3px; height: 20px; border-radius: 0 3px 3px 0;
  background: var(--service-color, #3b82f6);
  transition: transform 0.2s cubic-bezier(0.4,0,0.2,1);
}
.service-indicator.visible { transform: translateY(-50%) scaleY(1); }

.service-icon {
  font-size: 17px; min-width: 22px; text-align: center; flex-shrink: 0; line-height: 1;
}

.loading-spinner { display: flex; align-items: center; justify-content: center; }
.spinner { animation: spin 0.8s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.service-info {
  display: flex; align-items: center; gap: 6px;
  flex: 1; min-width: 0; overflow: hidden;
}
.service-name {
  font-size: 13px; font-weight: 500; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
}
.error-dot { font-size: 11px; flex-shrink: 0; }

.service-close {
  background: rgba(255,255,255,0.08); border: none; color: #64748b;
  width: 18px; height: 18px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0; transition: all 0.15s; padding: 0; margin-left: auto;
}
.service-close:hover { background: rgba(239,68,68,0.25); color: #f87171; }

/* Error toast */
.sidebar-errors { padding: 6px 8px; display: flex; flex-direction: column; gap: 4px; }
.error-toast {
  background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
  border-radius: 6px; padding: 6px 8px;
  font-size: 11px; color: #fca5a5; display: flex; align-items: center; gap: 6px;
}
.error-close { background: none; border: none; color: #f87171; cursor: pointer; font-size: 12px; padding: 0; margin-left: auto; }

/* Footer — Segmented Control */
.sidebar-footer {
  padding: 10px 10px 14px; border-top: 1px solid #1a2435;
  flex-shrink: 0; display: flex; flex-direction: column; gap: 6px;
  overflow: hidden;
  transition: opacity 0.22s ease, max-height 0.35s cubic-bezier(0.32,0.72,0,1), padding 0.35s cubic-bezier(0.32,0.72,0,1), border-color 0.35s;
  max-height: 200px;
  opacity: 1;
}
.sidebar.collapsed .sidebar-footer {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  border-top-color: transparent;
  pointer-events: none;
}
.seg-group { display: flex; }
.seg-track {
  flex: 1; display: flex; position: relative;
  background: #090d13;
  border: 1px solid #1e293b;
  border-radius: 12px; padding: 3px;
}
.seg-indicator {
  position: absolute; top: 3px; left: 3px; bottom: 3px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 9px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04);
  transition: transform 0.3s cubic-bezier(0.34,1.4,0.64,1), width 0.3s;
  z-index: 0;
}
.seg-btn {
  flex: 1; position: relative; z-index: 1;
  display: flex; align-items: center; justify-content: center; gap: 3px;
  padding: 4px 0; border: none; border-radius: 9px;
  background: transparent; color: #64748b; font-size: 11px;
  font-weight: 500; cursor: pointer; text-align: center;
  transition: color 0.2s;
  line-height: 1;
}
.seg-btn:hover { color: #94a3b8; }
.seg-btn.active { color: #e2e8f0; }
.seg-check { flex-shrink: 0; opacity: 0.7; }

/* Context Menu */
.ctx-overlay {
  position: fixed; inset: 0; z-index: 10000;
}
.ctx-menu {
  position: fixed; z-index: 10001;
  background: #1e293b; border: 1px solid #334155;
  border-radius: 10px; padding: 4px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03);
  min-width: 120px;
  animation: ctxIn 0.12s cubic-bezier(0.34,1.2,0.64,1);
}
@keyframes ctxIn {
  from { opacity: 0; transform: scale(0.92) translateY(-4px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.ctx-item {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 6px 10px; border: none; border-radius: 7px;
  background: transparent; color: #94a3b8; font-size: 12px;
  cursor: pointer; transition: background 0.12s, color 0.12s;
}
.ctx-item:hover { background: rgba(255,255,255,0.06); color: #e2e8f0; }
.ctx-close:hover { background: rgba(239,68,68,0.12); color: #f87171; }

/* Collapsed */
.sidebar.collapsed .service-btn { justify-content: center; padding: 10px 8px; }
.sidebar.collapsed .sidebar-header { justify-content: center; padding: 12px 8px; }

/* Transitions — staggered: text fades before sidebar shrinks */
.fade-width-enter-active {
  transition: opacity 0.22s ease 0.06s, transform 0.22s ease 0.06s;
}
.fade-width-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}
.fade-width-enter-from { opacity: 0; transform: translateX(-6px); }
.fade-width-leave-to   { opacity: 0; transform: translateX(-6px); }
.fade-scale-enter-active, .fade-scale-leave-active { transition: opacity 0.12s, transform 0.12s; }
.fade-scale-enter-from { opacity: 0; transform: scale(0.8); }
.fade-scale-leave-to { opacity: 0; transform: scale(0.8); }
</style>
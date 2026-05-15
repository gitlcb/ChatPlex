<script setup lang="ts">
import { ref } from 'vue';
import { useServiceManager } from '../composables/useServiceManager';
import { SERVICES } from '../types/services';

const { activeServiceId, loadedServices, toggleSidebar, sidebarExpanded, openService, closeService } = useServiceManager();
const hoveredService = ref<string | null>(null);

function handleServiceClick(serviceId: string) {
  openService(serviceId);
}

function handleServiceClose(serviceId: string, event: MouseEvent) {
  event.stopPropagation();
  closeService(serviceId);
}
</script>

<template>
  <aside class="sidebar" :class="{ collapsed: !sidebarExpanded }">
    <!-- Header / Logo -->
    <div class="sidebar-header" @click="sidebarExpanded || toggleSidebar()">
      <div class="logo-icon" @click.stop="!sidebarExpanded && toggleSidebar()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
      </div>
      <transition name="fade-width">
        <span v-if="sidebarExpanded" class="logo-text">ChatPlex</span>
      </transition>
      <button
        v-if="sidebarExpanded"
        class="sidebar-toggle"
        @click.stop="toggleSidebar"
        title="收起侧栏"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M9 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M3 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/>
        </svg>
      </button>
    </div>

    <!-- Search / Expand when collapsed -->
    <div v-if="!sidebarExpanded" class="collapsed-actions">
      <button class="expand-btn" @click="toggleSidebar" title="展开侧栏">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M7 3L3 8l4 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 3L8 8l4 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/>
        </svg>
      </button>
    </div>

    <!-- Service List -->
    <nav class="service-list">
      <button
        v-for="service in SERVICES"
        :key="service.id"
        class="service-btn"
        :class="{
          active: activeServiceId === service.id,
          loaded: loadedServices.has(service.id),
        }"
        @click="handleServiceClick(service.id)"
        @mouseenter="hoveredService = service.id"
        @mouseleave="hoveredService = null"
        :title="sidebarExpanded ? '' : service.name"
      >
        <!-- Active indicator line -->
        <div
          class="service-indicator"
          :class="{ visible: activeServiceId === service.id }"
          :style="{ '--service-color': service.color }"
        ></div>

        <span class="service-icon">{{ service.icon }}</span>

        <transition name="fade-width">
          <span v-if="sidebarExpanded" class="service-info">
            <span class="service-name">{{ service.name }}</span>
          </span>
        </transition>

        <transition name="fade-scale">
          <button
            v-if="sidebarExpanded && loadedServices.has(service.id) && hoveredService === service.id"
            class="service-close"
            @click="handleServiceClose(service.id, $event)"
            title="关闭"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
          </button>
        </transition>
      </button>
    </nav>

    <!-- Footer -->
    <div class="sidebar-footer">
      <div class="footer-content" v-if="sidebarExpanded">
        <span class="footer-text">国产AI一站式对话工具</span>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 256px;
  height: 100vh;
  background: var(--bg-sidebar, #0c1017);
  border-right: 1px solid var(--border-color, #1e2a3a);
  display: flex;
  flex-direction: column;
  transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  user-select: none;
  flex-shrink: 0;
  position: relative;
  z-index: 100;
}

.sidebar.collapsed {
  width: 56px;
}

/* Header */
.sidebar-header {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  gap: 10px;
  border-bottom: 1px solid var(--border-color, #1e2a3a);
  min-height: 52px;
  flex-shrink: 0;
}

.logo-icon {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 8px;
  flex-shrink: 0;
  color: white;
  cursor: pointer;
  transition: transform 0.2s;
}

.logo-icon:hover {
  transform: scale(1.05);
}

.logo-text {
  font-size: 17px;
  font-weight: 700;
  white-space: nowrap;
  background: linear-gradient(135deg, #60a5fa, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  overflow: hidden;
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

.sidebar-toggle:hover {
  color: #e2e8f0;
  background: rgba(255, 255, 255, 0.06);
}

/* Collapsed Actions */
.collapsed-actions {
  padding: 8px 10px;
  border-bottom: 1px solid var(--border-color, #1e2a3a);
  display: flex;
  justify-content: center;
}

.expand-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid var(--border-color, #1e2a3a);
  border-radius: 8px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.expand-btn:hover {
  color: #e2e8f0;
  background: rgba(255, 255, 255, 0.06);
  border-color: #2a3a4a;
}

/* Service List */
.service-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px 6px;
  scrollbar-width: thin;
  scrollbar-color: #1e2a3a transparent;
}

.service-btn {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 10px;
  margin-bottom: 1px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.18s ease;
  position: relative;
  gap: 10px;
  text-align: left;
  overflow: hidden;
}

.service-btn:hover {
  background: rgba(255, 255, 255, 0.04);
  color: #e2e8f0;
}

.service-btn.active {
  background: rgba(59, 130, 246, 0.1);
  color: #e2e8f0;
}

.service-btn.active:hover {
  background: rgba(59, 130, 246, 0.15);
}

/* Active indicator */
.service-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%) scaleY(0);
  width: 3px;
  height: 20px;
  border-radius: 0 3px 3px 0;
  background: var(--service-color, var(--accent, #3b82f6));
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.service-indicator.visible {
  transform: translateY(-50%) scaleY(1);
}

.service-icon {
  font-size: 17px;
  min-width: 22px;
  text-align: center;
  flex-shrink: 0;
  line-height: 1;
}

.service-info {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.service-name {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.service-close {
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: #64748b;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
  padding: 0;
  margin-left: auto;
}

.service-close:hover {
  background: rgba(239, 68, 68, 0.25);
  color: #f87171;
}

/* Footer */
.sidebar-footer {
  padding: 10px 14px;
  border-top: 1px solid var(--border-color, #1e2a3a);
  flex-shrink: 0;
}

.footer-content {
  text-align: center;
}

.footer-text {
  font-size: 11px;
  color: #475569;
}

/* Collapsed state adjustments */
.sidebar.collapsed .service-btn {
  justify-content: center;
  padding: 10px 8px;
}

.sidebar.collapsed .sidebar-header {
  justify-content: center;
  padding: 12px 8px;
}

/* Transitions */
.fade-width-enter-active,
.fade-width-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.fade-width-enter-from {
  opacity: 0;
  transform: translateX(-8px);
}

.fade-width-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.12s, transform 0.12s;
}

.fade-scale-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
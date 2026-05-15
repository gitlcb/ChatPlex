import { ref, reactive } from 'vue';
import { Webview } from '@tauri-apps/api/webview';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { LogicalPosition, LogicalSize } from '@tauri-apps/api/dpi';
import { SERVICES } from '../types/services';

// Singleton state — shared across all components
const activeServiceId = ref<string | null>(null);
const loadedServices = reactive<Set<string>>(new Set());
const sidebarWidth = ref(256);
const sidebarExpanded = ref(true);
const webviewInstances = new Map<string, Webview>();
let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

export function useServiceManager() {
  async function openService(serviceId: string) {
    const service = SERVICES.find((s) => s.id === serviceId);
    if (!service) return;

    // Clicking same service → just refocus
    if (activeServiceId.value === serviceId) {
      const wv = webviewInstances.get(serviceId);
      if (wv) {
        try { await wv.setFocus(); } catch { /* ignore */ }
      }
      return;
    }

    // Hide previous service webview
    if (activeServiceId.value) {
      const prevWv = webviewInstances.get(activeServiceId.value);
      if (prevWv) {
        try {
          await prevWv.hide();
        } catch {
          webviewInstances.delete(activeServiceId.value);
        }
      }
    }

    const label = `svc-${serviceId}`;

    // Check if webview already exists
    let wv: Webview | undefined = webviewInstances.get(serviceId);

    if (!wv) {
      try {
        const existing = await Webview.getByLabel(label);
        if (existing) {
          wv = existing;
          webviewInstances.set(serviceId, wv);
        }
      } catch {
        // doesn't exist, will create new below
      }
    }

    if (wv) {
      // Show existing webview and resize to current window
      try {
        await wv.show();
        await resizeWebview(wv);
        await wv.setFocus();
      } catch {
        webviewInstances.delete(serviceId);
        wv = undefined;
      }
    }

    if (!wv) {
      // Create new webview within the same window
      try {
        const mainWindow = getCurrentWindow();
        const size = await mainWindow.innerSize();
        const scaleFactor = await mainWindow.scaleFactor();
        const logicalSize = size.toLogical(scaleFactor);
        const contentWidth = logicalSize.width - sidebarWidth.value;

        const newWv = new Webview(mainWindow, label, {
          url: service.url,
          x: sidebarWidth.value,
          y: 0,
          width: contentWidth,
          height: logicalSize.height,
        });

        newWv.once('tauri://created', () => {
          console.log(`[ChatPlex] Webview created: ${label}`);
        });

        newWv.once('tauri://error', (e: unknown) => {
          console.error(`[ChatPlex] Webview error for ${label}:`, e);
          webviewInstances.delete(serviceId);
          loadedServices.delete(serviceId);
        });

        webviewInstances.set(serviceId, newWv);
        loadedServices.add(serviceId);
      } catch (e) {
        console.error(`[ChatPlex] Failed to create webview for ${serviceId}:`, e);
        return;
      }
    }

    activeServiceId.value = serviceId;
  }

  async function closeService(serviceId: string) {
    const wv = webviewInstances.get(serviceId);
    if (wv) {
      try {
        await wv.close();
      } catch {
        // already closed
      }
      webviewInstances.delete(serviceId);
    }
    loadedServices.delete(serviceId);

    if (activeServiceId.value === serviceId) {
      activeServiceId.value = null;
    }
  }

  async function resizeWebview(wv: Webview) {
    try {
      const mainWindow = getCurrentWindow();
      const size = await mainWindow.innerSize();
      const scaleFactor = await mainWindow.scaleFactor();
      const logicalSize = size.toLogical(scaleFactor);
      const contentWidth = logicalSize.width - sidebarWidth.value;

      await wv.setPosition(new LogicalPosition(sidebarWidth.value, 0));
      await wv.setSize(new LogicalSize(contentWidth, logicalSize.height));
    } catch (e) {
      console.error('[ChatPlex] Failed to resize webview:', e);
    }
  }

  async function resizeAllServices() {
    for (const [serviceId, wv] of webviewInstances.entries()) {
      try {
        await resizeWebview(wv);
        // Show/hide based on active state
        if (serviceId === activeServiceId.value) {
          await wv.show();
        } else {
          await wv.hide();
        }
      } catch {
        console.error(`[ChatPlex] Failed to resize webview for ${serviceId}`);
      }
    }
  }

  function handleWindowResize() {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }
    resizeTimeout = setTimeout(async () => {
      await resizeAllServices();
    }, 100);
  }

  function toggleSidebar() {
    sidebarExpanded.value = !sidebarExpanded.value;
    sidebarWidth.value = sidebarExpanded.value ? 256 : 56;
    // Resize after CSS transition completes
    setTimeout(() => {
      resizeAllServices();
    }, 300);
  }

  return {
    activeServiceId,
    loadedServices,
    sidebarWidth,
    sidebarExpanded,
    openService,
    closeService,
    resizeAllServices,
    handleWindowResize,
    toggleSidebar,
  };
}
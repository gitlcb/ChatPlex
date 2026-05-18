import { ref, reactive, computed } from 'vue';
import { Webview } from '@tauri-apps/api/webview';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { LogicalPosition, LogicalSize } from '@tauri-apps/api/dpi';
import { invoke } from '@tauri-apps/api/core';
import { SERVICES, type ServiceRegion, type ServiceCategory, type AIService } from '../types/services';
import { useAppStore } from '../stores/app';

// ========== Singleton State ==========
const activeServiceId = ref<string | null>(null);
const loadedServices = reactive<Set<string>>(new Set());
const loadingServiceId = ref<string | null>(null);
const errorMessages = reactive<Map<string, string>>(new Map());
const sidebarWidth = ref(200);
const sidebarExpanded = ref(true);
const rightSidebarWidth = 48;

const activeRightPanel = ref<string | null>(null);

// Filter state
const activeRegion = ref<ServiceRegion>('domestic');
const activeCategory = ref<ServiceCategory>('chat');
const filteredServices = computed(() => {
  const store = useAppStore()
  const all = [...SERVICES, ...store.customServices] as AIService[]
  return all.filter(s => {
    if (s.region !== activeRegion.value || s.category !== activeCategory.value) return false
    const isBuiltIn = SERVICES.some(bi => bi.id === s.id)
    if (isBuiltIn) return !store.hiddenServiceIds.includes(s.id)
    return !s.hidden
  })
});

// Debug logs — visible in UI for troubleshooting
const debugLogs = reactive<string[]>([]);
function log(msg: string) {
  const time = new Date().toLocaleTimeString();
  debugLogs.unshift(`[${time}] ${msg}`);
  if (debugLogs.length > 50) debugLogs.length = 50;
  console.log(`[ChatPlex] ${msg}`);
}
const showDebug = ref(false);

// Chat refresh signal
const chatRefreshKey = ref(0);

// Webview instance tracking
const webviewInstances = new Map<string, Webview>();
let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

export function useServiceManager() {
  async function openService(serviceId: string) {
    const store = useAppStore()
    const service = SERVICES.find((s) => s.id === serviceId)
      || store.customServices.find((s: AIService) => s.id === serviceId);
    if (!service) return;

    log(`Opening service: ${service.name} (${service.url})`);

    const rightPanelWasOpen = activeRightPanel.value !== null;
    activeRightPanel.value = null;

    if (activeServiceId.value === serviceId) {
      log(`Service ${serviceId} is already active, refocusing`);
      const wv = webviewInstances.get(serviceId);
      if (wv) {
        try {
          if (rightPanelWasOpen) await wv.show();
          await wv.setFocus();
        } catch (e) { log(`Refocus failed: ${e}`); }
      }
      return;
    }

    // Clear previous error
    errorMessages.delete(serviceId);

    // For built-in chat services, just switch active state (no webview)
    if (service.type === 'chat') {
      // Hide previous webview if any
      if (activeServiceId.value) {
        const prevWv = webviewInstances.get(activeServiceId.value);
        if (prevWv) {
          try { await prevWv.hide(); } catch { /* ok */ }
        }
      }
      loadedServices.delete(serviceId);
      activeServiceId.value = serviceId;
      loadingServiceId.value = null;
      log(`Switched to built-in chat: ${serviceId}`);
      return;
    }

    loadingServiceId.value = serviceId;

    // Hide previous service webview
    if (activeServiceId.value) {
      const prevId = activeServiceId.value;
      const prevWv = webviewInstances.get(prevId);
      if (prevWv) {
        try {
          await prevWv.hide();
          log(`Hidden previous service: ${prevId}`);
        } catch (e) {
          log(`Failed to hide ${prevId}: ${e}`);
          webviewInstances.delete(prevId);
        }
      }
    }

    const label = `svc_${serviceId}`;

    // Check if webview already exists in our map
    let wv: Webview | undefined = webviewInstances.get(serviceId);
    if (wv) {
      log(`Found existing webview for ${serviceId}`);
    }

    // Also check via Tauri API
    if (!wv) {
      try {
        const existing = await Webview.getByLabel(label);
        if (existing) {
          wv = existing;
          webviewInstances.set(serviceId, wv);
          log(`Recovered existing webview: ${label}`);
        }
      } catch (e) {
        log(`getByLabel error (expected if not created): ${e}`);
      }
    }

    if (wv) {
      // Show existing webview and resize
      try {
        await resizeWebview(wv);
        await wv.show();
        await wv.setFocus();
        log(`Re-showed existing webview: ${label}`);
      } catch (e) {
        log(`Failed to show existing webview: ${e}`);
        webviewInstances.delete(serviceId);
        loadedServices.delete(serviceId);
        wv = undefined;
      }
    }

    if (!wv) {
      // Create new webview
      try {
        const mainWindow = getCurrentWindow();
        const size = await mainWindow.innerSize();
        const scaleFactor = await mainWindow.scaleFactor();
        const logical = size.toLogical(scaleFactor);
        const titlebarHeight = 36;
        const contentWidth = logical.width - sidebarWidth.value - rightSidebarWidth;
        const contentHeight = logical.height - titlebarHeight;

        log(`Creating webview "${label}" → ${service.url}`);
        log(`Window size: ${logical.width}x${logical.height}, Content area: ${contentWidth}x${contentHeight}, Offset: ${sidebarWidth.value}`);

        const newWv = new Webview(mainWindow, label, {
          url: service.url,
          x: sidebarWidth.value,
          y: titlebarHeight,
          width: contentWidth,
          height: contentHeight,
        });

        log(`Webview constructor called for ${label}, waiting for creation event...`);

        newWv.once('tauri://created', () => {
          log(`✅ Webview CREATED successfully: ${label}`);
          webviewInstances.set(serviceId, newWv);
          loadedServices.add(serviceId);
          loadingServiceId.value = null;

          if (serviceId === 'free-draw') {
            const injectScript = () => {
              invoke('eval_js', {
                label,
                script: `
                  (function() {
                    if (window.__chatplexKeyInjected) return;
                    window.__chatplexKeyInjected = true;
                    const key = 'sk-i12sAS7aPZw5DEwHD9uAsAZJCZEKeNwe';
                    console.log('[ChatPlex] Auto-fill script injected');

                    const lsKeys = ['apiKey', 'api_key', 'key', 'openaiKey', 'openai_key', 'openai-api-key', 'OPENAI_API_KEY', 'token', 'accessToken', 'access_token', 'siliconflow-key', 'snownk-key'];
                    lsKeys.forEach(k => { try { localStorage.setItem(k, key); } catch(e){} });
                    try { localStorage.setItem('settings', JSON.stringify({ apiKey: key, key: key, token: key })); } catch(e){}

                    const setNative = (el, val) => {
                      const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
                      const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
                      setter.call(el, val);
                      el.dispatchEvent(new Event('input', { bubbles: true }));
                      el.dispatchEvent(new Event('change', { bubbles: true }));
                      el.dispatchEvent(new Event('blur', { bubbles: true }));
                    };

                    const tryFill = () => {
                      const fields = document.querySelectorAll('input, textarea');
                      let filled = 0;
                      for (const el of fields) {
                        const t = (el.type || '').toLowerCase();
                        if (t === 'submit' || t === 'button' || t === 'checkbox' || t === 'radio' || t === 'file') continue;
                        const ph = (el.placeholder || '').toLowerCase();
                        const name = (el.name || '').toLowerCase();
                        const id = (el.id || '').toLowerCase();
                        const cls = (el.className || '').toLowerCase();
                        const lbl = (el.getAttribute('aria-label') || '').toLowerCase();
                        const blob = ph + ' ' + name + ' ' + id + ' ' + cls + ' ' + lbl;
                        if (blob.includes('key') || blob.includes('token') || blob.includes('api') || blob.includes('密钥') || blob.includes('密码') || t === 'password') {
                          console.log('[ChatPlex] Filling field:', el);
                          setNative(el, key);
                          filled++;
                        }
                      }
                      return filled;
                    };

                    const filled = tryFill();
                    console.log('[ChatPlex] Initial fill count:', filled);

                    const obs = new MutationObserver(() => { tryFill(); });
                    obs.observe(document.body, { childList: true, subtree: true });
                    setTimeout(() => obs.disconnect(), 15000);
                  })();
                `,
              }).catch((e) => log(`eval_js failed: ${e}`));
            };
            setTimeout(injectScript, 1500);
            setTimeout(injectScript, 4000);
          }
        });

        newWv.once('tauri://error', (e: unknown) => {
          const errMsg = e instanceof Error ? e.message : JSON.stringify(e);
          log(`❌ Webview ERROR for ${label}: ${errMsg}`);
          errorMessages.set(serviceId, errMsg);
          webviewInstances.delete(serviceId);
          loadedServices.delete(serviceId);
          loadingServiceId.value = null;
          if (activeServiceId.value === serviceId) {
            activeServiceId.value = null;
          }
        });

        // Optimistically track it
        webviewInstances.set(serviceId, newWv);
        loadedServices.add(serviceId);

      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        log(`❌ Exception creating webview for ${serviceId}: ${errMsg}`);
        errorMessages.set(serviceId, errMsg);
        loadingServiceId.value = null;
        return;
      }
    }

    activeServiceId.value = serviceId;
    loadingServiceId.value = null;
    log(`Active service set to: ${serviceId}`);
  }

  async function closeService(serviceId: string) {
    log(`Closing service: ${serviceId}`);
    const wv = webviewInstances.get(serviceId);
    if (wv) {
      try { await wv.close(); } catch { /* already closed */ }
      webviewInstances.delete(serviceId);
    }
    loadedServices.delete(serviceId);
    errorMessages.delete(serviceId);
    if (activeServiceId.value === serviceId) {
      activeServiceId.value = null;
    }
  }

  async function refreshService(serviceId: string) {
    log(`Refreshing service: ${serviceId}`);
    // For chat-type services, bump the refresh key to trigger re-fetch
    const store = useAppStore()
    const service = SERVICES.find(s => s.id === serviceId)
      || store.customServices.find(s => s.id === serviceId);
    if (service?.type === 'chat') {
      chatRefreshKey.value++;
      return;
    }
    // For webview services: close and reopen
    const wv = webviewInstances.get(serviceId);
    if (wv) {
      try { await wv.close(); } catch { /* already closed */ }
      webviewInstances.delete(serviceId);
      loadedServices.delete(serviceId);
    }
    if (activeServiceId.value === serviceId) {
      activeServiceId.value = null;
    }
    await openService(serviceId);
  }

  async function resizeWebview(wv: Webview) {
    try {
      const mainWindow = getCurrentWindow();
      const size = await mainWindow.innerSize();
      const scaleFactor = await mainWindow.scaleFactor();
      const logical = size.toLogical(scaleFactor);
      const titlebarHeight = 36;
      const contentWidth = logical.width - sidebarWidth.value - rightSidebarWidth;
      const contentHeight = logical.height - titlebarHeight;
      await wv.setPosition(new LogicalPosition(sidebarWidth.value, titlebarHeight));
      await wv.setSize(new LogicalSize(contentWidth, contentHeight));
    } catch (e) {
      log(`resizeWebview error: ${e}`);
    }
  }

  async function resizeAllServices() {
    for (const [serviceId, wv] of webviewInstances.entries()) {
      try {
        await resizeWebview(wv);
        if (serviceId === activeServiceId.value) {
          await wv.show();
          await wv.setFocus();
        } else {
          await wv.hide();
        }
      } catch {
        log(`resizeAllServices error for ${serviceId}`);
      }
    }
  }

  function handleWindowResize() {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => resizeAllServices(), 100);
  }

  function toggleSidebar() {
    sidebarExpanded.value = !sidebarExpanded.value;
    sidebarWidth.value = sidebarExpanded.value ? 200 : 56;
    setTimeout(() => resizeAllServices(), 300);
  }

  function clearError(serviceId: string) {
    errorMessages.delete(serviceId);
  }

  function toggleDebug() {
    showDebug.value = !showDebug.value;
  }

  function setRegion(region: ServiceRegion) {
    activeRegion.value = region;
  }

  function setCategory(category: ServiceCategory) {
    activeCategory.value = category;
  }

  async function toggleRightPanel(panelId: string) {
    if (activeRightPanel.value === panelId) {
      activeRightPanel.value = null;
      if (activeServiceId.value) {
        const wv = webviewInstances.get(activeServiceId.value);
        if (wv) {
          try { await wv.show(); await wv.setFocus(); } catch { /* ok */ }
        }
      }
    } else {
      activeRightPanel.value = panelId;
      if (activeServiceId.value) {
        const wv = webviewInstances.get(activeServiceId.value);
        if (wv) { try { await wv.hide(); } catch { /* ok */ } }
      }
    }
  }

  async function hideActiveWebview() {
    if (!activeServiceId.value) return;
    const wv = webviewInstances.get(activeServiceId.value);
    if (wv) { try { await wv.hide(); } catch { /* ok */ } }
  }

  async function showActiveWebview() {
    if (!activeServiceId.value || activeRightPanel.value) return;
    const wv = webviewInstances.get(activeServiceId.value);
    if (wv) { try { await wv.show(); await wv.setFocus(); } catch { /* ok */ } }
  }

  return {
    activeServiceId,
    loadedServices,
    loadingServiceId,
    errorMessages,
    sidebarWidth,
    sidebarExpanded,
    activeRightPanel,
    debugLogs,
    showDebug,
    activeRegion,
    activeCategory,
    filteredServices,
    chatRefreshKey,
    openService,
    closeService,
    refreshService,
    resizeAllServices,
    handleWindowResize,
    toggleSidebar,
    toggleRightPanel,
    hideActiveWebview,
    showActiveWebview,
    clearError,
    toggleDebug,
    setRegion,
    setCategory,
  };
}
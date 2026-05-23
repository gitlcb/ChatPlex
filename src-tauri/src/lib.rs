use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use tauri::Emitter;
use regex::Regex;
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use std::path::PathBuf;
use std::sync::mpsc::sync_channel;

#[derive(Deserialize)]
struct ChatRequest {
    url: String,
    api_key: String,
    model: String,
    messages: Vec<serde_json::Value>,
    #[serde(default)]
    api_type: String,  // "openai" (default) or "anthropic"
}

#[derive(Clone, Serialize)]
struct StreamChunk {
    content: String,
    is_reasoning: bool,
}

#[derive(Clone, Serialize)]
struct StreamDone {
    done: bool,
}

#[derive(Deserialize)]
struct ServiceWebviewOptions {
    label: String,
    url: String,
    theme: Option<String>,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
}

#[derive(Clone, Serialize)]
struct ServiceDownloadEvent {
    status: String,
    url: String,
    file_name: Option<String>,
    path: Option<String>,
    success: Option<bool>,
    message: Option<String>,
}

#[derive(Clone, Serialize)]
struct ServiceNavigationEvent {
    label: String,
    url: String,
}

fn path_to_string(path: &PathBuf) -> String {
    path.to_string_lossy().to_string()
}

fn suggested_download_filename(url: &tauri::Url, destination: &PathBuf) -> String {
    destination
        .file_name()
        .and_then(|name| name.to_str())
        .filter(|name| !name.trim().is_empty())
        .map(ToString::to_string)
        .or_else(|| {
            url.path_segments()
                .and_then(|mut segments| segments.next_back())
                .filter(|name| !name.trim().is_empty())
                .map(ToString::to_string)
        })
        .unwrap_or_else(|| "download".to_string())
}

fn webview_theme_script(theme: &str) -> String {
    let is_dark = theme == "dark";
    format!(
        r#"
(function() {{
  var isDark = {is_dark};
  function applyTheme() {{
    try {{
      document.documentElement.dataset.chatplexTheme = isDark ? 'dark' : 'light';
      document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
      if (document.body) document.body.style.colorScheme = isDark ? 'dark' : 'light';
    }} catch (_) {{}}
  }}

  if (!window.__chatplexThemeBridgeInstalled) {{
    window.__chatplexThemeBridgeInstalled = true;
    var nativeMatchMedia = window.matchMedia ? window.matchMedia.bind(window) : null;
    var themeListeners = [];
    window.__chatplexThemeBridgeState = {{ isDark: isDark, listeners: themeListeners }};

    window.matchMedia = function(query) {{
      if (typeof query === 'string' && query.indexOf('prefers-color-scheme') !== -1) {{
        var wantsDark = query.indexOf('dark') !== -1;
        var media = {{
          media: query,
          matches: wantsDark === window.__chatplexThemeBridgeState.isDark,
          onchange: null,
          addEventListener: function(type, listener) {{
            if (type === 'change' && themeListeners.indexOf(listener) === -1) themeListeners.push(listener);
          }},
          removeEventListener: function(type, listener) {{
            if (type !== 'change') return;
            var index = themeListeners.indexOf(listener);
            if (index >= 0) themeListeners.splice(index, 1);
          }},
          addListener: function(listener) {{
            if (themeListeners.indexOf(listener) === -1) themeListeners.push(listener);
          }},
          removeListener: function(listener) {{
            var index = themeListeners.indexOf(listener);
            if (index >= 0) themeListeners.splice(index, 1);
          }},
          dispatchEvent: function() {{ return true; }}
        }};
        return media;
      }}
      return nativeMatchMedia ? nativeMatchMedia(query) : {{
        media: query,
        matches: false,
        addEventListener: function() {{}},
        removeEventListener: function() {{}},
        addListener: function() {{}},
        removeListener: function() {{}},
        dispatchEvent: function() {{ return true; }}
      }};
    }};

    window.__chatplexSetTheme = function(nextTheme) {{
      var nextIsDark = nextTheme === 'dark';
      if (window.__chatplexThemeBridgeState.isDark === nextIsDark) {{
        applyTheme();
        return;
      }}
      window.__chatplexThemeBridgeState.isDark = nextIsDark;
      isDark = nextIsDark;
      applyTheme();
      var listeners = window.__chatplexThemeBridgeState.listeners.slice();
      listeners.forEach(function(listener) {{
        try {{
          listener({{
            media: '(prefers-color-scheme: dark)',
            matches: nextIsDark
          }});
        }} catch (_) {{}}
      }});
    }};
  }} else if (window.__chatplexSetTheme) {{
    window.__chatplexSetTheme(isDark ? 'dark' : 'light');
  }}

  if (document.readyState === 'loading') {{
    document.addEventListener('DOMContentLoaded', applyTheme, {{ once: true }});
  }}
  applyTheme();
}})();
"#,
        is_dark = if is_dark { "true" } else { "false" }
    )
}

#[tauri::command]
async fn chat_stream(app: tauri::AppHandle, req: ChatRequest) -> Result<(), String> {
    let api_type = if req.api_type.is_empty() { "openai" } else { &req.api_type };
    eprintln!("[chat_stream] type={}, url={}, model={}, msgs={}", api_type, req.url, req.model, req.messages.len());
    let client = reqwest::Client::new();

    let is_anthropic = api_type == "anthropic";

    let body = if is_anthropic {
        serde_json::json!({
            "model": req.model,
            "messages": req.messages,
            "stream": true,
            "max_tokens": 4096,
        })
    } else {
        serde_json::json!({
            "model": req.model,
            "messages": req.messages,
            "stream": true,
        })
    };

    let base = req.url.trim_end_matches('/');
    let url = if is_anthropic {
        if base.contains("/v1") {
            format!("{}/messages", base)
        } else {
            format!("{}/v1/messages", base)
        }
    } else {
        if base.contains("/v1") {
            format!("{}/chat/completions", base)
        } else {
            format!("{}/v1/chat/completions", base)
        }
    };

    let mut request = client.post(&url)
        .header("Content-Type", "application/json")
        .body(serde_json::to_string(&body).map_err(|e| e.to_string())?);

    if is_anthropic {
        request = request
            .header("x-api-key", &req.api_key)
            .header("anthropic-version", "2023-06-01");
    } else {
        request = request.header("Authorization", format!("Bearer {}", req.api_key));
    }

    let response = request.send().await
        .map_err(|e| format!("请求失败: {}", e))?;

    eprintln!("[chat_stream] Response status: {}", response.status());

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("HTTP {}: {}", status, text));
    }

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();
    let mut current_event: Option<String> = None;

    while let Some(chunk_result) = stream.next().await {
        let chunk = chunk_result.map_err(|e| format!("读取流失败: {}", e))?;
        buffer.push_str(&String::from_utf8_lossy(&chunk));

        while let Some(newline_pos) = buffer.find('\n') {
            let line = buffer[..newline_pos].trim().to_string();
            buffer = buffer[newline_pos + 1..].to_string();

            if is_anthropic {
                if line.starts_with("event: ") {
                    current_event = Some(line[7..].trim().to_string());
                } else if line.starts_with("data: ") {
                    let data = &line[6..];
                    let ev = current_event.as_deref().unwrap_or("");
                    match ev {
                        "message_stop" => {
                            let _ = app.emit("chat-stream-done", StreamDone { done: true });
                            return Ok(());
                        }
                        "content_block_delta" => {
                            if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(data) {
                                if let Some(text) = parsed["delta"]["text"].as_str() {
                                    if !text.is_empty() {
                                        let _ = app.emit("chat-stream-chunk", StreamChunk {
                                            content: text.to_string(),
                                            is_reasoning: false,
                                        });
                                    }
                                }
                            }
                        }
                        _ => {}
                    }
                }
            } else {
                if line.starts_with("data: ") {
                    let data = &line[6..];
                    if data == "[DONE]" {
                        let _ = app.emit("chat-stream-done", StreamDone { done: true });
                        return Ok(());
                    }
                    if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(data) {
                        if let Some(delta) = parsed["choices"][0]["delta"].as_object() {
                            if let Some(reasoning) = delta.get("reasoning_content").and_then(|v| v.as_str()) {
                                if !reasoning.is_empty() {
                                    let _ = app.emit("chat-stream-chunk", StreamChunk {
                                        content: reasoning.to_string(),
                                        is_reasoning: true,
                                    });
                                }
                            }
                            if let Some(text) = delta.get("content").and_then(|v| v.as_str()) {
                                if !text.is_empty() {
                                    let _ = app.emit("chat-stream-chunk", StreamChunk {
                                        content: text.to_string(),
                                        is_reasoning: false,
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    let _ = app.emit("chat-stream-done", StreamDone { done: true });
    Ok(())
}

#[tauri::command]
async fn eval_js(app: tauri::AppHandle, label: String, script: String) -> Result<(), String> {
    use tauri::Manager;
    let wv = app.get_webview(&label).ok_or("webview not found")?;
    wv.eval(&script).map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_service_webview(app: tauri::AppHandle, options: ServiceWebviewOptions) -> Result<(), String> {
    use tauri::webview::{DownloadEvent, WebviewBuilder};
    use tauri::{LogicalPosition, LogicalSize, Manager, WebviewUrl};

    let window = app.get_window("main").ok_or("main window not found")?;
    let url = options
        .url
        .parse()
        .map_err(|e| format!("invalid service url: {}", e))?;

    let download_app_handle = app.clone();
    let navigation_app_handle = app.clone();
    let navigation_label = options.label.clone();
    let theme = options.theme.as_deref().unwrap_or("light");
    let builder = WebviewBuilder::new(&options.label, WebviewUrl::External(url))
        .initialization_script_for_all_frames(webview_theme_script(theme))
        .on_navigation(move |url| {
            let _ = navigation_app_handle.emit("service-navigation", ServiceNavigationEvent {
                label: navigation_label.clone(),
                url: url.to_string(),
            });
            true
        })
        .on_download(move |_webview, event| {
            match event {
                DownloadEvent::Requested { url, destination } => {
                    eprintln!("[service_webview_download] requested: {}", url);
                    let file_name = suggested_download_filename(&url, destination);
                    let dialog_file_name = file_name.clone();
                    let _ = download_app_handle.emit("service-download", ServiceDownloadEvent {
                        status: "requested".to_string(),
                        url: url.to_string(),
                        file_name: Some(file_name.clone()),
                        path: None,
                        success: None,
                        message: Some("正在选择下载保存位置".to_string()),
                    });
                    let starting_directory = destination.parent().map(PathBuf::from);
                    let (tx, rx) = sync_channel(1);

                    std::thread::spawn(move || {
                        let mut dialog = rfd::FileDialog::new()
                            .set_title("选择下载保存位置")
                            .set_file_name(dialog_file_name);

                        if let Some(directory) = starting_directory {
                            dialog = dialog.set_directory(directory);
                        }

                        let _ = tx.send(dialog.save_file());
                    });

                    match rx.recv() {
                        Ok(Some(path)) => {
                            eprintln!("[service_webview_download] destination: {:?}", path);
                            let _ = download_app_handle.emit("service-download", ServiceDownloadEvent {
                                status: "selected".to_string(),
                                url: url.to_string(),
                                file_name: path.file_name().and_then(|name| name.to_str()).map(ToString::to_string),
                                path: Some(path_to_string(&path)),
                                success: None,
                                message: Some("下载保存位置已选择".to_string()),
                            });
                            *destination = path;
                            true
                        }
                        Ok(None) => {
                            eprintln!("[service_webview_download] canceled: {}", url);
                            let _ = download_app_handle.emit("service-download", ServiceDownloadEvent {
                                status: "canceled".to_string(),
                                url: url.to_string(),
                                file_name: Some(file_name),
                                path: None,
                                success: Some(false),
                                message: Some("已取消下载".to_string()),
                            });
                            false
                        }
                        Err(err) => {
                            eprintln!("[service_webview_download] dialog failed: {}", err);
                            let _ = download_app_handle.emit("service-download", ServiceDownloadEvent {
                                status: "failed".to_string(),
                                url: url.to_string(),
                                file_name: Some(file_name),
                                path: None,
                                success: Some(false),
                                message: Some(format!("打开保存窗口失败: {}", err)),
                            });
                            false
                        }
                    }
                }
                DownloadEvent::Finished { url, path, success } => {
                    eprintln!(
                        "[service_webview_download] finished: {}, path: {:?}, success: {}",
                        url, path, success
                    );
                    let status = if success { "finished" } else { "failed" };
                    let path_string = path.as_ref().map(path_to_string);
                    let file_name = path.as_ref()
                        .and_then(|p| p.file_name())
                        .and_then(|name| name.to_str())
                        .map(ToString::to_string);
                    let message = if success { "下载完成" } else { "下载失败" };
                    let _ = download_app_handle.emit("service-download", ServiceDownloadEvent {
                        status: status.to_string(),
                        url: url.to_string(),
                        file_name,
                        path: path_string,
                        success: Some(success),
                        message: Some(message.to_string()),
                    });
                    true
                }
                _ => true,
            }
        });

    window
        .add_child(
            builder,
            LogicalPosition::new(options.x, options.y),
            LogicalSize::new(options.width, options.height),
        )
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn fetch_favicon(url: String) -> Result<Option<String>, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(8))
        .build()
        .map_err(|e| e.to_string())?;

    let origin = {
        let u = &url;
        let scheme_end = u.find("://").unwrap_or(0);
        let scheme = if scheme_end > 0 { &u[..scheme_end] } else { "https" };
        let after = if scheme_end > 0 { &u[scheme_end + 3..] } else { u };
        let host_end = after.find('/').unwrap_or(after.len());
        format!("{}://{}", scheme, &after[..host_end])
    };

    let icon_re = Regex::new(r#"<link[^>]*rel=["'](?:shortcut\s+)?(?:icon|apple-touch-icon)["'][^>]*href=["']([^"']+)["']"#).unwrap();

    let mut icon_url: Option<String> = None;

    // Step 1: Try parsing HTML for favicon links
    if let Ok(resp) = client.get(&url).send().await {
        if let Ok(html) = resp.text().await {
            for cap in icon_re.captures_iter(&html) {
                let href = &cap[1];
                icon_url = Some(if href.starts_with("http") {
                    href.to_string()
                } else if href.starts_with("//") {
                    if origin.starts_with("https") { format!("https:{}", href) }
                    else { format!("http:{}", href) }
                } else if href.starts_with('/') {
                    format!("{}{}", origin, href)
                } else {
                    format!("{}/{}", origin, href)
                });
                if href.contains(".svg") || href.contains(".png") || cap[0].contains("apple-touch-icon") {
                    break;
                }
            }
        }
    }

    // Step 2: Fallback to /favicon.ico
    if icon_url.is_none() {
        icon_url = Some(format!("{}/favicon.ico", origin));
    }

    // Step 3: Download the icon
    let icon_resp = client.get(icon_url.as_ref().unwrap()).send().await.map_err(|e| e.to_string())?;
    if !icon_resp.status().is_success() {
        return Ok(None);
    }

    let content_type = icon_resp.headers()
        .get("content-type")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("image/x-icon")
        .to_string();

    let bytes = icon_resp.bytes().await.map_err(|e| e.to_string())?;

    if bytes.len() > 256 * 1024 {
        return Ok(None);
    }

    let mime = if content_type.contains("svg") { "image/svg+xml" }
        else if content_type.contains("png") { "image/png" }
        else if content_type.contains("jpeg") || content_type.contains("jpg") { "image/jpeg" }
        else if content_type.contains("ico") || content_type.contains("icon") { "image/x-icon" }
        else if content_type.contains("gif") { "image/gif" }
        else { "image/x-icon" };

    Ok(Some(format!("data:{};base64,{}", mime, BASE64.encode(&bytes))))
}

#[tauri::command]
fn encrypt_value(value: String) -> Result<String, String> {
    Ok(value) // Placeholder - frontend uses localStorage for settings
}

#[tauri::command]
async fn decrypt_value(encrypted: String) -> Result<String, String> {
    Ok(encrypted)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            use tauri::Manager;
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.show();
                let _ = w.set_focus();
            }
        }))
        .plugin(tauri_plugin_global_shortcut::Builder::new()
            .with_handler(|app, shortcut, _event| {
                use tauri::Emitter;
                let _ = app.emit("global-shortcut", format!("{}", shortcut));
            })
            .build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![chat_stream, eval_js, create_service_webview, encrypt_value, decrypt_value, fetch_favicon])
        .setup(|app| {
            use tauri::Manager;
            use tauri::tray::{TrayIconBuilder, MouseButton, MouseButtonState, TrayIconEvent};
            use tauri::menu::{Menu, MenuItemBuilder};
            use tauri_plugin_global_shortcut::GlobalShortcutExt;
            use tauri::webview::WebviewWindowBuilder;
            
            // Create main window with download interception
            let _main_window = WebviewWindowBuilder::new(app, "main", tauri::WebviewUrl::App("index.html".into()))
                .title("ChatPlex")
                .inner_size(1328.0, 800.0)
                .min_inner_size(848.0, 600.0)
                .center()
                .decorations(false)
                .shadow(true)
                .on_download(|_webview, _event| {
                    true // Allow system download dialog
                })
                .build()?;

            // Register global shortcuts
            let gs = app.global_shortcut();
            let _ = gs.on_shortcuts(["ctrl+n", "ctrl+/", "ctrl+,"], |app, shortcut, _event| {
                use tauri::Emitter;
                let _ = app.emit("global-shortcut", format!("{}", shortcut));
            });

            // System tray
            let show_item = MenuItemBuilder::with_id("show", "显示主窗口").build(app)?;
            let quit_item = MenuItemBuilder::with_id("quit", "退出").build(app)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("ChatPlex - AI 一站式对话")
                .on_menu_event(move |app, event| {
                    match event.id().as_ref() {
                        "show" => {
                            if let Some(w) = app.get_webview_window("main") {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
                        let app = tray.app_handle();
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                })
                .build(app)?;

            // Hide to tray on close instead of quitting
            if let Some(window) = app.get_webview_window("main") {
                let window_clone = window.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = window_clone.hide();
                    }
                });
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

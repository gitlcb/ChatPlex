use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use tauri::Emitter;
use regex::Regex;
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};

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
        .invoke_handler(tauri::generate_handler![chat_stream, eval_js, encrypt_value, decrypt_value, fetch_favicon])
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

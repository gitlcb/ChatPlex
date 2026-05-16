use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use tauri::Emitter;

#[derive(Deserialize)]
struct ChatRequest {
    url: String,
    api_key: String,
    model: String,
    messages: Vec<serde_json::Value>,
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
    eprintln!("[chat_stream] Called with url={}, model={}, msgs={}", req.url, req.model, req.messages.len());
    let client = reqwest::Client::new();

    let body = serde_json::json!({
        "model": req.model,
        "messages": req.messages,
        "stream": true,
    });

    let response = client
        .post(format!("{}/chat/completions", req.url))
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", req.api_key))
        .body(serde_json::to_string(&body).map_err(|e| e.to_string())?)
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    eprintln!("[chat_stream] Response status: {}", response.status());

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("HTTP {}: {}", status, text));
    }

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();

    while let Some(chunk_result) = stream.next().await {
        let chunk = chunk_result.map_err(|e| format!("读取流失败: {}", e))?;
        buffer.push_str(&String::from_utf8_lossy(&chunk));

        while let Some(newline_pos) = buffer.find('\n') {
            let line = buffer[..newline_pos].trim().to_string();
            buffer = buffer[newline_pos + 1..].to_string();

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
fn encrypt_value(value: String) -> Result<String, String> {
    Ok(value) // Placeholder - frontend uses localStorage for settings
}

#[tauri::command]
fn decrypt_value(encrypted: String) -> Result<String, String> {
    Ok(encrypted)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            use tauri::Manager;
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.show();
                let _ = w.set_focus();
            }
        }))
        .plugin(tauri_plugin_global_shortcut::Builder::new()
            .with_shortcuts(["ctrl+n", "ctrl+/", "ctrl+,"]).unwrap()
            .with_handler(|app, shortcut, _event| {
                use tauri::Emitter;
                let _ = app.emit("global-shortcut", format!("{}", shortcut));
            })
            .build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![chat_stream, eval_js, encrypt_value, decrypt_value])
        .setup(|app| {
            // Hide to tray on close instead of quitting
            use tauri::Manager;
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

<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js/lib/core'
import 'highlight.js/styles/github-dark.css'

// Register common languages
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import rust from 'highlight.js/lib/languages/rust'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import css from 'highlight.js/lib/languages/css'
import html from 'highlight.js/lib/languages/xml'
import go from 'highlight.js/lib/languages/go'
import java from 'highlight.js/lib/languages/java'
import sql from 'highlight.js/lib/languages/sql'
import yaml from 'highlight.js/lib/languages/yaml'
import cpp from 'highlight.js/lib/languages/cpp'
import csharp from 'highlight.js/lib/languages/csharp'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('py', python)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('sh', bash)
hljs.registerLanguage('shell', bash)
hljs.registerLanguage('json', json)
hljs.registerLanguage('css', css)
hljs.registerLanguage('html', html)
hljs.registerLanguage('xml', html)
hljs.registerLanguage('go', go)
hljs.registerLanguage('java', java)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('yml', yaml)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('c', cpp)
hljs.registerLanguage('csharp', csharp)
hljs.registerLanguage('cs', csharp)

const props = defineProps<{
  content: string
  highlight?: string
}>()

const renderer = new marked.Renderer()

renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
  const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
  let highlighted: string
  try {
    highlighted = hljs.highlight(text, { language }).value
  } catch {
    highlighted = text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
  const codeId = 'code-' + Math.random().toString(36).slice(2, 8)
  return `<div class="code-block"><div class="code-header"><span class="code-lang">${language}</span><button class="copy-btn" onclick="(function(btn){const el=document.getElementById('${codeId}');navigator.clipboard.writeText(el.textContent);btn.textContent='已复制';setTimeout(()=>btn.textContent='复制',1500)})(this)">复制</button></div><pre><code id="${codeId}" class="hljs ${language}">${highlighted}</code></pre></div>`
}

marked.setOptions({ renderer, breaks: true, gfm: true })

const rendered = computed(() => {
  let html = marked.parse(props.content) as string
  // Highlight search term if provided
  if (props.highlight) {
    const escaped = props.highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    html = html.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="search-highlight">$1</mark>')
  }
  return html
})
</script>

<template>
  <div class="markdown-body" v-html="rendered"></div>
</template>

<style>
.markdown-body { line-height: 1.75; font-size: 14px; color: var(--chat-text, #e2e8f0); }
.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4 { margin: 16px 0 8px; font-weight: 600; }
.markdown-body h1 { font-size: 20px; }
.markdown-body h2 { font-size: 18px; }
.markdown-body h3 { font-size: 16px; }
.markdown-body p { margin: 6px 0; }
.markdown-body ul, .markdown-body ol { margin: 8px 0; padding-left: 24px; }
.markdown-body li { margin: 3px 0; }
.markdown-body blockquote { border-left: 3px solid var(--accent, #334155); padding: 4px 12px; margin: 8px 0; color: var(--text-secondary, #94a3b8); background: var(--bg-secondary, #1e293b); border-radius: 0 6px 6px 0; }
.markdown-body table { border-collapse: collapse; margin: 8px 0; width: 100%; font-size: 13px; }
.markdown-body th, .markdown-body td { border: 1px solid var(--border-color, #1e293b); padding: 6px 10px; text-align: left; }
.markdown-body th { background: var(--bg-secondary, #1e293b); font-weight: 600; }
.markdown-body a { color: #60a5fa; text-decoration: none; }
.markdown-body a:hover { text-decoration: underline; }
.markdown-body hr { border: none; border-top: 1px solid var(--border-color, #1e293b); margin: 12px 0; }
.markdown-body img { max-width: 100%; border-radius: 8px; margin: 8px 0; }
.markdown-body :not(pre) > code { background: var(--bg-secondary, #1e293b); padding: 1px 6px; border-radius: 4px; color: #f472b6; font-size: 13px; font-family: 'Cascadia Code', monospace; }

.code-block { margin: 10px 0; border-radius: 10px; overflow: hidden; border: 1px solid var(--border-color, #1e293b); }
.code-header { display: flex; align-items: center; justify-content: space-between; padding: 6px 12px; background: var(--bg-tertiary, #161b22); border-bottom: 1px solid var(--border-color, #1e293b); }
.code-lang { font-size: 12px; color: var(--text-secondary, #94a3b8); font-family: monospace; }
.copy-btn { font-size: 11px; color: var(--text-secondary, #94a3b8); background: none; border: 1px solid var(--border-color, #334155); border-radius: 4px; padding: 2px 8px; cursor: pointer; transition: all 0.15s; }
.copy-btn:hover { background: var(--bg-secondary, #1e293b); color: var(--text-primary, #e2e8f0); }
.code-block pre { margin: 0; padding: 12px 14px; background: var(--code-bg, #0d1117); overflow-x: auto; }
.code-block code { font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace; font-size: 13px; line-height: 1.6; }

.search-highlight { background: rgba(250, 204, 21, 0.3); color: inherit; border-radius: 2px; padding: 0 1px; }
</style>

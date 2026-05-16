type ModelType = 'chat' | 'chatimages';

// Explicit multimodal models (supports image input)
const MULTIMODAL_MODELS: Set<string> = new Set([
  // ===== OpenAI =====
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4o-2024-05-13',
  'gpt-4o-2024-08-06',
  'gpt-4o-2024-11-20',
  'gpt-4o-mini-2024-07-18',
  'gpt-4-turbo',
  'gpt-4-turbo-2024-04-09',
  'gpt-4-vision-preview',
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-4.1-nano',
  'gpt-4.5-preview',
  'gpt-5',
  'gpt-5-mini',
  'gpt-5.1-codex-max',
  'gpt-5.2',
  'gpt-5.2-codex',
  'gpt-5.3-codex',
  'gpt-5.3-codex-spark',
  'gpt-5.4',
  'gpt-5.4-mini',
  'gpt-5.4-nano',
  'gpt-5.5',
  'gpt-5.5-pro',
  'o1',
  'o1-mini',
  'o1-pro',
  'o3',
  'o3-mini',
  'o3-pro',
  'o4-mini',

  // ===== Anthropic Claude =====
  'claude-3-opus-20240229',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307',
  'claude-3-5-sonnet-20240620',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'claude-4-opus',
  'claude-4-sonnet',
  'claude-opus-4',
  'claude-sonnet-4',
  'claude-opus-4-7',
  'claude-sonnet-4-6',
  'claude-haiku-4-5',

  // ===== Google Gemini =====
  'gemini-pro-vision',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.5-pro-latest',
  'gemini-1.5-flash-latest',
  'gemini-2.0-flash',
  'gemini-2.0-flash-exp',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-pro-preview',
  'gemini-2.5-flash-preview',

  // ===== DeepSeek (multimodal) =====
  'deepseek-v4-vision',

  // ===== Xiaomi MiMo =====
  'mimo-v2.5',

  // ===== Qwen (multimodal) =====
  'qwen-vl-plus',
  'qwen-vl-max',
  'qwen-vl-plus-latest',
  'qwen-vl-max-latest',
  'qwen2-vl-72b-instruct',
  'qwen2-vl-7b-instruct',
  'qwen2.5-vl-72b-instruct',
  'qwen2.5-vl-32b-instruct',
  'qwen2.5-vl-7b-instruct',
  'qwen2.5-vl-3b-instruct',
  'qwen2.5-omni-7b',
  'qwen3.5-27b',
  'qwen3.5-plus',
  'qwen3.6-27b',
  'qwen3.6-35b-a3b',
  'qwen3.6-max',
  'qwen3.6-max-preview',
  'qvq-72b-preview',

  // ===== GLM / Z.ai (multimodal) =====
  'glm-4v',
  'glm-4v-plus',
  'glm-4v-flash',
  'glm-4.1v',
  'glm-4.5v',
  'glm-4.6v',
  'glm-4.6v-flash',
  'glm-4.6v-thinking',
  'glm-5v-turbo',

  // ===== xAI Grok =====
  'grok-2-vision',
  'grok-2-vision-latest',
  'grok-3',
  'grok-3-latest',
  'grok-3-mini',
  'grok-3-vision',
  'grok-4',

  // ===== Kimi / Moonshot (multimodal) =====
  'kimi-k2.6',
  'kimi-k2.6-thinking',
  'moonshot-v1-vision',

  // ===== MiniMax (multimodal) =====
  'minimax-m2.7',
  'm2.7-highspeed',

  // ===== Doubao (multimodal) =====
  'doubao-vision-pro-32k',
  'doubao-vision-pro-128k',
  'doubao-1.5-vision-pro-32k',
  'doubao-1.5-vision-pro-128k',
  'doubao-1.6-vision-pro-32k',

  // ===== Yi =====
  'yi-vision',
  'yi-vision-v2',

  // ===== Hunyuan =====
  'hunyuan-vision',

  // ===== InternVL =====
  'internvl2-26b',
  'internvl2-pro',
  'internvl2.5-78b',
  'internvl3-78b',

  // ===== Step (阶跃星辰) =====
  'step-1v-8k',
  'step-1v-32k',
  'step-2v',

  // ===== Spark =====
  'spark-vision-pro',
]);

// Pattern-based detection for model families
const MULTIMODAL_PATTERNS: RegExp[] = [
  /vision/i,
  /\bvl\b/i,
  /-vl-/i,
  /^gpt-4o/i,
  /^gpt-4-turbo/i,
  /^gpt-4\.[1-9]/i,
  /^gpt-5/i,
  /^o[1-9](-|$)/i,
  /^claude-[3-9]/i,
  /^claude-(opus|sonnet|haiku)-[3-9]/i,
  /^gemini/i,
  /^grok-[3-9]/i,
  /^kimi-k2\.[5-9]/i,
  /^minimax-m2\.[5-9]/i,
  /^qwen3\.[5-9]/i,
  /omni/i,
  /^qvq/i,
  /^internvl/i,
  /^step-.*v/i,
  /^glm-\d+v/i,
  /^glm-\d+\.\d+v/i,
];

// Explicit text-only overrides (match multimodal patterns but are actually text-only)
const TEXT_ONLY_MODELS: Set<string> = new Set([
  // ===== DeepSeek =====
  'deepseek-v4-flash',
  'deepseek-v4-pro',
  'deepseek-v3',
  'deepseek-chat',
  'deepseek-coder',
  'deepseek-reasoner',
  'deepseek-r1',
  'deepseek-r1-lite',

  // ===== Xiaomi MiMo =====
  'mimo-v2.5-pro',

  // ===== OpenAI text-only =====
  'gpt-3.5-turbo',
  'gpt-3.5-turbo-16k',
  'gpt-4',
  'gpt-4-32k',

  // ===== Qwen text-only =====
  'qwen-turbo',
  'qwen-turbo-latest',
  'qwen-plus',
  'qwen-plus-latest',
  'qwen-max',
  'qwen-max-latest',
  'qwen-long',
  'qwen3-235b-a22b',
  'qwen3-32b',
  'qwen3-14b',
  'qwen3-8b',
  'qwen3-4b',
  'qwen3-1.7b',
  'qwen3-0.6b',
  'qwen2.5-72b-instruct',
  'qwen2.5-32b-instruct',
  'qwen2.5-coder-32b-instruct',

  // ===== GLM / Z.ai text-only =====
  'glm-4',
  'glm-4-flash',
  'glm-4-long',
  'glm-4-plus',
  'glm-4.6',
  'glm-4.6-flash',
  'glm-5',
  'glm-5.1',

  // ===== Kimi / Moonshot text-only =====
  'moonshot-v1-8k',
  'moonshot-v1-32k',
  'moonshot-v1-128k',
  'kimi-latest',
  'kimi-k2',
  'kimi-k2-0711',

  // ===== Doubao text-only =====
  'doubao-pro-32k',
  'doubao-pro-128k',
  'doubao-pro-256k',
  'doubao-lite-32k',
  'doubao-lite-128k',
  'doubao-1.5-pro-32k',
  'doubao-1.5-pro-128k',
  'doubao-1.5-pro-256k',
  'doubao-1.6-pro-32k',

  // ===== Yi text-only =====
  'yi-large',
  'yi-large-turbo',
  'yi-medium',
  'yi-spark',

  // ===== Hunyuan text-only =====
  'hunyuan-pro',
  'hunyuan-standard',
  'hunyuan-lite',
  'hunyuan-turbo',

  // ===== Baichuan =====
  'baichuan-turbo',
  'baichuan-pro',
  'baichuan4',

  // ===== MiniMax text-only =====
  'abab6.5s-chat',
  'abab7-chat',

  // ===== Spark text-only =====
  'spark-pro',
  'spark-max',
  'spark-ultra',
  'spark-lite',

  // ===== Misc =====
  'llama-3.1-405b',
  'llama-3.1-70b',
  'llama-3.3-70b',
  'llama-4-maverick',
  'llama-4-scout',
  'mixtral-8x7b',
  'mixtral-8x22b',
  'mistral-large',
  'mistral-medium',
  'command-r-plus',
  'command-r',
]);

export function getModelType(modelId: string): ModelType {
  const id = modelId.toLowerCase();
  if (TEXT_ONLY_MODELS.has(id)) return 'chat';
  if (MULTIMODAL_MODELS.has(id)) return 'chatimages';
  for (const pattern of MULTIMODAL_PATTERNS) {
    if (pattern.test(id)) return 'chatimages';
  }
  return 'chat';
}
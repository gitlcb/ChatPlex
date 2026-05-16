export type ServiceRegion = 'domestic' | 'international';
export type ServiceCategory = 'chat' | 'visual';
export type ServiceType = 'webview' | 'chat';

export interface AIService {
  id: string;
  name: string;
  url: string;
  icon: string;
  color: string;
  description: string;
  region: ServiceRegion;
  category: ServiceCategory;
  type?: ServiceType;
}

export const SERVICES: AIService[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    url: 'https://chat.deepseek.com',
    icon: '🔮',
    color: '#4D6BFE',
    description: 'DeepSeek 深度求索',
    region: 'domestic',
    category: 'chat',
  },
  {
    id: 'kimi',
    name: 'Kimi',
    url: 'https://kimi.moonshot.cn',
    icon: '🌙',
    color: '#6366F1',
    description: 'Kimi 月之暗面',
    region: 'domestic',
    category: 'chat',
  },
  {
    id: 'tongyi',
    name: '通义千问',
    url: 'https://tongyi.aliyun.com/qianwen',
    icon: '💬',
    color: '#FF6A00',
    description: '阿里通义千问',
    region: 'domestic',
    category: 'chat',
  },
  {
    id: 'doubao',
    name: '豆包',
    url: 'https://www.doubao.com',
    icon: '☀️',
    color: '#FE2C55',
    description: '字节跳动豆包',
    region: 'domestic',
    category: 'chat',
  },
  {
    id: 'chatglm',
    name: '智谱清言',
    url: 'https://chatglm.cn',
    icon: '🧊',
    color: '#3B82F6',
    description: '智谱AI清言',
    region: 'domestic',
    category: 'chat',
  },
  {
    id: 'yiyan',
    name: '文心一言',
    url: 'https://yiyan.baidu.com',
    icon: '🎨',
    color: '#F59E0B',
    description: '百度文心一言',
    region: 'domestic',
    category: 'chat',
  },
  {
    id: 'hunyuan',
    name: '腾讯混元',
    url: 'https://aistudio.tencent.com',
    icon: '🌀',
    color: '#10B981',
    description: '腾讯混元大模型',
    region: 'domestic',
    category: 'chat',
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    url: 'https://agent.minimaxi.com',
    icon: '🤖',
    color: '#2563EB',
    description: 'MiniMax 官方对话',
    region: 'domestic',
    category: 'chat',
  },
  {
    id: 'baichuan',
    name: '百川智能',
    url: 'https://www.baichuan-ai.com/chat',
    icon: '🏔️',
    color: '#06B6D4',
    description: '百川大模型',
    region: 'domestic',
    category: 'chat',
  },
  {
    id: 'free-chat',
    name: '公益AI',
    url: '',
    icon: '🆓',
    color: '#22C55E',
    description: '免费公益AI对话',
    region: 'domestic',
    category: 'chat',
    type: 'chat',
  },
  {
    id: 'hailuo',
    name: '海螺AI',
    url: 'https://hailuoai.com',
    icon: '🐚',
    color: '#EC4899',
    description: 'MiniMax 海螺AI',
    region: 'domestic',
    category: 'visual',
  },

  // ===== 国内 + 视觉 =====
  {
    id: 'kling',
    name: '可灵AI',
    url: 'https://klingai.com/app/omni/new?ac=1',
    icon: '🎬',
    color: '#8B5CF6',
    description: '快手可灵视频生成',
    region: 'domestic',
    category: 'visual',
  },
  {
    id: 'jimeng',
    name: '即梦AI',
    url: 'https://jimeng.jianying.com/ai-tool/home',
    icon: '✏️',
    color: '#F472B6',
    description: '字节即梦图像视频',
    region: 'domestic',
    category: 'visual',
  },
  {
    id: 'free-draw',
    name: '公益绘图',
    url: 'https://images.snownk.xyz/image/',
    icon: '🎨',
    color: '#22C55E',
    description: '公益AI绘图服务',
    region: 'domestic',
    category: 'visual',
    type: 'webview',
  },

  // ===== 国际 + 对话 =====
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    url: 'https://chat.openai.com',
    icon: '💚',
    color: '#10A37F',
    description: 'OpenAI ChatGPT',
    region: 'international',
    category: 'chat',
  },
  {
    id: 'claude',
    name: 'Claude',
    url: 'https://claude.ai',
    icon: '🟤',
    color: '#D97706',
    description: 'Anthropic Claude',
    region: 'international',
    category: 'chat',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    url: 'https://gemini.google.com',
    icon: '✨',
    color: '#4285F4',
    description: 'Google Gemini',
    region: 'international',
    category: 'chat',
  },
  {
    id: 'grok',
    name: 'Grok',
    url: 'https://grok.com',
    icon: '⚫',
    color: '#1DA1F2',
    description: 'xAI Grok',
    region: 'international',
    category: 'chat',
  },
];
export interface AIService {
  id: string;
  name: string;
  url: string;
  icon: string;
  color: string;
  description: string;
}

export const SERVICES: AIService[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    url: 'https://chat.deepseek.com',
    icon: '🔮',
    color: '#4D6BFE',
    description: 'DeepSeek 深度求索',
  },
  {
    id: 'kimi',
    name: 'Kimi',
    url: 'https://kimi.moonshot.cn',
    icon: '🌙',
    color: '#6366F1',
    description: 'Kimi 月之暗面',
  },
  {
    id: 'tongyi',
    name: '通义千问',
    url: 'https://tongyi.aliyun.com/qianwen',
    icon: '💬',
    color: '#FF6A00',
    description: '阿里通义千问',
  },
  {
    id: 'doubao',
    name: '豆包',
    url: 'https://www.doubao.com',
    icon: '☀️',
    color: '#FE2C55',
    description: '字节跳动豆包',
  },
  {
    id: 'chatglm',
    name: '智谱清言',
    url: 'https://chatglm.cn',
    icon: '🧊',
    color: '#3B82F6',
    description: '智谱AI清言',
  },
  {
    id: 'yiyan',
    name: '文心一言',
    url: 'https://yiyan.baidu.com',
    icon: '🎨',
    color: '#F59E0B',
    description: '百度文心一言',
  },
  {
    id: 'hunyuan',
    name: '腾讯混元',
    url: 'https://hunyuan.tencent.com',
    icon: '🌀',
    color: '#10B981',
    description: '腾讯混元大模型',
  },
  {
    id: 'xinghuo',
    name: '讯飞星火',
    url: 'https://xinghuo.xfyun.cn',
    icon: '⚡',
    color: '#8B5CF6',
    description: '科大讯飞星火',
  },
  {
    id: 'baichuan',
    name: '百川智能',
    url: 'https://www.baichuan-ai.com/chat',
    icon: '🏔️',
    color: '#06B6D4',
    description: '百川大模型',
  },
  {
    id: 'hailuo',
    name: '海螺AI',
    url: 'https://hailuoai.com',
    icon: '🐚',
    color: '#EC4899',
    description: 'MiniMax 海螺AI',
  },
];
// ===== 行业分类 (从客户明细提取) =====
export const INDUSTRIES = {
  '定制家具': ['全屋定制(板式)', '整木定制', '卫浴定制', '全铝/金属定制', '木门转定制', '橱柜定制', '上游厂商', '代工厂'],
  '装修设计': ['家装', '家装平台'],
  '硬装建材': ['顶墙', '陶瓷岩板', '墙纸墙布窗帘', '涂料硅藻泥', '地板'],
  '软装家具': ['成品家具', '家纺家饰'],
  '照明与智能': ['家用照明', '专业照明', '灯饰', '智能家居'],
  '公装': ['办公设计', '装配式', '园林景观'],
  '商业设备': ['实验室装备', '游乐体育设备'],
  '家电': ['厨房电器', '暖通'],
  '连锁商业': ['展示道具', '店装乙方', '酒店', '餐饮'],
} as const;

export type IndustryL1 = keyof typeof INDUSTRIES;

// ===== 情报条目 =====
export interface IntelItem {
  id: string;
  title: string;
  summary: string;           // AI生成的情报研判
  source: PlatformSource;
  sourceUrl?: string;
  industry: IndustryL1[];    // 关联行业(可多选)
  category: IntelCategory;
  tags: string[];
  metrics?: Record<string, string>; // 平台互动数据
  createdAt: string;         // ISO timestamp
  importance: 1 | 2 | 3;    // 1=高 2=中 3=低
}

export type PlatformSource =
  | 'xiaohongshu' | 'wechat_mp' | 'wechat_video'
  | 'douyin' | 'toutiao' | 'weibo' | 'zhihu'
  | 'bilibili' | 'github' | 'web' | 'sales_upload';

export type IntelCategory =
  | 'competitor'  // 竞对动态
  | 'market'      // 市场信号
  | 'policy'      // 政策法规
  | 'tech'        // 技术趋势
  | 'user_voice'  // 用户声音
  | 'sales_intel'; // 销售一手情报

// ===== 销售上报 =====
export interface SalesUpload {
  id: string;
  salesName: string;
  region: string;          // 大区
  industry: IndustryL1;
  customerName?: string;
  intelType: 'customer_feedback' | 'competitor_info' | 'market_signal' | 'other';
  content: string;
  imageUrls?: string[];
  createdAt: string;
  aiInsight?: string;      // Qwen生成的洞察
}

// ===== 每日简报 =====
export interface DailyBrief {
  date: string;           // YYYY-MM-DD
  generatedAt: string;
  bullets: BriefBullet[];
  fullSummary: string;
}

export interface BriefBullet {
  text: string;
  source: PlatformSource;
  category: IntelCategory;
  importance: 1 | 2 | 3;
}

// ===== 搜索关键词配置 =====
export const MONITOR_KEYWORDS = {
  brand: ['酷家乐', 'Kujiale'],
  competitors: ['三维家', '打扮家', '爱福窝', '躺平设计家', '知户型'],
  industry: ['全屋定制', '定制家具', '家装设计', '装修效果图', '硬装建材', '软装家具'],
  tech: ['AI设计', 'AI出图', 'BIM', '3D渲染', 'VR家装'],
  signals: ['数字化转型', '设计软件', '门店管理', '前后端一体'],
};

// ===== 平台显示配置 =====
export const PLATFORM_CONFIG: Record<PlatformSource, { label: string; icon: string; color: string }> = {
  xiaohongshu: { label: '小红书', icon: '📕', color: '#fe2c55' },
  wechat_mp:   { label: '公众号', icon: '💬', color: '#07c160' },
  wechat_video:{ label: '视频号', icon: '📹', color: '#58be6a' },
  douyin:      { label: '抖音',   icon: '🎵', color: '#010101' },
  toutiao:     { label: '头条',   icon: '📰', color: '#f85959' },
  weibo:       { label: '微博',   icon: '🔥', color: '#ff8200' },
  zhihu:       { label: '知乎',   icon: '💡', color: '#0066ff' },
  bilibili:    { label: 'B站',    icon: '📺', color: '#00a1d6' },
  github:      { label: 'GitHub', icon: '🛠️', color: '#6e7681' },
  web:         { label: '网页',   icon: '🌐', color: '#638cff' },
  sales_upload:{ label: '销售上报', icon: '👤', color: '#fbbf24' },
};

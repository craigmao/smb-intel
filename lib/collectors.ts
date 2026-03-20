/**
 * 真实数据采集器
 * - DailyHotApi: 头条/微博/知乎/B站/抖音 热榜 (公共实例)
 * - RSSHub: 公众号/小红书/各平台 RSS (公共实例)
 * - GitHub: 直接 REST API
 *
 * 所有采集器返回统一 IntelItem[] 格式
 */
import { IntelItem, PlatformSource, IndustryL1, MONITOR_KEYWORDS } from './types';

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();

// 家居行业相关关键词（用于过滤热榜）
const RELEVANCE_KEYWORDS = [
  ...MONITOR_KEYWORDS.brand,
  ...MONITOR_KEYWORDS.competitors,
  ...MONITOR_KEYWORDS.industry,
  ...MONITOR_KEYWORDS.tech,
  ...MONITOR_KEYWORDS.signals,
  '装修', '家居', '设计', '定制', '家具', 'AI', '智能家居', '建材',
  '家装', '全屋', '软装', '硬装', '整装', '门窗', '橱柜', '衣柜',
  '瓷砖', '地板', '涂料', '灯具', '卫浴', '厨电', '暖通',
  '房地产', '楼市', '精装', '毛坯', '二手房', '新房',
  '数字化', '3D', 'BIM', 'VR', '渲染', 'CAD', 'SaaS',
];

function isRelevant(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return RELEVANCE_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
}

// ===== DailyHotApi 热榜 (公共实例) =====
const DAILYHOT_BASE = 'https://hot.imsyy.top';

interface HotItem {
  title: string;
  desc?: string;
  url?: string;
  mobileUrl?: string;
  hot?: number | string;
}

async function fetchDailyHot(route: string): Promise<HotItem[]> {
  try {
    const res = await fetch(`${DAILYHOT_BASE}${route}?cache=true`, {
      next: { revalidate: 1800 },
      headers: { 'User-Agent': 'SMB-Intel/1.0' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []) as HotItem[];
  } catch (e) {
    console.error(`[DailyHot] Error fetching ${route}:`, e);
    return [];
  }
}

export async function collectDailyHot(): Promise<IntelItem[]> {
  const platforms: { route: string; source: PlatformSource; label: string }[] = [
    { route: '/toutiao',  source: 'toutiao',  label: '头条' },
    { route: '/weibo',    source: 'weibo',    label: '微博' },
    { route: '/zhihu',    source: 'zhihu',    label: '知乎' },
    { route: '/bilibili', source: 'bilibili', label: 'B站' },
    { route: '/douyin',   source: 'douyin',   label: '抖音' },
    { route: '/baidu',    source: 'web',      label: '百度' },
  ];

  const items: IntelItem[] = [];
  const results = await Promise.allSettled(
    platforms.map(p => fetchDailyHot(p.route))
  );

  for (let i = 0; i < platforms.length; i++) {
    const p = platforms[i];
    const result = results[i];
    if (result.status !== 'fulfilled') continue;

    const hotItems = result.value;
    // 取前30条，过滤相关的
    for (const h of hotItems.slice(0, 30)) {
      const title = h.title || h.desc || '';
      if (!title) continue;

      // 对于家居行业情报，先做宽松匹配，后续 AI 分类会进一步筛选
      // 这里保留所有热榜条目（因为数量有限），标记相关性
      const relevant = isRelevant(title);

      items.push({
        id: uid(),
        title: `${title}`,
        summary: '', // 后续 AI 填充
        source: p.source,
        sourceUrl: h.url || h.mobileUrl || '',
        industry: [],
        category: 'market',
        tags: [p.label],
        metrics: { 热度: String(h.hot || '') },
        createdAt: now(),
        importance: relevant ? 2 : 3,
      });
    }
  }

  console.log(`[DailyHot] Collected ${items.length} items`);
  return items;
}

// ===== GitHub API 搜索 =====
export async function collectGitHub(): Promise<IntelItem[]> {
  const keywords = [
    '3D interior design',
    'AI interior design',
    'BIM open source',
    'home decoration AI',
    'furniture customization',
    'room layout generator',
    'kitchen design',
    '酷家乐',
    'three.js interior',
    'parametric furniture',
  ];

  const items: IntelItem[] = [];

  for (const kw of keywords) {
    try {
      const res = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(kw)}&sort=updated&order=desc&per_page=5`,
        {
          headers: { 'Accept': 'application/vnd.github+json' },
          next: { revalidate: 3600 },
        }
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const repo of (data.items || []).slice(0, 5)) {
        items.push({
          id: uid(),
          title: `${repo.full_name}: ${repo.description || '(无描述)'}`.slice(0, 200),
          summary: `⭐${repo.stargazers_count} | ${repo.language || 'N/A'} | Fork ${repo.forks_count} | 更新于 ${repo.updated_at?.slice(0, 10)}`,
          source: 'github',
          sourceUrl: repo.html_url,
          industry: ['定制家具'],
          category: 'tech',
          tags: [kw, repo.language || 'code', repo.stargazers_count > 1000 ? '热门项目' : '新兴项目'],
          metrics: { stars: String(repo.stargazers_count), forks: String(repo.forks_count) },
          createdAt: repo.updated_at || now(),
          importance: repo.stargazers_count > 5000 ? 1 : repo.stargazers_count > 500 ? 2 : 3,
        });
      }
    } catch (e) {
      console.error(`[GitHub] Error for "${kw}":`, e);
    }
  }

  // 去重
  const seen = new Set<string>();
  const unique = items.filter(item => {
    const key = item.sourceUrl || item.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`[GitHub] Collected ${unique.length} items (${items.length} before dedup)`);
  return unique;
}

// ===== RSSHub 公共实例 =====
const RSSHUB_BASE = 'https://rsshub.app';

interface RSSItem {
  title?: string;
  description?: string;
  link?: string;
  pubDate?: string;
  author?: string;
}

async function fetchRSSHub(route: string): Promise<RSSItem[]> {
  try {
    const res = await fetch(`${RSSHUB_BASE}${route}`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];
    const text = await res.text();

    // RSSHub 支持 JSON 格式
    try {
      const json = JSON.parse(text);
      return (json.items || []).map((item: any) => ({
        title: item.title,
        description: item.content_text || item.content_html || '',
        link: item.url || item.external_url || '',
        pubDate: item.date_published || '',
        author: item.authors?.[0]?.name || '',
      }));
    } catch {
      // 如果不是 JSON，解析 XML
      return parseRSSXML(text);
    }
  } catch (e) {
    console.error(`[RSSHub] Error fetching ${route}:`, e);
    return [];
  }
}

function parseRSSXML(xml: string): RSSItem[] {
  const items: RSSItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const getTag = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, 's'));
      return m ? m[1].trim() : '';
    };
    items.push({
      title: getTag('title'),
      description: getTag('description'),
      link: getTag('link'),
      pubDate: getTag('pubDate'),
      author: getTag('author') || getTag('dc:creator'),
    });
  }
  return items;
}

export async function collectRSSHub(): Promise<IntelItem[]> {
  // RSSHub 路由列表 - 家居/设计/科技相关
  const feeds: { route: string; source: PlatformSource; label: string; topic: string }[] = [
    // 知乎热门话题
    { route: '/zhihu/hot', source: 'zhihu', label: '知乎热榜', topic: '热榜' },
    { route: '/zhihu/topic/19550517', source: 'zhihu', label: '知乎-室内设计', topic: '室内设计' },
    { route: '/zhihu/topic/19554859', source: 'zhihu', label: '知乎-装修', topic: '装修' },
    // B站
    { route: '/bilibili/ranking/0/3/1', source: 'bilibili', label: 'B站科技区', topic: '科技' },
    // 微博热搜
    { route: '/weibo/search/hot', source: 'weibo', label: '微博热搜', topic: '热搜' },
    // 36kr
    { route: '/36kr/newsflashes', source: 'web', label: '36氪快讯', topic: '科技商业' },
    // 少数派
    { route: '/sspai/matrix', source: 'web', label: '少数派', topic: '效率工具' },
    // Hacker News
    { route: '/hackernews/best', source: 'web', label: 'HackerNews', topic: '技术前沿' },
    // Product Hunt
    { route: '/producthunt/today', source: 'web', label: 'ProductHunt', topic: '新产品' },
  ];

  const items: IntelItem[] = [];
  const results = await Promise.allSettled(
    feeds.map(f => fetchRSSHub(f.route))
  );

  for (let i = 0; i < feeds.length; i++) {
    const f = feeds[i];
    const result = results[i];
    if (result.status !== 'fulfilled') continue;

    for (const entry of result.value.slice(0, 15)) {
      if (!entry.title) continue;

      const desc = (entry.description || '')
        .replace(/<[^>]*>/g, '')  // strip HTML
        .slice(0, 200);

      items.push({
        id: uid(),
        title: entry.title.slice(0, 200),
        summary: desc,
        source: f.source,
        sourceUrl: entry.link || '',
        industry: [],
        category: 'market',
        tags: [f.label, f.topic],
        metrics: {},
        createdAt: entry.pubDate ? new Date(entry.pubDate).toISOString() : now(),
        importance: isRelevant(entry.title) ? 2 : 3,
      });
    }
  }

  console.log(`[RSSHub] Collected ${items.length} items`);
  return items;
}

// ===== 聚合采集 =====
export async function collectAll(): Promise<IntelItem[]> {
  console.log('[Collector] Starting real collection cycle...');

  const [hotlist, github, rsshub] = await Promise.allSettled([
    collectDailyHot(),
    collectGitHub(),
    collectRSSHub(),
  ]);

  const allItems: IntelItem[] = [
    ...(hotlist.status === 'fulfilled' ? hotlist.value : []),
    ...(github.status === 'fulfilled' ? github.value : []),
    ...(rsshub.status === 'fulfilled' ? rsshub.value : []),
  ];

  console.log(`[Collector] Total raw items: ${allItems.length}`);

  // 按重要性排序（相关的在前）
  allItems.sort((a, b) => a.importance - b.importance);

  return allItems;
}

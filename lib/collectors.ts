/**
 * 数据采集层
 *
 * 架构:
 * - 国内爬虫API (smb-crawler-api) 部署在国内服务器, 采集中文平台数据
 * - smb-intel (Vercel) 从爬虫API拉取数据, 做 AI 分类/展示
 * - 兜底: 如果爬虫API不可用, 用Vercel直连(部分平台可通)
 *
 * 环境变量:
 * CRAWLER_API_URL — 国内爬虫API地址, 如 https://your-crawler.example.com
 */
import { IntelItem, PlatformSource, MONITOR_KEYWORDS } from './types';

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

const CRAWLER_API = process.env.CRAWLER_API_URL || 'http://47.103.217.133:8000';

const RELEVANCE_KW = [
  ...MONITOR_KEYWORDS.brand,
  ...MONITOR_KEYWORDS.competitors,
  ...MONITOR_KEYWORDS.industry,
  ...MONITOR_KEYWORDS.tech,
  ...MONITOR_KEYWORDS.signals,
  '装修', '家居', '家具', '设计', '定制', 'AI', '智能家居', '建材',
  '家装', '全屋', '软装', '整装', '门窗', '橱柜', '衣柜', '木门',
  '瓷砖', '地板', '涂料', '灯具', '卫浴', '厨电', '暖通', '窗帘',
  '房地产', '楼市', '精装', '新房', '二手房',
  '数字化', '3D', 'BIM', 'VR', '渲染', 'CAD', 'SaaS',
];

function isRelevant(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return RELEVANCE_KW.some(kw => lower.includes(kw.toLowerCase()));
}

// ============================================================
// 模式一: 通过国内爬虫API采集 (推荐)
// ============================================================
async function collectFromCrawlerAPI(): Promise<IntelItem[]> {
  if (!CRAWLER_API) return [];

  try {
    const res = await fetch(`${CRAWLER_API}/api/all`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`Crawler API ${res.status}`);
    const data = await res.json();

    console.log(`[CrawlerAPI] Report:`, JSON.stringify(data.report || {}));

    const items: IntelItem[] = [];
    const sourceMap: Record<string, PlatformSource> = {
      // 搜索类 (行业定向)
      wechat: 'wechat_mp',
      toutiao: 'toutiao',
      weibo: 'weibo',
      zhihu: 'zhihu',
      baidu: 'web',
      bilibili: 'bilibili',
      douyin: 'douyin',
      xiaohongshu: 'xiaohongshu',
      // 热榜类 (大盘感知)
      toutiao_hot: 'toutiao',
      weibo_hot: 'weibo',
      douyin_hot: 'douyin',
    };

    const labelMap: Record<string, string> = {
      // 搜索类
      wechat: '微信公众号',
      toutiao: '头条搜索',
      weibo: '微博搜索',
      zhihu: '知乎搜索',
      baidu: '百度资讯',
      bilibili: 'B站搜索',
      douyin: '抖音搜索',
      xiaohongshu: '小红书',
      // 热榜类
      toutiao_hot: '头条热榜',
      weibo_hot: '微博热搜',
      douyin_hot: '抖音热搜',
    };

    for (const raw of (data.data || [])) {
      const src = raw.source || 'web';
      const title = raw.title || '';
      if (!title) continue;

      const isSearch = !src.endsWith('_hot'); // 搜索类 vs 热榜类
      const metricsObj: Record<string, string> = {};
      if (raw.hot) metricsObj['热度'] = String(raw.hot);
      if (raw.view) metricsObj['播放'] = String(raw.view);
      if (raw.like) metricsObj['点赞'] = String(raw.like);
      if (raw.danmaku) metricsObj['弹幕'] = String(raw.danmaku);
      if (raw.likes) metricsObj['赞'] = String(raw.likes);
      if (raw.comments) metricsObj['评论'] = String(raw.comments);
      if (raw.reposts) metricsObj['转发'] = String(raw.reposts);

      // 搜索类数据已经是行业定向的, 默认高相关性
      // 热榜类数据需要通过关键词匹配判断相关性
      const importance = isSearch ? 1 : (isRelevant(title) ? 2 : 4);

      // 分类: 搜索类按平台分; 热榜类统一归大盘
      let category: string;
      if (isSearch) {
        category = src === 'zhihu' ? 'user_voice' : src === 'bilibili' ? 'user_voice' : 'market';
      } else {
        category = 'market';
      }

      const tags = [labelMap[src] || src];
      if (raw.keyword) tags.push(raw.keyword);
      if (raw.owner) tags.push(raw.owner);

      items.push({
        id: uid(),
        title,
        summary: raw.desc || raw.excerpt || raw.summary || raw.label || '',
        source: sourceMap[src] || 'web',
        sourceUrl: raw.url || '',
        industry: [],
        category,
        tags,
        metrics: metricsObj,
        createdAt: raw.time || now(),
        importance,
      });
    }

    console.log(`[CrawlerAPI] Mapped ${items.length} items`);
    return items;
  } catch (e) {
    console.error('[CrawlerAPI] Error:', e);
    return [];
  }
}

// ============================================================
// 模式二: Vercel 直连兜底 (头条能通, 其他看运气)
// ============================================================

async function safeFetch(url: string, opts?: RequestInit): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch { return null; }
}

async function collectToutiaoFallback(): Promise<IntelItem[]> {
  const items: IntelItem[] = [];
  try {
    const res = await safeFetch('https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc', {
      headers: { 'User-Agent': UA },
    });
    if (!res || !res.ok) return items;
    const data = await res.json();
    for (const entry of (data.data || [])) {
      items.push({
        id: uid(),
        title: entry.Title || '',
        summary: entry.Label || '',
        source: 'toutiao',
        sourceUrl: entry.Url || '',
        industry: [],
        category: 'market',
        tags: ['头条热榜'],
        metrics: { 热度: String(entry.HotValue || '') },
        createdAt: now(),
        importance: isRelevant(entry.Title) ? 1 : 3,
      });
    }
  } catch (e) { console.error('[头条兜底]', e); }
  return items;
}

async function collectGitHub(): Promise<IntelItem[]> {
  const keywords = [
    '3D interior design', 'AI interior design', 'BIM open source',
    'room layout generator', 'kitchen design software', 'three.js interior',
    'parametric furniture', 'AI rendering architecture',
  ];
  const items: IntelItem[] = [];

  for (const kw of keywords) {
    try {
      const res = await safeFetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(kw)}&sort=stars&order=desc&per_page=5`,
        { headers: { 'Accept': 'application/vnd.github+json' } }
      );
      if (!res || !res.ok) continue;
      const data = await res.json();
      for (const repo of (data.items || []).slice(0, 5)) {
        items.push({
          id: uid(),
          title: `${repo.full_name}: ${(repo.description || '').slice(0, 150)}`,
          summary: `⭐${repo.stargazers_count.toLocaleString()} | ${repo.language || 'N/A'} | Fork ${repo.forks_count}`,
          source: 'github',
          sourceUrl: repo.html_url,
          industry: ['定制家具'],
          category: 'tech',
          tags: [kw, repo.language || 'code'],
          metrics: { stars: String(repo.stargazers_count), forks: String(repo.forks_count) },
          createdAt: repo.updated_at || now(),
          importance: repo.stargazers_count > 5000 ? 1 : repo.stargazers_count > 500 ? 2 : 3,
        });
      }
    } catch (e) { console.error(`[GitHub] "${kw}":`, e); }
  }

  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.sourceUrl!)) return false;
    seen.add(item.sourceUrl!);
    return true;
  });
}

// ============================================================
// 聚合采集
// ============================================================
export async function collectAll(): Promise<IntelItem[]> {
  console.log('[Collector] Starting...');
  console.log(`[Collector] CRAWLER_API_URL = ${CRAWLER_API || '(未配置, 用Vercel直连兜底)'}`);

  // 优先用国内爬虫API
  const crawlerItems = await collectFromCrawlerAPI();

  let allItems: IntelItem[];

  if (crawlerItems.length > 50) {
    // 爬虫API正常, 只补充 GitHub
    const github = await collectGitHub().catch(() => [] as IntelItem[]);
    allItems = [...crawlerItems, ...github];
    console.log(`[Collector] Mode: CrawlerAPI (${crawlerItems.length}) + GitHub (${github.length})`);
  } else {
    // 爬虫API不可用, 用Vercel直连兜底
    console.log('[Collector] CrawlerAPI unavailable, falling back to direct fetch...');
    const [toutiao, github] = await Promise.allSettled([
      collectToutiaoFallback(),
      collectGitHub(),
    ]);
    allItems = [
      ...(toutiao.status === 'fulfilled' ? toutiao.value : []),
      ...(github.status === 'fulfilled' ? github.value : []),
    ];
    console.log(`[Collector] Mode: Fallback (${allItems.length} items)`);
  }

  allItems.sort((a, b) => a.importance - b.importance);
  console.log(`[Collector] Total: ${allItems.length} items`);
  return allItems;
}

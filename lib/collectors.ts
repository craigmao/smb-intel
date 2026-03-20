/**
 * 数据采集器
 * 每个采集器负责一个平台，返回统一格式的 IntelItem[]
 *
 * 生产环境中：
 * - 小红书/抖音/微博/知乎/B站 → 调用 MediaCrawler 的 API
 * - 微信公众号 → 调用 wewe-rss 或 wechat-article-exporter 的 API
 * - 热榜聚合 → 调用 DailyHotApi
 * - 全网搜索 → 调用 SearXNG 自建实例 或 RSSHub
 * - GitHub → 直接调用 GitHub REST API
 *
 * MVP阶段：先用 GitHub API + DailyHotApi 演示端到端流程
 */
import { IntelItem, PlatformSource, MONITOR_KEYWORDS } from './types';
import { classifyIntel, generateInsight } from './qwen';

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();

// ===== GitHub 搜索 (直接可用) =====
export async function collectGitHub(): Promise<IntelItem[]> {
  const keywords = [...MONITOR_KEYWORDS.tech, 'interior design AI', 'BIM open source'];
  const items: IntelItem[] = [];

  for (const kw of keywords.slice(0, 3)) { // 限制请求量
    try {
      const res = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(kw)}&sort=updated&order=desc&per_page=3`,
        { headers: { 'Accept': 'application/vnd.github+json' }, next: { revalidate: 3600 } }
      );
      const data = await res.json();
      for (const repo of (data.items || []).slice(0, 3)) {
        items.push({
          id: uid(),
          title: `[GitHub] ${repo.full_name}: ${repo.description || ''}`.slice(0, 200),
          summary: `⭐${repo.stargazers_count} | ${repo.language || 'N/A'} | 最近更新 ${repo.updated_at?.slice(0, 10)}`,
          source: 'github',
          sourceUrl: repo.html_url,
          industry: ['定制家具'],
          category: 'tech',
          tags: [kw, repo.language || 'code'].filter(Boolean),
          metrics: { stars: String(repo.stargazers_count), forks: String(repo.forks_count) },
          createdAt: now(),
          importance: repo.stargazers_count > 1000 ? 2 : 3,
        });
      }
    } catch (e) {
      console.error(`GitHub collect error for "${kw}":`, e);
    }
  }
  return items;
}

// ===== DailyHotApi 热榜 (需部署 DailyHotApi 实例) =====
export async function collectHotList(apiBase?: string): Promise<IntelItem[]> {
  const base = apiBase || process.env.DAILYHOT_API_URL;
  if (!base) return [];

  const items: IntelItem[] = [];
  // 支持的平台: toutiao, weibo, zhihu, bilibili, douyin 等
  const platforms: { route: string; source: PlatformSource }[] = [
    { route: '/toutiao', source: 'toutiao' },
    { route: '/weibo',   source: 'weibo' },
    { route: '/zhihu',   source: 'zhihu' },
    { route: '/bilibili', source: 'bilibili' },
  ];

  for (const p of platforms) {
    try {
      const res = await fetch(`${base}${p.route}`, { next: { revalidate: 3600 } });
      const data = await res.json();
      const hotItems = (data.data || []).slice(0, 5);
      for (const h of hotItems) {
        // 过滤: 只要与家居行业相关的
        const title = h.title || h.desc || '';
        const isRelevant = Object.values(MONITOR_KEYWORDS)
          .flat()
          .some(kw => title.includes(kw));
        if (!isRelevant) continue;
        items.push({
          id: uid(),
          title: title.slice(0, 200),
          summary: '', // 后续AI填充
          source: p.source,
          sourceUrl: h.url || h.mobileUrl || '',
          industry: [],
          category: 'market',
          tags: [],
          metrics: { hot: h.hot || h.score || '' },
          createdAt: now(),
          importance: 2,
        });
      }
    } catch (e) {
      console.error(`DailyHot collect error for ${p.route}:`, e);
    }
  }
  return items;
}

// ===== MediaCrawler API (需部署 MediaCrawler 实例) =====
export async function collectMediaCrawler(apiBase?: string): Promise<IntelItem[]> {
  const base = apiBase || process.env.MEDIACRAWLER_API_URL;
  if (!base) return [];

  const items: IntelItem[] = [];
  // MediaCrawler 搜索接口示例
  const platforms: { platform: string; source: PlatformSource }[] = [
    { platform: 'xhs',    source: 'xiaohongshu' },
    { platform: 'dy',     source: 'douyin' },
    { platform: 'weibo',  source: 'weibo' },
  ];

  for (const p of platforms) {
    for (const kw of MONITOR_KEYWORDS.brand.concat(MONITOR_KEYWORDS.competitors).slice(0, 3)) {
      try {
        const res = await fetch(`${base}/api/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform: p.platform, keyword: kw, limit: 5 }),
        });
        const data = await res.json();
        for (const post of (data.data || [])) {
          items.push({
            id: uid(),
            title: (post.title || post.desc || '').slice(0, 200),
            summary: '', // 后续AI填充
            source: p.source,
            sourceUrl: post.url || '',
            industry: [],
            category: 'market',
            tags: [kw],
            metrics: {
              likes: String(post.likes || post.digg_count || 0),
              comments: String(post.comments || post.comment_count || 0),
            },
            createdAt: now(),
            importance: 2,
          });
        }
      } catch (e) {
        console.error(`MediaCrawler error [${p.platform}/${kw}]:`, e);
      }
    }
  }
  return items;
}

// ===== wewe-rss 微信公众号 (需部署 wewe-rss 实例) =====
export async function collectWeChatRSS(apiBase?: string): Promise<IntelItem[]> {
  const base = apiBase || process.env.WEWE_RSS_URL;
  if (!base) return [];

  const items: IntelItem[] = [];
  // wewe-rss 提供 RSS feed，可用标准 RSS 解析
  try {
    const res = await fetch(`${base}/feeds`, { next: { revalidate: 3600 } });
    const feeds = await res.json();
    for (const feed of (feeds || []).slice(0, 20)) {
      items.push({
        id: uid(),
        title: (feed.title || '').slice(0, 200),
        summary: '',
        source: 'wechat_mp',
        sourceUrl: feed.link || '',
        industry: [],
        category: 'market',
        tags: [feed.author || ''],
        metrics: { reads: String(feed.read_count || 0) },
        createdAt: feed.published || now(),
        importance: 2,
      });
    }
  } catch (e) {
    console.error('WeChat RSS error:', e);
  }
  return items;
}

// ===== 聚合采集 + AI处理 =====
export async function collectAll(): Promise<IntelItem[]> {
  console.log('[Collector] Starting collection cycle...');

  // 并行采集所有源
  const [github, hotlist, media, wechat] = await Promise.allSettled([
    collectGitHub(),
    collectHotList(),
    collectMediaCrawler(),
    collectWeChatRSS(),
  ]);

  const allItems: IntelItem[] = [
    ...(github.status === 'fulfilled' ? github.value : []),
    ...(hotlist.status === 'fulfilled' ? hotlist.value : []),
    ...(media.status === 'fulfilled' ? media.value : []),
    ...(wechat.status === 'fulfilled' ? wechat.value : []),
  ];

  console.log(`[Collector] Raw items: ${allItems.length}`);

  // AI 处理: 分类 + 生成洞察 (只处理缺失的)
  for (const item of allItems) {
    if (!item.industry.length || !item.tags.length) {
      try {
        const cls = await classifyIntel(item.title, item.summary || item.title);
        item.industry = cls.industry;
        item.category = cls.category;
        item.tags = cls.tags;
        item.importance = cls.importance;
      } catch (e) {
        console.error('[AI classify error]:', e);
      }
    }
    if (!item.summary || item.summary.length < 10) {
      try {
        item.summary = await generateInsight(item.title, item.title);
      } catch (e) {
        console.error('[AI insight error]:', e);
      }
    }
  }

  console.log(`[Collector] Processed items: ${allItems.length}`);
  return allItems;
}

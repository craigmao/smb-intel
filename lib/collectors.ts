/**
 * 真实数据采集器 — 全部使用可靠的公开 API
 *
 * 数据源:
 * 1. GitHub API — 家居设计/AI/BIM 相关开源项目 (直接可用)
 * 2. Hacker News Firebase API — 科技前沿 (完全公开)
 * 3. Dev.to API — AI/设计/SaaS 技术文章 (完全公开)
 * 4. Reddit JSON API — 室内设计/家装社区 (公开)
 * 5. Product Hunt API — 新产品发现
 * 6. 微博/知乎/B站 — 通过可用的公开端点
 */
import { IntelItem, PlatformSource, MONITOR_KEYWORDS } from './types';

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();

const RELEVANCE_KEYWORDS = [
  ...MONITOR_KEYWORDS.brand,
  ...MONITOR_KEYWORDS.competitors,
  ...MONITOR_KEYWORDS.industry,
  ...MONITOR_KEYWORDS.tech,
  ...MONITOR_KEYWORDS.signals,
  '装修', '家居', '设计', '定制', '家具', 'AI', '智能家居', '建材',
  '家装', '全屋', '软装', '硬装', '整装', '门窗', '橱柜', '衣柜',
  '3D', 'BIM', 'VR', '渲染', 'CAD', 'SaaS', 'interior', 'design',
  'furniture', 'home', 'kitchen', 'renovation',
];

function isRelevant(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return RELEVANCE_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
}

// ===== 1. GitHub API 搜索 =====
export async function collectGitHub(): Promise<IntelItem[]> {
  const keywords = [
    '3D interior design',
    'AI interior design',
    'BIM open source',
    'home decoration AI',
    'furniture customization',
    'room layout generator',
    'kitchen design software',
    'three.js interior',
    'parametric furniture',
    'AI rendering architecture',
    'floor plan recognition',
    'point cloud 3D reconstruction',
  ];

  const items: IntelItem[] = [];

  for (const kw of keywords) {
    try {
      const res = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(kw)}&sort=stars&order=desc&per_page=5`,
        { headers: { 'Accept': 'application/vnd.github+json' } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const repo of (data.items || []).slice(0, 5)) {
        items.push({
          id: uid(),
          title: `${repo.full_name}: ${(repo.description || '').slice(0, 150)}`,
          summary: `⭐${repo.stargazers_count.toLocaleString()} | ${repo.language || 'N/A'} | Fork ${repo.forks_count} | 更新于 ${repo.updated_at?.slice(0, 10)}`,
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
    if (seen.has(item.sourceUrl!)) return false;
    seen.add(item.sourceUrl!);
    return true;
  });

  console.log(`[GitHub] Collected ${unique.length} unique items`);
  return unique;
}

// ===== 2. Hacker News =====
export async function collectHackerNews(): Promise<IntelItem[]> {
  const items: IntelItem[] = [];

  try {
    // 获取 Top Stories IDs
    const topRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    if (!topRes.ok) return [];
    const topIds: number[] = await topRes.json();

    // 获取前40条的详情
    const storyPromises = topIds.slice(0, 40).map(async (id) => {
      try {
        const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        if (!res.ok) return null;
        return await res.json();
      } catch { return null; }
    });

    const stories = (await Promise.all(storyPromises)).filter(Boolean);

    for (const story of stories) {
      if (!story.title || story.type !== 'story') continue;

      items.push({
        id: uid(),
        title: story.title,
        summary: story.url ? `来源: ${new URL(story.url).hostname} | ${story.score}分 | ${story.descendants || 0}评论` : `${story.score}分 | ${story.descendants || 0}评论`,
        source: 'web',
        sourceUrl: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
        industry: [],
        category: 'tech',
        tags: ['HackerNews', '技术前沿', ...(isRelevant(story.title) ? ['行业相关'] : [])],
        metrics: { score: String(story.score), comments: String(story.descendants || 0) },
        createdAt: new Date(story.time * 1000).toISOString(),
        importance: isRelevant(story.title) ? 2 : story.score > 500 ? 2 : 3,
      });
    }
  } catch (e) {
    console.error('[HN] Error:', e);
  }

  console.log(`[HN] Collected ${items.length} items`);
  return items;
}

// ===== 3. Dev.to 技术文章 =====
export async function collectDevTo(): Promise<IntelItem[]> {
  const tags = ['ai', 'webdev', 'react', 'threejs', 'machinelearning', 'design', 'saas', 'openai'];
  const items: IntelItem[] = [];

  for (const tag of tags) {
    try {
      const res = await fetch(`https://dev.to/api/articles?tag=${tag}&top=7&per_page=8`, {
        headers: { 'User-Agent': 'SMB-Intel/1.0' },
      });
      if (!res.ok) continue;
      const articles = await res.json();

      for (const article of articles) {
        items.push({
          id: uid(),
          title: article.title,
          summary: (article.description || '').slice(0, 200),
          source: 'web',
          sourceUrl: article.url,
          industry: [],
          category: 'tech',
          tags: ['Dev.to', tag, ...(article.tag_list || []).slice(0, 3)],
          metrics: {
            reactions: String(article.public_reactions_count || 0),
            comments: String(article.comments_count || 0),
            reads: String(article.page_views_count || ''),
          },
          createdAt: article.published_at || now(),
          importance: isRelevant(article.title) ? 2 : 3,
        });
      }
    } catch (e) {
      console.error(`[Dev.to] Error for tag "${tag}":`, e);
    }
  }

  // 去重
  const seen = new Set<string>();
  const unique = items.filter(item => {
    if (seen.has(item.sourceUrl!)) return false;
    seen.add(item.sourceUrl!);
    return true;
  });

  console.log(`[Dev.to] Collected ${unique.length} items`);
  return unique;
}

// ===== 4. Reddit 社区 =====
export async function collectReddit(): Promise<IntelItem[]> {
  const subreddits = [
    { sub: 'InteriorDesign', label: '室内设计' },
    { sub: 'HomeImprovement', label: '家装改造' },
    { sub: 'architecture', label: '建筑设计' },
    { sub: 'AutoCAD', label: 'CAD' },
    { sub: 'blender', label: '3D建模' },
    { sub: 'artificial', label: 'AI' },
    { sub: 'SaaS', label: 'SaaS' },
  ];

  const items: IntelItem[] = [];

  for (const { sub, label } of subreddits) {
    try {
      const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=10`, {
        headers: { 'User-Agent': 'SMB-Intel/1.0 (educational project)' },
      });
      if (!res.ok) continue;
      const data = await res.json();

      for (const child of (data?.data?.children || [])) {
        const post = child.data;
        if (!post.title || post.stickied) continue;

        items.push({
          id: uid(),
          title: post.title.slice(0, 200),
          summary: (post.selftext || '').slice(0, 200).replace(/\n/g, ' ') || `r/${sub} · ${post.score}赞 · ${post.num_comments}评论`,
          source: 'web',
          sourceUrl: post.url?.startsWith('https://www.reddit.com') ? `https://reddit.com${post.permalink}` : post.url || `https://reddit.com${post.permalink}`,
          industry: [],
          category: sub === 'artificial' || sub === 'SaaS' ? 'tech' : 'market',
          tags: [`r/${sub}`, label, 'Reddit'],
          metrics: { upvotes: String(post.score), comments: String(post.num_comments) },
          createdAt: new Date(post.created_utc * 1000).toISOString(),
          importance: isRelevant(post.title) ? 2 : 3,
        });
      }
    } catch (e) {
      console.error(`[Reddit] Error for r/${sub}:`, e);
    }
  }

  console.log(`[Reddit] Collected ${items.length} items`);
  return items;
}

// ===== 5. 36氪/InfoQ 等中文科技媒体 (通过搜索API) =====
export async function collectChinaTech(): Promise<IntelItem[]> {
  const items: IntelItem[] = [];

  // 36氪 快讯 API (公开)
  try {
    const res = await fetch('https://36kr.com/api/newsflash?per_page=30', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'Accept': 'application/json',
      },
    });
    if (res.ok) {
      const data = await res.json();
      const newsItems = data?.data?.items || data?.data?.newsflashes || [];
      for (const news of newsItems.slice(0, 30)) {
        const title = news.title || news.entity_name || '';
        if (!title) continue;
        items.push({
          id: uid(),
          title: title.slice(0, 200),
          summary: (news.description || news.entity_brief || '').slice(0, 200),
          source: 'web',
          sourceUrl: news.news_url || `https://36kr.com/newsflashes/${news.id}`,
          industry: [],
          category: 'market',
          tags: ['36氪', '科技商业'],
          metrics: {},
          createdAt: news.published_at || news.created_at || now(),
          importance: isRelevant(title) ? 2 : 3,
        });
      }
    }
  } catch (e) {
    console.error('[36kr] Error:', e);
  }

  console.log(`[ChinaTech] Collected ${items.length} items`);
  return items;
}

// ===== 6. 微博热搜 (公开端点) =====
export async function collectWeibo(): Promise<IntelItem[]> {
  const items: IntelItem[] = [];

  try {
    const res = await fetch('https://weibo.com/ajax/side/hotSearch', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'Accept': 'application/json',
      },
    });
    if (res.ok) {
      const data = await res.json();
      const realtime = data?.data?.realtime || [];
      for (const item of realtime.slice(0, 30)) {
        const word = item.word || item.note || '';
        if (!word) continue;
        items.push({
          id: uid(),
          title: `#${word}#`,
          summary: item.label_name ? `分类: ${item.label_name}` : '',
          source: 'weibo',
          sourceUrl: `https://s.weibo.com/weibo?q=${encodeURIComponent(word)}`,
          industry: [],
          category: 'market',
          tags: ['微博热搜', item.label_name || '热点'],
          metrics: { 热度: String(item.raw_hot || item.num || '') },
          createdAt: now(),
          importance: isRelevant(word) ? 1 : 3,
        });
      }
    }
  } catch (e) {
    console.error('[Weibo] Error:', e);
  }

  console.log(`[Weibo] Collected ${items.length} items`);
  return items;
}

// ===== 7. 知乎热榜 =====
export async function collectZhihu(): Promise<IntelItem[]> {
  const items: IntelItem[] = [];

  try {
    const res = await fetch('https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=30', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'Accept': 'application/json',
      },
    });
    if (res.ok) {
      const data = await res.json();
      for (const entry of (data?.data || [])) {
        const target = entry.target || {};
        const title = target.title || '';
        if (!title) continue;
        items.push({
          id: uid(),
          title: title.slice(0, 200),
          summary: (target.excerpt || '').slice(0, 200),
          source: 'zhihu',
          sourceUrl: target.url ? `https://www.zhihu.com/question/${target.id}` : `https://www.zhihu.com/search?type=content&q=${encodeURIComponent(title)}`,
          industry: [],
          category: 'market',
          tags: ['知乎热榜'],
          metrics: { 热度: String(entry.detail_text || '') },
          createdAt: target.created ? new Date(target.created * 1000).toISOString() : now(),
          importance: isRelevant(title) ? 1 : 3,
        });
      }
    }
  } catch (e) {
    console.error('[Zhihu] Error:', e);
  }

  console.log(`[Zhihu] Collected ${items.length} items`);
  return items;
}

// ===== 聚合采集 =====
export async function collectAll(): Promise<IntelItem[]> {
  console.log('[Collector] Starting real collection from 7 sources...');

  const [github, hn, devto, reddit, china, weibo, zhihu] = await Promise.allSettled([
    collectGitHub(),
    collectHackerNews(),
    collectDevTo(),
    collectReddit(),
    collectChinaTech(),
    collectWeibo(),
    collectZhihu(),
  ]);

  const allItems: IntelItem[] = [
    ...(github.status === 'fulfilled' ? github.value : []),
    ...(hn.status === 'fulfilled' ? hn.value : []),
    ...(devto.status === 'fulfilled' ? devto.value : []),
    ...(reddit.status === 'fulfilled' ? reddit.value : []),
    ...(china.status === 'fulfilled' ? china.value : []),
    ...(weibo.status === 'fulfilled' ? weibo.value : []),
    ...(zhihu.status === 'fulfilled' ? zhihu.value : []),
  ];

  // 日志
  const sourceReport = {
    GitHub: github.status === 'fulfilled' ? github.value.length : `error: ${(github as any).reason?.message}`,
    HackerNews: hn.status === 'fulfilled' ? hn.value.length : `error: ${(hn as any).reason?.message}`,
    'Dev.to': devto.status === 'fulfilled' ? devto.value.length : `error: ${(devto as any).reason?.message}`,
    Reddit: reddit.status === 'fulfilled' ? reddit.value.length : `error: ${(reddit as any).reason?.message}`,
    '36氪': china.status === 'fulfilled' ? china.value.length : `error: ${(china as any).reason?.message}`,
    微博: weibo.status === 'fulfilled' ? weibo.value.length : `error: ${(weibo as any).reason?.message}`,
    知乎: zhihu.status === 'fulfilled' ? zhihu.value.length : `error: ${(zhihu as any).reason?.message}`,
  };
  console.log('[Collector] Source report:', JSON.stringify(sourceReport));
  console.log(`[Collector] Total: ${allItems.length} items`);

  // 按重要性排序
  allItems.sort((a, b) => a.importance - b.importance);

  return allItems;
}

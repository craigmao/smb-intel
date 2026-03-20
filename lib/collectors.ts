/**
 * 中文平台真实数据采集器
 *
 * 数据源 (按可用性排序):
 * 1. 头条热榜 — 公开API, 海外可用 ✅
 * 2. 微博热搜 — 公开AJAX, 需测试
 * 3. 知乎热榜 — api.zhihu.com
 * 4. 百度热搜 — HTML解析嵌入JSON
 * 5. B站排行榜 — 需WBI签名
 * 6. 抖音热搜 — 需csrf token
 * 7. 少数派 — 公开API
 * 8. 掘金 — 公开API
 * 9. 36氪快讯 — 公开API
 * 10. GitHub — 家居/AI/BIM相关项目
 *
 * 端点参考自 DailyHotApi (github.com/imsyy/DailyHotApi)
 */
import { IntelItem, PlatformSource, MONITOR_KEYWORDS } from './types';

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();

// Chrome UA
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

// 家居行业相关关键词
const RELEVANCE_KW = [
  ...MONITOR_KEYWORDS.brand,
  ...MONITOR_KEYWORDS.competitors,
  ...MONITOR_KEYWORDS.industry,
  ...MONITOR_KEYWORDS.tech,
  ...MONITOR_KEYWORDS.signals,
  '装修', '家居', '家具', '设计', '定制', 'AI', '智能家居', '建材',
  '家装', '全屋', '软装', '整装', '门窗', '橱柜', '衣柜', '木门',
  '瓷砖', '地板', '涂料', '灯具', '卫浴', '厨电', '暖通', '窗帘',
  '房地产', '楼市', '精装', '新房', '二手房', '存量房',
  '数字化', '3D', 'BIM', 'VR', '渲染', 'CAD', 'SaaS',
  '酷家乐', '三维家', '打扮家', '爱福窝', '躺平设计家', '知户型',
];

function isRelevant(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return RELEVANCE_KW.some(kw => lower.includes(kw.toLowerCase()));
}

// 安全 fetch, 超时 8 秒
async function safeFetch(url: string, opts?: RequestInit): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (e) {
    console.error(`[fetch] ${url} failed:`, (e as Error).message);
    return null;
  }
}

// ============================================================
// 1. 头条热榜 (已验证可用 ✅)
// ============================================================
export async function collectToutiao(): Promise<IntelItem[]> {
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
        tags: ['头条热榜', ...(entry.LabelDesc ? [entry.LabelDesc] : [])],
        metrics: { 热度: String(entry.HotValue || '') },
        createdAt: now(),
        importance: isRelevant(entry.Title) ? 1 : 3,
      });
    }
  } catch (e) { console.error('[头条]', e); }
  console.log(`[头条] ${items.length} items`);
  return items;
}

// ============================================================
// 2. 微博热搜
// ============================================================
export async function collectWeibo(): Promise<IntelItem[]> {
  const items: IntelItem[] = [];
  try {
    const res = await safeFetch('https://weibo.com/ajax/side/hotSearch', {
      headers: {
        'User-Agent': UA,
        'Referer': 'https://weibo.com/',
        'Accept': 'application/json, text/plain, */*',
      },
    });
    if (!res || !res.ok) return items;
    const data = await res.json();
    const realtime = data?.data?.realtime || [];
    for (const item of realtime) {
      const word = item.word || item.note || '';
      if (!word) continue;
      const searchUrl = item.word_scheme
        ? `https://s.weibo.com/weibo?q=${encodeURIComponent('#' + word + '#')}`
        : `https://s.weibo.com/weibo?q=${encodeURIComponent(word)}`;
      items.push({
        id: uid(),
        title: word,
        summary: item.label_name || '',
        source: 'weibo',
        sourceUrl: searchUrl,
        industry: [],
        category: 'market',
        tags: ['微博热搜', ...(item.label_name ? [item.label_name] : [])],
        metrics: { 热度: String(item.raw_hot || item.num || '') },
        createdAt: item.onboard_time ? new Date(item.onboard_time * 1000).toISOString() : now(),
        importance: isRelevant(word) ? 1 : 3,
      });
    }
  } catch (e) { console.error('[微博]', e); }
  console.log(`[微博] ${items.length} items`);
  return items;
}

// ============================================================
// 3. 知乎热榜
// ============================================================
export async function collectZhihu(): Promise<IntelItem[]> {
  const items: IntelItem[] = [];
  try {
    const res = await safeFetch('https://api.zhihu.com/topstory/hot-lists/total?limit=50', {
      headers: {
        'User-Agent': UA,
        'Accept': 'application/json',
      },
    });
    if (!res || !res.ok) return items;
    const data = await res.json();
    for (const entry of (data.data || [])) {
      const target = entry.target || {};
      const title = target.title || '';
      if (!title) continue;
      items.push({
        id: uid(),
        title,
        summary: (target.excerpt || '').slice(0, 200),
        source: 'zhihu',
        sourceUrl: `https://www.zhihu.com/question/${target.id}`,
        industry: [],
        category: 'user_voice',
        tags: ['知乎热榜'],
        metrics: { 热度: entry.detail_text || '' },
        createdAt: target.created ? new Date(target.created * 1000).toISOString() : now(),
        importance: isRelevant(title) ? 1 : 3,
      });
    }
  } catch (e) { console.error('[知乎]', e); }
  console.log(`[知乎] ${items.length} items`);
  return items;
}

// ============================================================
// 4. 百度热搜 (HTML内嵌JSON解析)
// ============================================================
export async function collectBaidu(): Promise<IntelItem[]> {
  const items: IntelItem[] = [];
  try {
    const res = await safeFetch('https://top.baidu.com/board?tab=realtime', {
      headers: { 'User-Agent': UA, 'Accept': 'text/html' },
    });
    if (!res || !res.ok) return items;
    const html = await res.text();
    // DailyHotApi方式: 从HTML注释中提取JSON
    const match = html.match(/<!--s-data:(.*?)-->/s);
    if (!match) return items;
    const jsonData = JSON.parse(match[1]);
    const cards = jsonData?.data?.cards || [];
    for (const card of cards) {
      for (const content of (card.content || [])) {
        items.push({
          id: uid(),
          title: content.word || content.query || '',
          summary: (content.desc || '').slice(0, 200),
          source: 'web',
          sourceUrl: content.url || `https://www.baidu.com/s?wd=${encodeURIComponent(content.query || content.word || '')}`,
          industry: [],
          category: 'market',
          tags: ['百度热搜'],
          metrics: { 热度: String(content.hotScore || '') },
          createdAt: now(),
          importance: isRelevant(content.word || '') ? 1 : 3,
        });
      }
    }
  } catch (e) { console.error('[百度]', e); }
  console.log(`[百度] ${items.length} items`);
  return items;
}

// ============================================================
// 5. B站热门
// ============================================================
export async function collectBilibili(): Promise<IntelItem[]> {
  const items: IntelItem[] = [];
  try {
    // 尝试热门视频API (不需要WBI签名)
    const res = await safeFetch('https://api.bilibili.com/x/web-interface/popular?ps=50&pn=1', {
      headers: {
        'User-Agent': UA,
        'Referer': 'https://www.bilibili.com/',
      },
    });
    if (!res || !res.ok) return items;
    const data = await res.json();
    if (data.code !== 0) {
      console.log(`[B站] API returned code ${data.code}: ${data.message}`);
      return items;
    }
    for (const video of (data.data?.list || [])) {
      items.push({
        id: uid(),
        title: video.title || '',
        summary: (video.desc || '').slice(0, 200),
        source: 'bilibili',
        sourceUrl: video.short_link_v2 || `https://www.bilibili.com/video/${video.bvid}`,
        industry: [],
        category: 'market',
        tags: ['B站热门', video.tname || ''],
        metrics: {
          播放: String(video.stat?.view || ''),
          弹幕: String(video.stat?.danmaku || ''),
          点赞: String(video.stat?.like || ''),
        },
        createdAt: video.pubdate ? new Date(video.pubdate * 1000).toISOString() : now(),
        importance: isRelevant(video.title) ? 1 : 3,
      });
    }
  } catch (e) { console.error('[B站]', e); }
  console.log(`[B站] ${items.length} items`);
  return items;
}

// ============================================================
// 6. 抖音热搜
// ============================================================
export async function collectDouyin(): Promise<IntelItem[]> {
  const items: IntelItem[] = [];
  try {
    // 先获取csrf token
    const loginRes = await safeFetch('https://www.douyin.com/passport/general/login_guiding_strategy/?aid=6383', {
      headers: { 'User-Agent': UA },
    });
    let csrfToken = '';
    if (loginRes) {
      const text = await loginRes.text();
      const tokenMatch = text.match(/passport_csrf_token=([^;]+)/);
      csrfToken = tokenMatch?.[1] || '';
    }

    const res = await safeFetch(
      'https://www.douyin.com/aweme/v1/web/hot/search/list/?device_platform=webapp&aid=6383&channel=channel_pc_web&detail_list=1',
      {
        headers: {
          'User-Agent': UA,
          'Referer': 'https://www.douyin.com/',
          ...(csrfToken ? { 'Cookie': `passport_csrf_token=${csrfToken}` } : {}),
        },
      }
    );
    if (!res || !res.ok) return items;
    const data = await res.json();
    for (const word of (data.data?.word_list || [])) {
      items.push({
        id: uid(),
        title: word.word || '',
        summary: '',
        source: 'douyin',
        sourceUrl: `https://www.douyin.com/search/${encodeURIComponent(word.word || '')}`,
        industry: [],
        category: 'market',
        tags: ['抖音热搜'],
        metrics: { 热度: String(word.hot_value || '') },
        createdAt: word.event_time ? new Date(Number(word.event_time) * 1000).toISOString() : now(),
        importance: isRelevant(word.word || '') ? 1 : 3,
      });
    }
  } catch (e) { console.error('[抖音]', e); }
  console.log(`[抖音] ${items.length} items`);
  return items;
}

// ============================================================
// 7. 少数派 (已验证可用 ✅)
// ============================================================
export async function collectSspai(): Promise<IntelItem[]> {
  const items: IntelItem[] = [];
  try {
    const res = await safeFetch('https://sspai.com/api/v1/article/tag/page/get?limit=20&offset=0&tag=%E7%83%AD%E9%97%A8%E6%96%87%E7%AB%A0');
    if (!res || !res.ok) return items;
    const data = await res.json();
    for (const article of (data.data || [])) {
      items.push({
        id: uid(),
        title: article.title || '',
        summary: (article.summary || '').slice(0, 200),
        source: 'web',
        sourceUrl: `https://sspai.com/post/${article.id}`,
        industry: [],
        category: 'tech',
        tags: ['少数派', '效率工具'],
        metrics: { 赞: String(article.like_count || ''), 评论: String(article.comment_count || '') },
        createdAt: article.released_at ? new Date(article.released_at * 1000).toISOString() : now(),
        importance: isRelevant(article.title || '') ? 2 : 3,
      });
    }
  } catch (e) { console.error('[少数派]', e); }
  console.log(`[少数派] ${items.length} items`);
  return items;
}

// ============================================================
// 8. 掘金 (已验证可用 ✅)
// ============================================================
export async function collectJuejin(): Promise<IntelItem[]> {
  const items: IntelItem[] = [];
  try {
    const res = await safeFetch('https://api.juejin.cn/content_api/v1/content/article_rank?category_id=1&type=hot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
      body: JSON.stringify({}),
    });
    if (!res || !res.ok) return items;
    const data = await res.json();
    for (const article of (data.data || [])) {
      const info = article.content || {};
      items.push({
        id: uid(),
        title: info.title || '',
        summary: (info.content || '').replace(/<[^>]*>/g, '').slice(0, 200),
        source: 'web',
        sourceUrl: `https://juejin.cn/post/${info.content_id}`,
        industry: [],
        category: 'tech',
        tags: ['掘金', '技术社区'],
        metrics: { 热度: String(article.content_counter?.hot_rank || '') },
        createdAt: info.ctime ? new Date(Number(info.ctime) * 1000).toISOString() : now(),
        importance: isRelevant(info.title || '') ? 2 : 3,
      });
    }
  } catch (e) { console.error('[掘金]', e); }
  console.log(`[掘金] ${items.length} items`);
  return items;
}

// ============================================================
// 9. 36氪快讯
// ============================================================
export async function collect36kr(): Promise<IntelItem[]> {
  const items: IntelItem[] = [];
  try {
    const res = await safeFetch('https://36kr.com/api/newsflash?per_page=30', {
      headers: { 'User-Agent': UA, 'Accept': 'application/json' },
    });
    if (!res || !res.ok) return items;
    const data = await res.json();
    const newsItems = data?.data?.items || data?.data?.newsflashes || [];
    for (const news of newsItems) {
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
        importance: isRelevant(title) ? 1 : 3,
      });
    }
  } catch (e) { console.error('[36氪]', e); }
  console.log(`[36氪] ${items.length} items`);
  return items;
}

// ============================================================
// 10. GitHub (家居/AI/BIM 开源项目)
// ============================================================
export async function collectGitHub(): Promise<IntelItem[]> {
  const keywords = [
    '3D interior design',
    'AI interior design',
    'BIM open source',
    'room layout generator',
    'kitchen design software',
    'three.js interior',
    'parametric furniture',
    'AI rendering architecture',
    'floor plan recognition',
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

  console.log(`[GitHub] ${unique.length} unique items`);
  return unique;
}

// ============================================================
// 聚合采集
// ============================================================
export async function collectAll(): Promise<IntelItem[]> {
  console.log('[Collector] Starting collection from 10 Chinese sources...');

  const results = await Promise.allSettled([
    collectToutiao(),    // 头条热榜
    collectWeibo(),      // 微博热搜
    collectZhihu(),      // 知乎热榜
    collectBaidu(),      // 百度热搜
    collectBilibili(),   // B站热门
    collectDouyin(),     // 抖音热搜
    collectSspai(),      // 少数派
    collectJuejin(),     // 掘金
    collect36kr(),       // 36氪
    collectGitHub(),     // GitHub
  ]);

  const sourceNames = ['头条', '微博', '知乎', '百度', 'B站', '抖音', '少数派', '掘金', '36氪', 'GitHub'];
  const allItems: IntelItem[] = [];
  const report: Record<string, string | number> = {};

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === 'fulfilled') {
      allItems.push(...r.value);
      report[sourceNames[i]] = r.value.length;
    } else {
      report[sourceNames[i]] = `error: ${r.reason?.message || 'unknown'}`;
    }
  }

  console.log('[Collector] Report:', JSON.stringify(report));
  console.log(`[Collector] Total: ${allItems.length} items`);

  // 按重要性排序 (行业相关的在前)
  allItems.sort((a, b) => a.importance - b.importance);

  return allItems;
}

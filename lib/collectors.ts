/**
 * 数据采集层 v4 — 新闻聚合架构
 *
 * 架构:
 * - 国内爬虫API (smb-crawler-api) → Google News RSS + 36kr + 搜狗微信 + B站
 * - smb-intel (Vercel) 从爬虫API拉取数据, 做分类/展示
 */
import { IntelItem, IntelCategory, PlatformSource, MONITOR_KEYWORDS } from './types';

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();

/** 解码常见 HTML 实体 */
function decodeEntities(s: string): string {
  if (!s) return s;
  return s
    .replace(/&ldquo;/g, '\u201c').replace(/&rdquo;/g, '\u201d')
    .replace(/&lsquo;/g, '\u2018').replace(/&rsquo;/g, '\u2019')
    .replace(/&middot;/g, '\u00b7').replace(/&mdash;/g, '\u2014').replace(/&ndash;/g, '\u2013')
    .replace(/&hellip;/g, '\u2026').replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

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
// 从爬虫API采集 (v4: 新闻聚合)
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
    console.log(`[CrawlerAPI] Version: ${data.version || '?'}`);

    const items: IntelItem[] = [];

    // v4 数据源映射
    const sourceMap: Record<string, PlatformSource> = {
      google_news: 'web',
      '36kr': 'web',
      wechat: 'wechat_mp',
      bilibili: 'bilibili',
      baidu: 'web',
    };

    const labelMap: Record<string, string> = {
      google_news: '新闻',
      '36kr': '36氪',
      wechat: '微信公众号',
      bilibili: 'B站',
      baidu: '百度',
    };

    for (const raw of (data.data || [])) {
      const src = raw.source || 'web';
      const title = raw.title || '';
      if (!title) continue;

      const metricsObj: Record<string, string> = {};
      if (raw.hot) metricsObj['热度'] = String(raw.hot);
      if (raw.view) metricsObj['播放'] = String(raw.view);
      if (raw.like) metricsObj['点赞'] = String(raw.like);
      if (raw.media) metricsObj['媒体'] = raw.media;

      // 优先度: 高相关 = 1, 一般相关 = 2, 弱相关 = 3
      const importance: 1 | 2 | 3 = isRelevant(title) ? 1 : 2;

      // 按关键词和标题推断分类
      const kw = raw.keyword || '';
      let category: IntelCategory;
      if (['酷家乐','三维家','躺平设计家','打扮家','家居云设计'].some(b => kw.includes(b) || title.includes(b))) {
        category = 'competitor';
      } else if (src === 'bilibili') {
        category = 'user_voice';
      } else if (kw.includes('政策') || title.includes('政策') || title.includes('法规')) {
        category = 'policy';
      } else if (kw.includes('AI') || kw.includes('数字化') || kw.includes('ERP') || kw.includes('BIM') || title.includes('AI')) {
        category = 'tech';
      } else {
        category = 'market';
      }

      const tags = [labelMap[src] || src];
      if (raw.keyword && raw.keyword !== '36kr') tags.push(raw.keyword);
      if (raw.media && src === 'google_news') tags.push(raw.media);

      items.push({
        id: uid(),
        title: decodeEntities(title),
        summary: decodeEntities(raw.desc || raw.excerpt || raw.summary || ''),
        source: sourceMap[src] || 'web',
        sourceUrl: raw.url || '',
        industry: [],
        category,
        tags,
        metrics: metricsObj,
        createdAt: raw.pubdate || raw.time || now(),
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
// 聚合采集
// ============================================================
export async function collectAll(): Promise<IntelItem[]> {
  console.log('[Collector] Starting v4...');
  console.log(`[Collector] CRAWLER_API_URL = ${CRAWLER_API || '(未配置)'}`);

  const crawlerItems = await collectFromCrawlerAPI();

  if (crawlerItems.length > 0) {
    crawlerItems.sort((a, b) => a.importance - b.importance);
    console.log(`[Collector] Total: ${crawlerItems.length} items from CrawlerAPI`);
    return crawlerItems;
  }

  console.log('[Collector] CrawlerAPI returned 0 items');
  return [];
}

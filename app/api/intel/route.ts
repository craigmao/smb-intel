import { NextRequest, NextResponse } from 'next/server';
import { collectAll } from '@/lib/collectors';

// 内存缓存：避免每次请求都调 API
let cachedItems: any[] = [];
let lastFetchTime = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30分钟缓存

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const industry = searchParams.get('industry');
  const category = searchParams.get('category');
  const source   = searchParams.get('source');
  const search   = searchParams.get('q');
  const limit    = parseInt(searchParams.get('limit') || '200');
  const refresh  = searchParams.get('refresh') === '1';

  // 判断是否需要重新采集
  const needRefresh = refresh || !cachedItems.length || (Date.now() - lastFetchTime > CACHE_TTL);

  if (needRefresh) {
    try {
      console.log('[API/intel] Fetching fresh data...');
      cachedItems = await collectAll();
      lastFetchTime = Date.now();
      console.log(`[API/intel] Cached ${cachedItems.length} items`);
    } catch (e: any) {
      console.error('[API/intel] Collection error:', e);
      // 如果采集失败但有缓存，继续用缓存
      if (!cachedItems.length) {
        return NextResponse.json({ items: [], total: 0, error: e.message }, { status: 500 });
      }
    }
  }

  let items = [...cachedItems];

  // 过滤
  if (industry && industry !== 'all') {
    items = items.filter(i => i.industry.includes(industry));
  }
  if (category && category !== 'all') {
    items = items.filter(i => i.category === category);
  }
  if (source) {
    items = items.filter(i => i.source === source);
  }
  if (search) {
    const q = search.toLowerCase();
    items = items.filter(i =>
      i.title.toLowerCase().includes(q) ||
      (i.summary || '').toLowerCase().includes(q) ||
      i.tags.some((t: string) => t.toLowerCase().includes(q))
    );
  }

  return NextResponse.json({
    items: items.slice(0, limit),
    total: items.length,
    cachedAt: new Date(lastFetchTime).toISOString(),
    sources: (() => {
      const s: Record<string, number> = {};
      cachedItems.forEach(i => { s[i.source] = (s[i.source] || 0) + 1; });
      return s;
    })(),
  });
}

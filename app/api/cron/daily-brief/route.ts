import { NextResponse } from 'next/server';
import { collectAll } from '@/lib/collectors';
import { generateDailyBrief } from '@/lib/qwen';
import { DailyBrief } from '@/lib/types';

// 内存缓存: 避免短时间重复生成
let cachedBrief: DailyBrief | null = null;
let lastGenTime = 0;
const BRIEF_TTL = 4 * 60 * 60 * 1000; // 4小时缓存

export async function GET() {
  try {
    const now = Date.now();
    const today = new Date().toISOString().slice(0, 10);
    const refresh = false; // 可以通过 query param 控制

    if (cachedBrief && cachedBrief.date === today && (now - lastGenTime < BRIEF_TTL) && !refresh) {
      return NextResponse.json({ ok: true, brief: cachedBrief, cached: true });
    }

    // 1. 从爬虫API拉取最新数据
    console.log('[daily-brief] Fetching intel data...');
    const items = await collectAll();
    console.log(`[daily-brief] Got ${items.length} items`);

    if (items.length === 0) {
      return NextResponse.json({ ok: false, error: 'No intel data available' }, { status: 500 });
    }

    // 2. 调用 Qwen 生成每日简报
    console.log('[daily-brief] Generating brief with Qwen...');
    const briefJson = await generateDailyBrief(items);
    let parsed: any;
    try { parsed = JSON.parse(briefJson); } catch { parsed = { bullets: [], action: '数据解析异常，请检查情报源' }; }

    const brief: DailyBrief = {
      date: today,
      generatedAt: new Date().toISOString(),
      bullets: (parsed.bullets || []).map((b: any) => ({
        text: b.text || '',
        source: b.source || 'web',
        category: 'market' as const,
        importance: 1 as const,
      })),
      fullSummary: parsed.action || '',
    };

    // 3. 缓存
    cachedBrief = brief;
    lastGenTime = now;

    return NextResponse.json({ ok: true, brief });
  } catch (e: any) {
    console.error('[daily-brief] Error:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

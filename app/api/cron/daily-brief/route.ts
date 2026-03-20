import { NextRequest, NextResponse } from 'next/server';
import { generateDailyBrief } from '@/lib/qwen';
import { DailyBrief, IntelItem } from '@/lib/types';

// 内存缓存: 避免短时间重复生成
let cachedBrief: DailyBrief | null = null;
let lastGenTime = 0;
const BRIEF_TTL = 4 * 60 * 60 * 1000; // 4小时缓存

/**
 * POST: Dashboard 发送已加载的情报数据，直接调用 Qwen 生成摘要
 * 这样避免了在 Vercel Hobby 10s 限制内同时抓数据 + 调 AI 的问题
 */
export async function POST(req: NextRequest) {
  try {
    const now = Date.now();
    const today = new Date().toISOString().slice(0, 10);

    // 检查缓存
    if (cachedBrief && cachedBrief.date === today && (now - lastGenTime < BRIEF_TTL)) {
      return NextResponse.json({ ok: true, brief: cachedBrief, cached: true });
    }

    const body = await req.json();
    const items: IntelItem[] = body.items || [];

    if (items.length === 0) {
      return NextResponse.json({ ok: false, error: 'No intel data provided' }, { status: 400 });
    }

    // 直接调用 Qwen 生成摘要 (数据已由前端提供，省去抓取时间)
    console.log(`[daily-brief] Generating brief with Qwen from ${items.length} items...`);
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

    cachedBrief = brief;
    lastGenTime = now;

    return NextResponse.json({ ok: true, brief });
  } catch (e: any) {
    console.error('[daily-brief] Error:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

/**
 * GET: 返回缓存的摘要 (如有)，否则提示用 POST
 */
export async function GET() {
  const today = new Date().toISOString().slice(0, 10);
  if (cachedBrief && cachedBrief.date === today) {
    return NextResponse.json({ ok: true, brief: cachedBrief, cached: true });
  }
  return NextResponse.json({
    ok: false,
    error: '请先在 Dashboard 点击「生成摘要」按钮',
    hint: 'POST /api/cron/daily-brief with { items: [...] }',
  });
}

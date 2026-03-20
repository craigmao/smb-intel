import { NextResponse } from 'next/server';
import { getIntelItems, getSalesUploads, saveDailyBrief } from '@/lib/store';
import { generateDailyBrief } from '@/lib/qwen';
import { DailyBrief, IntelItem } from '@/lib/types';

// Vercel Cron: 每天早9点触发
export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const items = getIntelItems(100);
    const sales = getSalesUploads(20);

    // 将销售上报也纳入简报输入
    const salesAsIntel: IntelItem[] = sales.map(s => ({
      id: s.id,
      title: `[销售上报/${s.salesName}] ${s.content.slice(0, 100)}`,
      summary: s.aiInsight || '',
      source: 'sales_upload' as const,
      industry: [s.industry],
      category: 'sales_intel' as const,
      tags: [s.intelType, s.region],
      createdAt: s.createdAt,
      importance: 2 as const,
    }));

    const allItems = [...items, ...salesAsIntel];
    const briefJson = await generateDailyBrief(allItems);
    let parsed: any;
    try { parsed = JSON.parse(briefJson); } catch { parsed = { bullets: [], action: '' }; }

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

    saveDailyBrief(brief);
    return NextResponse.json({ ok: true, brief });
  } catch (e: any) {
    console.error('[Cron/daily-brief] Error:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

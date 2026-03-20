import { NextResponse } from 'next/server';
import { collectAll } from '@/lib/collectors';
import { addIntelItems } from '@/lib/store';

// Vercel Cron: 每小时触发一次
export async function GET() {
  try {
    const items = await collectAll();
    addIntelItems(items);
    return NextResponse.json({
      ok: true,
      collected: items.length,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error('[Cron/collect] Error:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

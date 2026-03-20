import { NextRequest, NextResponse } from 'next/server';
import { getIntelItems, getDailyBrief } from '@/lib/store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const industry = searchParams.get('industry');    // 行业过滤
  const category = searchParams.get('category');    // 分类过滤
  const source   = searchParams.get('source');      // 平台过滤
  const limit    = parseInt(searchParams.get('limit') || '50');

  let items = getIntelItems(200);

  if (industry) items = items.filter(i => i.industry.includes(industry as any));
  if (category) items = items.filter(i => i.category === category);
  if (source)   items = items.filter(i => i.source === source);

  const brief = getDailyBrief();

  return NextResponse.json({
    items: items.slice(0, limit),
    total: items.length,
    brief,
    lastUpdated: items[0]?.createdAt || null,
  });
}

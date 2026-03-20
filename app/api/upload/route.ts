import { NextRequest, NextResponse } from 'next/server';
import { addSalesUpload } from '@/lib/store';
import { analyzeSalesUpload } from '@/lib/qwen';
import { SalesUpload, IndustryL1 } from '@/lib/types';

// 销售上报接口 (Web表单 / 企微机器人 / 钉钉机器人 统一调用)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { salesName, region, industry, customerName, intelType, content } = body;

    if (!salesName || !content) {
      return NextResponse.json({ ok: false, error: '缺少必填字段: salesName, content' }, { status: 400 });
    }

    const upload: SalesUpload = {
      id: Math.random().toString(36).slice(2, 10),
      salesName,
      region: region || '未知',
      industry: (industry || '定制家具') as IndustryL1,
      customerName: customerName || undefined,
      intelType: intelType || 'other',
      content,
      createdAt: new Date().toISOString(),
    };

    // Qwen AI 生成洞察
    try {
      upload.aiInsight = await analyzeSalesUpload(upload);
    } catch (e) {
      console.error('[Upload AI error]:', e);
      upload.aiInsight = '（AI分析暂不可用）';
    }

    addSalesUpload(upload);

    return NextResponse.json({
      ok: true,
      data: upload,
      message: `✅ 已收到 ${salesName} 的情报上报，AI洞察: ${upload.aiInsight}`,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

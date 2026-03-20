import { NextRequest, NextResponse } from 'next/server';

/**
 * 企业微信 / 钉钉 机器人 Webhook 接收端
 *
 * 销售在群里 @机器人 发送信息，机器人将消息转发到此接口
 * 然后调用 /api/upload 入库 + AI分析
 *
 * === 企业微信机器人配置 ===
 * 1. 在企微群设置 → 群机器人 → 添加机器人
 * 2. 配置回调URL: https://your-domain.vercel.app/api/webhook?platform=wecom
 * 3. 机器人收到消息后会POST到此URL
 *
 * === 钉钉机器人配置 ===
 * 1. 在钉钉群 → 智能群助手 → 添加机器人 → 自定义(outgoing)
 * 2. 配置POST地址: https://your-domain.vercel.app/api/webhook?platform=dingtalk
 * 3. 设置安全设置(加签)
 */

export async function POST(req: NextRequest) {
  const platform = new URL(req.url).searchParams.get('platform');
  const body = await req.json();

  let salesName = '未知销售';
  let content = '';

  if (platform === 'wecom') {
    // 企业微信消息格式
    salesName = body.From?.Alias || body.From?.Name || '企微用户';
    content = body.MsgType === 'text' ? body.Text?.Content || '' : '[非文本消息]';
  } else if (platform === 'dingtalk') {
    // 钉钉消息格式
    salesName = body.senderNick || '钉钉用户';
    content = body.text?.content || '';
    // 去掉 @机器人 的部分
    content = content.replace(/@\S+/g, '').trim();
  } else {
    return NextResponse.json({ ok: false, error: 'Unknown platform' }, { status: 400 });
  }

  if (!content) {
    return NextResponse.json({ ok: true, message: '空消息，已忽略' });
  }

  // 调用上报接口
  const uploadRes = await fetch(new URL('/api/upload', req.url).toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      salesName,
      region: '自动识别',
      industry: '定制家具', // 默认，后续AI自动分类
      intelType: 'other',
      content,
    }),
  });
  const result = await uploadRes.json();

  // 回复消息给机器人(显示在群里)
  if (platform === 'wecom') {
    return NextResponse.json({
      msgtype: 'text',
      text: { content: result.message || '已收到情报' },
    });
  } else if (platform === 'dingtalk') {
    return NextResponse.json({
      msgtype: 'text',
      text: { content: result.message || '已收到情报' },
    });
  }

  return NextResponse.json({ ok: true });
}

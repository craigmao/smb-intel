import OpenAI from 'openai';
import { IntelItem, IntelCategory, IndustryL1, INDUSTRIES, SalesUpload } from './types';

// Qwen API 兼容 OpenAI SDK
const qwen = new OpenAI({
  apiKey: process.env.QWEN_API_KEY || '',
  baseURL: process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
});

// ===== 情报分类 + 打标 (qwen-turbo, 低成本) =====
export async function classifyIntel(rawTitle: string, rawContent: string): Promise<{
  industry: IndustryL1[];
  category: IntelCategory;
  tags: string[];
  importance: 1 | 2 | 3;
}> {
  const industries = Object.keys(INDUSTRIES).join('、');
  const resp = await qwen.chat.completions.create({
    model: 'qwen-turbo',
    temperature: 0.1,
    response_format: { type: 'json_object' },
    messages: [{
      role: 'system',
      content: `你是家居建材行业情报分析师。根据内容判断：
1. industry: 关联行业(从[${industries}]选1-3个，数组)
2. category: 分类(competitor/market/policy/tech/user_voice 选1个)
3. tags: 3-5个关键标签(数组)
4. importance: 重要性(1=高/涉及竞对重大动作或政策变化 2=中/行业趋势 3=低/一般信息)
返回JSON。`
    }, {
      role: 'user',
      content: `标题：${rawTitle}\n内容摘要：${rawContent.slice(0, 500)}`
    }],
  });
  try {
    return JSON.parse(resp.choices[0].message.content || '{}');
  } catch {
    return { industry: ['定制家具'], category: 'market', tags: [], importance: 3 };
  }
}

// ===== 情报研判摘要 (qwen-plus, 高质量) =====
export async function generateInsight(rawTitle: string, rawContent: string): Promise<string> {
  const resp = await qwen.chat.completions.create({
    model: 'qwen-plus',
    temperature: 0.3,
    max_tokens: 200,
    messages: [{
      role: 'system',
      content: `你是酷家乐SMB事业部的情报分析师。请用一句话概括这条信息对酷家乐SMB业务的影响和建议动作。
格式：→ 情报研判：[影响分析] + [建议动作]
要求：直接、务实、可执行。不超过80字。`
    }, {
      role: 'user',
      content: `${rawTitle}\n${rawContent.slice(0, 800)}`
    }],
  });
  return resp.choices[0].message.content || '';
}

// ===== 每日简报生成 (qwen-plus) =====
export async function generateDailyBrief(items: IntelItem[]): Promise<string> {
  const topItems = items
    .sort((a, b) => a.importance - b.importance)
    .slice(0, 20)
    .map((it, i) => `${i + 1}. [${it.source}][${it.category}] ${it.title}`)
    .join('\n');

  const resp = await qwen.chat.completions.create({
    model: 'qwen-plus',
    temperature: 0.3,
    max_tokens: 600,
    messages: [{
      role: 'system',
      content: `你是酷家乐SMB事业部的首席情报官。根据今日采集的情报，生成一份晨间简报。
要求：
1. 用5-7个要点概括今日最重要的信号
2. 每个要点一句话，标注信号来源平台
3. 最后给出1条"今日建议行动"
4. 语言风格：简洁、直接、有判断力，像给CEO的briefing
5. 返回JSON格式: { "bullets": [{"text":"...", "source":"平台名"}], "action":"今日建议行动" }`
    }, {
      role: 'user',
      content: `今日情报（共${items.length}条，以下是TOP20）：\n${topItems}`
    }],
    response_format: { type: 'json_object' },
  });
  return resp.choices[0].message.content || '{}';
}

// ===== 销售上报 → AI洞察 (qwen-turbo) =====
export async function analyzeSalesUpload(upload: SalesUpload): Promise<string> {
  const resp = await qwen.chat.completions.create({
    model: 'qwen-turbo',
    temperature: 0.3,
    max_tokens: 200,
    messages: [{
      role: 'system',
      content: `你是酷家乐SMB情报分析师。销售上报了一条一手信息，请分析其情报价值并给出建议。
要求：1句话情报价值判断 + 1句话建议动作。简洁直接。`
    }, {
      role: 'user',
      content: `销售：${upload.salesName} | 大区：${upload.region} | 行业：${upload.industry}
类型：${upload.intelType} | 客户：${upload.customerName || '未填'}
内容：${upload.content}`
    }],
  });
  return resp.choices[0].message.content || '';
}

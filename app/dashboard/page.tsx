'use client';
import { useState, useEffect } from 'react';
import { PLATFORM_CONFIG, INDUSTRIES, IntelItem, DailyBrief, IndustryL1 } from '@/lib/types';

// ===== 本地 mock 数据 (部署后从API获取) =====
const MOCK_BRIEF: DailyBrief = {
  date: new Date().toISOString().slice(0, 10),
  generatedAt: new Date().toISOString(),
  fullSummary: '今日建议：重点关注三维家降价动态对华南/华西区的影响，安排CSM主动联系高风险客户。',
  bullets: [
    { text: '三维家官方公众号宣布2026版SMB年费降至6800元，直接对标酷家乐设计营销方案，价格差约40%', source: 'wechat_mp', category: 'competitor', importance: 1 },
    { text: '小红书爆款笔记"AI出图月省3000"引发中小门店关注，免费工具对低端市场蚕食信号增强', source: 'xiaohongshu', category: 'market', importance: 1 },
    { text: '住建部BIM新国标2026年实施在即，硬装建材客户合规升级需求确定性高，是增值切入点', source: 'toutiao', category: 'policy', importance: 1 },
    { text: '多条小红书"三维家换回酷家乐"笔记走热，渲染品质仍是核心壁垒，可提炼为销售话术', source: 'xiaohongshu', category: 'competitor', importance: 2 },
    { text: '广州建博会60%参展商表达数字化升级意愿，参展企业名单可作为拓新线索', source: 'wechat_video', category: 'market', importance: 2 },
    { text: '销售上报：华南区3家定制家具客户收到三维家低价报价，需CSM当天跟进', source: 'sales_upload', category: 'sales_intel', importance: 1 },
  ],
};

const MOCK_ITEMS: IntelItem[] = [
  { id: '1', title: '三维家2026版全面升级AI能力，SMB客户年费降至6800元/年，主攻三四线定制门店', summary: '→ 情报研判：直接对标酷家乐企业设计营销方案，价格低约40%。华南+华西区受冲击最大。', source: 'wechat_mp', industry: ['定制家具', '装修设计'], category: 'competitor', tags: ['价格战', '三维家', 'AI升级'], metrics: { '阅读': '5.8w', '在看': '890' }, createdAt: new Date(Date.now() - 3600000*2).toISOString(), importance: 1 },
  { id: '2', title: '"小门店也能做高级效果图" — 三四线定制店主分享用AI出图替代设计软件，月省3000+', summary: '→ 情报研判：中小客户"够用就好"需求强烈，AI免费工具蚕食低端市场，需强化专业壁垒感知。', source: 'xiaohongshu', industry: ['定制家具'], category: 'market', tags: ['AI替代', '下沉市场', 'SMB痛点'], metrics: { '❤️': '8.7k', '💬': '1.2k', '⭐': '5.3k' }, createdAt: new Date(Date.now() - 3600000*12).toISOString(), importance: 1 },
  { id: '3', title: '住建部新规：2026年起家装行业BIM数据统一标准，中小企业面临合规升级压力', summary: '→ 情报研判：硬装建材客户合规驱动的升级需求。酷家乐BIM能力是差异化优势，可作续约话术。', source: 'toutiao', industry: ['硬装建材'], category: 'policy', tags: ['政策利好', 'BIM标准', '增值机会'], metrics: { '阅读': '35.6w', '评论': '1.2k' }, createdAt: new Date(Date.now() - 3600000*24).toISOString(), importance: 1 },
  { id: '4', title: '"AI 10秒出图 vs 专业设计软件" 对比测评视频爆火 — 复杂定制场景仍需酷家乐类工具', summary: '→ 情报研判：市场认知分化，简单场景被AI蚕食是趋势，护城河在"复杂定制+前后端一体"。', source: 'douyin', industry: ['定制家具', '装修设计'], category: 'tech', tags: ['AI冲击', '专业壁垒', '场景分化'], metrics: { '▶️': '126w', '❤️': '5.6w', '💬': '8.2k' }, createdAt: new Date(Date.now() - 3600000*36).toISOString(), importance: 2 },
  { id: '5', title: '《2025定制家居数字化白皮书》：72%中小企业计划增加数字化投入，设计营销一体化成首选', summary: '→ 情报研判：行业大盘利好，"设计营销一体化"是酷家乐核心定位，可引用增强客户信心。', source: 'wechat_mp', industry: ['定制家具'], category: 'market', tags: ['利好', '白皮书', '设计营销'], metrics: { '阅读': '12.5w', '在看': '2.3k' }, createdAt: new Date(Date.now() - 3600000*48).toISOString(), importance: 2 },
  { id: '6', title: '"换了三维家又换回酷家乐" — 定制门窗店主真实体验：渲染质量差客户不买单', summary: '→ 情报研判：回流信号。渲染品质仍是核心壁垒，可提炼为销售case回应"为什么不选更便宜的"。', source: 'xiaohongshu', industry: ['定制家具'], category: 'competitor', tags: ['竞对负面', '回流信号', '品质壁垒'], metrics: { '❤️': '1.5k', '💬': '326' }, createdAt: new Date(Date.now() - 3600000*60).toISOString(), importance: 2 },
  { id: '7', title: '广州建博会现场：AI+VR成最大看点，超60%参展商表达数字化升级意愿，多家提及酷家乐', summary: '→ 情报研判：展会信号确认行业数字化提速，参展企业名单可作为拓新线索。', source: 'wechat_video', industry: ['定制家具', '硬装建材', '软装家具'], category: 'market', tags: ['品牌正面', '展会', '拓新线索'], metrics: { '▶️': '8.2w', '❤️': '4.5k' }, createdAt: new Date(Date.now() - 3600000*72).toISOString(), importance: 2 },
  { id: '8', title: '"开定制家具店需要多少钱" 系列视频，创作者建议先用免费工具起步', summary: '→ 情报研判：创业客户典型心态——先省钱。入门方案价格感知仍是障碍，可设计阶梯定价话术。', source: 'douyin', industry: ['定制家具'], category: 'market', tags: ['价格认知', '创业客户', '免费冲击'], metrics: { '▶️': '42w', '❤️': '1.8w' }, createdAt: new Date(Date.now() - 3600000*80).toISOString(), importance: 3 },
  { id: '9', title: '照明行业洗牌加速：智能照明渗透率35%，传统灯企转向设计端，催生新工具需求', summary: '→ 情报研判：照明客户的转型企业可能产生新设计工具需求，值得CSM深挖。', source: 'wechat_mp', industry: ['照明与智能'], category: 'tech', tags: ['行业转型', '新需求', '照明'], metrics: { '阅读': '8.3w' }, createdAt: new Date(Date.now() - 3600000*96).toISOString(), importance: 3 },
  { id: '10', title: '[销售上报/李明] 华南区佛山某定制家具客户反馈收到三维家报价单，年费6800元', summary: '→ AI洞察：需立即安排CSM跟进，提供ROI对比分析，强调渲染品质和前后端一体价值。', source: 'sales_upload', industry: ['定制家具'], category: 'sales_intel', tags: ['竞对抢单', '华南区', '紧急'], metrics: {}, createdAt: new Date(Date.now() - 3600000*4).toISOString(), importance: 1 },
];

export default function Dashboard() {
  const [activeIndustry, setActiveIndustry] = useState<string>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const industries = Object.keys(INDUSTRIES);
  const categories = [
    { key: 'all', label: '全部' },
    { key: 'competitor', label: '竞对' },
    { key: 'market', label: '市场' },
    { key: 'policy', label: '政策' },
    { key: 'tech', label: '技术' },
    { key: 'user_voice', label: '用户声音' },
    { key: 'sales_intel', label: '销售情报' },
  ];

  const filtered = MOCK_ITEMS.filter(item => {
    if (activeIndustry !== 'all' && !item.industry.includes(activeIndustry as IndustryL1)) return false;
    if (activeCategory !== 'all' && item.category !== activeCategory) return false;
    return true;
  });

  const brief = MOCK_BRIEF;
  const pconf = PLATFORM_CONFIG;

  return (
    <div style={S.shell}>
      {/* Sidebar */}
      <aside style={S.sidebar}>
        <div style={S.logo}>
          <div style={{fontSize:15,fontWeight:700,color:'#f0f6fc'}}>酷家乐 SMB 情报</div>
          <div style={{fontSize:10,color:'#3d4f65',marginTop:3,letterSpacing:2}}>INTELLIGENCE HUB</div>
        </div>
        <nav style={{flex:1,padding:'4px 8px'}}>
          <div style={S.navLabel}>情报看板</div>
          <div style={{...S.navBtn, ...S.navActive}}>📡 情报雷达</div>
          <div style={S.navLabel}>快捷操作</div>
          <a href="/submit" style={{...S.navBtn, textDecoration:'none'}}>📤 上报情报</a>
        </nav>
        <div style={{padding:'12px 18px',borderTop:'1px solid rgba(255,255,255,.06)',fontSize:10,color:'#3d4f65'}}>
          <div>每小时自动刷新 · Qwen API 驱动</div>
          <div style={{marginTop:4}}>数据源: 小红书·公众号·抖音·头条·视频号·GitHub</div>
        </div>
      </aside>

      {/* Main */}
      <main style={S.main}>
        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:20}}>
          <div>
            <h1 style={{fontSize:18,fontWeight:700,color:'#f0f6fc',margin:0}}>📡 情报雷达</h1>
            <p style={{fontSize:12,color:'#6b7a8d',margin:'2px 0 0'}}>全平台外部信号聚合 · 按细分行业过滤 · AI每日简报</p>
          </div>
          <div style={{fontSize:11,color:'#3d4f65'}}>
            上次更新: {new Date().getHours()}:00 · 下次刷新: {new Date().getHours()+1}:00
          </div>
        </div>

        {/* Daily Brief */}
        <div style={S.briefCard}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{fontSize:14,fontWeight:700,color:'#f0f6fc'}}>🧠 AI 每日情报简报 — {brief.date}</div>
            <div style={{fontSize:10,color:'#3d4f65'}}>生成于 {new Date(brief.generatedAt).toLocaleTimeString('zh-CN')}</div>
          </div>
          <ul style={{listStyle:'none',padding:0,margin:0}}>
            {brief.bullets.map((b, i) => (
              <li key={i} style={{padding:'6px 0 6px 16px',position:'relative',fontSize:12.5,color:'#c9d1d9',lineHeight:1.7}}>
                <span style={{position:'absolute',left:0,color:'#638cff',fontWeight:700}}>▸</span>
                {b.text}
                <span style={{marginLeft:6,fontSize:9,padding:'1px 5px',borderRadius:3,
                  background: pconf[b.source]?.color ? `${pconf[b.source].color}20` : 'rgba(99,140,255,.12)',
                  color: pconf[b.source]?.color || '#638cff',
                }}>{pconf[b.source]?.icon} {pconf[b.source]?.label}</span>
              </li>
            ))}
          </ul>
          <div style={{marginTop:10,paddingTop:10,borderTop:'1px solid rgba(99,140,255,.15)',fontSize:12,color:'#638cff',fontWeight:600}}>
            📌 {brief.fullSummary}
          </div>
        </div>

        {/* Industry Filter */}
        <div style={{display:'flex',gap:4,marginBottom:12,flexWrap:'wrap'}}>
          <button onClick={()=>setActiveIndustry('all')} style={{...S.filterBtn, ...(activeIndustry==='all'?S.filterActive:{})}}>全部行业</button>
          {industries.map(ind => (
            <button key={ind} onClick={()=>setActiveIndustry(ind)} style={{...S.filterBtn, ...(activeIndustry===ind?S.filterActive:{})}}>{ind}</button>
          ))}
        </div>

        {/* Category Filter */}
        <div style={{display:'flex',gap:4,marginBottom:16,flexWrap:'wrap'}}>
          {categories.map(c => (
            <button key={c.key} onClick={()=>setActiveCategory(c.key)} style={{...S.filterBtn, ...(activeCategory===c.key?S.filterActive:{})}}>{c.label}</button>
          ))}
        </div>

        {/* Feed */}
        <div style={{display:'flex',flexDirection:'column',gap:0}}>
          {filtered.map(item => (
            <div key={item.id} style={S.feedItem}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5,flexWrap:'wrap'}}>
                <span style={{
                  padding:'2px 8px',borderRadius:4,fontSize:10.5,fontWeight:600,
                  background: `${pconf[item.source]?.color || '#638cff'}20`,
                  color: pconf[item.source]?.color || '#638cff',
                }}>{pconf[item.source]?.icon} {pconf[item.source]?.label}</span>
                {item.industry.map(ind => (
                  <span key={ind} style={{padding:'2px 6px',borderRadius:3,fontSize:10,background:'rgba(99,140,255,.1)',color:'#638cff'}}>{ind}</span>
                ))}
                <span style={{fontSize:10,color:'#3d4f65'}}>{timeSince(item.createdAt)}</span>
                <div style={{marginLeft:'auto',display:'flex',gap:8,fontSize:10,color:'#3d4f65'}}>
                  {Object.entries(item.metrics || {}).map(([k, v]) => (
                    <span key={k}>{k} {v}</span>
                  ))}
                </div>
              </div>
              <div style={{fontSize:13,color:'#f0f6fc',lineHeight:1.6,cursor:'default'}}>{item.title}</div>
              {item.summary && <div style={{fontSize:12,color:'#6b7a8d',marginTop:4,lineHeight:1.5}}>{item.summary}</div>}
              <div style={{display:'flex',gap:4,marginTop:5,flexWrap:'wrap'}}>
                {item.tags.map(t => (
                  <span key={t} style={{
                    padding:'2px 7px',borderRadius:4,fontSize:10,fontWeight:500,
                    background: t.includes('利好') || t.includes('正面') || t.includes('壁垒') || t.includes('回流') ? 'rgba(52,211,153,.12)' :
                                t.includes('价格') || t.includes('AI') || t.includes('冲击') || t.includes('竞对') || t.includes('紧急') ? 'rgba(248,113,113,.12)' :
                                'rgba(251,191,36,.12)',
                    color: t.includes('利好') || t.includes('正面') || t.includes('壁垒') || t.includes('回流') ? '#34d399' :
                           t.includes('价格') || t.includes('AI') || t.includes('冲击') || t.includes('竞对') || t.includes('紧急') ? '#f87171' :
                           '#fbbf24',
                  }}>{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function timeSince(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 3600) return Math.floor(seconds / 60) + '分钟前';
  if (seconds < 86400) return Math.floor(seconds / 3600) + '小时前';
  return Math.floor(seconds / 86400) + '天前';
}

const S: Record<string, React.CSSProperties> = {
  shell: { display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: '100vh', background: '#06090f' },
  sidebar: { background: '#0c1018', borderRight: '1px solid rgba(255,255,255,.06)', padding: '20px 0', position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column' },
  logo: { padding: '0 18px 20px' },
  navLabel: { fontSize: 10, color: '#3d4f65', letterSpacing: 1.2, textTransform: 'uppercase' as any, padding: '12px 10px 4px' },
  navBtn: { display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', color: '#6b7a8d', fontSize: 12.5, marginBottom: 2 },
  navActive: { background: 'rgba(99,140,255,.12)', color: '#638cff', fontWeight: 600 },
  main: { padding: '20px 28px 40px', overflowY: 'auto' as any, color: '#c9d1d9' },
  briefCard: {
    background: 'linear-gradient(135deg, rgba(99,140,255,.12) 0%, rgba(99,140,255,.04) 100%)',
    border: '1px solid rgba(99,140,255,.2)', borderRadius: 12, padding: 18, marginBottom: 20,
  },
  filterBtn: {
    padding: '4px 12px', borderRadius: 5, fontSize: 11, cursor: 'pointer',
    color: '#6b7a8d', background: 'transparent', border: '1px solid rgba(255,255,255,.06)',
  },
  filterActive: { background: '#638cff', color: '#fff', borderColor: '#638cff', fontWeight: 600 },
  feedItem: {
    padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,.04)',
  },
};

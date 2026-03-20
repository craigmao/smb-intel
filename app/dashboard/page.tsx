'use client';
import { useState, useMemo } from 'react';
import { PLATFORM_CONFIG, INDUSTRIES, IntelItem, IndustryL1 } from '@/lib/types';
import { generateMockItems, MOCK_BRIEF } from '@/lib/mock-data';

const PAGE_SIZE = 20;

export default function Dashboard() {
  const [activeIndustry, setActiveIndustry] = useState<string>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const allItems = useMemo(() => generateMockItems(), []);
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

  const filtered = useMemo(() => {
    return allItems.filter(item => {
      if (activeIndustry !== 'all' && !item.industry.includes(activeIndustry as IndustryL1)) return false;
      if (activeCategory !== 'all' && item.category !== activeCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return item.title.toLowerCase().includes(q) ||
               item.summary.toLowerCase().includes(q) ||
               item.tags.some(t => t.toLowerCase().includes(q));
      }
      return true;
    });
  }, [allItems, activeIndustry, activeCategory, searchQuery]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const brief = MOCK_BRIEF;
  const pconf = PLATFORM_CONFIG;

  const resetPage = () => setVisibleCount(PAGE_SIZE);

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
          <div>每日自动刷新 · Qwen API 驱动</div>
          <div style={{marginTop:4}}>数据源: 小红书·公众号·抖音·头条·视频号·微博·知乎·B站·GitHub</div>
          <div style={{marginTop:4,color:'#638cff'}}>共 {allItems.length} 条情报</div>
        </div>
      </aside>

      {/* Main */}
      <main style={S.main}>
        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:20}}>
          <div>
            <h1 style={{fontSize:18,fontWeight:700,color:'#f0f6fc',margin:0}}>📡 情报雷达</h1>
            <p style={{fontSize:12,color:'#6b7a8d',margin:'2px 0 0'}}>全平台外部信号聚合 · 按细分行业过滤 · AI每日简报 · 共{allItems.length}条情报</p>
          </div>
          <div style={{fontSize:11,color:'#3d4f65'}}>
            数据更新: {new Date().toLocaleDateString('zh-CN')}
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
                <span style={{position:'absolute',left:0,color: b.importance === 1 ? '#f87171' : '#638cff',fontWeight:700}}>▸</span>
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

        {/* Search */}
        <div style={{marginBottom:12}}>
          <input
            type="text"
            placeholder="🔍 搜索情报关键词（如：三维家、BIM、价格战、AI出图...）"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); resetPage(); }}
            style={S.searchInput}
          />
        </div>

        {/* Industry Filter */}
        <div style={{display:'flex',gap:4,marginBottom:12,flexWrap:'wrap'}}>
          <button onClick={()=>{setActiveIndustry('all');resetPage();}} style={{...S.filterBtn, ...(activeIndustry==='all'?S.filterActive:{})}}>全部行业</button>
          {industries.map(ind => (
            <button key={ind} onClick={()=>{setActiveIndustry(ind);resetPage();}} style={{...S.filterBtn, ...(activeIndustry===ind?S.filterActive:{})}}>{ind}</button>
          ))}
        </div>

        {/* Category Filter */}
        <div style={{display:'flex',gap:4,marginBottom:8,flexWrap:'wrap'}}>
          {categories.map(c => (
            <button key={c.key} onClick={()=>{setActiveCategory(c.key);resetPage();}} style={{...S.filterBtn, ...(activeCategory===c.key?S.filterActive:{})}}>{c.label}</button>
          ))}
        </div>

        {/* Stats bar */}
        <div style={{fontSize:11,color:'#3d4f65',marginBottom:12}}>
          筛选结果: {filtered.length} 条情报 · 当前显示: {Math.min(visibleCount, filtered.length)} 条
        </div>

        {/* Feed */}
        <div style={{display:'flex',flexDirection:'column',gap:0}}>
          {visible.map(item => (
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
                {item.importance === 1 && <span style={{padding:'1px 5px',borderRadius:3,fontSize:9,background:'rgba(248,113,113,.15)',color:'#f87171',fontWeight:700}}>🔥 高优</span>}
                <span style={{fontSize:10,color:'#3d4f65'}}>{timeSince(item.createdAt)}</span>
                <div style={{marginLeft:'auto',display:'flex',gap:8,fontSize:10,color:'#3d4f65'}}>
                  {Object.entries(item.metrics || {}).map(([k, v]) => (
                    <span key={k}>{k} {v}</span>
                  ))}
                </div>
              </div>
              {/* 标题：有链接可点击跳转 */}
              {item.sourceUrl ? (
                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer"
                   style={{fontSize:13,color:'#f0f6fc',lineHeight:1.6,textDecoration:'none',display:'block',cursor:'pointer'}}
                   onMouseEnter={e => (e.currentTarget.style.color = '#638cff')}
                   onMouseLeave={e => (e.currentTarget.style.color = '#f0f6fc')}
                >
                  {item.title}
                  <span style={{fontSize:10,marginLeft:6,color:'#3d4f65'}}>↗</span>
                </a>
              ) : (
                <div style={{fontSize:13,color:'#f0f6fc',lineHeight:1.6}}>{item.title}</div>
              )}
              {item.summary && <div style={{fontSize:12,color:'#6b7a8d',marginTop:4,lineHeight:1.5}}>{item.summary}</div>}
              <div style={{display:'flex',gap:4,marginTop:5,flexWrap:'wrap'}}>
                {item.tags.map(t => (
                  <span key={t} style={{
                    padding:'2px 7px',borderRadius:4,fontSize:10,fontWeight:500,
                    background: t.includes('利好') || t.includes('正面') || t.includes('壁垒') || t.includes('回流') || t.includes('品牌') ? 'rgba(52,211,153,.12)' :
                                t.includes('价格') || t.includes('AI') || t.includes('冲击') || t.includes('竞对') || t.includes('紧急') || t.includes('裁员') || t.includes('挖角') ? 'rgba(248,113,113,.12)' :
                                'rgba(251,191,36,.12)',
                    color: t.includes('利好') || t.includes('正面') || t.includes('壁垒') || t.includes('回流') || t.includes('品牌') ? '#34d399' :
                           t.includes('价格') || t.includes('AI') || t.includes('冲击') || t.includes('竞对') || t.includes('紧急') || t.includes('裁员') || t.includes('挖角') ? '#f87171' :
                           '#fbbf24',
                  }}>{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        {hasMore && (
          <div style={{textAlign:'center',padding:'20px 0'}}>
            <button onClick={() => setVisibleCount(v => v + PAGE_SIZE)} style={S.loadMoreBtn}>
              加载更多 ({filtered.length - visibleCount} 条剩余)
            </button>
          </div>
        )}
        {!hasMore && filtered.length > 0 && (
          <div style={{textAlign:'center',padding:'20px 0',fontSize:12,color:'#3d4f65'}}>
            — 已展示全部 {filtered.length} 条情报 —
          </div>
        )}
        {filtered.length === 0 && (
          <div style={{textAlign:'center',padding:'40px 0',fontSize:13,color:'#3d4f65'}}>
            暂无匹配的情报，请尝试调整筛选条件
          </div>
        )}
      </main>
    </div>
  );
}

function timeSince(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return '刚刚';
  if (seconds < 3600) return Math.floor(seconds / 60) + '分钟前';
  if (seconds < 86400) return Math.floor(seconds / 3600) + '小时前';
  return Math.floor(seconds / 86400) + '天前';
}

const S: Record<string, React.CSSProperties> = {
  shell: { display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: '100vh', background: '#06090f' },
  sidebar: { background: '#0c1018', borderRight: '1px solid rgba(255,255,255,.06)', padding: '20px 0', position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column' },
  logo: { padding: '0 18px 20px' },
  navLabel: { fontSize: 10, color: '#3d4f65', letterSpacing: 1.2, textTransform: 'uppercase' as const, padding: '12px 10px 4px' },
  navBtn: { display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', color: '#6b7a8d', fontSize: 12.5, marginBottom: 2 },
  navActive: { background: 'rgba(99,140,255,.12)', color: '#638cff', fontWeight: 600 },
  main: { padding: '20px 28px 40px', overflowY: 'auto' as const, color: '#c9d1d9' },
  briefCard: {
    background: 'linear-gradient(135deg, rgba(99,140,255,.12) 0%, rgba(99,140,255,.04) 100%)',
    border: '1px solid rgba(99,140,255,.2)', borderRadius: 12, padding: 18, marginBottom: 20,
  },
  searchInput: {
    width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 13,
    background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
    color: '#f0f6fc', outline: 'none', boxSizing: 'border-box' as const,
  },
  filterBtn: {
    padding: '4px 12px', borderRadius: 5, fontSize: 11, cursor: 'pointer',
    color: '#6b7a8d', background: 'transparent', border: '1px solid rgba(255,255,255,.06)',
  },
  filterActive: { background: '#638cff', color: '#fff', borderColor: '#638cff', fontWeight: 600 },
  feedItem: {
    padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,.04)',
  },
  loadMoreBtn: {
    padding: '8px 24px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
    color: '#638cff', background: 'rgba(99,140,255,.1)', border: '1px solid rgba(99,140,255,.2)',
    fontWeight: 600,
  },
};

'use client';
import { useState } from 'react';

const INDUSTRIES = ['定制家具', '装修设计', '硬装建材', '软装家具', '照明与智能', '公装', '商业设备', '家电', '连锁商业'];
const REGIONS = ['华东区', '华南区', '华北区', '华西区'];
const TYPES = [
  { value: 'customer_feedback', label: '客户反馈' },
  { value: 'competitor_info',   label: '竞对情报' },
  { value: 'market_signal',     label: '市场信号' },
  { value: 'other',             label: '其他' },
];

export default function SubmitPage() {
  const [form, setForm] = useState({
    salesName: '', region: '华东区', industry: '定制家具',
    customerName: '', intelType: 'customer_feedback', content: '',
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.salesName || !form.content) return alert('请填写姓名和情报内容');
    setLoading(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setResult({ ok: false, error: e.message });
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>📤 销售情报上报</h1>
        <p style={styles.desc}>上报一手信息，AI 自动分析洞察并入库情报系统</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>你的姓名 *</label>
              <input style={styles.input} placeholder="如：张三" value={form.salesName}
                onChange={e => setForm({...form, salesName: e.target.value})} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>所属大区</label>
              <select style={styles.input} value={form.region}
                onChange={e => setForm({...form, region: e.target.value})}>
                {REGIONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>行业</label>
              <select style={styles.input} value={form.industry}
                onChange={e => setForm({...form, industry: e.target.value})}>
                {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>情报类型</label>
              <select style={styles.input} value={form.intelType}
                onChange={e => setForm({...form, intelType: e.target.value})}>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>客户名称 (选填)</label>
            <input style={styles.input} placeholder="如：XX定制家具" value={form.customerName}
              onChange={e => setForm({...form, customerName: e.target.value})} />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>情报内容 *</label>
            <textarea style={{...styles.input, minHeight: 120, resize: 'vertical' as any}} placeholder={
`例如：
- 客户提到三维家最近在降价促销，报价比我们低40%
- 某客户说竞对提供了免费试用3个月的政策
- 当地新开了2家全屋定制门店，都在用AI出图工具`}
              value={form.content}
              onChange={e => setForm({...form, content: e.target.value})} />
          </div>

          <button type="submit" disabled={loading} style={{
            ...styles.btn,
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? '⏳ AI 分析中...' : '📤 提交情报'}
          </button>
        </form>

        {result && (
          <div style={{
            ...styles.result,
            borderColor: result.ok ? '#34d399' : '#f87171',
            background: result.ok ? 'rgba(52,211,153,.08)' : 'rgba(248,113,113,.08)',
          }}>
            {result.ok ? (
              <>
                <div style={{fontWeight: 700, marginBottom: 8, color: '#34d399'}}>✅ 上报成功</div>
                <div style={{fontSize: 13, lineHeight: 1.7}}>
                  <strong>AI 洞察：</strong>{result.data?.aiInsight}
                </div>
              </>
            ) : (
              <div style={{color: '#f87171'}}>❌ 失败: {result.error}</div>
            )}
          </div>
        )}

        <div style={styles.tip}>
          <strong>💡 企微/钉钉快捷上报：</strong>在群里 @情报机器人 直接发送信息即可自动入库。
          <br/>格式示例：<code>@情报助手 华南区定制家具客户反馈三维家在降价</code>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#06090f', display: 'flex', justifyContent: 'center', padding: '40px 20px' },
  container: { width: '100%', maxWidth: 640, color: '#c9d1d9' },
  title: { fontSize: 22, fontWeight: 700, color: '#f0f6fc', marginBottom: 4 },
  desc: { fontSize: 13, color: '#6b7a8d', marginBottom: 24 },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 12, color: '#6b7a8d', fontWeight: 500 },
  input: {
    padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)',
    background: '#111827', color: '#c9d1d9', fontSize: 13, outline: 'none',
    fontFamily: 'inherit',
  },
  btn: {
    padding: '10px 20px', borderRadius: 8, border: 'none',
    background: '#638cff', color: '#fff', fontSize: 14, fontWeight: 600,
    marginTop: 8,
  },
  result: {
    marginTop: 16, padding: 14, borderRadius: 8,
    border: '1px solid', fontSize: 13, lineHeight: 1.6,
  },
  tip: {
    marginTop: 24, padding: 14, borderRadius: 8,
    background: 'rgba(251,191,36,.06)', border: '1px solid rgba(251,191,36,.15)',
    fontSize: 12, color: '#6b7a8d', lineHeight: 1.7,
  },
};

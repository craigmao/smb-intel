import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '酷家乐 SMB 情报系统',
  description: '外部情报采集 · AI分析 · 行业洞察',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body style={{ margin: 0, padding: 0, fontFamily: '-apple-system, PingFang SC, Microsoft YaHei, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}

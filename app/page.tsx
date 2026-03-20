/**
 * 前端主页面
 * 静态导出v3的HTML作为MVP前端，后续改为SSR动态渲染
 * 生产环境中这个页面会从 /api/intel 拉取实时数据
 */
import { redirect } from 'next/navigation';

export default function Home() {
  // MVP阶段：直接渲染静态情报看板
  return redirect('/dashboard');
}

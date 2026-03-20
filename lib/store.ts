/**
 * 轻量数据存储层
 * MVP阶段用内存 + JSON文件，后续可换 Vercel KV / Upstash Redis / Supabase
 */
import { IntelItem, SalesUpload, DailyBrief } from './types';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
const ensureDir = () => { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true }); };

function readJSON<T>(file: string, fallback: T): T {
  ensureDir();
  const fp = path.join(DATA_DIR, file);
  if (!fs.existsSync(fp)) return fallback;
  try { return JSON.parse(fs.readFileSync(fp, 'utf-8')); } catch { return fallback; }
}

function writeJSON(file: string, data: unknown) {
  ensureDir();
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
}

// ===== 情报条目 =====
export function getIntelItems(limit = 100): IntelItem[] {
  const items: IntelItem[] = readJSON('intel.json', []);
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
}

export function addIntelItem(item: IntelItem) {
  const items = readJSON<IntelItem[]>('intel.json', []);
  // 去重: 标题相似度
  const exists = items.some(i => i.title === item.title);
  if (!exists) {
    items.unshift(item);
    // 只保留最近1000条
    writeJSON('intel.json', items.slice(0, 1000));
  }
}

export function addIntelItems(newItems: IntelItem[]) {
  newItems.forEach(addIntelItem);
}

// ===== 销售上报 =====
export function getSalesUploads(limit = 50): SalesUpload[] {
  const items: SalesUpload[] = readJSON('sales.json', []);
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
}

export function addSalesUpload(item: SalesUpload) {
  const items = readJSON<SalesUpload[]>('sales.json', []);
  items.unshift(item);
  writeJSON('sales.json', items.slice(0, 500));
}

// ===== 每日简报 =====
export function getDailyBrief(date?: string): DailyBrief | null {
  const briefs: DailyBrief[] = readJSON('briefs.json', []);
  if (date) return briefs.find(b => b.date === date) || null;
  return briefs[0] || null;
}

export function saveDailyBrief(brief: DailyBrief) {
  const briefs = readJSON<DailyBrief[]>('briefs.json', []);
  const idx = briefs.findIndex(b => b.date === brief.date);
  if (idx >= 0) briefs[idx] = brief;
  else briefs.unshift(brief);
  writeJSON('briefs.json', briefs.slice(0, 30)); // 保留30天
}

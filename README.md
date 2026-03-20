# 酷家乐 SMB 情报系统

纯外部情报采集系统，AI驱动，按小时刷新，支持销售一手上报。

## 快速部署到 Vercel（3步）

### Step 1: 推送到 GitHub
```bash
cd smb-intel
git init && git add . && git commit -m "init"
# 在GitHub上创建仓库 smb-intel，然后：
git remote add origin https://github.com/你的用户名/smb-intel.git
git push -u origin main
```

### Step 2: 在 Vercel 部署
1. 打开 [vercel.com](https://vercel.com) → Import Git Repository
2. 选择 `smb-intel` 仓库
3. 在 Environment Variables 中添加：

| Key | Value | 说明 |
|-----|-------|------|
| `QWEN_API_KEY` | `sk-xxx` | 阿里云百炼平台获取 |
| `QWEN_BASE_URL` | `https://dashscope.aliyuncs.com/compatible-mode/v1` | 通义千问API |

4. 点击 Deploy

### Step 3: 配置企微/钉钉机器人

**企业微信：**
1. 在目标群 → 群设置 → 群机器人 → 添加自定义机器人
2. 设置回调URL: `https://你的域名.vercel.app/api/webhook?platform=wecom`
3. 销售在群里 @机器人 + 发送情报文字即可

**钉钉：**
1. 在目标群 → 群设置 → 智能群助手 → 添加机器人 → 自定义(Outgoing)
2. 设置POST地址: `https://你的域名.vercel.app/api/webhook?platform=dingtalk`
3. 销售在群里 @机器人 + 发送情报文字即可

## 项目结构

```
smb-intel/
├── app/
│   ├── layout.tsx              # 全局布局
│   ├── page.tsx                # 首页(重定向到dashboard)
│   ├── dashboard/page.tsx      # 情报看板主页
│   ├── submit/page.tsx         # 销售上报表单页
│   └── api/
│       ├── intel/route.ts      # GET 情报列表API(支持行业/分类/平台过滤)
│       ├── upload/route.ts     # POST 销售上报API
│       ├── webhook/route.ts    # POST 企微/钉钉机器人回调
│       └── cron/
│           ├── collect/route.ts     # 每小时采集(Vercel Cron)
│           └── daily-brief/route.ts # 每日简报生成(每天9点)
├── lib/
│   ├── types.ts         # 类型定义 + 行业分类 + 平台配置
│   ├── qwen.ts          # Qwen API封装(分类/摘要/简报/销售分析)
│   ├── store.ts         # 数据存储层(JSON文件，可换Redis/DB)
│   └── collectors.ts    # 数据采集器(GitHub/DailyHot/MediaCrawler/WeChat)
├── vercel.json          # Vercel Cron配置(每小时+每日)
├── .env.example         # 环境变量模板
└── package.json
```

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/intel?industry=定制家具&category=competitor&limit=50` | GET | 获取情报列表 |
| `/api/upload` | POST | 销售上报情报 |
| `/api/webhook?platform=wecom` | POST | 企微机器人回调 |
| `/api/webhook?platform=dingtalk` | POST | 钉钉机器人回调 |
| `/api/cron/collect` | GET | 手动触发采集 |
| `/api/cron/daily-brief` | GET | 手动触发简报生成 |

## 扩展采集源

在 `.env` 中添加以下变量即可接入更多数据源：

```bash
# MediaCrawler (小红书/抖音/微博/知乎/B站)
MEDIACRAWLER_API_URL=http://localhost:8080

# DailyHotApi (60+热榜聚合)
DAILYHOT_API_URL=http://localhost:6688

# wewe-rss (微信公众号RSS)
WEWE_RSS_URL=http://localhost:4000
```

## 成本估算

| 项目 | 单价 | 日均用量 | 日成本 |
|------|------|---------|--------|
| Qwen-turbo (分类) | ¥0.3/百万token | ~50万token | ~¥0.15 |
| Qwen-plus (摘要) | ¥4/百万token | ~30万token | ~¥1.2 |
| Qwen-plus (日报) | ¥4/百万token | ~5万token | ~¥0.2 |
| Vercel Hobby | 免费 | - | ¥0 |
| **合计** | | | **~¥1.5-5/天** |

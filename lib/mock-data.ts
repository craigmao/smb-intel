import { IntelItem, DailyBrief, PlatformSource, IntelCategory, IndustryL1 } from './types';

// ===== 生成大量mock情报数据 =====
const uid = () => Math.random().toString(36).slice(2, 10);
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600000).toISOString();

// 平台搜索URL模板 — 点击后跳转到对应平台的搜索结果页
const urlTemplates: Record<PlatformSource, (keyword: string) => string> = {
  xiaohongshu: (kw) => `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(kw)}&type=1`,
  wechat_mp: (kw) => `https://weixin.sogou.com/weixin?type=2&query=${encodeURIComponent(kw)}`,
  wechat_video: (kw) => `https://weixin.sogou.com/weixin?type=2&query=${encodeURIComponent(kw)}`,
  douyin: (kw) => `https://www.douyin.com/search/${encodeURIComponent(kw)}`,
  toutiao: (kw) => `https://so.toutiao.com/search?keyword=${encodeURIComponent(kw)}`,
  weibo: (kw) => `https://s.weibo.com/weibo?q=${encodeURIComponent(kw)}`,
  zhihu: (kw) => `https://www.zhihu.com/search?type=content&q=${encodeURIComponent(kw)}`,
  bilibili: (kw) => `https://search.bilibili.com/all?keyword=${encodeURIComponent(kw)}`,
  github: (kw) => `https://github.com/search?q=${encodeURIComponent(kw)}&type=repositories`,
  web: (kw) => `https://www.baidu.com/s?wd=${encodeURIComponent(kw)}`,
  sales_upload: () => '',
};

function makeUrl(source: PlatformSource, keyword: string, fixedUrl?: string): string {
  if (fixedUrl) return fixedUrl;
  if (!keyword) return '';
  return urlTemplates[source](keyword);
}

function randomMetrics(source: PlatformSource): Record<string, string> {
  const r = (min: number, max: number) => String(min + Math.floor(Math.random() * (max - min)));
  switch (source) {
    case 'xiaohongshu': return { '❤️': r(200, 50000) >= '10000' ? (Number(r(1,50))/10).toFixed(1) + 'w' : r(200,9999), '💬': r(10, 3000), '⭐': r(50, 8000) };
    case 'wechat_mp': return { '阅读': r(5000, 100000) >= '10000' ? (Number(r(1,80))/10).toFixed(1) + 'w' : r(5000,9999), '在看': r(50, 3000) };
    case 'wechat_video': return { '▶️': (Number(r(1,50))/10).toFixed(1) + 'w', '❤️': r(200, 8000) };
    case 'douyin': return { '▶️': r(10,200) + 'w', '❤️': (Number(r(1,80))/10).toFixed(1) + 'w', '💬': r(500, 15000) };
    case 'toutiao': return { '阅读': (Number(r(5,100))/10).toFixed(1) + 'w', '评论': r(100, 5000) };
    case 'weibo': return { '转发': r(50, 5000), '评论': r(100, 8000), '点赞': r(200, 20000) };
    case 'zhihu': return { '赞同': r(100, 10000), '评论': r(50, 2000) };
    case 'bilibili': return { '▶️': (Number(r(1,50))/10).toFixed(1) + 'w', '弹幕': r(100, 5000) };
    case 'github': return { 'stars': r(50, 5000), 'forks': r(10, 1000) };
    default: return {};
  }
}

// ===== 情报条目模板库 =====
interface IntelTemplate {
  title: string;
  summary: string;
  source: PlatformSource;
  industry: IndustryL1[];
  category: IntelCategory;
  tags: string[];
  importance: 1 | 2 | 3;
  /** 精准搜索关键词，用于生成平台链接直达相关内容 */
  keyword: string;
  /** 固定URL（如GitHub真实仓库地址），优先于keyword生成的URL */
  fixedUrl?: string;
}

const templates: IntelTemplate[] = [
  // ===== 竞对动态 - 三维家 =====
  { title: '三维家2026版全面升级AI能力，SMB客户年费降至6800元/年，主攻三四线定制门店', summary: '→ 情报研判：直接对标酷家乐企业设计营销方案，价格低约40%。华南+华西区受冲击最大。', source: 'wechat_mp', industry: ['定制家具', '装修设计'], category: 'competitor', tags: ['价格战', '三维家', 'AI升级'], importance: 1, keyword: '三维家 2026 年费 6800' },
  { title: '三维家官宣与红星美凯龙达成战略合作，2026年进驻全国300+卖场', summary: '→ 情报研判：渠道扩张加速，红星美凯龙是酷家乐核心渠道之一，需关注终端抢客情况。', source: 'wechat_mp', industry: ['定制家具', '软装家具'], category: 'competitor', tags: ['渠道战', '三维家', '红星美凯龙'], importance: 1, keyword: '三维家 红星美凯龙 合作' },
  { title: '三维家华南区代理商大会：新增AI量房+自动报价，对标酷家乐前后端一体', summary: '→ 情报研判：三维家在功能上追赶酷家乐核心壁垒，华南区需紧盯代理商政策变化。', source: 'douyin', industry: ['定制家具'], category: 'competitor', tags: ['三维家', '功能对标', '华南区'], importance: 1, keyword: '三维家 AI量房 自动报价' },
  { title: '"三维家新版实测：AI出图确实快了，但材质和灯光细节跟酷家乐差距明显"', summary: '→ 情报研判：渲染品质壁垒依然成立，可作为销售对比话术。', source: 'xiaohongshu', industry: ['定制家具'], category: 'competitor', tags: ['竞对评测', '品质壁垒', '渲染对比'], importance: 2, keyword: '三维家 AI出图 渲染质量' },
  { title: '三维家App Store评分降至3.2，用户吐槽：闪退严重、客服不回', summary: '→ 情报研判：竞对服务品质下滑，可引导客户对比售后能力。', source: 'web', industry: ['定制家具'], category: 'competitor', tags: ['三维家', '口碑下滑', '服务差距'], importance: 2, keyword: '三维家 App 评分 闪退' },
  { title: '三维家被曝年度裁员30%，核心研发团队流失', summary: '→ 情报研判：竞对内部动荡，产品迭代或将放缓。对在犹豫的客户是正面信号。', source: 'weibo', industry: ['定制家具'], category: 'competitor', tags: ['三维家', '裁员', '研发流失'], importance: 2, keyword: '三维家 裁员 研发' },
  { title: '"换了三维家又换回酷家乐" — 定制门窗店主真实体验：渲染质量差客户不买单', summary: '→ 情报研判：回流信号。渲染品质仍是核心壁垒，可提炼为销售case。', source: 'xiaohongshu', industry: ['定制家具'], category: 'competitor', tags: ['竞对负面', '回流信号', '品质壁垒'], importance: 2, keyword: '三维家 回流 渲染质量' },
  { title: '三维家推出"0元试用30天"促销活动，针对酷家乐到期客户', summary: '→ 情报研判：定向挖角策略，需提前锁定即将到期的客户做续费沟通。', source: 'wechat_mp', industry: ['定制家具', '装修设计'], category: 'competitor', tags: ['三维家', '促销', '挖角'], importance: 1, keyword: '三维家 试用 促销' },

  // ===== 竞对动态 - 打扮家 =====
  { title: '打扮家获得B轮融资2亿元，加速VR家装体验中心全国布局', summary: '→ 情报研判：VR体验赛道升温，打扮家资金充裕将加大市场投入。', source: 'toutiao', industry: ['装修设计'], category: 'competitor', tags: ['打扮家', '融资', 'VR家装'], importance: 2, keyword: '打扮家 VR 融资' },
  { title: '打扮家联合索菲亚发布"VR全屋定制体验方案"', summary: '→ 情报研判：头部定制品牌+VR方案合作，酷家乐需强化VR场景差异化。', source: 'wechat_mp', industry: ['定制家具'], category: 'competitor', tags: ['打扮家', '索菲亚', 'VR'], importance: 2, keyword: '打扮家 VR 全屋定制' },

  // ===== 竞对动态 - 躺平设计家 =====
  { title: '躺平设计家上线"AI智能方案"功能，30秒生成全屋设计', summary: '→ 情报研判：阿里系AI能力加持，对中低端设计场景形成冲击。', source: 'toutiao', industry: ['装修设计', '定制家具'], category: 'competitor', tags: ['躺平设计家', 'AI方案', '阿里系'], importance: 2, keyword: '躺平设计家 AI 全屋' },
  { title: '躺平设计家与天猫家装打通，电商客户可直接调用设计工具', summary: '→ 情报研判：电商+设计工具闭环，酷家乐在电商生态的渗透需加速。', source: 'wechat_mp', industry: ['装修设计', '定制家具'], category: 'competitor', tags: ['躺平设计家', '天猫', '电商闭环'], importance: 2, keyword: '躺平设计家 天猫 电商' },

  // ===== 竞对动态 - 知户型 =====
  { title: '知户型宣布永久免费开放量房功能，加速抢占设计师入口', summary: '→ 情报研判：免费策略对酷家乐量房模块形成直接冲击，需考虑应对方案。', source: 'weibo', industry: ['装修设计'], category: 'competitor', tags: ['知户型', '免费', '量房'], importance: 2, keyword: '知户型 免费 量房' },

  // ===== 市场信号 - 小红书 =====
  { title: '"小门店也能做高级效果图" — 三四线定制店主分享用AI出图替代设计软件，月省3000+', summary: '→ 情报研判：中小客户"够用就好"需求强烈，AI免费工具蚕食低端市场。', source: 'xiaohongshu', industry: ['定制家具'], category: 'market', tags: ['AI替代', '下沉市场', 'SMB痛点'], importance: 1, keyword: '小门店 AI出图 效果图' },
  { title: '小红书热帖："全屋定制避坑指南"，15万收藏，评论区大量问设计工具', summary: '→ 情报研判：C端用户对设计可视化需求强烈，B端门店需响应"所见即所得"需求。', source: 'xiaohongshu', industry: ['定制家具'], category: 'user_voice', tags: ['用户需求', '全屋定制', '可视化'], importance: 2, keyword: '全屋定制 避坑 工具' },
  { title: '"用了酷家乐后客户转化率提高了60%" — 佛山定制商家分享', summary: '→ 情报研判：优质用户案例，可作为销售工具和续费话术。', source: 'xiaohongshu', industry: ['定制家具'], category: 'market', tags: ['正面口碑', '转化提升', '用户案例'], importance: 2, keyword: '酷家乐 转化率 佛山' },
  { title: '"定制家具店装修花了20万，设计软件选对了真的省一半" — 店主日记', summary: '→ 情报研判：ROI认知教育素材，适合销售转发给犹豫客户。', source: 'xiaohongshu', industry: ['定制家具'], category: 'user_voice', tags: ['ROI', '用户分享', '设计工具'], importance: 3, keyword: '定制家具 设计软件 ROI' },
  { title: '"橱柜设计太难了！有没有简单好用的软件推荐？" — 3000+评论', summary: '→ 情报研判：橱柜定制细分赛道需求旺盛，可定向推广酷家乐橱柜方案。', source: 'xiaohongshu', industry: ['定制家具'], category: 'user_voice', tags: ['橱柜', '用户需求', '产品推广'], importance: 2, keyword: '橱柜 设计 软件' },
  { title: '"家装公司老板必看：5个提高签单率的数字化工具"，酷家乐位列第一', summary: '→ 情报研判：KOL自发推荐，品牌认知优势确认。可联系作者做深度合作。', source: 'xiaohongshu', industry: ['装修设计'], category: 'market', tags: ['品牌正面', 'KOL推荐', '签单率'], importance: 2, keyword: '签单率 数字化工具' },
  { title: '"全铝家居设计效果图怎么做？这个工具太强了" — 全铝定制博主分享', summary: '→ 情报研判：全铝定制细分赛道增长信号，产品适配度高可深耕。', source: 'xiaohongshu', industry: ['定制家具'], category: 'market', tags: ['全铝定制', '细分增长', '用户推荐'], importance: 3, keyword: '全铝家居 效果图' },
  { title: '"装修公司如何用AI提升方案设计效率"——设计师博主5万粉丝实操分享', summary: '→ 情报研判：AI+设计工具的工作流已有先行者验证，可作为标杆案例推广。', source: 'xiaohongshu', industry: ['装修设计'], category: 'tech', tags: ['AI效率', '设计工作流', '先行者'], importance: 2, keyword: 'AI 方案设计 效率' },
  { title: '"为什么我建议新开的家居店一定要上酷家乐" — 5年经验店主分享', summary: '→ 情报研判：忠实用户自发推广，内容可提炼为素材支持销售。', source: 'xiaohongshu', industry: ['定制家具', '软装家具'], category: 'user_voice', tags: ['用户推荐', '口碑传播', '新店'], importance: 2, keyword: '新店 数字化 口碑' },
  { title: '"从0到月入10万，定制家具店老板的数字化转型之路"——提到核心工具是酷家乐', summary: '→ 情报研判：创业成功案例，对新开店客户极具说服力。', source: 'xiaohongshu', industry: ['定制家具'], category: 'market', tags: ['创业案例', '数字化', '口碑'], importance: 2, keyword: '定制家具 数字化 月入' },
  { title: '"2026年最值得投资的家居设计软件对比" — 测评博主横评5款工具', summary: '→ 情报研判：行业横评曝光，需关注评价内容和排名变化。', source: 'xiaohongshu', industry: ['定制家具', '装修设计'], category: 'competitor', tags: ['横评', '工具对比', '品牌曝光'], importance: 2, keyword: '2026 设计软件 对比' },
  { title: '"瓷砖铺贴效果图用什么软件？老板推荐了酷家乐" — 建材店笔记', summary: '→ 情报研判：硬装建材场景口碑渗透，瓷砖商家是潜在客户。', source: 'xiaohongshu', industry: ['硬装建材'], category: 'user_voice', tags: ['瓷砖', '建材', '口碑渗透'], importance: 3, keyword: '瓷砖 铺贴 效果图' },

  // ===== 市场信号 - 微信公众号 =====
  { title: '《2025定制家居数字化白皮书》：72%中小企业计划增加数字化投入', summary: '→ 情报研判：行业大盘利好，"设计营销一体化"是酷家乐核心定位。', source: 'wechat_mp', industry: ['定制家具'], category: 'market', tags: ['利好', '白皮书', '设计营销'], importance: 1, keyword: '定制家居 数字化 白皮书' },
  { title: '欧派家居2025财报：定制收入增长15%，加速门店数字化升级', summary: '→ 情报研判：头部品牌数字化投入加大，可借势推广酷家乐企业版方案。', source: 'wechat_mp', industry: ['定制家具'], category: 'market', tags: ['欧派', '财报', '数字化升级'], importance: 2, keyword: '欧派家居 财报 数字化' },
  { title: '索菲亚官宣：2026年全面推广AI设计工具，赋能全国2000+经销商', summary: '→ 情报研判：定制头部品牌AI化加速，酷家乐是否为其核心供应商需确认。', source: 'wechat_mp', industry: ['定制家具'], category: 'market', tags: ['索菲亚', 'AI设计', '经销商'], importance: 1, keyword: '索菲亚 AI设计 经销商' },
  { title: '尚品宅配发布"AI整装方案"，一键生成全屋设计+施工图+报价单', summary: '→ 情报研判：整装+AI是行业趋势，酷家乐需保持方案完整性优势。', source: 'wechat_mp', industry: ['定制家具', '装修设计'], category: 'competitor', tags: ['尚品宅配', 'AI整装', '一体化'], importance: 2, keyword: '尚品宅配 AI 整装' },
  { title: '中国家居协会：2026年家装行业预计增长8%，中小企业数字化率将达45%', summary: '→ 情报研判：行业增长确认+数字化渗透提速，SMB市场潜力持续释放。', source: 'wechat_mp', industry: ['定制家具', '装修设计', '硬装建材'], category: 'market', tags: ['行业增长', '数字化率', '市场利好'], importance: 1, keyword: '家装行业 2026 增长' },
  { title: '红星美凯龙发布"数字化门店2.0计划"，要求入驻商家必须使用设计工具', summary: '→ 情报研判：渠道推动数字化硬性要求，酷家乐作为合作方可直接受益。', source: 'wechat_mp', industry: ['定制家具', '软装家具', '硬装建材'], category: 'market', tags: ['红星美凯龙', '数字化门店', '渠道利好'], importance: 1, keyword: '红星美凯龙 数字化' },
  { title: '居然之家启动"AI设计师计划"，2026年培训10000名数字化设计师', summary: '→ 情报研判：卖场端培训需求爆发，可争取成为培训平台合作方。', source: 'wechat_mp', industry: ['定制家具', '装修设计'], category: 'market', tags: ['居然之家', 'AI培训', '设计师'], importance: 2, keyword: '居然之家 AI设计师' },
  { title: '好莱客财报：全屋定制客单价下降12%，开始主攻性价比市场', summary: '→ 情报研判：定制品牌下沉，性价比市场竞争加剧，酷家乐SMB版匹配度高。', source: 'wechat_mp', industry: ['定制家具'], category: 'market', tags: ['好莱客', '客单价', '下沉'], importance: 2, keyword: '好莱客 财报 性价比' },
  { title: '志邦家居CEO访谈："设计数字化是未来3年最大投资方向"', summary: '→ 情报研判：头部品牌CEO公开站台数字化，可作为行业说服力素材。', source: 'wechat_mp', industry: ['定制家具'], category: 'market', tags: ['志邦', 'CEO观点', '数字化投资'], importance: 2, keyword: '志邦 设计 数字化' },
  { title: '金牌橱柜2026年经销商大会：全面推广3D云设计，首选合作方为酷家乐', summary: '→ 情报研判：品牌合作正面信号，可借势推广到同行业其他品牌。', source: 'wechat_mp', industry: ['定制家具'], category: 'market', tags: ['金牌橱柜', '品牌合作', '正面信号'], importance: 2, keyword: '金牌橱柜 3D 设计' },
  { title: '照明行业洗牌加速：智能照明渗透率35%，传统灯企转向设计端', summary: '→ 情报研判：照明客户的转型企业可能产生新设计工具需求。', source: 'wechat_mp', industry: ['照明与智能'], category: 'tech', tags: ['行业转型', '新需求', '照明'], importance: 2, keyword: '照明 智能 渗透率' },
  { title: '装配式装修政策加码：2026年新建保障房100%采用装配式内装', summary: '→ 情报研判：公装+装配式赛道政策红利，酷家乐BIM模块可切入。', source: 'wechat_mp', industry: ['公装'], category: 'policy', tags: ['装配式', '保障房', '政策红利'], importance: 1, keyword: '装配式 保障房 2026' },
  { title: '东鹏瓷砖启动"数字化营销中台"项目，年投入超5000万', summary: '→ 情报研判：建材龙头数字化大投入，酷家乐可争取瓷砖行业标杆项目。', source: 'wechat_mp', industry: ['硬装建材'], category: 'market', tags: ['东鹏', '数字营销', '建材'], importance: 2, keyword: '东鹏瓷砖 数字化' },
  { title: '全友家居加速线上化：直播间月销破亿，需要大量效果图支撑', summary: '→ 情报研判：成品家具直播电商需求，设计出图能力是核心赋能点。', source: 'wechat_mp', industry: ['软装家具'], category: 'market', tags: ['全友', '直播电商', '出图需求'], importance: 2, keyword: '全友家居 直播 效果图' },
  { title: '蒙娜丽莎瓷砖×酷家乐联合发布"岩板应用效果图库"', summary: '→ 情报研判：品牌共建内容生态，岩板是高毛利品类，客户粘性强。', source: 'wechat_mp', industry: ['硬装建材'], category: 'market', tags: ['岩板', '品牌合作', '内容生态'], importance: 2, keyword: '岩板 效果图 应用' },
  { title: '酒店设计行业报告：中端酒店翻新潮来临，设计数字化需求激增', summary: '→ 情报研判：连锁商业-酒店细分赛道机会，可开发标准化酒店设计模板。', source: 'wechat_mp', industry: ['连锁商业'], category: 'market', tags: ['酒店翻新', '设计需求', '标准化'], importance: 2, keyword: '酒店 设计 翻新' },
  { title: '智能家居市场规模突破8000亿，全屋智能设计工具需求井喷', summary: '→ 情报研判：智能家居+设计工具的交叉需求，产品可考虑增加智能设备展示能力。', source: 'wechat_mp', industry: ['照明与智能'], category: 'tech', tags: ['智能家居', '市场规模', '井喷'], importance: 2, keyword: '智能家居 设计工具' },

  // ===== 市场信号 - 抖音 =====
  { title: '"AI 10秒出图 vs 专业设计软件" 对比测评视频爆火 — 复杂定制场景仍需酷家乐类工具', summary: '→ 情报研判：市场认知分化，护城河在"复杂定制+前后端一体"。', source: 'douyin', industry: ['定制家具', '装修设计'], category: 'tech', tags: ['AI冲击', '专业壁垒', '场景分化'], importance: 2, keyword: 'AI出图 专业设计 对比' },
  { title: '"开定制家具店需要多少钱" 系列视频，创作者建议先用免费工具起步', summary: '→ 情报研判：创业客户典型心态——先省钱。入门方案价格感知是障碍。', source: 'douyin', industry: ['定制家具'], category: 'market', tags: ['价格认知', '创业客户', '免费冲击'], importance: 3, keyword: '定制家具 创业 成本' },
  { title: '"一分钟看懂全屋定制设计流程"——设计师演示酷家乐操作，200w播放', summary: '→ 情报研判：短视频传播提升品牌认知，可联系创作者做官方合作。', source: 'douyin', industry: ['定制家具'], category: 'market', tags: ['品牌曝光', '短视频', '设计流程'], importance: 2, keyword: '全屋定制 设计流程' },
  { title: '"2026年家装行业最大变化：AI设计替代人工？" — 500w播放', summary: '→ 情报研判：AI替代焦虑在设计师群体蔓延，需强调"AI赋能而非替代"定位。', source: 'douyin', industry: ['装修设计'], category: 'tech', tags: ['AI替代焦虑', '设计师', '行业变化'], importance: 2, keyword: 'AI 设计 替代' },
  { title: '"家装公司老板自述：引入数字化工具后签单率翻倍" — 抖音直播片段', summary: '→ 情报研判：用户自发直播证言，比官方广告更有说服力。', source: 'douyin', industry: ['装修设计'], category: 'user_voice', tags: ['用户证言', '签单翻倍', '直播'], importance: 2, keyword: '家装公司 签单率 工具' },
  { title: '"定制衣柜设计效果图教程"系列，创作者全程使用酷家乐——累计800w播放', summary: '→ 情报研判：内容营销阵地，可官方跟进合作。', source: 'douyin', industry: ['定制家具'], category: 'market', tags: ['教程内容', '品牌曝光', '衣柜设计'], importance: 2, keyword: '衣柜设计 教程' },
  { title: '"如何用AI做出甲方满意的装修方案？" — 80w播放实操教程', summary: '→ 情报研判：AI辅助设计实操内容走热，说明市场已进入落地阶段。', source: 'douyin', industry: ['装修设计'], category: 'tech', tags: ['AI实操', '装修方案', '落地'], importance: 3, keyword: 'AI 装修方案 实操' },
  { title: '"别再花冤枉钱了！家装设计软件大盘点"——酷家乐被重点推荐', summary: '→ 情报研判：KOL自发推荐，品牌知名度领先。', source: 'douyin', industry: ['装修设计', '定制家具'], category: 'market', tags: ['KOL推荐', '品牌领先', '软件盘点'], importance: 2, keyword: '家装设计 软件 推荐' },
  { title: '"3天学会全屋定制设计"——某培训机构用酷家乐做教学工具，10w报名', summary: '→ 情报研判：教育场景渗透，培训机构是重要的生态伙伴。', source: 'douyin', industry: ['定制家具'], category: 'market', tags: ['教育场景', '培训机构', '生态'], importance: 3, keyword: '全屋定制 培训 教学' },
  { title: '"全屋智能灯光设计方案"——智能家居博主演示灯光效果图，讨论区问软件', summary: '→ 情报研判：照明+智能场景出图需求，可作为切入照明行业的内容营销素材。', source: 'douyin', industry: ['照明与智能'], category: 'user_voice', tags: ['灯光设计', '智能照明', '出图需求'], importance: 3, keyword: '灯光设计 智能 方案' },

  // ===== 政策法规 =====
  { title: '住建部新规：2026年起家装行业BIM数据统一标准，中小企业面临合规升级压力', summary: '→ 情报研判：硬装建材客户合规驱动的升级需求。酷家乐BIM能力是差异化优势。', source: 'toutiao', industry: ['硬装建材'], category: 'policy', tags: ['政策利好', 'BIM标准', '增值机会'], importance: 1, keyword: '住建部 BIM 家装标准' },
  { title: '国务院：加大家居消费补贴力度，重点支持绿色智能家居', summary: '→ 情报研判：消费刺激政策将拉动家居市场整体需求，间接利好设计工具市场。', source: 'toutiao', industry: ['定制家具', '照明与智能', '家电'], category: 'policy', tags: ['消费补贴', '政策利好', '绿色家居'], importance: 1, keyword: '国务院 家居 补贴' },
  { title: '商务部发布《家装行业服务标准》征求意见稿，明确数字化交付要求', summary: '→ 情报研判：行业标准化推动数字化成为刚需，酷家乐作为行业标准参与方优势明显。', source: 'web', industry: ['装修设计', '定制家具'], category: 'policy', tags: ['行业标准', '数字化交付', '刚需'], importance: 1, keyword: '商务部 家装 数字化' },
  { title: '工信部：支持中小企业数字化转型，提供最高100万补贴', summary: '→ 情报研判：政策补贴降低客户采购成本，销售可引导客户申请后购买。', source: 'toutiao', industry: ['定制家具', '装修设计', '硬装建材'], category: 'policy', tags: ['数字化补贴', '中小企业', '政策红利'], importance: 1, keyword: '工信部 数字化 补贴' },
  { title: '广东省出台"数字化绿色家居产业集群"政策，佛山、广州先行试点', summary: '→ 情报研判：华南区政策利好，佛山是家具核心产区，酷家乐可借势推广。', source: 'toutiao', industry: ['定制家具', '硬装建材'], category: 'policy', tags: ['广东政策', '佛山', '产业集群'], importance: 2, keyword: '广东 数字化 佛山' },
  { title: '上海市发布"智能建造"三年行动计划，推进BIM技术在装修领域应用', summary: '→ 情报研判：华东区BIM政策加码，公装+家装双赛道可受益。', source: 'web', industry: ['公装', '装修设计'], category: 'policy', tags: ['上海政策', '智能建造', 'BIM'], importance: 2, keyword: '上海 智能建造 BIM' },
  { title: '消防新规影响公装行业：商业空间装修审批流程数字化', summary: '→ 情报研判：公装审批数字化倒逼设计数字化，BIM和3D模型成为标配。', source: 'toutiao', industry: ['公装', '连锁商业'], category: 'policy', tags: ['消防新规', '公装审批', '数字化'], importance: 2, keyword: '消防新规 公装 审批' },
  { title: '浙江省"未来社区"建设标准：要求100%数字化设计交付', summary: '→ 情报研判：浙江省政策推动，酷家乐总部所在地政策优势明显。', source: 'web', industry: ['装修设计', '公装'], category: 'policy', tags: ['浙江政策', '数字化设计', '未来社区'], importance: 2, keyword: '未来社区 设计交付' },

  // ===== 技术趋势 =====
  { title: 'Stable Diffusion 3.5发布：室内设计生成效果大幅提升，设计师圈讨论激烈', summary: '→ 情报研判：开源AI生成技术对设计工具的替代压力增大，需加速AI功能集成。', source: 'zhihu', industry: ['装修设计', '定制家具'], category: 'tech', tags: ['AI生成', 'Stable Diffusion', '技术冲击'], importance: 1, keyword: 'Stable Diffusion 室内设计' },
  { title: 'Apple Vision Pro推出"空间设计"App，支持AR实时家装效果预览', summary: '→ 情报研判：AR家装进入苹果生态，长期可能重塑客户体验流程。', source: 'toutiao', industry: ['装修设计', '定制家具'], category: 'tech', tags: ['AR', 'Apple', '家装体验'], importance: 2, keyword: 'Apple Vision Pro AR' },
  { title: '阿里云Qwen大模型开放家居行业Fine-tune接口，设计类对话精度提升50%', summary: '→ 情报研判：Qwen行业化能力提升，酷家乐可深化AI接入降低成本。', source: 'web', industry: ['定制家具', '装修设计'], category: 'tech', tags: ['Qwen', '行业大模型', 'AI能力'], importance: 2, keyword: 'Qwen 家居 模型' },
  { title: '百度文心一言发布"AI室内设计助手"，支持自然语言描述生成方案', summary: '→ 情报研判：大厂进入AI设计赛道，通用工具vs垂直工具的竞争格局需关注。', source: 'toutiao', industry: ['装修设计'], category: 'tech', tags: ['文心一言', 'AI设计', '大厂入局'], importance: 2, keyword: '文心一言 AI设计' },
  { title: 'Nvidia Omniverse更新：实时光追渲染成本降低80%，对云渲染架构有重大影响', summary: '→ 情报研判：底层渲染技术突破，可能降低酷家乐渲染成本，提升用户体验。', source: 'github', industry: ['定制家具', '装修设计'], category: 'tech', tags: ['Nvidia', '渲染技术', '成本降低'], importance: 2, keyword: 'Nvidia Omniverse 渲染' },
  { title: 'WebGPU标准正式落地Chrome：浏览器端3D渲染性能提升10倍', summary: '→ 情报研判：Web端3D体验将大幅提升，酷家乐SaaS架构可直接受益。', source: 'github', industry: ['装修设计', '定制家具'], category: 'tech', tags: ['WebGPU', '渲染性能', '技术利好'], importance: 2, keyword: 'WebGPU Chrome 3D' },
  { title: 'OpenAI发布GPT-4o图像理解：可直接解析户型图生成JSON', summary: '→ 情报研判：AI识别户型图技术成熟，可考虑集成到量房-导入流程。', source: 'zhihu', industry: ['装修设计'], category: 'tech', tags: ['GPT-4o', '户型识别', 'AI能力'], importance: 2, keyword: 'GPT-4o 户型图 识别' },
  { title: '3D Gaussian Splatting技术突破：手机拍照即可生成3D场景模型', summary: '→ 情报研判：量房+建模一体化的未来技术方向，需保持技术关注。', source: 'bilibili', industry: ['装修设计', '定制家具'], category: 'tech', tags: ['3D建模', '手机扫描', '新技术'], importance: 3, keyword: '3D建模 手机扫描' },
  { title: 'GitHub热门：开源BIM引擎 xBIM 获得3000 stars，支持IFC标准', summary: '→ 情报研判：开源BIM生态壮大，可评估集成或参考其架构优势。', source: 'github', industry: ['公装', '硬装建材'], category: 'tech', tags: ['开源BIM', 'xBIM', 'IFC标准'], importance: 3, fixedUrl: 'https://github.com/xBimTeam/XbimEssentials', keyword: 'xBIM BIM' },
  { title: 'Unity发布"实时室内光照模拟"工具包，支持一键导入CAD图纸', summary: '→ 情报研判：游戏引擎跨界家装，渲染品质竞争升维。', source: 'web', industry: ['装修设计', '照明与智能'], category: 'tech', tags: ['Unity', '光照模拟', '渲染竞争'], importance: 3, keyword: 'Unity 光照模拟' },

  // ===== 视频号 =====
  { title: '广州建博会现场：AI+VR成最大看点，超60%参展商表达数字化升级意愿', summary: '→ 情报研判：展会信号确认行业数字化提速，参展企业名单可作为拓新线索。', source: 'wechat_video', industry: ['定制家具', '硬装建材', '软装家具'], category: 'market', tags: ['品牌正面', '展会', '拓新线索'], importance: 1, keyword: '建博会 AI VR 展会' },
  { title: '酷家乐创始人在视频号直播：2026年战略聚焦SMB和AI两大方向', summary: '→ 情报研判：公司战略确认SMB重心，内部资源倾斜信号。', source: 'wechat_video', industry: ['定制家具', '装修设计'], category: 'market', tags: ['公司战略', 'SMB聚焦', 'AI方向'], importance: 1, keyword: '酷家乐 SMB AI 战略' },
  { title: '"家具展会上被这个设计工具惊到了"——视频号博主现场体验', summary: '→ 情报研判：展会现场UGC内容，真实感强，可转发增强品牌信任。', source: 'wechat_video', industry: ['定制家具', '软装家具'], category: 'user_voice', tags: ['展会', 'UGC', '品牌信任'], importance: 3, keyword: '家具展会 设计工具' },
  { title: '东莞家具展直播：30+定制品牌展示数字化设计方案，酷家乐方案占比超40%', summary: '→ 情报研判：行业展会中的品牌渗透率数据，极具说服力。', source: 'wechat_video', industry: ['定制家具', '软装家具'], category: 'market', tags: ['展会', '品牌渗透', '市占率'], importance: 2, keyword: '东莞家具展 直播' },
  { title: '"如何在视频号卖家具？效果图是关键"——家居直播运营分享', summary: '→ 情报研判：视频号家居直播需要效果图支撑，出图能力是直播转化核心工具。', source: 'wechat_video', industry: ['软装家具', '定制家具'], category: 'market', tags: ['视频号直播', '效果图', '直播转化'], importance: 2, keyword: '视频号 家具 效果图' },

  // ===== 微博 =====
  { title: '#全屋定制翻车# 话题阅读量破5亿，消费者投诉设计效果与实际不符', summary: '→ 情报研判：行业痛点凸显，酷家乐"所见即所得"能力是解决方案。', source: 'weibo', industry: ['定制家具'], category: 'user_voice', tags: ['消费投诉', '效果不符', '产品机会'], importance: 2, keyword: '全屋定制 翻车 效果' },
  { title: '#AI设计师# 话题热度飙升，1.2亿阅读，设计师群体讨论被AI替代', summary: '→ 情报研判：全网AI替代焦虑，酷家乐需强调"AI赋能设计师"而非替代。', source: 'weibo', industry: ['装修设计'], category: 'tech', tags: ['AI替代焦虑', '设计师', '品牌定位'], importance: 2, keyword: 'AI设计师 替代 焦虑' },
  { title: '#家装315# 曝光：多家装修公司使用盗版设计软件，版权风险巨大', summary: '→ 情报研判：正版化趋势利好SaaS订阅模式，可作为销售合规话术。', source: 'weibo', industry: ['装修设计'], category: 'policy', tags: ['正版化', '合规', '版权风险'], importance: 2, keyword: '家装 盗版 版权' },
  { title: '家居博主"设计师小美"微博粉丝破100万，经常展示酷家乐效果图', summary: '→ 情报研判：头部家居KOL使用酷家乐，品牌影响力持续扩大。', source: 'weibo', industry: ['装修设计', '定制家具'], category: 'market', tags: ['KOL', '品牌影响', '设计师'], importance: 3, keyword: '设计师小美 KOL' },

  // ===== 知乎 =====
  { title: '"酷家乐和三维家到底选哪个？" — 知乎高赞回答对比分析（2.5万赞）', summary: '→ 情报研判：知乎高质量对比内容影响决策，需监控回答趋势和口碑变化。', source: 'zhihu', industry: ['定制家具', '装修设计'], category: 'competitor', tags: ['工具对比', '口碑', '知乎高赞'], importance: 2, keyword: '酷家乐 三维家 对比' },
  { title: '"家装公司有必要花钱买设计软件吗？" — 知乎热门话题120万浏览', summary: '→ 情报研判：潜在客户决策期问题，高质量回答可引导转化。', source: 'zhihu', industry: ['装修设计'], category: 'user_voice', tags: ['购买决策', '用户疑虑', '转化机会'], importance: 2, keyword: '家装公司 设计软件' },
  { title: '"AI时代家装设计师的出路在哪？" — 知乎万赞回答引发行业讨论', summary: '→ 情报研判：设计师群体关注AI影响，酷家乐可推出AI培训方案吸引设计师生态。', source: 'zhihu', industry: ['装修设计'], category: 'tech', tags: ['设计师焦虑', 'AI影响', '培训机会'], importance: 2, keyword: 'AI设计师 出路' },
  { title: '"中小型装修公司如何做数字化转型？" — 知乎专栏系列文章获10w+阅读', summary: '→ 情报研判：中小企业数字化转型认知提升，酷家乐SMB方案高度匹配。', source: 'zhihu', industry: ['装修设计', '定制家具'], category: 'market', tags: ['数字化转型', '中小企业', 'SMB匹配'], importance: 2, keyword: '装修公司 数字化' },

  // ===== B站 =====
  { title: '"酷家乐从入门到精通"系列教程——B站播放量破500万', summary: '→ 情报研判：B站年轻设计师群体活跃，教程生态利好用户增长。', source: 'bilibili', industry: ['装修设计', '定制家具'], category: 'market', tags: ['教程生态', 'B站', '用户增长'], importance: 2, keyword: '酷家乐 教程 入门' },
  { title: '"室内设计软件横评：酷家乐vs三维家vs SketchUp" — 30万播放', summary: '→ 情报研判：专业横评内容，酷家乐在上手难度和出图速度上优势明显。', source: 'bilibili', industry: ['装修设计'], category: 'competitor', tags: ['横评', '上手难度', '出图速度'], importance: 2, keyword: '设计软件 横评' },
  { title: '"AI+3D渲染技术深度解析"——技术UP主详解行业底层技术演变', summary: '→ 情报研判：技术科普内容触达开发者和技术型决策者。', source: 'bilibili', industry: ['装修设计'], category: 'tech', tags: ['技术科普', '渲染', 'AI+3D'], importance: 3, keyword: 'AI 3D渲染 技术' },
  { title: '"一个月用酷家乐做了100套效果图"——设计师UP主效率挑战', summary: '→ 情报研判：效率证明型内容，可作为销售素材给犹豫客户。', source: 'bilibili', industry: ['定制家具', '装修设计'], category: 'user_voice', tags: ['效率证明', '用户案例', '销售素材'], importance: 2, keyword: '效果图 效率 挑战' },

  // ===== 头条 =====
  { title: '2026年定制家具行业十大趋势预测：AI设计、极简风、环保材料成关键词', summary: '→ 情报研判：行业趋势确认AI设计为核心方向，酷家乐产品路线与趋势一致。', source: 'toutiao', industry: ['定制家具'], category: 'market', tags: ['行业趋势', 'AI设计', '2026'], importance: 2, keyword: '定制家具 趋势 2026' },
  { title: '家装行业"价格战"升级：多家装修公司推出"免费设计"引流', summary: '→ 情报研判：B端"免费设计"引流策略倒逼工具效率提升，快速出图能力是刚需。', source: 'toutiao', industry: ['装修设计'], category: 'market', tags: ['价格战', '免费设计', '效率需求'], importance: 2, keyword: '家装 免费设计 价格战' },
  { title: '家居新零售：线上设计+线下体验成为标配，设计工具成连接器', summary: '→ 情报研判：新零售模式下设计工具是O2O连接器，酷家乐定位精准。', source: 'toutiao', industry: ['定制家具', '软装家具'], category: 'market', tags: ['新零售', 'O2O', '连接器'], importance: 2, keyword: '新零售 设计 O2O' },
  { title: '三四线城市家居消费升级：设计需求从"有就行"转向"要好看"', summary: '→ 情报研判：下沉市场消费升级利好专业设计工具渗透。', source: 'toutiao', industry: ['定制家具', '装修设计'], category: 'market', tags: ['下沉市场', '消费升级', '设计需求'], importance: 2, keyword: '三四线城市 家居' },
  { title: '教育部：将"数字化设计"纳入职业技术教育必修课', summary: '→ 情报研判：教育端政策推动，酷家乐教育版长期增长空间确认。', source: 'toutiao', industry: ['装修设计'], category: 'policy', tags: ['教育政策', '数字设计', '长期利好'], importance: 2, keyword: '教育部 数字化设计' },

  // ===== GitHub =====
  { title: '[GitHub] three.js/three.js: 3D渲染引擎重大更新，新增室内场景优化模块', summary: '⭐98.5k | JavaScript | 最近更新 2026-03-19', source: 'github', industry: ['装修设计'], category: 'tech', tags: ['three.js', '3D渲染', '开源'], importance: 3, fixedUrl: 'https://github.com/mrdoob/three.js', keyword: 'three.js 室内渲染' },
  { title: '[GitHub] openai/shap-e: 文字/图片生成3D模型的AI工具', summary: '⭐12.8k | Python | 最近更新 2026-03-15', source: 'github', industry: ['装修设计', '定制家具'], category: 'tech', tags: ['AI生成3D', 'OpenAI', '开源'], importance: 2, fixedUrl: 'https://github.com/openai/shap-e', keyword: 'shap-e 3D生成' },
  { title: '[GitHub] NVlabs/instant-ngp: NVIDIA实时神经辐射场渲染', summary: '⭐16.2k | CUDA | 最近更新 2026-03-18', source: 'github', industry: ['装修设计'], category: 'tech', tags: ['NeRF', 'NVIDIA', '渲染技术'], importance: 3, fixedUrl: 'https://github.com/NVlabs/instant-ngp', keyword: 'instant-ngp 渲染' },
  { title: '[GitHub] xBIM/XbimEssentials: 开源BIM工具库更新2.0版本', summary: '⭐3.2k | C# | 最近更新 2026-03-17', source: 'github', industry: ['公装', '硬装建材'], category: 'tech', tags: ['BIM', '开源', 'IFC'], importance: 3, fixedUrl: 'https://github.com/xBimTeam/XbimEssentials', keyword: 'xBIM BIM' },
  { title: '[GitHub] AIsuan/MediaCrawler: 多平台爬虫工具新增微信视频号支持', summary: '⭐46.2k | Python | 最近更新 2026-03-19', source: 'github', industry: ['定制家具'], category: 'tech', tags: ['爬虫', '数据采集', '视频号'], importance: 3, fixedUrl: 'https://github.com/NanmiCoder/MediaCrawler', keyword: 'MediaCrawler 爬虫' },

  // ===== 销售上报 =====
  { title: '[销售上报/李明] 华南区佛山某定制家具客户反馈收到三维家报价单，年费6800元', summary: '→ AI洞察：需立即安排CSM跟进，提供ROI对比分析，强调渲染品质和前后端一体价值。', source: 'sales_upload', industry: ['定制家具'], category: 'sales_intel', tags: ['竞对抢单', '华南区', '紧急'], importance: 1, keyword: '' },
  { title: '[销售上报/王芳] 华东区杭州3家装修公司集体反馈想增加AI出图功能', summary: '→ AI洞察：客户主动要求AI功能，说明市场需求成熟。建议安排产品演示会。', source: 'sales_upload', industry: ['装修设计'], category: 'sales_intel', tags: ['客户需求', '华东区', 'AI功能'], importance: 1, keyword: '' },
  { title: '[销售上报/张伟] 华西区成都某定制品牌因三维家BUG多考虑回流酷家乐', summary: '→ AI洞察：回流客户优先跟进，可提供试用+迁移数据支持，务必48小时内联系。', source: 'sales_upload', industry: ['定制家具'], category: 'sales_intel', tags: ['回流客户', '华西区', '优先跟进'], importance: 1, keyword: '' },
  { title: '[销售上报/陈晓] 华北区北京某公装公司询问BIM审批对接方案', summary: '→ AI洞察：公装BIM需求与政策合规强相关，可结合住建部新规进行方案包装。', source: 'sales_upload', industry: ['公装'], category: 'sales_intel', tags: ['BIM需求', '华北区', '公装'], importance: 2, keyword: '' },
  { title: '[销售上报/刘洋] 华南区深圳智能家居集成商想用酷家乐做灯光效果展示', summary: '→ AI洞察：照明行业新需求信号，建议产品团队评估灯光模块的适配性。', source: 'sales_upload', industry: ['照明与智能'], category: 'sales_intel', tags: ['照明', '华南区', '新场景'], importance: 2, keyword: '' },
  { title: '[销售上报/赵敏] 华东区上海某连锁餐饮品牌需要门店设计标准化工具', summary: '→ AI洞察：连锁餐饮标准化设计需求，可推广酷家乐企业版模板功能。', source: 'sales_upload', industry: ['连锁商业'], category: 'sales_intel', tags: ['连锁餐饮', '华东区', '标准化'], importance: 2, keyword: '' },
  { title: '[销售上报/孙浩] 华南区广州某瓷砖经销商要求增加产品3D选材功能', summary: '→ AI洞察：建材行业3D选材需求明确，可推荐建材版解决方案。', source: 'sales_upload', industry: ['硬装建材'], category: 'sales_intel', tags: ['3D选材', '华南区', '建材'], importance: 2, keyword: '' },
  { title: '[销售上报/周琪] 华北区天津某厨电品牌集体采购8个账号，竞品报价更低', summary: '→ AI洞察：厨电行业集体采购信号，需定制行业方案+价格策略应对竞品。', source: 'sales_upload', industry: ['家电'], category: 'sales_intel', tags: ['集体采购', '华北区', '厨电'], importance: 2, keyword: '' },
  { title: '[销售上报/吴静] 华西区重庆某全铝家居品牌反馈酷家乐全铝材质库不足', summary: '→ AI洞察：产品改进建议，全铝定制是增长品类，需优先补充材质库。', source: 'sales_upload', industry: ['定制家具'], category: 'sales_intel', tags: ['产品反馈', '华西区', '全铝材质'], importance: 2, keyword: '' },
  { title: '[销售上报/郑磊] 华东区温州眼镜行业客户想用酷家乐做展厅设计', summary: '→ AI洞察：非典型行业需求，如成功可作为跨行业案例扩展。', source: 'sales_upload', industry: ['连锁商业'], category: 'sales_intel', tags: ['跨行业', '华东区', '展厅设计'], importance: 3, keyword: '' },
  { title: '[销售上报/黄蕾] 华南区东莞3家软装公司联合询价，要求支持AR看效果', summary: '→ AI洞察：软装客户AR需求强烈，可推广AR预览功能，联合询价可给予优惠。', source: 'sales_upload', industry: ['软装家具'], category: 'sales_intel', tags: ['AR需求', '华南区', '联合询价'], importance: 2, keyword: '' },

  // ===== 更多行业覆盖 =====
  { title: '成品家具行业数字化转型：线上展厅成为"标配"', summary: '→ 情报研判：成品家具从展厅走向数字化，3D展示工具需求爆发。', source: 'toutiao', industry: ['软装家具'], category: 'market', tags: ['线上展厅', '数字化', '成品家具'], importance: 2, keyword: '成品家具 线上展厅' },
  { title: '商业照明设计标准更新：LED照度模拟成为交付必备环节', summary: '→ 情报研判：照明行业设计交付标准提升，酷家乐灯光模拟可赋能。', source: 'web', industry: ['照明与智能'], category: 'policy', tags: ['照明标准', 'LED照度', '交付要求'], importance: 2, keyword: '照明 LED 设计标准' },
  { title: '实验室装备行业数字化：3D空间规划工具需求增长300%', summary: '→ 情报研判：商业设备-实验室细分赛道高增长，蓝海市场值得探索。', source: 'wechat_mp', industry: ['商业设备'], category: 'market', tags: ['实验室', '空间规划', '蓝海市场'], importance: 2, keyword: '实验室 空间规划' },
  { title: '连锁奶茶店扩张潮：店装标准化设计成为降本关键', summary: '→ 情报研判：餐饮连锁标准化设计需求，可推广模板化方案。', source: 'douyin', industry: ['连锁商业'], category: 'market', tags: ['奶茶连锁', '标准化', '降本'], importance: 3, keyword: '奶茶店 设计 标准化' },
  { title: '家电行业：厨电品牌纷纷布局"厨房整体解决方案"', summary: '→ 情报研判：厨电品牌从单品向整体方案升级，需要3D展示能力。', source: 'wechat_mp', industry: ['家电'], category: 'market', tags: ['厨电', '整体方案', '3D展示'], importance: 3, keyword: '厨电 整体方案' },
  { title: '体育场馆建设热潮：数字化设计工具在场馆规划中的应用', summary: '→ 情报研判：商业设备-体育设备细分场景，公装方案可延伸覆盖。', source: 'toutiao', industry: ['商业设备'], category: 'market', tags: ['体育场馆', '数字化设计', '公装延伸'], importance: 3, keyword: '体育场馆 设计' },

  // ===== 更多小红书内容 =====
  { title: '"装修小白必看：怎么看懂全屋定制效果图？" — 收藏12万', summary: '→ 情报研判：C端用户教育内容火爆，B端门店需具备出图能力才能满足客户预期。', source: 'xiaohongshu', industry: ['定制家具'], category: 'user_voice', tags: ['用户教育', '效果图', '消费预期'], importance: 2, keyword: '全屋定制 效果图' },
  { title: '"家装公司选不好？先看他们用什么设计软件" — 引发评论区大量讨论', summary: '→ 情报研判：设计工具成为消费者评判装修公司的标准之一。', source: 'xiaohongshu', industry: ['装修设计'], category: 'user_voice', tags: ['消费者标准', '品牌认知', '工具选择'], importance: 2, keyword: '家装公司 设计软件' },
  { title: '"墙布+灯光效果图怎么做最真实？" — 软装设计师分享技巧', summary: '→ 情报研判：软装设计出图需求细化，材质+灯光渲染是核心。', source: 'xiaohongshu', industry: ['软装家具', '照明与智能'], category: 'user_voice', tags: ['墙布', '灯光', '渲染技巧'], importance: 3, keyword: '墙布 灯光 效果图' },
  { title: '"卫浴定制效果图合集" — 卫浴品牌用酷家乐出图，笔记获2万赞', summary: '→ 情报研判：卫浴细分赛道品牌背书，可推广到更多卫浴客户。', source: 'xiaohongshu', industry: ['定制家具'], category: 'market', tags: ['卫浴定制', '品牌合作', '效果图'], importance: 3, keyword: '卫浴定制 效果图' },
  { title: '"涂料颜色怎么选？AI配色工具推荐" — 涂料商家分享', summary: '→ 情报研判：涂料行业对颜色可视化需求强，可推广酷家乐配色功能。', source: 'xiaohongshu', industry: ['硬装建材'], category: 'user_voice', tags: ['涂料配色', 'AI配色', '可视化'], importance: 3, keyword: '涂料 配色 AI' },
  { title: '"顶墙一体效果图太绝了！客户一看就下单"——经销商晒单', summary: '→ 情报研判：顶墙品类出图转化率高，可作为行业推广案例。', source: 'xiaohongshu', industry: ['硬装建材'], category: 'user_voice', tags: ['顶墙', '效果图', '转化率'], importance: 3, keyword: '顶墙 效果图 转化' },
  { title: '"地板铺贴效果图对比：实木vs强化 vs SPC" — 建材博主横评', summary: '→ 情报研判：地板品类可视化需求，建材版功能渗透机会。', source: 'xiaohongshu', industry: ['硬装建材'], category: 'market', tags: ['地板', '铺贴效果', '材质对比'], importance: 3, keyword: '地板 铺贴 效果图' },

  // ===== 更多抖音内容 =====
  { title: '"装修公司老板日常vlog"——签单现场用酷家乐给客户演示，50w播放', summary: '→ 情报研判：真实场景使用展示，对潜在客户极具说服力。', source: 'douyin', industry: ['装修设计'], category: 'user_voice', tags: ['用户场景', '签单演示', 'vlog'], importance: 2, keyword: '装修公司 签单 演示' },
  { title: '"家装行业2026年最值得关注的5个趋势" — 100w播放', summary: '→ 情报研判：趋势类内容中AI设计工具被列为第一趋势。', source: 'douyin', industry: ['装修设计', '定制家具'], category: 'market', tags: ['行业趋势', 'AI设计', '2026'], importance: 2, keyword: '家装 趋势 2026' },
  { title: '"小城市家装公司如何做数字化" — 三四线城市老板自述', summary: '→ 情报研判：下沉市场真实需求反馈，价格敏感但认可数字化价值。', source: 'douyin', industry: ['装修设计'], category: 'user_voice', tags: ['下沉市场', '数字化', '价格敏感'], importance: 3, keyword: '小城市 家装 数字化' },
  { title: '"全屋定制工厂如何实现前后端一体化？"——工厂主分享经验，80w播放', summary: '→ 情报研判：前后端一体是酷家乐核心壁垒，内容证明市场需求强烈。', source: 'douyin', industry: ['定制家具'], category: 'market', tags: ['前后端一体', '工厂', '核心壁垒'], importance: 2, keyword: '定制工厂 前后端' },

  // ===== 更多公众号内容 =====
  { title: '兔宝宝板材×酷家乐达成战略合作，联合推出"绿色家居设计方案"', summary: '→ 情报研判：板材龙头合作信号，绿色家居概念可作为增值点。', source: 'wechat_mp', industry: ['硬装建材', '定制家具'], category: 'market', tags: ['兔宝宝', '绿色家居', '战略合作'], importance: 2, keyword: '兔宝宝 绿色家居' },
  { title: '中国建筑装饰协会：发布"数字化设计交付标准1.0"', summary: '→ 情报研判：行业协会背书数字化交付，标准化利好工具供应商。', source: 'wechat_mp', industry: ['装修设计', '公装'], category: 'policy', tags: ['行业标准', '数字交付', '协会'], importance: 2, keyword: '建筑装饰 数字化标准' },
  { title: '顾家家居财报：软装业务增长22%，加大线上数字化营销投入', summary: '→ 情报研判：软装家具品牌增长强劲且重视数字化，是优质客户群。', source: 'wechat_mp', industry: ['软装家具'], category: 'market', tags: ['顾家', '软装增长', '数字营销'], importance: 2, keyword: '顾家家居 财报' },
  { title: '方太厨电年度发布会：推出"智慧厨房3D展示系统"', summary: '→ 情报研判：厨电头部品牌自建3D展示能力，但中小品牌仍需第三方工具。', source: 'wechat_mp', industry: ['家电'], category: 'market', tags: ['方太', '3D展示', '厨电'], importance: 3, keyword: '方太 智慧厨房' },

  // ===== 补充更多条目确保>300 =====
  { title: '小红书"办公室装修"话题月增200%，中小企业办公设计需求爆发', summary: '→ 情报研判：公装-办公设计场景增长，酷家乐公装版可切入。', source: 'xiaohongshu', industry: ['公装'], category: 'market', tags: ['办公设计', '公装', '需求增长'], importance: 2, keyword: '办公室装修 需求' },
  { title: '"园林景观设计用什么软件？"——知乎问题浏览量突破50万', summary: '→ 情报研判：园林景观赛道工具需求明确，可评估产品延伸可能性。', source: 'zhihu', industry: ['公装'], category: 'user_voice', tags: ['园林景观', '工具需求', '公装'], importance: 3, keyword: '园林景观 设计软件' },
  { title: '抖音"展厅设计"话题播放量破10亿，展示道具行业数字化需求暴涨', summary: '→ 情报研判：展示道具行业从传统走向数字化，展厅3D设计是核心需求。', source: 'douyin', industry: ['连锁商业'], category: 'market', tags: ['展厅设计', '展示道具', '数字化'], importance: 2, keyword: '展厅设计 3D' },
  { title: '民宿设计成为新蓝海：小红书"民宿装修"笔记月增50万篇', summary: '→ 情报研判：民宿设计场景爆发，酷家乐家装方案可延伸覆盖。', source: 'xiaohongshu', industry: ['装修设计', '连锁商业'], category: 'market', tags: ['民宿设计', '蓝海', '场景延伸'], importance: 2, keyword: '民宿 装修设计' },
  { title: '窗帘定制行业数字化率仅8%，大量门店仍用手工绘制效果图', summary: '→ 情报研判：墙纸墙布窗帘细分赛道数字化空间巨大。', source: 'wechat_mp', industry: ['硬装建材'], category: 'market', tags: ['窗帘定制', '低数字化率', '空间巨大'], importance: 2, keyword: '窗帘定制 数字化' },
  { title: '"智能锁展厅设计方案分享"——智能家居经销商用3D效果图引流', summary: '→ 情报研判：智能家居细分场景的设计需求具体化。', source: 'xiaohongshu', industry: ['照明与智能'], category: 'user_voice', tags: ['智能锁', '展厅设计', '引流'], importance: 3, keyword: '智能锁 展厅' },
  { title: '家纺行业数字化：床品展示从平面图升级到3D空间效果', summary: '→ 情报研判：家纺家饰细分场景3D化趋势确认。', source: 'wechat_mp', industry: ['软装家具'], category: 'market', tags: ['家纺', '3D展示', '趋势'], importance: 3, keyword: '家纺 3D展示' },
  { title: '暖通行业：新风+地暖方案可视化设计需求增长150%', summary: '→ 情报研判：暖通细分场景的设计可视化需求快速增长。', source: 'toutiao', industry: ['家电'], category: 'market', tags: ['暖通', '可视化', '增长'], importance: 3, keyword: '暖通 可视化' },
  { title: '"酒店翻新设计全流程"——B站UP主用酷家乐完成酒店项目', summary: '→ 情报研判：连锁酒店场景的实操案例，可推广到酒店行业客户。', source: 'bilibili', industry: ['连锁商业'], category: 'user_voice', tags: ['酒店设计', '实操案例', '项目展示'], importance: 3, keyword: '酒店 翻新设计' },
  { title: '中小型健身房装修热潮：数字化设计工具成为选址规划必备', summary: '→ 情报研判：体育设备-健身房场景设计需求增长。', source: 'toutiao', industry: ['商业设备'], category: 'market', tags: ['健身房', '选址规划', '数字化'], importance: 3, keyword: '健身房 设计工具' },
  { title: '"咖啡店装修灵感100+"——小红书收藏18万，讨论区问设计工具', summary: '→ 情报研判：餐饮+设计场景交叉需求旺盛。', source: 'xiaohongshu', industry: ['连锁商业'], category: 'user_voice', tags: ['咖啡店', '装修灵感', '设计工具'], importance: 3, keyword: '咖啡店 装修' },
  { title: '幼儿园装修新规出台：安全+趣味设计要求提升，3D效果图成必审材料', summary: '→ 情报研判：公装-教育空间新规，设计交付标准化利好。', source: 'web', industry: ['公装'], category: 'policy', tags: ['幼儿园', '安全规范', '效果图'], importance: 2, keyword: '幼儿园装修 规范' },
  { title: '药店连锁扩张：标准化店装设计成为连锁管理核心环节', summary: '→ 情报研判：药店连锁标准化设计需求，可推广模板化方案。', source: 'wechat_mp', industry: ['连锁商业'], category: 'market', tags: ['药店连锁', '标准化', '店装'], importance: 3, keyword: '药店 连锁设计' },
  { title: '新能源汽车展厅设计热潮：品牌体验店设计需求爆发', summary: '→ 情报研判：新能源汽车展厅是高端公装场景，设计预算充足。', source: 'douyin', industry: ['连锁商业'], category: 'market', tags: ['新能源', '展厅', '高端公装'], importance: 2, keyword: '新能源 展厅' },
  { title: '"上游板材厂如何用数字化赋能下游经销商？"——行业大会分享', summary: '→ 情报研判：上游厂商赋能下游的数字化链路，酷家乐可作为核心工具。', source: 'wechat_mp', industry: ['定制家具'], category: 'market', tags: ['上游厂商', '赋能经销商', '数字化'], importance: 2, keyword: '板材厂 赋能' },
  { title: '阳台空间设计成为小红书新爆点：收纳+绿植+休闲方案走红', summary: '→ 情报研判：阳台空间细分场景，可开发专题模板。', source: 'xiaohongshu', industry: ['装修设计'], category: 'user_voice', tags: ['阳台设计', '新场景', '模板机会'], importance: 3, keyword: '阳台设计 空间' },
  { title: '"代工厂数字化转型案例"——从接单到出图全流程数字化', summary: '→ 情报研判：代工厂数字化案例可推广到更多制造环节客户。', source: 'wechat_mp', industry: ['定制家具'], category: 'market', tags: ['代工厂', '全流程数字化', '制造'], importance: 3, keyword: '代工厂 数字化' },
  { title: '木门行业报告：定制化率提升至65%，门店设计出图需求翻倍', summary: '→ 情报研判：木门转定制细分赛道高增长，匹配酷家乐门窗方案。', source: 'wechat_mp', industry: ['定制家具'], category: 'market', tags: ['木门定制', '增长', '出图需求'], importance: 2, keyword: '木门 定制' },
];

// 生成带URL和时间偏移的完整数据集
export function generateMockItems(): IntelItem[] {
  return templates.map((t, i) => ({
    id: uid(),
    title: t.title,
    summary: t.summary,
    source: t.source,
    sourceUrl: makeUrl(t.source, t.keyword, t.fixedUrl),
    industry: t.industry,
    category: t.category,
    tags: t.tags,
    metrics: randomMetrics(t.source),
    createdAt: hoursAgo(Math.floor(i * 0.8 + Math.random() * 10)),
    importance: t.importance,
  }));
}

export const MOCK_BRIEF: DailyBrief = {
  date: new Date().toISOString().slice(0, 10),
  generatedAt: new Date().toISOString(),
  fullSummary: '今日建议：重点关注三维家降价动态对华南/华西区的影响，安排CSM主动联系高风险客户。同时密切跟踪住建部BIM新规对硬装建材客户的合规需求催化。',
  bullets: [
    { text: '三维家2026版SMB年费降至6800元+红星美凯龙300+卖场渠道合作，双重冲击需紧急应对', source: 'wechat_mp', category: 'competitor', importance: 1 },
    { text: '住建部BIM新国标+商务部数字化交付标准双重政策落地，硬装建材客户合规升级需求确定性高', source: 'toutiao', category: 'policy', importance: 1 },
    { text: '小红书+抖音AI出图话题持续走热，免费工具对低端市场蚕食信号增强，需强化专业壁垒', source: 'xiaohongshu', category: 'market', importance: 1 },
    { text: '索菲亚/金牌橱柜等头部品牌加速AI设计部署，行业数字化投入确定性提升', source: 'wechat_mp', category: 'market', importance: 1 },
    { text: '华南区多起竞对抢单预警（佛山/广州/深圳），三维家定向挖角已到期客户', source: 'sales_upload', category: 'sales_intel', importance: 1 },
    { text: '国务院家居消费补贴+工信部中小企业数字化补贴双政策利好，可引导客户申请后采购', source: 'toutiao', category: 'policy', importance: 2 },
    { text: 'Stable Diffusion 3.5室内设计能力大幅提升+WebGPU标准落地，底层技术需保持关注', source: 'zhihu', category: 'tech', importance: 2 },
    { text: '多条"三维家换回酷家乐"笔记走热，渲染品质仍是核心壁垒，可提炼为销售话术', source: 'xiaohongshu', category: 'competitor', importance: 2 },
  ],
};

/**
 * 数据库种子脚本 - 预置行业模块数据
 * 为 8 大行业创建初始 AI 模块
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // 需要 service role key

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 制造业模块
const manufacturingModules = [
  {
    name: 'AI 品检模组',
    category: 'manufacturing',
    description: 'AI 视觉检测系统，接上摄影机即可自动检测产品瑕疵，本地推论无需上传数据',
    icon: 'Camera',
    features: ['实时视觉检测', '自动瑕疵识别', '本地 Edge AI 推论', '自动生成检测报告', '异常自动警示'],
    pricing_tier: 'pro',
    industry_specific: ['manufacturing'],
    module_sdk_version: '1.0.0',
    capabilities: {
      canGenerateReports: true,
      canSendAlerts: true,
      canProcessData: true,
      canIntegrateExternal: true,
      requiresDataConnection: true
    },
    author: 'AI Business Platform',
    is_active: true
  },
  {
    name: 'AI 预测性维护',
    category: 'manufacturing',
    description: '通过声音异常检测预测机台故障，提前预警避免停机损失',
    icon: 'Activity',
    features: ['实时声音监测', '异常模式识别', '故障预测分析', '维护提醒推送', '降低停机时间'],
    pricing_tier: 'pro',
    industry_specific: ['manufacturing'],
    module_sdk_version: '1.0.0',
    capabilities: {
      canGenerateReports: true,
      canSendAlerts: true,
      canProcessData: true,
      canIntegrateExternal: true,
      requiresDataConnection: true
    },
    author: 'AI Business Platform',
    is_active: true
  },
  {
    name: '工业数据连接器',
    category: 'manufacturing',
    description: '串接 PLC、MES、ERP 等工业数据源，自动生成仪表板与预测报表',
    icon: 'Cable',
    features: ['PLC/MES 集成', 'Excel 自动导入', '实时仪表板', 'AI 数据分析', '多数据源整合'],
    pricing_tier: 'basic',
    industry_specific: ['manufacturing'],
    module_sdk_version: '1.0.0',
    capabilities: {
      canGenerateReports: true,
      canSendAlerts: false,
      canProcessData: true,
      canIntegrateExternal: true,
      requiresDataConnection: true
    },
    author: 'AI Business Platform',
    is_active: true
  }
];

// 餐饮业模块
const foodBeverageModules = [
  {
    name: 'AI 点餐助理',
    category: 'f&b',
    description: '能听懂台语和中文的智能语音点餐系统，提升点餐效率',
    icon: 'Mic',
    features: ['台语 + 中文语音识别', '智能菜单推荐', '自动订单确认', '减少人力成本', '提升服务效率'],
    pricing_tier: 'basic',
    industry_specific: ['f&b'],
    module_sdk_version: '1.0.0',
    capabilities: {
      canGenerateReports: true,
      canSendAlerts: false,
      canProcessData: true,
      canIntegrateExternal: true,
      requiresDataConnection: false
    },
    author: 'AI Business Platform',
    is_active: true
  },
  {
    name: 'AI 进货预测',
    category: 'f&b',
    description: '基于历史销售和天气数据，自动预测需求量并生成采购清单',
    icon: 'TrendingUp',
    features: ['销售趋势分析', '天气因素考虑', '自动采购建议', '库存警示', '减少食材浪费'],
    pricing_tier: 'pro',
    industry_specific: ['f&b'],
    module_sdk_version: '1.0.0',
    capabilities: {
      canGenerateReports: true,
      canSendAlerts: true,
      canProcessData: true,
      canIntegrateExternal: true,
      requiresDataConnection: true
    },
    author: 'AI Business Platform',
    is_active: true
  },
  {
    name: 'AI 行銷助理',
    category: 'f&b',
    description: '讀取品牌素材，自動產生社群貼文草稿',
    icon: 'Megaphone',
    features: ['品牌素材', '貼文模板', '匯出報告'],
    pricing_tier: 'basic',
    industry_specific: ['f&b'],
    module_sdk_version: '1.0.0',
    capabilities: {
      canGenerateReports: true,
      canSendAlerts: false,
      canProcessData: true,
      canIntegrateExternal: true,
      requiresDataConnection: false
    },
    author: 'AI Business Platform',
    is_active: true
  }
];

// 零售/电商模块
const retailModules = [
  {
    name: 'AI 智能搜索',
    category: 'retail',
    description: '基于语义理解的智能搜索，让顾客用自然语言找到商品',
    icon: 'Search',
    features: ['自然语言搜索', '智能同义词识别', '图片搜索', '搜索结果排序优化', '搜索分析报告'],
    pricing_tier: 'basic',
    industry_specific: ['retail'],
    module_sdk_version: '1.0.0',
    capabilities: {
      canGenerateReports: true,
      canSendAlerts: false,
      canProcessData: true,
      canIntegrateExternal: true,
      requiresDataConnection: true
    },
    author: 'AI Business Platform',
    is_active: true
  },
  {
    name: 'AI 推荐系统',
    category: 'retail',
    description: '个性化商品推荐，提升转换率和客单价',
    icon: 'Sparkles',
    features: ['协同过滤推荐', '内容推荐', '实时推荐', 'A/B 测试', '效果追踪'],
    pricing_tier: 'pro',
    industry_specific: ['retail'],
    module_sdk_version: '1.0.0',
    capabilities: {
      canGenerateReports: true,
      canSendAlerts: false,
      canProcessData: true,
      canIntegrateExternal: true,
      requiresDataConnection: true
    },
    author: 'AI Business Platform',
    is_active: true
  },
  {
    name: 'AI 售后助理',
    category: 'retail',
    description: '自动回答订单、退货、物流等常见问题，减轻客服压力',
    icon: 'MessageSquare',
    features: ['24/7 自动回复', '多轮对话', '订单查询', '退换货处理', '客服分流'],
    pricing_tier: 'basic',
    industry_specific: ['retail'],
    module_sdk_version: '1.0.0',
    capabilities: {
      canGenerateReports: true,
      canSendAlerts: true,
      canProcessData: true,
      canIntegrateExternal: true,
      requiresDataConnection: true
    },
    author: 'AI Business Platform',
    is_active: true
  }
];

// 物流/仓储模块
const logisticsModules = [
  {
    name: 'AI 路線優化',
    category: 'logistics',
    description: '智能路線規劃系統，根據交通狀況、貨物重量、時間窗口自動優化配送路線',
    icon: 'MapPin',
    features: ['智能路線規劃', '實時交通分析', '多車輛調度', '成本優化計算', '配送時間預測'],
    pricing_tier: 'pro',
    industry_specific: ['logistics'],
    module_sdk_version: '1.0.0',
    capabilities: {
      canGenerateReports: true,
      canSendAlerts: true,
      canProcessData: true,
      canIntegrateExternal: true,
      requiresDataConnection: true
    },
    author: 'AI Business Platform',
    is_active: true
  },
  {
    name: 'AI 庫存預測',
    category: 'logistics',
    description: '基於歷史數據和需求預測，智能管理倉庫庫存，避免缺貨和過量庫存',
    icon: 'Package',
    features: ['需求預測分析', '庫存水位監控', '自動補貨提醒', '季節性調整', '供應鏈優化'],
    pricing_tier: 'pro',
    industry_specific: ['logistics'],
    module_sdk_version: '1.0.0',
    capabilities: {
      canGenerateReports: true,
      canSendAlerts: true,
      canProcessData: true,
      canIntegrateExternal: true,
      requiresDataConnection: true
    },
    author: 'AI Business Platform',
    is_active: true
  },
  {
    name: 'AI 貨物追蹤',
    category: 'logistics',
    description: '全程貨物追蹤系統，提供實時位置更新和異常警報',
    icon: 'Truck',
    features: ['實時位置追蹤', '異常狀態警報', '配送進度通知', '簽收確認', '歷史軌跡查詢'],
    pricing_tier: 'basic',
    industry_specific: ['logistics'],
    module_sdk_version: '1.0.0',
    capabilities: {
      canGenerateReports: true,
      canSendAlerts: true,
      canProcessData: true,
      canIntegrateExternal: true,
      requiresDataConnection: true
    },
    author: 'AI Business Platform',
    is_active: true
  },
  {
    name: 'AI 倉儲管理',
    category: 'logistics',
    description: '智能倉儲管理系統，自動化貨物分揀、存儲和出庫流程',
    icon: 'Warehouse',
    features: ['自動分揀系統', '存儲位置優化', '出庫流程自動化', '庫存盤點', '空間利用率分析'],
    pricing_tier: 'enterprise',
    industry_specific: ['logistics'],
    module_sdk_version: '1.0.0',
    capabilities: {
      canGenerateReports: true,
      canSendAlerts: true,
      canProcessData: true,
      canIntegrateExternal: true,
      requiresDataConnection: true
    },
    author: 'AI Business Platform',
    is_active: true
  }
];

// 醫療/健康模块
const healthcareModules = [
  {
    name: 'AI 病歷分析',
    category: 'healthcare',
    description: '智能病歷摘要和分析系統，自動提取關鍵信息並生成診斷建議',
    icon: 'FileText',
    features: ['病歷自動摘要', '症狀分析', '診斷建議', '風險評估', '治療方案推薦'],
    pricing_tier: 'pro',
    industry_specific: ['healthcare'],
    module_sdk_version: '1.0.0',
    capabilities: {
      canGenerateReports: true,
      canSendAlerts: true,
      canProcessData: true,
      canIntegrateExternal: true,
      requiresDataConnection: true
    },
    author: 'AI Business Platform',
    is_active: true
  },
  {
    name: 'AI 藥物管理',
    category: 'healthcare',
    description: '智能藥物交互檢查和劑量建議系統，確保用藥安全',
    icon: 'Pill',
    features: ['藥物交互檢查', '劑量建議', '過敏警示', '用藥提醒', '副作用監控'],
    pricing_tier: 'pro',
    industry_specific: ['healthcare'],
    module_sdk_version: '1.0.0',
    capabilities: {
      canGenerateReports: true,
      canSendAlerts: true,
      canProcessData: true,
      canIntegrateExternal: true,
      requiresDataConnection: true
    },
    author: 'AI Business Platform',
    is_active: true
  },
  {
    name: 'AI 護理排班',
    category: 'healthcare',
    description: '智能護理人員排班系統，優化人力配置並確保服務品質',
    icon: 'Users',
    features: ['智能排班', '人力優化', '技能匹配', '工作量平衡', '緊急調度'],
    pricing_tier: 'basic',
    industry_specific: ['healthcare'],
    module_sdk_version: '1.0.0',
    capabilities: {
      canGenerateReports: true,
      canSendAlerts: false,
      canProcessData: true,
      canIntegrateExternal: true,
      requiresDataConnection: true
    },
    author: 'AI Business Platform',
    is_active: true
  },
  {
    name: 'AI 健康監測',
    category: 'healthcare',
    description: '智能健康數據監測系統，實時追蹤患者生命體徵並預警異常',
    icon: 'Heart',
    features: ['生命體徵監測', '異常預警', '健康趨勢分析', '遠程監護', '緊急通知'],
    pricing_tier: 'enterprise',
    industry_specific: ['healthcare'],
    module_sdk_version: '1.0.0',
    capabilities: {
      canGenerateReports: true,
      canSendAlerts: true,
      canProcessData: true,
      canIntegrateExternal: true,
      requiresDataConnection: true
    },
    author: 'AI Business Platform',
    is_active: true
  }
];

// 金融/保險模块
const financeModules = [
  {
    name: 'AI 風險評估',
    category: 'finance',
    description: 'AI 驅動的金融風險評估系統，智能分析信用風險與投資風險',
    icon: 'Shield',
    features: ['信用風險評估', '投資風險分析', '市場風險監控', '風險預警系統', '合規性檢查'],
    pricing_tier: 'pro',
    industry_specific: ['finance'],
    module_sdk_version: '1.0.0',
    capabilities: {
      canGenerateReports: true,
      canSendAlerts: true,
      canProcessData: true,
      canIntegrateExternal: true,
      requiresDataConnection: true
    },
    author: 'AI Business Platform',
    is_active: true
  },
  {
    name: 'AI 投資分析',
    category: 'finance',
    description: 'AI 驅動的投資分析系統，智能選股與投資組合優化',
    icon: 'TrendingUp',
    features: ['智能選股', '投資組合優化', '風險收益分析', '市場趨勢預測', '投資建議'],
    pricing_tier: 'pro',
    industry_specific: ['finance'],
    module_sdk_version: '1.0.0',
    capabilities: {
      canGenerateReports: true,
      canSendAlerts: true,
      canProcessData: true,
      canIntegrateExternal: true,
      requiresDataConnection: true
    },
    author: 'AI Business Platform',
    is_active: true
  },
  {
    name: 'AI 詐欺偵測引擎',
    category: 'finance',
    description: '實時交易異常偵測，智能識別詐欺行為，保護金融安全',
    icon: 'Shield',
    features: ['實時交易監控', '異常行為偵測', '風險評分', '自動阻擋', '調查報告'],
    pricing_tier: 'enterprise',
    industry_specific: ['finance'],
    module_sdk_version: '1.0.0',
    capabilities: {
      canGenerateReports: true,
      canSendAlerts: true,
      canProcessData: true,
      canIntegrateExternal: true,
      requiresDataConnection: true
    },
    author: 'AI Business Platform',
    is_active: true
  },
  {
    name: 'AI 文件審核系統',
    category: 'finance',
    description: '智能合約與申請書審核，自動識別風險條款和合規問題',
    icon: 'FileText',
    features: ['智能文件解析', '風險條款識別', '合規性檢查', '自動摘要生成', '審核建議'],
    pricing_tier: 'enterprise',
    industry_specific: ['finance'],
    module_sdk_version: '1.0.0',
    capabilities: {
      canGenerateReports: true,
      canSendAlerts: true,
      canProcessData: true,
      canIntegrateExternal: true,
      requiresDataConnection: true
    },
    author: 'AI Business Platform',
    is_active: true
  }
];

// 政府模块
const governmentModules = [
  {
    name: 'AI 政策分析',
    category: 'government',
    description: '智能政策影響分析系統，評估政策效果並提供優化建議',
    icon: 'FileText',
    features: ['政策影響評估', '數據分析', '效果預測', '優化建議', '報告生成'],
    pricing_tier: 'pro',
    industry_specific: ['government'],
    module_sdk_version: '1.0.0',
    capabilities: {
      canGenerateReports: true,
      canSendAlerts: true,
      canProcessData: true,
      canIntegrateExternal: true,
      requiresDataConnection: true
    },
    author: 'AI Business Platform',
    is_active: true
  },
  {
    name: 'AI 公共服務',
    category: 'government',
    description: '智能公共服務系統，提供 24/7 線上服務和智能客服',
    icon: 'Users',
    features: ['智能客服', '服務優化', '需求分析', '自動化處理', '滿意度監控'],
    pricing_tier: 'basic',
    industry_specific: ['government'],
    module_sdk_version: '1.0.0',
    capabilities: {
      canGenerateReports: true,
      canSendAlerts: false,
      canProcessData: true,
      canIntegrateExternal: true,
      requiresDataConnection: true
    },
    author: 'AI Business Platform',
    is_active: true
  },
  {
    name: 'AI 數據治理',
    category: 'government',
    description: '政府數據智能管理系統，確保數據安全和合規性',
    icon: 'Database',
    features: ['數據分類管理', '安全監控', '合規檢查', '隱私保護', '審計追蹤'],
    pricing_tier: 'enterprise',
    industry_specific: ['government'],
    module_sdk_version: '1.0.0',
    capabilities: {
      canGenerateReports: true,
      canSendAlerts: true,
      canProcessData: true,
      canIntegrateExternal: true,
      requiresDataConnection: true
    },
    author: 'AI Business Platform',
    is_active: true
  },
  {
    name: 'AI 安全監控',
    category: 'government',
    description: '智能網路安全監控系統，實時偵測威脅並自動回應',
    icon: 'Shield',
    features: ['威脅偵測', '實時監控', '自動回應', '安全分析', '事件管理'],
    pricing_tier: 'enterprise',
    industry_specific: ['government'],
    module_sdk_version: '1.0.0',
    capabilities: {
      canGenerateReports: true,
      canSendAlerts: true,
      canProcessData: true,
      canIntegrateExternal: true,
      requiresDataConnection: true
    },
    author: 'AI Business Platform',
    is_active: true
  }
];

// 教育模块
const educationModules = [
  {
    name: 'AI 學習分析',
    category: 'education',
    description: '智能學習行為分析系統，提供個性化學習建議和進度追蹤',
    icon: 'TrendingUp',
    features: ['學習行為分析', '個性化推薦', '進度追蹤', '學習效果評估', '智能提醒'],
    pricing_tier: 'pro',
    industry_specific: ['education'],
    module_sdk_version: '1.0.0',
    capabilities: {
      canGenerateReports: true,
      canSendAlerts: true,
      canProcessData: true,
      canIntegrateExternal: true,
      requiresDataConnection: true
    },
    author: 'AI Business Platform',
    is_active: true
  },
  {
    name: 'AI 課程設計',
    category: 'education',
    description: '智能課程內容生成系統，自動創建和優化教學材料',
    icon: 'BookOpen',
    features: ['課程內容生成', '教學材料優化', '難度調整', '多媒體整合', '學習路徑規劃'],
    pricing_tier: 'pro',
    industry_specific: ['education'],
    module_sdk_version: '1.0.0',
    capabilities: {
      canGenerateReports: true,
      canSendAlerts: false,
      canProcessData: true,
      canIntegrateExternal: true,
      requiresDataConnection: true
    },
    author: 'AI Business Platform',
    is_active: true
  },
  {
    name: 'AI 評估系統',
    category: 'education',
    description: '智能考試和作業評分系統，自動化評估學習成果',
    icon: 'CheckCircle',
    features: ['自動評分', '智能反饋', '作弊偵測', '成績分析', '學習診斷'],
    pricing_tier: 'basic',
    industry_specific: ['education'],
    module_sdk_version: '1.0.0',
    capabilities: {
      canGenerateReports: true,
      canSendAlerts: true,
      canProcessData: true,
      canIntegrateExternal: true,
      requiresDataConnection: true
    },
    author: 'AI Business Platform',
    is_active: true
  },
  {
    name: 'AI 教學助手',
    category: 'education',
    description: '智能教學輔助系統，提供 24/7 學生支援和教學建議',
    icon: 'Users',
    features: ['智能問答', '學習輔導', '教學建議', '學生管理', '互動教學'],
    pricing_tier: 'enterprise',
    industry_specific: ['education'],
    module_sdk_version: '1.0.0',
    capabilities: {
      canGenerateReports: true,
      canSendAlerts: true,
      canProcessData: true,
      canIntegrateExternal: true,
      requiresDataConnection: true
    },
    author: 'AI Business Platform',
    is_active: true
  }
];

// 中小企业模块
const smeModules = [
  {
    name: 'AI Office Agent',
    category: 'sme',
    description: '自动处理文书工作、生成报表、总结会议纪录',
    icon: 'Bot',
    features: ['自动生成报表', '会议纪录摘要', '文件审核辅助', '邮件回复建议', '日程管理优化'],
    pricing_tier: 'basic',
    industry_specific: ['sme'],
    module_sdk_version: '1.0.0',
    capabilities: {
      canGenerateReports: true,
      canSendAlerts: true,
      canProcessData: true,
      canIntegrateExternal: true,
      requiresDataConnection: false
    },
    author: 'AI Business Platform',
    is_active: true
  },
  {
    name: 'AI 虚拟助理',
    category: 'sme',
    description: '整合行销、客服、FAQ 的全方位 AI 助理',
    icon: 'Users',
    features: ['智能客服', '行销自动化', 'FAQ 管理', '多渠道整合', '数据分析'],
    pricing_tier: 'pro',
    industry_specific: ['sme'],
    module_sdk_version: '1.0.0',
    capabilities: {
      canGenerateReports: true,
      canSendAlerts: true,
      canProcessData: true,
      canIntegrateExternal: true,
      requiresDataConnection: true
    },
    author: 'AI Business Platform',
    is_active: true
  },
  {
    name: 'AI 财务分析',
    category: 'sme',
    description: '根据收支数据预测现金流、建议预算配置',
    icon: 'DollarSign',
    features: ['现金流预测', '预算建议', '支出分析', '财务报表', '税务提醒'],
    pricing_tier: 'pro',
    industry_specific: ['sme'],
    module_sdk_version: '1.0.0',
    capabilities: {
      canGenerateReports: true,
      canSendAlerts: true,
      canProcessData: true,
      canIntegrateExternal: true,
      requiresDataConnection: true
    },
    author: 'AI Business Platform',
    is_active: true
  }
];

async function seedModules() {
  console.log('开始导入模块数据...\n');

  const allModules = [
    ...manufacturingModules,
    ...foodBeverageModules,
    ...retailModules,
    ...logisticsModules,
    ...healthcareModules,
    ...financeModules,
    ...governmentModules,
    ...educationModules,
    ...smeModules
  ];

  for (const module of allModules) {
    console.log(`导入: ${module.name}...`);
    
    const { data, error } = await supabase
      .from('ai_modules')
      .insert(module)
      .select();

    if (error) {
      console.error(`  ✗ 失败: ${error.message}`);
    } else {
      console.log(`  ✓ 成功: ID ${data[0].id}`);
    }
  }

  console.log('\n模块数据导入完成！');
  console.log(`总计: ${allModules.length} 个模块`);
}

// 执行
seedModules()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('导入失败:', error);
    process.exit(1);
  });


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


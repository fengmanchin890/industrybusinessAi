/**
 * 台湾 8 大产业配置系统
 * 为每个行业定义痛点、推荐模块、预设配置和仪表板布局
 */

export interface IndustryPainPoint {
  title: string;
  description: string;
  aiSolution: string;
}

export interface RecommendedModule {
  id: string;
  name: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

export interface DashboardWidget {
  type: 'metrics' | 'chart' | 'alerts' | 'quick-actions';
  title: string;
  config: Record<string, any>;
  position: { x: number; y: number; w: number; h: number };
}

export interface IndustryConfig {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  description: string;
  marketSize: string;
  aiAdoptionRate: string;
  painPoints: IndustryPainPoint[];
  recommendedModules: RecommendedModule[];
  dashboardLayout: DashboardWidget[];
  defaultSettings: Record<string, any>;
}

// 制造业配置
const manufacturingConfig: IndustryConfig = {
  id: 'manufacturing',
  name: '製造業',
  nameEn: 'Manufacturing',
  icon: 'Factory',
  description: '台灣最大產業，AI滲透率卻不到30%',
  marketSize: '8萬家中小製造廠',
  aiAdoptionRate: '<30%',
  painPoints: [
    {
      title: '中小製造廠沒有 IT / AI 團隊',
      description: '導入成本高，缺乏專業人才',
      aiSolution: '低代碼 AI 平台、工業儀表板 SaaS'
    },
    {
      title: '資料散落在 PLC / Excel / MES 中',
      description: '數據孤島，難以整合分析',
      aiSolution: 'AI 數據連接器：串接工業資料 → 自動生成儀表板'
    },
    {
      title: '品檢仍靠人工視覺',
      description: 'AI 成本太高，難以導入',
      aiSolution: 'AI 品檢模組即插即用盒：接上攝影機 → 本地推論'
    },
    {
      title: '機台異常無法提早偵測',
      description: '停機損失大，維護成本高',
      aiSolution: 'AI 聲學維護盒：偵測異音 → 預警通知'
    }
  ],
  recommendedModules: [
    { id: 'quality-inspection', name: 'AI 品檢模組', priority: 'high', category: 'manufacturing' },
    { id: 'predictive-maintenance', name: 'AI 預測性維護', priority: 'high', category: 'manufacturing' },
    { id: 'data-connector', name: '工業數據連接器', priority: 'high', category: 'manufacturing' },
    { id: 'production-dashboard', name: '生產儀表板', priority: 'medium', category: 'manufacturing' }
  ],
  dashboardLayout: [
    { type: 'metrics', title: '生產效率', config: { metrics: ['oee', 'yield', 'downtime'] }, position: { x: 0, y: 0, w: 3, h: 2 } },
    { type: 'alerts', title: '機台警示', config: { severity: ['high', 'medium'] }, position: { x: 3, y: 0, w: 3, h: 2 } },
    { type: 'chart', title: '品質趨勢', config: { chartType: 'line', metric: 'defect_rate' }, position: { x: 0, y: 2, w: 4, h: 3 } },
    { type: 'quick-actions', title: '快速操作', config: { actions: ['generate_report', 'export_data'] }, position: { x: 4, y: 2, w: 2, h: 3 } }
  ],
  defaultSettings: {
    dataRefreshInterval: 60000, // 1 minute
    alertThreshold: 0.85,
    enableRealTimeMonitoring: true
  }
};

// 餐飲業配置
const foodBeverageConfig: IndustryConfig = {
  id: 'f&b',
  name: '餐飲業',
  nameEn: 'Food & Beverage',
  icon: 'Utensils',
  description: '導入 AI 的比例不到 20%',
  marketSize: '20萬家中小餐飲業',
  aiAdoptionRate: '<20%',
  painPoints: [
    {
      title: '缺工、點餐與客服重複性高',
      description: '人力成本高，服務品質不穩定',
      aiSolution: 'AI 點餐助理：能聽懂台語 / 中文的語音點餐'
    },
    {
      title: '食材浪費 / 庫存預測不準',
      description: '成本控制困難，損耗率高',
      aiSolution: 'AI 進貨預測：自動算出下週備料'
    },
    {
      title: '行銷與社群貼文靠人工',
      description: '缺乏專業行銷人員，效果有限',
      aiSolution: 'AI 餐飲行銷助手：自動生成菜單圖文 + 推播文案'
    },
    {
      title: '客戶流失，回客少',
      description: '缺乏客戶關係管理系統',
      aiSolution: 'AI 回購推薦系統：根據顧客歷史推薦餐點或優惠券'
    }
  ],
  recommendedModules: [
    { id: 'voice-ordering', name: 'AI 點餐助理', priority: 'high', category: 'f&b' },
    { id: 'inventory-forecasting', name: 'AI 進貨預測', priority: 'high', category: 'f&b' },
    { id: 'marketing-assistant', name: 'AI 行銷助手', priority: 'medium', category: 'f&b' },
    { id: 'customer-retention', name: 'AI 回購推薦', priority: 'medium', category: 'f&b' }
  ],
  dashboardLayout: [
    { type: 'metrics', title: '營運指標', config: { metrics: ['daily_sales', 'customer_count', 'avg_order'] }, position: { x: 0, y: 0, w: 4, h: 2 } },
    { type: 'chart', title: '銷售趨勢', config: { chartType: 'bar', metric: 'sales' }, position: { x: 0, y: 2, w: 3, h: 3 } },
    { type: 'chart', title: '庫存預測', config: { chartType: 'line', metric: 'inventory' }, position: { x: 3, y: 2, w: 3, h: 3 } },
    { type: 'quick-actions', title: '快速操作', config: { actions: ['create_marketing', 'generate_menu'] }, position: { x: 4, y: 0, w: 2, h: 2 } }
  ],
  defaultSettings: {
    dataRefreshInterval: 300000, // 5 minutes
    inventoryAlertDays: 3,
    enableVoiceOrdering: true
  }
};

// 零售/電商配置
const retailConfig: IndustryConfig = {
  id: 'retail',
  name: '零售/電商',
  nameEn: 'Retail & E-commerce',
  icon: 'ShoppingBag',
  description: '中小賣家急需智能化工具',
  marketSize: '數十萬電商賣家',
  aiAdoptionRate: '<25%',
  painPoints: [
    {
      title: '商品太多、搜尋效率差',
      description: '顧客找不到想要的商品',
      aiSolution: 'AI 智能搜尋模組：自然語言搜尋、圖搜整合'
    },
    {
      title: '推薦系統難導入（成本高）',
      description: '缺乏個性化推薦能力',
      aiSolution: 'Plug-in 型推薦 SaaS：讓中小電商也能用 GPT + 向量資料庫'
    },
    {
      title: '售後客服壓力大',
      description: '重複性問題消耗大量人力',
      aiSolution: 'AI 售後助理：自動回答訂單、退貨、物流問題'
    },
    {
      title: '行銷素材製作慢',
      description: '缺乏專業設計師，素材產出效率低',
      aiSolution: 'AI 廣告素材產生器：從商品資料自動生成圖片、影片、文案'
    }
  ],
  recommendedModules: [
    { id: 'semantic-search', name: 'AI 智能搜尋', priority: 'high', category: 'retail' },
    { id: 'recommendation-engine', name: 'AI 推薦系統', priority: 'high', category: 'retail' },
    { id: 'customer-support', name: 'AI 售後助理', priority: 'medium', category: 'retail' },
    { id: 'content-generator', name: 'AI 素材產生器', priority: 'medium', category: 'retail' }
  ],
  dashboardLayout: [
    { type: 'metrics', title: '銷售數據', config: { metrics: ['revenue', 'orders', 'conversion_rate'] }, position: { x: 0, y: 0, w: 3, h: 2 } },
    { type: 'metrics', title: '客服數據', config: { metrics: ['tickets', 'response_time', 'satisfaction'] }, position: { x: 3, y: 0, w: 3, h: 2 } },
    { type: 'chart', title: '訂單趨勢', config: { chartType: 'line', metric: 'orders' }, position: { x: 0, y: 2, w: 4, h: 3 } },
    { type: 'quick-actions', title: '快速操作', config: { actions: ['generate_content', 'analyze_products'] }, position: { x: 4, y: 2, w: 2, h: 3 } }
  ],
  defaultSettings: {
    dataRefreshInterval: 180000, // 3 minutes
    enableSemanticSearch: true,
    recommendationModelType: 'collaborative'
  }
};

// 中小企業配置
const smeConfig: IndustryConfig = {
  id: 'sme',
  name: '中小企業',
  nameEn: 'Small & Medium Enterprises',
  icon: 'Building2',
  description: '最被忽略的藍海市場',
  marketSize: '150萬家中小企業',
  aiAdoptionRate: '<15%',
  painPoints: [
    {
      title: '行政文件、報表繁瑣',
      description: '大量時間浪費在重複性文書工作',
      aiSolution: 'AI Office Agent：自動生成報表 / 總結會議紀錄 / 審核文件'
    },
    {
      title: '缺乏行銷與客服人力',
      description: '小公司負擔不起專職人員',
      aiSolution: 'AI 虛擬助理：行銷 + 客服 + FAQ'
    },
    {
      title: '財務管理不精確',
      description: '缺乏專業財務分析能力',
      aiSolution: 'AI 財務分析助理：預測現金流、建議預算'
    },
    {
      title: '沒技術團隊、怕導入麻煩',
      description: '技術門檻高，不敢嘗試 AI',
      aiSolution: 'AI 插件商店：可用拖拉式方式建立工作流'
    }
  ],
  recommendedModules: [
    { id: 'office-agent', name: 'AI Office Agent', priority: 'high', category: 'sme' },
    { id: 'virtual-assistant', name: 'AI 虛擬助理', priority: 'high', category: 'sme' },
    { id: 'financial-analyzer', name: 'AI 財務分析', priority: 'medium', category: 'sme' },
    { id: 'workflow-automation', name: '工作流自動化', priority: 'medium', category: 'sme' }
  ],
  dashboardLayout: [
    { type: 'metrics', title: '業務總覽', config: { metrics: ['revenue', 'expenses', 'profit_margin'] }, position: { x: 0, y: 0, w: 4, h: 2 } },
    { type: 'alerts', title: '待辦事項', config: { types: ['document', 'meeting', 'task'] }, position: { x: 4, y: 0, w: 2, h: 2 } },
    { type: 'chart', title: '財務趨勢', config: { chartType: 'area', metric: 'cashflow' }, position: { x: 0, y: 2, w: 3, h: 3 } },
    { type: 'quick-actions', title: '快速操作', config: { actions: ['generate_report', 'schedule_meeting', 'create_invoice'] }, position: { x: 3, y: 2, w: 3, h: 3 } }
  ],
  defaultSettings: {
    dataRefreshInterval: 600000, // 10 minutes
    autoGenerateReports: true,
    reportFrequency: 'weekly'
  }
};

// 醫療/健康配置
const healthcareConfig: IndustryConfig = {
  id: 'healthcare',
  name: '醫療/健康',
  nameEn: 'Healthcare',
  icon: 'Heart',
  description: '法規限制高，長照市場可行',
  marketSize: '醫療診所 + 長照機構',
  aiAdoptionRate: '<20%',
  painPoints: [
    {
      title: '病歷資料量大、分析慢',
      description: '醫師需花大量時間閱讀病歷',
      aiSolution: 'AI 病歷助理：自動生成摘要與診斷建議'
    },
    {
      title: '長照機構人力不足',
      description: '照護人員負擔重，難以即時發現異常',
      aiSolution: '長照 AI 監測系統：偵測跌倒、異常呼吸'
    },
    {
      title: '醫師時間不足',
      description: '門診量大，缺乏時間整理資訊',
      aiSolution: 'AI 醫療會議摘要系統：協助醫師彙整病患狀況'
    }
  ],
  recommendedModules: [
    { id: 'medical-record-assistant', name: 'AI 病歷助理', priority: 'high', category: 'healthcare' },
    { id: 'eldercare-monitoring', name: '長照監測系統', priority: 'high', category: 'healthcare' },
    { id: 'meeting-summarizer', name: 'AI 會議摘要', priority: 'medium', category: 'healthcare' }
  ],
  dashboardLayout: [
    { type: 'metrics', title: '醫療指標', config: { metrics: ['patients', 'appointments', 'avg_wait_time'] }, position: { x: 0, y: 0, w: 3, h: 2 } },
    { type: 'alerts', title: '緊急警示', config: { severity: ['critical', 'high'] }, position: { x: 3, y: 0, w: 3, h: 2 } },
    { type: 'chart', title: '就診趨勢', config: { chartType: 'line', metric: 'appointments' }, position: { x: 0, y: 2, w: 4, h: 3 } },
    { type: 'quick-actions', title: '快速操作', config: { actions: ['summarize_record', 'generate_report'] }, position: { x: 4, y: 2, w: 2, h: 3 } }
  ],
  defaultSettings: {
    dataRefreshInterval: 120000, // 2 minutes
    enableCriticalAlerts: true,
    privacyMode: 'strict'
  }
};

// 物流/倉儲配置
const logisticsConfig: IndustryConfig = {
  id: 'logistics',
  name: '物流/倉儲',
  nameEn: 'Logistics & Warehousing',
  icon: 'Truck',
  description: '效率優化需求高',
  marketSize: '中大型物流業者',
  aiAdoptionRate: '<25%',
  painPoints: [
    {
      title: '運輸路線效率低',
      description: '路線規劃不佳，油耗與時間成本高',
      aiSolution: 'AI 配送助理：根據即時交通、訂單量自動排路線'
    },
    {
      title: '倉儲管理複雜',
      description: '貨物位置難以追蹤，盤點費時',
      aiSolution: 'AI 智慧倉儲鏡頭：辨識貨物位置、庫存異常'
    },
    {
      title: '人力排班困難',
      description: '工作量波動大，排班效率低',
      aiSolution: 'AI 倉儲排班系統：根據工作量自動生成班表'
    }
  ],
  recommendedModules: [
    { id: 'route-optimizer', name: 'AI 配送助理', priority: 'high', category: 'logistics' },
    { id: 'warehouse-vision', name: 'AI 倉儲鏡頭', priority: 'high', category: 'logistics' },
    { id: 'staff-scheduler', name: 'AI 排班系統', priority: 'medium', category: 'logistics' }
  ],
  dashboardLayout: [
    { type: 'metrics', title: '物流指標', config: { metrics: ['deliveries', 'on_time_rate', 'fuel_efficiency'] }, position: { x: 0, y: 0, w: 4, h: 2 } },
    { type: 'chart', title: '配送效率', config: { chartType: 'bar', metric: 'delivery_time' }, position: { x: 0, y: 2, w: 3, h: 3 } },
    { type: 'chart', title: '庫存狀態', config: { chartType: 'pie', metric: 'inventory_status' }, position: { x: 3, y: 2, w: 3, h: 3 } },
    { type: 'quick-actions', title: '快速操作', config: { actions: ['optimize_route', 'generate_schedule'] }, position: { x: 4, y: 0, w: 2, h: 2 } }
  ],
  defaultSettings: {
    dataRefreshInterval: 180000, // 3 minutes
    enableRouteOptimization: true,
    scheduleUpdateFrequency: 'daily'
  }
};

// 金融/保險配置
const financeConfig: IndustryConfig = {
  id: 'finance',
  name: '金融/保險',
  nameEn: 'Finance & Insurance',
  icon: 'Landmark',
  description: '法規限制高，適合 B2B 模型',
  marketSize: '銀行、保險、金融科技',
  aiAdoptionRate: '<30%',
  painPoints: [
    {
      title: '客服量大、成本高',
      description: '重複性問題多，客服成本居高不下',
      aiSolution: 'AI 客服助理：專為金融業調教（安全審核版）'
    },
    {
      title: '詐欺偵測延遲',
      description: '傳統規則引擎無法應對新型詐欺',
      aiSolution: 'AI 實時交易異常偵測引擎'
    },
    {
      title: '文件審核慢',
      description: '貸款、保險申請需大量人工審核',
      aiSolution: 'AI 合約 / 申請書審核系統'
    }
  ],
  recommendedModules: [
    { id: 'finance-customer-service', name: 'AI 金融客服', priority: 'high', category: 'finance' },
    { id: 'fraud-detection', name: 'AI 詐欺偵測', priority: 'high', category: 'finance' },
    { id: 'document-reviewer', name: 'AI 文件審核', priority: 'medium', category: 'finance' }
  ],
  dashboardLayout: [
    { type: 'metrics', title: '業務指標', config: { metrics: ['transactions', 'approval_rate', 'avg_processing_time'] }, position: { x: 0, y: 0, w: 3, h: 2 } },
    { type: 'alerts', title: '風險警示', config: { types: ['fraud', 'compliance', 'anomaly'] }, position: { x: 3, y: 0, w: 3, h: 2 } },
    { type: 'chart', title: '交易分析', config: { chartType: 'line', metric: 'transaction_volume' }, position: { x: 0, y: 2, w: 4, h: 3 } },
    { type: 'quick-actions', title: '快速操作', config: { actions: ['review_flagged', 'generate_compliance_report'] }, position: { x: 4, y: 2, w: 2, h: 3 } }
  ],
  defaultSettings: {
    dataRefreshInterval: 60000, // 1 minute
    enableRealTimeFraudDetection: true,
    complianceMode: 'strict'
  }
};

// 政府/教育配置
const governmentConfig: IndustryConfig = {
  id: 'government',
  name: '政府/教育',
  nameEn: 'Government & Education',
  icon: 'GraduationCap',
  description: '公共服務智能化需求',
  marketSize: '政府機關 + 學校',
  aiAdoptionRate: '<15%',
  painPoints: [
    {
      title: '公文審查 / 回覆慢',
      description: '行政流程繁瑣，效率低下',
      aiSolution: 'AI 公文助理：自動生成回覆建議、摘要公文'
    },
    {
      title: '教學資源不足',
      description: '師生比高，難以個別化教學',
      aiSolution: 'AI 學習助教：個人化教學（整合 ChatGPT + 台灣教材）'
    },
    {
      title: '民眾查詢資料困難',
      description: '政府資訊分散，民眾難以快速找到答案',
      aiSolution: 'AI 政府資訊問答機'
    }
  ],
  recommendedModules: [
    { id: 'document-assistant', name: 'AI 公文助理', priority: 'high', category: 'government' },
    { id: 'teaching-assistant', name: 'AI 學習助教', priority: 'high', category: 'government' },
    { id: 'info-chatbot', name: 'AI 資訊問答', priority: 'medium', category: 'government' }
  ],
  dashboardLayout: [
    { type: 'metrics', title: '服務指標', config: { metrics: ['inquiries', 'documents_processed', 'satisfaction'] }, position: { x: 0, y: 0, w: 4, h: 2 } },
    { type: 'chart', title: '服務趨勢', config: { chartType: 'area', metric: 'service_volume' }, position: { x: 0, y: 2, w: 3, h: 3 } },
    { type: 'alerts', title: '待處理項目', config: { types: ['pending_document', 'student_inquiry'] }, position: { x: 3, y: 2, w: 3, h: 3 } },
    { type: 'quick-actions', title: '快速操作', config: { actions: ['process_document', 'generate_summary'] }, position: { x: 4, y: 0, w: 2, h: 2 } }
  ],
  defaultSettings: {
    dataRefreshInterval: 300000, // 5 minutes
    enableDocumentSummary: true,
    languageSupport: ['zh-TW', 'en']
  }
};

// 导出所有配置
export const industries: Record<string, IndustryConfig> = {
  manufacturing: manufacturingConfig,
  'f&b': foodBeverageConfig,
  retail: retailConfig,
  sme: smeConfig,
  healthcare: healthcareConfig,
  logistics: logisticsConfig,
  finance: financeConfig,
  government: governmentConfig
};

// 工具函数
export const getIndustryConfig = (industryId: string): IndustryConfig | null => {
  return industries[industryId] || null;
};

export const getIndustryList = (): IndustryConfig[] => {
  return Object.values(industries);
};

export const getRecommendedModulesForIndustry = (industryId: string): RecommendedModule[] => {
  const config = getIndustryConfig(industryId);
  return config?.recommendedModules || [];
};

export const getDashboardLayoutForIndustry = (industryId: string): DashboardWidget[] => {
  const config = getIndustryConfig(industryId);
  return config?.dashboardLayout || [];
};


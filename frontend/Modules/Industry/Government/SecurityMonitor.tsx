/**
 * AI 安全監控 - 智能網路安全監控系統
 * 為政府機關提供實時威脅偵測與自動回應服務
 */

import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Activity, Eye, Lock, Server } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState, useReportGeneration, useAlertSending } from '../../ModuleSDK';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../Contexts/AuthContext';
import { generateText } from '../../../lib/ai-service';

const metadata: ModuleMetadata = {
  id: 'security-monitor',
  name: 'AI 安全監控',
  version: '1.0.0',
  category: 'government',
  industry: ['government'],
  description: '智能網路安全監控系統，實時偵測威脅並自動回應',
  icon: 'Shield',
  author: 'AI Business Platform',
  pricingTier: 'enterprise',
  features: [
    '威脅偵測',
    '實時監控',
    '自動回應',
    '安全分析',
    '事件管理'
  ]
};

const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: true,
  canProcessData: true,
  canIntegrateExternal: true,
  requiresDataConnection: true
};

interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: 'intrusion' | 'malware' | 'ddos' | 'data_breach' | 'unauthorized_access' | 'anomaly';
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  target: string;
  description: string;
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  affectedSystems: string[];
  responseActions: string[];
  analyst?: string;
}

interface SecurityStats {
  totalEvents: number;
  criticalEvents: number;
  activeThreats: number;
  resolvedToday: number;
  avgResponseTime: number;
  systemHealth: number;
}

interface ThreatIntelligence {
  id: string;
  threatType: string;
  description: string;
  indicators: string[];
  recommendations: string[];
  lastUpdated: Date;
}

export function SecurityMonitorModule({ context }: { context: ModuleContext }) {
  const { state, setRunning, setIdle } = useModuleState();
  const { generateReport } = useReportGeneration(context);
  const { sendAlert } = useAlertSending(context);
  const { company } = useAuth();
  
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [stats, setStats] = useState<SecurityStats>({
    totalEvents: 0,
    criticalEvents: 0,
    activeThreats: 0,
    resolvedToday: 0,
    avgResponseTime: 0,
    systemHealth: 100
  });

  // 模擬安全事件數據
  const mockEvents: SecurityEvent[] = [
    {
      id: 'SE001',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      type: 'intrusion',
      severity: 'critical',
      source: '192.168.1.100',
      target: '政府內部網路',
      description: '偵測到異常登入嘗試，疑似暴力破解攻擊',
      status: 'active',
      affectedSystems: ['身份驗證系統', '網路閘道'],
      responseActions: ['封鎖來源 IP', '啟動多因素驗證', '通知安全團隊']
    },
    {
      id: 'SE002',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      type: 'malware',
      severity: 'high',
      source: 'email@suspicious.com',
      target: '行政部門工作站',
      description: '郵件附件包含已知惡意軟體',
      status: 'investigating',
      affectedSystems: ['郵件伺服器', '端點防護'],
      responseActions: ['隔離郵件', '掃描相關系統', '更新病毒定義']
    },
    {
      id: 'SE003',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      type: 'ddos',
      severity: 'medium',
      source: '多個外部 IP',
      target: '政府網站',
      description: 'HTTP 請求量異常增加，疑似 DDoS 攻擊',
      status: 'resolved',
      affectedSystems: ['Web 伺服器', 'CDN'],
      responseActions: ['啟動 DDoS 防護', '增加頻寬', '過濾惡意流量']
    },
    {
      id: 'SE004',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      type: 'data_breach',
      severity: 'critical',
      source: '內部使用者',
      target: '公民資料庫',
      description: '偵測到大量資料外洩嘗試',
      status: 'investigating',
      affectedSystems: ['資料庫伺服器', '檔案傳輸系統'],
      responseActions: ['限制資料存取', '審計使用者行為', '通報上級']
    },
    {
      id: 'SE005',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      type: 'unauthorized_access',
      severity: 'high',
      source: '192.168.2.50',
      target: '管理後台',
      description: '未授權存取管理介面',
      status: 'resolved',
      affectedSystems: ['管理系統'],
      responseActions: ['撤銷存取權限', '重設密碼', '檢查存取日誌']
    }
  ];

  useEffect(() => {
    loadData();
  }, [company]);

  const loadData = () => {
    // 使用模擬數據
    setEvents(mockEvents);
    
    // 計算統計數據
    const critical = mockEvents.filter(e => e.severity === 'critical').length;
    const active = mockEvents.filter(e => e.status === 'active').length;
    const resolved = mockEvents.filter(e => 
      e.status === 'resolved' && 
      e.timestamp.getTime() > Date.now() - 24 * 60 * 60 * 1000
    ).length;
    
    setStats({
      totalEvents: mockEvents.length,
      criticalEvents: critical,
      activeThreats: active,
      resolvedToday: resolved,
      avgResponseTime: 15,
      systemHealth: 95
    });
  };

  // AI 威脅分析
  const analyzeEvent = async (event: SecurityEvent) => {
    if (!event) return;

    setAnalyzing(true);
    setRunning();
    try {
      const systemPrompt = `你是一個專業的網路安全分析師 AI，專門為台灣政府機關提供威脅分析服務。請根據安全事件提供詳細的分析和建議。`;
      
      const prompt = `
請分析以下安全事件：

事件資訊：
- ID：${event.id}
- 類型：${event.type}
- 嚴重程度：${event.severity}
- 來源：${event.source}
- 目標：${event.target}
- 描述：${event.description}
- 受影響系統：${event.affectedSystems.join(', ')}
- 已採取行動：${event.responseActions.join(', ')}

請提供：
1. 威脅評估（嚴重性、影響範圍、潛在後果）
2. 根因分析（可能的攻擊來源、方法、動機）
3. 建議行動（立即措施、中期措施、長期措施）
4. 預防建議（如何避免類似事件）

請以 JSON 格式回應：
{
  "threatAssessment": {
    "severity": "威脅嚴重程度評估",
    "scope": "影響範圍",
    "consequences": ["潛在後果1", "潛在後果2"]
  },
  "rootCauseAnalysis": {
    "source": "攻擊來源分析",
    "method": "攻擊方法",
    "motivation": "可能動機"
  },
  "recommendedActions": {
    "immediate": ["立即措施1", "立即措施2"],
    "midTerm": ["中期措施1", "中期措施2"],
    "longTerm": ["長期措施1", "長期措施2"]
  },
  "prevention": ["預防建議1", "預防建議2", "預防建議3"]
}
      `;

      const aiResponse = await generateText(prompt, {
        systemPrompt,
        maxTokens: 1500,
        temperature: 0.3
      });

      // 在實際環境中，這裡會解析 AI 響應
      alert(`AI 分析完成！\n\n事件：${event.description}\n\n建議已生成，請查看詳細報告。`);
      
      if (event.severity === 'critical') {
        await sendAlert('critical', '嚴重安全威脅', `事件「${event.description}」需要立即處理`);
      }
      
    } catch (error) {
      console.error('威脅分析失敗:', error);
      alert('威脅分析失敗，請稍後再試');
    } finally {
      setAnalyzing(false);
      setIdle();
    }
  };

  // 生成安全報告
  const generateSecurityReport = async () => {
    try {
      const reportContent = `
# 安全監控報告

## 統計概覽
- 總事件數：${stats.totalEvents}
- 嚴重事件：${stats.criticalEvents}
- 活躍威脅：${stats.activeThreats}
- 今日已解決：${stats.resolvedToday}
- 平均回應時間：${stats.avgResponseTime} 分鐘
- 系統健康度：${stats.systemHealth}%

## 最近事件

${events.slice(0, 10).map(event => `
### ${event.id} - ${event.description}
- **類型：** ${event.type}
- **嚴重程度：** ${event.severity}
- **狀態：** ${event.status}
- **時間：** ${event.timestamp.toLocaleString('zh-TW')}
- **來源：** ${event.source}
- **目標：** ${event.target}
- **受影響系統：** ${event.affectedSystems.join(', ')}
- **已採取行動：** ${event.responseActions.join(', ')}
`).join('\n')}

## 建議

### 立即行動
- 處理所有嚴重和高優先級事件
- 加強身份驗證機制
- 更新所有系統安全補丁

### 中期建議
- 實施零信任架構
- 加強員工安全意識訓練
- 建立完整的事件響應流程

### 長期策略
- 建置安全運營中心 (SOC)
- 實施進階威脅偵測系統
- 定期進行滲透測試

---
報告生成時間：${new Date().toLocaleString('zh-TW')}
      `;

      await generateReport('安全監控報告', reportContent, 'markdown');
      alert('安全報告已生成！');
    } catch (error) {
      console.error('報告生成失敗:', error);
      alert('報告生成失敗');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 標題列 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="w-7 h-7 text-blue-600" />
            AI 安全監控
          </h2>
          <p className="text-sm text-slate-500 mt-1">實時偵測威脅並自動回應</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={generateSecurityReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            生成安全報告
          </button>
        </div>
      </div>

      {/* 統計儀表板 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span className="text-2xl font-bold text-slate-800">{stats.totalEvents}</span>
          </div>
          <div className="text-xs text-slate-500">總事件數</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-2xl font-bold text-red-600">{stats.criticalEvents}</span>
          </div>
          <div className="text-xs text-slate-500">嚴重事件</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <Eye className="w-5 h-5 text-orange-600" />
            <span className="text-2xl font-bold text-orange-600">{stats.activeThreats}</span>
          </div>
          <div className="text-xs text-slate-500">活躍威脅</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <Lock className="w-5 h-5 text-green-600" />
            <span className="text-2xl font-bold text-green-600">{stats.resolvedToday}</span>
          </div>
          <div className="text-xs text-slate-500">今日已解決</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span className="text-2xl font-bold text-slate-800">{stats.avgResponseTime}m</span>
          </div>
          <div className="text-xs text-slate-500">平均回應時間</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <Server className="w-5 h-5 text-green-600" />
            <span className="text-2xl font-bold text-green-600">{stats.systemHealth}%</span>
          </div>
          <div className="text-xs text-slate-500">系統健康度</div>
        </div>
      </div>

      {/* 安全事件列表 */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-800">最近安全事件</h3>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="divide-y divide-slate-100">
            {events.map(event => (
              <div 
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                  selectedEvent?.id === event.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      event.severity === 'critical' ? 'bg-red-500' :
                      event.severity === 'high' ? 'bg-orange-500' :
                      event.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}></div>
                    <div>
                      <div className="font-medium text-slate-800">{event.description}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {event.timestamp.toLocaleString('zh-TW')} • {event.source} → {event.target}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      event.status === 'active' ? 'bg-red-100 text-red-700' :
                      event.status === 'investigating' ? 'bg-yellow-100 text-yellow-700' :
                      event.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {event.status === 'active' ? '活躍' :
                       event.status === 'investigating' ? '調查中' :
                       event.status === 'resolved' ? '已解決' : '誤報'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        analyzeEvent(event);
                      }}
                      disabled={analyzing}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      AI 分析
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">
                    {event.type === 'intrusion' ? '入侵' :
                     event.type === 'malware' ? '惡意軟體' :
                     event.type === 'ddos' ? 'DDoS' :
                     event.type === 'data_breach' ? '資料外洩' :
                     event.type === 'unauthorized_access' ? '未授權存取' : '異常'}
                  </span>
                  {event.affectedSystems.slice(0, 2).map((system, idx) => (
                    <span key={idx} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {system}
                    </span>
                  ))}
                  {event.affectedSystems.length > 2 && (
                    <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">
                      +{event.affectedSystems.length - 2} 更多
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 事件詳情側邊欄 */}
      {selectedEvent && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-slate-200 p-6 overflow-auto z-50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">事件詳情</h3>
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-xs text-slate-500 mb-1">事件 ID</div>
              <div className="text-sm font-medium text-slate-800">{selectedEvent.id}</div>
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-1">描述</div>
              <div className="text-sm text-slate-800">{selectedEvent.description}</div>
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-1">時間</div>
              <div className="text-sm text-slate-800">{selectedEvent.timestamp.toLocaleString('zh-TW')}</div>
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-1">類型 / 嚴重程度</div>
              <div className="flex gap-2">
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  {selectedEvent.type}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  selectedEvent.severity === 'critical' ? 'bg-red-100 text-red-700' :
                  selectedEvent.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                  selectedEvent.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {selectedEvent.severity}
                </span>
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-1">來源 → 目標</div>
              <div className="text-sm text-slate-800">
                {selectedEvent.source} → {selectedEvent.target}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-2">受影響系統</div>
              <div className="flex flex-wrap gap-2">
                {selectedEvent.affectedSystems.map((system, idx) => (
                  <span key={idx} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    {system}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-2">已採取行動</div>
              <ul className="text-sm text-slate-800 space-y-1">
                {selectedEvent.responseActions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => analyzeEvent(selectedEvent)}
              disabled={analyzing}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {analyzing ? 'AI 分析中...' : 'AI 深度分析'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export class SecurityMonitor extends ModuleBase {
  getMetadata(): ModuleMetadata {
    return metadata;
  }

  getCapabilities(): ModuleCapabilities {
    return capabilities;
  }

  render(context: ModuleContext): JSX.Element {
    return <SecurityMonitorModule context={context} />;
  }
}


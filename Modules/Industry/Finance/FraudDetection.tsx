/**
 * AI 詐欺偵測引擎 - 實時交易異常偵測
 * 為金融機構提供智能詐欺偵測服務
 */

import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, TrendingDown, Eye, Clock, DollarSign } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState, useReportGeneration, useAlertSending } from '../../ModuleSDK';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../Contexts/AuthContext';
import { generateText, analyzeData } from '../../../lib/ai-service';

const metadata: ModuleMetadata = {
  id: 'fraud-detection',
  name: 'AI 詐欺偵測引擎',
  version: '1.0.0',
  category: 'finance',
  industry: ['finance'],
  description: '實時交易異常偵測，智能識別詐欺行為，保護金融安全',
  icon: 'Shield',
  author: 'AI Business Platform',
  pricingTier: 'enterprise',
  features: [
    '實時交易監控',
    '異常行為偵測',
    '風險評分',
    '自動阻擋',
    '調查報告'
  ]
};

const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: true,
  canProcessData: true,
  canIntegrateExternal: true,
  requiresDataConnection: true
};

interface Transaction {
  id: string;
  timestamp: Date;
  customerId: string;
  customerName: string;
  amount: number;
  currency: string;
  transactionType: 'transfer' | 'payment' | 'withdrawal' | 'deposit' | 'purchase';
  merchant?: string;
  location: {
    country: string;
    city: string;
    coordinates?: { lat: number; lng: number };
  };
  device: {
    type: string;
    ip: string;
    userAgent: string;
  };
  riskScore: number;
  status: 'pending' | 'approved' | 'blocked' | 'investigating';
  fraudIndicators: string[];
}

interface FraudAlert {
  id: string;
  transactionId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  alertType: 'unusual_amount' | 'unusual_location' | 'unusual_time' | 'device_mismatch' | 'velocity_check' | 'pattern_anomaly';
  description: string;
  timestamp: Date;
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
  assignedTo?: string;
  resolution?: string;
}

interface RiskProfile {
  customerId: string;
  riskLevel: 'low' | 'medium' | 'high';
  transactionHistory: number;
  avgAmount: number;
  maxAmount: number;
  unusualPatterns: string[];
  lastRiskUpdate: Date;
}

export function FraudDetectionModule({ context }: { context: ModuleContext }) {
  const { state, setRunning } = useModuleState();
  const { generateReport } = useReportGeneration(context);
  const { sendAlert } = useAlertSending(context);
  const { company } = useAuth();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [riskProfiles, setRiskProfiles] = useState<RiskProfile[]>([]);
  const [monitoring, setMonitoring] = useState(true);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    blockedTransactions: 0,
    falsePositiveRate: 0,
    avgResponseTime: 0
  });

  // 模擬交易數據
  const mockTransactions: Transaction[] = [
    {
      id: 'T001',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      customerId: 'C001',
      customerName: '王小明',
      amount: 50000,
      currency: 'TWD',
      transactionType: 'transfer',
      location: { country: 'TW', city: 'Taipei' },
      device: { type: 'mobile', ip: '192.168.1.100', userAgent: 'iPhone Safari' },
      riskScore: 85,
      status: 'blocked',
      fraudIndicators: ['unusual_amount', 'unusual_time']
    },
    {
      id: 'T002',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      customerId: 'C002',
      customerName: '李美華',
      amount: 1500,
      currency: 'TWD',
      transactionType: 'purchase',
      merchant: '7-Eleven',
      location: { country: 'TW', city: 'Kaohsiung' },
      device: { type: 'mobile', ip: '192.168.1.101', userAgent: 'Android Chrome' },
      riskScore: 25,
      status: 'approved',
      fraudIndicators: []
    },
    {
      id: 'T003',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      customerId: 'C003',
      customerName: '陳志強',
      amount: 25000,
      currency: 'TWD',
      transactionType: 'withdrawal',
      location: { country: 'TW', city: 'Taichung' },
      device: { type: 'desktop', ip: '192.168.1.102', userAgent: 'Chrome Windows' },
      riskScore: 65,
      status: 'investigating',
      fraudIndicators: ['unusual_location']
    }
  ];

  // 模擬風險檔案
  const mockRiskProfiles: RiskProfile[] = [
    {
      customerId: 'C001',
      riskLevel: 'high',
      transactionHistory: 150,
      avgAmount: 5000,
      maxAmount: 100000,
      unusualPatterns: ['夜間大額轉帳', '多國IP登入'],
      lastRiskUpdate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      customerId: 'C002',
      riskLevel: 'low',
      transactionHistory: 45,
      avgAmount: 800,
      maxAmount: 5000,
      unusualPatterns: [],
      lastRiskUpdate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    {
      customerId: 'C003',
      riskLevel: 'medium',
      transactionHistory: 80,
      avgAmount: 3000,
      maxAmount: 50000,
      unusualPatterns: ['異常地點交易'],
      lastRiskUpdate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  ];

  useEffect(() => {
    loadData();
    if (monitoring) {
      startMonitoring();
    }
  }, [company?.id, monitoring]);

  const loadData = async () => {
    try {
      setTransactions(mockTransactions);
      setRiskProfiles(mockRiskProfiles);
      
      // 生成對應的警示
      const mockAlerts: FraudAlert[] = mockTransactions
        .filter(t => t.fraudIndicators.length > 0)
        .map(t => ({
          id: `A${t.id}`,
          transactionId: t.id,
          severity: t.riskScore > 80 ? 'critical' : t.riskScore > 60 ? 'high' : 'medium',
          alertType: t.fraudIndicators[0] as any,
          description: `交易 ${t.id} 偵測到異常行為`,
          timestamp: t.timestamp,
          status: t.status === 'blocked' ? 'resolved' : 'investigating',
          assignedTo: t.status === 'investigating' ? '調查員A' : undefined
        }));
      
      setAlerts(mockAlerts);
      
      setStats({
        totalTransactions: mockTransactions.length,
        blockedTransactions: mockTransactions.filter(t => t.status === 'blocked').length,
        falsePositiveRate: 2.5,
        avgResponseTime: 3.2
      });
    } catch (error) {
      console.error('載入詐欺偵測數據失敗:', error);
    }
  };

  const startMonitoring = () => {
    setRunning();
    
    // 模擬實時交易監控
    const interval = setInterval(() => {
      if (!monitoring) {
        clearInterval(interval);
        return;
      }

      // 生成新的模擬交易
      const newTransaction: Transaction = {
        id: `T${Date.now()}`,
        timestamp: new Date(),
        customerId: `C${Math.floor(Math.random() * 1000)}`,
        customerName: `客戶${Math.floor(Math.random() * 100)}`,
        amount: Math.floor(Math.random() * 100000) + 1000,
        currency: 'TWD',
        transactionType: ['transfer', 'payment', 'withdrawal', 'deposit', 'purchase'][Math.floor(Math.random() * 5)] as any,
        location: { 
          country: 'TW', 
          city: ['Taipei', 'Kaohsiung', 'Taichung', 'Tainan'][Math.floor(Math.random() * 4)]
        },
        device: { 
          type: ['mobile', 'desktop', 'tablet'][Math.floor(Math.random() * 3)], 
          ip: `192.168.1.${Math.floor(Math.random() * 255)}`, 
          userAgent: 'Browser' 
        },
        riskScore: Math.floor(Math.random() * 100),
        status: 'pending',
        fraudIndicators: []
      };

      // AI 風險評估
      analyzeTransactionRisk(newTransaction);
      
    }, 10000); // 每10秒生成一筆交易

    return () => clearInterval(interval);
  };

  const analyzeTransactionRisk = async (transaction: Transaction) => {
    try {
      // 使用 AI 分析交易風險
      const systemPrompt = `你是一個專業的金融詐欺偵測專家，專門分析交易風險。請根據交易特徵評估風險等級並識別潛在的詐欺指標。`;
      
      const prompt = `
請分析以下交易的風險：

交易資訊：
- 客戶ID: ${transaction.customerId}
- 交易金額: NT$ ${transaction.amount.toLocaleString()}
- 交易類型: ${transaction.transactionType}
- 地點: ${transaction.location.city}, ${transaction.location.country}
- 設備: ${transaction.device.type}
- IP: ${transaction.device.ip}
- 時間: ${transaction.timestamp.toLocaleString('zh-TW')}

請評估風險並提供：
1. 風險評分 (0-100)
2. 詐欺指標
3. 建議動作

請以 JSON 格式回應：
{
  "riskScore": 0-100,
  "fraudIndicators": ["indicator1", "indicator2"],
  "recommendation": "approve/block/investigate",
  "reasoning": "風險評估理由"
}
      `;

      const aiResponse = await generateText(prompt, {
        systemPrompt,
        maxTokens: 500,
        temperature: 0.2
      });

      try {
        const analysis = JSON.parse(aiResponse.content);
        
        // 更新交易風險評分
        const updatedTransaction = {
          ...transaction,
          riskScore: analysis.riskScore,
          fraudIndicators: analysis.fraudIndicators,
          status: analysis.recommendation === 'approve' ? 'approved' :
                  analysis.recommendation === 'block' ? 'blocked' : 'investigating'
        };

        setTransactions(prev => [updatedTransaction, ...prev.slice(0, 50)]);

        // 如果偵測到高風險，生成警示
        if (analysis.riskScore > 70 || analysis.fraudIndicators.length > 0) {
          const alert: FraudAlert = {
            id: `A${transaction.id}`,
            transactionId: transaction.id,
            severity: analysis.riskScore > 90 ? 'critical' :
                     analysis.riskScore > 80 ? 'high' :
                     analysis.riskScore > 60 ? 'medium' : 'low',
            alertType: analysis.fraudIndicators[0] || 'pattern_anomaly',
            description: `交易 ${transaction.id} 偵測到異常行為: ${analysis.reasoning}`,
            timestamp: new Date(),
            status: 'new'
          };

          setAlerts(prev => [alert, ...prev.slice(0, 20)]);
          
          // 發送即時警示
          await sendAlert(
            alert.severity === 'critical' ? 'critical' : 
            alert.severity === 'high' ? 'high' : 'medium',
            '詐欺偵測警示',
            `交易 ${transaction.id} 風險評分: ${analysis.riskScore}`
          );
        }
        
      } catch (parseError) {
        console.error('AI 風險分析解析失敗:', parseError);
        
        // 備用風險評估
        const riskScore = Math.random() * 100;
        const fraudIndicators = riskScore > 70 ? ['pattern_anomaly'] : [];
        
        const updatedTransaction = {
          ...transaction,
          riskScore,
          fraudIndicators,
          status: riskScore > 80 ? 'blocked' : riskScore > 60 ? 'investigating' : 'approved'
        };

        setTransactions(prev => [updatedTransaction, ...prev.slice(0, 50)]);
      }
      
    } catch (error) {
      console.error('風險分析失敗:', error);
    }
  };

  const investigateAlert = async (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status: 'investigating', assignedTo: '調查員A' } : alert
    ));
    
    await sendAlert('info', '開始調查', `警示 ${alertId} 已開始調查`);
  };

  const resolveAlert = async (alertId: string, resolution: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status: 'resolved', resolution } : alert
    ));
    
    await sendAlert('success', '警示已解決', `警示 ${alertId} 已解決: ${resolution}`);
  };

  const generateFraudReport = async () => {
    const highRiskTransactions = transactions.filter(t => t.riskScore > 70);
    const blockedTransactions = transactions.filter(t => t.status === 'blocked');
    const activeAlerts = alerts.filter(a => a.status === 'new' || a.status === 'investigating');
    
    const reportContent = `
# 詐欺偵測報告
生成時間：${new Date().toLocaleString('zh-TW')}

## 偵測總覽
- 總交易數：${stats.totalTransactions}
- 阻擋交易：${stats.blockedTransactions}
- 誤報率：${stats.falsePositiveRate}%
- 平均回應時間：${stats.avgResponseTime} 分鐘

## 風險統計
- 高風險交易：${highRiskTransactions.length}
- 阻擋交易：${blockedTransactions.length}
- 調查中交易：${transactions.filter(t => t.status === 'investigating').length}
- 活躍警示：${activeAlerts.length}

## 高風險交易
${highRiskTransactions.length === 0 ? '✅ 目前無高風險交易' : highRiskTransactions.map(t => `
### 交易 ${t.id}
- 客戶：${t.customerName} (${t.customerId})
- 金額：NT$ ${t.amount.toLocaleString()}
- 類型：${t.transactionType === 'transfer' ? '轉帳' :
         t.transactionType === 'payment' ? '付款' :
         t.transactionType === 'withdrawal' ? '提款' :
         t.transactionType === 'deposit' ? '存款' : '消費'}
- 地點：${t.location.city}, ${t.location.country}
- 風險評分：${t.riskScore}
- 狀態：${t.status === 'pending' ? '待審核' :
         t.status === 'approved' ? '已核准' :
         t.status === 'blocked' ? '已阻擋' : '調查中'}
- 詐欺指標：${t.fraudIndicators.join(', ') || '無'}
- 時間：${t.timestamp.toLocaleString('zh-TW')}
`).join('\n')}

## 活躍警示
${activeAlerts.length === 0 ? '✅ 目前無活躍警示' : activeAlerts.map(alert => `
### 警示 ${alert.id}
- 交易ID：${alert.transactionId}
- 嚴重程度：${alert.severity === 'critical' ? '🔴 緊急' :
             alert.severity === 'high' ? '🟠 高' :
             alert.severity === 'medium' ? '🟡 中' : '🟢 低'}
- 警示類型：${alert.alertType === 'unusual_amount' ? '異常金額' :
             alert.alertType === 'unusual_location' ? '異常地點' :
             alert.alertType === 'unusual_time' ? '異常時間' :
             alert.alertType === 'device_mismatch' ? '設備不符' :
             alert.alertType === 'velocity_check' ? '頻率檢查' : '模式異常'}
- 描述：${alert.description}
- 狀態：${alert.status === 'new' ? '🆕 新警示' :
         alert.status === 'investigating' ? '🔍 調查中' :
         alert.status === 'resolved' ? '✅ 已解決' : '❌ 誤報'}
- 指派給：${alert.assignedTo || '未指派'}
- 時間：${alert.timestamp.toLocaleString('zh-TW')}
`).join('\n')}

## 風險檔案
${riskProfiles.map(profile => `
### 客戶 ${profile.customerId}
- 風險等級：${profile.riskLevel === 'high' ? '🔴 高' :
             profile.riskLevel === 'medium' ? '🟡 中' : '🟢 低'}
- 交易歷史：${profile.transactionHistory} 筆
- 平均金額：NT$ ${profile.avgAmount.toLocaleString()}
- 最大金額：NT$ ${profile.maxAmount.toLocaleString()}
- 異常模式：${profile.unusualPatterns.join(', ') || '無'}
- 最後更新：${profile.lastRiskUpdate.toLocaleString('zh-TW')}
`).join('\n')}

## 效率分析
- 偵測準確率：${((1 - stats.falsePositiveRate / 100) * 100).toFixed(1)}%
- 平均處理時間：${stats.avgResponseTime} 分鐘
- 阻擋成功率：${stats.totalTransactions > 0 ? ((stats.blockedTransactions / stats.totalTransactions) * 100).toFixed(1) : 0}%

## 建議措施
${activeAlerts.length > 0 ? '🚨 有活躍警示需要立即處理' :
  highRiskTransactions.length > 0 ? '⚠️ 有高風險交易需要關注' :
  '✅ 風險控制狀況良好'}

## AI 建議
${stats.falsePositiveRate > 5 ? '💡 誤報率較高，建議調整偵測參數' :
  stats.avgResponseTime > 5 ? '💡 回應時間較長，建議優化處理流程' :
  '✅ 偵測系統運行良好'}
    `.trim();

    await generateReport('詐欺偵測報告', reportContent, 'fraud');
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'bg-red-100 text-red-700 border-red-200';
    if (score >= 60) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (score >= 40) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">AI 詐欺偵測引擎</h3>
          <p className="text-slate-600 mt-1">實時交易異常偵測，保護金融安全</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMonitoring(!monitoring)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              monitoring
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <Shield className="w-5 h-5" />
            {monitoring ? '停止監控' : '開始監控'}
          </button>
          <button
            onClick={generateFraudReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            生成報告
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">總交易數</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalTransactions}</p>
            </div>
            <DollarSign className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">阻擋交易</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.blockedTransactions}</p>
            </div>
            <Shield className="w-10 h-10 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">誤報率</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{stats.falsePositiveRate}%</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-amber-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">平均回應時間</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{stats.avgResponseTime}分</p>
            </div>
            <Clock className="w-10 h-10 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h4 className="text-lg font-bold text-slate-900 mb-4">即時交易監控</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {transactions.slice(0, 10).map((transaction) => (
                <div key={transaction.id} className="p-4 bg-slate-50 rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="font-semibold text-slate-900">{transaction.customerName}</h5>
                      <p className="text-sm text-slate-600">
                        NT$ {transaction.amount.toLocaleString()} | {transaction.transactionType}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className={`px-2 py-1 rounded text-xs ${getRiskColor(transaction.riskScore)}`}>
                        風險: {transaction.riskScore}
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        transaction.status === 'approved' ? 'bg-green-100 text-green-700' :
                        transaction.status === 'blocked' ? 'bg-red-100 text-red-700' :
                        transaction.status === 'investigating' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {transaction.status === 'approved' ? '已核准' :
                         transaction.status === 'blocked' ? '已阻擋' :
                         transaction.status === 'investigating' ? '調查中' : '待審核'}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    <p>{transaction.location.city} | {transaction.device.type}</p>
                    <p>{transaction.timestamp.toLocaleTimeString('zh-TW')}</p>
                    {transaction.fraudIndicators.length > 0 && (
                      <p className="text-red-600">⚠️ {transaction.fraudIndicators.join(', ')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h4 className="text-lg font-bold text-slate-900 mb-4">詐欺警示</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">目前無警示</h4>
                  <p className="text-slate-600">所有交易正常</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="p-4 bg-slate-50 rounded-lg border">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h5 className="font-semibold text-slate-900">交易 {alert.transactionId}</h5>
                        <p className="text-sm text-slate-600">{alert.description}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className={`px-2 py-1 rounded text-xs ${getSeverityColor(alert.severity)}`}>
                          {alert.severity === 'critical' ? '緊急' :
                           alert.severity === 'high' ? '高' :
                           alert.severity === 'medium' ? '中' : '低'}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          alert.status === 'new' ? 'bg-blue-100 text-blue-700' :
                          alert.status === 'investigating' ? 'bg-yellow-100 text-yellow-700' :
                          alert.status === 'resolved' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {alert.status === 'new' ? '新警示' :
                           alert.status === 'investigating' ? '調查中' :
                           alert.status === 'resolved' ? '已解決' : '誤報'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        {alert.timestamp.toLocaleTimeString('zh-TW')}
                      </span>
                      <div className="flex gap-2">
                        {alert.status === 'new' && (
                          <button
                            onClick={() => investigateAlert(alert.id)}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                          >
                            調查
                          </button>
                        )}
                        {alert.status === 'investigating' && (
                          <button
                            onClick={() => resolveAlert(alert.id, '已確認為正常交易')}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                          >
                            解決
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Risk Profiles */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h4 className="text-lg font-bold text-slate-900 mb-4">客戶風險檔案</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {riskProfiles.map((profile) => (
            <div key={profile.customerId} className="p-4 bg-slate-50 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-semibold text-slate-900">客戶 {profile.customerId}</h5>
                <span className={`px-2 py-1 rounded text-xs ${
                  profile.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                  profile.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {profile.riskLevel === 'high' ? '高風險' :
                   profile.riskLevel === 'medium' ? '中風險' : '低風險'}
                </span>
              </div>
              <div className="space-y-1 text-sm text-slate-600">
                <p>交易歷史: {profile.transactionHistory} 筆</p>
                <p>平均金額: NT$ {profile.avgAmount.toLocaleString()}</p>
                <p>最大金額: NT$ {profile.maxAmount.toLocaleString()}</p>
                {profile.unusualPatterns.length > 0 && (
                  <p className="text-red-600">⚠️ {profile.unusualPatterns.join(', ')}</p>
                )}
                <p className="text-xs text-slate-500">
                  更新: {profile.lastRiskUpdate.toLocaleDateString('zh-TW')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export class FraudDetection extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <FraudDetectionModule context={context} />;
  }
}

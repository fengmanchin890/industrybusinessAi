/**
 * AI 工作流自動化 - 智能流程管理
 * 為中小企業提供自動化工作流程
 */

import React, { useState, useEffect } from 'react';
import { Workflow, Clock, CheckCircle, AlertCircle, Play, Pause, Settings } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState, useReportGeneration, useAlertSending } from '../../ModuleSDK';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../Contexts/AuthContext';

const metadata: ModuleMetadata = {
  id: 'workflow-automation',
  name: 'AI 工作流自動化',
  version: '1.0.0',
  category: 'sme',
  industry: ['sme'],
  description: '智能工作流自動化，自動處理重複性任務，提升工作效率',
  icon: 'Workflow',
  author: 'AI Business Platform',
  pricingTier: 'basic',
  features: [
    '智能流程設計',
    '自動任務執行',
    '條件觸發器',
    '進度追蹤',
    '效率分析'
  ]
};

const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: true,
  canProcessData: true,
  canIntegrateExternal: true,
  requiresDataConnection: false
};

interface WorkflowStep {
  id: string;
  name: string;
  type: 'trigger' | 'action' | 'condition' | 'notification';
  config: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  executedAt?: Date;
  duration?: number;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: WorkflowStep[];
  isActive: boolean;
  lastRun?: Date;
  successRate: number;
  avgDuration: number;
}

export function WorkflowAutomationModule({ context }: { context: ModuleContext }) {
  const { state, setRunning, setIdle } = useModuleState();
  const { generateReport } = useReportGeneration(context);
  const { sendAlert } = useAlertSending(context);
  const { company } = useAuth();
  
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([]);
  const [activeWorkflows, setActiveWorkflows] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowTemplate | null>(null);

  // 預設工作流模板
  const defaultTemplates: WorkflowTemplate[] = [
    {
      id: 'invoice-processing',
      name: '發票處理流程',
      description: '自動處理客戶發票，發送提醒，更新財務記錄',
      category: '財務',
      steps: [
        { id: '1', name: '接收發票', type: 'trigger', config: { source: 'email' }, status: 'pending' },
        { id: '2', name: '驗證發票', type: 'action', config: { validation: 'auto' }, status: 'pending' },
        { id: '3', name: '檢查金額', type: 'condition', config: { threshold: 10000 }, status: 'pending' },
        { id: '4', name: '發送通知', type: 'notification', config: { recipients: ['finance@company.com'] }, status: 'pending' },
        { id: '5', name: '更新記錄', type: 'action', config: { system: 'erp' }, status: 'pending' }
      ],
      isActive: false,
      successRate: 95,
      avgDuration: 120
    },
    {
      id: 'customer-onboarding',
      name: '客戶入職流程',
      description: '新客戶註冊後自動發送歡迎郵件，建立檔案，安排跟進',
      category: '客戶管理',
      steps: [
        { id: '1', name: '客戶註冊', type: 'trigger', config: { source: 'website' }, status: 'pending' },
        { id: '2', name: '發送歡迎郵件', type: 'action', config: { template: 'welcome' }, status: 'pending' },
        { id: '3', name: '建立客戶檔案', type: 'action', config: { system: 'crm' }, status: 'pending' },
        { id: '4', name: '安排跟進', type: 'action', config: { delay: '24h' }, status: 'pending' },
        { id: '5', name: '發送資料包', type: 'action', config: { attachments: ['brochure.pdf'] }, status: 'pending' }
      ],
      isActive: false,
      successRate: 88,
      avgDuration: 300
    },
    {
      id: 'inventory-alert',
      name: '庫存警示流程',
      description: '庫存低於安全水位時自動發送警示，生成採購單',
      category: '庫存管理',
      steps: [
        { id: '1', name: '檢查庫存', type: 'trigger', config: { frequency: 'daily' }, status: 'pending' },
        { id: '2', name: '比較安全水位', type: 'condition', config: { threshold: 'safety_stock' }, status: 'pending' },
        { id: '3', name: '發送警示', type: 'notification', config: { urgency: 'high' }, status: 'pending' },
        { id: '4', name: '生成採購單', type: 'action', config: { auto_generate: true }, status: 'pending' },
        { id: '5', name: '通知採購部門', type: 'notification', config: { department: 'procurement' }, status: 'pending' }
      ],
      isActive: false,
      successRate: 92,
      avgDuration: 60
    },
    {
      id: 'employee-onboarding',
      name: '員工入職流程',
      description: '新員工入職時自動建立帳號，發送設備，安排培訓',
      category: '人力資源',
      steps: [
        { id: '1', name: '員工入職', type: 'trigger', config: { source: 'hr_system' }, status: 'pending' },
        { id: '2', name: '建立系統帳號', type: 'action', config: { systems: ['email', 'crm', 'erp'] }, status: 'pending' },
        { id: '3', name: '發送設備', type: 'action', config: { items: ['laptop', 'phone'] }, status: 'pending' },
        { id: '4', name: '安排培訓', type: 'action', config: { schedule: 'first_week' }, status: 'pending' },
        { id: '5', name: '發送歡迎包', type: 'action', config: { documents: ['handbook', 'policies'] }, status: 'pending' }
      ],
      isActive: false,
      successRate: 90,
      avgDuration: 480
    }
  ];

  useEffect(() => {
    loadWorkflows();
  }, [company?.id]);

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      // 模擬載入工作流
      setWorkflows(defaultTemplates);
    } catch (error) {
      console.error('載入工作流失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkflow = async (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return;

    const isActive = activeWorkflows.includes(workflowId);
    
    if (isActive) {
      // 停止工作流
      setActiveWorkflows(prev => prev.filter(id => id !== workflowId));
      setIdle();
      await sendAlert('info', '工作流已停止', `工作流「${workflow.name}」已停止執行`);
    } else {
      // 啟動工作流
      setActiveWorkflows(prev => [...prev, workflowId]);
      setRunning();
      await sendAlert('info', '工作流已啟動', `工作流「${workflow.name}」已開始執行`);
      
      // 模擬工作流執行
      simulateWorkflowExecution(workflowId);
    }
  };

  const simulateWorkflowExecution = async (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return;

    // 更新工作流狀態
    setWorkflows(prev => prev.map(w => 
      w.id === workflowId 
        ? { ...w, isActive: true, lastRun: new Date() }
        : w
    ));

    // 模擬步驟執行
    for (let i = 0; i < workflow.steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setWorkflows(prev => prev.map(w => {
        if (w.id === workflowId) {
          const updatedSteps = [...w.steps];
          updatedSteps[i] = {
            ...updatedSteps[i],
            status: 'running',
            executedAt: new Date()
          };
          return { ...w, steps: updatedSteps };
        }
        return w;
      }));

      await new Promise(resolve => setTimeout(resolve, 2000));

      setWorkflows(prev => prev.map(w => {
        if (w.id === workflowId) {
          const updatedSteps = [...w.steps];
          updatedSteps[i] = {
            ...updatedSteps[i],
            status: 'completed',
            duration: Math.random() * 1000 + 500
          };
          return { ...w, steps: updatedSteps };
        }
        return w;
      }));
    }
  };

  const generateWorkflowReport = async () => {
    const activeCount = workflows.filter(w => w.isActive).length;
    const totalExecutions = workflows.reduce((sum, w) => sum + (w.lastRun ? 1 : 0), 0);
    const avgSuccessRate = workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length;

    const reportContent = `
# 工作流自動化報告
生成時間：${new Date().toLocaleString('zh-TW')}

## 總覽
- 總工作流數：${workflows.length}
- 活躍工作流：${activeCount}
- 總執行次數：${totalExecutions}
- 平均成功率：${avgSuccessRate.toFixed(1)}%

## 工作流詳情
${workflows.map(w => `
### ${w.name}
- 類別：${w.category}
- 狀態：${w.isActive ? '🟢 運行中' : '⏸️ 已停止'}
- 成功率：${w.successRate}%
- 平均執行時間：${w.avgDuration} 秒
- 最後執行：${w.lastRun ? w.lastRun.toLocaleString('zh-TW') : '從未執行'}
- 步驟數：${w.steps.length}
`).join('\n')}

## 效率分析
${workflows.length > 0 ? `
- 最活躍工作流：${workflows.reduce((max, w) => w.successRate > max.successRate ? w : max).name}
- 平均執行時間：${(workflows.reduce((sum, w) => sum + w.avgDuration, 0) / workflows.length).toFixed(1)} 秒
- 建議優化：${avgSuccessRate < 90 ? '部分工作流成功率較低，建議檢查配置' : '工作流運行狀況良好'}
` : '暫無工作流數據'}

## AI 建議
${activeCount === 0 ? '💡 建議啟動更多工作流以提升自動化程度' : 
  activeCount < workflows.length / 2 ? '💡 可考慮啟動更多工作流' : 
  '✅ 工作流自動化程度良好'}
    `.trim();

    await generateReport('工作流自動化報告', reportContent, 'workflow');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'running': return 'bg-blue-100 text-blue-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'running': return <Clock className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">AI 工作流自動化</h3>
          <p className="text-slate-600 mt-1">智能流程管理，自動處理重複性任務</p>
        </div>
        <button
          onClick={generateWorkflowReport}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          生成報告
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">總工作流</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{workflows.length}</p>
            </div>
            <Workflow className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">活躍工作流</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {workflows.filter(w => w.isActive).length}
              </p>
            </div>
            <Play className="w-10 h-10 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">平均成功率</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">
                {workflows.length > 0 ? 
                  (workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length).toFixed(1) + '%' : 
                  '0%'
                }
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-amber-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">平均執行時間</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                {workflows.length > 0 ? 
                  (workflows.reduce((sum, w) => sum + w.avgDuration, 0) / workflows.length).toFixed(0) + 's' : 
                  '0s'
                }
              </p>
            </div>
            <Clock className="w-10 h-10 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Workflow Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {workflows.map((workflow) => (
          <div key={workflow.id} className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-bold text-slate-900">{workflow.name}</h4>
                <p className="text-sm text-slate-600 mt-1">{workflow.description}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                    {workflow.category}
                  </span>
                  <span className="text-xs text-slate-500">
                    成功率: {workflow.successRate}%
                  </span>
                  <span className="text-xs text-slate-500">
                    平均時間: {workflow.avgDuration}s
                  </span>
                </div>
              </div>
              <button
                onClick={() => toggleWorkflow(workflow.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  activeWorkflows.includes(workflow.id)
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {activeWorkflows.includes(workflow.id) ? (
                  <>
                    <Pause className="w-4 h-4" />
                    停止
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    啟動
                  </>
                )}
              </button>
            </div>

            {/* Workflow Steps */}
            <div className="space-y-2">
              {workflow.steps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step.status === 'completed' ? 'bg-green-100' :
                      step.status === 'running' ? 'bg-blue-100' :
                      step.status === 'failed' ? 'bg-red-100' :
                      'bg-slate-100'
                    }`}>
                      <span className="text-sm font-semibold">{index + 1}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-slate-900">{step.name}</h5>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${getStatusColor(step.status)}`}>
                        {getStatusIcon(step.status)}
                        <span>
                          {step.status === 'completed' ? '已完成' :
                           step.status === 'running' ? '執行中' :
                           step.status === 'failed' ? '失敗' : '待執行'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      {step.type === 'trigger' ? '觸發器' :
                       step.type === 'action' ? '動作' :
                       step.type === 'condition' ? '條件' : '通知'}
                    </p>
                    {step.duration && (
                      <p className="text-xs text-slate-500 mt-1">
                        執行時間: {step.duration.toFixed(0)}ms
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {workflow.lastRun && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  最後執行: {workflow.lastRun.toLocaleString('zh-TW')}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create New Workflow */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h4 className="text-lg font-bold text-slate-900 mb-4">建立新工作流</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <Workflow className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">從模板建立</p>
            <p className="text-xs text-slate-500">使用預設模板快速建立</p>
          </button>
          <button className="p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <Settings className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">自訂工作流</p>
            <p className="text-xs text-slate-500">從頭設計工作流程</p>
          </button>
          <button className="p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <CheckCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">匯入工作流</p>
            <p className="text-xs text-slate-500">從其他系統匯入</p>
          </button>
        </div>
      </div>
    </div>
  );
}

export class WorkflowAutomation extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <WorkflowAutomationModule context={context} />;
  }
}

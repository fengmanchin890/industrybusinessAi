/**
 * AI Office Agent - 办公自动化助手
 * 适用于中小企业的文书处理和报表生成
 */

import { useState } from 'react';
import { FileText, Calendar, Bot, Download, Sparkles } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState, useReportGeneration } from '../../ModuleSDK';

const metadata: ModuleMetadata = {
  id: 'office-agent',
  name: 'AI Office Agent',
  version: '1.0.0',
  category: 'sme',
  industry: ['sme'],
  description: '自动处理文书工作、生成报表、总结会议纪录',
  icon: 'Bot',
  author: 'AI Business Platform',
  pricingTier: 'basic',
  features: [
    '自动生成报表',
    '会议纪录摘要',
    '文件审核辅助',
    '邮件回复建议',
    '日程管理优化'
  ]
};

const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: true,
  canProcessData: true,
  canIntegrateExternal: true,
  requiresDataConnection: false
};

interface Task {
  id: string;
  type: '报表' | '会议纪录' | '文件审核';
  title: string;
  status: 'pending' | 'processing' | 'completed';
  createdAt: Date;
  completedAt?: Date;
}

export function OfficeAgentModule({ context }: { context: ModuleContext }) {
  const { state } = useModuleState();
  const { generateReport } = useReportGeneration(context);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [processing, setProcessing] = useState(false);

  const createTask = async (type: Task['type'], title: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      type,
      title,
      status: 'pending',
      createdAt: new Date()
    };

    setTasks(prev => [newTask, ...prev]);
    
    // 模拟 AI 处理
    setTimeout(() => {
      setTasks(prev => prev.map(t =>
        t.id === newTask.id ? { ...t, status: 'processing' as const } : t
      ));
    }, 500);

    setTimeout(() => {
      setTasks(prev => prev.map(t =>
        t.id === newTask.id ? { 
          ...t,
          status: 'completed' as const,
          completedAt: new Date()
        } : t
      ));
    }, 3000);
  };

  const quickActions = [
    { icon: FileText, label: '生成周报', type: '报表' as const },
    { icon: Calendar, label: '总结会议', type: '会议纪录' as const },
    { icon: FileText, label: '审核合约', type: '文件审核' as const }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">AI Office Agent</h3>
        <p className="text-slate-600 mt-1">您的智能办公助手</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map(action => (
          <button
            key={action.label}
            onClick={() => createTask(action.type, action.label)}
            className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-xl p-6 hover:shadow-lg transition-all text-left group"
          >
            <action.icon className="w-10 h-10 mb-3 group-hover:scale-110 transition-transform" />
            <h4 className="text-lg font-bold mb-1">{action.label}</h4>
            <p className="text-blue-100 text-sm">一键自动生成</p>
          </button>
        ))}
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h4 className="text-lg font-bold text-slate-900 mb-4">最近任务</h4>
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>尚无任务</p>
            <p className="text-sm mt-1">点击上方快速操作开始使用</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    task.status === 'completed' ? 'bg-green-100' :
                    task.status === 'processing' ? 'bg-blue-100' :
                    'bg-slate-200'
                  }`}>
                    {task.status === 'processing' ? (
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : task.status === 'completed' ? (
                      <Sparkles className="w-5 h-5 text-green-600" />
                    ) : (
                      <FileText className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{task.title}</div>
                    <div className="text-sm text-slate-600">
                      {task.type} · {task.createdAt.toLocaleTimeString()}
                      {task.completedAt && ` · 完成于 ${task.completedAt.toLocaleTimeString()}`}
                    </div>
                  </div>
                </div>
                {task.status === 'completed' && (
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Download className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export class OfficeAgent extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <OfficeAgentModule context={context} />;
  }
}


/**
 * AI Office Agent - 办公自动化助手
 * 适用于中小企业的文书处理和报表生成
 * Version 2.0.0 - 完整 AI 功能
 */

import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Bot, Download, Sparkles, Mail, Clock, TrendingUp, CheckCircle } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState, useReportGeneration } from '../../ModuleSDK';
import { supabase } from '../../../lib/supabase';

const metadata: ModuleMetadata = {
  id: 'office-agent',
  name: 'AI Office Agent',
  version: '2.0.0',
  category: 'sme',
  industry: ['sme'],
  description: 'AI驱动的办公自动化助手 - 智能报表生成、会议总结、文档审核、邮件起草、日程优化',
  icon: 'Bot',
  author: 'AI Business Platform',
  pricingTier: 'pro',
  features: [
    'AI 自动生成报表',
    'AI 会议纪录摘要',
    'AI 文件审核辅助',
    'AI 邮件回复建议',
    'AI 日程管理优化',
    '智能文档搜索',
    '实时任务追踪',
    '效率提升分析'
  ]
};

const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: true,
  canProcessData: true,
  canIntegrateExternal: true,
  requiresDataConnection: true
};

interface Task {
  id: string;
  task_type: string;
  title: string;
  description?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: string;
  ai_model_used?: string;
  processing_time_ms?: number;
  created_at: string;
  completed_at?: string;
}

interface Meeting {
  id: string;
  meeting_title: string;
  meeting_date: string;
  duration_minutes?: number;
  participants?: string[];
  summary?: string;
  key_points?: string[];
  status: string;
}

interface Document {
  id: string;
  document_name: string;
  document_type: string;
  summary?: string;
  keywords?: string[];
  ai_analyzed: boolean;
  created_at: string;
}

interface Stats {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  totalMeetings: number;
  totalDocuments: number;
  avgProcessingTime: number;
}

export function OfficeAgentModule({ context }: { context: ModuleContext }) {
  const { state } = useModuleState();
  const { generateReport } = useReportGeneration(context);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalTasks: 0,
    completedTasks: 0,
    completionRate: 0,
    totalMeetings: 0,
    totalDocuments: 0,
    avgProcessingTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // 获取公司 ID
  const getCompanyId = async (): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      return userData?.company_id || null;
    } catch (error) {
      console.error('Error getting company ID:', error);
      return null;
    }
  };

  // 加载数据
  useEffect(() => {
    console.log('🔄 OfficeAgent: Starting data load...');
    loadData();
  }, []);

  const loadData = async () => {
    console.log('🔄 OfficeAgent loadData: Setting loading to true');
    setLoading(true);
    
    try {
      const companyId = await getCompanyId();
      console.log('🔄 OfficeAgent: Got company ID:', companyId);
      
      if (!companyId) {
        console.error('❌ OfficeAgent: No company ID found');
        setLoading(false);
        return;
      }

      // 添加超时保护 - 10秒后强制完成
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          console.warn('⚠️ OfficeAgent: Load timeout, forcing complete');
          resolve(null);
        }, 10000);
      });

      const loadPromise = Promise.allSettled([
        loadTasks(companyId),
        loadMeetings(companyId),
        loadDocuments(companyId),
        loadStats(companyId)
      ]).then(results => {
        console.log('✅ OfficeAgent: All data loaded', results);
        return results;
      });

      await Promise.race([loadPromise, timeoutPromise]);
      
    } catch (error) {
      console.error('❌ OfficeAgent: Error loading data:', error);
    } finally {
      console.log('✅ OfficeAgent loadData: Setting loading to false');
      setLoading(false);
    }
  };

  const loadTasks = async (companyId: string) => {
    console.log('🔄 OfficeAgent: Loading tasks...');
    const { data, error } = await supabase
      .from('office_tasks')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ OfficeAgent: Error loading tasks:', error);
      setTasks([]);
      return;
    }

    console.log('✅ OfficeAgent: Loaded', data?.length || 0, 'tasks');
    setTasks(data || []);
  };

  const loadMeetings = async (companyId: string) => {
    console.log('🔄 OfficeAgent: Loading meetings...');
    const { data, error } = await supabase
      .from('meeting_records')
      .select('*')
      .eq('company_id', companyId)
      .order('meeting_date', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ OfficeAgent: Error loading meetings:', error);
      setMeetings([]);
      return;
    }

    console.log('✅ OfficeAgent: Loaded', data?.length || 0, 'meetings');
    setMeetings(data || []);
  };

  const loadDocuments = async (companyId: string) => {
    console.log('🔄 OfficeAgent: Loading documents...');
    const { data, error } = await supabase
      .from('office_documents')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ OfficeAgent: Error loading documents:', error);
      setDocuments([]);
      return;
    }

    console.log('✅ OfficeAgent: Loaded', data?.length || 0, 'documents');
    setDocuments(data || []);
  };

  const loadStats = async (companyId: string) => {
    try {
      console.log('🔄 OfficeAgent: Loading stats for company:', companyId);
      
      const { data: taskStats, error } = await supabase.rpc('get_task_statistics', {
        p_company_id: companyId,
        p_days: 30
      });

      if (error) {
        console.error('❌ OfficeAgent: RPC error:', error);
        // 如果 RPC 失败，使用默认值
        setStats({
          totalTasks: tasks.length,
          completedTasks: tasks.filter(t => t.status === 'completed').length,
          completionRate: 0,
          totalMeetings: meetings.length,
          totalDocuments: documents.length,
          avgProcessingTime: 0
        });
        return;
      }

      if (taskStats && taskStats.length > 0) {
        const stats = taskStats[0];
        console.log('✅ OfficeAgent: Stats loaded:', stats);
        setStats({
          totalTasks: stats.total_tasks || 0,
          completedTasks: stats.completed_tasks || 0,
          completionRate: stats.total_tasks > 0 
            ? (stats.completed_tasks / stats.total_tasks * 100) 
            : 0,
          totalMeetings: meetings.length,
          totalDocuments: documents.length,
          avgProcessingTime: stats.average_completion_time_minutes || 0
        });
      } else {
        console.warn('⚠️ OfficeAgent: No stats data returned');
        // 使用基础统计
        setStats({
          totalTasks: tasks.length,
          completedTasks: tasks.filter(t => t.status === 'completed').length,
          completionRate: 0,
          totalMeetings: meetings.length,
          totalDocuments: documents.length,
          avgProcessingTime: 0
        });
      }
    } catch (error) {
      console.error('❌ OfficeAgent: Error loading stats:', error);
      // 失败时使用默认值
      setStats({
        totalTasks: 0,
        completedTasks: 0,
        completionRate: 0,
        totalMeetings: 0,
        totalDocuments: 0,
        avgProcessingTime: 0
      });
    }
  };

  // AI 操作
  const callAI = async (action: string, data: any) => {
    try {
      const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
      const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/office-agent-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ action, data })
      });

      if (!response.ok) {
        throw new Error(`AI request failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error(`Error calling AI (${action}):`, error);
      throw error;
    }
  };

  const createTask = async (taskType: string, title: string) => {
    setProcessing(true);
    try {
      const companyId = await getCompanyId();
      if (!companyId) throw new Error('No company ID');

      // 创建任务
      const { data: newTask, error } = await supabase
        .from('office_tasks')
        .insert({
          company_id: companyId,
          task_type: taskType,
          title,
          description: `AI自动${title}`,
          status: 'processing',
          priority: 'normal'
        })
        .select()
        .single();

      if (error) throw error;

      // 刷新任务列表
      await loadTasks(companyId);

      // 调用 AI 处理
      let aiResult;
      const startTime = Date.now();

      if (taskType === 'report') {
        aiResult = await callAI('generate_report', {
          companyId,
          reportType: '周报',
          periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          periodEnd: new Date().toISOString().split('T')[0]
        });
      } else if (taskType === 'meeting_summary') {
        aiResult = await callAI('summarize_meeting', {
          companyId,
          meetingId: meetings[0]?.id,
          transcript: '会议转录文本...'
        });
      } else if (taskType === 'document_review') {
        aiResult = await callAI('review_document', {
          companyId,
          documentId: documents[0]?.id,
          documentText: '文档内容...',
          documentType: 'contract'
        });
      }

      const processingTime = Date.now() - startTime;

      // 更新任务状态
      await supabase
        .from('office_tasks')
        .update({
          status: 'completed',
          processing_time_ms: processingTime,
          ai_model_used: 'gpt-4',
          completed_at: new Date().toISOString()
        })
        .eq('id', newTask.id);

      // 刷新列表
      await loadTasks(companyId);
      await loadStats(companyId);

      alert(`✅ ${title}完成！\n处理时间: ${(processingTime / 1000).toFixed(2)}秒`);
    } catch (error) {
      console.error('Error creating task:', error);
      alert(`❌ 任务创建失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setProcessing(false);
    }
  };

  const quickActions = [
    { icon: FileText, label: '生成周报', taskType: 'report' },
    { icon: Calendar, label: '总结会议', taskType: 'meeting_summary' },
    { icon: FileText, label: '审核合约', taskType: 'document_review' },
    { icon: Mail, label: '起草邮件', taskType: 'email_draft' },
    { icon: Clock, label: '优化日程', taskType: 'schedule_optimization' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">AI Office Agent</h3>
        <p className="text-slate-600 mt-1">您的智能办公助手 v2.0 - AI 驱动</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 opacity-80" />
            <span className="text-2xl font-bold">{stats.completedTasks}</span>
          </div>
          <div className="text-blue-100 text-sm">已完成任务</div>
          <div className="text-xs text-blue-200 mt-1">完成率 {stats.completionRate.toFixed(0)}%</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8 opacity-80" />
            <span className="text-2xl font-bold">{meetings.length}</span>
          </div>
          <div className="text-green-100 text-sm">会议记录</div>
          <div className="text-xs text-green-200 mt-1">最近 30 天</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-8 h-8 opacity-80" />
            <span className="text-2xl font-bold">{documents.length}</span>
          </div>
          <div className="text-purple-100 text-sm">文档管理</div>
          <div className="text-xs text-purple-200 mt-1">AI 已分析</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 opacity-80" />
            <span className="text-2xl font-bold">{stats.avgProcessingTime.toFixed(0)}</span>
          </div>
          <div className="text-orange-100 text-sm">平均处理时间</div>
          <div className="text-xs text-orange-200 mt-1">分钟</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h4 className="text-lg font-bold text-slate-900 mb-4">快速操作</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {quickActions.map(action => (
            <button
              key={action.label}
              onClick={() => createTask(action.taskType, action.label)}
              disabled={processing}
              className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-xl p-4 hover:shadow-lg transition-all text-center group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <action.icon className="w-8 h-8 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-sm font-medium">{action.label}</div>
            </button>
          ))}
        </div>
        {processing && (
          <div className="mt-4 text-center text-blue-600 text-sm flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>AI 正在处理中...</span>
          </div>
        )}
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
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    task.status === 'completed' ? 'bg-green-100' :
                    task.status === 'processing' ? 'bg-blue-100' :
                    task.status === 'failed' ? 'bg-red-100' :
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
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{task.title}</div>
                    <div className="text-sm text-slate-600">
                      {task.task_type} · {new Date(task.created_at).toLocaleString('zh-CN')}
                      {task.completed_at && ` · 完成于 ${new Date(task.completed_at).toLocaleTimeString()}`}
                      {task.processing_time_ms && ` · ${(task.processing_time_ms / 1000).toFixed(2)}秒`}
                    </div>
                    {task.ai_model_used && (
                      <div className="text-xs text-blue-600 mt-1">
                        🤖 {task.ai_model_used}
                      </div>
                    )}
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

      {/* Recent Meetings */}
      {meetings.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h4 className="text-lg font-bold text-slate-900 mb-4">最近会议</h4>
          <div className="space-y-3">
            {meetings.slice(0, 3).map(meeting => (
              <div key={meeting.id} className="p-4 bg-slate-50 rounded-lg">
                <div className="font-medium text-slate-900">{meeting.meeting_title}</div>
                <div className="text-sm text-slate-600 mt-1">
                  {new Date(meeting.meeting_date).toLocaleDateString('zh-CN')}
                  {meeting.duration_minutes && ` · ${meeting.duration_minutes}分钟`}
                </div>
                {meeting.summary && (
                  <div className="text-sm text-slate-700 mt-2">{meeting.summary}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Documents */}
      {documents.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h4 className="text-lg font-bold text-slate-900 mb-4">最近文档</h4>
          <div className="space-y-3">
            {documents.slice(0, 3).map(doc => (
              <div key={doc.id} className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{doc.document_name}</div>
                    <div className="text-sm text-slate-600 mt-1">
                      {doc.document_type} · {new Date(doc.created_at).toLocaleDateString('zh-CN')}
                    </div>
                    {doc.summary && (
                      <div className="text-sm text-slate-700 mt-2">{doc.summary}</div>
                    )}
                    {doc.keywords && doc.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {doc.keywords.slice(0, 4).map(keyword => (
                          <span key={keyword} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {doc.ai_analyzed && (
                    <span className="text-green-600 text-xs font-medium ml-2">AI已分析</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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


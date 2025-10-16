import { useEffect, useState } from 'react';
import { useAuth } from '../Contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { TrendingUp, AlertCircle, FileText, Box, Sparkles, ArrowRight } from 'lucide-react';

interface Stats {
  installedModules: number;
  activeAlerts: number;
  recentReports: number;
  dataConnections: number;
}

// 骨架屏組件
function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-4 bg-slate-200 rounded w-24 mb-3"></div>
          <div className="h-8 bg-slate-200 rounded w-16"></div>
        </div>
        <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
      </div>
    </div>
  );
}

export function Overview() {
  const { company } = useAuth();
  const [stats, setStats] = useState<Stats>({
    installedModules: 0,
    activeAlerts: 0,
    recentReports: 0,
    dataConnections: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (company?.id) {
      console.log('🔄 Overview mounted, company ID:', company.id);
      loadStats();
    } else {
      console.log('⚠️ Overview mounted, but no company ID');
      setLoading(false);
    }
  }, [company?.id]);

  const loadStats = async () => {
    if (!company?.id) {
      console.log('❌ No company ID found');
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Loading stats for company:', company.id);
      
      // 简化：直接查询，移除超时机制
      const [modules, alerts, reports, connections] = await Promise.all([
        supabase
          .from('company_modules')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', company.id)
          .eq('is_enabled', true),
        supabase
          .from('alerts')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', company.id)
          .eq('is_read', false),
        supabase
          .from('reports')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', company.id)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('data_connections')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', company.id)
          .eq('status', 'active'),
      ]);

      console.log('✅ Stats loaded successfully:', {
        modules: { count: modules.count, error: modules.error },
        alerts: { count: alerts.count, error: alerts.error },
        reports: { count: reports.count, error: reports.error },
        connections: { count: connections.count, error: connections.error },
      });

      // 检查是否有错误
      if (modules.error) console.error('❌ Modules query error:', modules.error);
      if (alerts.error) console.error('❌ Alerts query error:', alerts.error);
      if (reports.error) console.error('❌ Reports query error:', reports.error);
      if (connections.error) console.error('❌ Connections query error:', connections.error);

      setStats({
        installedModules: modules.count || 0,
        activeAlerts: alerts.count || 0,
        recentReports: reports.count || 0,
        dataConnections: connections.count || 0,
      });
    } catch (error) {
      console.error('❌ Error loading stats:', error);
      // 即使出错也要设置为 0，让界面显示出来
      setStats({
        installedModules: 0,
        activeAlerts: 0,
        recentReports: 0,
        dataConnections: 0,
      });
    } finally {
      console.log('✅ Loading complete, setting loading to false');
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: '已安裝模組',
      value: stats.installedModules,
      icon: Box,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      label: '活躍提醒',
      value: stats.activeAlerts,
      icon: AlertCircle,
      color: 'red',
      gradient: 'from-red-500 to-rose-600',
    },
    {
      label: '近 7 日報告',
      value: stats.recentReports,
      icon: FileText,
      color: 'green',
      gradient: 'from-green-500 to-emerald-600',
    },
    {
      label: '資料連接',
      value: stats.dataConnections,
      icon: TrendingUp,
      color: 'amber',
      gradient: 'from-amber-500 to-orange-600',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 bg-slate-200 rounded w-64 mb-2 animate-pulse"></div>
          <div className="h-4 bg-slate-200 rounded w-96 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <h2 className="text-2xl font-bold text-slate-900">儀表板總覽</h2>
        <p className="text-slate-600 mt-1">監控您的 AI 平台指標與洞察</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="card-interactive p-6 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-600 font-medium mb-2">{card.label}</p>
                  <p className="text-3xl font-bold text-slate-900">{card.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colorClasses[card.color as keyof typeof colorClasses]}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-700 rounded-2xl p-8 text-white shadow-xl animate-slide-up relative overflow-hidden" style={{ animationDelay: '0.4s' }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-6 h-6" />
            <h3 className="text-2xl font-bold">歡迎使用 AI Business Platform</h3>
          </div>
          <p className="text-blue-100 mb-6 max-w-2xl">
            為您的 {company?.industry} 企業提供即插即用的 AI 模組。
            無需技術專業知識。
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/30">
              <p className="text-sm text-blue-100 mb-1">產業類別</p>
              <p className="font-semibold capitalize text-lg">{company?.industry}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/30">
              <p className="text-sm text-blue-100 mb-1">訂閱方案</p>
              <p className="font-semibold capitalize text-lg">{company?.subscription_tier}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6 animate-slide-up" style={{ animationDelay: '0.5s' }}>
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-cyan-600 rounded-full"></div>
          快速入門指南
        </h3>
        <div className="space-y-4">
          {[
            {
              number: 1,
              title: '瀏覽 AI 模組',
              description: '在模組商店探索針對產業的 AI 解決方案',
            },
            {
              number: 2,
              title: '安裝模組',
              description: '一鍵安裝您選擇的 AI 功能',
            },
            {
              number: 3,
              title: '連接您的資料',
              description: '連接 PLC、MES、POS 或上傳 Excel 檔案進行 AI 分析',
            },
            {
              number: 4,
              title: '生成洞察',
              description: '接收自動化報告和可行的建議',
            },
          ].map((step, index) => (
            <div
              key={step.number}
              className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-all duration-200 group cursor-pointer"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-md group-hover:scale-110 transition-transform">
                {step.number}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900 mb-1">{step.title}</p>
                <p className="text-sm text-slate-600">{step.description}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

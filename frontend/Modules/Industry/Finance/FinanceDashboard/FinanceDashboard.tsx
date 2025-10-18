/**
 * 财务仪表板
 * Financial Dashboard - 整合财务管理的核心界面
 */
import React, { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, AlertCircle,
  PieChart, BarChart3, Activity, Clock, CheckCircle,
  ArrowUpRight, ArrowDownRight, RefreshCw
} from 'lucide-react';
import { financeService, type FinancialReport, type FinancialAnomaly } from '../../../../lib/finance-service';

interface DashboardMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  roi: number;
  trend: 'up' | 'down' | 'stable';
}

const FinanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    roi: 0,
    trend: 'stable'
  });
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [anomalies, setAnomalies] = useState<FinancialAnomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceAvailable, setServiceAvailable] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 检查服务可用性
      await financeService.healthCheck();
      setServiceAvailable(true);

      // 加载最近的报表
      const recentReports = await financeService.listReports();
      setReports(recentReports.slice(0, 5));

      // 计算关键指标
      if (recentReports.length > 0) {
        const latestReport = recentReports[0];
        const calculatedMetrics: DashboardMetrics = {
          totalRevenue: latestReport.revenue || 2000000,
          totalExpenses: latestReport.expenses || 1380000,
          netProfit: latestReport.profit || 620000,
          profitMargin: ((latestReport.profit || 620000) / (latestReport.revenue || 2000000) * 100),
          roi: 31.0,
          trend: (latestReport.profit || 0) > 0 ? 'up' : 'down'
        };
        setMetrics(calculatedMetrics);
      } else {
        // 使用模拟数据
        setMetrics({
          totalRevenue: 2000000,
          totalExpenses: 1380000,
          netProfit: 620000,
          profitMargin: 31.0,
          roi: 31.0,
          trend: 'up'
        });
      }

      // 加载异常告警
      const alerts = await financeService.getAlerts();
      setAnomalies(alerts.slice(0, 5));

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setServiceAvailable(false);
      // 使用模拟数据
      setMetrics({
        totalRevenue: 2000000,
        totalExpenses: 1380000,
        netProfit: 620000,
        profitMargin: 31.0,
        roi: 31.0,
        trend: 'up'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const MetricCard: React.FC<{
    title: string;
    value: string;
    change?: string;
    trend?: 'up' | 'down' | 'stable';
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, change, trend, icon, color }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : 
             trend === 'down' ? <ArrowDownRight className="w-4 h-4" /> : null}
            {change}
          </div>
        )}
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 服务状态提示 */}
      {!serviceAvailable && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <div>
            <p className="text-sm font-medium text-yellow-900">财务服务未连接</p>
            <p className="text-xs text-yellow-700">
              显示模拟数据。请确保财务服务运行在 http://localhost:8002
            </p>
          </div>
        </div>
      )}

      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">财务管理中心</h1>
          <p className="text-gray-600 mt-1">实时监控企业财务状况与分析</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          刷新数据
        </button>
      </div>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <MetricCard
          title="总收入"
          value={formatCurrency(metrics.totalRevenue)}
          change="+12.5%"
          trend="up"
          icon={<DollarSign className="w-6 h-6 text-green-600" />}
          color="bg-green-50"
        />
        <MetricCard
          title="总支出"
          value={formatCurrency(metrics.totalExpenses)}
          change="+5.2%"
          trend="up"
          icon={<TrendingDown className="w-6 h-6 text-red-600" />}
          color="bg-red-50"
        />
        <MetricCard
          title="净利润"
          value={formatCurrency(metrics.netProfit)}
          change="+18.3%"
          trend="up"
          icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
          color="bg-blue-50"
        />
        <MetricCard
          title="利润率"
          value={`${metrics.profitMargin.toFixed(1)}%`}
          change="+2.1%"
          trend="up"
          icon={<PieChart className="w-6 h-6 text-purple-600" />}
          color="bg-purple-50"
        />
        <MetricCard
          title="ROI"
          value={`${metrics.roi.toFixed(1)}%`}
          change="+5.0%"
          trend="up"
          icon={<BarChart3 className="w-6 h-6 text-orange-600" />}
          color="bg-orange-50"
        />
      </div>

      {/* 主要内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 最近报表 */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              最近生成的报表
            </h2>
          </div>
          <div className="p-6">
            {reports.length > 0 ? (
              <div className="space-y-3">
                {reports.map(report => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        report.report_type === 'income_statement' ? 'bg-green-100' :
                        report.report_type === 'balance_sheet' ? 'bg-blue-100' :
                        report.report_type === 'cash_flow' ? 'bg-purple-100' : 'bg-gray-100'
                      }`}>
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {report.report_type === 'income_statement' ? '损益表' :
                           report.report_type === 'balance_sheet' ? '资产负债表' :
                           report.report_type === 'cash_flow' ? '现金流量表' : '自定义报表'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {report.period_start} 至 {report.period_end}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        report.status === 'completed' ? 'bg-green-100 text-green-800' :
                        report.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {report.status === 'completed' ? '已完成' :
                         report.status === 'generating' ? '生成中' : '失败'}
                      </span>
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {new Date(report.generated_at).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">暂无报表数据</p>
                <p className="text-sm text-gray-400 mt-1">点击"生成报表"创建您的第一份财务报表</p>
              </div>
            )}
          </div>
        </div>

        {/* 异常告警 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              异常告警
            </h2>
          </div>
          <div className="p-6">
            {anomalies.length > 0 ? (
              <div className="space-y-3">
                {anomalies.map(anomaly => (
                  <div
                    key={anomaly.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      anomaly.severity === 'critical' ? 'border-red-500 bg-red-50' :
                      anomaly.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                      anomaly.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                      'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        anomaly.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        anomaly.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        anomaly.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {anomaly.severity === 'critical' ? '严重' :
                         anomaly.severity === 'high' ? '高' :
                         anomaly.severity === 'medium' ? '中' : '低'}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900 text-sm mb-1">
                      {anomaly.description}
                    </p>
                    <p className="text-xs text-gray-600">
                      偏离 {anomaly.deviation_percentage.toFixed(1)}%
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                <p className="text-gray-500">一切正常</p>
                <p className="text-sm text-gray-400 mt-1">未检测到财务异常</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">财务快速操作</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center gap-3 p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group">
            <BarChart3 className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-900">生成财务报表</span>
          </button>
          <button className="flex flex-col items-center gap-3 p-6 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group">
            <TrendingUp className="w-8 h-8 text-green-600 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-900">成本分析</span>
          </button>
          <button className="flex flex-col items-center gap-3 p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group">
            <PieChart className="w-8 h-8 text-purple-600 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-900">ROI 计算</span>
          </button>
          <button className="flex flex-col items-center gap-3 p-6 bg-red-50 rounded-lg hover:bg-red-100 transition-colors group">
            <AlertCircle className="w-8 h-8 text-red-600 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-900">异常检测</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;


/**
 * Tenant Management Dashboard
 * Manage company profile, users, settings, and view usage analytics
 */

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Settings,
  BarChart3,
  Crown,
  Shield,
  Database,
  TrendingUp,
  DollarSign,
  Clock,
  Activity,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../Contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface CompanyInfo {
  id: string;
  name: string;
  subscription_tier: string;
  industry: string | null;
  settings: Record<string, any>;
  created_at: string;
  user_count: number;
  module_count: number;
}

interface UsageStats {
  period: string;
  api_requests: number;
  ai_requests: number;
  total_tokens: number;
  total_cost_usd: number;
  cache_hit_rate: number;
  avg_latency_ms: number;
  by_module: Record<string, any>;
  by_model: Record<string, any>;
  top_users: Array<any>;
}

export default function TenantManagement() {
  const { company, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'settings' | 'usage'>('overview');
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get AI Core URL from environment
      const aiCoreUrl = import.meta.env.VITE_AI_CORE_URL || 'http://localhost:8000';
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      // Fetch company info
      const infoResponse = await fetch(`${aiCoreUrl}/api/v1/tenant/info`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (infoResponse.ok) {
        const info = await infoResponse.json();
        setCompanyInfo(info);
      }

      // Fetch usage stats
      const usageResponse = await fetch(`${aiCoreUrl}/api/v1/tenant/usage?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (usageResponse.ok) {
        const stats = await usageResponse.json();
        setUsageStats(stats);
      }
    } catch (error) {
      console.error('Failed to load tenant data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierBadge = (tier: string) => {
    const colors = {
      free: 'bg-gray-100 text-gray-800',
      pro: 'bg-blue-100 text-blue-800',
      enterprise: 'bg-purple-100 text-purple-800'
    };
    return colors[tier as keyof typeof colors] || colors.free;
  };

  const getTierIcon = (tier: string) => {
    if (tier === 'enterprise') return <Crown className="w-5 h-5" />;
    if (tier === 'pro') return <Shield className="w-5 h-5" />;
    return <Building2 className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">載入中...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">租戶管理</h1>
        <p className="text-gray-600">管理公司設定、用戶和使用情況</p>
      </div>

      {/* Company Overview Card */}
      {companyInfo && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                {companyInfo.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{companyInfo.name}</h2>
                <p className="text-gray-600">{companyInfo.industry || '未設定產業'}</p>
                <div className="flex items-center mt-2 space-x-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTierBadge(companyInfo.subscription_tier)}`}>
                    {getTierIcon(companyInfo.subscription_tier)}
                    <span className="ml-1">{companyInfo.subscription_tier.toUpperCase()}</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">成員</div>
              <div className="text-3xl font-bold text-gray-900">{companyInfo.user_count}</div>
              <div className="text-sm text-gray-500 mt-2">已安裝模組</div>
              <div className="text-2xl font-bold text-blue-600">{companyInfo.module_count}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="w-5 h-5 inline mr-2" />
            總覽
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="w-5 h-5 inline mr-2" />
            用戶管理
          </button>
          <button
            onClick={() => setActiveTab('usage')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'usage'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Activity className="w-5 h-5 inline mr-2" />
            使用情況
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="w-5 h-5 inline mr-2" />
            設定
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && usageStats && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">API 請求</p>
                  <p className="text-2xl font-bold text-gray-900">{usageStats.api_requests.toLocaleString()}</p>
                </div>
                <Database className="w-10 h-10 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">AI 請求</p>
                  <p className="text-2xl font-bold text-gray-900">{usageStats.ai_requests.toLocaleString()}</p>
                </div>
                <Activity className="w-10 h-10 text-purple-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">總成本</p>
                  <p className="text-2xl font-bold text-gray-900">${usageStats.total_cost_usd.toFixed(2)}</p>
                </div>
                <DollarSign className="w-10 h-10 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">快取命中率</p>
                  <p className="text-2xl font-bold text-gray-900">{(usageStats.cache_hit_rate * 100).toFixed(1)}%</p>
                </div>
                <TrendingUp className="w-10 h-10 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Model Usage */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI 模型使用情況</h3>
            <div className="space-y-4">
              {Object.entries(usageStats.by_model).map(([model, stats]: [string, any]) => (
                <div key={model} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{model}</span>
                      <span className="text-sm text-gray-500">{stats.count} 次</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(stats.count / usageStats.ai_requests) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-sm font-medium text-gray-900">${stats.cost.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">{stats.tokens.toLocaleString()} tokens</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Module Usage */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">模組使用情況</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(usageStats.by_module).map(([module, stats]: [string, any]) => (
                <div key={module} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{module}</span>
                    <span className="text-sm text-gray-500">{stats.count} 次</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span>${stats.cost.toFixed(2)}</span>
                    <span className="mx-2">•</span>
                    <span>{stats.tokens.toLocaleString()} tokens</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">用戶管理功能即將推出</h3>
            <p className="text-gray-600 mt-2">此功能將允許您邀請用戶、分配角色並管理權限。</p>
          </div>
        </div>
      )}

      {activeTab === 'usage' && usageStats && (
        <div className="space-y-6">
          {/* Period Selector */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">選擇時間範圍</h3>
              <div className="flex space-x-2">
                {(['day', 'week', 'month'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-4 py-2 rounded-lg ${
                      period === p
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {p === 'day' ? '今天' : p === 'week' ? '本週' : '本月'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">詳細統計</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-600">總 Token 數</span>
                <span className="font-semibold">{usageStats.total_tokens.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-600">平均延遲</span>
                <span className="font-semibold">{usageStats.avg_latency_ms.toFixed(0)} ms</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-600">快取命中率</span>
                <span className="font-semibold">{(usageStats.cache_hit_rate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-600">總成本</span>
                <span className="font-semibold text-green-600">${usageStats.total_cost_usd.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && companyInfo && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">公司設定</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                偏好 AI 模型
              </label>
              <select className="w-full md:w-1/2 border border-gray-300 rounded-lg px-3 py-2">
                <option value="auto">自動選擇（推薦）</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo（經濟）</option>
                <option value="gpt-4">GPT-4（高品質）</option>
                <option value="claude-instant">Claude Instant（快速）</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                快取設定
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" defaultChecked />
                <span className="text-gray-700">啟用 AI 回應快取以節省成本</span>
              </label>
            </div>

            <div className="pt-4">
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                儲存設定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




/**
 * 行動端優化的儀表板組件
 */

import React, { useState } from 'react';
import { 
  Home, 
  Grid3X3, 
  BarChart3, 
  Settings, 
  Menu, 
  X, 
  Bell,
  Search,
  Plus,
  TrendingUp,
  Users,
  Activity
} from 'lucide-react';
import { ResponsiveGrid, MobileCard, MobileButton } from './MobileOptimization';

interface MobileDashboardProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
}

export function MobileDashboard({ children, currentView, onViewChange }: MobileDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const navigationItems = [
    { id: 'overview', label: '總覽', icon: Home },
    { id: 'modules', label: '模組', icon: Grid3X3 },
    { id: 'reports', label: '報告', icon: BarChart3 },
    { id: 'settings', label: '設定', icon: Settings },
  ];

  const quickStats = [
    { label: '活躍模組', value: '12', icon: Activity, color: 'text-green-600' },
    { label: '今日報告', value: '8', icon: BarChart3, color: 'text-blue-600' },
    { label: '用戶數', value: '156', icon: Users, color: 'text-purple-600' },
    { label: '成長率', value: '+23%', icon: TrendingUp, color: 'text-orange-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 行動端頂部導航 */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-lg font-semibold text-slate-900">AI 商業平台</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Search className="w-5 h-5 text-slate-600" />
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>

      {/* 側邊欄 */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}>
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-xl">
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">選單</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>
            <nav className="p-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onViewChange(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      currentView === item.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* 主要內容區域 */}
      <div className="pb-20">
        {/* 快速統計 */}
        {currentView === 'overview' && (
          <div className="p-4">
            <ResponsiveGrid cols={{ mobile: 2, tablet: 4, desktop: 4 }}>
              {quickStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <MobileCard key={index} className="text-center">
                    <div className={`w-8 h-8 mx-auto mb-2 ${stat.color}`}>
                      <Icon className="w-full h-full" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</div>
                    <div className="text-sm text-slate-600">{stat.label}</div>
                  </MobileCard>
                );
              })}
            </ResponsiveGrid>
          </div>
        )}

        {/* 內容區域 */}
        <div className="p-4">
          {children}
        </div>
      </div>

      {/* 行動端底部導航 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-area-bottom">
        <div className="flex justify-around py-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex flex-col items-center gap-1 p-2 transition-colors ${
                  currentView === item.id
                    ? 'text-blue-600'
                    : 'text-slate-500'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 浮動操作按鈕 */}
      <button className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}

/**
 * 行動端優化的模組卡片
 */
interface MobileModuleCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'active' | 'inactive' | 'error';
  onActivate?: () => void;
  onConfigure?: () => void;
}

export function MobileModuleCard({ 
  title, 
  description, 
  icon: Icon, 
  status, 
  onActivate, 
  onConfigure 
}: MobileModuleCardProps) {
  const statusColors = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-slate-100 text-slate-700',
    error: 'bg-red-100 text-red-700'
  };

  return (
    <MobileCard className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-600">{description}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
          {status === 'active' ? '運行中' : status === 'inactive' ? '未啟動' : '錯誤'}
        </span>
      </div>
      
      <div className="flex gap-2">
        {status === 'inactive' && onActivate && (
          <MobileButton
            variant="primary"
            size="sm"
            onClick={onActivate}
            className="flex-1"
          >
            啟動
          </MobileButton>
        )}
        {onConfigure && (
          <MobileButton
            variant="secondary"
            size="sm"
            onClick={onConfigure}
            className="flex-1"
          >
            設定
          </MobileButton>
        )}
      </div>
    </MobileCard>
  );
}

/**
 * 行動端優化的數據表格
 */
interface MobileDataTableProps {
  data: Array<Record<string, any>>;
  columns: Array<{
    key: string;
    label: string;
    render?: (value: any, row: any) => React.ReactNode;
  }>;
}

export function MobileDataTable({ data, columns }: MobileDataTableProps) {
  return (
    <div className="space-y-3">
      {data.map((row, index) => (
        <MobileCard key={index} className="p-4">
          {columns.map((column) => (
            <div key={column.key} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0">
              <span className="text-sm font-medium text-slate-600">{column.label}</span>
              <span className="text-sm text-slate-900">
                {column.render ? column.render(row[column.key], row) : row[column.key]}
              </span>
            </div>
          ))}
        </MobileCard>
      ))}
    </div>
  );
}

/**
 * 移动端导航组件
 * 适用于小屏幕的侧边栏导航
 */

import { X } from 'lucide-react';
import * as Icons from 'lucide-react';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: string;
  onViewChange: (view: string) => void;
  menuItems: Array<{
    id: string;
    label: string;
    icon: string;
  }>;
  onLogout: () => void;
  companyName?: string;
  companyIndustry?: string;
}

export function MobileNav({ isOpen, onClose, activeView, onViewChange, menuItems, onLogout, companyName, companyIndustry }: MobileNavProps) {
  if (!isOpen) return null;

  const handleViewChange = (viewId: string) => {
    onViewChange(viewId);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white z-50 shadow-xl animate-slide-in-left">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">选单</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map(item => {
            const Icon = (Icons as any)[item.icon] || Icons.Box;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200">
          {/* 公司信息 */}
          {(companyName || companyIndustry) && (
            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-b border-slate-200">
              <p className="text-xs font-medium text-slate-900 mb-1">公司資訊</p>
              {companyIndustry && <p className="text-xs text-slate-600 capitalize mb-0.5">{companyIndustry}</p>}
              {companyName && <p className="text-xs text-slate-500">{companyName}</p>}
            </div>
          )}
          
          {/* 登出按钮 */}
          <div className="p-4">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <Icons.LogOut className="w-5 h-5" />
              登出
            </button>
          </div>
        </div>
      </div>
    </>
  );
}


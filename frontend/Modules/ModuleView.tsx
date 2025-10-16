import React, { useState } from 'react';
import { ModuleStore } from './ModuleStore';
import { InstalledModules } from './InstalledModules';
import { Store, Box } from 'lucide-react';

export function ModulesView() {
  const [activeTab, setActiveTab] = useState<'store' | 'installed'>('store');
  const [installedFocusId, setInstalledFocusId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">AI 模組</h2>
        <p className="text-slate-600 mt-1">管理您的 AI 解決方案</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('store')}
          className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'store'
              ? 'text-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Store className="w-5 h-5" />
          模組商店
          {activeTab === 'store' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab('installed')}
          className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'installed'
              ? 'text-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Box className="w-5 h-5" />
          已安裝模組
          {activeTab === 'installed' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
          )}
        </button>
      </div>

      {activeTab === 'store' ? (
        <ModuleStore
          onInstalled={({ companyModuleId }) => {
            // 切換到已安裝分頁
            setInstalledFocusId(companyModuleId);
            setActiveTab('installed');
          }}
        />
      ) : (
        <InstalledModules />
      )}
    </div>
  );
}

import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useAuth } from '../Contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Power, Settings, Trash2, Play } from 'lucide-react';
import * as Icons from 'lucide-react';

interface InstalledModule {
  id: string;
  module_id: string;
  is_enabled: boolean;
  installed_at: string;
  module: {
    name: string;
    description: string;
    icon: string;
    category: string;
  };
}

export function InstalledModules() {
  const { company } = useAuth();
  const [modules, setModules] = useState<InstalledModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningModule, setRunningModule] = useState<string | null>(null);
  const ModuleRunner = lazy(() => import('./ModuleRunner').then(m => ({ default: m.ModuleRunner })));

  useEffect(() => {
    loadInstalledModules();
  }, [company?.id]);

  const loadInstalledModules = async () => {
    if (!company?.id) {
      console.log('❌ No company ID in InstalledModules');
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Loading installed modules for company:', company.id);
      
      const { data, error } = await supabase
        .from('company_modules')
        .select(`
          id,
          module_id,
          is_enabled,
          installed_at,
          module:ai_modules(name, description, icon, category)
        `)
        .eq('company_id', company.id)
        .order('installed_at', { ascending: false });

      console.log('✅ Installed modules loaded:', { count: data?.length || 0, error });

      if (error) throw error;

      setModules(data as any || []);
    } catch (error) {
      console.error('❌ Error loading installed modules:', error);
      setModules([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = async (moduleId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('company_modules')
        .update({ is_enabled: !currentStatus })
        .eq('id', moduleId);

      if (error) throw error;

      await loadInstalledModules();
    } catch (error) {
      console.error('Error toggling module:', error);
    }
  };

  const uninstallModule = async (moduleId: string) => {
    if (!confirm('確定要解除安裝此模組嗎？')) return;

    try {
      const { error } = await supabase
        .from('company_modules')
        .delete()
        .eq('id', moduleId);

      if (error) throw error;

      await loadInstalledModules();
    } catch (error) {
      console.error('Error uninstalling module:', error);
    }
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (Icons as any)[iconName.charAt(0).toUpperCase() + iconName.slice(1).replace(/-([a-z])/g, (_, char) => char.toUpperCase())];
    return Icon || Icons.Box;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
        <p className="text-slate-600">尚未安裝任何模組</p>
        <p className="text-sm text-slate-500 mt-2">請前往模組商店開始使用</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {runningModule && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          {(() => {
            const mod = modules.find(m => m.id === runningModule);
            if (!mod) return null;
            return (
              <Suspense fallback={<div className="p-4 text-slate-600">載入模組中...</div>}>
                <ModuleRunner moduleName={mod.module.name} onClose={() => setRunningModule(null)} />
              </Suspense>
            );
          })()}
        </div>
      )}
      {modules.map((item) => {
        const Icon = getIconComponent(item.module.icon);

        return (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  item.is_enabled
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                    : 'bg-slate-200'
                }`}>
                  <Icon className={`w-6 h-6 ${item.is_enabled ? 'text-white' : 'text-slate-500'}`} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{item.module.name}</h3>
                    {item.is_enabled && (
                      <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded">
                        啟用中
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{item.module.description}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    安裝於 {new Date(item.installed_at).toLocaleDateString('zh-TW')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRunningModule(item.id)}
                  className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  title="打開"
                >
                  <Play className="w-5 h-5" />
                </button>
                <button
                  onClick={() => toggleModule(item.id, item.is_enabled)}
                  className={`p-2 rounded-lg transition-colors ${
                    item.is_enabled
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title={item.is_enabled ? '停用' : '啟用'}
                >
                  <Power className="w-5 h-5" />
                </button>

                <button
                  className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                  title="設定"
                >
                  <Settings className="w-5 h-5" />
                </button>

                <button
                  onClick={() => uninstallModule(item.id)}
                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                  title="解除安裝"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

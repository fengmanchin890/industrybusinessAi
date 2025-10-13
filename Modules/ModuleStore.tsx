import React, { useEffect, useState } from 'react';
import { useAuth } from '../Contexts/AuthContext';
import { supabase, Database } from '../lib/supabase';
import { Download, Check, Lock, Sparkles } from 'lucide-react';
import * as Icons from 'lucide-react';

type AIModule = Database['public']['Tables']['ai_modules']['Row'];
type CompanyModule = Database['public']['Tables']['company_modules']['Row'];

interface ModuleWithStatus extends AIModule {
  isInstalled: boolean;
  installationId?: string;
}

const categoryLabels: Record<string, string> = {
  manufacturing: '製造業',
  'f&b': '餐飲業',
  retail: '零售/電商',
  logistics: '物流/倉儲',
  healthcare: '醫療/健康',
  finance: '金融/保險',
  government: '政府',
  education: '教育',
  sme: '中小企業',
};

const tierLevels = {
  basic: 1,
  pro: 2,
  enterprise: 3,
};

export function ModuleStore({
  onInstalled,
}: {
  onInstalled?: (payload: { moduleId: string; companyModuleId: string }) => void;
}) {
  const { company } = useAuth();
  const [modules, setModules] = useState<ModuleWithStatus[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState<string | null>(null);

  useEffect(() => {
    loadModules();
  }, [company?.id]);

  // 當公司資訊載入後，預設切換到公司的產業分類（例如: f&b）
  useEffect(() => {
    if (company?.industry) {
      setSelectedCategory(company.industry);
    }
  }, [company?.industry]);

  const loadModules = async () => {
    if (!company?.id) {
      console.log('❌ No company ID in ModuleStore');
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Loading modules for company:', company.id, 'Industry:', company.industry);
      
      const [modulesData, installedData] = await Promise.all([
        supabase.from('ai_modules').select('*').eq('is_active', true).order('category'),
        supabase.from('company_modules').select('*').eq('company_id', company.id),
      ]);

      console.log('✅ Modules loaded:', {
        total: modulesData.data?.length || 0,
        error: modulesData.error,
        installed: installedData.data?.length || 0
      });

      if (modulesData.error) throw modulesData.error;
      if (installedData.error) throw installedData.error;

      const installedMap = new Map(
        installedData.data.map((cm) => [cm.module_id, cm])
      );

      const modulesWithStatus: ModuleWithStatus[] = (modulesData.data || []).map((module) => {
        const installation = installedMap.get(module.id);
        return {
          ...module,
          isInstalled: !!installation,
          installationId: installation?.id,
        };
      });

      setModules(modulesWithStatus);
      // 若公司為 f&b 且行銷助理未安裝，自動安裝一次（預設安裝）
      try {
        if (company.industry === 'f&b') {
          const marketingModule = modulesWithStatus.find(m=>m.name==='AI 行銷助理');
          if (marketingModule && !marketingModule.isInstalled) {
            const { error } = await supabase.from('company_modules').insert({
              company_id: company.id,
              module_id: marketingModule.id,
              config: {},
              is_enabled: true,
            });
            if (!error) {
              marketingModule.isInstalled = true;
            }
          }
        }
      } catch (_) {}
    } catch (error) {
      console.error('❌ Error loading modules:', error);
      setModules([]);
    } finally {
      setLoading(false);
    }
  };

  const canInstallModule = (module: AIModule) => {
    if (!company) return false;
    const moduleTierLevel = tierLevels[module.pricing_tier as keyof typeof tierLevels];
    const companyTierLevel = tierLevels[company.subscription_tier as keyof typeof tierLevels];
    return companyTierLevel >= moduleTierLevel;
  };

  const handleInstall = async (moduleId: string) => {
    if (!company?.id) return;

    setInstalling(moduleId);
    try {
      const { data, error } = await supabase
        .from('company_modules')
        .insert({
          company_id: company.id,
          module_id: moduleId,
          config: {},
          is_enabled: true,
        })
        .select()
        .single();

      if (error) throw error;

      // 依模組類別執行公司初始化（例如餐飲預設菜單）
      try {
        const installedModule = modules.find(m => m.id === moduleId);
        if (installedModule?.category === 'f&b') {
          await supabase.rpc('install_fnb_defaults', { p_company: company.id });
        }
      } catch (e) {
        // 初始化失敗不阻擋流程，僅記錄
        console.warn('Module post-install init failed:', e);
      }

      await loadModules();

      // 安裝完成後自動跳轉到「已安裝」並可定位已安裝項目
      if (onInstalled && data?.id) {
        onInstalled({ moduleId, companyModuleId: data.id });
      }
    } catch (error) {
      console.error('Error installing module:', error);
      alert('安裝模組失敗，請重試。');
    } finally {
      setInstalling(null);
    }
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (Icons as any)[iconName.charAt(0).toUpperCase() + iconName.slice(1).replace(/-([a-z])/g, (_, char) => char.toUpperCase())];
    return Icon || Icons.Box;
  };

  const categories = ['all', ...new Set(modules.map((m) => m.category))];

  const filteredModules = selectedCategory === 'all'
    ? modules
    : modules.filter((m) => m.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">AI 模組商店</h2>
        <p className="text-slate-600 mt-1">瀏覽並安裝產業專屬的 AI 解決方案</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat === 'all' ? '全部模組' : categoryLabels[cat] || cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.map((module) => {
          const Icon = getIconComponent(module.icon);
          const canInstall = canInstallModule(module);
          const features = Array.isArray(module.features) ? module.features : [];

          return (
            <div
              key={module.id}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded capitalize">
                    {module.pricing_tier}
                  </span>
                  {module.isInstalled && (
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-2">{module.name}</h3>
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">{module.description}</p>

              <div className="space-y-2 mb-4">
                {features.slice(0, 3).map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>

              {module.isInstalled ? (
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-2 bg-green-50 text-green-700 py-2.5 px-4 rounded-lg font-medium cursor-not-allowed"
                >
                  <Check className="w-5 h-5" />
                  已安裝
                </button>
              ) : canInstall ? (
                <button
                  onClick={() => handleInstall(module.id)}
                  disabled={installing === module.id}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {installing === module.id ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      安裝中...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      安裝模組
                    </>
                  )}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-500 py-2.5 px-4 rounded-lg font-medium cursor-not-allowed"
                >
                  <Lock className="w-5 h-5" />
                  需要升級
                </button>
              )}
            </div>
          );
        })}
      </div>

      {filteredModules.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-600">此類別中沒有找到模組</p>
          <p className="text-sm text-slate-500 mt-2">請稍後再試或選擇其他類別</p>
        </div>
      )}
    </div>
  );
}

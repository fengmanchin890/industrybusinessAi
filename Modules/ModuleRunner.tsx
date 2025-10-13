import React from 'react';
import { useAuth } from '../Contexts/AuthContext';
import { ModuleContext } from './ModuleSDK';
import { PurchaseForecastView } from './Industry/FoodBeverage/PurchaseForecast';
import { VoiceOrderingModule } from './Industry/FoodBeverage/VoiceOrdering';
import { MarketingAssistant } from './Industry/SME/MarketingAssistant';

export function ModuleRunner({ moduleName, onClose }: { moduleName: string; onClose: () => void }) {
  const { user, company } = useAuth();

  if (!user || !company?.id) {
    return <div className="p-6 text-slate-600">尚未載入使用者或公司資訊</div>;
  }

  const context: ModuleContext = {
    companyId: company.id,
    userId: user.id,
    moduleId: moduleName, // 使用名稱作為臨時 moduleId 標識
    config: { enabled: true, settings: {} },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900">{moduleName}</h3>
        <button onClick={onClose} className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded">返回</button>
      </div>

      {/* 依模組名稱渲染對應內容（F&B 先支援兩個模組）*/}
      {moduleName.includes('進貨預測') ? (
        <PurchaseForecastView context={context} />
      ) : moduleName.includes('點餐助理') || moduleName.includes('点餐助理') ? (
        <VoiceOrderingModule context={context} />
      ) : moduleName.includes('行銷') || moduleName.includes('行销') ? (
        <>{new MarketingAssistant().render(context)}</>
      ) : (
        <div className="p-6 bg-white rounded-xl border">此模組尚未提供視圖</div>
      )}
    </div>
  );
}



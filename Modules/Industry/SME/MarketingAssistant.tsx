import React, { useMemo, useState } from 'react';
import { ModuleBase, ModuleContext } from '../../ModuleSDK';
import { useAuth } from '../../../Contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

function MarketingAssistantView({ context }: { context: ModuleContext }) {
  const { company } = useAuth();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState('');

  const loadBrand = async () => {
    const { data } = await supabase
      .from('marketing_settings')
      .select('*')
      .eq('company_id', company!.id)
      .maybeSingle();
    return data || {};
  };

  const generate = async (type: 'new'|'offer'|'story') => {
    setLoading(true);
    try {
      const brand = await loadBrand();
      const name = company?.name || '我的餐廳';
      let content = '';
      if (type === 'new') {
        content = `【新品上市】\n${name} 推出全新口味！嚴選食材，現點現做。歡迎到店嚐鮮～\n更多資訊：${brand.website || ''}`;
      } else if (type === 'offer') {
        content = `【本日優惠】\n${name} 精選餐點限時優惠，數量有限售完為止！\n立即關注我們：${brand.facebook || ''}`;
      } else {
        content = `【品牌故事】\n${name} 堅持每天手作，給你最安心的好味道。謝謝每位顧客的支持！`;
      }
      setPreview(content);
      await supabase.from('reports').insert({
        company_id: context.companyId,
        module_id: null,
        title: `社群貼文 - ${type}`,
        content: content,
        report_type: 'custom',
      });
      alert('已建立貼文草稿（寫入 reports）');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">AI 行銷助理</h3>
        <p className="text-slate-600 mt-1">讀取品牌素材，產生社群貼文草稿</p>
      </div>
      <div className="bg-white rounded-xl border p-6 space-y-3">
        <div className="flex gap-2 flex-wrap">
          <button disabled={loading} onClick={() => generate('new')} className="px-3 py-2 bg-blue-600 text-white rounded">新品上市</button>
          <button disabled={loading} onClick={() => generate('offer')} className="px-3 py-2 bg-emerald-600 text-white rounded">今日優惠</button>
          <button disabled={loading} onClick={() => generate('story')} className="px-3 py-2 bg-amber-600 text-white rounded">品牌故事</button>
        </div>
        {preview && (
          <div className="mt-3 p-3 bg-slate-50 rounded border text-sm whitespace-pre-wrap">{preview}</div>
        )}
      </div>
    </div>
  );
}

export class MarketingAssistant extends ModuleBase {
  constructor() {
    super(
      {
        id: 'marketing-assistant',
        name: 'AI 行銷助理',
        version: '1.0.0',
        category: 'f&b',
        industry: ['f&b','retail','sme'],
        description: '讀取品牌素材，自動產生社群貼文草稿',
        icon: 'Megaphone',
        author: 'AI Business Platform',
        pricingTier: 'basic',
        features: ['品牌素材','貼文模板','匯出報告']
      },
      {
        canGenerateReports: true,
        canSendAlerts: false,
        canProcessData: true,
        canIntegrateExternal: false,
        requiresDataConnection: false,
      }
    );
  }

  render(context: ModuleContext) {
    return <MarketingAssistantView context={context} />;
  }
}



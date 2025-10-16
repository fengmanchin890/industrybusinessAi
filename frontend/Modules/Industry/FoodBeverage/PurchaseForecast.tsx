import React, { useEffect, useMemo, useState } from 'react';
import { ModuleBase, ModuleContext } from '../../ModuleSDK';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../Contexts/AuthContext';

type SalesRow = { sold_at: string; item_name: string; quantity: number };

function movingAverage(series: number[], window = 7) {
  if (series.length < window) return [];
  const out: number[] = [];
  for (let i = 0; i <= series.length - window; i++) {
    const slice = series.slice(i, i + window);
    out.push(Math.round(slice.reduce((a, b) => a + b, 0) / window));
  }
  return out;
}

export function PurchaseForecastView({ context }: { context: ModuleContext }) {
  const { company } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<SalesRow[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!company?.id) return;
      setLoading(true);
      const { data } = await supabase
        .from('sales_transactions')
        .select('sold_at,item_name,quantity')
        .eq('company_id', company.id)
        .order('sold_at');
      setSales((data as any) || []);
      setLoading(false);
    };
    load();
  }, [company?.id]);

  const items = useMemo(() => Array.from(new Set(sales.map((s) => s.item_name))), [sales]);
  useEffect(() => {
    if (!selectedItem && items.length) setSelectedItem(items[0]);
  }, [items, selectedItem]);

  const series = useMemo(() => {
    if (!selectedItem) return [] as { date: string; qty: number }[];
    const map = new Map<string, number>();
    for (const s of sales) {
      if (s.item_name !== selectedItem) continue;
      map.set(s.sold_at, (map.get(s.sold_at) || 0) + Number(s.quantity || 0));
    }
    return Array.from(map.entries()).map(([date, qty]) => ({ date, qty }));
  }, [sales, selectedItem]);

  const ma = useMemo(() => movingAverage(series.map((s) => s.qty), 7), [series]);
  const nextWeekSuggestion = useMemo(() => {
    if (ma.length === 0) return 0;
    // 簡單做法：取最近移動平均當作下週建議進貨量
    return ma[ma.length - 1];
  }, [ma]);

  // 週期性因子：不同星期的平均銷售比值
  const weekdayFactor = useMemo(() => {
    if (!selectedItem) return { factors: [] as { dow: number; avg: number }[], seasonal: 1 };
    const buckets = Array.from({ length: 7 }, () => ({ sum: 0, cnt: 0 }));
    for (const s of sales) {
      if (s.item_name !== selectedItem) continue;
      const d = new Date(s.sold_at);
      const dow = d.getDay();
      buckets[dow].sum += Number(s.quantity || 0);
      buckets[dow].cnt += 1;
    }
    const avgs = buckets.map((b, i) => ({ dow: i, avg: b.cnt ? b.sum / b.cnt : 0 }));
    const overall = avgs.reduce((a, b) => a + b.avg, 0) / 7 || 1;
    const seasonal = overall ? (avgs[new Date().getDay()].avg || overall) / overall : 1; // 以今天的星期當例
    return { factors: avgs, seasonal };
  }, [sales, selectedItem]);

  const adjustedSuggestion = useMemo(() => {
    return Math.max(0, Math.round(nextWeekSuggestion * (weekdayFactor.seasonal || 1)));
  }, [nextWeekSuggestion, weekdayFactor]);

  const chart = useMemo(() => {
    const width = 640;
    const height = 220;
    const padding = 24;
    const data = series.slice(-30);
    if (data.length === 0) return null;
    const qtys = data.map((d) => d.qty);
    const maxY = Math.max(...qtys, nextWeekSuggestion * 1.2, 1);
    const minY = 0;
    const scaleX = (i: number) => padding + (i * (width - padding * 2)) / Math.max(1, data.length - 1);
    const scaleY = (v: number) => height - padding - ((v - minY) * (height - padding * 2)) / (maxY - minY);
    const points = data.map((d, i) => `${scaleX(i)},${scaleY(d.qty)}`).join(' ');
    // 對齊的 MA（只畫最後 30 天範圍內的部分）
    const maSeries = movingAverage(series.map((s) => s.qty), 7);
    const startIndex = series.length - maSeries.length; // ma 起始對齊
    const maPoints: string[] = [];
    for (let i = 0; i < data.length; i++) {
      const globalIndex = series.length - data.length + i;
      const maIdx = globalIndex - startIndex;
      if (maIdx >= 0 && maIdx < maSeries.length) {
        maPoints.push(`${scaleX(i)},${scaleY(maSeries[maIdx])}`);
      }
    }
    return (
      <svg width={width} height={height} className="w-full">
        <rect x={0} y={0} width={width} height={height} fill="#fff" />
        {/* grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line key={t} x1={padding} x2={width - padding} y1={padding + t * (height - padding * 2)} y2={padding + t * (height - padding * 2)} stroke="#e5e7eb" />
        ))}
        {/* sales line */}
        <polyline points={points} fill="none" stroke="#2563eb" strokeWidth={2} />
        {/* MA line */}
        {maPoints.length > 1 && <polyline points={maPoints.join(' ')} fill="none" stroke="#10b981" strokeWidth={2} />}
      </svg>
    );
  }, [series, nextWeekSuggestion]);

  const createReport = async () => {
    if (!company?.id || !selectedItem) return;
    try {
      setCreating(true);
      const content = {
        item: selectedItem,
        recentDays: series.slice(-7),
        movingAverage: nextWeekSuggestion,
        seasonalFactor: Number(weekdayFactor.seasonal.toFixed(2)),
        adjusted: adjustedSuggestion,
        suggestionList: [
          { action: '維持安全庫存', qty: adjustedSuggestion, reason: 'MA7 與季節因子' },
          { action: '觀察週末加購', qty: Math.ceil(adjustedSuggestion * 1.2), reason: '週末提升 20%' }
        ]
      };
      await supabase.from('reports').insert({
        company_id: company.id,
        module_id: null,
        title: `進貨建議 - ${selectedItem}`,
        content: JSON.stringify(content),
        report_type: 'custom',
      });
      alert('已生成報表');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="p-6 text-slate-600">銷售資料載入中...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">AI 進貨預測</h3>
        <p className="text-slate-600 mt-1">根據歷史銷售，計算移動平均作為未來建議進貨量</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <label className="text-sm text-slate-600">選擇商品</label>
        <select
          className="mt-2 border rounded px-3 py-2"
          value={selectedItem}
          onChange={(e) => setSelectedItem(e.target.value)}
        >
          {items.map((it) => (
            <option key={it} value={it}>
              {it}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h4 className="text-lg font-bold mb-2">近期期銷售</h4>
        {series.length === 0 ? (
          <div className="text-slate-500">尚無資料，請先導入銷售 CSV</div>
        ) : (
          <div>
            {chart}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h4 className="text-lg font-bold mb-2">建議</h4>
        {ma.length === 0 ? (
          <div className="text-slate-500">資料不足（需至少 7 天資料）</div>
        ) : (
          <div className="space-y-2 text-slate-800">
            <div>下週建議進貨量（MA7）：<span className="font-bold">{nextWeekSuggestion}</span></div>
            <div>季節/週期因子（以今日星期估算）：<span className="font-bold">{weekdayFactor.seasonal.toFixed(2)}</span></div>
            <div>調整後建議：<span className="font-bold text-blue-600">{adjustedSuggestion}</span></div>
            <button onClick={createReport} disabled={creating} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">
              {creating ? '產生中…' : '產生報表'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export class PurchaseForecast extends ModuleBase {
  constructor() {
    super(
      {
        id: 'purchase-forecast',
        name: 'AI 進貨預測',
        version: '1.0.0',
        category: 'f&b',
        industry: ['f&b'],
        description: '依據歷史銷售走勢，給出未來進貨建議',
        icon: 'TrendingUp',
        author: 'AI Business Platform',
        pricingTier: 'pro',
        features: ['移動平均預測', '銷售趨勢粗估', '建議進貨量'],
      },
      {
        canGenerateReports: true,
        canSendAlerts: false,
        canProcessData: true,
        canIntegrateExternal: true,
        requiresDataConnection: false,
      }
    );
  }

  render(context: ModuleContext) {
    return <PurchaseForecastView context={context} />;
  }
}



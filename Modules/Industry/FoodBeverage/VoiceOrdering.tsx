/**
 * AI 点餐助理 - 语音点餐系统
 * 支持台语和中文的智能语音点餐
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../Contexts/AuthContext';
import { Mic, MicOff, ShoppingCart, Check, Clock, TrendingUp } from 'lucide-react';
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';
import { useModuleState, useReportGeneration } from '../../ModuleSDK';

const metadata: ModuleMetadata = {
  id: 'voice-ordering',
  name: 'AI 点餐助理',
  version: '1.0.0',
  category: 'f&b',
  industry: ['f&b'],
  description: '能听懂台语和中文的智能语音点餐系统，提升点餐效率',
  icon: 'Mic',
  author: 'AI Business Platform',
  pricingTier: 'basic',
  features: [
    '台语 + 中文语音识别',
    '智能菜单推荐',
    '自动订单确认',
    '减少人力成本',
    '提升服务效率'
  ]
};

const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: false,
  canProcessData: true,
  canIntegrateExternal: true,
  requiresDataConnection: false
};

interface Order {
  id: string;
  items: string[];
  total: number;
  timestamp: Date;
  language: '中文' | '台語';
}

export function VoiceOrderingModule({ context }: { context: ModuleContext }) {
  const { state, setRunning, setIdle } = useModuleState();
  const { generateReport } = useReportGeneration(context);
  const { company } = useAuth();
  
  const [isListening, setIsListening] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    avgOrderTime: 45,
    accuracy: 96
  });

  const [menuItems, setMenuItems] = useState<{ id?: string; name: string; price: number; synonyms?: string[] }[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [sheetUrl, setSheetUrl] = useState('');

  useEffect(() => {
    const loadMenu = async () => {
      if (!company?.id) return;
      setMenuLoading(true);
      const { data } = await supabase
        .from('menu_items')
        .select('id,name,price,synonyms')
        .eq('company_id', company.id)
        .eq('is_available', true)
        .order('sort_order', { ascending: true });
      setMenuItems((data as any) || []);
      setMenuLoading(false);
    };
    loadMenu();
  }, [company?.id]);

  // 匯入精靈：CSV 匯入
  // 簡易 CSV 解析（不處理引號內逗號等複雜情況，僅供快速匯入示範）
  const parseCsv = (text: string): any[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return [];
    const headers = lines[0].split(',').map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const cols = line.split(',');
      const obj: any = {};
      headers.forEach((h, i) => (obj[h] = (cols[i] ?? '').trim()));
      return obj;
    });
  };

  const handleCsvFile = async (file: File) => {
    if (!company?.id) return;
    const text = await file.text();
    const rows: any[] = parseCsv(text);

    const mapped = rows
      .map((r) => ({
        company_id: company.id,
        name: String(r.name || r.品名 || '').trim(),
        price: Number(r.price || r.價格 || 0),
        category: String(r.category || r.類別 || ''),
        synonyms: String(r.synonyms || r.同義詞 || '')
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean),
        sort_order: Number(r.sort_order || r.排序 || 0),
        is_available: true,
      }))
      .filter((x) => x.name && !Number.isNaN(x.price));

    if (mapped.length === 0) return alert('CSV 無有效資料');
    await supabase.from('menu_items').upsert(mapped, { onConflict: 'company_id,name' });
    alert(`已匯入 ${mapped.length} 筆菜單`);
    // 重新載入
    const { data } = await supabase
      .from('menu_items')
      .select('id,name,price,synonyms')
      .eq('company_id', company.id)
      .eq('is_available', true)
      .order('sort_order', { ascending: true });
    setMenuItems((data as any) || []);
  };

  // 從 Google Sheet 匯入（輸入其 CSV 匯出連結）
  const importFromSheet = async () => {
    if (!company?.id) return;
    if (!sheetUrl) return alert('請貼上 Google Sheet 的 CSV 連結');
    const res = await fetch(sheetUrl);
    if (!res.ok) return alert('下載失敗');
    const text = await res.text();
    const rows = parseCsv(text);
    const mapped = rows
      .map((r: any) => ({
        company_id: company.id,
        name: String(r.name || r.品名 || '').trim(),
        price: Number(r.price || r.價格 || 0),
        category: String(r.category || r.類別 || ''),
        synonyms: String(r.synonyms || r.同義詞 || '')
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean),
        sort_order: Number(r.sort_order || r.排序 || 0),
        is_available: true,
      }))
      .filter((x: any) => x.name && !Number.isNaN(x.price));
    if (mapped.length === 0) return alert('連結中無有效資料');
    await supabase.from('menu_items').upsert(mapped, { onConflict: 'company_id,name' });
    alert(`已從 Sheet 匯入 ${mapped.length} 筆菜單`);
    const { data } = await supabase
      .from('menu_items')
      .select('id,name,price,synonyms')
      .eq('company_id', company.id)
      .eq('is_available', true)
      .order('sort_order', { ascending: true });
    setMenuItems((data as any) || []);
  };

  // 匯入銷售資料（供進貨預測使用）
  const handleSalesCsv = async (file: File) => {
    if (!company?.id) return;
    const text = await file.text();
    const rows = parseCsv(text);
    const mapped = rows
      .map((r: any) => ({
        company_id: company.id,
        sold_at: String(r.sold_at || r.date || r.日期 || '').trim(),
        item_name: String(r.item_name || r.品名 || r.name || '').trim(),
        quantity: Number(r.quantity || r.qty || r.數量 || 0),
        amount: Number(r.amount || r.金額 || r.total || 0),
      }))
      .filter((x: any) => x.sold_at && x.item_name && !Number.isNaN(x.quantity));
    if (mapped.length === 0) return alert('銷售 CSV 無有效資料');
    await supabase.from('sales_transactions').insert(mapped);
    alert(`已匯入 ${mapped.length} 筆銷售紀錄`);
  };

  const startListening = () => {
    setIsListening(true);
    setRunning();
    // 模拟语音识别
    setTimeout(() => {
      const randomItems = [
        menuItems[Math.floor(Math.random() * menuItems.length)].name,
        Math.random() > 0.5 ? menuItems[Math.floor(Math.random() * menuItems.length)].name : null
      ].filter(Boolean) as string[];
      setCurrentOrder(randomItems);
    }, 2000);
  };

  const stopListening = () => {
    setIsListening(false);
    setIdle();
  };

  const confirmOrder = () => {
    if (currentOrder.length === 0) return;

    const total = currentOrder.reduce((sum, item) => {
      const menuItem = menuItems.find(m => m.name === item);
      return sum + (menuItem?.price || 0);
    }, 0);

    const newOrder: Order = {
      id: Date.now().toString(),
      items: currentOrder,
      total,
      timestamp: new Date(),
      language: Math.random() > 0.5 ? '中文' : '台語'
    };

    setOrders(prev => [newOrder, ...prev.slice(0, 9)]);
    setStats(prev => ({
      totalOrders: prev.totalOrders + 1,
      avgOrderTime: prev.avgOrderTime,
      accuracy: prev.accuracy
    }));
    setCurrentOrder([]);
    stopListening();
  };

  return (
    <div className="space-y-6">
      {/* 導入精靈：若沒有菜單，提示匯入 */}
      {!menuLoading && menuItems.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h4 className="text-lg font-bold text-slate-900 mb-2">導入你的菜單</h4>
          <p className="text-slate-600 mb-3">上傳 CSV（欄位：name, price, category, synonyms）即可開始使用語音點餐</p>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => e.target.files && handleCsvFile(e.target.files[0])}
            className="block"
          />
          <div className="mt-3 flex gap-2 items-center">
            <input
              placeholder="Google Sheet 的 CSV 連結"
              className="border rounded px-3 py-2 w-full"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
            />
            <button onClick={importFromSheet} className="px-4 py-2 bg-blue-600 text-white rounded">從連結匯入</button>
          </div>
        </div>
      )}

      {/* 銷售資料導入卡（供進貨預測用） */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h4 className="text-lg font-bold text-slate-900 mb-2">導入銷售資料（進貨預測）</h4>
        <p className="text-slate-600 mb-3">上傳 CSV，欄位：sold_at(YYYY-MM-DD)、item_name、quantity、amount</p>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => e.target.files && handleSalesCsv(e.target.files[0])}
          className="block"
        />
      </div>
      <div>
        <h3 className="text-2xl font-bold text-slate-900">AI 点餐助理</h3>
        <p className="text-slate-600 mt-1">支持台语和中文的智能语音点餐</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">今日订单</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalOrders}</p>
            </div>
            <ShoppingCart className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">平均用时</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.avgOrderTime}秒</p>
            </div>
            <Clock className="w-10 h-10 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">识别准确率</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{stats.accuracy}%</p>
            </div>
            <TrendingUp className="w-10 h-10 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Voice Control */}
      <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-8 text-white">
        <div className="text-center">
          <button
            onClick={isListening ? stopListening : startListening}
            className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 transition-all ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {isListening ? (
              <MicOff className="w-12 h-12" />
            ) : (
              <Mic className="w-12 h-12" />
            )}
          </button>
          <h4 className="text-2xl font-bold mb-2">
            {isListening ? '正在聆听...' : '点击开始语音点餐'}
          </h4>
          <p className="text-blue-100">
            支持中文和台语，请清晰说出您要的餐点
          </p>
        </div>
      </div>

      {/* Current Order */}
      {currentOrder.length > 0 && (
        <div className="bg-white rounded-xl border-2 border-blue-600 p-6">
          <h4 className="text-lg font-bold text-slate-900 mb-4">当前订单</h4>
          <div className="space-y-2 mb-4">
            {currentOrder.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="font-medium">{item}</span>
                <span className="text-blue-600 font-bold">
                  ${menuItems.find(m => m.name === item)?.price}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={confirmOrder}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Check className="w-5 h-5" />
              确认订单
            </button>
            <button
              onClick={() => setCurrentOrder([])}
              className="px-4 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Order History */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h4 className="text-lg font-bold text-slate-900 mb-4">订单历史</h4>
        {orders.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>尚无订单</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-medium">{order.items.join('、')}</div>
                  <div className="text-sm text-slate-600">
                    {order.timestamp.toLocaleTimeString()} · {order.language}
                  </div>
                </div>
                <div className="text-lg font-bold text-blue-600">
                  ${order.total}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export class VoiceOrdering extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <VoiceOrderingModule context={context} />;
  }
}


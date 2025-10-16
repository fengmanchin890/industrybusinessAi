import React from 'react';
import { useAuth } from '../Contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Building2, User, CreditCard, Database, Upload, FileSpreadsheet, Link as LinkIcon } from 'lucide-react';
import { useState } from 'react';
import ReactDOM from 'react-dom';

export function SettingsView() {
  const { profile, company } = useAuth();
  const isAdmin = profile?.role === 'admin';

  // 匯入對話框狀態
  const [menuImportOpen, setMenuImportOpen] = useState(false);
  const [salesImportOpen, setSalesImportOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [datasetSelectorOpen, setDatasetSelectorOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<'menu' | 'sales' | ''>('');
  // MES / ERP 連接對話框
  const [erpOpen, setErpOpen] = useState(false);
  const [erpName, setErpName] = useState('我的 ERP');
  const [erpSystem, setErpSystem] = useState<'generic' | 'odoo' | 'netsuite'>('generic');
  const [erpBaseUrl, setErpBaseUrl] = useState('');
  const [erpToken, setErpToken] = useState('');
  const [savingErp, setSavingErp] = useState(false);

  // POS 連接對話框
  const [posOpen, setPosOpen] = useState(false);
  const [posProvider, setPosProvider] = useState<'generic' | 'linepos' | 'shopify' | 'shopee'>('generic');
  const [posBaseUrl, setPosBaseUrl] = useState('');
  const [posApiKey, setPosApiKey] = useState('');
  const [posStoreId, setPosStoreId] = useState('');
  const [savingPos, setSavingPos] = useState(false);
  // 測試同步
  const [syncing, setSyncing] = useState<'menu'|'sales'|''>('');

  // 品牌資產設定
  const [brandOpen, setBrandOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [website, setWebsite] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [line, setLine] = useState('');
  const [savingBrand, setSavingBrand] = useState(false);

  // 社群通路金鑰（channel_tokens）
  const [ch, setCh] = useState<'facebook'|'instagram'|'line'>('line');
  const [token, setToken] = useState('');
  const [pageId, setPageId] = useState('');
  const saveToken = async () => {
    if (!company?.id) return;
    const { data: exists } = await supabase
      .from('channel_tokens')
      .select('id')
      .eq('company_id', company.id)
      .eq('channel', ch)
      .maybeSingle();

    const payload: any = { company_id: company.id, channel: ch, access_token: token, page_id: pageId || null };
    const req = exists
      ? supabase.from('channel_tokens').update(payload).eq('id', exists.id)
      : supabase.from('channel_tokens').insert(payload);
    const { error } = await req;
    if (error) { alert('儲存失敗：' + error.message); return; }
    alert('已儲存通路金鑰');
  };

  // 簡易 CSV 解析（與 VoiceOrdering 共用邏輯）
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

  const importMenuCsv = async (file: File) => {
    if (!company?.id) return;
    setImporting(true);
    try {
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
    } finally {
      setImporting(false);
    }
  };

  const importMenuFromSheet = async () => {
    if (!company?.id) return;
    if (!sheetUrl) return alert('請貼上 Google Sheet 的 CSV 連結');
    setImporting(true);
    try {
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
    } finally {
      setImporting(false);
    }
  };

  const importSalesCsv = async (file: File) => {
    if (!company?.id) return;
    setImporting(true);
    try {
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
    } finally {
      setImporting(false);
    }
  };

  // 統一用途定義
  const DATASETS: { key: 'menu'|'sales'; label: string; allowed: boolean }[] = [
    { key: 'menu', label: '菜單（menu_items）', allowed: isAdmin || profile?.role === 'operator' },
    { key: 'sales', label: '銷售（sales_transactions）', allowed: isAdmin || profile?.role === 'operator' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">設定</h2>
        <p className="text-slate-600 mt-1">管理您的帳戶與公司設定</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">公司資訊</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-600 uppercase">公司名稱</label>
              <p className="text-slate-900 font-medium mt-1">{company?.name}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 uppercase">產業類別</label>
              <p className="text-slate-900 font-medium mt-1 capitalize">{company?.industry}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 uppercase">員工人數</label>
              <p className="text-slate-900 font-medium mt-1">{(company as any)?.employee_count}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">使用者資料</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-600 uppercase">姓名</label>
              <p className="text-slate-900 font-medium mt-1">{profile?.full_name}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 uppercase">電子郵件</label>
              <p className="text-slate-900 font-medium mt-1">{profile?.email}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 uppercase">角色</label>
              <p className="text-slate-900 font-medium mt-1 capitalize">{profile?.role}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">訂閱方案</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600 uppercase">目前方案</label>
              <p className="text-slate-900 font-medium mt-1 capitalize text-2xl">
                {company?.subscription_tier}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-slate-600">可用方案：</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${company?.subscription_tier === 'basic' ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
                  <span className="font-medium">Basic</span>
                  <span className="text-slate-600">- 基本 AI 模組</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${company?.subscription_tier === 'pro' ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
                  <span className="font-medium">Pro</span>
                  <span className="text-slate-600">- 進階功能與分析</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${company?.subscription_tier === 'enterprise' ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
                  <span className="font-medium">Enterprise</span>
                  <span className="text-slate-600">- 全部模組與客製方案</span>
                </div>
              </div>
            </div>

            <button className="w-full bg-amber-600 text-white py-2.5 px-4 rounded-lg hover:bg-amber-700 transition-colors font-medium">
              升級方案
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-slate-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">資料連接</h3>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              連接您的資料來源以啟用 AI 分析：
            </p>

            {/* 社群通路金鑰 */}
            <div className="p-3 bg-white rounded border">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-slate-700">社群通路金鑰</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select className="border px-2 py-1 rounded" value={ch} onChange={e=>setCh(e.target.value as any)}>
                  <option value="line">LINE Notify</option>
                  <option value="facebook">Facebook Page</option>
                  <option value="instagram">Instagram（預留）</option>
                </select>
                <input className="border px-2 py-1 rounded w-64" placeholder="Access Token" value={token} onChange={e=>setToken(e.target.value)} />
                <input className="border px-2 py-1 rounded w-64" placeholder="Page ID（FB 需填）" value={pageId} onChange={e=>setPageId(e.target.value)} />
                <button onClick={saveToken} className="px-3 py-1 bg-blue-600 text-white rounded">儲存</button>
              </div>
              <p className="text-xs text-slate-500 mt-2">LINE 請貼 Notify Token；Facebook 請貼粉專長效 Token，並填 Page ID。</p>
              {/* 顯示已儲存的金鑰（遮罩） */}
              <SavedTokens companyId={company?.id} />
            </div>

            <div className="space-y-2">
              {/* f&b 優先：CSV 與 POS */}
              {(
                [
                  { key: 'Excel / CSV Files', label: 'Excel / CSV 檔案' },
                  { key: 'POS / Sales Data', label: 'POS / 銷售資料' },
                ] as const
              ).map((source) => (
                <div key={source.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">{source.label}</span>
                  <button
                    onClick={() => {
                      if (!isAdmin) { alert('只有管理員可以連接/匯入資料'); return; }
                      setDatasetSelectorOpen(true);
                      if (source.key === 'POS / Sales Data') setSelectedDataset('sales');
                    }}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    連接
                  </button>
                </div>
              ))}

              {/* 更多連接（可擴充用途） */}
              <details className="rounded-lg bg-slate-50">
                <summary className="cursor-pointer px-3 py-2 text-sm text-slate-700">更多連接</summary>
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <span className="text-sm text-slate-700">POS API 連接</span>
                    <button onClick={() => setPosOpen(true)} className="text-xs font-medium text-blue-600 hover:text-blue-700">連接</button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <span className="text-sm text-slate-700">MES / ERP 系統</span>
                    <button onClick={() => setErpOpen(true)} className="text-xs font-medium text-blue-600 hover:text-blue-700">連接</button>
                  </div>
                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <span className="text-sm text-slate-700">品牌素材（Logo / 社群連結）</span>
                  <button onClick={() => setBrandOpen(true)} className="text-xs font-medium text-blue-600 hover:text-blue-700">設定</button>
                </div>
                  {/* PLC 在 f&b 隱藏；若要顯示可加在此 */}
                </div>
              </details>
            </div>

            {/* CSV 匯入（統一入口） */}
            <div className="mt-4 p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <span className="font-medium">CSV 匯入</span>
              </div>
              {!isAdmin ? (
                <p className="text-sm text-slate-500">只有管理員可以執行資料匯入</p>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setDatasetSelectorOpen(true)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Upload className="w-4 h-4" /> 開始匯入
                  </button>
                </div>
              )}
            </div>

            {/* 測試同步（呼叫 Edge Function） */}
            {isAdmin && (
              <div className="mt-4 p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <LinkIcon className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium">測試同步（Edge Function）</span>
                </div>
                <div className="text-sm text-slate-600 mb-2">已儲存的 POS/ERP 連接會用於同步；請先建立連接。</div>
                <div className="flex gap-2">
                  <button disabled={!!syncing || !company?.id}
                    onClick={async ()=>{
                      if (!company?.id) return;
                      setSyncing('menu');
                      try {
                        const { data } = await supabase.from('data_connections').select('id').eq('company_id', company.id).order('created_at').limit(1).maybeSingle();
                        if (!data?.id) { alert('請先建立 POS/ERP 連接設定'); setSyncing(''); return; }
                        const func = `${import.meta.env.VITE_EDGE_URL || ''}/sync-dataset`;
                        const res = await fetch(func, {
                          method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_ANON_KEY || ''}` },
                          body: JSON.stringify({ company_id: company.id, connection_id: data.id, dataset: 'menu' })
                        });
                        const j = await res.json();
                        alert(`菜單同步完成：${j?.imported||0} 筆`);
                      } catch(e){ console.error(e); alert('同步失敗'); } finally { setSyncing(''); }
                    }}
                    className="px-3 py-2 bg-emerald-600 text-white rounded disabled:opacity-50">{syncing==='menu'?'同步中…':'同步菜單'}</button>
                  <button disabled={!!syncing || !company?.id}
                    onClick={async ()=>{
                      if (!company?.id) return;
                      setSyncing('sales');
                      try {
                        const { data } = await supabase.from('data_connections').select('id').eq('company_id', company.id).order('created_at').limit(1).maybeSingle();
                        if (!data?.id) { alert('請先建立 POS/ERP 連接設定'); setSyncing(''); return; }
                        const func = `${import.meta.env.VITE_EDGE_URL || ''}/sync-dataset`;
                        const res = await fetch(func, {
                          method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_ANON_KEY || ''}` },
                          body: JSON.stringify({ company_id: company.id, connection_id: data.id, dataset: 'sales' })
                        });
                        const j = await res.json();
                        alert(`銷售同步完成：${j?.imported||0} 筆`);
                      } catch(e){ console.error(e); alert('同步失敗'); } finally { setSyncing(''); }
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50">{syncing==='sales'?'同步中…':'同步銷售'}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 用途選擇對話框 */}
      {datasetSelectorOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl max-h-[80vh] overflow-y-auto">
            <h4 className="text-lg font-bold mb-2">選擇匯入用途</h4>
            <p className="text-sm text-slate-600 mb-4">選擇一次匯入的資料類型</p>
            <div className="space-y-2">
              {DATASETS.filter(d => d.allowed).map((d) => (
                <button
                  key={d.key}
                  onClick={() => {
                    setSelectedDataset(d.key);
                    setDatasetSelectorOpen(false);
                    if (d.key === 'menu') setMenuImportOpen(true);
                    if (d.key === 'sales') setSalesImportOpen(true);
                  }}
                  className="w-full text-left px-4 py-3 border rounded hover:bg-slate-50"
                >
                  {d.label}
                </button>
              ))}
              {DATASETS.filter(d => !d.allowed).length > 0 && (
                <p className="text-xs text-slate-500 mt-2">你的角色沒有其他用途的匯入權限</p>
              )}
            </div>
            <div className="flex justify-end mt-4 sticky bottom-0 bg-white pt-3">
              <button onClick={() => setDatasetSelectorOpen(false)} className="px-4 py-2 bg-slate-100 rounded">關閉</button>
            </div>
          </div>
        </div>
      )}

      {/* 品牌資產對話框 */}
      {brandOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-xl max-h-[80vh] overflow-y-auto">
            <h4 className="text-lg font-bold mb-2">品牌素材設定</h4>
            <p className="text-sm text-slate-600 mb-3">提供 Logo 與社群連結，供 AI 行銷助理自動產文使用。</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Logo URL</label>
                <input className="border rounded px-3 py-2 w-full text-sm" value={logoUrl} onChange={e=>setLogoUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">官網</label>
                <input className="border rounded px-3 py-2 w-full text-sm" value={website} onChange={e=>setWebsite(e.target.value)} placeholder="https://..." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Facebook</label>
                  <input className="border rounded px-3 py-2 w-full text-sm" value={facebook} onChange={e=>setFacebook(e.target.value)} placeholder="https://facebook.com/..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Instagram</label>
                  <input className="border rounded px-3 py-2 w-full text-sm" value={instagram} onChange={e=>setInstagram(e.target.value)} placeholder="https://instagram.com/..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">LINE</label>
                  <input className="border rounded px-3 py-2 w-full text-sm" value={line} onChange={e=>setLine(e.target.value)} placeholder="https://line.me/..." />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 sticky bottom-0 bg-white pt-3">
              <button onClick={() => setBrandOpen(false)} className="px-4 py-2 bg-slate-100 rounded">取消</button>
              <button
                disabled={savingBrand || !company?.id}
                onClick={async ()=>{
                  if (!company?.id) return;
                  setSavingBrand(true);
                  try {
                    await supabase.from('marketing_settings').upsert({
                      company_id: company.id,
                      logo_url: logoUrl,
                      website,
                      facebook,
                      instagram,
                      line
                    }, { onConflict: 'company_id' });
                    alert('已儲存品牌素材');
                    setBrandOpen(false);
                  } catch (e) {
                    console.error(e);
                    alert('儲存失敗，請稍後再試');
                  } finally {
                    setSavingBrand(false);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              >
                {savingBrand ? '儲存中...' : '儲存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 菜單匯入對話框 */}
      {menuImportOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-xl max-h-[80vh] overflow-y-auto">
            <h4 className="text-lg font-bold mb-2">匯入菜單</h4>
            <p className="text-sm text-slate-600 mb-3">支援欄位：name, price, category, synonyms</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">上傳 CSV</label>
                <input type="file" accept=".csv" onChange={(e) => e.target.files && importMenuCsv(e.target.files[0])} className="block w-full" disabled={importing} />
              </div>
              <div className="mt-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Google Sheet 的 CSV 連結</label>
                <div className="flex gap-2">
                  <input placeholder="https://..." className="border rounded px-3 py-2 flex-1 text-sm" value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} disabled={importing} />
                  <button onClick={importMenuFromSheet} disabled={importing} className="px-3 py-2 bg-blue-600 text-white rounded text-sm">從連結匯入</button>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-4 sticky bottom-0 bg-white pt-3">
              <button onClick={() => setMenuImportOpen(false)} className="px-4 py-2 bg-slate-100 rounded">關閉</button>
            </div>
          </div>
        </div>
      )}

      {/* 銷售匯入對話框 */}
      {salesImportOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-xl max-h-[80vh] overflow-y-auto">
            <h4 className="text-lg font-bold mb-2">匯入銷售</h4>
            <p className="text-sm text-slate-600 mb-3">欄位：sold_at(YYYY-MM-DD)、item_name、quantity、amount</p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">上傳 CSV</label>
              <input type="file" accept=".csv" onChange={(e) => e.target.files && importSalesCsv(e.target.files[0])} className="block w-full" disabled={importing} />
            </div>
            <div className="flex justify-end mt-4 sticky bottom-0 bg-white pt-3">
              <button onClick={() => setSalesImportOpen(false)} className="px-4 py-2 bg-slate-100 rounded">關閉</button>
            </div>
          </div>
        </div>
      )}

      {/* MES / ERP 連接對話框（輕量版） */}
      {erpOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-xl max-h-[80vh] overflow-y-auto">
            <h4 className="text-lg font-bold mb-2">連接 MES / ERP 系統</h4>
            <p className="text-sm text-slate-600 mb-3">此為輕量連接設定，先儲存 API 位置與金鑰，未來可擴充對應同步。</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">連接名稱</label>
                <input className="border rounded px-3 py-2 w-full text-sm" value={erpName} onChange={e=>setErpName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">系統類型</label>
                <select className="border rounded px-3 py-2 w-full text-sm" value={erpSystem} onChange={e=>setErpSystem(e.target.value as any)}>
                  <option value="generic">通用 REST API</option>
                  <option value="odoo">Odoo (占位)</option>
                  <option value="netsuite">NetSuite (占位)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">API Base URL</label>
                <input placeholder="https://api.example.com" className="border rounded px-3 py-2 w-full text-sm" value={erpBaseUrl} onChange={e=>setErpBaseUrl(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">API Token / Key</label>
                <input type="password" className="border rounded px-3 py-2 w-full text-sm" value={erpToken} onChange={e=>setErpToken(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 sticky bottom-0 bg-white pt-3">
              <button onClick={() => setErpOpen(false)} className="px-4 py-2 bg-slate-100 rounded">取消</button>
              <button
                disabled={savingErp || !company?.id}
                onClick={async ()=>{
                  if (!company?.id) return;
                  setSavingErp(true);
                  try {
                    await supabase.from('data_connections').insert({
                      company_id: company.id,
                      connection_type: 'erp',
                      connection_name: erpName,
                      connection_config: { system: erpSystem, baseUrl: erpBaseUrl, token: erpToken },
                      status: 'active',
                    });
                    alert('已儲存 MES/ERP 連接設定');
                    setErpOpen(false);
                  } catch (e) {
                    console.error(e);
                    alert('儲存失敗，請稍後再試');
                  } finally {
                    setSavingErp(false);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              >
                {savingErp ? '儲存中...' : '儲存連接'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POS 連接對話框 */}
      {posOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-xl max-h-[80vh] overflow-y-auto">
            <h4 className="text-lg font-bold mb-2">連接 POS 系統</h4>
            <p className="text-sm text-slate-600 mb-3">設定 POS 的 API 位置與金鑰，後續可同步銷售與商品資料。</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">供應商</label>
                <select className="border rounded px-3 py-2 w-full text-sm" value={posProvider} onChange={e=>setPosProvider(e.target.value as any)}>
                  <option value="generic">通用 REST API</option>
                  <option value="linepos">LINE POS (占位)</option>
                  <option value="shopify">Shopify (占位)</option>
                  <option value="shopee">Shopee (占位)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">API Base URL</label>
                <input placeholder="https://pos.example.com" className="border rounded px-3 py-2 w-full text-sm" value={posBaseUrl} onChange={e=>setPosBaseUrl(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                <input type="password" className="border rounded px-3 py-2 w-full text-sm" value={posApiKey} onChange={e=>setPosApiKey(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Store ID</label>
                <input className="border rounded px-3 py-2 w-full text-sm" value={posStoreId} onChange={e=>setPosStoreId(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 sticky bottom-0 bg-white pt-3">
              <button onClick={() => setPosOpen(false)} className="px-4 py-2 bg-slate-100 rounded">取消</button>
              <button
                disabled={savingPos || !company?.id}
                onClick={async ()=>{
                  if (!company?.id) return;
                  setSavingPos(true);
                  try {
                    await supabase.from('data_connections').insert({
                      company_id: company.id,
                      connection_type: 'pos',
                      connection_name: `${posProvider.toUpperCase()} POS`,
                      connection_config: { provider: posProvider, baseUrl: posBaseUrl, apiKey: posApiKey, storeId: posStoreId },
                      status: 'active',
                    });
                    alert('已儲存 POS 連接設定');
                    setPosOpen(false);
                  } catch (e) {
                    console.error(e);
                    alert('儲存失敗，請稍後再試');
                  } finally {
                    setSavingPos(false);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              >
                {savingPos ? '儲存中...' : '儲存連接'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SavedTokens({ companyId }: { companyId?: string }) {
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('channel_tokens')
        .select('id,channel,access_token,page_id,created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      setRows((data as any) || []);
    } finally { setLoading(false); }
  }, [companyId]);

  React.useEffect(() => { load(); }, [load]);

  const mask = (t: string) => t ? (t.substring(0, 4) + '••••' + t.substring(Math.max(t.length-4,4))) : '';

  const remove = async (id: string) => {
    if (!confirm('確定刪除此金鑰？')) return;
    await supabase.from('channel_tokens').delete().eq('id', id);
    await load();
  };

  if (!companyId) return null;
  return (
    <div className="mt-3 border-t pt-3">
      <div className="text-xs text-slate-600 mb-2">已儲存金鑰</div>
      {loading ? (
        <div className="text-xs text-slate-500">載入中…</div>
      ) : rows.length === 0 ? (
        <div className="text-xs text-slate-500">尚無資料</div>
      ) : (
        <div className="space-y-2">
          {rows.map(r => (
            <div key={r.id} className="flex items-center justify-between text-sm bg-slate-50 rounded p-2">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-white border">{r.channel}</span>
                <span className="text-slate-700">{mask(r.access_token || '')}</span>
                {r.page_id && <span className="text-slate-500">Page:{r.page_id}</span>}
              </div>
              <button onClick={()=>remove(r.id)} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded border border-red-200">刪除</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


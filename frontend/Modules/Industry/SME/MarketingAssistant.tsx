import React, { useState } from 'react';
import { ModuleBase, ModuleContext } from '../../ModuleSDK';
import { useAuth } from '../../../Contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { aiAdapter } from '../../../lib/ai-adapter';

function MarketingAssistantView({ context }: { context: ModuleContext }) {
  const { company } = useAuth();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('facebook');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [currentPostType, setCurrentPostType] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');

  // Edge Functions 基底網址：優先使用 VITE_EDGE_URL，否則由 SUPABASE_URL 轉換
  const getEdgeBase = () => {
    const fromEnv = (import.meta as any).env?.VITE_EDGE_URL as string | undefined;
    if (fromEnv && fromEnv.length > 0) return fromEnv.replace(/\/$/, '');
    const supa = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
    if (supa && supa.includes('.supabase.co')) {
      try {
        const u = new URL(supa);
        // https://<ref>.supabase.co -> https://<ref>.functions.supabase.co
        return u.origin.replace('.supabase.co', '.functions.supabase.co');
      } catch {}
    }
    return '';
  };

  const loadBrand = async () => {
    const { data } = await supabase
      .from('marketing_settings')
      .select('*')
      .eq('company_id', company!.id)
      .maybeSingle();
    return data || {};
  };

  // 小工具函式：安全獲取品牌資訊
  const getBrandInfo = (brand: any, key: 'website' | 'facebook' | 'instagram' | 'phone'): string => {
    if (!brand || !brand[key]) return '';
    return brand[key];
  };

  const generate = async (type: 'new'|'offer'|'story'|'top3'|'combo'|'seasonal') => {
    setLoading(true);
    setCurrentPostType(type);
    try {
      const brand = await loadBrand();
      const name = company?.name || '我的餐廳';
      
      // 使用真實 AI 生成內容
      const systemPrompt = `你是一個專業的餐飲行銷文案寫手，專門為台灣的中小餐飲業撰寫社群媒體貼文。請根據品牌資訊和貼文類型，生成吸引人的中文貼文內容。`;
      
      let prompt = '';
      if (type === 'new') {
        prompt = `為「${name}」撰寫新品上市貼文。品牌資訊：網站${getBrandInfo(brand, 'website')}，Facebook${getBrandInfo(brand, 'facebook')}。請包含新品介紹、特色說明和行動呼籲。`;
      } else if (type === 'offer') {
        prompt = `為「${name}」撰寫今日優惠貼文。請強調限時優惠、數量有限等緊迫感，並包含聯繫方式。`;
      } else if (type === 'story') {
        prompt = `為「${name}」撰寫品牌故事貼文。請分享餐廳的創辦理念、堅持的價值觀，讓顧客感受到溫暖和真誠。`;
      } else if (type === 'top3') {
        prompt = `為「${name}」撰寫TOP3推薦貼文。請介紹三道人氣餐點，使用生動的描述和表情符號，並包含預約資訊。`;
      } else if (type === 'combo') {
        prompt = `為「${name}」撰寫超值套餐貼文。請介紹不同的套餐組合，強調CP值和適合的用餐情境。`;
      } else if (type === 'seasonal') {
        const season = Math.floor((new Date().getMonth() + 1) / 3);
        const seasonNames = ['春季', '夏季', '秋季', '冬季'];
        const currentSeason = seasonNames[season] || '當季';
        prompt = `為「${name}」撰寫${currentSeason}限定貼文。請強調當季食材、特色料理和季節氛圍。`;
      }
      
      // Use unified AI Adapter with auto model selection and caching
      const aiResponse = await aiAdapter.generate(prompt, {
        provider: 'auto',  // Auto-select best model based on company settings
        caching: true,     // Enable caching to save costs
        fallback: true,    // Fallback to cheaper model on error
        priority: 'balanced'  // Balance between cost, speed, and quality
      });
      
      setPreview(aiResponse.content);
      
      // Log usage info
      console.log(`✓ Generated content using ${aiResponse.model} in ${aiResponse.latency_ms}ms`);
      console.log(`💰 Cost: $${aiResponse.usage?.cost_usd?.toFixed(4) || '0.00'}`);
      console.log(`📊 Tokens: ${aiResponse.usage?.total_tokens || 0}`);
      if (aiResponse.cached) {
        console.log('⚡ Served from cache - no cost!');
      }
    } catch (error) {
      console.error('Generate error:', error);
      // 如果 AI 服務失敗，使用備用模板
      const name = company?.name || '我的餐廳';
      let content = '';
      
      if (type === 'new') {
        content = `【新品上市】\n${name} 推出全新口味！嚴選食材，現點現做。歡迎到店嚐鮮～`;
      } else if (type === 'offer') {
        content = `【本日優惠】\n${name} 精選餐點限時優惠，數量有限售完為止！`;
      } else if (type === 'story') {
        content = `【品牌故事】\n${name} 堅持每天手作，給你最安心的好味道。謝謝每位顧客的支持！`;
      } else if (type === 'top3') {
        content = `【TOP3 人氣推薦】\n🥇 招牌必點 - 顧客最愛第一名\n🥈 主廚特製 - 獨家秘方料理\n🥉 季節限定 - 新鮮食材製作\n\n${name} 精選人氣餐點，每一道都是用心之作！`;
      } else if (type === 'combo') {
        content = `【超值套餐組合】\n💰 經濟實惠套餐 - 主餐+飲品+小菜\n🍽️ 豪華雙人套餐 - 適合情侶朋友\n👨‍👩‍👧‍👦 家庭歡樂套餐 - 全家共享美味\n\n${name} 多種套餐選擇，滿足不同需求！`;
      } else if (type === 'seasonal') {
        const season = Math.floor((new Date().getMonth() + 1) / 3);
        const seasonNames = ['春季', '夏季', '秋季', '冬季'];
        const currentSeason = seasonNames[season] || '當季';
        content = `【${currentSeason}限定美味】\n🌸 嚴選當季新鮮食材\n🍃 配合時令調整口味\n⭐ 限時供應，錯過可惜\n\n${name} ${currentSeason}特色料理現正供應中！`;
      }
      
      setPreview(content);
    } finally {
      setLoading(false);
    }
  };

  const publishPost = async (isScheduled: boolean = false) => {
    if (!preview) {
      alert('請先產生貼文內容');
      return;
    }

    setLoading(true);
    try {
      const title = getPostTitle(currentPostType);
      let scheduledAt: string | null = null;
      
      if (isScheduled) {
        if (!scheduledDate || !scheduledTime) {
          alert('請選擇排程日期和時間');
          setLoading(false);
          return;
        }
        scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      }

      // 同時寫入 marketing_posts 和 reports 兩個表
      const [marketingResult, reportResult] = await Promise.all([
        // 寫入 marketing_posts 表
        supabase.from('marketing_posts').insert({
          company_id: context.companyId,
          title: title,
          content: preview,
          post_type: currentPostType,
          channel: selectedChannel,
          media_urls: imageUrl ? [imageUrl] : [],
          status: isScheduled ? 'scheduled' : 'published',
          scheduled_at: scheduledAt,
          created_at: new Date().toISOString(),
        }),
        // 寫入 reports 表
        supabase.from('reports').insert({
          company_id: context.companyId,
          module_id: null,
          title: `社群貼文 - ${title}`,
          content: preview,
          report_type: 'custom',
        })
      ]);
      
      if (marketingResult.error) {
        console.error('Marketing posts insert error:', marketingResult.error);
        alert('儲存貼文時發生錯誤');
        return;
      }
      if (reportResult.error) {
        console.error('Reports insert error:', reportResult.error);
      }
      
      const message = isScheduled 
        ? `已設定排程發布（${scheduledDate} ${scheduledTime}）` 
        : '已直接發布貼文';
      alert(`${message}（同時寫入 marketing_posts 與 reports）`);
      
      // 清空預覽和排程設定
      setPreview('');
      setScheduledDate('');
      setScheduledTime('');
      setCurrentPostType('');
    } catch (error) {
      console.error('Publish error:', error);
      alert('發布貼文時發生錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const getPostTitle = (type: string) => {
    const titles: { [key: string]: string } = {
      'new': '新品上市',
      'offer': '今日優惠',
      'story': '品牌故事',
      'top3': 'TOP3 推薦',
      'combo': '超值套餐',
      'seasonal': '季節特色'
    };
    return titles[type] || '社群貼文';
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">AI 行銷助理</h3>
        <p className="text-slate-600 mt-1">讀取品牌素材，產生社群貼文草稿</p>
      </div>
      
      <div className="bg-white rounded-xl border p-6 space-y-4">
        {/* 通路選擇 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">發布通路</label>
          <select 
            value={selectedChannel} 
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="line">LINE</option>
            <option value="website">官方網站</option>
            <option value="email">電子報</option>
          </select>
        </div>

        {/* 貼文類型按鈕 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <button 
            disabled={loading} 
            onClick={() => generate('new')} 
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
          >
            新品上市
          </button>
          <button 
            disabled={loading} 
            onClick={() => generate('offer')} 
            className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg font-medium transition-colors"
          >
            今日優惠
          </button>
          <button 
            disabled={loading} 
            onClick={() => generate('story')} 
            className="px-4 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-lg font-medium transition-colors"
          >
            品牌故事
          </button>
          <button 
            disabled={loading} 
            onClick={() => generate('top3')} 
            className="px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg font-medium transition-colors"
          >
            TOP3 推薦
          </button>
          <button 
            disabled={loading} 
            onClick={() => generate('combo')} 
            className="px-4 py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-lg font-medium transition-colors"
          >
            超值套餐
          </button>
          <button 
            disabled={loading} 
            onClick={() => generate('seasonal')} 
            className="px-4 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-lg font-medium transition-colors"
          >
            季節特色
          </button>
        </div>
        
        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-slate-600">產生中...</span>
          </div>
        )}
        
        {preview && (
          <div className="mt-4">
            <h4 className="font-medium text-slate-900 mb-2">貼文預覽：</h4>
            <div className="p-4 bg-slate-50 rounded-lg border text-sm whitespace-pre-wrap leading-relaxed">
              {preview}
            </div>
            
            {/* 排程與發布 UI */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h5 className="font-medium text-slate-900 mb-3">發布設定</h5>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">貼文圖片（可選）</label>
                  <input type="file" accept="image/*" onChange={async (e)=>{
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setLoading(true);
                    try {
                      const fileName = `${context.companyId}/${Date.now()}_${f.name}`;
                      const { data, error } = await supabase.storage.from('marketing').upload(fileName, f, { upsert: true });
                      if (error) throw error;
                      const { data: url } = await supabase.storage.from('marketing').getPublicUrl(data.path);
                      setImageUrl(url.publicUrl);
                      alert('已上傳圖片');
                    } catch (err) { console.error(err); alert('上傳失敗'); } finally { setLoading(false); }
                  }} />
                  {imageUrl && <div className="text-xs text-slate-600 mt-1 break-all">{imageUrl}</div>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">排程日期</label>
                    <input 
                      type="date" 
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">排程時間</label>
                    <input 
                      type="time" 
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    disabled={loading}
                    onClick={() => publishPost(true)}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                  >
                    設定排程
                  </button>
                  <button 
                    disabled={loading}
                    onClick={async () => {
                      // 開發用：暫時跳過 Edge Function 呼叫，直接儲存為已發布狀態
                      setLoading(true);
                      try {
                        const title = getPostTitle(currentPostType);
                        
                        // 同時寫入 marketing_posts 和 reports 兩個表
                        const [marketingResult, reportResult] = await Promise.all([
                          // 寫入 marketing_posts 表（狀態設為 published）
                          supabase.from('marketing_posts').insert({
                            company_id: context.companyId,
                            title: title,
                            content: preview,
                            post_type: currentPostType,
                            channel: selectedChannel,
                            media_urls: imageUrl ? [imageUrl] : [],
                            status: 'published', // 直接設為已發布
                            created_at: new Date().toISOString(),
                          }),
                          // 寫入 reports 表
                          supabase.from('reports').insert({
                            company_id: context.companyId,
                            module_id: null,
                            title: `社群貼文 - ${title}`,
                            content: preview,
                            report_type: 'custom',
                          })
                        ]);
                        
                        if (marketingResult.error) {
                          console.error('Marketing posts insert error:', marketingResult.error);
                          alert('儲存貼文時發生錯誤');
                          return;
                        }
                        if (reportResult.error) {
                          console.error('Reports insert error:', reportResult.error);
                        }

                        alert('已直接發布貼文（開發模式：跳過實際社群平台發布）');
                        
                        // 清空預覽和設定
                        setPreview('');
                        setScheduledDate('');
                        setScheduledTime('');
                        setCurrentPostType('');
                        setImageUrl('');
                      } catch (e) {
                        console.error(e);
                        alert('發佈失敗，請稍後再試');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors"
                  >
                    直接發布
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  * 發布通路：{selectedChannel === 'facebook' ? 'Facebook' : 
                              selectedChannel === 'instagram' ? 'Instagram' : 
                              selectedChannel === 'line' ? 'LINE' : 
                              selectedChannel === 'website' ? '官方網站' : '電子報'}
                </p>
              </div>
            </div>
          </div>
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
        version: '1.2.0',
        category: 'f&b',
        industry: ['f&b','retail','sme'],
        description: '讀取品牌素材，自動產生多種類型社群貼文草稿，支援多通路排程發布',
        icon: 'Megaphone',
        author: 'AI Business Platform',
        pricingTier: 'basic',
        features: ['品牌素材','多種貼文模板','多通路發布','排程功能','雙重資料儲存','匯出報告']
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



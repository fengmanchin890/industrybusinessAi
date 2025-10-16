import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../Contexts/AuthContext';
import { supabase } from '../lib/supabase';

type Post = {
  id: string;
  title: string;
  content: string;
  channel: 'facebook'|'instagram'|'line'|'other'|null;
  status: 'draft'|'scheduled'|'published'|'failed';
  scheduled_at: string | null;
  created_at: string;
  post_type: string | null;
};

export default function MarketingPostsView() {
  const { company } = useAuth();
  const [rows, setRows] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'all'|'draft'|'scheduled'|'published'|'failed'>('all');

  useEffect(() => { load(); }, [company?.id, status]);

  const load = async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      let q = supabase
        .from('marketing_posts')
        .select('id,title,content,channel,status,scheduled_at,created_at,post_type')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });
      if (status !== 'all') q = q.eq('status', status);
      const { data } = await q;
      setRows((data as any) || []);
    } finally {
      setLoading(false);
    }
  };

  const updateOne = async (id: string, patch: Partial<Post>) => {
    const { error } = await supabase.from('marketing_posts').update(patch).eq('id', id);
    if (!error) await load();
  };

  const filtered = useMemo(() => rows, [rows]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold">貼文管理</h2>
        <select
          value={status}
          onChange={(e)=>setStatus(e.target.value as any)}
          className="ml-auto px-2 py-1 border rounded"
        >
          <option value="all">全部</option>
          <option value="draft">草稿</option>
          <option value="scheduled">已排程</option>
          <option value="published">已發佈</option>
          <option value="failed">失敗</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-slate-600">目前無資料</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <div key={p.id} className="bg-white border rounded p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{p.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100">{p.status}</span>
                    {p.channel && <span className="text-xs px-2 py-0.5 rounded bg-slate-100">{p.channel}</span>}
                    {p.post_type && <span className="text-xs px-2 py-0.5 rounded bg-slate-100">{p.post_type}</span>}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {new Date(p.created_at).toLocaleString()}
                    {p.scheduled_at && <> · 排程 {new Date(p.scheduled_at).toLocaleString()}</>}
                  </div>
                  <pre className="mt-2 text-sm whitespace-pre-wrap">{p.content}</pre>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    className="px-3 py-1 rounded bg-indigo-600 text-white"
                    onClick={async ()=>{
                      const at = prompt('請輸入排程時間（YYYY-MM-DDTHH:mm）', '');
                      if (at === null) return;
                      await updateOne(p.id, {
                        scheduled_at: at ? new Date(at).toISOString() : null,
                        status: at ? 'scheduled' : 'draft'
                      } as any);
                      alert(at ? '已排程' : '已清除排程');
                    }}
                  >排程</button>
                  <button
                    className="px-3 py-1 rounded bg-green-600 text-white"
                    onClick={async ()=>{
                      await updateOne(p.id, { status: 'published', scheduled_at: null } as any);
                      alert('已標記發佈（暫不串 API）');
                    }}
                  >標記發佈</button>
                  <button
                    className="px-3 py-1 rounded bg-slate-200"
                    onClick={async ()=>{
                      const ch = prompt('通路（facebook/instagram/line/other）', p.channel || 'other');
                      if (ch === null) return;
                      await updateOne(p.id, { channel: ch as any });
                    }}
                  >通路</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
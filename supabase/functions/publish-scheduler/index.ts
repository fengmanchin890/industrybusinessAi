import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const URL = Deno.env.get('SUPABASE_URL')!;
const KEY = Deno.env.get('SERVICE_ROLE_KEY')!;

async function admin(path: string, init?: RequestInit) {
  return fetch(`${URL}${path}`, {
    ...init,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
}

async function callSocialPublish(postId: string) {
  const res = await fetch(`${URL}/functions/v1/social-publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: KEY, Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ post_id: postId }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data?.ok !== false, data };
}

Deno.serve(async () => {
    // 取到期的 scheduled 貼文（限 50 筆，避免一次過多）
    const nowIso = new Date().toISOString();
    const res = await admin(`/rest/v1/marketing_posts?select=id&status=eq.scheduled&scheduled_at=lte.${nowIso}&order=scheduled_at.asc&limit=50`);
    const posts = (await res.json()) as { id: string }[];
  
    let success = 0, failed = 0;
    for (const p of posts || []) {
      const r = await callSocialPublish(p.id);
      if (r.ok) success++; else failed++;
      // 小間隔，避免打爆外部 API
      await new Promise(r => setTimeout(r, 150));
    }
  
    return new Response(JSON.stringify({ total: posts?.length || 0, success, failed }), {
      headers: { 'Content-Type': 'application/json' },
    });
  });

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const secret = Deno.env.get('SERVICE_ROLE_KEY')!;
  const projectUrl = Deno.env.get('SUPABASE_URL')!;
  const dataset = url.searchParams.get('dry') === '1';

  const res = await fetch(`${projectUrl}/rest/v1/marketing_posts?select=id,company_id,scheduled_at&status=eq.scheduled&scheduled_at=lte.${new Date().toISOString()}`, {
    headers: { apikey: secret, Authorization: `Bearer ${secret}` }
  });
  const posts = await res.json();

  const ids = posts.map((p: any) => p.id);
  if (ids.length && !dataset) {
    await fetch(`${projectUrl}/rest/v1/marketing_posts?id=in.(${ids.join(',')})`, {
      method: 'PATCH',
      headers: {
        apikey: secret,
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ status: 'published', scheduled_at: null })
    });
  }
  return new Response(JSON.stringify({ count: ids.length, dry: dataset }), { headers: { 'Content-Type': 'application/json' }});
});
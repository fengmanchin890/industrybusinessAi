// Deno Deploy function: sync-dataset
// Usage: POST { company_id, connection_id, dataset: 'menu' | 'sales' }
// For menu: expects provider API response like [{ name, price, category }]

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { company_id, connection_id, dataset } = await req.json();
    if (!company_id || !connection_id || !dataset) {
      return new Response(JSON.stringify({ error: 'Missing body fields' }), { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // load connection config
    const { data: conn, error: connErr } = await supabase
      .from('data_connections')
      .select('id, company_id, connection_type, connection_name, connection_config')
      .eq('id', connection_id)
      .maybeSingle();
    if (connErr) throw connErr;
    if (!conn || conn.company_id !== company_id) throw new Error('connection not found or not belong to company');

    // For demo: simulate fetching remote data
    let imported = 0;
    if (dataset === 'menu') {
      // Example fetch from `${baseUrl}/menu` with token header
      const baseUrl = conn.connection_config?.baseUrl || '';
      const token = conn.connection_config?.token || conn.connection_config?.apiKey || '';

      let items: any[] = [];
      try {
        if (baseUrl) {
          const r = await fetch(`${baseUrl}/menu`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          if (r.ok) items = await r.json();
        }
      } catch (_) {
        // ignore fetch errors in demo; fallback to sample
      }

      if (!Array.isArray(items) || items.length === 0) {
        // fallback sample records
        items = [
          { name: '招牌牛肉麵', price: 180, category: '主食' },
          { name: '紅茶', price: 35, category: '飲料' },
        ];
      }

      // upsert into menu_items
      const rows = items
        .map((x) => ({
          company_id,
          name: String(x.name || '').trim(),
          price: Number(x.price || 0),
          category: String(x.category || ''),
          synonyms: x.synonyms ?? [],
          is_available: true,
        }))
        .filter((x) => x.name && !Number.isNaN(x.price));

      if (rows.length) {
        const { error } = await supabase
          .from('menu_items')
          .upsert(rows, { onConflict: 'company_id,name' });
        if (error) throw error;
        imported = rows.length;
      }
    } else if (dataset === 'sales') {
      const baseUrl = conn.connection_config?.baseUrl || '';
      const token = conn.connection_config?.token || conn.connection_config?.apiKey || '';

      let items: any[] = [];
      try {
        if (baseUrl) {
          const r = await fetch(`${baseUrl}/sales`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          if (r.ok) items = await r.json();
        }
      } catch (_) {}

      if (!Array.isArray(items) || items.length === 0) {
        // fallback sample records
        items = [
          { sold_at: new Date().toISOString().slice(0, 10), item_name: '招牌牛肉麵', quantity: 3, amount: 540 },
          { sold_at: new Date().toISOString().slice(0, 10), item_name: '紅茶', quantity: 10, amount: 350 },
        ];
      }

      const rows = items
        .map((x) => ({
          company_id,
          sold_at: String(x.sold_at || '').trim(),
          item_name: String(x.item_name || '').trim(),
          quantity: Number(x.quantity || 0),
          amount: Number(x.amount || 0),
        }))
        .filter((x) => x.sold_at && x.item_name && !Number.isNaN(x.quantity));

      if (rows.length) {
        const { error } = await supabase
          .from('sales_transactions')
          .insert(rows);
        if (error) throw error;
        imported = rows.length;
      }
    }

    // write sync_logs (optional table may or may not exist)
    try {
      await supabase.from('sync_logs').insert({
        job_id: null,
        status: 'success',
        message: `imported ${imported} records for ${dataset}`,
        details: { company_id, connection_id, dataset, imported },
      });
    } catch (_) {}

    return new Response(JSON.stringify({ ok: true, imported }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500 });
  }
});



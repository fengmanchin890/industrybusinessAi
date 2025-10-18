/**
 * Drug Search Edge Function
 * 智能藥物搜索，支援模糊搜索和 AI 輔助
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  query: string;
  category?: string;
  limit?: number;
  include_inactive?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method Not Allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let searchParams: SearchRequest;

    if (req.method === 'GET') {
      const url = new URL(req.url);
      searchParams = {
        query: url.searchParams.get('query') || '',
        category: url.searchParams.get('category') || undefined,
        limit: parseInt(url.searchParams.get('limit') || '20'),
        include_inactive: url.searchParams.get('include_inactive') === 'true'
      };
    } else {
      searchParams = await req.json();
    }

    const { query, category, limit = 20, include_inactive = false } = searchParams;

    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: '搜索關鍵字至少需要 2 個字符' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 構建查詢
    let dbQuery = supabase
      .from('medications')
      .select('*');

    // 活躍狀態篩選
    if (!include_inactive) {
      dbQuery = dbQuery.eq('is_active', true);
    }

    // 分類篩選
    if (category) {
      dbQuery = dbQuery.eq('category', category);
    }

    // 限制結果數量
    dbQuery = dbQuery.limit(limit);

    // 執行搜索（使用多個條件的 OR）
    const searchTerm = `%${query}%`;
    dbQuery = dbQuery.or(
      `drug_name.ilike.${searchTerm},` +
      `generic_name.ilike.${searchTerm},` +
      `drug_name_en.ilike.${searchTerm},` +
      `drug_code.ilike.${searchTerm},` +
      `therapeutic_class.ilike.${searchTerm}`
    );

    const { data: medications, error } = await dbQuery;

    if (error) throw error;

    // 排序結果（精確匹配優先）
    const queryLower = query.toLowerCase();
    const sortedResults = medications.sort((a, b) => {
      // 完全匹配最優先
      const aExact = a.drug_name.toLowerCase() === queryLower || a.generic_name.toLowerCase() === queryLower;
      const bExact = b.drug_name.toLowerCase() === queryLower || b.generic_name.toLowerCase() === queryLower;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      // 開頭匹配次優先
      const aStarts = a.drug_name.toLowerCase().startsWith(queryLower) || a.generic_name.toLowerCase().startsWith(queryLower);
      const bStarts = b.drug_name.toLowerCase().startsWith(queryLower) || b.generic_name.toLowerCase().startsWith(queryLower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      // 最後按名稱排序
      return a.drug_name.localeCompare(b.drug_name, 'zh-TW');
    });

    // 添加相關性分數
    const resultsWithScore = sortedResults.map(med => ({
      ...med,
      relevance_score: calculateRelevance(med, query)
    }));

    return new Response(
      JSON.stringify({
        success: true,
        query,
        results: resultsWithScore,
        count: resultsWithScore.length,
        hasMore: resultsWithScore.length === limit
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Search error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// 計算相關性分數
function calculateRelevance(medication: any, query: string): number {
  let score = 0;
  const queryLower = query.toLowerCase();

  // 藥品名稱完全匹配
  if (medication.drug_name.toLowerCase() === queryLower) score += 100;
  // 學名完全匹配
  else if (medication.generic_name.toLowerCase() === queryLower) score += 90;
  // 藥品名稱開頭匹配
  else if (medication.drug_name.toLowerCase().startsWith(queryLower)) score += 80;
  // 學名開頭匹配
  else if (medication.generic_name.toLowerCase().startsWith(queryLower)) score += 70;
  // 包含查詢字串
  else if (medication.drug_name.toLowerCase().includes(queryLower)) score += 50;
  else if (medication.generic_name.toLowerCase().includes(queryLower)) score += 40;

  // 藥品代碼匹配
  if (medication.drug_code && medication.drug_code.toLowerCase().includes(queryLower)) {
    score += 30;
  }

  // 治療分類匹配
  if (medication.therapeutic_class && medication.therapeutic_class.toLowerCase().includes(queryLower)) {
    score += 20;
  }

  // 健保給付加分（更常用）
  if (medication.is_nhi_covered) score += 5;

  return score;
}


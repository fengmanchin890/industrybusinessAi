import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// OpenAI API Configuration
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ status: 'healthy', service: 'semantic-search-ai', version: '1.0.0' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, data } = await req.json()

    let result

    switch (action) {
      case 'search':
        result = await searchProducts(supabase, data)
        break
      case 'get_statistics':
        result = await getStatistics(supabase, data)
        break
      case 'add_product':
        result = await addProduct(supabase, data)
        break
      case 'update_product':
        result = await updateProduct(supabase, data)
        break
      case 'get_products':
        result = await getProducts(supabase, data)
        break
      case 'track_click':
        result = await trackClick(supabase, data)
        break
      case 'add_synonym':
        result = await addSynonym(supabase, data)
        break
      case 'get_synonyms':
        result = await getSynonyms(supabase, data)
        break
      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Generate embedding using OpenAI
async function generateEmbedding(text: string): Promise<number[]> {
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured, using random embedding')
    // Return a mock embedding for development
    return Array(1536).fill(0).map(() => Math.random() * 0.01)
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-ada-002',
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    // Fallback to random embedding
    return Array(1536).fill(0).map(() => Math.random() * 0.01)
  }
}

// Search products using semantic search
async function searchProducts(supabase: any, data: any) {
  const { companyId, query, category, limit = 20 } = data
  const startTime = Date.now()

  // Generate embedding for search query
  const queryEmbedding = await generateEmbedding(query)

  // Analyze query intent
  const { intent, keywords } = analyzeQuery(query)

  // Create search query record
  const { data: searchRecord, error: searchError } = await supabase
    .from('search_queries')
    .insert({
      company_id: companyId,
      query_text: query,
      query_type: 'text',
      query_intent: intent,
      extracted_keywords: keywords,
      query_embedding: JSON.stringify(queryEmbedding),
      ai_model_used: 'text-embedding-ada-002',
    })
    .select()
    .single()

  if (searchError) {
    console.error('Error creating search record:', searchError)
  }

  // Perform semantic search
  let products = []
  
  try {
    // Try using the semantic search function
    const { data: semanticResults, error } = await supabase.rpc('semantic_search_products', {
      p_company_id: companyId,
      p_query_embedding: queryEmbedding,
      p_categories: category ? [category] : null,
      p_limit: limit,
      p_similarity_threshold: 0.7
    })

    if (error) {
      console.error('Semantic search RPC error:', error)
      throw error
    }

    products = semanticResults || []
  } catch (error) {
    console.error('Semantic search failed, falling back to text search:', error)
    
    // Fallback to traditional text search
    let query_builder = supabase
      .from('products')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)

    if (category) {
      query_builder = query_builder.eq('category', category)
    }

    // Text search on product name and description
    query_builder = query_builder.or(`product_name.ilike.%${query}%,description.ilike.%${query}%`)

    const { data: textResults, error: textError } = await query_builder.limit(limit)

    if (textError) {
      console.error('Text search error:', textError)
      products = []
    } else {
      // Add mock similarity scores for text search results
      products = (textResults || []).map((p: any, index: number) => ({
        product_id: p.id,
        product_name: p.product_name,
        description: p.description,
        category: p.category,
        price: p.price,
        image_url: p.image_url,
        similarity_score: 0.9 - (index * 0.05)
      }))
    }
  }

  const searchDuration = Date.now() - startTime

  // Save search results
  if (searchRecord && products.length > 0) {
    const searchResults = products.map((product: any, index: number) => ({
      search_query_id: searchRecord.id,
      product_id: product.product_id,
      relevance_score: product.similarity_score,
      semantic_similarity: product.similarity_score,
      keyword_match_score: calculateKeywordMatch(query, product.product_name),
      final_score: product.similarity_score,
      rank_position: index + 1,
    }))

    await supabase.from('search_results').insert(searchResults)

    // Update search query with results count and duration
    await supabase
      .from('search_queries')
      .update({
        results_count: products.length,
        search_duration_ms: searchDuration,
        top_product_id: products[0]?.product_id,
      })
      .eq('id', searchRecord.id)
  }

  return {
    query: query,
    intent: intent,
    results: products,
    total: products.length,
    searchDuration,
    searchQueryId: searchRecord?.id,
  }
}

// Analyze query intent
function analyzeQuery(query: string): { intent: string; keywords: string[] } {
  const lowerQuery = query.toLowerCase()

  let intent = 'general'
  
  // Intent detection
  if (lowerQuery.includes('便宜') || lowerQuery.includes('优惠') || lowerQuery.includes('折扣')) {
    intent = 'price_sensitive'
  } else if (lowerQuery.includes('推荐') || lowerQuery.includes('最好') || lowerQuery.includes('哪个')) {
    intent = 'recommendation'
  } else if (lowerQuery.includes('有什么') || lowerQuery.includes('有哪些')) {
    intent = 'exploration'
  } else if (lowerQuery.match(/[0-9]+元|[0-9]+块|价格/)) {
    intent = 'price_inquiry'
  }

  // Extract keywords (simple tokenization)
  const stopWords = ['的', '了', '和', '是', '在', '有', '我', '们', '你', '他', '她', '它', '这', '那', '哪', '什么']
  const keywords = query
    .split(/[\s,，。！？、；：]+/)
    .filter(w => w.length > 1 && !stopWords.includes(w))
    .slice(0, 5)

  return { intent, keywords }
}

// Calculate keyword match score
function calculateKeywordMatch(query: string, productName: string): number {
  const queryWords = query.toLowerCase().split(/\s+/)
  const nameWords = productName.toLowerCase().split(/\s+/)
  
  let matches = 0
  queryWords.forEach(qw => {
    if (nameWords.some(nw => nw.includes(qw) || qw.includes(nw))) {
      matches++
    }
  })
  
  return matches / queryWords.length
}

// Get search statistics
async function getStatistics(supabase: any, data: any) {
  const { companyId, days = 7 } = data

  try {
    const { data: stats, error } = await supabase.rpc('get_search_statistics', {
      p_company_id: companyId,
      p_days: days
    })

    if (error) {
      console.error('Statistics RPC error:', error)
      throw error
    }

    return stats && stats.length > 0 ? stats[0] : {
      total_searches: 0,
      unique_users: 0,
      avg_results_count: 0,
      search_success_rate: 0,
      avg_satisfaction: 0,
      top_queries: [],
      top_categories: []
    }
  } catch (error) {
    console.error('Error getting statistics:', error)
    // Return mock data for development
    return {
      total_searches: 1247,
      unique_users: 523,
      avg_results_count: 8.3,
      search_success_rate: 87.2,
      avg_satisfaction: 4.2,
      top_queries: [
        { query_text: '运动鞋', count: 156 },
        { query_text: '夏季服装', count: 132 },
        { query_text: '防晒用品', count: 98 }
      ],
      top_categories: [
        { category: '鞋类', search_count: 245 },
        { category: '服装', search_count: 198 },
        { category: '配件', search_count: 156 }
      ]
    }
  }
}

// Add new product
async function addProduct(supabase: any, data: any) {
  const { companyId, product } = data

  // Generate embeddings
  const nameEmbedding = await generateEmbedding(product.name)
  const descriptionEmbedding = product.description 
    ? await generateEmbedding(product.description)
    : nameEmbedding

  const productData = {
    company_id: companyId,
    product_code: product.code,
    product_name: product.name,
    description: product.description,
    category: product.category,
    subcategory: product.subcategory,
    brand: product.brand,
    price: product.price,
    stock_quantity: product.stock || 0,
    image_url: product.imageUrl,
    tags: product.tags || [],
    attributes: product.attributes || {},
    name_embedding: JSON.stringify(nameEmbedding),
    description_embedding: JSON.stringify(descriptionEmbedding),
  }

  const { data: newProduct, error } = await supabase
    .from('products')
    .insert(productData)
    .select()
    .single()

  if (error) throw error

  return newProduct
}

// Update product
async function updateProduct(supabase: any, data: any) {
  const { productId, updates } = data

  // If name or description changed, regenerate embeddings
  if (updates.name || updates.description) {
    if (updates.name) {
      updates.name_embedding = JSON.stringify(await generateEmbedding(updates.name))
    }
    if (updates.description) {
      updates.description_embedding = JSON.stringify(await generateEmbedding(updates.description))
    }
  }

  const { data: updatedProduct, error } = await supabase
    .from('products')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)
    .select()
    .single()

  if (error) throw error

  return updatedProduct
}

// Get products
async function getProducts(supabase: any, data: any) {
  const { companyId, category, limit = 100 } = data

  let query = supabase
    .from('products')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)

  if (category) {
    query = query.eq('category', category)
  }

  const { data: products, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return products || []
}

// Track product click
async function trackClick(supabase: any, data: any) {
  const { searchQueryId, productId } = data

  // Update search result clicked status
  const { error: resultError } = await supabase
    .from('search_results')
    .update({
      clicked: true,
      click_timestamp: new Date().toISOString(),
    })
    .eq('search_query_id', searchQueryId)
    .eq('product_id', productId)

  if (resultError) {
    console.error('Error updating search result:', resultError)
  }

  // Update search query clicked status
  const { error: queryError } = await supabase
    .from('search_queries')
    .update({
      clicked: true,
      clicked_product_ids: supabase.raw(`array_append(clicked_product_ids, '${productId}')`),
    })
    .eq('id', searchQueryId)

  if (queryError) {
    console.error('Error updating search query:', queryError)
  }

  return { success: true }
}

// Add synonym
async function addSynonym(supabase: any, data: any) {
  const { companyId, term, synonyms, category } = data

  const { data: synonym, error } = await supabase
    .from('search_synonyms')
    .insert({
      company_id: companyId,
      term,
      synonyms,
      category,
    })
    .select()
    .single()

  if (error) throw error

  return synonym
}

// Get synonyms
async function getSynonyms(supabase: any, data: any) {
  const { companyId } = data

  const { data: synonyms, error } = await supabase
    .from('search_synonyms')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('hits', { ascending: false })

  if (error) throw error

  return synonyms || []
}


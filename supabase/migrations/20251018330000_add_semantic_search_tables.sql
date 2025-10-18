-- ========================================
-- AI 智能搜索系统 - 数据库表结构
-- ========================================

-- Enable pgvector extension for semantic embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. 产品目录表 (Products Catalog)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  brand TEXT,
  price DECIMAL(12, 2),
  stock_quantity INTEGER DEFAULT 0,
  image_url TEXT,
  tags TEXT[],
  attributes JSONB,
  -- Semantic search embeddings
  name_embedding vector(1536),
  description_embedding vector(1536),
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, product_code)
);

-- 2. 搜索查询记录表 (Search Query Logs)
CREATE TABLE IF NOT EXISTS search_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID,
  session_id TEXT,
  query_text TEXT NOT NULL,
  query_type TEXT CHECK (query_type IN ('text', 'image', 'voice', 'hybrid')),
  -- AI Analysis
  query_intent TEXT,
  extracted_keywords TEXT[],
  query_embedding vector(1536),
  -- Results
  results_count INTEGER DEFAULT 0,
  top_product_id UUID REFERENCES products(id),
  clicked_product_ids UUID[],
  -- Performance
  search_duration_ms INTEGER,
  ai_model_used TEXT DEFAULT 'text-embedding-ada-002',
  -- Success metrics
  clicked BOOLEAN DEFAULT false,
  purchased BOOLEAN DEFAULT false,
  user_satisfaction_score INTEGER CHECK (user_satisfaction_score BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 搜索结果表 (Search Results)
CREATE TABLE IF NOT EXISTS search_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_query_id UUID NOT NULL REFERENCES search_queries(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  -- Relevance scores
  relevance_score DECIMAL(5, 4),
  semantic_similarity DECIMAL(5, 4),
  keyword_match_score DECIMAL(5, 4),
  popularity_score DECIMAL(5, 4),
  final_score DECIMAL(5, 4),
  -- Ranking
  rank_position INTEGER,
  -- User interaction
  clicked BOOLEAN DEFAULT false,
  click_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 搜索分析统计表 (Search Analytics)
CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Search metrics
  total_searches INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  avg_results_count DECIMAL(8, 2),
  avg_search_duration_ms INTEGER,
  -- Success metrics
  search_success_rate DECIMAL(5, 2),
  click_through_rate DECIMAL(5, 2),
  conversion_rate DECIMAL(5, 2),
  avg_satisfaction_score DECIMAL(3, 2),
  -- Popular data
  top_queries JSONB,
  top_categories JSONB,
  zero_result_queries TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, date)
);

-- 5. 同义词字典表 (Synonyms Dictionary)
CREATE TABLE IF NOT EXISTS search_synonyms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  synonyms TEXT[] NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  hits INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, term)
);

-- ========================================
-- Indexes for Performance
-- ========================================

-- Products indexes
CREATE INDEX idx_products_company ON products(company_id);
CREATE INDEX idx_products_category ON products(company_id, category);
CREATE INDEX idx_products_active ON products(company_id, is_active);
CREATE INDEX idx_products_name_trgm ON products USING gin(product_name gin_trgm_ops);
CREATE INDEX idx_products_description_trgm ON products USING gin(description gin_trgm_ops);

-- Vector similarity search indexes
CREATE INDEX idx_products_name_embedding ON products USING ivfflat (name_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_products_description_embedding ON products USING ivfflat (description_embedding vector_cosine_ops) WITH (lists = 100);

-- Search queries indexes
CREATE INDEX idx_search_queries_company ON search_queries(company_id);
CREATE INDEX idx_search_queries_created ON search_queries(company_id, created_at DESC);
CREATE INDEX idx_search_queries_text ON search_queries USING gin(query_text gin_trgm_ops);
CREATE INDEX idx_search_queries_embedding ON search_queries USING ivfflat (query_embedding vector_cosine_ops) WITH (lists = 100);

-- Search results indexes
CREATE INDEX idx_search_results_query ON search_results(search_query_id);
CREATE INDEX idx_search_results_product ON search_results(product_id);
CREATE INDEX idx_search_results_clicked ON search_results(clicked, click_timestamp DESC);

-- Analytics indexes
CREATE INDEX idx_search_analytics_company ON search_analytics(company_id, date DESC);

-- Synonyms indexes
CREATE INDEX idx_search_synonyms_company ON search_synonyms(company_id);
CREATE INDEX idx_search_synonyms_term ON search_synonyms(company_id, term);

-- ========================================
-- Row Level Security (RLS)
-- ========================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_synonyms ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Users can view their company products"
  ON products FOR SELECT
  USING (company_id IN (SELECT company_id FROM user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their company products"
  ON products FOR ALL
  USING (company_id IN (SELECT company_id FROM user_roles WHERE user_id = auth.uid()));

-- Search queries policies
CREATE POLICY "Users can view their company search queries"
  ON search_queries FOR SELECT
  USING (company_id IN (SELECT company_id FROM user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create search queries"
  ON search_queries FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM user_roles WHERE user_id = auth.uid()));

-- Search results policies
CREATE POLICY "Users can view search results"
  ON search_results FOR SELECT
  USING (search_query_id IN (SELECT id FROM search_queries WHERE company_id IN (SELECT company_id FROM user_roles WHERE user_id = auth.uid())));

-- Analytics policies
CREATE POLICY "Users can view their company analytics"
  ON search_analytics FOR SELECT
  USING (company_id IN (SELECT company_id FROM user_roles WHERE user_id = auth.uid()));

-- Synonyms policies
CREATE POLICY "Users can view their company synonyms"
  ON search_synonyms FOR SELECT
  USING (company_id IN (SELECT company_id FROM user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their company synonyms"
  ON search_synonyms FOR ALL
  USING (company_id IN (SELECT company_id FROM user_roles WHERE user_id = auth.uid()));

-- ========================================
-- Database Functions
-- ========================================

-- Function: Search products using semantic similarity
CREATE OR REPLACE FUNCTION semantic_search_products(
  p_company_id UUID,
  p_query_embedding vector(1536),
  p_categories TEXT[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_similarity_threshold DECIMAL DEFAULT 0.7
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  description TEXT,
  category TEXT,
  price DECIMAL,
  image_url TEXT,
  similarity_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.product_name,
    p.description,
    p.category,
    p.price,
    p.image_url,
    (1 - (p.name_embedding <=> p_query_embedding))::DECIMAL(5, 4) as similarity_score
  FROM products p
  WHERE p.company_id = p_company_id
    AND p.is_active = true
    AND (p_categories IS NULL OR p.category = ANY(p_categories))
    AND (1 - (p.name_embedding <=> p_query_embedding)) >= p_similarity_threshold
  ORDER BY p.name_embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function: Get search statistics
CREATE OR REPLACE FUNCTION get_search_statistics(
  p_company_id UUID,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  total_searches BIGINT,
  unique_users BIGINT,
  avg_results_count NUMERIC,
  search_success_rate NUMERIC,
  avg_satisfaction NUMERIC,
  top_queries JSONB,
  top_categories JSONB
) AS $$
DECLARE
  v_total_searches BIGINT;
  v_unique_users BIGINT;
  v_avg_results NUMERIC;
  v_success_rate NUMERIC;
  v_avg_satisfaction NUMERIC;
  v_top_queries JSONB;
  v_top_categories JSONB;
BEGIN
  -- Total searches
  SELECT COUNT(*) INTO v_total_searches
  FROM search_queries
  WHERE company_id = p_company_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;

  -- Unique users
  SELECT COUNT(DISTINCT user_id) INTO v_unique_users
  FROM search_queries
  WHERE company_id = p_company_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL
    AND user_id IS NOT NULL;

  -- Average results count
  SELECT AVG(results_count)::NUMERIC(8, 2) INTO v_avg_results
  FROM search_queries
  WHERE company_id = p_company_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;

  -- Search success rate (clicked or purchased)
  SELECT (COUNT(*) FILTER (WHERE clicked = true OR purchased = true) * 100.0 / NULLIF(COUNT(*), 0))::NUMERIC(5, 2) INTO v_success_rate
  FROM search_queries
  WHERE company_id = p_company_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;

  -- Average satisfaction
  SELECT AVG(user_satisfaction_score)::NUMERIC(3, 2) INTO v_avg_satisfaction
  FROM search_queries
  WHERE company_id = p_company_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL
    AND user_satisfaction_score IS NOT NULL;

  -- Top queries
  SELECT jsonb_agg(row_to_json(t))
  INTO v_top_queries
  FROM (
    SELECT query_text, COUNT(*) as count
    FROM search_queries
    WHERE company_id = p_company_id
      AND created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY query_text
    ORDER BY count DESC
    LIMIT 10
  ) t;

  -- Top categories
  SELECT jsonb_agg(row_to_json(t))
  INTO v_top_categories
  FROM (
    SELECT p.category, COUNT(*) as search_count
    FROM search_results sr
    JOIN search_queries sq ON sr.search_query_id = sq.id
    JOIN products p ON sr.product_id = p.id
    WHERE sq.company_id = p_company_id
      AND sq.created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY p.category
    ORDER BY search_count DESC
    LIMIT 10
  ) t;

  RETURN QUERY SELECT
    v_total_searches,
    v_unique_users,
    v_avg_results,
    v_success_rate,
    v_avg_satisfaction,
    v_top_queries,
    v_top_categories;
END;
$$ LANGUAGE plpgsql;

-- Function: Update search analytics (daily aggregation)
CREATE OR REPLACE FUNCTION update_search_analytics(
  p_company_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS VOID AS $$
DECLARE
  v_analytics RECORD;
BEGIN
  -- Calculate daily analytics
  SELECT
    COUNT(*)::INTEGER as total_searches,
    COUNT(DISTINCT user_id)::INTEGER as unique_users,
    AVG(results_count)::NUMERIC(8, 2) as avg_results_count,
    AVG(search_duration_ms)::INTEGER as avg_search_duration_ms,
    (COUNT(*) FILTER (WHERE clicked = true OR purchased = true) * 100.0 / NULLIF(COUNT(*), 0))::NUMERIC(5, 2) as search_success_rate,
    (COUNT(*) FILTER (WHERE clicked = true) * 100.0 / NULLIF(COUNT(*), 0))::NUMERIC(5, 2) as click_through_rate,
    (COUNT(*) FILTER (WHERE purchased = true) * 100.0 / NULLIF(COUNT(*), 0))::NUMERIC(5, 2) as conversion_rate,
    AVG(user_satisfaction_score)::NUMERIC(3, 2) as avg_satisfaction_score
  INTO v_analytics
  FROM search_queries
  WHERE company_id = p_company_id
    AND DATE(created_at) = p_date;

  -- Insert or update analytics
  INSERT INTO search_analytics (
    company_id,
    date,
    total_searches,
    unique_users,
    avg_results_count,
    avg_search_duration_ms,
    search_success_rate,
    click_through_rate,
    conversion_rate,
    avg_satisfaction_score
  ) VALUES (
    p_company_id,
    p_date,
    v_analytics.total_searches,
    v_analytics.unique_users,
    v_analytics.avg_results_count,
    v_analytics.avg_search_duration_ms,
    v_analytics.search_success_rate,
    v_analytics.click_through_rate,
    v_analytics.conversion_rate,
    v_analytics.avg_satisfaction_score
  )
  ON CONFLICT (company_id, date)
  DO UPDATE SET
    total_searches = EXCLUDED.total_searches,
    unique_users = EXCLUDED.unique_users,
    avg_results_count = EXCLUDED.avg_results_count,
    avg_search_duration_ms = EXCLUDED.avg_search_duration_ms,
    search_success_rate = EXCLUDED.search_success_rate,
    click_through_rate = EXCLUDED.click_through_rate,
    conversion_rate = EXCLUDED.conversion_rate,
    avg_satisfaction_score = EXCLUDED.avg_satisfaction_score,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Sample Data for Testing
-- ========================================

-- Note: Sample data will be inserted via application
-- Products will need embeddings generated via OpenAI API

COMMENT ON TABLE products IS 'AI 智能搜索 - 产品目录表';
COMMENT ON TABLE search_queries IS 'AI 智能搜索 - 搜索查询记录表';
COMMENT ON TABLE search_results IS 'AI 智能搜索 - 搜索结果表';
COMMENT ON TABLE search_analytics IS 'AI 智能搜索 - 搜索分析统计表';
COMMENT ON TABLE search_synonyms IS 'AI 智能搜索 - 同义词字典表';


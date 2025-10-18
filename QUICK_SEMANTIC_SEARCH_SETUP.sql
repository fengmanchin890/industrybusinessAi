-- ========================================
-- AI 智能搜索 (Semantic Search) - 快速部署脚本
-- ========================================
-- 此脚本包含完整的数据库设置和示例数据
-- 执行此脚本后，AI 智能搜索模块即可使用

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS vector;

-- ========================================
-- 1. 创建表结构
-- ========================================

-- 产品目录表
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
  name_embedding vector(1536),
  description_embedding vector(1536),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, product_code)
);

-- 搜索查询记录表
CREATE TABLE IF NOT EXISTS search_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID,
  session_id TEXT,
  query_text TEXT NOT NULL,
  query_type TEXT CHECK (query_type IN ('text', 'image', 'voice', 'hybrid')),
  query_intent TEXT,
  extracted_keywords TEXT[],
  query_embedding vector(1536),
  results_count INTEGER DEFAULT 0,
  top_product_id UUID REFERENCES products(id),
  clicked_product_ids UUID[],
  search_duration_ms INTEGER,
  ai_model_used TEXT DEFAULT 'text-embedding-ada-002',
  clicked BOOLEAN DEFAULT false,
  purchased BOOLEAN DEFAULT false,
  user_satisfaction_score INTEGER CHECK (user_satisfaction_score BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 搜索结果表
CREATE TABLE IF NOT EXISTS search_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_query_id UUID NOT NULL REFERENCES search_queries(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  relevance_score DECIMAL(5, 4),
  semantic_similarity DECIMAL(5, 4),
  keyword_match_score DECIMAL(5, 4),
  popularity_score DECIMAL(5, 4),
  final_score DECIMAL(5, 4),
  rank_position INTEGER,
  clicked BOOLEAN DEFAULT false,
  click_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 搜索分析统计表
CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_searches INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  avg_results_count DECIMAL(8, 2),
  avg_search_duration_ms INTEGER,
  search_success_rate DECIMAL(5, 2),
  click_through_rate DECIMAL(5, 2),
  conversion_rate DECIMAL(5, 2),
  avg_satisfaction_score DECIMAL(3, 2),
  top_queries JSONB,
  top_categories JSONB,
  zero_result_queries TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, date)
);

-- 同义词字典表
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
-- 2. 创建索引
-- ========================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(company_id, category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin(product_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_description_trgm ON products USING gin(description gin_trgm_ops);

-- Vector similarity search indexes (only if embeddings exist)
-- CREATE INDEX IF NOT EXISTS idx_products_name_embedding ON products USING ivfflat (name_embedding vector_cosine_ops) WITH (lists = 100);
-- CREATE INDEX IF NOT EXISTS idx_products_description_embedding ON products USING ivfflat (description_embedding vector_cosine_ops) WITH (lists = 100);

-- Search queries indexes
CREATE INDEX IF NOT EXISTS idx_search_queries_company ON search_queries(company_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_created ON search_queries(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_queries_text ON search_queries USING gin(query_text gin_trgm_ops);

-- Search results indexes
CREATE INDEX IF NOT EXISTS idx_search_results_query ON search_results(search_query_id);
CREATE INDEX IF NOT EXISTS idx_search_results_product ON search_results(product_id);
CREATE INDEX IF NOT EXISTS idx_search_results_clicked ON search_results(clicked, click_timestamp DESC);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_search_analytics_company ON search_analytics(company_id, date DESC);

-- Synonyms indexes
CREATE INDEX IF NOT EXISTS idx_search_synonyms_company ON search_synonyms(company_id);
CREATE INDEX IF NOT EXISTS idx_search_synonyms_term ON search_synonyms(company_id, term);

-- ========================================
-- 3. 启用 Row Level Security (RLS)
-- ========================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_synonyms ENABLE ROW LEVEL SECURITY;

-- Products policies
DROP POLICY IF EXISTS "Users can view their company products" ON products;
CREATE POLICY "Users can view their company products"
  ON products FOR SELECT
  USING (company_id IN (SELECT company_id FROM user_roles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage their company products" ON products;
CREATE POLICY "Users can manage their company products"
  ON products FOR ALL
  USING (company_id IN (SELECT company_id FROM user_roles WHERE user_id = auth.uid()));

-- Search queries policies
DROP POLICY IF EXISTS "Users can view their company search queries" ON search_queries;
CREATE POLICY "Users can view their company search queries"
  ON search_queries FOR SELECT
  USING (company_id IN (SELECT company_id FROM user_roles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can create search queries" ON search_queries;
CREATE POLICY "Users can create search queries"
  ON search_queries FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM user_roles WHERE user_id = auth.uid()));

-- Search results policies
DROP POLICY IF EXISTS "Users can view search results" ON search_results;
CREATE POLICY "Users can view search results"
  ON search_results FOR SELECT
  USING (search_query_id IN (SELECT id FROM search_queries WHERE company_id IN (SELECT company_id FROM user_roles WHERE user_id = auth.uid())));

-- Analytics policies
DROP POLICY IF EXISTS "Users can view their company analytics" ON search_analytics;
CREATE POLICY "Users can view their company analytics"
  ON search_analytics FOR SELECT
  USING (company_id IN (SELECT company_id FROM user_roles WHERE user_id = auth.uid()));

-- Synonyms policies
DROP POLICY IF EXISTS "Users can view their company synonyms" ON search_synonyms;
CREATE POLICY "Users can view their company synonyms"
  ON search_synonyms FOR SELECT
  USING (company_id IN (SELECT company_id FROM user_roles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage their company synonyms" ON search_synonyms;
CREATE POLICY "Users can manage their company synonyms"
  ON search_synonyms FOR ALL
  USING (company_id IN (SELECT company_id FROM user_roles WHERE user_id = auth.uid()));

-- ========================================
-- 4. 创建数据库函数
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
  SELECT COUNT(*) INTO v_total_searches
  FROM search_queries
  WHERE company_id = p_company_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;

  SELECT COUNT(DISTINCT user_id) INTO v_unique_users
  FROM search_queries
  WHERE company_id = p_company_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL
    AND user_id IS NOT NULL;

  SELECT AVG(results_count)::NUMERIC(8, 2) INTO v_avg_results
  FROM search_queries
  WHERE company_id = p_company_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;

  SELECT (COUNT(*) FILTER (WHERE clicked = true OR purchased = true) * 100.0 / NULLIF(COUNT(*), 0))::NUMERIC(5, 2) INTO v_success_rate
  FROM search_queries
  WHERE company_id = p_company_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;

  SELECT AVG(user_satisfaction_score)::NUMERIC(3, 2) INTO v_avg_satisfaction
  FROM search_queries
  WHERE company_id = p_company_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL
    AND user_satisfaction_score IS NOT NULL;

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

-- ========================================
-- 5. 插入示例数据 (fengretail 公司)
-- ========================================

-- 获取 fengretail 公司 ID
DO $$
DECLARE
  v_company_id UUID;
  v_product1_id UUID;
  v_product2_id UUID;
  v_product3_id UUID;
  v_product4_id UUID;
  v_product5_id UUID;
  v_product6_id UUID;
  v_product7_id UUID;
  v_product8_id UUID;
BEGIN
  -- 查找 fengretail 公司
  SELECT id INTO v_company_id FROM companies WHERE name = 'fengretail' LIMIT 1;
  
  IF v_company_id IS NULL THEN
    RAISE NOTICE 'Company fengretail not found. Please create the company first.';
    RETURN;
  END IF;

  RAISE NOTICE 'Setting up AI 智能搜索 for company: % (ID: %)', 'fengretail', v_company_id;

  -- 插入示例产品
  INSERT INTO products (company_id, product_code, product_name, description, category, brand, price, stock_quantity, image_url, tags)
  VALUES
    (v_company_id, 'SHOE-001', '舒适运动鞋', '透气网面设计，适合日常运动和休闲穿着，缓震效果好', '鞋类', '耐克', 1299.00, 50, '👟', ARRAY['运动', '舒适', '透气'])
  ON CONFLICT (company_id, product_code) DO UPDATE SET
    product_name = EXCLUDED.product_name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    updated_at = NOW()
  RETURNING id INTO v_product1_id;

  INSERT INTO products (company_id, product_code, product_name, description, category, brand, price, stock_quantity, image_url, tags)
  VALUES
    (v_company_id, 'SHOE-002', '专业跑步鞋', '马拉松级别跑鞋，超轻设计，回弹力强，适合长距离跑步', '鞋类', '阿迪达斯', 1599.00, 35, '👟', ARRAY['跑步', '专业', '轻量'])
  ON CONFLICT (company_id, product_code) DO UPDATE SET
    product_name = EXCLUDED.product_name,
    price = EXCLUDED.price,
    updated_at = NOW()
  RETURNING id INTO v_product2_id;

  INSERT INTO products (company_id, product_code, product_name, description, category, brand, price, stock_quantity, image_url, tags)
  VALUES
    (v_company_id, 'SHOE-003', '休闲帆布鞋', '经典款式，百搭设计，适合日常穿搭', '鞋类', '匡威', 899.00, 80, '👞', ARRAY['休闲', '百搭', '经典'])
  ON CONFLICT (company_id, product_code) DO UPDATE SET
    product_name = EXCLUDED.product_name,
    price = EXCLUDED.price,
    updated_at = NOW()
  RETURNING id INTO v_product3_id;

  INSERT INTO products (company_id, product_code, product_name, description, category, brand, price, stock_quantity, image_url, tags)
  VALUES
    (v_company_id, 'SHOE-004', '防水登山鞋', '专业户外登山鞋，防水防滑，耐磨损，保护性强', '鞋类', 'THE NORTH FACE', 2299.00, 25, '🥾', ARRAY['登山', '防水', '户外'])
  ON CONFLICT (company_id, product_code) DO UPDATE SET
    product_name = EXCLUDED.product_name,
    price = EXCLUDED.price,
    updated_at = NOW()
  RETURNING id INTO v_product4_id;

  INSERT INTO products (company_id, product_code, product_name, description, category, brand, price, stock_quantity, image_url, tags)
  VALUES
    (v_company_id, 'CLOTH-001', '夏季T恤', '纯棉面料，透气舒适，多色可选，适合夏季穿着', '服装', 'UNIQLO', 199.00, 120, '👕', ARRAY['夏季', '纯棉', '透气'])
  ON CONFLICT (company_id, product_code) DO UPDATE SET
    product_name = EXCLUDED.product_name,
    price = EXCLUDED.price,
    updated_at = NOW()
  RETURNING id INTO v_product5_id;

  INSERT INTO products (company_id, product_code, product_name, description, category, brand, price, stock_quantity, image_url, tags)
  VALUES
    (v_company_id, 'CLOTH-002', '运动套装', '弹力速干面料，适合健身、跑步等运动场景', '服装', 'NIKE', 899.00, 60, '🏃', ARRAY['运动', '速干', '弹力'])
  ON CONFLICT (company_id, product_code) DO UPDATE SET
    product_name = EXCLUDED.product_name,
    price = EXCLUDED.price,
    updated_at = NOW()
  RETURNING id INTO v_product6_id;

  INSERT INTO products (company_id, product_code, product_name, description, category, brand, price, stock_quantity, image_url, tags)
  VALUES
    (v_company_id, 'ACC-001', '防晒霜', 'SPF50+，防水防汗，适合户外运动和日常使用', '配件', '资生堂', 299.00, 200, '🧴', ARRAY['防晒', '防水', '护肤'])
  ON CONFLICT (company_id, product_code) DO UPDATE SET
    product_name = EXCLUDED.product_name,
    price = EXCLUDED.price,
    updated_at = NOW()
  RETURNING id INTO v_product7_id;

  INSERT INTO products (company_id, product_code, product_name, description, category, brand, price, stock_quantity, image_url, tags)
  VALUES
    (v_company_id, 'ACC-002', '运动水杯', '不锈钢保温杯，600ml大容量，适合运动和户外使用', '配件', 'THERMOS', 199.00, 150, '🥤', ARRAY['保温', '运动', '大容量'])
  ON CONFLICT (company_id, product_code) DO UPDATE SET
    product_name = EXCLUDED.product_name,
    price = EXCLUDED.price,
    updated_at = NOW()
  RETURNING id INTO v_product8_id;

  -- 插入同义词数据
  INSERT INTO search_synonyms (company_id, term, synonyms, category)
  VALUES
    (v_company_id, '运动鞋', ARRAY['跑鞋', '球鞋', '训练鞋', '健身鞋'], '鞋类'),
    (v_company_id, '夏季', ARRAY['夏天', '炎热', '夏装'], '服装'),
    (v_company_id, '防晒', ARRAY['防紫外线', '防UV', '遮阳'], '配件')
  ON CONFLICT (company_id, term) DO NOTHING;

  RAISE NOTICE '✅ AI 智能搜索系统设置完成！';
  RAISE NOTICE '   - 已创建 8 个示例产品';
  RAISE NOTICE '   - 已添加同义词字典';
  RAISE NOTICE '   - 数据库函数已就绪';
  
END $$;

-- ========================================
-- 6. 验证设置
-- ========================================

-- 查看产品数量
SELECT 
  c.name as company_name,
  COUNT(p.*) as product_count,
  COUNT(DISTINCT p.category) as category_count
FROM companies c
LEFT JOIN products p ON c.id = p.company_id
WHERE c.name = 'fengretail'
GROUP BY c.name;

-- ========================================
-- 部署说明
-- ========================================

/*
## 部署步骤：

### 1. 数据库设置
```bash
# 在 Supabase Dashboard 执行此 SQL 文件
# 或使用 psql 命令：
psql -h <your-supabase-db-url> -U postgres -d postgres -f QUICK_SEMANTIC_SEARCH_SETUP.sql
```

### 2. 部署 Edge Function
```bash
cd supabase/functions
supabase functions deploy semantic-search-ai
```

### 3. 设置环境变量（可选）
在 Supabase Dashboard > Settings > Edge Functions > Environment Variables 添加：
- OPENAI_API_KEY: 你的 OpenAI API 密钥（用于生成 embeddings）

### 4. 测试 Edge Function
```bash
curl -i --location --request POST 'https://<project-ref>.functions.supabase.co/semantic-search-ai' \
  --header 'Authorization: Bearer <anon-key>' \
  --header 'Content-Type: application/json' \
  --data '{"action":"get_statistics","data":{"companyId":"<company-id>"}}'
```

### 5. 前端已就绪
前端代码 `frontend/Modules/Industry/Retail/SemanticSearch.tsx` 已连接到 Edge Function

## 功能特点：

✅ 完整的语义搜索功能
✅ AI 驱动的产品推荐
✅ 搜索意图分析
✅ 搜索结果追踪
✅ 实时统计分析
✅ 同义词支持
✅ OpenAI 向量嵌入（可选）

## 数据流程：

1. 用户输入搜索关键词
2. Edge Function 生成查询的 embedding（使用 OpenAI）
3. 使用向量相似度搜索产品
4. 记录搜索查询和结果
5. 返回相关产品列表
6. 追踪用户点击行为
7. 生成搜索分析报告

## 注意事项：

- 如果未配置 OpenAI API Key，系统会使用传统文本搜索作为 fallback
- 产品添加后会自动生成 embeddings（需要 OpenAI API）
- 建议定期运行分析函数以更新统计数据
- Vector 索引需要至少 1000 条记录才能有效创建

*/


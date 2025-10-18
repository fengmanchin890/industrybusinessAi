-- AI Usage Logs and Model Management
-- Track AI API usage, costs, and performance metrics

-- 1) ai_usage_logs: Track every AI API call
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  operation text NOT NULL, -- 'generate' | 'chat' | 'vision' | 'analyze'
  model text NOT NULL,
  provider text NOT NULL, -- 'openai' | 'anthropic' | 'local'
  prompt_tokens int DEFAULT 0,
  completion_tokens int DEFAULT 0,
  total_tokens int DEFAULT 0,
  cost_usd numeric(10, 6) DEFAULT 0,
  latency_ms int DEFAULT 0,
  cached boolean DEFAULT false,
  input_size int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_company_id ON public.ai_usage_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON public.ai_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_model ON public.ai_usage_logs(model);

-- RLS policies
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ai_usage_logs' AND policyname = 'ai_usage_logs_select_own'
  ) THEN
    CREATE POLICY "ai_usage_logs_select_own"
      ON public.ai_usage_logs FOR SELECT TO authenticated
      USING (company_id = public.get_user_company_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ai_usage_logs' AND policyname = 'ai_usage_logs_insert_own'
  ) THEN
    CREATE POLICY "ai_usage_logs_insert_own"
      ON public.ai_usage_logs FOR INSERT TO authenticated
      WITH CHECK (company_id = public.get_user_company_id());
  END IF;
END $$;

COMMENT ON TABLE public.ai_usage_logs IS 'Track AI API usage for billing and analytics';

-- 2) model_experiments: A/B testing framework
CREATE TABLE IF NOT EXISTS public.model_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  module_id text NOT NULL,
  experiment_name text NOT NULL,
  model_a text NOT NULL,
  model_b text NOT NULL,
  traffic_split numeric(3, 2) DEFAULT 0.5 CHECK (traffic_split >= 0 AND traffic_split <= 1),
  metrics jsonb DEFAULT '{}',
  winner text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_model_experiments_company_id ON public.model_experiments(company_id);
CREATE INDEX IF NOT EXISTS idx_model_experiments_status ON public.model_experiments(status);

ALTER TABLE public.model_experiments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'model_experiments' AND policyname = 'model_experiments_own'
  ) THEN
    CREATE POLICY "model_experiments_own"
      ON public.model_experiments FOR ALL TO authenticated
      USING (company_id = public.get_user_company_id())
      WITH CHECK (company_id = public.get_user_company_id());
  END IF;
END $$;

COMMENT ON TABLE public.model_experiments IS 'A/B testing for different AI models';

-- 3) api_requests: Gateway request logging
CREATE TABLE IF NOT EXISTS public.api_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  endpoint text NOT NULL,
  method text NOT NULL,
  status_code int NOT NULL,
  latency_ms int DEFAULT 0,
  request_size int DEFAULT 0,
  response_size int DEFAULT 0,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_requests_company_id ON public.api_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_api_requests_created_at ON public.api_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_api_requests_endpoint ON public.api_requests(endpoint);

ALTER TABLE public.api_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'api_requests' AND policyname = 'api_requests_select_own'
  ) THEN
    CREATE POLICY "api_requests_select_own"
      ON public.api_requests FOR SELECT TO authenticated
      USING (company_id = public.get_user_company_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'api_requests' AND policyname = 'api_requests_insert_own'
  ) THEN
    CREATE POLICY "api_requests_insert_own"
      ON public.api_requests FOR INSERT TO authenticated
      WITH CHECK (company_id = public.get_user_company_id());
  END IF;
END $$;

COMMENT ON TABLE public.api_requests IS 'API Gateway request logs for monitoring and rate limiting';

-- 4) Add settings column to companies table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'settings'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN settings jsonb DEFAULT '{}';
  END IF;
END $$;

COMMENT ON COLUMN public.companies.settings IS 'Company settings including AI model preferences, rate limits, etc.';

-- 5) Create view for daily usage statistics
CREATE OR REPLACE VIEW public.daily_ai_usage AS
SELECT
  company_id,
  DATE(created_at) as date,
  COUNT(*) as total_requests,
  SUM(total_tokens) as total_tokens,
  SUM(cost_usd) as total_cost_usd,
  AVG(latency_ms) as avg_latency_ms,
  SUM(CASE WHEN cached THEN 1 ELSE 0 END)::float / COUNT(*) as cache_hit_rate,
  jsonb_object_agg(model, COUNT(*)) as requests_by_model
FROM public.ai_usage_logs
GROUP BY company_id, DATE(created_at);

COMMENT ON VIEW public.daily_ai_usage IS 'Daily aggregated AI usage statistics per company';




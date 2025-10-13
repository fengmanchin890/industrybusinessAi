-- Add data connections for external integrations (ERP/POS/Excel/PLC ...)
-- Safe to run multiple times (IF NOT EXISTS guards)

-- 1) data_connections: generic connection registry
CREATE TABLE IF NOT EXISTS public.data_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  connection_type text NOT NULL, -- 'erp' | 'pos' | 'excel' | 'plc' | ...
  connection_name text NOT NULL,
  connection_config jsonb NOT NULL, -- baseUrl、token、檔名…等設定
  status text NOT NULL DEFAULT 'active', -- active / inactive
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_connections_company_id ON public.data_connections(company_id);
CREATE INDEX IF NOT EXISTS idx_data_connections_type ON public.data_connections(connection_type);

-- RLS (same-company only)
ALTER TABLE public.data_connections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'data_connections' AND policyname = 'data_connections_select_own_company'
  ) THEN
    CREATE POLICY "data_connections_select_own_company"
      ON public.data_connections FOR SELECT TO authenticated
      USING (company_id = public.get_user_company_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'data_connections' AND policyname = 'data_connections_manage_own_company'
  ) THEN
    CREATE POLICY "data_connections_manage_own_company"
      ON public.data_connections FOR ALL TO authenticated
      USING (company_id = public.get_user_company_id())
      WITH CHECK (company_id = public.get_user_company_id());
  END IF;
END $$;

COMMENT ON TABLE public.data_connections IS 'Generic connection registry for ERP/POS/Excel/PLC etc.';
COMMENT ON COLUMN public.data_connections.connection_config IS 'JSON config (e.g., baseUrl, token, fileName).';

-- 2) (Optional) sync_jobs & sync_logs for scheduled synchronization
CREATE TABLE IF NOT EXISTS public.sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  connection_id uuid NOT NULL REFERENCES public.data_connections(id) ON DELETE CASCADE,
  dataset text NOT NULL, -- 'menu' | 'sales' | ...
  schedule text NOT NULL DEFAULT 'daily', -- cron/labels
  last_run timestamptz,
  next_run timestamptz,
  status text NOT NULL DEFAULT 'idle', -- idle/running/error
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.sync_jobs(id) ON DELETE CASCADE,
  run_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL,
  message text,
  details jsonb
);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_company_id ON public.sync_jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_connection_id ON public.sync_jobs(connection_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_job_id ON public.sync_logs(job_id);

ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sync_jobs' AND policyname = 'sync_jobs_own'
  ) THEN
    CREATE POLICY "sync_jobs_own"
      ON public.sync_jobs FOR ALL TO authenticated
      USING (company_id = public.get_user_company_id())
      WITH CHECK (company_id = public.get_user_company_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sync_logs' AND policyname = 'sync_logs_own'
  ) THEN
    CREATE POLICY "sync_logs_own"
      ON public.sync_logs FOR SELECT TO authenticated
      USING (job_id IN (SELECT id FROM public.sync_jobs WHERE company_id = public.get_user_company_id()));
  END IF;
END $$;

COMMENT ON TABLE public.sync_jobs IS 'Scheduled sync jobs for data connections.';
COMMENT ON TABLE public.sync_logs IS 'Execution logs of sync jobs.';



-- marketing settings for brand assets and social links
CREATE TABLE IF NOT EXISTS public.marketing_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  logo_url text,
  website text,
  facebook text,
  instagram text,
  line text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.marketing_settings ENABLE ROW LEVEL SECURITY;

-- company can manage its own settings
DO $$ BEGIN
  CREATE POLICY marketing_settings_select ON public.marketing_settings
    FOR SELECT TO authenticated
    USING (company_id = public.get_user_company_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY marketing_settings_manage ON public.marketing_settings
    FOR ALL TO authenticated
    USING (company_id = public.get_user_company_id())
    WITH CHECK (company_id = public.get_user_company_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_marketing_settings_company ON public.marketing_settings(company_id);



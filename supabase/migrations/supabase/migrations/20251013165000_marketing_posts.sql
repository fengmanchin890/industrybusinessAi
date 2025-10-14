create extension if not exists pgcrypto;

create table if not exists public.marketing_posts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  channel text check (channel in ('facebook','instagram','line','other')) default 'other',
  title text,
  content text,
  media_urls text[] default '{}',
  status text check (status in ('draft','scheduled','published','failed')) default 'draft',
  scheduled_at timestamptz,
  created_by uuid references public.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.marketing_posts enable row level security;

do $$ begin
  perform 1 from pg_policies where schemaname='public' and tablename='marketing_posts' and policyname='marketing_posts_select';
  if not found then
    create policy marketing_posts_select on public.marketing_posts
      for select to authenticated
      using (company_id = public.get_user_company_id());
  end if;
end $$;

do $$ begin
  perform 1 from pg_policies where schemaname='public' and tablename='marketing_posts' and policyname='marketing_posts_manage';
  if not found then
    create policy marketing_posts_manage on public.marketing_posts
      for all to authenticated
      using (company_id = public.get_user_company_id())
      with check (company_id = public.get_user_company_id());
  end if;
end $$;

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_marketing_posts_updated_at on public.marketing_posts;
create trigger trg_marketing_posts_updated_at
before update on public.marketing_posts
for each row execute function public.set_updated_at();
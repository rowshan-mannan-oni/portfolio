create table public.site_visitors (
  id uuid primary key,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index site_visitors_last_seen_idx on public.site_visitors (last_seen_at);
alter table public.site_visitors enable row level security;
revoke all on public.site_visitors from anon, authenticated;
grant select on public.site_visitors to authenticated;
grant all on public.site_visitors to service_role;
create policy "Admins read visitor analytics" on public.site_visitors
  for select to authenticated using ((select public.is_admin()));

create function public.record_site_visit(visitor_id uuid)
returns void language sql security invoker set search_path = '' as $$
  insert into public.site_visitors (id) values (visitor_id)
  on conflict (id) do update set last_seen_at = now();
$$;
revoke all on function public.record_site_visit(uuid) from public, anon, authenticated;
grant execute on function public.record_site_visit(uuid) to service_role;

create function public.visitor_stats()
returns table (total bigint, active bigint)
language sql stable security invoker set search_path = '' as $$
  select count(*), count(*) filter (where last_seen_at > now() - interval '90 seconds')
  from public.site_visitors;
$$;
revoke all on function public.visitor_stats() from public, anon;
grant execute on function public.visitor_stats() to authenticated;

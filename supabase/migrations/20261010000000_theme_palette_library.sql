-- Named colour palettes saved from the dashboard (Theme & colours → My palettes).
-- These are drafts/options only; the live palette is site_settings.theme_palette.
-- Admin-only: never readable by the public.

create table if not exists public.theme_palettes (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique check (char_length(trim(name)) between 1 and 60),
  palette    jsonb not null check (jsonb_typeof(palette) = 'object'),
  created_at timestamptz not null default now()
);

revoke all on public.theme_palettes from anon, authenticated;
grant select, insert, update, delete on public.theme_palettes to authenticated;
grant all on public.theme_palettes to service_role;

alter table public.theme_palettes enable row level security;

create policy "Admins manage saved palettes"
  on public.theme_palettes for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Site colour palette overrides, edited in the dashboard (Theme & colours).
-- Shape: {"light": {"primary": "#0f766e", ...}, "dark": {...}} — only changed
-- tokens are stored; NULL means the built-in palette. Values are validated
-- again by the app before they reach any stylesheet.
alter table public.site_settings
  add column if not exists theme_palette jsonb
    check (theme_palette is null or jsonb_typeof(theme_palette) = 'object');

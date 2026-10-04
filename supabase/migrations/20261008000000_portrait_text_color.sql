-- Optional colour for the words behind the hero cutout (#RRGGBB).
-- NULL keeps the theme's teal, which adapts to light and dark mode.
alter table public.site_settings
  add column if not exists portrait_text_color text
    check (portrait_text_color ~* '^#[0-9a-f]{6}$');

-- =============================================================================
-- Hero portrait style: a normal photo, or a background-free cutout standing in
-- front of large editable text ("Software Engineer").
-- =============================================================================

alter table public.site_settings
  add column if not exists portrait_style text not null default 'photo'
    check (portrait_style in ('photo', 'cutout')),
  add column if not exists cutout_image_path text,
  add column if not exists portrait_backdrop_text text
    check (char_length(portrait_backdrop_text) <= 40);

comment on column public.site_settings.portrait_style is
  'photo = framed profile photo; cutout = transparent cutout in front of portrait_backdrop_text.';
comment on column public.site_settings.cutout_image_path is
  'Transparent PNG/WebP in the media bucket (profile/...). Falls back to the photo when empty.';

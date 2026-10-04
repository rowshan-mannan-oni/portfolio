-- Vertical position of the backdrop text behind the hero cutout.
alter table public.site_settings
  add column if not exists portrait_text_position text not null default 'center'
    check (portrait_text_position in ('top', 'center', 'bottom'));

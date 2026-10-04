-- Backdrop text can now span several staggered lines ("Eat / Sleep / Code /
-- Repeat"), so allow up to 120 characters instead of 40.
alter table public.site_settings
  drop constraint if exists site_settings_portrait_backdrop_text_check;

alter table public.site_settings
  add constraint site_settings_portrait_backdrop_text_check
    check (char_length(portrait_backdrop_text) <= 120);

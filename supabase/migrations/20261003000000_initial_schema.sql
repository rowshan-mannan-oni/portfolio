-- =============================================================================
-- Portfolio CMS — initial schema
-- Tables, constraints, indexes, triggers, the admin authorization model and
-- Row Level Security policies.
--
-- Run once against a fresh Supabase project (CLI: `supabase db push`, or paste
-- into the SQL Editor). Safe to read top-to-bottom; no data is inserted here.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------

-- Partial ISO-8601 dates: "2024", "2024-09" or "2024-09-15".
-- Lexicographic ordering of these strings matches chronological ordering.
create domain public.partial_date as text
  check (value ~ '^\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?)?$');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Authorization: admin_users
-- Being authenticated is NOT enough. A user is an administrator only when their
-- auth.users id appears in this table. Rows are inserted manually (SQL Editor).
-- -----------------------------------------------------------------------------

create table public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Users allowed to manage portfolio content. Insert rows manually via SQL.';

-- SECURITY DEFINER so policies can call it without granting read access to
-- admin_users. search_path is pinned to avoid hijacking.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Site settings (single row)
-- -----------------------------------------------------------------------------

create table public.site_settings (
  id                     boolean primary key default true check (id),
  full_name              text not null default 'Your Name',
  professional_title     text,
  monogram               text check (char_length(monogram) <= 4),
  hero_headline          text,
  hero_description       text,
  hero_focus_areas       text[] not null default '{}',
  about_heading          text,
  about_short_bio        text,
  about_long_bio         text,
  current_status         text,
  availability           text,
  research_intro         text,
  research_interests     text[] not null default '{}',
  author_names           text[] not null default '{}',
  location               text,
  email                  text,
  profile_image_path     text,
  profile_image_alt      text,
  profile_image_position text not null default 'center 30%',
  cv_path                text,
  cv_file_name           text,
  cv_updated_at          timestamptz,
  cv_visible             boolean not null default true,
  seo_title              text,
  seo_description        text,
  seo_keywords           text[] not null default '{}',
  og_image_path          text,
  footer_text            text,
  updated_at             timestamptz not null default now()
);

create table public.section_settings (
  key           text primary key check (key in (
                  'about', 'experience', 'research', 'publications', 'projects',
                  'skills', 'education', 'awards', 'blog', 'contact')),
  visible       boolean not null default true,
  nav_label     text,
  heading       text not null,
  subheading    text,
  display_order integer not null default 0,
  updated_at    timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Contact & social links
-- -----------------------------------------------------------------------------

create table public.social_links (
  id            uuid primary key default gen_random_uuid(),
  platform      text not null default 'custom' check (platform in (
                  'email', 'phone', 'location', 'website', 'github', 'linkedin',
                  'google_scholar', 'orcid', 'researchgate', 'semantic_scholar',
                  'arxiv', 'codeforces', 'leetcode', 'kaggle', 'huggingface',
                  'x', 'youtube', 'medium', 'custom')),
  label         text not null,
  value         text, -- URL, e-mail address, phone number or plain text
  display_order integer not null default 0,
  visible       boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index social_links_order_idx on public.social_links (display_order);

-- -----------------------------------------------------------------------------
-- Experience & education
-- -----------------------------------------------------------------------------

create table public.experiences (
  id                   uuid primary key default gen_random_uuid(),
  organization         text not null,
  organization_url     text,
  organization_logo    text, -- storage path in the "media" bucket
  role                 text not null,
  employment_type      text,
  location             text,
  start_date           public.partial_date,
  end_date             public.partial_date,
  currently_working    boolean not null default false,
  short_description    text,
  detailed_description text,
  achievements         text[] not null default '{}',
  technologies         text[] not null default '{}',
  display_order        integer not null default 0,
  visible              boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index experiences_order_idx on public.experiences (display_order);

create table public.education (
  id              uuid primary key default gen_random_uuid(),
  institution     text not null,
  degree          text,
  department      text,
  location        text,
  start_date      public.partial_date,
  end_date        public.partial_date,
  grade           text,
  description     text,
  logo            text, -- storage path
  institution_url text,
  display_order   integer not null default 0,
  visible         boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index education_order_idx on public.education (display_order);

-- -----------------------------------------------------------------------------
-- Publications & research
-- -----------------------------------------------------------------------------

create table public.publications (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  slug          text unique,
  authors       text[] not null default '{}',
  venue         text,
  venue_type    text check (venue_type in (
                  'journal', 'conference', 'workshop', 'preprint', 'thesis',
                  'book_chapter', 'other')),
  publisher     text,
  year          integer check (year between 1900 and 2200),
  volume        text,
  issue         text,
  pages         text,
  quartile      text,
  doi           text,
  abstract      text,
  citation      text,
  publisher_url text,
  pdf_url       text,
  code_url      text,
  dataset_url   text,
  image         text, -- storage path
  image_alt     text,
  featured      boolean not null default false,
  visible       boolean not null default true,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index publications_order_idx on public.publications (display_order);

create table public.research (
  id                     uuid primary key default gen_random_uuid(),
  title                  text not null,
  short_description      text,
  problem                text,
  approach               text,
  significance           text,
  full_description       text, -- Markdown
  research_type          text,
  institution            text,
  supervisor             text,
  start_date             public.partial_date,
  end_date               public.partial_date,
  status                 text,
  keywords               text[] not null default '{}',
  methods                text[] not null default '{}',
  dataset                text,
  highlights             text[] not null default '{}',
  image                  text, -- storage path
  image_alt              text,
  paper_url              text,
  code_url               text,
  project_url            text,
  related_publication_id uuid references public.publications (id) on delete set null,
  featured               boolean not null default false,
  visible                boolean not null default true,
  display_order          integer not null default 0,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index research_order_idx on public.research (display_order);
create index research_related_publication_idx on public.research (related_publication_id);

-- -----------------------------------------------------------------------------
-- Projects
-- -----------------------------------------------------------------------------

create table public.projects (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  slug              text not null unique,
  short_description text,
  full_description  text, -- Markdown
  start_date        public.partial_date,
  end_date          public.partial_date,
  organization      text,
  role              text,
  technologies      text[] not null default '{}',
  thumbnail         text, -- storage path
  thumbnail_alt     text,
  github_url        text,
  live_url          text,
  video_url         text,
  docs_url          text,
  paper_url         text,
  featured          boolean not null default false,
  status            text check (status in ('active', 'completed', 'research', 'archived')),
  display_order     integer not null default 0,
  visible           boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index projects_order_idx on public.projects (featured desc, display_order);

create table public.project_images (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects (id) on delete cascade,
  path          text not null,
  alt_text      text,
  caption       text,
  display_order integer not null default 0,
  created_at    timestamptz not null default now()
);

create index project_images_project_idx on public.project_images (project_id, display_order);

-- -----------------------------------------------------------------------------
-- Skills
-- -----------------------------------------------------------------------------

create table public.skill_categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  description   text,
  display_order integer not null default 0,
  visible       boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.skills (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid not null references public.skill_categories (id) on delete cascade,
  name          text not null,
  icon          text,
  proficiency   text,
  featured      boolean not null default false,
  display_order integer not null default 0,
  visible       boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (category_id, name)
);

create index skills_category_order_idx on public.skills (category_id, display_order);

-- -----------------------------------------------------------------------------
-- Awards
-- -----------------------------------------------------------------------------

create table public.awards (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  issuer        text,
  award_date    public.partial_date,
  description   text,
  url           text,
  image         text, -- storage path
  image_alt     text,
  featured      boolean not null default false,
  visible       boolean not null default true,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index awards_order_idx on public.awards (display_order);

-- -----------------------------------------------------------------------------
-- Blog
-- Tags are stored as a normalized lowercase text[] — pragmatic for a personal
-- blog and indexable with GIN.
-- -----------------------------------------------------------------------------

create table public.blog_posts (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  excerpt         text,
  content         text not null default '',
  cover_image     text, -- storage path
  cover_image_alt text,
  tags            text[] not null default '{}',
  status          text not null default 'draft' check (status in ('draft', 'published')),
  featured        boolean not null default false,
  published_at    timestamptz,
  seo_title       text,
  seo_description text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index blog_posts_published_idx on public.blog_posts (status, published_at desc);
create index blog_posts_tags_idx on public.blog_posts using gin (tags);

-- -----------------------------------------------------------------------------
-- Contact messages
-- Inserted only by the server (secret key) after validation, honeypot, timing
-- and rate-limit checks. Never readable by the public.
-- -----------------------------------------------------------------------------

create table public.contact_messages (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 1 and 120),
  email        text not null check (char_length(email) between 3 and 254),
  organization text check (char_length(organization) <= 160),
  subject      text not null check (char_length(subject) between 1 and 200),
  message      text not null check (char_length(message) between 1 and 5000),
  status       text not null default 'unread' check (status in ('unread', 'read', 'archived')),
  ip_hash      text, -- salted SHA-256, never the raw IP
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index contact_messages_status_idx on public.contact_messages (status, created_at desc);
create index contact_messages_ip_hash_idx on public.contact_messages (ip_hash, created_at desc);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'site_settings', 'section_settings', 'social_links', 'experiences',
    'education', 'publications', 'research', 'projects', 'skill_categories',
    'skills', 'awards', 'blog_posts'
  ]
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t);
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- Privileges
-- Explicit grants (do not rely on platform defaults). anon can only read;
-- authenticated users may attempt writes, which RLS restricts to admins.
-- -----------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;

grant select on
  public.site_settings, public.section_settings, public.social_links,
  public.experiences, public.education, public.publications, public.research,
  public.projects, public.project_images, public.skill_categories, public.skills,
  public.awards, public.blog_posts
to anon, authenticated;

grant insert, update, delete on
  public.site_settings, public.section_settings, public.social_links,
  public.experiences, public.education, public.publications, public.research,
  public.projects, public.project_images, public.skill_categories, public.skills,
  public.awards, public.blog_posts
to authenticated;

grant select, update, delete on public.contact_messages to authenticated;
grant select on public.admin_users to authenticated;

-- The server-side secret key (service_role) is used only for contact-form
-- inserts and rate-limit lookups.
grant all on all tables in schema public to service_role;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table public.admin_users      enable row level security;
alter table public.site_settings    enable row level security;
alter table public.section_settings enable row level security;
alter table public.social_links     enable row level security;
alter table public.experiences      enable row level security;
alter table public.education        enable row level security;
alter table public.publications     enable row level security;
alter table public.research         enable row level security;
alter table public.projects         enable row level security;
alter table public.project_images   enable row level security;
alter table public.skill_categories enable row level security;
alter table public.skills           enable row level security;
alter table public.awards           enable row level security;
alter table public.blog_posts       enable row level security;
alter table public.contact_messages enable row level security;

-- admin_users: a signed-in user may only see their own row. No write policies:
-- membership is managed manually through the SQL Editor (service role).
create policy "Users can read their own admin row"
  on public.admin_users for select to authenticated
  using (user_id = (select auth.uid()));

-- Settings are entirely public (they contain no secrets).
create policy "Public can read site settings"
  on public.site_settings for select to anon, authenticated using (true);
create policy "Admins manage site settings"
  on public.site_settings for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Public can read section settings"
  on public.section_settings for select to anon, authenticated using (true);
create policy "Admins manage section settings"
  on public.section_settings for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Visibility-gated content tables: the public sees visible rows only; admins
-- see and manage everything.
do $$
declare
  t text;
begin
  foreach t in array array[
    'social_links', 'experiences', 'education', 'publications', 'research',
    'projects', 'skill_categories', 'awards'
  ]
  loop
    execute format(
      'create policy "Public can read visible rows" on public.%I
         for select to anon, authenticated
         using (visible or (select public.is_admin()))', t);
    execute format(
      'create policy "Admins can insert" on public.%I
         for insert to authenticated with check ((select public.is_admin()))', t);
    execute format(
      'create policy "Admins can update" on public.%I
         for update to authenticated
         using ((select public.is_admin())) with check ((select public.is_admin()))', t);
    execute format(
      'create policy "Admins can delete" on public.%I
         for delete to authenticated using ((select public.is_admin()))', t);
  end loop;
end;
$$;

-- Skills: visible only when the skill AND its category are visible.
create policy "Public can read visible skills"
  on public.skills for select to anon, authenticated
  using (
    (select public.is_admin())
    or (
      visible
      and exists (
        select 1 from public.skill_categories c
        where c.id = category_id and c.visible
      )
    )
  );
create policy "Admins manage skills"
  on public.skills for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Project images inherit their project's visibility.
create policy "Public can read images of visible projects"
  on public.project_images for select to anon, authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from public.projects p where p.id = project_id and p.visible
    )
  );
create policy "Admins manage project images"
  on public.project_images for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Blog: drafts and scheduled posts are never public.
create policy "Public can read published posts"
  on public.blog_posts for select to anon, authenticated
  using (
    (status = 'published' and published_at is not null and published_at <= now())
    or (select public.is_admin())
  );
create policy "Admins manage posts"
  on public.blog_posts for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Contact messages: admins only. No insert policy — public submissions go
-- through the server, which uses the secret key after validating input.
create policy "Admins can read messages"
  on public.contact_messages for select to authenticated
  using ((select public.is_admin()));
create policy "Admins can update messages"
  on public.contact_messages for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins can delete messages"
  on public.contact_messages for delete to authenticated
  using ((select public.is_admin()));

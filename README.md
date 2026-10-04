# Rowshan Mannan Oni — Portfolio & CMS

The personal website of **Rowshan Mannan Oni, Software Engineer & AI Researcher**. It is a full-stack Next.js app: a single-page public portfolio, a Markdown blog, and a private content-management dashboard. Everything is stored in Supabase.

It is built to run on **free tiers** (Vercel Hobby + Supabase Free) at a `*.vercel.app` address, and it can move to paid infrastructure or a custom domain later without code changes.

> **Deploying for the first time?** Follow **[DEPLOYMENT.md](DEPLOYMENT.md)**. It walks through Supabase, GitHub and Vercel step by step.

---

## Contents

1. [Features](#features)
2. [Stack](#stack)
3. [Architecture](#architecture)
4. [Project structure](#project-structure)
5. [Local development](#local-development)
6. [Environment variables](#environment-variables)
7. [Database: migrations & seed data](#database-migrations--seed-data)
8. [Authentication & the first admin](#authentication--the-first-admin)
9. [Storage](#storage)
10. [Security model](#security-model)
11. [Content management](#content-management)
12. [Quality checks](#quality-checks)
13. [Design system](#design-system)

---

## Features

**Public portfolio (`/`)**: one long page with these sections, in an order you control:

| Section | Notes |
|---|---|
| Hero | Name, title, headline, introduction, CTAs, focus areas, profile photo (with a monogram fallback, never a broken image) |
| About | Lead sentence, short bio, Markdown biography, quick facts |
| Experience | Timeline (collapses to a single column on phones) |
| Research | Research interests plus narrative cards: problem → approach → why it matters, methods, key findings, expandable details |
| Publications | Academic-style list: year, venue type, highlighted own name, quartile badge, Publisher / DOI / PDF / Code / Dataset actions, copy-citation (IEEE format auto-generated), abstract |
| Projects | Featured projects get an editorial layout with a gallery lightbox. Others get compact cards. |
| Skills | Grouped categories, no fake percentages |
| Education, Honors & Awards | Compact and restrained |
| Writing | The 3 latest posts; hidden automatically when no posts are published |
| Contact | Links managed in the database, plus a protected contact form |

- **Blog**: `/blog` and `/blog/[slug]`. Markdown with code highlighting, responsive tables and images, reading time, native share / copy-link, per-post SEO and `BlogPosting` structured data.
- **Admin CMS** at `/oni_the_boss` (protected). You can edit everything: profile, sections, CV, social links, experience, research, publications, projects (with screenshot galleries), skills, education, awards, blog, contact messages and a media library.
- **Light / dark themes**: light by default, the choice persists, and there is no flash on load.
- **SEO**: dynamic metadata, Open Graph / X cards, a generated social image (`/og`), `sitemap.xml`, `robots.txt`, and JSON-LD (`Person`, `ScholarlyArticle`, `BlogPosting`).
- **Missing data never breaks the layout.** Every optional field is rendered conditionally. Empty sections, links, buttons, images and separators disappear instead of leaving gaps.

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router, React Server Components, Server Actions, `proxy.ts`) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 with CSS-variable design tokens (`app/globals.css`) |
| Database | Supabase Postgres with Row Level Security |
| Auth | Supabase Auth (email + password, cookie sessions via `@supabase/ssr`) |
| Files | Supabase Storage (`media` and `documents` buckets) |
| Validation | Zod 4 (every server mutation) |
| Markdown | `react-markdown` + GFM + `rehype-sanitize` + `rehype-highlight` (raw HTML is never rendered) |
| Icons / UI | `lucide-react`, `simple-icons` (brand marks bundled locally), `sonner` toasts (admin only) |
| Fonts | Geist, Geist Mono, Newsreader via `next/font` (self-hosted, no layout shift) |
| Hosting | Vercel Hobby |

There are no paid services and no third-party scripts.

## Architecture

```
Visitor ──► Vercel (Next.js)
             ├─ Public pages: statically generated, revalidated hourly AND immediately
             │   after any admin edit (revalidateTag + revalidatePath)
             │   └─ reads Supabase with the publishable key, no cookies → RLS returns
             │      only visible / published rows
             ├─ Contact form: Server Action → validation, honeypot, timing, rate limit
             │   └─ inserts with the SECRET key (server-only)
             └─ /oni_the_boss: rendered per request
                 ├─ proxy.ts refreshes the session cookie, optimistic redirect to login
                 ├─ dashboard layout: verifies JWT (getClaims) + admin_users membership
                 ├─ every Server Action: requireAdmin() + Zod validation
                 └─ browser uploads go straight to Supabase Storage with the admin's
                    session (storage RLS: admins only)
Supabase
 ├─ Postgres: content tables + RLS + is_admin()
 ├─ Auth: one manually created admin user
 └─ Storage: media (images, public read) · documents (CV PDF, public read)
```

Content is separate from presentation. No project, job, publication, link, skill or award is hard-coded in a component; all of it comes from the database.

## Project structure

```
app/
  (public)/            homepage, blog, error boundary — public layout with nav/footer
  oni_the_boss/        admin: login + (dashboard)/… pages; [entity] handles generic CRUD
  actions/contact.ts   public contact-form Server Action
  og/route.tsx         generated Open Graph image
  sitemap.ts robots.ts icon.svg not-found.tsx global-error.tsx layout.tsx globals.css
components/
  public/              portfolio sections, header, footer, theme toggle, gallery…
  admin/               dashboard shell, form kit, uploads, editors, managers
  markdown.tsx         shared safe Markdown renderer
lib/
  supabase/            server (cookies), client (browser), public (cached, anon), admin (secret), proxy
  data/public.ts       public read layer (RLS-scoped, cached, null-safe)
  admin/               entity config, Server Actions, upload helper, route constants
  validation/          Zod schemas (entities, contact, shared field parsers)
  format/date.ts       the single date-formatting layer
  auth.ts storage.ts site.ts citation.ts theme.ts env.ts utils.ts
types/database.ts      typed schema (same shape as `supabase gen types`)
supabase/
  migrations/          schema, RLS, triggers, storage buckets and policies
  seed.sql             initial content taken from the CV (unknown facts stay NULL)
proxy.ts               session refresh + optimistic admin redirect (Next 16 "middleware")
```

## Local development

Requirements: **Node.js 20.9+** and npm. You also need a Supabase project; the free hosted one is simplest, and the [local CLI stack](#option-b--supabase-cli) is optional.

```bash
# 1. Clone and install
git clone https://github.com/<you>/<repo>.git portfolio
cd portfolio
npm install

# 2. Configure environment
cp .env.example .env.local      # then fill in the values (see below)
```

3. **Create the database.** Run `supabase/migrations/*.sql` in order, then `supabase/seed.sql`. See [Database](#database-migrations--seed-data).
4. **Create your admin account.** See [Authentication](#authentication--the-first-admin).
5. **Run the app:**

```bash
npm run dev
```

Open <http://localhost:3000> for the portfolio and <http://localhost:3000/oni_the_boss> for the dashboard.

Without Supabase variables the site still builds and renders, with empty content. That is useful for UI work, but nothing can be edited.

## Environment variables

All variables are documented in [`.env.example`](.env.example).

For a free initial test without buying a domain, create a Resend Free account using **rowshanmannanoni@gmail.com**. Set `RESEND_API_KEY` to your API key and `CONTACT_EMAIL_FROM` to `Portfolio <onboarding@resend.dev>`. This test sender is restricted to your Resend account's email address and is intended for testing; production sending uses a verified domain. Resend's Free quota is currently 100 emails per day and 3,000 per month. Put real credentials in `.env` or your hosting environment, never `.env.example`.

Contact submissions are saved in the dashboard and emailed to **rowshanmannanoni@gmail.com**. Set server-only `RESEND_API_KEY` and `CONTACT_EMAIL_FROM` in your local environment and hosting environment, then redeploy. Use a sender on a verified Resend domain. Replies go to the visitor's email address. Without these variables, the form asks visitors to email directly. If email delivery fails after saving, the dashboard retains the message and the visitor sees an explicit notification failure.

| Variable | Where | Required | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | **yes** | Project URL, e.g. `https://abcd.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | browser + server | **yes** | Publishable key (`sb_publishable_…`). Safe to expose because RLS protects data. The legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` is also accepted. |
| `SUPABASE_SECRET_KEY` | **server only** | for the contact form | Secret key (`sb_secret_…`). Used only to insert contact messages and count recent ones for rate limiting. It bypasses RLS, so never prefix it with `NEXT_PUBLIC_`. The legacy `SUPABASE_SERVICE_ROLE_KEY` is also accepted. |
| `NEXT_PUBLIC_SITE_URL` | browser + server | recommended | Canonical origin without a trailing slash, e.g. `https://rowshan.vercel.app`. On Vercel it falls back to the production URL automatically. |
| `CONTACT_IP_SALT` | server only | optional | Random string used to hash visitor IPs for rate limiting. If unset, a value derived from the secret key is used. |

Without `SUPABASE_SECRET_KEY` everything else works. The contact form then politely asks visitors to use email instead.

## Database: migrations & seed data

| File | What it does |
|---|---|
| `supabase/migrations/20261003000000_initial_schema.sql` | All tables, constraints, indexes, `updated_at` triggers, the `partial_date` domain, `admin_users` + `is_admin()`, explicit grants and every RLS policy |
| `supabase/migrations/20261003000100_storage.sql` | `media` and `documents` buckets (with MIME and size limits) and their storage policies |
| `supabase/migrations/20261005000000_portrait_style.sql` | Hero portrait style: photo, or a background-free cutout in front of editable text |
| `supabase/migrations/20261006000000_portrait_text_position.sql` | Position of that text (top, centre, bottom) |
| `supabase/migrations/20261007000000_backdrop_text_lines.sql` | Allows multi-line, staggered backdrop text (up to 120 characters) |
| `supabase/migrations/20261008000000_portrait_text_color.sql` | Optional custom colour for that text |
| `supabase/migrations/20261009000000_theme_palette.sql` | Site colour palette overrides (Theme & colours page) |
| `supabase/migrations/20261010000000_theme_palette_library.sql` | Saved, named palettes ("My palettes"), admin-only |
| `supabase/seed.sql` | Initial content from the CV. Safe to re-run: it only fills empty tables and never overwrites your edits. |

**Tables:** `admin_users`, `site_settings` (single row), `section_settings`, `social_links`, `experiences`, `education`, `research`, `publications`, `projects`, `project_images`, `skill_categories`, `skills`, `awards`, `blog_posts` (tags as a normalized `text[]` with a GIN index), `contact_messages`.

Dates for experience, education, research, projects and awards use a **partial ISO date** (`"2024"`, `"2024-09"` or `"2024-09-15"`). That way a year-only fact never needs an invented month or day, and the strings still sort chronologically.

### Option A — SQL Editor (no tools needed)

In the Supabase dashboard, open **SQL Editor → New query** and run, in order:

1. the contents of `supabase/migrations/20261003000000_initial_schema.sql`
2. the contents of `supabase/migrations/20261003000100_storage.sql`
3. the contents of `supabase/migrations/20261005000000_portrait_style.sql`
4. the contents of `supabase/migrations/20261006000000_portrait_text_position.sql`
5. the contents of `supabase/migrations/20261007000000_backdrop_text_lines.sql`
6. the contents of `supabase/migrations/20261008000000_portrait_text_color.sql`
7. the contents of `supabase/migrations/20261009000000_theme_palette.sql`
8. the contents of `supabase/migrations/20261010000000_theme_palette_library.sql`
9. the contents of `supabase/seed.sql`

### Option B — Supabase CLI

```bash
npx supabase init            # once; creates supabase/config.toml, keeps existing migrations
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push         # applies supabase/migrations
```

Then run `supabase/seed.sql` in the SQL Editor (or `psql "<connection string>" -f supabase/seed.sql`).

For a fully local stack (requires Docker), `npx supabase start` followed by `npx supabase db reset` applies the migrations and the seed automatically. Use the local URL and keys it prints.

**Regenerating types** after schema changes (optional):

```bash
npx supabase gen types typescript --project-id <ref> > types/database.generated.ts
```

## Authentication & the first admin

There is no public sign-up anywhere. Being signed in is not enough to manage content: a user must also appear in `public.admin_users`.

1. Supabase dashboard → **Authentication → Users → Add user → Create new user**. Enter your email and a strong password, and tick **Auto Confirm User**.
2. Copy the new user's **UID**.
3. In the **SQL Editor**, run:

   ```sql
   insert into public.admin_users (user_id) values ('PASTE-YOUR-UID-HERE');
   ```

4. Sign in at `/oni_the_boss/login`.

Recommended: in **Authentication → Sign In / Providers**, turn off **Allow new users to sign up**. The app never offers sign-up, but this also closes the door at the API level.

## Storage

Both buckets are created by the storage migration. You don't need to click anything.

| Bucket | Public read | Allowed types | Max size | Used for |
|---|---|---|---|---|
| `media` | yes | JPEG, PNG, WebP, AVIF, GIF (no SVG, which can carry scripts) | 5 MB | profile photo, project thumbnails and screenshots, logos, research figures, blog covers, OG image, media library |
| `documents` | yes | PDF | 10 MB | CV |

- Uploading, replacing and deleting are allowed **only for admins** (storage RLS).
- The browser uploads directly to Storage using the admin session. This shows real progress and avoids serverless body limits.
- Files are named `folder/<slug>-<random>.<ext>`.
- Replacing or removing an image deletes the old file after you save. Deleting a project removes its thumbnail and screenshots.
- Files in `media/library/` (the media library) are shared and are **never** removed automatically.
- When you upload a CV, the server checks the PDF's magic bytes. The previous CV file is deleted when you replace it.

## Security model

- **Row Level Security is enabled on every table.**
  - Anonymous visitors can only `SELECT`, and only visible rows. Drafts and scheduled posts are invisible to them (`status = 'published' and published_at <= now()`). Skills require a visible category, and project images require a visible project.
  - `contact_messages` cannot be read or written by anonymous users at all.
  - Authenticated users have write privileges at the grant level, but every write policy requires `public.is_admin()`. A signed-in non-admin can do nothing.
  - `admin_users` has no write policies, so nobody can promote themselves through the API.
  - Grants are explicit (`revoke all`, then a minimal `grant`), so the setup does not depend on platform defaults.
- **Authorization is enforced in three places:** the dashboard layout, every Server Action (`requireAdmin()` verifies the JWT with `getClaims()` and checks `admin_users`), and the database (RLS). The obscure `/oni_the_boss` path is not a security measure. The proxy redirect is only a convenience.
- **The secret key is server-only.** It is read only in `lib/supabase/admin.ts`, which imports `server-only` so the build fails if a client component ever imports it. It is used only for contact-form inserts and rate-limit counts.
- **Contact form** protections:
  - Zod validation with length limits and control-character stripping
  - a hidden honeypot field
  - a minimum fill time
  - per-IP (3/hour) and global (30/hour) rate limits, using a salted SHA-256 hash of the IP (the raw IP is never stored)
  - inserts that can only happen server-side
- **Input and output:**
  - Every mutation is validated with Zod.
  - URLs must be `http(s)`, and `safeUrl()` blocks `javascript:`/`data:` links when rendering.
  - Markdown never renders raw HTML and is sanitized.
  - JSON-LD escapes `<`.
  - Error messages shown to users are generic, and details go to server logs only.
- **Headers:**
  - a Content-Security-Policy (no plugins, no framing, Supabase-only connections)
  - HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy` and `Permissions-Policy`
  - admin pages also send `X-Robots-Tag: noindex` and `Cache-Control: no-store`

  The dashboard (`/oni_the_boss/*`) has its own CSP, which additionally allows WebAssembly, `blob:` scripts, jsDelivr and the Hugging Face Hub. These are needed only by the in-browser background remover; public pages never get these allowances.

  The CSP allows inline scripts because Next.js and the no-flash theme script need them. A nonce-based CSP would force every page to render dynamically and give up static caching.
- `/oni_the_boss` is excluded from the sitemap and sends `noindex`. It is deliberately **not** listed in `robots.txt`, because that file is public and would advertise the path.

## Content management

Go to **`/<your-site>/oni_the_boss`** and sign in.

| Area | What you can do |
|---|---|
| Overview | Counts (projects, publications, posts, drafts, unread messages), shortcuts, setup checklist |
| Hero portrait | Choose **Photo** or **Cutout with text behind**. The cutout can be generated in the browser with one click (MODNet model via transformers.js, Apache-2.0; ~25 MB downloaded once, photo never leaves your browser) or uploaded as a transparent PNG/WebP. The backdrop words are editable. |
| Profile & SEO | Name, title, hero text, focus areas, about (Markdown), status/availability, research intro and interests, author-name variants (highlighted in publications), photo + alt text + crop focus, SEO title/description/keywords, social image, footer |
| Theme & colours | Every colour of the public site (16 tokens), separately for light and dark mode. Generate a full palette from one brand colour (presets included), fine-tune any token, preview both modes live and check WCAG contrast. Save palettes to "My palettes" (top of the page) to compare and reload them later, or delete them; only "Publish to site" changes the live colours. Only changes from the defaults are stored; "Default colours" restores the original teal. |
| Sections | Show/hide, rename, set subheadings and nav labels, reorder homepage sections. A hidden section disappears from the page and the navigation. |
| CV | Upload, replace (the old file is deleted), remove, show/hide the download buttons |
| Contact & social | Email, phone, location, website, GitHub, LinkedIn, Scholar, ORCID, ResearchGate… plus custom links. Entries without a value are never shown. |
| Experience / Research / Publications / Projects / Education / Awards | List with search and Visible/Hidden/Featured filters; create, edit, delete (with confirmation), show/hide, feature, move up/down |
| Projects → Screenshots | Upload several, edit alt text and caption, reorder, delete |
| Skills | Categories and skills inline: add, edit, hide, highlight, reorder |
| Blog | Draft → publish/unpublish, schedule with a future date, Markdown editor with live preview and reading time, auto slug (edited slugs stay put, collisions are handled), cover + alt, tags, featured, SEO overrides |
| Media library | Shared images for posts; copy a ready-made Markdown snippet |
| Messages | Inbox / Unread / Read / Archived, search, mark read/unread, archive, delete, reply by email |

Edits show up on the public site **immediately**, with no redeploy. Even without edits, pages refresh hourly.

**Theme behaviour:** new visitors get the light theme. An explicit choice made with the toggle is stored and always wins. The theme is applied before first paint, so there is no flash.

## Quality checks

```bash
npm run lint        # ESLint (next/core-web-vitals + TypeScript)
npm run typecheck   # tsc --noEmit
npm run build       # production build
npm run check       # all three
```

## Design system

Tokens live in `app/globals.css`: background, surface, foreground, muted, primary teal, soft teal and borders, with a separately tuned dark palette. Tailwind maps them to utilities such as `bg-surface`, `text-muted` and `border-border`.

There are a few small primitives: `.container-page`, `.section-y`, `.eyebrow`, `.meta`, `.chip`, `.badge`, `.card`, `.btn-*`, `.input`, `.link`, `.action-link`, and `.prose` for Markdown.

Typography is Geist for the interface, Geist Mono for metadata, and Newsreader italic for small editorial touches. Section reveals are subtle and turn off under `prefers-reduced-motion`.

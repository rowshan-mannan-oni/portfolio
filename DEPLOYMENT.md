# Deployment guide — Vercel + Supabase (free tiers)

This guide takes you from an empty Supabase account to a live site at `https://<something>.vercel.app` with a working admin dashboard. It assumes you know software engineering but have never deployed a Supabase + Vercel app before.

**Time needed:** about 30–45 minutes. **Cost:** $0.

| Part | Topic |
|---|---|
| [A](#part-a--supabase) | Supabase: project, keys, database, storage, admin user |
| [B](#part-b--github) | GitHub repository |
| [C](#part-c--vercel) | Vercel deployment and end-to-end tests |
| [D](#part-d--supabase-production-settings) | Supabase production URL settings |
| [E](#part-e--redeploying) | Redeploying |
| [F](#part-f--custom-domain-optional) | Custom domain (optional) |
| [G](#part-g--free-tier-maintenance) | Free-tier limits, and resuming a paused project |
| [H](#part-h--troubleshooting) | Troubleshooting |

> Supabase and Vercel occasionally rename menu items. If a label differs slightly, look for the closest equivalent; the concepts stay the same.

---

## Part A — Supabase

### A1. Create a free account

Go to <https://supabase.com> → **Start your project**, and sign up (GitHub sign-in is the quickest).

### A2. Create a project

1. **New project**, then pick your organization (the free plan is the default).
2. **Name:** e.g. `portfolio`.
3. **Database password:** click *Generate*, then store it in your password manager. The app does not need it, but you need it for direct database access or the CLI.
4. **Region:** choose the one closest to most visitors (e.g. *Central EU* or *Southeast Asia*).
5. Click **Create new project** and wait about 2 minutes for provisioning.

### A3. Find the Project URL

Click **Connect** at the top of the project page, or open **Project Settings → Data API**. Copy the **Project URL**, which looks like `https://abcdefghijklmnop.supabase.co`.

This becomes `NEXT_PUBLIC_SUPABASE_URL`.

### A4. Find the publishable key

Open **Project Settings → API Keys**. Copy the **Publishable key** (starts with `sb_publishable_`).

This becomes `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

> On older projects that only show **Legacy API keys**, use the `anon` `public` key instead. The app accepts either.

### A5. Get the secret key (needed for the contact form)

On the same **API Keys** page, under **Secret keys**, reveal and copy a secret key (starts with `sb_secret_`). If none exists, create one.

This becomes `SUPABASE_SECRET_KEY`. On legacy projects, use the `service_role` key.

### A6. Why the secret key must stay secret

The secret key **bypasses Row Level Security**. Anyone who has it can read and modify every table, including contact messages, and delete files. Therefore:

- never put it in a variable starting with `NEXT_PUBLIC_` (those are shipped to browsers);
- never commit it (`.env.local` is git-ignored);
- in this project it is used only on the server, for contact-form inserts. The publishable key is designed to be public because RLS limits what it can do.

If it ever leaks, go to **API Keys** to revoke it and create a new one, then update Vercel.

### A7. Run the migrations

**SQL Editor route (recommended, no tools needed):**

1. Open **SQL Editor → New query**.
2. Open `supabase/migrations/20261003000000_initial_schema.sql` from the repository, copy **all** of it, paste it, and click **Run**. You should see *Success. No rows returned*.
3. In a new query, do the same for `supabase/migrations/20261003000100_storage.sql`.
4. Then `supabase/migrations/20261005000000_portrait_style.sql` and `20261006000000_portrait_text_position.sql` , `20261007000000_backdrop_text_lines.sql` and `20261008000000_portrait_text_color.sql` (hero cutout style), then `20261009000000_theme_palette.sql` and `20261010000000_theme_palette_library.sql` (colour palette and saved palettes). In general: run every file in `supabase/migrations/` once, in filename order.

**CLI route (alternative):**

```bash
npx supabase init                       # once; keeps the existing migrations folder
npx supabase login
npx supabase link --project-ref abcdefghijklmnop   # the ref is the subdomain of your URL
npx supabase db push
```

### A8. Load the seed data

In **SQL Editor → New query**, paste the whole of `supabase/seed.sql` and **Run**.

The seed contains only facts from the CV. Anything unknown (photo, CV file, some dates, Google Scholar / ORCID values) is intentionally empty, and you fill it in from the dashboard. Re-running the seed is safe: it never duplicates rows or overwrites edits.

### A9. Verify the tables

Open **Table Editor**. You should see 15 tables: `admin_users`, `awards`, `blog_posts`, `contact_messages`, `education`, `experiences`, `project_images`, `projects`, `publications`, `research`, `section_settings`, `site_settings`, `skill_categories`, `skills`, `social_links`.

Then check the data. `projects` should have 4 rows, `skills` 23, and `site_settings` 1.

### A10. Verify RLS

Every table in Table Editor should show **RLS enabled**, with no "RLS disabled" warning. To double-check, open **Authentication → Policies**: each table has policies such as *Public can read visible rows* and *Admins can update*.

Optional quick test in the SQL Editor:

```sql
set role anon;
select count(*) from public.education;        -- 2 (the 2 hidden school entries are excluded)
select count(*) from public.contact_messages; -- ERROR: permission denied  ← correct
reset role;
```

### A11. Verify the storage buckets

Open **Storage**. You should see two buckets, **`media`** and **`documents`**, both marked *Public*. (Public means files can be *read* through their URL. Uploading and deleting are admin-only through the storage policies.)

If they are missing, re-run the storage migration (A7, step 3).

### A12. Create your admin user

1. Open **Authentication → Users → Add user → Create new user**.
2. Enter your email and a **strong, unique password**.
3. Tick **Auto Confirm User**.
4. Click **Create user**.

Then click the new user and copy the **User UID** (a UUID).

Recommended: in **Authentication → Sign In / Providers** (Email section), disable **Allow new users to sign up**. The app has no sign-up page; this also blocks sign-ups through the API.

### A13. Authorize that user as administrator

Being signed in is not enough. The user must also be listed in `admin_users`. In the SQL Editor:

```sql
insert into public.admin_users (user_id)
values ('00000000-0000-0000-0000-000000000000');  -- ← paste your User UID
```

Check it with `select * from public.admin_users;`.

### A14. Test the login locally (recommended before deploying)

```bash
cp .env.example .env.local   # fill in the three Supabase values from A3–A5
npm install
npm run dev
```

Open <http://localhost:3000/oni_the_boss/login> and sign in. You should land on the dashboard overview.

---

## Part B — GitHub

### B1. Initialize git (if the folder is not a repository yet)

```bash
git init
git branch -M main
```

### B2. Make sure secrets are ignored

`.gitignore` already ignores `.env*` (except `.env.example`). Confirm with:

```bash
git check-ignore -v .env.local   # should print the matching .gitignore rule
```

### B3. Create a repository

On GitHub, go to **New repository**, name it (e.g. `portfolio`), and choose **Private** or **Public**. Do **not** add a README or .gitignore, since the project has them.

### B4. Commit and push

```bash
git add .
git status                       # double-check that no .env.local is listed
git commit -m "Initial portfolio"
git remote add origin https://github.com/<your-username>/portfolio.git
git push -u origin main
```

---

## Part C — Vercel

### C1. Create an account

Go to <https://vercel.com/signup> and choose **Continue with GitHub**.

### C2. Import the repository

From the dashboard, choose **Add New… → Project**, then **Import** your `portfolio` repository. Grant Vercel access to it if asked.

### C3. Plan

Personal accounts use the **Hobby** plan, which is free. Nothing to select.

### C4. Framework settings

Vercel detects **Next.js** automatically. Leave the Build Command (`next build`), Output Directory and Install Command at their defaults. The Root Directory is the repository root.

### C5. Environment variables

Expand **Environment Variables** and add:

| Name | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | from A3 | |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | from A4 | |
| `SUPABASE_SECRET_KEY` | from A5 | Server-only. Vercel never exposes non-`NEXT_PUBLIC_` variables to the browser. |
| `NEXT_PUBLIC_SITE_URL` | e.g. `https://portfolio-abc.vercel.app` | Optional at first. Add it once you know the final URL (C7), then redeploy. |
| `CONTACT_IP_SALT` | a random 64-character string | Optional. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

Apply them to **Production** and **Preview** (and Development if you use `vercel dev`).

> `NEXT_PUBLIC_*` values are embedded **at build time**. Whenever you change one, redeploy (Deployments → ⋯ → **Redeploy**).

### C6. Deploy

Click **Deploy**. The first build takes 1–3 minutes.

### C7. Inspect the deployment

When it finishes, Vercel shows the production URL, e.g. `https://portfolio-abc.vercel.app`. If the build failed, open the deployment and read **Build Logs**; see [Part H](#part-h--troubleshooting).

If you skipped `NEXT_PUBLIC_SITE_URL`, now is a good time to set it to this URL and **Redeploy**. Canonical links, the sitemap and social previews will then use it.

### C8. Test the public site

- The homepage shows your name, the sections and the seeded content.
- Toggle dark mode, then reload: the choice persists and there is no flash.
- On your phone (or with devtools' device mode), open the menu and tap a section.
- Visit `/robots.txt` and `/sitemap.xml`. Neither mentions `/oni_the_boss`.
- Visit a non-existent path, e.g. `/nope`. You should get the custom 404 page.

### C9. Test the login

Go to `https://<your-url>/oni_the_boss`. You are redirected to `/oni_the_boss/login`. Sign in with the user from A12 and you land on the dashboard.

Also check that an anonymous private window can't reach `/oni_the_boss/projects` (it redirects to login).

### C10. Test CRUD

1. **Projects → New project**: give it only a title and save. On the homepage it appears under *Other projects*, with no empty links or broken images.
2. Edit it: add a GitHub URL and technologies, then save. The changes appear on the homepage within seconds; refresh to see them.
3. Use the eye icon to hide it, the star to feature it, and the arrows to reorder. Then delete it (you'll be asked to confirm).

### C11. Test image upload

1. **Profile & SEO → Profile photo → Upload image**, pick a JPEG, wait for 100%, then click **Save settings**. The hero shows the photo.
2. Replace it with another image and save. The old file disappears from **Storage → media → profile**.
3. Open a project, then **Screenshots → Add screenshots**. They appear under *Project details* on the homepage, with a lightbox.

### C12. Test the CV

**CV → Upload PDF**. The homepage navigation and hero now show **Download CV**. Click it to download the PDF. Replace it with another PDF: the old file is removed from **Storage → documents → cv**. Use **Hide download button** to hide the buttons, then show them again.

### C13. Test the contact form

Before testing, add server-only `RESEND_API_KEY` and `CONTACT_EMAIL_FROM` to Vercel's environment variables and redeploy. Create the key in [Resend](https://resend.com/api-keys), verify a sending domain, and use an address on that domain for `CONTACT_EMAIL_FROM` (for example, `Portfolio <contact@yourdomain.com>`). Messages are sent to **rowshanmannanoni@gmail.com**, and Reply addresses the visitor. After submitting, check Gmail (including Spam) as well as the dashboard. An email failure is shown to the visitor; the saved dashboard copy remains available.

1. In a private window, fill in the homepage contact form. Wait at least 3 seconds before submitting (the form ignores submissions that come too fast).
2. You should see *Message sent*.
3. In the dashboard, **Messages** shows it as *Unread*, and the sidebar shows a badge.
4. Mark it read, archive it, then delete it.

If the form says it is unavailable, `SUPABASE_SECRET_KEY` is missing or wrong (see H1).

### C14. Test the blog

1. **Blog → New post**: write a title (the slug fills itself in) and some Markdown (try a code block and a table). Use the **Preview** tab, then **Save draft**.
2. While it's a draft, `/blog` does not list it and `/blog/<slug>` returns 404.
3. Click **Publish**. The post appears on `/blog` and in the homepage *Writing* section.
4. Click **Unpublish**, and it is hidden again.

---

## Part D — Supabase production settings

The app signs in with email and password, which does not need redirect URLs. Still, set these so the Auth emails Supabase sends (e.g. password recovery triggered from the dashboard) point at your site.

**Authentication → URL Configuration:**

- **Site URL:** `https://<your-project>.vercel.app` (later, your custom domain)
- **Redirect URLs:** add `https://<your-project>.vercel.app/**`, and `http://localhost:3000/**` for local development

**Forgot your password?** There is no public "forgot password" page. Go to **Authentication → Users**, select your user, and use **Send password recovery**, or set a new password there.

---

## Part E — Redeploying

- Every `git push` to `main` triggers a new **production** deployment automatically.
- Pushes to other branches and pull requests get **preview** deployments with their own URLs.
- **Content edits never need a redeploy.** The dashboard writes to Supabase and revalidates the affected pages immediately.
- Redeploy manually (Deployments → ⋯ → Redeploy) after changing environment variables.
- When you add a new SQL migration later, apply it to Supabase (SQL Editor or `npx supabase db push`) **before** deploying code that depends on it.

---

## Part F — Custom domain (optional)

Not required. The site works on `*.vercel.app` indefinitely.

1. Buy a domain from any registrar.
2. In Vercel, go to **Project → Settings → Domains → Add**, enter the domain, and follow the DNS instructions (an `A` record for the apex domain and/or a `CNAME` for `www`). HTTPS is issued automatically.
3. Update `NEXT_PUBLIC_SITE_URL` to `https://yourdomain.com` and **Redeploy**.
4. In Supabase **Authentication → URL Configuration**, update the Site URL and add `https://yourdomain.com/**` to Redirect URLs.

---

## Part G — Free-tier maintenance

**Limits that matter for this site.** Numbers change, so check the current plans at [supabase.com/pricing](https://supabase.com/pricing) and [vercel.com/pricing](https://vercel.com/pricing).

| Service | Limit | Impact here |
|---|---|---|
| Supabase Free | Database size of a few hundred MB | Text content is tiny, so this is far beyond what a portfolio uses |
| Supabase Free | About 1 GB of file storage, plus a monthly egress quota | Keep images at reasonable sizes. Vercel's image optimizer caches resized copies, so most image views don't hit Supabase. |
| Supabase Free | Projects pause after about a week without database activity | See the next section |
| Supabase Free | Up to 2 active free projects; no automatic backups | Export important content occasionally (Database → Backups is a paid feature; use `npx supabase db dump` or the Table Editor's CSV export) |
| Vercel Hobby | Personal, non-commercial use; monthly quotas for functions, bandwidth and image optimizations | Public pages are static and cached, so typical portfolio traffic stays well within limits |

### If the Supabase project is paused

**Symptoms:**

- the dashboard shows "This page could not be loaded";
- login fails;
- newly published content does not appear;
- a new Vercel build fails with "Failed to load site settings".

Already-generated public pages keep being served from Vercel's cache.

**To resume:**

1. Sign in at <https://supabase.com/dashboard>. A paused project shows a **Paused** badge.
2. Open it and click **Restore project** (or **Resume**).
3. Wait a few minutes until the status is healthy.
4. Open your site's dashboard and save any item (or redeploy on Vercel) to refresh the cached pages.

Data is kept while paused, but very long pauses may limit restore options, so check the notice Supabase shows.

> Do **not** set up artificial "keep-alive" pings to dodge the inactivity policy. If the site needs to be always on, upgrade the Supabase plan instead. Normal admin use (signing in and editing now and then) counts as activity.

---

## Part H — Troubleshooting

### H1. Missing environment variables

| Symptom | Cause / fix |
|---|---|
| Site builds but shows only your name and an empty page; dashboard says "Supabase is not configured" | `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is missing. Add both in Vercel → Settings → Environment Variables, then **Redeploy** (public values are inlined at build time). |
| Contact form says "temporarily unavailable"; Vercel function logs show `SUPABASE_SECRET_KEY is not configured` | Add `SUPABASE_SECRET_KEY` (server-only, no `NEXT_PUBLIC_`) and redeploy. |
| Variables are set but changes have no effect | Check they are enabled for the right environment (Production vs Preview), then redeploy. |

### H2. Authentication redirect issues

- **Login page keeps reloading, or you are bounced back to login after signing in:** cookies are blocked, or the browser is on a different origin than the one that set the cookie (e.g. `www` vs apex). Use one canonical domain, and allow cookies.
- **Recovery emails link to localhost:** set the **Site URL** in Supabase (Part D).
- **"Invalid email or password"** for a correct password: the user may not be confirmed. In **Authentication → Users**, confirm the user, or recreate it with *Auto Confirm User* ticked.

### H3. RLS permission errors

- **Dashboard toast: "Permission denied by the database. Check that your account is in admin_users."** Your UID is not in `admin_users` (A13), or you inserted a different user's UID. Run `select * from public.admin_users;` and compare with **Authentication → Users**.
- **Public site shows nothing even though rows exist:** the rows may be hidden (`visible = false`), or the section is hidden under **Sections**. Draft posts and posts with a future date are hidden by design.
- **`permission denied for table …`** from a client after adding new tables yourself: add explicit `grant`s and RLS policies, following the initial migration.

### H4. Images not loading

- **Broken image icon with a 400 error from `/_next/image`:** the image host is not allowed. The config allows `*.supabase.co` and the host of `NEXT_PUBLIC_SUPABASE_URL` *at build time*, so redeploy after setting or changing that URL.
- **403 on the image URL:** the bucket is not public. In **Storage → media → Edit bucket**, enable *Public bucket*, or re-run the storage migration.
- **Image displays in the dashboard but not on the site:** the item is hidden, or you uploaded but did not click **Save**.

### H5. Storage upload permission errors

- **"Upload refused: your account is not authorized to upload files"** — your user is not in `admin_users` (A13), or the storage policies are missing (re-run `20261003000100_storage.sql`).
- **"This file type is not allowed"**: only JPEG/PNG/WebP/AVIF/GIF images and PDF documents are accepted. SVG is intentionally blocked.
- **"This file is too large"**: images are limited to 5 MB and PDFs to 10 MB. Resize or compress the file (e.g. with squoosh.app).
- **"Your session has expired"**: sign out and sign in again.

### H6. Build works locally but fails on Vercel

- **`Failed to load site settings` / `Failed to load …` during "Generating static pages":** the build reached Supabase but the query failed. Usually the project is paused (G), the migrations were not run (H7), or the URL/key is wrong. Fix it and redeploy.
- **Type or lint errors only on Vercel:** run `npm run check` locally. Vercel uses a clean install, so commit `package-lock.json`.
- **Node version errors:** Project → Settings → General → Node.js Version should be 20.x or newer.
- **Case-sensitive import paths:** Windows and macOS ignore filename case, but Vercel (Linux) does not. Make sure import paths match the actual file names exactly.

### H7. Admin logs in but sees "Access denied"

You are authenticated but not authorized, which is the intended behaviour for non-admins. Insert your UID into `admin_users` (A13), then sign out and back in. Make sure you copied the **User UID** and not the project ref or an email.

### H8. A migration is missing

- **`relation "public.site_settings" does not exist`** (or similar): run the initial schema migration (A7).
- **`bucket not found` on upload:** run the storage migration.
- **`type "public.partial_date" already exists`** when re-running the schema: the schema is already installed. Don't run the initial migration twice; only new migrations need to run.

### H9. Supabase project paused

See [Part G](#if-the-supabase-project-is-paused): restore it from the Supabase dashboard, then save any item in the admin dashboard (or redeploy) to refresh cached pages.

### H10. Content edits don't appear

Edits revalidate pages immediately. If a page still looks stale, hard-refresh (Ctrl/Cmd + Shift + R): your browser may be holding the old HTML. Also check that the item is **visible**, that its section is visible, and, for posts, that they are **published** with a publication date that is not in the future.

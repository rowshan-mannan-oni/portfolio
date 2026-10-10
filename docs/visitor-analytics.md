# Visitor analytics

The admin overview at `/oni_the_boss` displays total distinct visitors and online visitors.

## Enable in production

1. Apply `supabase/migrations/20261011000000_visitor_analytics.sql` in the Supabase SQL Editor (or with your normal migration workflow).
2. Configure `SUPABASE_SECRET_KEY` (legacy `SUPABASE_SERVICE_ROLE_KEY` also works) on the server alongside the existing Supabase URL and publishable key. Never expose the secret through a `NEXT_PUBLIC_` variable.
3. Deploy this branch, visit a public page, and check the admin overview. A fresh browser should increase total by one; refreshing or opening another tab after the cookie is set should not.
4. Leave a public tab visible: online should remain one. Close or hide all its public tabs: it should disappear from online after 90 seconds plus up to 15 seconds for the next dashboard refresh.

Tracking starts when enabled; historical visitors cannot be recovered. The dashboard shows an unavailable message when the migration is missing or a query fails.

## Counting rules

- A distinct visitor is a browser with a signed, anonymous, HttpOnly cookie. Its lifetime is one year, renewed on activity. Clearing cookies, using another browser/device, or rotating the server signing key creates a new visitor identity.
- Public pages send a heartbeat every 30 seconds while visible. Online means a heartbeat in the last 90 seconds; the dashboard polls every 15 seconds while visible.
- Multiple tabs share the cookie and one database row. Two simultaneous first-ever visits before a cookie exists can create two identities.
- Admin pages do not send heartbeats. An admin visiting public pages is counted like any browser.
- No IP address, page history, name, or fingerprint is stored; only a random ID and first/last timestamps. Basic bot user agents are excluded, but counts are approximate and deliberate automation can inflate them.
- Browsers blocking cookies or JavaScript cannot be measured reliably. Cookies should be described in your site's privacy notice as appropriate to your deployment.

Writes are restricted to the server role. Reads require admin membership through Row Level Security and an authenticated admin API endpoint. SQL functions use security invoker, following the [Supabase database function guidance](https://supabase.com/docs/guides/database/functions).

For manual verification, confirm `/api/visitors/stats` returns 401 without an admin session and cross-origin heartbeat requests return 403. Database integration needs an initialized Supabase instance; lint, type checks, and build alone do not verify the migration.

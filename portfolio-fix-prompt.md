# Portfolio Site — Bug Fix & Feature Brief (for Claude Code / coding agent)

## Stack context (do not skip)
- Frontend: React + Vite, deployed on Vercel (`my-portfolio-*.vercel.app`, production domain `joydipmajumdar.vercel.app`)
- Backend: FastAPI, deployed on Render free tier (cold starts after ~15 min idle, takes ~50s to wake)
- Database: PostgreSQL
- Admin panel is internally called "Hokage Office" at `/admin`, themed dark + orange, Naruto branding ("Uzumaki", "Shinobi Scrolls" = blog, "Arsenal" = skills, "Completed Missions" = projects, "Messenger Hawk" = contact form)
- Frontend and backend are on **different domains** (vercel.app vs onrender.com) — this is cross-site, which matters a lot for issue 3 below.

Work through the 6 tasks below in order. Each has a problem statement, root cause, exact implementation steps, and acceptance criteria. Do not mark a task done until its acceptance criteria pass in production, not just locally — several of these bugs (cold start, iOS Safari) only reproduce under real deployed conditions.

---

## Task 1 — Contact form should save to Postgres, not open the visitor's email client

**Problem:** The "Messenger Hawk" contact form currently submits via a `mailto:` link/href, which opens the visitor's own email app instead of sending the message to the site owner. It should write to the database and be readable from the admin panel.

**Implementation:**
1. **DB migration:** create a `contact_messages` table:
   ```sql
   CREATE TABLE contact_messages (
     id SERIAL PRIMARY KEY,
     name TEXT NOT NULL,
     email TEXT NOT NULL,
     message TEXT NOT NULL,
     is_read BOOLEAN NOT NULL DEFAULT FALSE,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   ```
2. **Backend endpoint:** `POST /api/contact` — public (no auth), validates `name`, `email` (basic regex), `message` are non-empty, rejects payloads over a reasonable length (e.g. 5000 chars) to prevent abuse, rate-limit it (e.g. 5 requests/min/IP using `slowapi` or similar) to stop spam, inserts a row, returns `201` with the saved message id.
3. **Backend endpoint:** `GET /api/admin/messages` (auth-protected, same auth as rest of admin) — returns all messages ordered by `created_at DESC`.
4. **Backend endpoint:** `PATCH /api/admin/messages/{id}/read` and `DELETE /api/admin/messages/{id}` (auth-protected) for marking read / deleting.
5. **Frontend (`Contact`/`MessengerHawk` component):** remove the `mailto:` href entirely. On "Send Scroll" click, `fetch`/POST JSON to `/api/contact` with a loading spinner on the button, disable the button while in flight, show an inline success state ("Scroll delivered!") on 200/201 and an inline error state on failure — never navigate away from the page.
6. **CORS:** confirm the FastAPI CORS middleware explicitly allows `POST` and the production Vercel origin(s) for `/api/contact`.
7. **Admin panel:** add a new sidebar item in Hokage Office, e.g. "Hawk Inbox" (icon: mail/bird), between "Blog Posts" and "Photo Gallery" or wherever fits. It lists messages in a table: Name | Email | Message (truncated, expandable on click) | Date | Read toggle | Delete button. Unread messages should be visually distinct (e.g. bold or an orange dot), matching the existing dark/orange admin theme.

**Acceptance criteria:** Submitting the public contact form does not open any email client; the message appears in `contact_messages` in Postgres and shows up in the new admin "Hawk Inbox" section within a few seconds, with no page navigation on submit.

---

## Task 2 — Draft blog posts are invisible in the admin panel but still block duplicate titles

**Problem:** Saving a blog as "Draft" does not show it in the admin Blog Posts list, but trying to create a new post with the same title/slug later correctly errors as a duplicate — proving the draft row really is in the DB, just hidden from the admin UI.

**Root cause (verify, then fix):** The endpoint backing the admin Blog Posts list (likely `GET /api/admin/posts` or it's reusing the public `GET /api/posts` endpoint) almost certainly has a `WHERE status = 'published'` filter that's meant for the *public* blog page but is incorrectly also applied to the *admin* list. The duplicate-title/slug check on create, by contrast, correctly queries across all statuses — that part is fine and should NOT be changed.

**Implementation:**
1. Audit the routes: confirm there are two distinct endpoints — one for the public-facing blog (`/api/posts`, must stay filtered to `status = 'published'`) and one for the admin list. If the admin panel is currently reusing the public endpoint, give it its own endpoint, e.g. `GET /api/admin/posts` (auth-protected), with **no status filter** — return all posts (draft + published) ordered by `created_at DESC`.
2. In the admin "Blog Posts" table component, add a status filter dropdown (All / Published / Draft) defaulting to "All", and a status badge per row (reuse the existing green "PUBLISHED" pill style, add a distinct color, e.g. gray/yellow, "DRAFT" pill) so drafts are visually distinguishable.
3. Confirm Edit and Delete actions on a draft row work identically to published rows (same endpoints, just by `id`).
4. Leave the create/update duplicate-title (or slug) validation logic untouched — it is already correctly checking across all statuses, which is the desired behavior (you shouldn't be able to have a draft and a published post share a slug, since slugs likely drive the public post URL).

**Acceptance criteria:** Creating a post with status "Draft" makes it immediately visible in the admin Blog Posts list with a "DRAFT" badge; it is editable and deletable from there; it does NOT appear on the public `/blog` page; attempting to create another post with the same title/slug still correctly errors as a duplicate.

---

## Task 3 — Render cold start (50s) breaks admin login/upload on iPhone Safari

This is actually two coupled problems: (a) the backend takes ~50s to wake from sleep on Render's free tier, and (b) even once awake, auth fails specifically on iOS Safari with a cookie error. Fix both.

### 3a. Cold start handling
**Implementation:**
1. Add a lightweight `GET /health` endpoint on the backend (if one doesn't already exist) that does no DB work, just returns `{"status": "ok"}`.
2. Set up an external keep-alive ping hitting `/health` every 10 minutes (e.g. a free [cron-job.org](https://cron-job.org) job, UptimeRobot monitor, or a GitHub Actions scheduled workflow using `curl`). This significantly reduces — but on Render's free tier cannot fully eliminate — cold starts during genuinely idle periods (e.g. overnight).
3. On the frontend, wrap all backend `fetch` calls (especially from the admin panel) with: a request timeout of ~60s (not the browser default), and if the first attempt times out or returns a network error, automatically retry once with backoff, while showing a non-blocking toast/banner: "Waking up the server, this can take up to a minute on the first request…" Do this generically (e.g. a small wrapper around `fetch` / axios instance used app-wide), not as one-off patches per component.
4. Mention to the user as an aside in your summary (don't silently decide for them): the only way to fully remove the 50s cold start is to upgrade off Render's free tier to an "always on" instance, or migrate the backend to a platform with faster/no cold starts. The keep-alive ping + frontend retry/loading-state above is the no-cost mitigation.

### 3b. iOS Safari cookie/auth failure
**Root cause:** the frontend (vercel.app) and backend (onrender.com) are different domains, making the admin session cookie a **third-party/cross-site cookie**. Safari's Intelligent Tracking Prevention (ITP) blocks or aggressively expires cross-site cookies, which is why login appears to work on desktop Chrome but silently fails on iOS Safari (no cookie gets stored/sent, so the next authenticated request — e.g. publishing a post or uploading a photo — gets rejected as unauthenticated).

**Implementation — pick the proxy approach as the primary fix (more robust than tweaking cookie flags), and do the cookie-flag fix as a baseline regardless:**
1. **Baseline (do this no matter what):** ensure the session/auth cookie is set with `SameSite=None; Secure; HttpOnly` (required for any cross-site cookie to work in modern browsers at all). If it's currently `SameSite=Lax` or missing `Secure`, that alone may be silently failing on iOS.
2. **Primary fix — make the cookie first-party via a same-domain proxy:** add a Vercel rewrite so all API calls go through the same origin as the frontend instead of directly to `onrender.com`. In `vercel.json`:
   ```json
   {
     "rewrites": [
       { "source": "/api/:path*", "destination": "https://<your-render-backend-url>/api/:path*" }
     ]
   }
   ```
   Update the frontend's API base URL to a relative `/api` path instead of the absolute Render URL. This makes the browser treat the cookie as first-party (same site as the page), which Safari does not block. This is the standard fix for "frontend on Vercel, backend on Render, cookies don't work on Safari/iOS" and is more reliable than relying on `SameSite=None` alone (Safari has additional restrictions even on properly-flagged cross-site cookies).
3. As a fallback/alternative if the proxy approach is not feasible for any reason: switch from cookie-based sessions to a JWT returned in the login response body, stored in memory (or `localStorage` if persistence across refresh is wanted, accepting the XSS tradeoff), sent via `Authorization: Bearer <token>` header on every admin request. This sidesteps cookie behavior entirely but is more invasive to implement (every admin fetch call needs the header attached) — prefer the proxy fix first.
4. Specifically verify the photo/blog **upload** endpoint (multipart form data) also goes through whichever auth mechanism you land on, and that the request doesn't time out before the (now-awake) backend responds — uploads can be slower than simple GET/POST.

**Acceptance criteria:** Test on an actual iPhone in Safari (not just iOS simulator/dev tools device emulation): log into `/admin`, wait for a natural Render sleep cycle (or force one), then publish a blog post and upload a photo — both succeed without "cookie does not work" errors, and the user sees a clear "waking up" loading state rather than a silent failure during the cold-start window.

---

## Task 4 — Missing skill icons, and no icon auto-suggestion when adding a skill

**Problem:** Several skills in the "Arsenal" section render with no logo (just text in a pill). When adding a new skill via the admin "Add Skill" form, the Icon Key field is manual free-text and nothing auto-fills or previews — easy to mistype and end up with another blank icon.

**Implementation:**
1. **Fallback rendering (fixes existing broken icons immediately):** wherever skill icons are rendered (both public Arsenal section and admin Skills Arsenal list), the icon `<img>`/component must have an `onError` handler that swaps in a generic fallback icon (e.g., a simple "code" or "puzzle piece" glyph) instead of showing a broken image or blank space. This guarantees nothing ever renders empty again, regardless of root cause.
2. **Data audit + backfill:** write a one-off script/migration that selects all rows in the skills table, and for each one tries to resolve `https://cdn.simpleicons.org/{icon_key}` (or whatever Simple Icons CDN pattern is currently used) — for any that 404 or have an empty `icon_key`, attempt to auto-match against the full list of valid Simple Icons slugs (available at `https://github.com/simple-icons/simple-icons/blob/develop/slugs.md` or via their npm package's `package.json`/data file) by fuzzy-matching the skill's `name` field. Log/report any that still can't be resolved so they can be fixed manually.
3. **Admin form improvement:** in the "Create New" / "Edit" skill form, as the admin types into "Skill Name", live-fuzzy-match against the same valid Simple Icons slug list and auto-fill the "Icon Key" field with the best guess (still editable/overridable). Next to the Icon Key field, render a live icon preview (the actual resolved image) so the admin can visually confirm it's correct *before* hitting Save, instead of finding out it's broken on the public site afterward. If no match is found, show a clear "no matching icon found" state rather than leaving it ambiguous.

**Acceptance criteria:** No skill pill anywhere on the live site shows a blank/broken icon. Adding a new skill in admin auto-suggests a correct icon for common technologies (e.g. typing "Docker" prefills `docker` and shows the whale logo) and previews it before save.

---

## Task 5 — Blog typography, share buttons, reading time, and a minimal redesign of the blog reading page

**Problem:** Blog titles need restyling; sharing and reading-time are missing; the individual blog post page needs a cleaner, more minimal layout.

**Implementation:**
1. **Title styling** — wherever blog post titles render (both the "Shinobi Scrolls" list cards and the individual post page `<h1>`), apply:
   ```css
   font-family: 'Times New Roman', Times, serif;
   font-weight: 700;
   color: #ffffff;
   ```
2. **Reading time:**
   - DB migration: add `reading_time_minutes INTEGER` (nullable) to the posts table.
   - Admin post editor: add a "Estimated Read Time (minutes)" number input, plus an "Auto-calculate" button next to it that counts words in the current Markdown Content textarea and divides by ~200 wpm, rounding up, then fills the field (still manually overridable before saving).
   - If `reading_time_minutes` is null for a post (e.g. older posts created before this change), compute it on the fly from word count as a fallback rather than showing nothing.
   - Display it as a small stamp/badge on the individual post page, e.g. "☕ 4 min read", placed in the meta row alongside date and author.
3. **Share buttons** — on the individual post page, directly below the title and above the date/author/read-time meta row, add a row of 4 share icon-buttons:
   - Facebook: link to `https://www.facebook.com/sharer/sharer.php?u={encoded_post_url}`
   - WhatsApp: link to `https://wa.me/?text={encoded(title + " " + post_url)}`
   - Telegram: link to `https://t.me/share/url?url={encoded_post_url}&text={encoded_title}`
   - Messenger: link to `https://www.facebook.com/dialog/send?link={encoded_post_url}&app_id={FB_APP_ID}&redirect_uri={encoded_post_url}` — **note:** this requires registering a Facebook App and setting `FB_APP_ID` as an env var; flag this back to the user rather than hardcoding a placeholder, since it won't work without a real App ID. As a no-setup fallback, you can instead use the mobile deep link `fb-messenger://share/?link={encoded_post_url}`, which works on devices with Messenger installed but silently fails on desktop — make this explicit in your summary so the choice is informed, don't pick silently.
   All four open in a new tab (`target="_blank" rel="noopener noreferrer"`) except the Messenger deep link.
4. **Page redesign** — restructure the individual blog post page to a minimal, GitHub-readme-like layout:
   - Single centered column, max-width ~680–720px, generous side padding on mobile.
   - Line-height ~1.7+ on body text for readability.
   - Meta row order top to bottom: Title → Share buttons row → (date · author · read-time stamp) → cover image (if present) → Markdown content.
   - Code blocks in the rendered Markdown styled GitHub-style (monospace font, subtle gray/dark background, rounded corners, no heavy borders).
   - Remove any extra sidebar/clutter from this page if present; keep navigation to just a "back to all scrolls" link plus the existing top nav.

**Acceptance criteria:** Blog titles render white, bold, Times New Roman everywhere. Every published post page shows working share buttons for FB/WhatsApp/Telegram/Messenger, a reading-time stamp (set in admin or auto-computed), and a visibly cleaner single-column reading layout.

---

## Task 6 — Redesign "Completed Missions" (projects) section: GitHub heatmap + admin-curated repo list

**Problem:** The Projects section currently appears to pull and display all GitHub repos automatically. The user wants a GitHub contribution heatmap, only a hand-picked subset of repos shown, and a new admin panel section to control which repos are featured.

**Implementation:**
1. **DB migration:** new `projects` table:
   ```sql
   CREATE TABLE projects (
     id SERIAL PRIMARY KEY,
     repo_full_name TEXT,            -- e.g. "borno18/My-Portfolio", nullable if manual entry
     title TEXT NOT NULL,
     description TEXT,
     project_url TEXT,
     repo_url TEXT,
     tags TEXT[],                    -- or a separate join table if you prefer normalized tags
     display_order INTEGER NOT NULL DEFAULT 0,
     is_visible BOOLEAN NOT NULL DEFAULT TRUE,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   ```
2. **Backend — GitHub repo search (admin-only):** `GET /api/admin/github/repos` (auth-protected) — server-side calls the GitHub REST API (`GET /users/{username}/repos`) for the user's GitHub username, returns name/description/url/language/stars so the admin can browse and pick from real repos rather than typing URLs by hand.
3. **Backend — curated CRUD (admin-only):** `POST /api/admin/projects`, `PATCH /api/admin/projects/{id}`, `DELETE /api/admin/projects/{id}`, `GET /api/admin/projects` (returns all rows regardless of `is_visible`, for the admin's own management view).
4. **Backend — public projects:** `GET /api/projects` — returns only `is_visible = TRUE` rows ordered by `display_order ASC`, this is what the public "Completed Missions" section fetches.
5. **Backend — GitHub contribution heatmap (public, cached):** the GitHub REST API does not expose the contribution calendar; you need GitHub's GraphQL API (`contributionsCollection`) with a personal access token. Add `GET /api/github/contributions` on the backend: server-side calls the GraphQL API using a token stored in an env var (`GITHUB_TOKEN`, never exposed to the frontend), caches the result server-side for ~1 hour (in-memory cache or a simple `cached_at` column/table) to avoid hammering GitHub's rate limits, and returns the daily contribution counts for the frontend to render.
6. **Frontend — public section redesign:** at the top of "Completed Missions", render the heatmap (a simple library like `react-github-calendar` works if it can be pointed at your own `/api/github/contributions` data, otherwise build a lightweight custom SVG grid — either is fine, prefer whichever is less code). Below it, render project cards driven only by the curated `GET /api/projects` response — keep the existing card visual style ("MISSION ACTIVE" badge, language dot, stars/forks, Codebase link) but the data source changes from "all repos" to "curated list."
7. **Admin panel — new "Missions Control" section:** add a new sidebar item in Hokage Office (alongside Blog Posts, Skills Arsenal, etc.). It should let the admin: browse/search their real GitHub repos (via the endpoint from step 2) and add one to the curated list with one click (pre-filling title/description/url from GitHub, all overridable), reorder the curated list (drag-and-drop or simple up/down/number input using `display_order`), toggle a project's visibility on/off without deleting it, edit the title/description/tags, and delete a curated entry. Match the existing dark/orange admin visual style used elsewhere (e.g. the Blog Posts and Skills Arsenal panels).

**Acceptance criteria:** The public "Completed Missions" section shows a GitHub contribution heatmap above the project cards, and shows only the repos the admin has explicitly added/marked visible — adding a new repo from GitHub, reordering, or hiding one in the new "Missions Control" admin section immediately reflects on the public site.

---

## General implementation notes
- Tasks 1, 2, 4, 5, 6 are independent and can be done in any order / separate PRs; Task 3 (auth/cookie) should be treated as the most urgent since it currently blocks the admin from doing real work (publishing, uploads) from mobile.
- Any new DB tables/columns need a migration file consistent with however migrations are currently managed in this repo (Alembic, raw SQL scripts, etc. — check the existing pattern before adding a new one).
- All new admin endpoints must use the same auth/session mechanism as the rest of `/admin` (and should be fixed by whatever you land on in Task 3b).
- Keep all new UI consistent with the existing dark background + orange (`#f97316`-ish) accent, serif display headings, and existing component patterns already used in Hokage Office — don't introduce a different design language for new sections.
- For Task 3, testing must happen on a real device (an actual iPhone in Safari) against the deployed Vercel + Render URLs, not just local dev — this bug is specifically about cross-site cookie behavior in production, which doesn't reproduce on `localhost`.

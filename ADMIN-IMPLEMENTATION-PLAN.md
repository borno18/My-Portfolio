# Portfolio admin implementation plan

The four supplied screenshots are visual references for the owner's dashboard. Use live portfolio data and the existing Astro route, owner sign-in, MFA, and form submission flow. The examples in the screenshots are illustrative.

## Phase 1 · Shared workspace

- [x] Widen the workspace and add a compact icon navigation rail, active section styling, and a global unread count.
- [x] Use the portfolio's Fraunces and DM Sans fonts. The dark palette uses forest canvas `#17201c`, panel `#202a23`, borders `#414d41`, cream headings `#ead4b9`, and sage actions `#a4d09b`. Retain the portfolio's light theme.
- [x] Keep the heading and sign-out side by side. Collapse the rail into a wrapping navigation row on narrow screens. Verify keyboard focus and both themes.

## Phase 2 · Inbox

- [x] Add a searchable message list with status filters, a selected message pane, sender and date, and an unread badge sourced from the database.
- [x] Add stars, reply and forward through the local mail client, confirmed deletion, and explicit read/unread actions. Use the first line of the message as its summary because the contact form has no subject field.
- [x] Verify owner-only access, filtering, and the selection fallback when a message leaves the current view.

## Phase 3 · Blog posts

- [x] Put the searchable article list, thumbnails, status counts, filters, and pagination beside the existing editor.
- [x] Organize the editor around title, slug, summary, publishing settings, cover, Markdown formatting, preview, and save actions. Preserve existing article URLs and cover replacement behavior.
- [x] Support archive, featured placement, and scheduled publishing. Keep scheduled articles and their covers private until the publication time. Verify draft and published workflows and the public lists.

## Phase 4 · Photography

- [x] Add the photo card grid, album navigation, search, category and order filters, and a selected photo inspector.
- [x] Wire upload, replace, remove, bulk selection, feature, hide, album assignment, and order changes to the existing gallery. Provide a numeric order control alongside drag reordering.
- [x] Verify upload and edit constraints, bundled photos, and public gallery visibility.

## Phase 5 · Projects

- [x] Merge GitHub repositories and saved portfolio placement into a searchable, filterable table with real repository metadata, totals, and pagination.
- [x] Provide a fresh GitHub fetch, profile link, per-repository feature controls, and placement settings. Keep curated projects available when GitHub requests fail.
- [x] Verify repository matching, toggle persistence, and public project order.

## Implementation details

- Inbox actions use the existing contact records. Reply and Forward open the configured mail client.
- The article editor uses Markdown with a formatting toolbar, manual saves, and a rendered preview. Scheduled publication uses Dhaka time. The public cache can take up to a minute to reflect the scheduled change. Public access checks both publication status and time. [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- Photo uploads use one image and its metadata per submission. Bulk selection applies to existing photos. Hidden photos leave the public gallery and homepage while previously shared Cloudinary asset URLs can still resolve.
- GitHub sync refreshes the public repository catalog. Placement settings are saved per project. [GitHub repository API](https://docs.github.com/en/rest/repos/repos#list-repositories-for-a-user)

## Release checks

- [x] Run the repository tests and production build.
- [x] Check the signed-out route and all four owner sections with disposable browser fixtures at desktop and mobile widths. Exercise Inbox actions, Blog preview and archive, Photography visibility, and Projects feature toggles.
- [x] Apply and test the migrations in the local database test runner, including scheduled cover privacy, hidden photos, photo ordering, and MFA boundaries.
- [x] Apply the three admin migrations to the production database and verify the updated schema.
- [ ] Verify owner MFA and real media uploads in a configured environment using [README.md](README.md).

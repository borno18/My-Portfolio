# Joydip Majumdar · Engineering & Photography

Astro serves the public portfolio, case studies, writing, and photo gallery as HTML. The owner dashboard and contact intake are server-rendered on Vercel. Supabase stores publishing records and messages, and Cloudinary delivers optimized photos. The original React and FastAPI implementation remains in `src/` and `backend/` for migration reference.

## Local development

Use Node 24 and run `npm ci`, then `npm run dev`. Without provider settings the homepage, case studies, project notes, and bundled public gallery still build. Contact displays the direct email and the dashboard displays its unconfigured state. Run `npm test` for the local data-access and content-safety checks and `npm run build` for the deployable output.

## Connect publishing and contact

1. Use a dedicated Supabase project. Apply the checked-in migrations in order and turn off public sign-ups. Create a single confirmed owner. Set `PORTFOLIO_OWNER_ID` to that user’s UUID.
2. Set the owner’s `app_metadata.portfolio_role` to `owner` with the Supabase Admin API or the following statement in the private Supabase SQL editor. Substitute the owner UUID. Existing metadata is preserved.

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"portfolio_role":"owner"}'::jsonb
   where id = '<owner UUID>'::uuid;
   ```

3. Add the environment variables in [.env.example](.env.example) to the intended Vercel environment. Set the Vercel project framework to Astro and Node to 24.x. Keep the Cloudinary credentials and inbox key server-side. Generate the inbox key from 32 random bytes encoded as hex. Register the SHA-256 digest of that hex string in `portfolio_private.inbox_key` and set the key itself as `CONTACT_INBOX_KEY` in Vercel. Use a separate Supabase project and media account for staging when exercising writes.
4. Sign in at `/admin` and enroll an authenticator. Verify that signed-out visitors cannot view drafts or inbox data. Verify that article, project, and photo changes appear on the next page load. Use a disposable image and contact message to confirm upload, deletion, delivery, and rate limits. The photo form resizes large images before sending them to Vercel.
5. Set `SITE_URL` to the canonical public origin. The default is the existing Vercel address. Verify the homepage and sitemap in Search Console after release.

## Migrate and cut over

- Export from the actual production source before replacing the old deployment. Compare article slugs, status, publication timestamps, and media counts. Preserve the existing `/blog/<slug>` and `/photos` addresses. Use the admin dashboard to recreate a small published gallery, or import verified Cloudinary assets separately without changing their ownership.
- Keep private notes in an encrypted offline archive. The replacement does not expose the old notes API. Verify recovery before changing the old encryption key.
- The dedicated Supabase project is named joydip-portfolio. The local databases are not a substitute for verifying the production export.
- Review repository history for runtime database files and credentials, rotate any affected production secrets, and preserve a private database and media backup. The hosted database backup does not include Cloudinary originals. Verify restoration independently.
- Before promotion, check the sitemaps and robots file, real 404 responses, public content on mobile, and the complete publish flow. Keep a rollback deployment and retire the legacy backend only after confirming the migration.

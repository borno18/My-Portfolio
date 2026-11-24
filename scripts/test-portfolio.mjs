import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { cloudImage, renderMarkdown } from '../site/lib/content.js';
import { projectDisplay } from '../site/lib/work.js';

const db = new PGlite();
try {
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create function auth.jwt() returns jsonb language sql
      as 'select coalesce(nullif(current_setting(''request.jwt.claims'', true), ''''), ''{}'')::jsonb';
    grant usage on schema auth to anon, authenticated;
    create schema storage;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (bucket_id text, name text);
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon, authenticated;
    grant select on storage.objects to anon, authenticated;
    grant insert, delete on storage.objects to authenticated;
  `);
  for (const file of (await readdir('supabase/migrations')).filter(name => name.endsWith('.sql')).sort()) {
    await db.exec(await readFile('supabase/migrations/' + file, 'utf8'));
  }
  await db.exec(`
    insert into portfolio_private.inbox_key values (true, sha256(convert_to(repeat('b',64), 'UTF8')));
    insert into portfolio_posts values ('draft','Draft','Hidden','Body','draft',null),
      ('public','Public','Visible','Body','published',now());
    set role anon;
  `);
  const posts = async () => (await db.query("select slug from portfolio_posts where slug in ('draft','public') order by slug")).rows.map(row => row.slug);
  assert.deepEqual(await posts(), ['public']);
  await assert.rejects(() => db.query('select * from portfolio_messages'), /permission denied/i);
  await assert.rejects(() => db.query('select * from portfolio_private.inbox_key'), /permission denied/i);
  await assert.rejects(() => db.query("select portfolio_receive_message(repeat('a',64),'A','a@example.com','Hello')"), /permission denied/i);
  const contact = (key, body) => db.query("select portfolio_receive_message($1,repeat('c',64),'A','a@example.com',$2) as outcome", [key, body]);
  await assert.rejects(() => contact('d'.repeat(64), 'Hello'), /delivery unauthorized/i);
  assert.equal((await contact('b'.repeat(64), 'Via contact form')).rows[0].outcome, 'received');
  await db.exec("set role authenticated; set request.jwt.claims = '{\"aal\":\"aal2\"}'");
  assert.deepEqual(await posts(), ['public']);
  await db.exec("set request.jwt.claims = '{\"aal\":\"aal1\",\"app_metadata\":{\"portfolio_role\":\"owner\"}}'");
  assert.deepEqual(await posts(), ['public']);
  await assert.rejects(() => db.query("insert into portfolio_posts values ('another','Draft','Hidden','Body','draft',null)"), /row-level security/i);
  await db.exec("set request.jwt.claims = '{\"aal\":\"aal2\",\"app_metadata\":{\"portfolio_role\":\"owner\"}}'");
  assert.deepEqual(await posts(), ['draft', 'public']);
  await db.query("insert into portfolio_posts values ('another','Draft','Hidden','Body','draft',null)");
  const coverId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.jpg';
  await db.query("insert into storage.objects values ('article-covers', $1),('article-covers', $2)", ['draft/' + coverId, 'public/' + coverId]);
  await db.query("update portfolio_posts set cover_path = slug || '/' || $1, cover_alt = 'Test cover' where slug in ('draft','public')", [coverId]);
  await db.exec('set role anon');
  assert.deepEqual((await db.query('select name from storage.objects')).rows, [{ name: 'public/' + coverId }]);
  await assert.rejects(() => db.query("delete from storage.objects"), /permission denied/i);
  await db.exec("set role authenticated; set request.jwt.claims = '{\"aal\":\"aal1\",\"app_metadata\":{\"portfolio_role\":\"owner\"}}'");
  await assert.rejects(() => db.query("insert into storage.objects values ('article-covers', 'unauthorized.jpg')"), /row-level security/i);

  await db.exec('set role service_role');
  const receive = async text => (await db.query("select portfolio_receive_message(repeat('a',64),'A','a@example.com',$1) as outcome",[text])).rows[0].outcome;
  for (let index = 0; index < 5; index++) assert.equal(await receive('Message ' + index), 'received');
  assert.equal(await receive('Message 0'), 'received');
  assert.equal(await receive('Message 5'), 'limited');
  assert.equal((await db.query('select count(*) as count from portfolio_messages')).rows[0].count, 6);

  await db.exec("set role authenticated; set request.jwt.claims = '{\"aal\":\"aal1\",\"app_metadata\":{\"portfolio_role\":\"owner\"}}'");
  assert.equal((await db.query("update portfolio_messages set read_at = now() returning id")).rows.length, 0);
  await assert.rejects(() => db.query("insert into portfolio_project_settings values ('attendance-app',true,1)"), /row-level security/i);
  await db.exec("set request.jwt.claims = '{\"aal\":\"aal2\",\"app_metadata\":{\"portfolio_role\":\"owner\"}}'");
  assert.equal((await db.query("update portfolio_messages set read_at = now() returning id")).rows.length, 6);
  await assert.rejects(() => db.query("update portfolio_messages set message = 'changed'"), /permission denied/i);
  await db.query("insert into portfolio_project_settings values ('attendance-app',false,0),('pookie-prep',true,1)");
  await db.query("insert into portfolio_project_settings values ('github-123',true,2,'{\"name\":\"Project-One\",\"description\":\"Demo\",\"language\":\"Dart\"}')");
  await db.query("update portfolio_posts set status = 'draft', published_at = null where slug = 'offline-attendance'");
  await db.query("delete from portfolio_posts where slug = 'public'");
  await db.exec('set role anon');
  assert.deepEqual(await posts(), []);
  assert.equal((await db.query('select name from storage.objects')).rows.length, 0);
  assert.equal((await db.query("select slug from portfolio_posts where slug = 'offline-attendance'")).rows.length, 0);
  const ranking = projectDisplay((await db.query('select * from portfolio_project_settings')).rows).filter(project => project.featured);
  assert.equal(ranking[0].slug, 'pookie-prep');
  assert(!ranking.some(project => project.slug === 'attendance-app'));
  assert.equal(ranking[1].repo, 'https://github.com/borno18/Project-One');
  await assert.rejects(() => db.query("update portfolio_project_settings set featured = false"), /permission denied/i);

  const preset = "where bundled_key = 'a-dream-afternoon'";
  assert.equal((await db.query("select count(*)::int as total from portfolio_photos")).rows[0].total, 5);
  assert.equal((await db.query("select title from portfolio_photos " + preset)).rows[0].title, 'A Dream Afternoon');
  await assert.rejects(() => db.query("delete from portfolio_photos " + preset), /permission denied/i);
  await db.exec("set role authenticated; set request.jwt.claims = '{\"aal\":\"aal1\",\"app_metadata\":{\"portfolio_role\":\"owner\"}}'");
  assert.equal((await db.query("update portfolio_photos set title = 'Denied' " + preset + " returning id")).rows.length, 0);
  await db.exec("set request.jwt.claims = '{\"aal\":\"aal2\",\"app_metadata\":{\"portfolio_role\":\"owner\"}}'");
  const assetId = 'portfolio/aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
  assert.equal((await db.query("update portfolio_photos set title = 'Replaced', public_id = $1, cloud_name = 'example', version = 1, width = 32, height = 32 " + preset + " returning id", [assetId])).rows.length, 1);
  await db.exec('set role anon');
  assert.equal(cloudImage((await db.query("select * from portfolio_photos " + preset)).rows[0], 960), 'https://res.cloudinary.com/example/image/upload/f_auto,q_auto,c_limit,w_960/v1/' + assetId + '.jpg');
  await db.exec("set role authenticated; delete from portfolio_photos " + preset + "; reset role; set role anon");
  assert.equal((await db.query("select title from portfolio_photos " + preset)).rows.length, 0);

  const unsafe = renderMarkdown('[Link](javascript:alert(1)) <img src="//evil.example/x" onerror="alert(1)"><script>alert(1)</script>');
  assert.doesNotMatch(unsafe, /javascript:|onerror|evil.example|<script/);
  assert.match(renderMarkdown('[Case study](/work/demo)'), /href="\/work\/demo"/);
  assert.equal(cloudImage({ cloud_name: 'evil.example', public_id: 'x', version: 1 }, 960), '');
  assert.match(renderMarkdown('[New tab](https://example.test:8443/doc)'), /target="_blank" rel="noopener noreferrer"/);
  const internal = '[Projects](/work/demo) [About](https://portfolio.example/#about) [Hash](#details) [Email](mailto:preview@example.test)';
  assert.doesNotMatch(renderMarkdown(internal, 'https://portfolio.example'), /target="_blank"/);
  console.log('Verified visibility, MFA policy, contact limits, and safe Markdown.');
} finally { await db.close(); }

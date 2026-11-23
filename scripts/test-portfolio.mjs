import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { cloudImage, renderMarkdown } from '../site/lib/content.js';
import { emailDraft } from '../site/lib/contact.js';

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
  `);
  await db.exec(await readFile('supabase/migrations/20261123093411_portfolio.sql', 'utf8'));
  await db.exec(`
    insert into portfolio_posts values ('draft','Draft','Hidden','Body','draft',null),
      ('public','Public','Visible','Body','published',now());
    set role anon;
  `);
  const posts = async () => (await db.query('select slug from portfolio_posts order by slug')).rows.map(row => row.slug);
  assert.deepEqual(await posts(), ['public']);
  await assert.rejects(() => db.query('select * from portfolio_messages'), /permission denied/i);
  await assert.rejects(() => db.query("select portfolio_receive_message(repeat('a',64),'A','a@example.com','Hello')"), /permission denied/i);
  await db.exec("set role authenticated; set request.jwt.claims = '{\"aal\":\"aal2\"}'");
  assert.deepEqual(await posts(), ['public']);
  await db.exec("set request.jwt.claims = '{\"aal\":\"aal1\",\"app_metadata\":{\"portfolio_role\":\"owner\"}}'");
  assert.deepEqual(await posts(), ['public']);
  await assert.rejects(() => db.query("insert into portfolio_posts values ('another','Draft','Hidden','Body','draft',null)"), /row-level security/i);
  await db.exec("set request.jwt.claims = '{\"aal\":\"aal2\",\"app_metadata\":{\"portfolio_role\":\"owner\"}}'");
  assert.deepEqual(await posts(), ['draft', 'public']);
  await db.query("insert into portfolio_posts values ('another','Draft','Hidden','Body','draft',null)");

  await db.exec('set role service_role');
  const receive = async text => (await db.query("select portfolio_receive_message(repeat('a',64),'A','a@example.com',$1) as outcome",[text])).rows[0].outcome;
  for (let index = 0; index < 5; index++) assert.equal(await receive('Message ' + index), 'received');
  assert.equal(await receive('Message 0'), 'received');
  assert.equal(await receive('Message 5'), 'limited');
  assert.equal((await db.query('select count(*) as count from portfolio_messages')).rows[0].count, 5);

  const unsafe = renderMarkdown('[Link](javascript:alert(1)) <img src="//evil.example/x" onerror="alert(1)"><script>alert(1)</script>');
  assert.doesNotMatch(unsafe, /javascript:|onerror|evil.example|<script/);
  assert.match(renderMarkdown('[Case study](/work/demo)'), /href="\/work\/demo"/);
  assert.equal(cloudImage({ cloud_name: 'evil.example', public_id: 'x', version: 1 }, 960), '');
  assert.match(renderMarkdown('[New tab](https://example.test:8443/doc)'), /target="_blank" rel="noopener noreferrer"/);
  assert.doesNotMatch(renderMarkdown('[Same page](#details) [Email](mailto:preview@example.test)'), /target="_blank"/);
  const draft = emailDraft({ name: 'A & B', email: 'preview@example.test', topic: 'Photography', message: 'Hello & goodbye' });
  const data = new URL(draft);
  assert.equal(data.searchParams.get('subject'), 'Photography · Portfolio');
  assert.equal(data.searchParams.get('body'), 'Hello & goodbye\n\nFrom: A & B\nReply to: preview@example.test');
  console.log('Verified visibility, MFA policy, contact limits, and safe Markdown.');
} finally { await db.close(); }

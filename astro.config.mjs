import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { existsSync } from 'node:fs';

if (existsSync('.env')) process.loadEnvFile('.env');

export default defineConfig({
  srcDir: './site',
  site: process.env.SITE_URL || 'https://joydipmajumdar.vercel.app',
  adapter: vercel(),
  integrations: [sitemap({
    filter: page => !['/admin', '/notes', '/404'].includes(new URL(page).pathname.replace(/\/$/, '')),
    serialize: item => ({ ...item, url: new URL(item.url).pathname === '/' ? item.url : item.url.replace(/\/$/, '') }),
  })],
  server: { host: '127.0.0.1' },
  devToolbar: { enabled: false },
  vite: {
    build: { assetsInlineLimit: 0 },
    css: { postcss: { plugins: [] } },
    ssr: {
      // Bundle the sanitizer tree so Vercel can load its mixed CommonJS and ESM dependencies.
      noExternal: [
        'sanitize-html', 'escape-string-regexp', 'htmlparser2', 'is-plain-object',
        'launder', 'parse-srcset', 'postcss', 'dayjs', 'nanoid', 'picocolors',
        'source-map-js', 'domelementtype', 'domhandler', 'domutils', 'dom-serializer', 'entities',
      ],
    },
  },
});

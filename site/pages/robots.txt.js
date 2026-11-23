export const GET = ({ site }) => new Response('User-agent: *\nAllow: /\nSitemap: ' + new URL('/sitemap-index.xml', site) +
  '\nSitemap: ' + new URL('/content-sitemap.xml', site) + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

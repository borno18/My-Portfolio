import { getPosts } from '../lib/content.js';
import { cachePublic, publicCacheTags } from '../lib/public-cache.js';

export const prerender = false;

export async function GET({ site }) {
  const posts = await getPosts({ columns: 'slug' });
  const paths = ['/', '/projects', '/photos', '/contact', '/blog', ...posts.map(post => '/blog/' + encodeURIComponent(post.slug))];
  const urls = paths.map(path => '<url><loc>' + new URL(path, site).href + '</loc></url>');
  const headers = new Headers({ 'Content-Type': 'application/xml; charset=utf-8' });
  cachePublic(headers, publicCacheTags.blog);
  return new Response('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls.join('') + '</urlset>', { headers });
}

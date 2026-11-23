import { getPosts } from '../lib/content.js';

export const prerender = false;

export async function GET({ site }) {
  const posts = await getPosts();
  const paths = ['/', '/projects', '/photos', '/contact', '/blog', ...posts.map(post => '/blog/' + encodeURIComponent(post.slug))];
  const urls = paths.map(path => '<url><loc>' + new URL(path, site).href + '</loc></url>');
  return new Response('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls.join('') + '</urlset>', {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

import { publicDatabase } from '../../../lib/content.js';
import { authClient, ownerSession } from '../../../lib/server.js';

export const prerender = false;

export async function GET(context) {
  const { slug, version } = context.params;
  const headers = { 'Cache-Control': 'private, no-store' };
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug || '') || slug.length > 100 ||
      !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(version || '')) {
    return new Response(null, { status: 404, headers });
  }
  const path = slug + '/' + version + '.jpg';
  const publicDb = publicDatabase();
  const published = await publicDb?.from('portfolio_posts').select('slug').eq('cover_path', path).eq('status', 'published').maybeSingle();
  let db = publicDb;
  if (!published?.data) {
    db = context.request.headers.has('cookie') ? authClient(context) : null;
    if (!db || !(await ownerSession(db)).verified) return new Response(null, { status: 404, headers });
    const { data } = await db.from('portfolio_posts').select('slug').eq('cover_path', path).maybeSingle();
    if (!data) return new Response(null, { status: 404, headers });
  }
  const { data, error } = await db.storage.from('article-covers').download(path);
  if (error || !data) return new Response(null, { status: 404, headers });
  return new Response(data.stream(), { headers: { ...headers, 'Content-Type': 'image/jpeg', 'Content-Length': String(data.size) } });
}

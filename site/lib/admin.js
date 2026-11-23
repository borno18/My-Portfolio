import { field, InputError } from './server.js';
import { projects } from './work.js';

export const adminSections = { blog: 'Blog posts', inbox: 'Inbox', photos: 'Photography', projects: 'Projects' };

export function displayOrder(form) {
  const value = field(form, 'display_order', 3);
  if (!/^\d{1,3}$/.test(value)) throw new InputError('Enter a display order between 0 and 999.');
  return Number(value);
}

export function photoFields(form) {
  return {
    title: field(form, 'title', 140),
    alt: field(form, 'alt', 250),
    category: field(form, 'category', 40),
    caption: field(form, 'caption', 1000, true),
    display_order: displayOrder(form),
  };
}

export function parsePost(form, preview = false) {
  const slug = field(form, 'slug', 100, preview);
  if (slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new InputError('Use lower-case words separated by hyphens for the URL slug.');
  return {
    slug,
    title: field(form, 'title', 160, preview),
    description: field(form, 'description', 300, preview),
    body: field(form, 'body', 65000),
  };
}

export function recordId(form) {
  const id = field(form, 'id', 36);
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(id)) throw new InputError('Choose a valid item.');
  return id;
}

export async function savePost(db, post, originalSlug, published) {
  if (originalSlug && originalSlug !== post.slug) throw new InputError('An existing article keeps its original URL.');
  let previous;
  if (originalSlug) {
    const existing = await db.from('portfolio_posts').select('status,published_at').eq('slug', originalSlug).single();
    if (existing.error) throw existing.error;
    previous = existing.data;
  }
  const entry = {
    ...post,
    status: published ? 'published' : 'draft',
    published_at: published ? previous?.published_at || new Date().toISOString() : null,
  };
  const query = db.from('portfolio_posts');
  const result = originalSlug
    ? await query.update(entry).eq('slug', originalSlug).select('slug').single()
    : await query.insert(entry);
  if (result.error?.code === '23505') throw new InputError('An article already uses this URL slug.');
  if (result.error) throw result.error;
  return published || previous?.status === 'published';
}

export async function updateInbox(db, form) {
  const id = recordId(form);
  const read = field(form, 'read', 3);
  if (!['yes', 'no'].includes(read)) throw new InputError('Choose a message status.');
  const result = await db.from('portfolio_messages').update({ read_at: read === 'yes' ? new Date().toISOString() : null }).eq('id', id).select('id').single();
  if (result.error) throw result.error;
}

export async function saveProjectSettings(db, form) {
  const slug = field(form, 'slug', 100);
  if (!projects.some(project => project.slug === slug)) throw new InputError('Choose a project from the portfolio.');
  const { error } = await db.from('portfolio_project_settings').upsert({
    slug, featured: form.get('featured') === 'yes', display_order: displayOrder(form),
  });
  if (error) throw error;
}

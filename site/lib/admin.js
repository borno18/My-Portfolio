import { field, InputError, removeArticleCover, uploadArticleCover } from './server.js';
import { projects } from './work.js';
import { getRepository } from './github.js';

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

export async function savePost(db, post, originalSlug, published, form) {
  if (originalSlug && originalSlug !== post.slug) throw new InputError('An existing article keeps its original URL.');
  let previous;
  if (originalSlug) {
    const existing = await db.from('portfolio_posts').select('status,published_at,cover_path').eq('slug', originalSlug).single();
    if (existing.error) throw existing.error;
    previous = existing.data;
  }
  const previousPath = previous?.cover_path || null;
  const file = form.get('cover');
  const hasFile = file instanceof File && file.size > 0;
  const remove = form.get('remove_cover') === 'yes';
  if (hasFile && remove) throw new InputError('Choose a replacement cover or remove the current cover.');
  const keepCover = hasFile || (previousPath && !remove);
  const alt = keepCover ? field(form, 'cover_alt', 250, true) : '';
  if (keepCover && !alt) throw new InputError('Describe the cover in the alt text field.');
  const newPath = hasFile ? await uploadArticleCover(db, post.slug, file) : null;
  const coverPath = newPath || (remove ? null : previousPath);
  const entry = {
    ...post,
    status: published ? 'published' : 'draft',
    published_at: published ? previous?.published_at || new Date().toISOString() : null,
    cover_path: coverPath,
    cover_alt: alt,
  };
  const query = db.from('portfolio_posts');
  try {
    if (originalSlug) {
      const update = query.update(entry).eq('slug', originalSlug);
      const result = await (previousPath ? update.eq('cover_path', previousPath) : update.is('cover_path', null)).select('slug').maybeSingle();
      if (result.error) throw result.error;
      if (!result.data) throw new InputError('The article changed while you were editing. Reload it before saving again.');
    } else {
      const { error } = await query.insert(entry);
      if (error?.code === '23505') throw new InputError('An article already uses this URL slug.');
      if (error) throw error;
    }
  } catch (error) {
    // On a transport failure, the database may already reference the upload.
    if (error instanceof InputError) await removeArticleCover(db, newPath);
    throw error;
  }
  if (previousPath !== coverPath) await removeArticleCover(db, previousPath);
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
  const placement = { featured: form.get('featured') === 'yes', display_order: displayOrder(form) };
  const table = db.from('portfolio_project_settings');
  const { error } = projects.some(project => project.slug === slug)
    ? await table.upsert({ slug, ...placement })
    : await table.update(placement).eq('slug', slug).select('slug').single();
  if (error) throw error;
}

export async function featureRepository(db, form) {
  const repo = await getRepository(field(form, 'repository', 100));
  if (!repo) throw new InputError('Choose a public repository owned by borno18.');
  if (projects.some(project => project.repo.toLowerCase().endsWith('/' + repo.name.toLowerCase()))) {
    throw new InputError('This repository already has a case study. Use its placement settings.');
  }
  const { slug, ...repository } = repo;
  const { error } = await db.from('portfolio_project_settings').upsert({
    slug, repository, featured: true, display_order: 100,
  }, { onConflict: 'slug', ignoreDuplicates: true });
  if (error) throw error;
}

export async function changePostVisibility(db, form, remove) {
  const slug = field(form, 'slug', 100);
  if (remove && form.get('confirm') !== 'yes') throw new InputError('Confirm deletion before continuing.');
  const table = db.from('portfolio_posts');
  const mutation = remove ? table.delete() : table.update({ status: 'draft', published_at: null });
  const { data, error } = await mutation.eq('slug', slug).select('cover_path').maybeSingle();
  if (error) throw error;
  if (remove) await removeArticleCover(db, data?.cover_path);
}

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
  const tags = [...new Set(field(form, 'tags', 380, true).split(',').map(tag => tag.trim()).filter(Boolean))];
  if (tags.length > 12 || tags.some(tag => tag.length > 30)) throw new InputError('Use up to 12 tags of 30 characters each.');
  return {
    title: field(form, 'title', 140),
    alt: field(form, 'alt', 250),
    category: field(form, 'category', 40),
    caption: field(form, 'caption', 1000, true),
    display_order: displayOrder(form),
    album_id: albumId(form),
    visible: form.get('visible') === 'yes',
    featured: form.get('featured') === 'yes',
    tags,
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

export function publishAt(value, now = Date.now()) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new InputError('Enter a valid publication date and time.');
  const date = new Date(value + ':00Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 16) !== value) throw new InputError('Enter a valid publication date and time.');
  const timestamp = date.getTime() - 6 * 60 * 60 * 1000;
  if (timestamp <= now) throw new InputError('Choose a publication time in the future.');
  return new Date(timestamp).toISOString();
}

export function recordId(form) {
  const id = field(form, 'id', 36);
  if (!validRecordId(id)) throw new InputError('Choose a valid item.');
  return id;
}

export function validRecordId(id) {
  return typeof id === 'string' && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(id);
}

function albumId(form) {
  const id = field(form, 'album_id', 36, true);
  if (id && !validRecordId(id)) throw new InputError('Choose a valid album.');
  return id || null;
}

export async function setPhotoPlacement(db, form, action) {
  const ids = [...new Set(form.getAll('id'))];
  if (!ids.length || ids.length > 100 || !ids.every(validRecordId)) throw new InputError('Select up to 100 photographs.');
  const change = {
    'feature-photos': { featured: true },
    'unfeature-photos': { featured: false },
    'hide-photos': { visible: false },
    'show-photos': { visible: true },
    'move-photos': action === 'move-photos' ? { album_id: albumId(form) } : null,
  }[action];
  const { data, error } = await db.from('portfolio_photos').update(change).in('id', ids).select('id');
  if (error) throw error;
  return data.length;
}

export async function reorderPhotos(db, form) {
  const ids = form.getAll('id');
  if (!ids.length || ids.length > 1000 || !ids.every(validRecordId) || new Set(ids).size !== ids.length) throw new InputError('Reload the gallery before reordering.');
  const { data, error } = await db.rpc('portfolio_reorder_photos', { photo_ids: ids });
  if (error) throw error;
  if (!data) throw new InputError('The gallery changed. Reload it and try again.');
}

export async function createPhotoAlbum(db, form) {
  const { data, error } = await db.from('portfolio_photo_albums').insert({ name: field(form, 'album_name', 40) }).select('id').single();
  if (error?.code === '23505') throw new InputError('An album already has that name.');
  if (error) throw error;
  return data.id;
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
  const schedule = field(form, 'publish_at', 16, true);
  const date = published && schedule ? publishAt(schedule) : null;
  const newPath = hasFile ? await uploadArticleCover(db, post.slug, file) : null;
  const coverPath = newPath || (remove ? null : previousPath);
  const entry = {
    ...post,
    status: published ? 'published' : form.get('action') === 'save-archive' ? 'archived' : 'draft',
    published_at: published ? date || (previous?.published_at && new Date(previous.published_at) <= new Date() ? previous.published_at : new Date().toISOString()) : null,
    featured: form.get('featured') === 'yes',
    updated_at: new Date().toISOString(),
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
  return { changedPublic: published || previous?.status === 'published', scheduled: Boolean(date) };
}

export async function updateInbox(db, form, action) {
  const id = recordId(form);
  const table = db.from('portfolio_messages');
  let mutation;
  if (action === 'delete-message') {
    if (form.get('confirm') !== 'yes') throw new InputError('Confirm deletion before continuing.');
    mutation = table.delete();
  } else {
    const key = action === 'star-message' ? 'starred' : 'read';
    const value = field(form, key, 3);
    if (!['yes', 'no'].includes(value)) throw new InputError('Choose a message status.');
    mutation = table.update(key === 'starred'
      ? { starred: value === 'yes' }
      : { read_at: value === 'yes' ? new Date().toISOString() : null });
  }
  const result = await mutation.eq('id', id).select('id').single();
  if (result.error) throw result.error;
}

export async function saveProjectSettings(db, form, toggleOnly = false) {
  const slug = field(form, 'slug', 100);
  const placement = toggleOnly
    ? { featured: form.get('featured') === 'yes' }
    : { featured: form.get('featured') === 'yes', display_order: displayOrder(form) };
  const table = db.from('portfolio_project_settings');
  const result = await table.update(placement).eq('slug', slug).select('slug').maybeSingle();
  if (result.error) throw result.error;
  if (result.data) return;
  const index = projects.findIndex(project => project.slug === slug);
  if (index === -1) throw new InputError('Choose an existing portfolio project.');
  const inserted = await table.upsert({ slug, display_order: index * 10, ...placement }, { onConflict: 'slug', ignoreDuplicates: true }).select('slug').maybeSingle();
  if (inserted.error) throw inserted.error;
  if (!inserted.data) {
    const updated = await table.update(placement).eq('slug', slug).select('slug').single();
    if (updated.error) throw updated.error;
  }
}

export async function featureRepository(db, form) {
  const repo = await getRepository(field(form, 'repository', 100));
  if (!repo) throw new InputError('Choose a public repository owned by borno18.');
  if (projects.some(project => project.repo.toLowerCase().endsWith('/' + repo.name.toLowerCase()))) {
    throw new InputError('This repository already has a case study. Use its placement settings.');
  }
  const { slug, ...repository } = repo;
  const table = db.from('portfolio_project_settings');
  const inserted = await table.upsert({
    slug, repository, featured: true, display_order: 100,
  }, { onConflict: 'slug', ignoreDuplicates: true }).select('slug').maybeSingle();
  if (inserted.error) throw inserted.error;
  if (inserted.data) return;
  const updated = await table.update({ featured: true, repository }).eq('slug', slug).select('slug').single();
  if (updated.error) throw updated.error;
}

export async function changePostVisibility(db, form, remove) {
  const slug = field(form, 'slug', 100);
  if (remove && form.get('confirm') !== 'yes') throw new InputError('Confirm deletion before continuing.');
  const table = db.from('portfolio_posts');
  const mutation = remove ? table.delete() : table.update({ status: 'draft', published_at: null, updated_at: new Date().toISOString() });
  const { data, error } = await mutation.eq('slug', slug).select('cover_path').maybeSingle();
  if (error) throw error;
  if (remove) await removeArticleCover(db, data?.cover_path);
}

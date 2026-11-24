import { createServerClient } from '@supabase/ssr';
import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { env } from './content.js';

export function authClient(context) {
  const url = env('SUPABASE_URL');
  const key = env('SUPABASE_PUBLISHABLE_KEY');
  if (!url || !key || !env('PORTFOLIO_OWNER_ID')) return null;
  return createServerClient(url, key, {
    cookieOptions: { path: '/', httpOnly: true, secure: context.url.protocol === 'https:', sameSite: 'lax' },
    cookies: {
      getAll: () => readCookies(context.request.headers.get('cookie')),
      setAll: cookies => cookies.forEach(({ name, value, options }) => context.cookies.set(name, value, options)),
    },
  });
}

function readCookies(header) {
  return (header || '').split(';').flatMap(part => {
    const index = part.indexOf('=');
    if (index < 1) return [];
    try { return [{ name: part.slice(0, index).trim(), value: decodeURIComponent(part.slice(index + 1)) }]; }
    catch { return []; }
  });
}

export async function ownerSession(db) {
  const { data: { user } } = await db.auth.getUser();
  if (!user || user.id !== env('PORTFOLIO_OWNER_ID') || user.app_metadata?.portfolio_role !== 'owner') return { user: null, verified: false };
  const { data } = await db.auth.mfa.getAuthenticatorAssuranceLevel();
  return { user, verified: data?.currentLevel === 'aal2' };
}

export function sameOrigin(request) {
  return request.headers.get('origin') === new URL(request.url).origin;
}

export function field(form, name, max, optional = false) {
  const value = form.get(name);
  if (typeof value !== 'string' || value.trim().length > max || (!optional && !value.trim())) {
    throw new InputError('Check the ' + name + ' field and try again.');
  }
  return value.trim();
}

export class InputError extends Error {}

export async function uploadArticleCover(db, slug, file) {
  if (file.size > 3500000) throw new InputError('Choose a cover under 3.5 MB.');
  let bytes;
  try {
    const image = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 48000000 });
    const { format, pages } = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(format) || Number(pages) > 1) throw new Error();
    bytes = await image.rotate().resize(1600, 1200, { fit: 'inside', withoutEnlargement: true }).flatten({ background: '#ffffff' }).jpeg({ quality: 86 }).toBuffer();
  } catch {
    throw new InputError('Choose a valid JPG, PNG or WebP cover under 48 megapixels.');
  }
  const path = slug + '/' + randomUUID() + '.jpg';
  const { error } = await db.storage.from('article-covers').upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;
  return path;
}

export async function removeArticleCover(db, path) {
  if (!path) return;
  try {
    const { error } = await db.storage.from('article-covers').remove([path]);
    if (error) console.warn('Article cover cleanup failed', { code: error.statusCode });
  } catch {
    console.warn('Article cover cleanup failed');
  }
}

function mediaConfig() {
  const config = { cloud_name: env('CLOUDINARY_CLOUD_NAME'), api_key: env('CLOUDINARY_API_KEY'), api_secret: env('CLOUDINARY_API_SECRET') };
  if (!Object.values(config).every(Boolean)) throw new InputError('Photo storage needs to be configured.');
  return config;
}

async function cloudinaryImage(action, config, params, file) {
  const signed = { ...params, timestamp: Math.floor(Date.now() / 1000) };
  const form = new FormData();
  for (const [name, value] of Object.entries(signed)) form.set(name, String(value));
  form.set('api_key', config.api_key);
  form.set('signature', cloudinary.utils.api_sign_request(signed, config.api_secret));
  if (file) form.set('file', new Blob([file], { type: 'image/jpeg' }), 'photograph.jpg');
  let response;
  try {
    response = await fetch('https://api.cloudinary.com/v1_1/' + encodeURIComponent(config.cloud_name) + '/image/' + action, {
      method: 'POST', body: form, redirect: 'error', signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new InputError('Cloudinary could not be reached. Try again in a moment.');
  }
  if (!response.ok) {
    console.error('Cloudinary rejected photo operation', { action, status: response.status });
    if (response.status === 401) throw new InputError('Cloudinary could not authenticate the configured API key.');
    if (response.status === 403) {
      throw new InputError(action === 'upload'
        ? 'Cloudinary denied the upload. Give the configured API key permission to create assets.'
        : 'Cloudinary denied removal. Give the configured API key permission to delete assets.');
    }
    throw new InputError('Cloudinary could not process this photograph.');
  }
  return response.json();
}

async function uploadPhotoAsset(config, file, public_id) {
  if (!(file instanceof File) || !file.size || file.size > 3500000) throw new InputError('Select an image under 3.5 MB.');
  let bytes;
  try {
    const image = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 32000000 });
    const { format, pages } = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(format) || Number(pages) > 1) throw new Error();
    bytes = await image.rotate().resize(2000, 2000, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer();
  } catch { throw new InputError('Choose a valid JPEG, PNG, or WebP with at most 32 megapixels.'); }
  const uploaded = await cloudinaryImage('upload', config, { public_id, overwrite: false }, bytes);
  return { public_id, cloud_name: config.cloud_name, version: uploaded.version, width: uploaded.width, height: uploaded.height };
}

export async function publishPhoto(db, form, metadata) {
  const config = mediaConfig();
  const id = randomUUID();
  const asset = await uploadPhotoAsset(config, form.get('photo'), 'portfolio/' + id);
  const { error } = await db.from('portfolio_photos').insert({ ...metadata, ...asset, id });
  if (error) {
    await cleanUpPhotoAsset(config, asset.public_id);
    throw error;
  }
}

async function currentPhotoAsset(db, id) {
  const { data, error } = await db.from('portfolio_photos').select('public_id,cloud_name').eq('id', id).single();
  if (error) throw error;
  return data;
}

function matchPhotoAsset(query, publicId) {
  return publicId ? query.eq('public_id', publicId) : query.is('public_id', null);
}

async function destroyPhotoAsset(config, public_id) {
  const deleted = await cloudinaryImage('destroy', config, { public_id, invalidate: true });
  if (!['ok', 'not found'].includes(deleted.result)) throw new Error('Media removal failed');
}

async function cleanUpPhotoAsset(config, publicId) {
  try { await destroyPhotoAsset(config, publicId); }
  catch { console.warn('Gallery photo cleanup failed', { publicId }); }
}

export async function editPhoto(db, id, metadata, file) {
  if (!(file instanceof File) || !file.size) {
    const { error } = await db.from('portfolio_photos').update(metadata).eq('id', id).select('id').single();
    if (error) throw error;
    return;
  }
  const config = mediaConfig();
  const previous = await currentPhotoAsset(db, id);
  if (previous.public_id && previous.cloud_name !== config.cloud_name) throw new InputError('This photograph belongs to another media account.');
  const asset = await uploadPhotoAsset(config, file, 'portfolio/' + randomUUID());
  const update = db.from('portfolio_photos').update({ ...metadata, ...asset }).eq('id', id);
  const { data, error } = await matchPhotoAsset(update, previous.public_id).select('id').maybeSingle();
  if (error || !data) {
    if (!error || error.code) await cleanUpPhotoAsset(config, asset.public_id);
    throw error || new InputError('This photograph changed while you were editing it. Refresh and try again.');
  }
  if (previous.public_id) await cleanUpPhotoAsset(config, previous.public_id);
}

export async function removePhoto(db, id) {
  const previous = await currentPhotoAsset(db, id);
  if (previous.public_id) {
    const config = mediaConfig();
    if (previous.cloud_name !== config.cloud_name) throw new InputError('This photograph belongs to another media account.');
    await destroyPhotoAsset(config, previous.public_id);
  }
  const removal = db.from('portfolio_photos').delete().eq('id', id);
  const { data, error } = await matchPhotoAsset(removal, previous.public_id).select('id').maybeSingle();
  if (error) throw error;
  if (!data) throw new InputError('This photograph changed before it could be removed. Refresh and try again.');
}

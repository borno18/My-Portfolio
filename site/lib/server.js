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

export async function rebuild() {
  const hook = env('VERCEL_DEPLOY_HOOK');
  if (!hook || !/^https:\/\/api\.vercel\.com\/v1\/integrations\/deploy\/[^/]+\/[^/?#]+$/.test(hook)) return false;
  try {
    return (await fetch(hook, { method: 'POST', signal: AbortSignal.timeout(8000) })).ok;
  } catch { return false; }
}

function mediaConfig() {
  const config = { cloud_name: env('CLOUDINARY_CLOUD_NAME'), api_key: env('CLOUDINARY_API_KEY'), api_secret: env('CLOUDINARY_API_SECRET') };
  if (!Object.values(config).every(Boolean)) throw new InputError('Photo storage needs to be configured.');
  return config;
}

export async function publishPhoto(db, form) {
  const title = field(form, 'title', 140);
  const alt = field(form, 'alt', 250);
  const category = field(form, 'category', 40);
  const caption = field(form, 'caption', 1000, true);
  const file = form.get('photo');
  if (!(file instanceof File) || !file.size || file.size > 3500000) throw new InputError('Select an image under 3.5 MB.');
  const config = mediaConfig();
  const id = randomUUID();
  const public_id = 'portfolio/' + id;
  let bytes;
  try {
    const image = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 32000000 });
    const { format, pages } = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(format) || Number(pages) > 1) throw new Error();
    bytes = await image.rotate().resize(2000, 2000, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer();
  } catch { throw new InputError('Choose a valid JPEG, PNG, or WebP with at most 32 megapixels.'); }
  const uploaded = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ ...config, resource_type: 'image', public_id, overwrite: false, timeout: 12000 }, (error, result) => error ? reject(error) : resolve(result)).end(bytes);
  });
  const { error } = await db.from('portfolio_photos').insert({ id, title, alt, category, caption, public_id, cloud_name: config.cloud_name, version: uploaded.version, width: uploaded.width, height: uploaded.height });
  if (error) {
    await cloudinary.uploader.destroy(public_id, { ...config, invalidate: true }).catch(() => {});
    throw error;
  }
}

export async function removePhoto(db, id) {
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new InputError('Choose a photograph to remove.');
  const { data, error } = await db.from('portfolio_photos').select('public_id,cloud_name').eq('id', id).single();
  if (error) throw error;
  const config = mediaConfig();
  if (data.cloud_name !== config.cloud_name) throw new InputError('This photograph belongs to another media account.');
  const deleted = await cloudinary.uploader.destroy(data.public_id, { ...config, invalidate: true });
  if (!['ok', 'not found'].includes(deleted.result)) throw new Error('Media removal failed');
  const result = await db.from('portfolio_photos').delete().eq('id', id);
  if (result.error) throw result.error;
}

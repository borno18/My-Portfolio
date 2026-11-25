import { dangerouslyDeleteByTag } from '@vercel/functions';

export const publicCacheTags = {
  blog: 'portfolio-blog',
  photos: 'portfolio-photos',
  projects: 'portfolio-projects',
};

export function cachePublic(headers, ...tags) {
  headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  headers.set('Vercel-CDN-Cache-Control', 'public, max-age=60');
  headers.set('Vercel-Cache-Tag', tags.join(','));
}

export async function clearPublicCache(section) {
  try {
    await dangerouslyDeleteByTag(publicCacheTags[section], { revalidationDeadlineSeconds: 0 });
  } catch (error) {
    // The write already succeeded. Cached listings expire after 60 seconds.
    console.warn('Could not clear the public portfolio cache', { section, code: error?.code });
  }
}

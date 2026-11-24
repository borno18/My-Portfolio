import { photos } from '../../src/assets/photos.js';
import { cloudImage, getPublishedPhotos } from './content.js';

export const presetImages = new Map(photos.map(photo => [photo.key, photo.src]));

export async function galleryPhotos() {
  const published = await getPublishedPhotos();
  if (!published) return photos.map(photo => ({
    bundled_key: photo.key, title: photo.title, category: photo.category, caption: photo.location,
    alt: photo.title, src: photo.src,
  }));
  return published.map(photo => ({
    ...photo,
    src: photo.public_id ? undefined : presetImages.get(photo.bundled_key),
  })).filter(photo => photo.src || cloudImage(photo, 960));
}

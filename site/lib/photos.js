import { photos } from '../../src/assets/photos.js';

export const localPhotos = photos.map((photo, index) => ({ ...photo, id: `archive-${index}` }));
export const featuredPhoto = localPhotos.find(photo => photo.title === 'A Dream Afternoon');

/**
 * Appends Cloudinary transformation parameters to automatically optimize,
 * format, compress, and scale high-resolution images.
 * 
 * @param {string} url - The raw Cloudinary image URL
 * @param {number} width - The target width for scaling
 * @returns {string} The optimized Cloudinary URL
 */
export const optimizeCloudinaryUrl = (url, width = 1200) => {
    if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
        return url;
    }
    
    // Avoid double-applying transformations
    if (url.includes('/upload/c_') || url.includes('/upload/q_') || url.includes('/upload/f_')) {
        return url;
    }
    
    // Inject auto-formatting (WebP/AVIF), auto-quality compression, and max-width limit transformations
    return url.replace('/upload/', `/upload/c_limit,w_${width},q_auto,f_auto/`);
};

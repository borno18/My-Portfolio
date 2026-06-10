/**
 * ╔══════════════════════════════════════════════════════════╗
 *  PHOTOGRAPHY GALLERY — EASY ADD INSTRUCTIONS
 *  ────────────────────────────────────────────────────────
 *  To add a new photo from your Fujifilm:
 *
 *  1. Copy the photo file into:  src/assets/photos/
 *     (create the folder if it doesn't exist yet)
 *
 *  2. Add an import at the top of this file, e.g.:
 *       import myShot from './photos/my-new-photo.jpg';
 *
 *  3. Add an entry to the photos array below:
 *       {
 *         src:      myShot,
 *         title:    'Photo Title',
 *         category: 'Street',            // Festival / Street / Nature / Food / Architecture / Portrait
 *         location: 'Sylhet, Bangladesh',
 *       }
 *
 *  That's it! The gallery updates automatically.
 * ╚══════════════════════════════════════════════════════════╝
 */

// ── Existing photos ───────────────────────────────────────────────────────────
import img1 from './img_2287.jpg';
import img2 from './img_2362.jpg';
import img3 from './img_5326.jpg';
import img4 from './img_6881.jpg';
import img5 from './img_6957.jpg';

// ── Add new imports here ──────────────────────────────────────────────────────
// import myNewShot from './photos/my-new-photo.jpg';

/** @type {{ src: string, title: string, category: string, location?: string }[]} */
export const photos = [
    {
        src:      img1,
        title:    'Durga Puja Sylhet',
        category: 'Festival',
        location: 'Sylhet, Bangladesh',
    },
    {
        src:      img2,
        title:    'Devi Durga',
        category: 'Festival',
        location: 'Sylhet, Bangladesh',
    },
    {
        src:      img3,
        title:    'IICT SUST',
        category: 'Architecture',
        location: 'SUST, Sylhet',
    },
    {
        src:      img4,
        title:    'Home Kitchen',
        category: 'Food',
        location: 'Home',
    },
    {
        src:      img5,
        title:    'A Dream Afternoon',
        category: 'Street',
        location: 'Sylhet',
    },
    // ── Add new photo entries below ──────────────────────────────────────────
];

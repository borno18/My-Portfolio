import sharp from 'sharp';

const base = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#F5EFE5"/><path d="M950 52H1140V375C1140 505 1072 573 942 573H840C743 573 690 516 690 401V232C690 126 787 52 950 52Z" fill="#A5A79B"/><text x="68" y="260" font-family="Georgia" font-size="82" fill="#590907">Joydip</text><text x="68" y="350" font-family="Georgia" font-size="82" fill="#590907">Majumdar</text><text x="72" y="419" font-family="Arial" font-size="30" fill="#590907">Software Engineering at SUST</text></svg>');
const mask = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="340" height="445"><rect width="340" height="445" rx="76" fill="white"/></svg>');
const portrait = await sharp('site/assets/joydip-portrait.webp').resize(340, 445, { fit: 'cover' })
  .composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();

await sharp(base).composite([{ input: portrait, top: 105, left: 750 }]).png().toFile('public/social.png');

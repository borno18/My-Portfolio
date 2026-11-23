import sharp from 'sharp';

const base = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#E8D2B5"/><rect x="625" y="101" width="516" height="427" rx="16" fill="#590907"/><text x="68" y="260" font-family="Georgia" font-size="78" fill="#590907">Joydip</text><text x="68" y="345" font-family="Georgia" font-size="78" fill="#590907">Majumdar</text><text x="72" y="417" font-family="Arial" font-size="29" fill="#590907">Software Engineering at SUST</text></svg>');
const screenshot = await sharp('site/assets/sports.png').resize(484, 395, { fit: 'cover', position: 'north' }).png().toBuffer();
await sharp(base).composite([{ input: screenshot, top: 117, left: 641 }]).png().toFile('public/social.png');

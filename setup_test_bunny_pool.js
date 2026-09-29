require('dotenv').config();
const https = require('https');

const STORAGE_ENDPOINT = process.env.BUNNY_STORAGE_ENDPOINT || 'https://ny.storage.bunnycdn.com';
const STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || 'hunter-instient-1';
const ACCESS_KEY = process.env.BUNNY_STORAGE_ACCESS_KEY || 'ae29267f-2613-4ab0-98a6caad8c60-b880-4773';

function uploadBuffer(path, buffer, contentType = 'image/svg+xml') {
  return new Promise((resolve, reject) => {
    const url = `${STORAGE_ENDPOINT}/${STORAGE_ZONE}/${path}`;
    const req = https.request(url, {
      method: 'PUT',
      headers: {
        'AccessKey': ACCESS_KEY,
        'Content-Type': contentType,
        'Content-Length': buffer.length
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.statusCode);
        } else {
          reject(new Error(`Upload failed ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

function createDummySvg(text, bg = '#1a1a2e', fg = '#e94560') {
  return Buffer.from(`
<svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${bg}"/>
  <text x="50%" y="45%" font-family="Arial, sans-serif" font-size="44" fill="${fg}" text-anchor="middle" font-weight="bold">
    REBNY AI CATALOG DUMMY ASSET
  </text>
  <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="32" fill="#ffffff" text-anchor="middle">
    ${text}
  </text>
</svg>
  `.trim());
}

async function main() {
  console.log('Uploading test assets to BunnyCDN...');
  const rooms = ['living_room', 'kitchen', 'bedroom', 'bathroom'];

  for (let t = 1; t <= 10; t++) {
    const tierStr = `tier_${String(t).padStart(2, '0')}`;
    for (const room of rooms) {
      for (let i = 1; i <= 2; i++) {
        const imgName = `img_${String(i).padStart(2, '0')}.webp`;
        const path = `generic_stock_test/${tierStr}/${room}/${imgName}`;
        const label = `Tier ${t} | ${room.replace('_', ' ').toUpperCase()} #${i}`;
        const buffer = createDummySvg(label);
        await uploadBuffer(path, buffer);
        console.log(`Uploaded: ${path}`);
      }
    }
  }
  console.log('Done uploading test pool!');
}

main().catch(console.error);

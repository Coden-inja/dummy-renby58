require('dotenv').config();
const mysql = require('mysql2/promise');
const { generateDescription } = require('./templates');

const CDN_BASE_URL = `${process.env.BUNNY_PULL_ZONE_URL || 'https://hunter-pull-1.b-cdn.net'}/generic_stock_test`;

const DB_CONFIG = {
  host: process.env.DEV_DB_HOST || 'dev-db.heatfleet.com',
  port: parseInt(process.env.DEV_DB_PORT, 10) || 3306,
  user: process.env.DEV_DB_USER || 'sqladmin',
  password: process.env.DEV_DB_PASSWORD || 'U9F74xE41S5pS60ciV6jei1Ko',
  database: process.env.DEV_DB_NAME || 'hunterdb'
};

function getPriceTier(price) {
  const p = Number(price) || 0;
  if (p <= 500000) return 1;
  if (p <= 650000) return 2;
  if (p <= 850000) return 3;
  if (p <= 1150000) return 4;
  if (p <= 1500000) return 5;
  if (p <= 2000000) return 6;
  if (p <= 2900000) return 7;
  if (p <= 4450000) return 8;
  if (p <= 8000000) return 9;
  return 10;
}

function sampleListingImages(tier, rawBeds) {
  const tierStr = `tier_${String(tier).padStart(2, '0')}`;
  const images = [];
  const beds = parseInt(rawBeds, 10) || 0;
  const POOL_SIZE = 2;
  const randIdx = () => String(Math.floor(Math.random() * POOL_SIZE) + 1).padStart(2, '0');

  // Living Room
  images.push(`${CDN_BASE_URL}/${tierStr}/living_room/img_${randIdx()}.webp`);
  // Kitchen
  images.push(`${CDN_BASE_URL}/${tierStr}/kitchen/img_${randIdx()}.webp`);
  // Bedrooms (studios get 0 bedroom photos)
  if (beds > 0) {
    const bedCount = Math.min(3, beds);
    for (let b = 1; b <= bedCount; b++) {
      const idx = String(((b - 1) % POOL_SIZE) + 1).padStart(2, '0');
      images.push(`${CDN_BASE_URL}/${tierStr}/bedroom/img_${idx}.webp`);
    }
  }
  // Bathroom
  images.push(`${CDN_BASE_URL}/${tierStr}/bathroom/img_${randIdx()}.webp`);

  return { tier, images };
}

async function runDemo() {
  const conn = await mysql.createConnection(DB_CONFIG);

  const targetPrices = [300000, 750000, 1300000, 3500000, 15000000];
  const props = [];

  for (const tp of targetPrices) {
    const [rows] = await conn.query(`
      SELECT id, title, slug, price, bedrooms, total_bathrooms, sqft, address_street, address_subdivision, borough, property_type, frontend_title_unit_number
      FROM properties_backup
      WHERE is_published = 1 AND price >= ?
      ORDER BY price ASC
      LIMIT 1
    `, [tp]);
    if (rows.length > 0) props.push(rows[0]);
  }

  console.log(`\n======================================================`);
  console.log(`CROSS-TIER VERIFICATION: TASKS 5 TO 8 (TIERS 1 TO 10)`);
  console.log(`======================================================\n`);

  for (let i = 0; i < props.length; i++) {
    const prop = props[i];
    const tier = getPriceTier(prop.price);
    const { images } = sampleListingImages(tier, prop.bedrooms);
    const desc = generateDescription(prop, i);

    console.log(`------------------------------------------------------`);
    console.log(`[Tier ${tier}] Property #${prop.id}: ${prop.title}`);
    console.log(`Price: $${Number(prop.price).toLocaleString()} | Beds: ${prop.bedrooms} | Baths: ${prop.total_bathrooms} | Sqft: ${prop.sqft || 'N/A'}`);
    console.log(`Assigned Template: [Template #${desc.templateIndex}]`);
    console.log(`Sampled Photos (${images.length} photos):`);
    images.forEach((img, idx) => console.log(`  [${idx + 1}] ${img}`));
    console.log(`\nRewritten Description (Overview Hook):`);
    console.log(`  "${desc.overview.split('\n\n')[0]}"`);
    console.log(`------------------------------------------------------\n`);
  }

  await conn.end();
}

runDemo().catch(console.error);

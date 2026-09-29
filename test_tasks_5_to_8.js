require('dotenv').config();
const mysql = require('mysql2/promise');

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

function sampleListingImages(price, bedrooms) {
  const tier = getPriceTier(price);
  const tierStr = `tier_${String(tier).padStart(2, '0')}`;
  const images = [];
  const POOL_SIZE = 2;
  const randIdx = () => String(Math.floor(Math.random() * POOL_SIZE) + 1).padStart(2, '0');

  // Living Room
  images.push(`${CDN_BASE_URL}/${tierStr}/living_room/img_${randIdx()}.webp`);
  // Kitchen
  images.push(`${CDN_BASE_URL}/${tierStr}/kitchen/img_${randIdx()}.webp`);
  // Bedrooms
  const bedCount = Math.max(1, Math.min(3, parseInt(bedrooms, 10) || 1));
  for (let b = 1; b <= bedCount; b++) {
    const idx = String(((b - 1) % POOL_SIZE) + 1).padStart(2, '0');
    images.push(`${CDN_BASE_URL}/${tierStr}/bedroom/img_${idx}.webp`);
  }
  // Bathroom
  images.push(`${CDN_BASE_URL}/${tierStr}/bathroom/img_${randIdx()}.webp`);

  return { tier, images };
}

function generateRewrittenCopy(prop) {
  const neighborhood = prop.address_subdivision || prop.borough || 'Manhattan';
  const beds = parseInt(prop.bedrooms, 10) || 1;
  const baths = parseFloat(prop.total_bathrooms) || 1;
  const address = prop.address_street || 'Prime Location';
  const unit = prop.frontend_title_unit_number || '';
  const sqft = prop.sqft ? `${Number(prop.sqft).toLocaleString()} square feet` : null;

  const bedText = beds === 0 ? 'Studio residence' : `${beds}-bedroom`;
  const spaceClause = sqft ? `, encompassing approximately ${sqft}` : '';

  const hook = `Ideally situated in the vibrant heart of ${neighborhood}, Residence ${unit} at ${address} presents a beautifully proportioned ${bedText}${spaceClause}.`;
  const livingText = `The expansive main living and dining area is flooded with natural light, offering an open, airy atmosphere tailored for effortless entertaining and everyday comfort. Contemporary hardwood flooring and refined architectural lines create an immediate sense of home.`;
  const kitchenText = `A meticulously designed kitchen features polished stone countertops, custom cabinetry with premium hardware, and a suite of high-efficiency stainless steel appliances, blending culinary practicality with timeless modern design.`;
  const privateText = beds > 1 
    ? `The peaceful bedroom wing provides exceptional privacy. The primary suite features generous wardrobe storage and an en-suite spa bath appointed with tailored tilework and modern fixtures, complemented by bright, versatile secondary bedrooms.`
    : `The private bedroom suite serves as a serene sanctuary, complete with spacious custom closets and an adjoining bathroom outfitted with elegant stonework and contemporary fixtures.`;
  const buildingText = `Positioned in a premier full-service building with dedicated door service, concierge assistance, and close proximity to premier dining, shopping, and multiple transit routes, this home captures the quintessential New York lifestyle.`;

  const overview = `${hook}\n\n${livingText}\n\n${kitchenText}\n\n${privateText}\n\n${buildingText}`;
  const tts_clean_overview = `${hook} ${livingText} ${kitchenText} ${privateText} ${buildingText}`.replace(/\n+/g, ' ');
  const tts_clean_overview_html = `<p>${hook}</p><p>${livingText}</p><p>${kitchenText}</p><p>${privateText}</p><p>${buildingText}</p>`;

  return { overview, tts_clean_overview, tts_clean_overview_html };
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

  for (const prop of props) {
    const { tier, images } = sampleListingImages(prop.price, prop.bedrooms);
    const copy = generateRewrittenCopy(prop);

    console.log(`------------------------------------------------------`);
    console.log(`[Tier ${tier}] Property #${prop.id}: ${prop.title}`);
    console.log(`Price: $${Number(prop.price).toLocaleString()} | Beds: ${prop.bedrooms} | Baths: ${prop.total_bathrooms} | Sqft: ${prop.sqft || 'N/A'}`);
    console.log(`\nSampled Photos (${images.length} photos from Tier ${tier} Pool):`);
    images.forEach((img, i) => console.log(`  [${i + 1}] ${img}`));
    console.log(`\nRewritten Description (Overview Hook):`);
    console.log(`  "${copy.overview.split('\n\n')[0]}"`);
    console.log(`------------------------------------------------------\n`);
  }

  await conn.end();
}

runDemo().catch(console.error);

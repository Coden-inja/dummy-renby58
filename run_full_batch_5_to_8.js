require('dotenv').config();
const mysql = require('mysql2/promise');

// Parse CLI Arguments
const args = process.argv.slice(2);
const isExecute = args.includes('--execute');
const isDryRun = !isExecute || args.includes('--dry-run');

const targetArg = (args.find(a => a.startsWith('--target=')) || '--target=dev').split('=')[1];
const tableArg = (args.find(a => a.startsWith('--table=')) || '--table=backup').split('=')[1];
const poolArg = (args.find(a => a.startsWith('--pool=')) || '--pool=test').split('=')[1];
const limitArg = args.find(a => a.startsWith('--limit='));
const limitVal = limitArg ? parseInt(limitArg.split('=')[1], 10) : null;

// Database Configurations
const DB_CONFIGS = {
  dev: {
    host: process.env.DEV_DB_HOST || 'dev-db.heatfleet.com',
    port: parseInt(process.env.DEV_DB_PORT, 10) || 3306,
    user: process.env.DEV_DB_USER || 'sqladmin',
    password: process.env.DEV_DB_PASSWORD || 'U9F74xE41S5pS60ciV6jei1Ko',
    database: process.env.DEV_DB_NAME || 'hunterdb'
  },
  clone: {
    host: process.env.CLONE_DB_HOST || 'renby.systemstar.com',
    port: parseInt(process.env.CLONE_DB_PORT, 10) || 3310,
    user: process.env.CLONE_DB_USER || 'hunter_dev_wb',
    password: process.env.CLONE_DB_PASSWORD || '7ba7f666cd19c4dcde58475495e31bce',
    database: process.env.CLONE_DB_NAME || 'hunterdb_dev'
  }
};

const CDN_BASE_PULL = process.env.BUNNY_PULL_ZONE_URL || 'https://hunter-pull-1.b-cdn.net';
const CDN_BASE_URL = poolArg === 'prod'
  ? `${CDN_BASE_PULL}/generic_stock`
  : `${CDN_BASE_PULL}/generic_stock_test`;

const POOL_SIZE = poolArg === 'prod' ? 15 : 2;

const propTable = tableArg === 'backup' ? 'properties_backup' : 'properties';
const imgTable = tableArg === 'backup' ? 'properties_images_backup' : 'properties_images';

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

function sampleListingImages(tier, bedrooms) {
  const tierStr = `tier_${String(tier).padStart(2, '0')}`;
  const images = [];
  const randIdx = () => String(Math.floor(Math.random() * POOL_SIZE) + 1).padStart(2, '0');

  // 1 Living Room (position 0)
  images.push({ category: 'living_room', url: `${CDN_BASE_URL}/${tierStr}/living_room/img_${randIdx()}.webp` });
  // 1 Kitchen (position 1)
  images.push({ category: 'kitchen', url: `${CDN_BASE_URL}/${tierStr}/kitchen/img_${randIdx()}.webp` });

  // Bedrooms (position 2 to N+1)
  const bedCount = Math.max(1, Math.min(4, parseInt(bedrooms, 10) || 1));
  for (let b = 1; b <= bedCount; b++) {
    const idx = String(((b - 1) % POOL_SIZE) + 1).padStart(2, '0');
    images.push({ category: 'bedroom', url: `${CDN_BASE_URL}/${tierStr}/bedroom/img_${idx}.webp` });
  }

  // 1 Bathroom
  images.push({ category: 'bathroom', url: `${CDN_BASE_URL}/${tierStr}/bathroom/img_${randIdx()}.webp` });

  return images;
}

function generateRewrittenCopy(prop) {
  const neighborhood = prop.address_subdivision || prop.borough || 'Manhattan';
  const beds = parseInt(prop.bedrooms, 10) || 1;
  const baths = parseFloat(prop.total_bathrooms) || 1;
  const address = prop.address_street || 'Prime Location';
  const unit = prop.frontend_title_unit_number ? ` ${prop.frontend_title_unit_number}` : '';
  const sqft = prop.sqft ? `${Number(prop.sqft).toLocaleString()} square feet` : null;

  const bedText = beds === 0 ? 'Studio residence' : `${beds}-bedroom`;
  const spaceClause = sqft ? `, encompassing approximately ${sqft}` : '';

  const hook = `Ideally situated in the vibrant heart of ${neighborhood}, Residence${unit} at ${address} presents a beautifully proportioned ${bedText}${spaceClause}.`;
  const livingText = `The expansive main living and dining area is flooded with natural light, offering an open, airy atmosphere tailored for effortless entertaining and everyday comfort. Contemporary hardwood flooring and refined architectural lines create an immediate sense of home.`;
  const kitchenText = `A meticulously designed kitchen features polished stone countertops, custom cabinetry with premium hardware, and a suite of high-efficiency stainless steel appliances, blending culinary practicality with timeless modern design.`;
  const privateText = beds > 1 
    ? `The peaceful bedroom wing provides exceptional privacy. The primary suite features generous wardrobe storage and an en-suite spa bath appointed with tailored tilework and modern fixtures, complemented by bright, versatile secondary bedrooms.`
    : `The private bedroom suite serves as a serene sanctuary, complete with spacious custom closets and an adjoining bathroom outfitted with elegant stonework and contemporary fixtures.`;
  const buildingText = `Positioned in a premier full-service building with dedicated door service, concierge assistance, and close proximity to premier dining, shopping, and multiple transit routes, this home captures the quintessential New York lifestyle.`;

  const overview = `${hook}\n\n${livingText}\n\n${kitchenText}\n\n${privateText}\n\n${buildingText}`;
  const tts_clean_overview = `${hook} ${livingText} ${kitchenText} ${privateText} ${buildingText}`.replace(/\s+/g, ' ');
  const tts_clean_overview_html = `<p>${hook}</p><p>${livingText}</p><p>${kitchenText}</p><p>${privateText}</p><p>${buildingText}</p>`;
  const frontend_overview = `${hook} ${livingText}`;

  return { overview, frontend_overview, tts_clean_overview, tts_clean_overview_html };
}

async function main() {
  const dbConfig = DB_CONFIGS[targetArg];
  if (!dbConfig) {
    console.error(`Unknown target: ${targetArg}. Use --target=dev or --target=clone`);
    process.exit(1);
  }

  console.log(`\n===============================================================`);
  console.log(`REBNY ANONYMIZATION BATCH RUNNER (TASKS 5 TO 8)`);
  console.log(`===============================================================`);
  console.log(`Mode:        ${isDryRun ? 'DRY-RUN (Simulation Only - No DB writes)' : '*** LIVE EXECUTION ***'}`);
  console.log(`Target DB:   ${targetArg.toUpperCase()} (${dbConfig.host}:${dbConfig.port} / ${dbConfig.database})`);
  console.log(`Tables:      Properties: [${propTable}], Images: [${imgTable}]`);
  console.log(`CDN Pool:    ${poolArg.toUpperCase()} (${CDN_BASE_URL})`);
  if (limitVal) console.log(`Limit:       ${limitVal} listings`);
  console.log(`===============================================================\n`);

  const conn = await mysql.createConnection(dbConfig);

  const queryLimit = limitVal ? `LIMIT ${limitVal}` : '';
  const [listings] = await conn.query(`
    SELECT id, title, slug, price, bedrooms, total_bathrooms, sqft, address_street, address_subdivision, borough, property_type, frontend_title_unit_number
    FROM ${propTable}
    WHERE is_published = 1
    ORDER BY id ASC
    ${queryLimit}
  `);

  console.log(`Found ${listings.length} published listings to process.\n`);

  const tierCounts = {};
  let totalImagesGenerated = 0;

  for (let i = 0; i < listings.length; i++) {
    const prop = listings[i];
    const tier = getPriceTier(prop.price);
    tierCounts[tier] = (tierCounts[tier] || 0) + 1;

    const images = sampleListingImages(tier, prop.bedrooms);
    totalImagesGenerated += images.length;
    const copy = generateRewrittenCopy(prop);

    if (!isDryRun) {
      // 1. Delete old images for this listing in target table
      await conn.query(`DELETE FROM ${imgTable} WHERE property_id = ?`, [prop.id]);

      // 2. Insert new assigned images
      for (let pos = 0; pos < images.length; pos++) {
        await conn.query(`
          INSERT INTO ${imgTable} (property_id, original_url, large_url, medium_url, small_url, position, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          prop.id,
          images[pos].url,
          images[pos].url,
          images[pos].url,
          images[pos].url,
          pos
        ]);
      }

      // 3. Update listing descriptions
      await conn.query(`
        UPDATE ${propTable}
        SET overview = ?,
            frontend_overview = ?,
            tts_clean_overview = ?,
            tts_clean_overview_html = ?,
            updated_at = NOW()
        WHERE id = ?
      `, [
        copy.overview,
        copy.frontend_overview,
        copy.tts_clean_overview,
        copy.tts_clean_overview_html,
        prop.id
      ]);
    }

    if ((i + 1) % 250 === 0 || i === listings.length - 1) {
      console.log(`Progress: [${i + 1}/${listings.length}] listings processed...`);
    }
  }

  console.log(`\n----------------- SUMMARY -----------------`);
  console.log(`Total Listings Processed: ${listings.length}`);
  console.log(`Total Image Records:      ${totalImagesGenerated}`);
  console.log(`Tier Breakdown:`);
  for (let t = 1; t <= 10; t++) {
    console.log(`  Tier ${String(t).padStart(2, ' ')}: ${tierCounts[t] || 0} listings`);
  }
  console.log(`-------------------------------------------\n`);

  if (isDryRun) {
    console.log(`✓ Dry run complete. No database records were modified.`);
    console.log(`To execute live updates, pass the --execute flag.\n`);
  } else {
    console.log(`✓ Live batch update successfully completed!\n`);
  }

  await conn.end();
}

main().catch(err => {
  console.error('Fatal batch error:', err);
  process.exit(1);
});

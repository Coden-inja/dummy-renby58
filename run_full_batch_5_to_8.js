require('dotenv').config();
const mysql = require('mysql2/promise');
const { generateDescription, TEMPLATES } = require('./templates');

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
const voTable = tableArg === 'backup' ? 'properties_voice_over_backup' : 'properties_voice_over';

// Dynamic Tier Calculation strictly based on the listing's current/fuzzed price
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

// Samples tier-appropriate room stock images with accurate bedroom scaling
function sampleListingImages(tier, rawBeds) {
  const tierStr = `tier_${String(tier).padStart(2, '0')}`;
  const images = [];
  const beds = parseInt(rawBeds, 10) || 0;

  const randIdx = () => String(Math.floor(Math.random() * POOL_SIZE) + 1).padStart(2, '0');

  // 1. Living Room (Position 0 - Primary Hero)
  images.push({ category: 'living_room', url: `${CDN_BASE_URL}/${tierStr}/living_room/img_${randIdx()}.webp` });

  // 2. Kitchen (Position 1)
  images.push({ category: 'kitchen', url: `${CDN_BASE_URL}/${tierStr}/kitchen/img_${randIdx()}.webp` });

  // 3. Bedrooms: 
  // - If Studio (beds === 0): NO bedroom photo (3 photos total)
  // - If 1BR+: 1 to 4 distinct bedroom photos
  if (beds > 0) {
    const bedPhotoCount = Math.min(4, beds);
    for (let b = 1; b <= bedPhotoCount; b++) {
      const idx = String(((b - 1) % POOL_SIZE) + 1).padStart(2, '0');
      images.push({ category: 'bedroom', url: `${CDN_BASE_URL}/${tierStr}/bedroom/img_${idx}.webp` });
    }
  }

  // 4. Bathrooms:
  // - 1 standard bathroom photo (or 2 if 4+ beds luxury residence)
  const bathPhotoCount = beds >= 4 ? 2 : 1;
  for (let ba = 1; ba <= bathPhotoCount; ba++) {
    images.push({ category: 'bathroom', url: `${CDN_BASE_URL}/${tierStr}/bathroom/img_${randIdx()}.webp` });
  }

  return images;
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
  console.log(`Mode:           ${isDryRun ? 'DRY-RUN (Simulation Only - No DB writes)' : '*** LIVE EXECUTION ***'}`);
  console.log(`Target DB:      ${targetArg.toUpperCase()} (${dbConfig.host}:${dbConfig.port} / ${dbConfig.database})`);
  console.log(`Tables:         Properties: [${propTable}], Images: [${imgTable}]`);
  console.log(`CDN Pool:       ${poolArg.toUpperCase()} (${CDN_BASE_URL}, pool size: ${POOL_SIZE})`);
  console.log(`Templates:      20 Distinct Architectural Templates (Round-Robin)`);
  if (limitVal) console.log(`Limit:          ${limitVal} listings`);
  console.log(`===============================================================\n`);

  const conn = await mysql.createConnection(dbConfig);

  // Check if voice over table exists
  let hasVoTable = false;
  try {
    const [tables] = await conn.query(`SHOW TABLES LIKE ?`, [voTable]);
    hasVoTable = tables.length > 0;
  } catch (e) {
    hasVoTable = false;
  }

  const queryLimit = limitVal ? `LIMIT ${limitVal}` : '';
  const [listings] = await conn.query(`
    SELECT id, title, slug, price, bedrooms, total_bathrooms, sqft, address_street, address_subdivision, borough, property_type, frontend_title_unit_number
    FROM ${propTable}
    WHERE is_published = 1
    ORDER BY id ASC
    ${queryLimit}
  `);

  console.log(`Found ${listings.length} published listings to process.`);
  console.log(`Voice-over table [${voTable}]: ${hasVoTable ? 'Detected & Enabled' : 'Not present (skipping VO table sync)'}\n`);

  const tierCounts = {};
  const templateUsage = {};
  let totalImagesGenerated = 0;

  for (let i = 0; i < listings.length; i++) {
    const prop = listings[i];

    // Dynamic Tier strictly based on the listing's price
    const tier = getPriceTier(prop.price);
    tierCounts[tier] = (tierCounts[tier] || 0) + 1;

    // Room-based image assignment with Studio & multi-bed scaling
    const images = sampleListingImages(tier, prop.bedrooms);
    totalImagesGenerated += images.length;

    // Round-robin selection across 20 distinct architectural templates
    const desc = generateDescription(prop, i);
    templateUsage[desc.templateIndex] = (templateUsage[desc.templateIndex] || 0) + 1;

    if (!isDryRun) {
      // 1. Delete old images for this listing
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
        desc.overview,
        desc.frontend_overview,
        desc.tts_clean_overview,
        desc.tts_clean_overview_html,
        prop.id
      ]);

      // 4. Update voiceover table if present
      if (hasVoTable) {
        await conn.query(`
          UPDATE ${voTable}
          SET tts_clean_overview = ?,
              tts_clean_overview_html = ?,
              updated_at = NOW()
          WHERE property_id = ?
        `, [
          desc.tts_clean_overview,
          desc.tts_clean_overview_html,
          prop.id
        ]);
      }
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
  console.log(`\n20 Templates Distribution:`);
  for (let tpl = 1; tpl <= TEMPLATES.length; tpl++) {
    console.log(`  Template ${String(tpl).padStart(2, '0')}: ${templateUsage[tpl] || 0} uses`);
  }
  console.log(`-------------------------------------------\n`);

  if (isDryRun) {
    console.log(`✓ Dry run complete. Zero database records were modified.`);
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

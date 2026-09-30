require('dotenv').config();
const mysql = require('mysql2/promise');
const { generateDescription, TEMPLATES } = require('./templates');

// Parse CLI Arguments
const args = process.argv.slice(2);
const isExecute = args.includes('--execute');
const isDryRun = !isExecute || args.includes('--dry-run');
const skipImages = args.includes('--skip-images');

const targetArg = (args.find(a => a.startsWith('--target=')) || '--target=clone').split('=')[1];
const tableArg = (args.find(a => a.startsWith('--table=')) || '--table=main').split('=')[1];
const poolArg = (args.find(a => a.startsWith('--pool=')) || '--pool=test').split('=')[1];
const limitArg = args.find(a => a.startsWith('--limit='));
const limitVal = limitArg ? parseInt(limitArg.split('=')[1], 10) : null;
const concurrencyArg = args.find(a => a.startsWith('--concurrency='));
const CONCURRENCY = concurrencyArg ? parseInt(concurrencyArg.split('=')[1], 10) : 15;

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

// Table Mapping
const propTable = tableArg === 'backup' ? 'properties_backup' : 'properties';
const imgTable = tableArg === 'backup' ? 'properties_images_backup' : 'properties_images';
const agentTable = tableArg === 'backup' ? 'properties_agents_info_backup' : 'properties_agents_info';
const voTable = tableArg === 'backup' ? 'properties_voice_over_backup' : 'properties_voice_over';

// Task 9: 10 Fictional In-House Personas
const AGENT_PERSONAS = [
  { name: 'Alex Morgan', email: 'amorgan@renbyrealty.com', phone: '(212) 555-0101' },
  { name: 'Jordan Taylor', email: 'jtaylor@renbyrealty.com', phone: '(212) 555-0102' },
  { name: 'Casey Bennett', email: 'cbennett@renbyrealty.com', phone: '(212) 555-0103' },
  { name: 'Sam Rivera', email: 'srivera@renbyrealty.com', phone: '(212) 555-0104' },
  { name: 'Morgan Blake', email: 'mblake@renbyrealty.com', phone: '(212) 555-0105' },
  { name: 'Taylor Hayes', email: 'thayes@renbyrealty.com', phone: '(212) 555-0106' },
  { name: 'Riley Vance', email: 'rvance@renbyrealty.com', phone: '(212) 555-0107' },
  { name: 'Avery Brooks', email: 'abrooks@renbyrealty.com', phone: '(212) 555-0108' },
  { name: 'Devon Reed', email: 'dreed@renbyrealty.com', phone: '(212) 555-0109' },
  { name: 'Harper Quinn', email: 'hquinn@renbyrealty.com', phone: '(212) 555-0110' }
];

function getAgentPersona(propId) {
  const index = Math.abs(parseInt(propId, 10) || 0) % AGENT_PERSONAS.length;
  const p = AGENT_PERSONAS[index];
  return {
    agent_name: p.name,
    agent_brokerage: 'Renby Residential',
    agent_email: p.email,
    agent_phone: p.phone,
    frontend_agent_email: p.email,
    agent_img: null,
    listing_courtesy_name: 'Renby Residential',
    listing_courtesy_company: 'Renby Real Estate LLC',
    listing_courtesy_address: 'New York, NY 10001'
  };
}

// Task 6: Dynamic Price Deciles
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

// Task 8: Accurate Room-Based Image Assignment
function sampleListingImages(tier, rawBeds) {
  const tierStr = `tier_${String(tier).padStart(2, '0')}`;
  const images = [];
  const beds = parseInt(rawBeds, 10) || 0;
  const randIdx = () => String(Math.floor(Math.random() * POOL_SIZE) + 1).padStart(2, '0');

  // Living Room
  images.push({ category: 'living_room', url: `${CDN_BASE_URL}/${tierStr}/living_room/img_${randIdx()}.webp` });
  // Kitchen
  images.push({ category: 'kitchen', url: `${CDN_BASE_URL}/${tierStr}/kitchen/img_${randIdx()}.webp` });

  // Bedrooms: 0 for Studio; 1 to 4 for 1BR+
  if (beds > 0) {
    const bedPhotoCount = Math.min(4, beds);
    for (let b = 1; b <= bedPhotoCount; b++) {
      const idx = String(((b - 1) % POOL_SIZE) + 1).padStart(2, '0');
      images.push({ category: 'bedroom', url: `${CDN_BASE_URL}/${tierStr}/bedroom/img_${idx}.webp` });
    }
  }

  // Bathroom: 1 standard, 2 if 4+ beds
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
  console.log(`REBNY ANONYMIZATION HIGH-SPEED CONCURRENT PIPELINE`);
  console.log(`===============================================================`);
  console.log(`Mode:           ${isDryRun ? 'DRY-RUN (Simulation Only - ZERO DB writes)' : '*** LIVE EXECUTION ***'}`);
  console.log(`Target DB:      ${targetArg.toUpperCase()} (${dbConfig.host}:${dbConfig.port} / ${dbConfig.database})`);
  console.log(`Concurrency:    ${CONCURRENCY} Parallel Workers`);
  console.log(`Core Tables:    Properties: [${propTable}]`);
  console.log(`Image Table:    [${imgTable}] ${skipImages ? '(SKIPPED - Waiting for Graphic Designer)' : '(ACTIVE)'}`);
  console.log(`Agents Table:   [${agentTable}] (Task 9: Renby Personas)`);
  console.log(`Voice Table:    [${voTable}] (Task 11: TTS Sync & Mute)`);
  console.log(`Templates:      20 Distinct Architectural Templates (Round-Robin)`);
  if (limitVal) console.log(`Limit:          ${limitVal} listings`);
  console.log(`===============================================================\n`);

  // Create high-concurrency connection pool
  const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: CONCURRENCY + 5,
    queueLimit: 0
  });

  // Detect availability of auxiliary tables
  const [agentTables] = await pool.query(`SHOW TABLES LIKE ?`, [agentTable]);
  const hasAgentTable = agentTables.length > 0;

  const [voTables] = await pool.query(`SHOW TABLES LIKE ?`, [voTable]);
  const hasVoTable = voTables.length > 0;

  // Detect properties table schema
  const [propCols] = await pool.query(`DESCRIBE ${propTable}`);
  const propColNames = propCols.map(c => c.Field);
  const hasHtmlInProp = propColNames.includes('tts_clean_overview_html');

  let isCloneImgSchema = false;
  if (!skipImages) {
    const [imgCols] = await pool.query(`DESCRIBE ${imgTable}`);
    const imgColNames = imgCols.map(c => c.Field);
    isCloneImgSchema = imgColNames.includes('image_url');
  }

  console.log(`Auxiliary Table Detection:`);
  console.log(`  - Agents Table [${agentTable}]: ${hasAgentTable ? 'DETECTED' : 'Not found (will skip)'}`);
  console.log(`  - Voice Table  [${voTable}]:  ${hasVoTable ? 'DETECTED' : 'Not found (will skip)'}`);
  if (!skipImages) {
    console.log(`  - Images Schema: [${isCloneImgSchema ? 'Clone DB Schema (image_url, slug)' : 'Dev DB Schema (original_url, large_url...)'}]`);
  } else {
    console.log(`  - Images: SKIPPED (Task 8 deferred until designer assets uploaded)`);
  }
  console.log('');

  const queryLimit = limitVal ? `LIMIT ${limitVal}` : '';
  const [listings] = await pool.query(`
    SELECT id, title, slug, price, bedrooms, total_bathrooms, sqft, address_street, address_subdivision, borough, property_type, frontend_title_unit_number
    FROM ${propTable}
    WHERE is_published = 1
    ORDER BY id ASC
    ${queryLimit}
  `);

  console.log(`Found ${listings.length} published listings to process.\n`);

  const startTime = Date.now();

  async function processListing(prop, i) {
    const tier = getPriceTier(prop.price);
    const desc = generateDescription(prop, i);
    const agent = getAgentPersona(prop.id);

    if (!isDryRun) {
      // 1. Task 8: Images (if not skipped)
      if (!skipImages) {
        const images = sampleListingImages(tier, prop.bedrooms);
        await pool.query(`DELETE FROM ${imgTable} WHERE property_id = ?`, [prop.id]);
        for (let pos = 0; pos < images.length; pos++) {
          if (isCloneImgSchema) {
            await pool.query(`INSERT INTO ${imgTable} (property_id, slug, image_url) VALUES (?, ?, ?)`, [
              prop.id,
              prop.slug || `property-${prop.id}`,
              images[pos].url
            ]);
          } else {
            await pool.query(`INSERT INTO ${imgTable} (property_id, original_url, large_url, medium_url, small_url, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`, [
              prop.id,
              images[pos].url,
              images[pos].url,
              images[pos].url,
              images[pos].url,
              pos
            ]);
          }
        }
      }

      // 2. Task 5: Properties text
      if (hasHtmlInProp) {
        await pool.query(`
          UPDATE ${propTable}
          SET overview = ?, frontend_overview = ?, tts_clean_overview = ?, tts_clean_overview_html = ?, updated_at = NOW()
          WHERE id = ?
        `, [desc.overview, desc.frontend_overview, desc.tts_clean_overview, desc.tts_clean_overview_html, prop.id]);
      } else {
        await pool.query(`
          UPDATE ${propTable}
          SET overview = ?, frontend_overview = ?, tts_clean_overview = ?, updated_at = NOW()
          WHERE id = ?
        `, [desc.overview, desc.frontend_overview, desc.tts_clean_overview, prop.id]);
      }

      // 3. Task 9: Agents info
      if (hasAgentTable) {
        await pool.query(`
          UPDATE ${agentTable}
          SET agent_name = ?, agent_brokerage = ?, agent_email = ?, agent_phone = ?, agent_img = ?,
              frontend_agent_email = ?, listing_courtesy_name = ?, listing_courtesy_company = ?,
              listing_courtesy_address = ?, updated_at = NOW()
          WHERE property_id = ?
        `, [
          agent.agent_name, agent.agent_brokerage, agent.agent_email, agent.agent_phone, agent.agent_img,
          agent.frontend_agent_email, agent.listing_courtesy_name, agent.listing_courtesy_company,
          agent.listing_courtesy_address, prop.id
        ]);
      }

      // 4. Task 11: Voiceover sync & mute
      if (hasVoTable) {
        await pool.query(`
          UPDATE ${voTable}
          SET tts_clean_overview = ?, tts_clean_overview_html = ?, verified_tts_clean_overview = ?,
              audio_url = NULL, voice_over_url = NULL, updated_at = NOW()
          WHERE property_id = ?
        `, [desc.tts_clean_overview, desc.tts_clean_overview_html, desc.tts_clean_overview, prop.id]);
      }
    }
  }

  // Execute in concurrent parallel chunks
  for (let i = 0; i < listings.length; i += CONCURRENCY) {
    const chunk = listings.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map((prop, idx) => processListing(prop, i + idx)));

    const currentCount = Math.min(i + chunk.length, listings.length);
    if (currentCount % 250 < CONCURRENCY || currentCount === listings.length) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = (currentCount / (elapsed || 0.1)).toFixed(1);
      console.log(`Progress: [${currentCount}/${listings.length}] listings processed (${rate} listings/sec, ${elapsed}s elapsed)...`);
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n=================== BATCH SUMMARY ===================`);
  console.log(`Total Listings:           ${listings.length}`);
  console.log(`Total Elapsed Time:       ${totalTime} seconds`);
  console.log(`Average Speed:            ${(listings.length / totalTime).toFixed(1)} listings/second`);
  console.log(`=====================================================\n`);

  if (isDryRun) {
    console.log(`✓ DRY RUN COMPLETED SUCCESSFULLY. ZERO database writes occurred.`);
    console.log(`To execute live updates, run with: --execute\n`);
  } else {
    console.log(`✓ LIVE PIPELINE BATCH EXECUTION COMPLETED SUCCESSFULLY IN ${totalTime}s!\n`);
  }

  await pool.end();
}

main().catch(err => {
  console.error('Fatal batch error:', err);
  process.exit(1);
});

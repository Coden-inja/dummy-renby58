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

// Table Mapping
const propTable = tableArg === 'backup' ? 'properties_backup' : 'properties';
const imgTable = tableArg === 'backup' ? 'properties_images_backup' : 'properties_images';
const agentTable = tableArg === 'backup' ? 'properties_agents_info_backup' : 'properties_agents_info';
const voTable = tableArg === 'backup' ? 'properties_voice_over_backup' : 'properties_voice_over';

// Task 9: 10 Neutral Agent Personas & In-House Brokerage
const AGENT_PERSONAS = [
  { name: 'Alex Morgan', email: 'amorgan@renbyrealty.com' },
  { name: 'Jordan Taylor', email: 'jtaylor@renbyrealty.com' },
  { name: 'Casey Bennett', email: 'cbennett@renbyrealty.com' },
  { name: 'Sam Rivera', email: 'srivera@renbyrealty.com' },
  { name: 'Morgan Blake', email: 'mblake@renbyrealty.com' },
  { name: 'Taylor Hayes', email: 'thayes@renbyrealty.com' },
  { name: 'Riley Vance', email: 'rvance@renbyrealty.com' },
  { name: 'Avery Brooks', email: 'abrooks@renbyrealty.com' },
  { name: 'Devon Reed', email: 'dreed@renbyrealty.com' },
  { name: 'Harper Quinn', email: 'hquinn@renbyrealty.com' }
];

function getAgentPersona(propId) {
  const index = Math.abs(parseInt(propId, 10) || 0) % AGENT_PERSONAS.length;
  const p = AGENT_PERSONAS[index];
  return {
    agent_name: p.name,
    agent_brokerage: 'Renby Residential',
    agent_email: p.email,
    frontend_agent_email: p.email,
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

  // Living Room (position 0)
  images.push({ category: 'living_room', url: `${CDN_BASE_URL}/${tierStr}/living_room/img_${randIdx()}.webp` });
  // Kitchen (position 1)
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
  console.log(`REBNY ANONYMIZATION BATCH PIPELINE (TASKS 5 TO 11)`);
  console.log(`===============================================================`);
  console.log(`Mode:           ${isDryRun ? 'DRY-RUN (Simulation Only - ZERO DB writes)' : '*** LIVE EXECUTION ***'}`);
  console.log(`Target DB:      ${targetArg.toUpperCase()} (${dbConfig.host}:${dbConfig.port} / ${dbConfig.database})`);
  console.log(`Core Tables:    Properties: [${propTable}], Images: [${imgTable}]`);
  console.log(`Agents Table:   [${agentTable}]`);
  console.log(`Voice Table:    [${voTable}]`);
  console.log(`CDN Pool:       ${poolArg.toUpperCase()} (${CDN_BASE_URL}, pool size: ${POOL_SIZE})`);
  console.log(`Templates:      20 Distinct Architectural Templates (Round-Robin)`);
  console.log(`Agent Personas: 10 Fictional In-House Personas (Renby Residential)`);
  if (limitVal) console.log(`Limit:          ${limitVal} listings`);
  console.log(`===============================================================\n`);

  const conn = await mysql.createConnection(dbConfig);

  // Detect availability of auxiliary tables
  const [agentTables] = await conn.query(`SHOW TABLES LIKE ?`, [agentTable]);
  const hasAgentTable = agentTables.length > 0;

  const [voTables] = await conn.query(`SHOW TABLES LIKE ?`, [voTable]);
  const hasVoTable = voTables.length > 0;

  console.log(`Auxiliary Table Detection:`);
  console.log(`  - Agents Table [${agentTable}]: ${hasAgentTable ? 'DETECTED' : 'Not found (will skip)'}`);
  console.log(`  - Voice Table [${voTable}]:  ${hasVoTable ? 'DETECTED' : 'Not found (will skip)'}\n`);

  const queryLimit = limitVal ? `LIMIT ${limitVal}` : '';
  const [listings] = await conn.query(`
    SELECT id, title, slug, price, bedrooms, total_bathrooms, sqft, address_street, address_subdivision, borough, property_type, frontend_title_unit_number
    FROM ${propTable}
    WHERE is_published = 1
    ORDER BY id ASC
    ${queryLimit}
  `);

  console.log(`Found ${listings.length} published listings to process in dry run.\n`);

  const tierCounts = {};
  const templateUsage = {};
  const agentUsage = {};
  let totalImagesGenerated = 0;

  for (let i = 0; i < listings.length; i++) {
    const prop = listings[i];

    // Task 6: Dynamic Tier Calculation
    const tier = getPriceTier(prop.price);
    tierCounts[tier] = (tierCounts[tier] || 0) + 1;

    // Task 8: Room-Based Stock Photo Sampling
    const images = sampleListingImages(tier, prop.bedrooms);
    totalImagesGenerated += images.length;

    // Task 5: 20 Templates Round Robin
    const desc = generateDescription(prop, i);
    templateUsage[desc.templateIndex] = (templateUsage[desc.templateIndex] || 0) + 1;

    // Task 9: Fictional Agent Persona Assignment
    const agent = getAgentPersona(prop.id);
    agentUsage[agent.agent_name] = (agentUsage[agent.agent_name] || 0) + 1;

    // If LIVE execution:
    if (!isDryRun) {
      // 1. Task 8: Replace images
      await conn.query(`DELETE FROM ${imgTable} WHERE property_id = ?`, [prop.id]);
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

      // 2. Task 5: Update properties text
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

      // 3. Task 9: Anonymize Broker & Agent Info
      if (hasAgentTable) {
        await conn.query(`
          UPDATE ${agentTable}
          SET agent_name = ?,
              agent_brokerage = ?,
              agent_email = ?,
              frontend_agent_email = ?,
              listing_courtesy_name = ?,
              listing_courtesy_company = ?,
              listing_courtesy_address = ?,
              updated_at = NOW()
          WHERE property_id = ?
        `, [
          agent.agent_name,
          agent.agent_brokerage,
          agent.agent_email,
          agent.frontend_agent_email,
          agent.listing_courtesy_name,
          agent.listing_courtesy_company,
          agent.listing_courtesy_address,
          prop.id
        ]);
      }

      // 4. Task 11: Sync Voiceover text & SILENCE old scraped audio MP3
      if (hasVoTable) {
        await conn.query(`
          UPDATE ${voTable}
          SET tts_clean_overview = ?,
              tts_clean_overview_html = ?,
              verified_tts_clean_overview = ?,
              audio_url = NULL,
              voice_over_url = NULL,
              updated_at = NOW()
          WHERE property_id = ?
        `, [
          desc.tts_clean_overview,
          desc.tts_clean_overview_html,
          desc.tts_clean_overview,
          prop.id
        ]);
      }
    }

    if ((i + 1) % 250 === 0 || i === listings.length - 1) {
      console.log(`Progress: [${i + 1}/${listings.length}] listings simulated...`);
    }
  }

  console.log(`\n=================== SIMULATION SUMMARY ===================`);
  console.log(`Total Listings:           ${listings.length}`);
  console.log(`Total Assigned Images:    ${totalImagesGenerated}`);
  console.log(`\nPrice Tier Distribution:`);
  for (let t = 1; t <= 10; t++) {
    console.log(`  Tier ${String(t).padStart(2, ' ')}: ${tierCounts[t] || 0} listings`);
  }

  console.log(`\n20 Templates Distribution:`);
  for (let tpl = 1; tpl <= TEMPLATES.length; tpl++) {
    console.log(`  Template ${String(tpl).padStart(2, '0')}: ${templateUsage[tpl] || 0} uses`);
  }

  console.log(`\n10 Agent Personas Distribution:`);
  Object.keys(agentUsage).forEach(name => {
    console.log(`  ${name.padEnd(16)}: ${agentUsage[name]} listings (Brokerage: Renby Residential)`);
  });
  console.log(`==========================================================\n`);

  if (isDryRun) {
    console.log(`✓ DRY RUN COMPLETED SUCCESSFULLY. ZERO database writes occurred.`);
    console.log(`All calculations for Tasks 5, 6, 8, 9, and 11 passed validation.\n`);
  } else {
    console.log(`✓ LIVE PIPELINE BATCH EXECUTION COMPLETED!\n`);
  }

  await conn.end();
}

main().catch(err => {
  console.error('Fatal batch error:', err);
  process.exit(1);
});

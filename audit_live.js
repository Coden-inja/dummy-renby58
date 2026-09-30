require('dotenv').config();
const mysql = require('mysql2/promise');

async function auditLiveDB() {
  const conn = await mysql.createConnection({
    host: process.env.CLONE_DB_HOST || 'renby.systemstar.com',
    port: parseInt(process.env.CLONE_DB_PORT, 10) || 3310,
    user: process.env.CLONE_DB_USER || 'hunter_dev_wb',
    password: process.env.CLONE_DB_PASSWORD || '7ba7f666cd19c4dcde58475495e31bce',
    database: process.env.CLONE_DB_NAME || 'hunterdb_dev'
  });

  console.log('=== AUDITING REPLICA DB AFTER FULL LIVE RUN ===\n');

  // 1. Check Brokerages in properties_agents_info for published properties
  const [brokerages] = await conn.query(`
    SELECT pai.agent_brokerage, COUNT(*) as cnt
    FROM properties_agents_info pai
    JOIN properties p ON pai.property_id = p.id
    WHERE p.is_published = 1
    GROUP BY pai.agent_brokerage
  `);
  console.log('1. Brokerage Distribution on Published Listings:');
  console.table(brokerages);

  // 2. Check Voiceover audio URLs in properties_voice_over
  const [activeAudio] = await conn.query(`
    SELECT COUNT(*) as active_count
    FROM properties_voice_over pvo
    JOIN properties p ON pvo.property_id = p.id
    WHERE p.is_published = 1 AND (pvo.audio_url IS NOT NULL OR pvo.voice_over_url IS NOT NULL)
  `);
  console.log('2. Active Legacy Audio URLs Remaining (should be 0):', activeAudio[0].active_count);

  // 3. Sample 3 listings to verify template copy
  const [samples] = await conn.query(`
    SELECT id, title, address_street, frontend_overview 
    FROM properties 
    WHERE is_published = 1 
    ORDER BY id DESC 
    LIMIT 3
  `);
  console.log('\n3. Sample Recent Published Listings:');
  samples.forEach(s => {
    console.log(`[#${s.id}] ${s.title} (${s.address_street})`);
    console.log(`  "${s.frontend_overview}"\n`);
  });

  await conn.end();
}

auditLiveDB();

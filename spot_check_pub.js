require('dotenv').config();
const mysql = require('mysql2/promise');

async function spotCheckPublished() {
  const conn = await mysql.createConnection({
    host: process.env.CLONE_DB_HOST || 'renby.systemstar.com',
    port: parseInt(process.env.CLONE_DB_PORT, 10) || 3310,
    user: process.env.CLONE_DB_USER || 'hunter_dev_wb',
    password: process.env.CLONE_DB_PASSWORD || '7ba7f666cd19c4dcde58475495e31bce',
    database: process.env.CLONE_DB_NAME || 'hunterdb_dev'
  });

  const [samples] = await conn.query(`
    SELECT p.id, p.title, p.price, p.bedrooms, p.total_bathrooms, p.address_street, p.borough, p.frontend_overview,
           pai.agent_name, pai.agent_brokerage, pai.agent_email,
           pvo.audio_url, LEFT(pvo.tts_clean_overview, 90) as tts_preview
    FROM properties p
    JOIN properties_agents_info pai ON p.id = pai.property_id
    JOIN properties_voice_over pvo ON p.id = pvo.property_id
    WHERE p.is_published = 1
    ORDER BY p.id ASC
    LIMIT 5
  `);

  console.log('=== 5 PUBLISHED LISTINGS SPOT-CHECK (LIVE ON REPLICA DB) ===\n');
  samples.forEach((s, idx) => {
    console.log(`[#${idx + 1}] Listing ID #${s.id}: ${s.title}`);
    console.log(`  Borough: ${s.borough} | Price: $${Number(s.price).toLocaleString()} | Beds: ${s.bedrooms} | Baths: ${s.total_bathrooms}`);
    console.log(`  Frontend Overview: "${s.frontend_overview}"`);
    console.log(`  Agent: ${s.agent_name} | Brokerage: ${s.agent_brokerage} | Email: ${s.agent_email}`);
    console.log(`  Voice Audio: ${s.audio_url || 'NULL (Silenced)'} | TTS Text: "${s.tts_preview}..."\n`);
  });

  await conn.end();
}

spotCheckPublished();

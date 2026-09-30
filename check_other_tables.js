require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkOtherTables() {
  const conn = await mysql.createConnection({
    host: process.env.CLONE_DB_HOST || 'renby.systemstar.com',
    port: parseInt(process.env.CLONE_DB_PORT, 10) || 3310,
    user: process.env.CLONE_DB_USER || 'hunter_dev_wb',
    password: process.env.CLONE_DB_PASSWORD || '7ba7f666cd19c4dcde58475495e31bce',
    database: process.env.CLONE_DB_NAME || 'hunterdb_dev'
  });

  // Check properties_agents_info
  const [agents] = await conn.query('SELECT property_id, agent_name, agent_brokerage FROM properties_agents_info WHERE property_id IN (415, 424, 425)');
  console.log('Clone DB properties_agents_info sample:');
  console.table(agents);

  // Check properties_voice_over
  const [vo] = await conn.query('SELECT property_id, audio_url, tts_clean_overview FROM properties_voice_over WHERE property_id IN (415, 424, 425)');
  console.log('Clone DB properties_voice_over sample:');
  console.table(vo);

  // Check properties_images
  const [imgs] = await conn.query('SELECT property_id, original_url FROM properties_images WHERE property_id = 415 LIMIT 3');
  console.log('Clone DB properties_images sample:');
  console.table(imgs);

  await conn.end();
}

checkOtherTables();

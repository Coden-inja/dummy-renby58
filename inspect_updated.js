require('dotenv').config();
const mysql = require('mysql2/promise');

async function inspectUpdatedRows() {
  const conn = await mysql.createConnection({
    host: process.env.CLONE_DB_HOST || 'renby.systemstar.com',
    port: parseInt(process.env.CLONE_DB_PORT, 10) || 3310,
    user: process.env.CLONE_DB_USER || 'hunter_dev_wb',
    password: process.env.CLONE_DB_PASSWORD || '7ba7f666cd19c4dcde58475495e31bce',
    database: process.env.CLONE_DB_NAME || 'hunterdb_dev'
  });

  console.log('=== 1. Properties Table (Task 5 Description Check) ===');
  const [props] = await conn.query(`
    SELECT id, title, frontend_overview, tts_clean_overview 
    FROM properties 
    WHERE id = 415
  `);
  console.log('Property 415 frontend_overview:');
  console.log(' ', props[0].frontend_overview);

  console.log('\n=== 2. Properties Agents Info Table (Task 9 Persona Check) ===');
  const [agents] = await conn.query(`
    SELECT property_id, agent_name, agent_brokerage, agent_email, listing_courtesy_name, listing_courtesy_company 
    FROM properties_agents_info 
    WHERE property_id = 415
  `);
  console.table(agents);

  console.log('\n=== 3. Properties Voice Over Table (Task 11 Audio Silencing Check) ===');
  const [vo] = await conn.query(`
    SELECT property_id, audio_url, voice_over_url, LEFT(tts_clean_overview, 100) AS tts_preview 
    FROM properties_voice_over 
    WHERE property_id = 415
  `);
  console.table(vo);

  await conn.end();
}

inspectUpdatedRows();

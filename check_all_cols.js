require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkAllCols() {
  const conn = await mysql.createConnection({
    host: process.env.CLONE_DB_HOST || 'renby.systemstar.com',
    port: parseInt(process.env.CLONE_DB_PORT, 10) || 3310,
    user: process.env.CLONE_DB_USER || 'hunter_dev_wb',
    password: process.env.CLONE_DB_PASSWORD || '7ba7f666cd19c4dcde58475495e31bce',
    database: process.env.CLONE_DB_NAME || 'hunterdb_dev'
  });

  const [colsAgent] = await conn.query('DESCRIBE properties_agents_info');
  console.log('properties_agents_info columns on Clone DB:', colsAgent.map(c => c.Field));

  const [sampleAgent] = await conn.query('SELECT * FROM properties_agents_info WHERE property_id = 415 LIMIT 1');
  console.log('Sample agent on Clone DB:', sampleAgent);

  const [colsVO] = await conn.query('DESCRIBE properties_voice_over');
  console.log('properties_voice_over columns on Clone DB:', colsVO.map(c => c.Field));

  const [sampleVO] = await conn.query('SELECT * FROM properties_voice_over WHERE property_id = 415 LIMIT 1');
  console.log('Sample VO on Clone DB:', sampleVO);

  await conn.end();
}

checkAllCols();

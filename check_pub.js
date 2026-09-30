require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkPublish() {
  const conn = await mysql.createConnection({
    host: process.env.CLONE_DB_HOST || 'renby.systemstar.com',
    port: parseInt(process.env.CLONE_DB_PORT, 10) || 3310,
    user: process.env.CLONE_DB_USER || 'hunter_dev_wb',
    password: process.env.CLONE_DB_PASSWORD || '7ba7f666cd19c4dcde58475495e31bce',
    database: process.env.CLONE_DB_NAME || 'hunterdb_dev'
  });

  const [rows] = await conn.query('SELECT id, title, is_published FROM properties WHERE id IN (600, 2500, 7000)');
  console.log('Publish status for 600, 2500, 7000:');
  console.table(rows);

  const [pubCheck] = await conn.query(`
    SELECT COUNT(*) as unanonymized_pub_count
    FROM properties p
    JOIN properties_agents_info pai ON p.id = pai.property_id
    WHERE p.is_published = 1 AND pai.agent_brokerage != 'Renby Residential'
  `);
  console.log('Unanonymized PUBLISHED listings in properties_agents_info:', pubCheck[0].unanonymized_pub_count);

  const [totalPub] = await conn.query('SELECT COUNT(*) as total FROM properties WHERE is_published = 1');
  console.log('Total PUBLISHED listings in properties:', totalPub[0].total);

  const [totalUnpub] = await conn.query('SELECT COUNT(*) as total FROM properties WHERE is_published = 0');
  console.log('Total UNPUBLISHED listings in properties:', totalUnpub[0].total);

  await conn.end();
}

checkPublish();

require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkCols() {
  const conn = await mysql.createConnection({
    host: process.env.CLONE_DB_HOST || 'renby.systemstar.com',
    port: parseInt(process.env.CLONE_DB_PORT, 10) || 3310,
    user: process.env.CLONE_DB_USER || 'hunter_dev_wb',
    password: process.env.CLONE_DB_PASSWORD || '7ba7f666cd19c4dcde58475495e31bce',
    database: process.env.CLONE_DB_NAME || 'hunterdb_dev'
  });

  const [cols] = await conn.query('DESCRIBE properties_images');
  console.log('properties_images columns on Clone DB:', cols.map(c => c.Field));

  const [sampleImgs] = await conn.query('SELECT * FROM properties_images WHERE property_id = 415 LIMIT 3');
  console.log('Sample image records on Clone DB:', sampleImgs);

  await conn.end();
}

checkCols();

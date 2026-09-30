require('dotenv').config();
const mysql = require('mysql2/promise');

async function check() {
  const conn = await mysql.createConnection({
    host: process.env.CLONE_DB_HOST || 'renby.systemstar.com',
    port: parseInt(process.env.CLONE_DB_PORT, 10) || 3310,
    user: process.env.CLONE_DB_USER || 'hunter_dev_wb',
    password: process.env.CLONE_DB_PASSWORD || '7ba7f666cd19c4dcde58475495e31bce',
    database: process.env.CLONE_DB_NAME || 'hunterdb_dev'
  });

  const [row423] = await conn.query('SELECT id, title, frontend_title, frontend_title_unit_number, address_street, price, is_published FROM properties WHERE id = 423');
  console.log('Listing 423 on Clone DB:', row423);

  const [countPH] = await conn.query(`
    SELECT COUNT(*) as cnt 
    FROM properties 
    WHERE is_published = 1 AND (title LIKE '%PH%' OR frontend_title_unit_number LIKE '%PH%' OR title LIKE '%Penthouse%')
  `);
  console.log('Total published listings still having PH/Penthouse on Clone DB:', countPH[0].cnt);

  const [samplePH] = await conn.query(`
    SELECT id, title, frontend_title, frontend_title_unit_number 
    FROM properties 
    WHERE is_published = 1 AND (title LIKE '%PH%' OR frontend_title_unit_number LIKE '%PH%' OR title LIKE '%Penthouse%')
    LIMIT 10
  `);
  console.log('Sample PH records:', samplePH);

  await conn.end();
}

check();

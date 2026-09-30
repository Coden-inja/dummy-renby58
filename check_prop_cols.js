require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkPropCols() {
  const conn = await mysql.createConnection({
    host: process.env.CLONE_DB_HOST || 'renby.systemstar.com',
    port: parseInt(process.env.CLONE_DB_PORT, 10) || 3310,
    user: process.env.CLONE_DB_USER || 'hunter_dev_wb',
    password: process.env.CLONE_DB_PASSWORD || '7ba7f666cd19c4dcde58475495e31bce',
    database: process.env.CLONE_DB_NAME || 'hunterdb_dev'
  });

  const [cols] = await conn.query('DESCRIBE properties');
  const colNames = cols.map(c => c.Field);
  console.log('Columns containing overview/tts on properties:');
  console.log(colNames.filter(c => c.includes('overview') || c.includes('tts') || c.includes('desc')));

  await conn.end();
}

checkPropCols();

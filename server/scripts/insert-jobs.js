const mysql = require('mysql2/promise');
const fs = require('fs');

async function run() {
  const connection = await mysql.createConnection({
    host: '139.224.26.134',
    user: 'dma',
    password: 'QzwTwHR3YT85AbNf',
    database: 'dma',
    port: 3306,
  });

  const sql = fs.readFileSync('/workspace/server/db/update-target-entity.sql', 'utf8');
  
  // ignore insert errors (e.g. duplicate primary key)
  try {
    await connection.query(sql);
    console.log('Inserted jobs successfully');
  } catch (e) {
    console.error('Error inserting jobs:', e.message);
  }
  
  connection.end();
}

run();

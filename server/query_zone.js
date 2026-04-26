const mysql = require('mysql2/promise');
async function run() {
  const conn = await mysql.createConnection({ host:'127.0.0.1', user:'root', password:'123456', database:'dma' });
  try {
    const [rows] = await conn.execute("SELECT name, longitude, latitude, LEFT(boundary, 50) as b_part FROM water_zone WHERE boundary IS NOT NULL AND boundary != '' LIMIT 2;");
    console.log(rows);
  } catch(e) { console.log(e.message); }
  await conn.end();
}
run();

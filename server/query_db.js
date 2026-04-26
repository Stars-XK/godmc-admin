const mysql = require('mysql2/promise');
async function run() {
  const conn = await mysql.createConnection({ host:'127.0.0.1', user:'root', password:'123456', database:'dma' });
  try {
    const [rows] = await conn.execute("SELECT count(*) as c FROM water_zone;");
    console.log("Total zones:", rows[0].c);
  } catch(e) { console.log(e.message); }
  await conn.end();
}
run();

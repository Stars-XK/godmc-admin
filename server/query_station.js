const mysql = require('mysql2/promise');
async function run() {
  const conn = await mysql.createConnection({ host:'127.0.0.1', user:'root', password:'123456', database:'dma' });
  try {
    const [rows] = await conn.execute("SELECT name, longitude, latitude, type FROM water_station LIMIT 5;");
    console.log("Stations:", rows);
    const [devs] = await conn.execute("SELECT name, longitude, latitude, type FROM water_device LIMIT 5;");
    console.log("Devices:", devs);
  } catch(e) { console.log(e.message); }
  await conn.end();
}
run();

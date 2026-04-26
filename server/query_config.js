const mysql = require('mysql2/promise');
async function run() {
  const conn = await mysql.createConnection({ host:'127.0.0.1', user:'root', password:'123456', database:'dma' });
  try {
    const [rows] = await conn.execute("SELECT config_value FROM sys_config WHERE config_key='gis.coord.transform';");
    console.log("transformMode:", rows[0]?.config_value);
  } catch(e) { console.log(e.message); }
  await conn.end();
}
run();

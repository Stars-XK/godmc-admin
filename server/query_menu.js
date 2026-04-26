const mysql = require('mysql2/promise');
async function run() {
  const conn = await mysql.createConnection({ host:'127.0.0.1', user:'root', password:'123456', database:'dma' });
  try {
    const [rows] = await conn.execute("SELECT menu_name, path, component FROM sys_menu WHERE menu_name LIKE '%大屏%' OR menu_name LIKE '%GIS%'");
    console.log(rows);
  } catch(e) { console.log(e.message); }
  await conn.end();
}
run();

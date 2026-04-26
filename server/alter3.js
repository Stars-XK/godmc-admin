const mysql = require('mysql2/promise');
async function run() {
  const conn = await mysql.createConnection({ host:'127.0.0.1', user:'root', password:'123456', database:'dma' });
  try {
    await conn.execute("ALTER TABLE water_data_mapping ADD COLUMN is_update_key TINYINT DEFAULT 0 COMMENT '是否作为更新依据(0否 1是)'");
    console.log("Alter successful");
  } catch(e) { console.log(e.message); }
  await conn.end();
}
run();

const mysql = require('mysql2/promise');
async function run() {
  const conn = await mysql.createConnection({ host:'127.0.0.1', user:'root', password:'123456', database:'dma' });
  try {
    await conn.execute("ALTER TABLE water_data_task ADD COLUMN batch_size INT DEFAULT 0 COMMENT '单次拉取批次大小(0为不限制)'");
    console.log("Alter successful");
  } catch(e) { console.log(e.message); }
  await conn.end();
}
run();

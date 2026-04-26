const mysql = require('mysql2/promise');
async function run() {
  const conn = await mysql.createConnection({ host:'127.0.0.1', user:'root', password:'123456', database:'dma' });
  try {
    await conn.execute("ALTER TABLE water_data_mapping ADD COLUMN transform_rule VARCHAR(500) DEFAULT NULL COMMENT '字典转换规则(A=1,B=0)'");
    console.log("Alter successful");
  } catch(e) { console.log(e.message); }
  await conn.end();
}
run();

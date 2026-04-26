const mysql = require('mysql2/promise');
async function run() {
  const conn = await mysql.createConnection({ host:'127.0.0.1', user:'root', password:'123456', database:'dma' });
  try {
    await conn.execute("ALTER TABLE water_data_task ADD COLUMN last_run_time DATETIME DEFAULT NULL COMMENT '最后执行时间'");
    await conn.execute("ALTER TABLE water_data_task ADD COLUMN last_run_status CHAR(1) DEFAULT NULL COMMENT '最后执行状态 (0-成功 1-失败)'");
    await conn.execute("ALTER TABLE water_data_task ADD COLUMN last_run_msg TEXT DEFAULT NULL COMMENT '最后执行日志信息'");
    console.log("Alter successful");
  } catch(e) { console.log(e.message); }
  await conn.end();
}
run();

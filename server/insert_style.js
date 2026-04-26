const mysql = require('mysql2/promise');
async function run() {
  const conn = await mysql.createConnection({ host:'127.0.0.1', user:'root', password:'123456', database:'dma' });
  try {
    await conn.execute("INSERT INTO `sys_config` (`config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `remark`) VALUES ('GIS地图主题风格', 'gis.map.style', 'amap://styles/light', 'Y', 'admin', NOW(), 'GIS大屏地图主题风格(支持light,dark,darkblue等)')");
    console.log("Insert successful");
  } catch(e) { console.log(e.message); }
  await conn.end();
}
run();

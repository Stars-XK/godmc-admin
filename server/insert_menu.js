const mysql = require('mysql2/promise');
async function run() {
  const conn = await mysql.createConnection({ host:'127.0.0.1', user:'root', password:'123456', database:'dma' });
  try {
    await conn.execute("INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1120, 'GIS大屏监控', 0, 6, 'gis/screen', 'gis/screen/index', '', '1', '0', 'C', '0', '0', 'gis:screen:view', 'monitor', 'admin', '2026-04-26 10:00:00.000000', '', NULL, '全屏GIS大屏监控', '0');");
    console.log("Insert successful");
  } catch(e) { console.log(e.message); }
  await conn.end();
}
run();

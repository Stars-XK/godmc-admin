const fs = require('fs');
const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'root', // Assumed from your mysql command
    database: 'nest_admin'
  });

  try {
    const dictSql = fs.readFileSync('/workspace/server/db/1.2.1-water-basic-dict.sql', 'utf8');
    const menuSql = fs.readFileSync('/workspace/server/db/1.2.2-water-basic-menu.sql', 'utf8');

    // split queries by ';' and run them
    const runSql = async (sql) => {
      const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
      for (let s of statements) {
        if (s.startsWith('--')) continue;
        console.log('Executing:', s.substring(0, 50) + '...');
        try {
          await connection.query(s);
        } catch (e) {
          if (e.code === 'ER_DUP_ENTRY') {
             console.log('Duplicate entry skipped');
          } else {
             console.error('Error:', e.message);
          }
        }
      }
    };

    console.log('Running Dict SQL...');
    await runSql(dictSql);
    console.log('Running Menu SQL...');
    
    // Instead of parsing SET @parentId manually, let's just do it directly via connection
    const [rows] = await connection.query("SELECT menu_id FROM sys_menu WHERE menu_name = '水务基础' LIMIT 1");
    const parentId = rows.length > 0 ? rows[0].menu_id : 0;
    
    console.log('Water basic menu parentId:', parentId);

    // Insert main menu
    const [menuRes] = await connection.query(`
      INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time)
      VALUES ('物联台账', ?, 2, 'station-device-point', 'water-basic/station-device-point/index', 1, 0, 'C', '0', '0', 'water-basic:station:list', 'tree-table', 'admin', NOW())
    `, [parentId]);
    const menuId = menuRes.insertId;

    // Insert buttons
    const buttons = [
      ['站点查询', 'water-basic:station:query'],
      ['站点新增', 'water-basic:station:add'],
      ['站点修改', 'water-basic:station:edit'],
      ['站点删除', 'water-basic:station:remove'],
      ['站点导出', 'water-basic:station:export'],
      ['站点导入', 'water-basic:station:import'],
      ['设备查询', 'water-basic:device:query'],
      ['设备新增', 'water-basic:device:add'],
      ['设备修改', 'water-basic:device:edit'],
      ['设备删除', 'water-basic:device:remove'],
      ['设备导出', 'water-basic:device:export'],
      ['设备导入', 'water-basic:device:import'],
      ['测点查询', 'water-basic:point:query'],
      ['测点新增', 'water-basic:point:add'],
      ['测点修改', 'water-basic:point:edit'],
      ['测点删除', 'water-basic:point:remove'],
      ['测点导出', 'water-basic:point:export'],
      ['测点导入', 'water-basic:point:import']
    ];

    let orderNum = 1;
    for (const [name, perms] of buttons) {
      const [btnRes] = await connection.query(`
        INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time)
        VALUES (?, ?, ?, '', '', 1, 0, 'F', '0', '0', ?, '#', 'admin', NOW())
      `, [name, menuId, orderNum++, perms]);
      
      const btnId = btnRes.insertId;
      // Associate with admin role (role_id = 1)
      await connection.query(`INSERT INTO sys_role_menu (role_id, menu_id) VALUES (1, ?)`, [btnId]);
    }
    
    // Also associate the main menu
    await connection.query(`INSERT INTO sys_role_menu (role_id, menu_id) VALUES (1, ?)`, [menuId]);

    console.log('Done!');
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

main();

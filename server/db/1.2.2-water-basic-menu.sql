-- 菜单 SQL (纯 SQL，去除了不支持的 IF 语法，确保能自动执行)
-- 先删除可能残留的旧菜单和权限（幂等操作）
DELETE FROM sys_role_menu WHERE menu_id IN (SELECT menu_id FROM sys_menu WHERE perms LIKE 'water-basic:station:%' OR perms LIKE 'water-basic:device:%' OR perms LIKE 'water-basic:point:%' OR menu_name = '物联台账');
DELETE FROM sys_menu WHERE perms LIKE 'water-basic:station:%' OR perms LIKE 'water-basic:device:%' OR perms LIKE 'water-basic:point:%' OR menu_name = '物联台账';

-- 插入物联台账主菜单（查找"水务基础"菜单ID作为父级，如果没找到则挂在顶级 0 下）
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
SELECT '物联台账', IFNULL((SELECT menu_id FROM (SELECT * FROM sys_menu) as t WHERE menu_name = '水务基础' LIMIT 1), 0), 2, 'station-device-point', 'water-basic/station-device-point/index', 1, 0, 'C', '0', '0', 'water-basic:station:list', 'tree-table', 'admin', NOW(), '站点设备测点管理页面' FROM DUAL;

-- 获取刚插入的主菜单ID
SET @menuId = LAST_INSERT_ID();

-- 插入子菜单按钮权限
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time) VALUES 
('站点查询', @menuId, 1, '', '', 1, 0, 'F', '0', '0', 'water-basic:station:query', '#', 'admin', NOW()),
('站点新增', @menuId, 2, '', '', 1, 0, 'F', '0', '0', 'water-basic:station:add', '#', 'admin', NOW()),
('站点修改', @menuId, 3, '', '', 1, 0, 'F', '0', '0', 'water-basic:station:edit', '#', 'admin', NOW()),
('站点删除', @menuId, 4, '', '', 1, 0, 'F', '0', '0', 'water-basic:station:remove', '#', 'admin', NOW()),
('站点导出', @menuId, 5, '', '', 1, 0, 'F', '0', '0', 'water-basic:station:export', '#', 'admin', NOW()),
('站点导入', @menuId, 6, '', '', 1, 0, 'F', '0', '0', 'water-basic:station:import', '#', 'admin', NOW()),

('设备查询', @menuId, 7, '', '', 1, 0, 'F', '0', '0', 'water-basic:device:query', '#', 'admin', NOW()),
('设备新增', @menuId, 8, '', '', 1, 0, 'F', '0', '0', 'water-basic:device:add', '#', 'admin', NOW()),
('设备修改', @menuId, 9, '', '', 1, 0, 'F', '0', '0', 'water-basic:device:edit', '#', 'admin', NOW()),
('设备删除', @menuId, 10, '', '', 1, 0, 'F', '0', '0', 'water-basic:device:remove', '#', 'admin', NOW()),
('设备导出', @menuId, 11, '', '', 1, 0, 'F', '0', '0', 'water-basic:device:export', '#', 'admin', NOW()),
('设备导入', @menuId, 12, '', '', 1, 0, 'F', '0', '0', 'water-basic:device:import', '#', 'admin', NOW()),

('测点查询', @menuId, 13, '', '', 1, 0, 'F', '0', '0', 'water-basic:point:query', '#', 'admin', NOW()),
('测点新增', @menuId, 14, '', '', 1, 0, 'F', '0', '0', 'water-basic:point:add', '#', 'admin', NOW()),
('测点修改', @menuId, 15, '', '', 1, 0, 'F', '0', '0', 'water-basic:point:edit', '#', 'admin', NOW()),
('测点删除', @menuId, 16, '', '', 1, 0, 'F', '0', '0', 'water-basic:point:remove', '#', 'admin', NOW()),
('测点导出', @menuId, 17, '', '', 1, 0, 'F', '0', '0', 'water-basic:point:export', '#', 'admin', NOW()),
('测点导入', @menuId, 18, '', '', 1, 0, 'F', '0', '0', 'water-basic:point:import', '#', 'admin', NOW());

-- 重要：给 admin 角色(role_id=1) 分配新添加的全部权限！
INSERT INTO sys_role_menu (role_id, menu_id)
SELECT 1, menu_id FROM sys_menu 
WHERE perms LIKE 'water-basic:station:%' 
   OR perms LIKE 'water-basic:device:%' 
   OR perms LIKE 'water-basic:point:%'
   OR menu_name = '物联台账';

-- 菜单 SQL
-- 1. 站点设备测点管理菜单 (在水务基础下, 假设水务基础的 parent_id 为 2000，或者直接挂在根级，为了通用，我们通过查询水务基础的 menu_id 来插入)
-- 为了方便，我直接写入菜单名和父菜单ID。这里假设将新功能放在“水务基础”菜单下。
SET @parentId = (SELECT menu_id FROM sys_menu WHERE menu_name = '水务基础' LIMIT 1);
IF @parentId IS NULL THEN SET @parentId = 0; END IF;

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
VALUES ('物联台账', @parentId, 2, 'station-device-point', 'water-basic/station-device-point/index', 1, 0, 'C', '0', '0', 'water-basic:station:list', 'tree-table', 'admin', NOW(), '', NULL, '站点设备测点管理页面');

SET @menuId = LAST_INSERT_ID();

-- 按钮权限
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
VALUES 
('站点查询', @menuId, 1, '', '', 1, 0, 'F', '0', '0', 'water-basic:station:query', '#', 'admin', NOW(), '', NULL, ''),
('站点新增', @menuId, 2, '', '', 1, 0, 'F', '0', '0', 'water-basic:station:add', '#', 'admin', NOW(), '', NULL, ''),
('站点修改', @menuId, 3, '', '', 1, 0, 'F', '0', '0', 'water-basic:station:edit', '#', 'admin', NOW(), '', NULL, ''),
('站点删除', @menuId, 4, '', '', 1, 0, 'F', '0', '0', 'water-basic:station:remove', '#', 'admin', NOW(), '', NULL, ''),
('站点导出', @menuId, 5, '', '', 1, 0, 'F', '0', '0', 'water-basic:station:export', '#', 'admin', NOW(), '', NULL, ''),
('站点导入', @menuId, 6, '', '', 1, 0, 'F', '0', '0', 'water-basic:station:import', '#', 'admin', NOW(), '', NULL, ''),

('设备查询', @menuId, 7, '', '', 1, 0, 'F', '0', '0', 'water-basic:device:query', '#', 'admin', NOW(), '', NULL, ''),
('设备新增', @menuId, 8, '', '', 1, 0, 'F', '0', '0', 'water-basic:device:add', '#', 'admin', NOW(), '', NULL, ''),
('设备修改', @menuId, 9, '', '', 1, 0, 'F', '0', '0', 'water-basic:device:edit', '#', 'admin', NOW(), '', NULL, ''),
('设备删除', @menuId, 10, '', '', 1, 0, 'F', '0', '0', 'water-basic:device:remove', '#', 'admin', NOW(), '', NULL, ''),
('设备导出', @menuId, 11, '', '', 1, 0, 'F', '0', '0', 'water-basic:device:export', '#', 'admin', NOW(), '', NULL, ''),
('设备导入', @menuId, 12, '', '', 1, 0, 'F', '0', '0', 'water-basic:device:import', '#', 'admin', NOW(), '', NULL, ''),

('测点查询', @menuId, 13, '', '', 1, 0, 'F', '0', '0', 'water-basic:point:query', '#', 'admin', NOW(), '', NULL, ''),
('测点新增', @menuId, 14, '', '', 1, 0, 'F', '0', '0', 'water-basic:point:add', '#', 'admin', NOW(), '', NULL, ''),
('测点修改', @menuId, 15, '', '', 1, 0, 'F', '0', '0', 'water-basic:point:edit', '#', 'admin', NOW(), '', NULL, ''),
('测点删除', @menuId, 16, '', '', 1, 0, 'F', '0', '0', 'water-basic:point:remove', '#', 'admin', NOW(), '', NULL, ''),
('测点导出', @menuId, 17, '', '', 1, 0, 'F', '0', '0', 'water-basic:point:export', '#', 'admin', NOW(), '', NULL, ''),
('测点导入', @menuId, 18, '', '', 1, 0, 'F', '0', '0', 'water-basic:point:import', '#', 'admin', NOW(), '', NULL, '');

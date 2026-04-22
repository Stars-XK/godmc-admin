-- 1. 恢复被误删的“备份管理”菜单，并将游离的按钮重新挂载到其下方
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
SELECT '备份管理', 1, 9, 'backup', 'system/backup/index', 1, 0, 'C', '0', '0', 'system:backup:list', 'server', 'admin', NOW(), '数据库备份管理菜单'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_menu` WHERE `menu_name` = '备份管理' AND `parent_id` = 1);

UPDATE sys_menu SET parent_id = (SELECT menu_id FROM (SELECT menu_id FROM sys_menu WHERE menu_name = '备份管理' AND parent_id = 1 LIMIT 1) AS t) 
WHERE perms IN ('system:backup:create', 'system:backup:restore', 'system:backup:remove');

-- 2. 删除不需要的“实时数据接入”菜单及其子菜单
DELETE FROM sys_role_menu WHERE menu_id IN (SELECT menu_id FROM sys_menu WHERE perms LIKE 'data-integration:%' OR menu_name = '实时数据接入');
DELETE FROM sys_menu WHERE perms LIKE 'data-integration:%' OR menu_name = '实时数据接入';

-- 3. 删除不需要的“营收基础信息”菜单及其子菜单
DELETE FROM sys_role_menu WHERE menu_id IN (SELECT menu_id FROM sys_menu WHERE perms LIKE 'water-basic:revenue:%' OR menu_name = '营收基础信息');
DELETE FROM sys_menu WHERE perms LIKE 'water-basic:revenue:%' OR menu_name = '营收基础信息';

-- 4. 补充缺失的 10-15 项水务站点类型字典数据 (如果不存在则插入)
DELETE FROM sys_dict_data WHERE dict_type = 'water_station_type' AND dict_sort BETWEEN 10 AND 15;

INSERT INTO sys_dict_data (dict_sort, dict_label, dict_value, dict_type, css_class, list_class, is_default, status, create_by, create_time, remark) VALUES
(10, '高位水池', 'HIGH_TANK', 'water_station_type', '', 'primary', 'N', '0', 'admin', NOW(), '高位水池'),
(11, '地下水井', 'GROUNDWATER_WELL', 'water_station_type', '', 'primary', 'N', '0', 'admin', NOW(), '地下水井'),
(12, '水源地', 'WATER_SOURCE', 'water_station_type', '', 'primary', 'N', '0', 'admin', NOW(), '水源地'),
(13, '取水泵站', 'INTAKE_PUMP_STATION', 'water_station_type', '', 'primary', 'N', '0', 'admin', NOW(), '取水泵站'),
(14, '污水处理厂', 'WASTEWATER_PLANT', 'water_station_type', '', 'warning', 'N', '0', 'admin', NOW(), '污水处理厂'),
(15, '雨水泵站', 'STORMWATER_PUMP_STATION', 'water_station_type', '', 'warning', 'N', '0', 'admin', NOW(), '雨水泵站');

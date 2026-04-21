-- 菜单 SQL: 实时数据接入管理
-- 先删除可能残留的旧菜单和权限（幂等操作）
DELETE FROM sys_role_menu WHERE menu_id IN (SELECT menu_id FROM sys_menu WHERE perms LIKE 'data-integration:%' OR menu_name = '实时数据接入');
DELETE FROM sys_menu WHERE perms LIKE 'data-integration:%' OR menu_name = '实时数据接入';

-- 插入主菜单：实时数据接入（顶级菜单 parent_id = 0）
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
VALUES ('实时数据接入', 0, 3, 'data-integration', 'Layout', 1, 0, 'M', '0', '0', '', 'monitor', 'admin', NOW(), '实时数据接入管理');

SET @menuId = LAST_INSERT_ID();

-- 插入子菜单：数据源配置
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time) VALUES
('数据源配置', @menuId, 1, 'source', 'data-integration/source/index', 1, 0, 'C', '0', '0', 'data-integration:source:list', 'redis', 'admin', NOW());
SET @sourceMenuId = LAST_INSERT_ID();

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time) VALUES
('数据源查询', @sourceMenuId, 1, '', '', 1, 0, 'F', '0', '0', 'data-integration:source:query', '#', 'admin', NOW()),
('数据源新增', @sourceMenuId, 2, '', '', 1, 0, 'F', '0', '0', 'data-integration:source:add', '#', 'admin', NOW()),
('数据源修改', @sourceMenuId, 3, '', '', 1, 0, 'F', '0', '0', 'data-integration:source:edit', '#', 'admin', NOW()),
('数据源删除', @sourceMenuId, 4, '', '', 1, 0, 'F', '0', '0', 'data-integration:source:remove', '#', 'admin', NOW());

-- 插入子菜单：接入任务管理
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time) VALUES
('接入任务管理', @menuId, 2, 'task', 'data-integration/task/index', 1, 0, 'C', '0', '0', 'data-integration:task:list', 'job', 'admin', NOW());
SET @taskMenuId = LAST_INSERT_ID();

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time) VALUES
('任务查询', @taskMenuId, 1, '', '', 1, 0, 'F', '0', '0', 'data-integration:task:query', '#', 'admin', NOW()),
('任务新增', @taskMenuId, 2, '', '', 1, 0, 'F', '0', '0', 'data-integration:task:add', '#', 'admin', NOW()),
('任务修改', @taskMenuId, 3, '', '', 1, 0, 'F', '0', '0', 'data-integration:task:edit', '#', 'admin', NOW()),
('任务删除', @taskMenuId, 4, '', '', 1, 0, 'F', '0', '0', 'data-integration:task:remove', '#', 'admin', NOW()),
('字段映射配置', @taskMenuId, 5, '', '', 1, 0, 'F', '0', '0', 'data-integration:task:mapping', '#', 'admin', NOW());

-- 插入子菜单：数据模拟测试
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time) VALUES
('数据模拟测试', @menuId, 3, 'mock', 'data-integration/mock/index', 1, 0, 'C', '0', '0', 'data-integration:mock:generate', 'bug', 'admin', NOW());

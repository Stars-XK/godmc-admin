-- 插入服务注册中心菜单
SET @monitor_id = (SELECT menu_id FROM `sys_menu` WHERE `menu_name` = '系统监控' AND `parent_id` = 0 LIMIT 1);

INSERT INTO `sys_menu` (`menu_name`, `parent_id`, `order_num`, `path`, `component`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `remark`)
SELECT '服务状态', @monitor_id, 10, 'registry', 'monitor/registry/index', 1, 0, 'C', '0', '0', 'monitor:registry:list', 'server', 'admin', sysdate(), '微服务注册中心状态'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_menu` WHERE `menu_name` = '服务状态' AND `parent_id` = @monitor_id);
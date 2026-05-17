-- ============================================
-- 巡检管理系统 — 菜单数据
-- 依赖: 巡检模块已部署，页面文件已就位
-- 执行方式: 登录 admin 后在菜单管理批量导入，或直连 DB 执行
-- ============================================

-- 顶级目录
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`)
VALUES (2001, '巡检管理', 0, 6, 'inspection', NULL, '', '1', '0', 'M', '0', '0', '', 'monitor', 'admin', NOW(), '', NULL, '巡检上报管理系统目录', '0');

-- 子菜单
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`)
VALUES (2002, '巡检计划', 2001, 1, 'plan', 'inspection/plan/index', '', '1', '0', 'C', '0', '0', 'inspection:plan:list', 'date-range', 'admin', NOW(), '', NULL, '巡检计划模板管理', '0');

INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`)
VALUES (2003, '巡检任务', 2001, 2, 'task', 'inspection/task/index', '', '1', '0', 'C', '0', '0', 'inspection:task:list', 'list', 'admin', NOW(), '', NULL, '巡检任务派发与跟踪', '0');

INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`)
VALUES (2004, '巡检路线', 2001, 3, 'route', 'inspection/route/index', '', '1', '0', 'C', '0', '0', 'inspection:route:list', 'guide', 'admin', NOW(), '', NULL, '巡检路线与GeoJSON管理', '0');

INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`)
VALUES (2005, '检查点管理', 2001, 4, 'checkpoint', 'inspection/checkpoint/index', '', '1', '0', 'C', '0', '0', 'inspection:checkpoint:list', 'location', 'admin', NOW(), '', NULL, '检查点与检查项模板管理', '0');

INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`)
VALUES (2006, '问题管理', 2001, 5, 'issue', 'inspection/issue/index', '', '1', '0', 'C', '0', '0', 'inspection:issue:list', 'warning', 'admin', NOW(), '', NULL, '巡检问题闭环追踪', '0');

INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`)
VALUES (2007, '实时追踪', 2001, 6, 'tracking', 'inspection/tracking/live-map', '', '1', '0', 'C', '0', '0', 'inspection:tracking:list', 'eye-open', 'admin', NOW(), '', NULL, '巡检员实时位置与轨迹回放', '0');

INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`)
VALUES (2008, '统计分析', 2001, 7, 'statistics', 'inspection/statistics/dashboard', '', '1', '0', 'C', '0', '0', 'inspection:statistics:list', 'chart', 'admin', NOW(), '', NULL, '巡检 KPI 仪表盘', '0');

INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`)
VALUES (2009, '移动巡检', 2001, 8, 'mobile', 'inspection/mobile/index', '', '1', '0', 'C', '0', '0', 'inspection:mobile:index', 'mobile', 'admin', NOW(), '', NULL, '移动端巡检入口(PWA)', '0');

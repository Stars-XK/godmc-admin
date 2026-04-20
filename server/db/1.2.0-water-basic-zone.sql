-- 1. 创建 water_zone 综合分区表
CREATE TABLE IF NOT EXISTS `water_zone` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `parent_id` bigint(20) DEFAULT 0 COMMENT '父级分区ID',
  `ancestors` varchar(255) DEFAULT '' COMMENT '祖级列表',
  `type` char(1) NOT NULL DEFAULT '1' COMMENT '分区维度（1:行政营业, 2:DMA漏损, 3:控压高程, 4:供水调度）',
  `level` int(11) DEFAULT 1 COMMENT '分区级别',
  `name` varchar(100) NOT NULL COMMENT '分区名称',
  `code` varchar(50) DEFAULT '' COMMENT '分区编码',
  `area` decimal(10,2) DEFAULT 0.00 COMMENT '覆盖面积(平方公里)',
  `population` int(11) DEFAULT 0 COMMENT '服务人口',
  `address` varchar(255) DEFAULT '' COMMENT '位置描述',
  `dept_id` int(11) DEFAULT NULL COMMENT '所属部门ID',
  `user_id` int(11) DEFAULT NULL COMMENT '负责人ID',
  `manager_name` varchar(50) DEFAULT '' COMMENT '负责人姓名',
  `manager_phone` varchar(20) DEFAULT '' COMMENT '负责人电话',
  `longitude` varchar(30) DEFAULT '' COMMENT '中心经度',
  `latitude` varchar(30) DEFAULT '' COMMENT '中心纬度',
  `boundary` longtext COMMENT '地理边界信息(GeoJSON)',
  `sort` int(11) DEFAULT 0 COMMENT '排序号',
  `status` char(1) DEFAULT '0' COMMENT '状态（0正常 1停用）',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志（0代表存在 1代表删除）',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='综合水务分区表';

-- 2. 插入菜单数据
-- 先查询是否存在水务基础模块的顶级菜单，不存在则插入
INSERT INTO `sys_menu` (`menu_name`, `parent_id`, `order_num`, `path`, `component`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`)
SELECT '水务基础', 0, 99, 'water-basic', null, 1, 0, 'M', '0', '0', '', 'system', 'admin', sysdate(), '', null, '水务基础模块顶级菜单'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_menu` WHERE `menu_name` = '水务基础' AND `parent_id` = 0);

-- 获取水务基础顶级菜单的 ID
SET @water_basic_id = (SELECT menu_id FROM `sys_menu` WHERE `menu_name` = '水务基础' AND `parent_id` = 0 LIMIT 1);

-- 插入综合分区管理菜单
INSERT INTO `sys_menu` (`menu_name`, `parent_id`, `order_num`, `path`, `component`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`)
SELECT '分区管理', @water_basic_id, 1, 'zone', 'water-basic/zone/index', 1, 0, 'C', '0', '0', 'water-basic:zone:list', 'tree', 'admin', sysdate(), '', null, '综合分区管理'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_menu` WHERE `menu_name` = '分区管理' AND `parent_id` = @water_basic_id);

-- 获取分区管理菜单的 ID
SET @zone_menu_id = (SELECT menu_id FROM `sys_menu` WHERE `menu_name` = '分区管理' AND `parent_id` = @water_basic_id LIMIT 1);

-- 插入分区管理的按钮权限
INSERT INTO `sys_menu` (`menu_name`, `parent_id`, `order_num`, `path`, `component`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`)
VALUES 
('分区查询', @zone_menu_id, 1, '', null, 1, 0, 'F', '0', '0', 'water-basic:zone:query', '#', 'admin', sysdate(), '', null, ''),
('分区新增', @zone_menu_id, 2, '', null, 1, 0, 'F', '0', '0', 'water-basic:zone:add', '#', 'admin', sysdate(), '', null, ''),
('分区修改', @zone_menu_id, 3, '', null, 1, 0, 'F', '0', '0', 'water-basic:zone:edit', '#', 'admin', sysdate(), '', null, ''),
('分区删除', @zone_menu_id, 4, '', null, 1, 0, 'F', '0', '0', 'water-basic:zone:remove', '#', 'admin', sysdate(), '', null, ''),
('分区导出', @zone_menu_id, 5, '', null, 1, 0, 'F', '0', '0', 'water-basic:zone:export', '#', 'admin', sysdate(), '', null, ''),
('分区导入', @zone_menu_id, 6, '', null, 1, 0, 'F', '0', '0', 'water-basic:zone:import', '#', 'admin', sysdate(), '', null, '');

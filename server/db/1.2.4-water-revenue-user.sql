-- 1. 创建营收用户表 scada_revenue_user
CREATE TABLE IF NOT EXISTS `scada_revenue_user` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_no` varchar(50) NOT NULL COMMENT '用户编号',
  `user_name` varchar(100) DEFAULT NULL COMMENT '用户名称',
  `user_type` varchar(50) DEFAULT NULL COMMENT '用户类型(字典)',
  `phone` varchar(50) DEFAULT NULL COMMENT '手机号',
  `address` varchar(255) DEFAULT NULL COMMENT '地址',
  `meter_no` varchar(50) DEFAULT NULL COMMENT '水表编号',
  `book_no` varchar(50) DEFAULT NULL COMMENT '表册编号',
  `charge_type` varchar(50) DEFAULT NULL COMMENT '收费类型',
  `caliber` varchar(20) DEFAULT NULL COMMENT '口径',
  `card_category` varchar(50) DEFAULT NULL COMMENT '用户水卡分类(字典)',
  `user_category` varchar(50) DEFAULT NULL COMMENT '用户分类(字典)',
  `status` char(1) DEFAULT '0' COMMENT '用户状态(0正常 1停用)',
  `arrears_amount` decimal(10,2) DEFAULT '0.00' COMMENT '欠费金额',
  `associated_user_id` bigint(20) DEFAULT NULL COMMENT '关联系统用户ID',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志(0代表存在 2代表删除)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_no` (`user_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='营收基础用户信息表';

-- 2. 清理和插入字典数据
DELETE FROM sys_dict_data WHERE dict_type IN ('water_card_category', 'water_user_category');

-- 插入用户水卡分类
INSERT INTO sys_dict_data (dict_sort, dict_label, dict_value, dict_type, css_class, list_class, is_default, status, create_by, create_time, remark) VALUES
(1, '居民', 'A', 'water_card_category', '', 'primary', 'Y', '0', 'admin', NOW(), '居民'),
(2, '特种', 'B', 'water_card_category', '', 'danger', 'N', '0', 'admin', NOW(), '特种'),
(3, '其他', 'C', 'water_card_category', '', 'info', 'N', '0', 'admin', NOW(), '其他'),
(4, '非居民', 'D', 'water_card_category', '', 'warning', 'N', '0', 'admin', NOW(), '非居民'),
(5, '武荣水价', 'E', 'water_card_category', '', 'success', 'N', '0', 'admin', NOW(), '武荣水价'),
(6, '复核表(不计费)', 'F', 'water_card_category', '', 'default', 'N', '0', 'admin', NOW(), '复核表(不计费)');

-- 插入用户分类
INSERT INTO sys_dict_data (dict_sort, dict_label, dict_value, dict_type, css_class, list_class, is_default, status, create_by, create_time, remark) VALUES
(1, '1-1民用居民有物业', 'A01', 'water_user_category', '', 'default', 'Y', '0', 'admin', NOW(), ''),
(2, '1-2民用居民无物业', 'A02', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(3, '1-3民用不收有物业', 'A03', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(4, '1-4民用不收有物业季节', 'A04', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(5, '1-5民用居民有物业季节', 'A05', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(6, '1-6民用居民无物业季节', 'A06', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(7, '1-7民用居民不收季节', 'A07', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(8, '民用居民二阶', 'A08', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(9, '民用居民三阶', 'A09', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(10, '民用无污水费二阶', 'A10', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(11, '民用无污水费三阶', 'A11', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(12, '民用不收有物业二阶', 'A12', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(13, '季节性价格', 'A13', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(14, '1-14民用不收公共事业', 'A14', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(15, '1-15民用居民商业', 'A15', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(16, '1-20民用居民不收', 'A16', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(17, '新建特殊', 'A20', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(18, '民用居民机关团体或其他', 'A21', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(19, '2-1特种非居民不收', 'B01', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(20, '2-2特种非居民商业', 'B02', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(21, '2-3特种非居民其他', 'B03', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(22, '2-4特种非居民无物业', 'B04', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(23, '特种非居民机关团体', 'B05', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(24, '特种居民无物业', 'B06', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(25, '特种非居民农贸市场', 'B07', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(26, '特种居民不收', 'B08', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(27, '特种非居民工业', 'B09', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(28, '3-1其他非居民不收', 'C01', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(29, '3-2其他非居民机关团体', 'C02', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(30, '3-3其他非居民企业中其他', 'C03', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(31, '3-4其他非居民商业', 'C04', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(32, '3-5其他非居民工业', 'C05', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(33, '3-6其他非居民农贸市场', 'C06', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(34, '3-7其他不收企业中其他', 'C07', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(35, '3-8其他不收不收', 'C08', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(36, '3-9其他非居民有物业', 'C09', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(37, '3-10其他不收商业', 'C10', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(38, '3-11特殊水价', 'C11', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(39, '其他居民无物业', 'C13', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(40, '其他居民不收', 'C14', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(41, '其他居民有物业', 'C15', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(42, '其他居民机关团体', 'C16', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(43, '1-8民用不收不收', 'D01', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(44, '1-9民用非居民不收', 'D02', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(45, '1-10民用非居民机关团体', 'D03', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(46, '民用非居民不收（消防五倍）', 'D04', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(47, '民用非居民农贸市场', 'D06', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(48, '民用非居民工业', 'D08', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(49, '民用非居民不收（消防单倍）', 'D09', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(50, '民用非居民（消防五倍）不收不收', 'D10', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(51, '武荣无污水无垃圾', 'E01', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), ''),
(52, '复核表零水费', 'F01', 'water_user_category', '', 'default', 'N', '0', 'admin', NOW(), '');


-- 3. 插入菜单数据
DELETE FROM sys_role_menu WHERE menu_id IN (SELECT menu_id FROM sys_menu WHERE perms LIKE 'water-basic:revenue:%' OR menu_name = '营收基础信息');
DELETE FROM sys_menu WHERE perms LIKE 'water-basic:revenue:%' OR menu_name = '营收基础信息';

-- 查找水务基础模块的 menu_id
SET @water_basic_id = IFNULL((SELECT menu_id FROM (SELECT * FROM sys_menu) as t WHERE menu_name = '水务基础' LIMIT 1), 0);

-- 插入顶级菜单
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark)
SELECT '营收基础信息', @water_basic_id, 3, 'revenue-user', 'water-basic/revenue-user/index', 1, 0, 'C', '0', '0', 'water-basic:revenue:list', 'user', 'admin', NOW(), '营收基础用户信息管理' FROM DUAL;

SET @revenue_menu_id = (SELECT LAST_INSERT_ID());

-- 插入按钮菜单
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, remark) VALUES
('营收用户查询', @revenue_menu_id, 1, '', '', 1, 0, 'F', '0', '0', 'water-basic:revenue:query', '#', 'admin', NOW(), ''),
('营收用户新增', @revenue_menu_id, 2, '', '', 1, 0, 'F', '0', '0', 'water-basic:revenue:add', '#', 'admin', NOW(), ''),
('营收用户修改', @revenue_menu_id, 3, '', '', 1, 0, 'F', '0', '0', 'water-basic:revenue:edit', '#', 'admin', NOW(), ''),
('营收用户删除', @revenue_menu_id, 4, '', '', 1, 0, 'F', '0', '0', 'water-basic:revenue:remove', '#', 'admin', NOW(), ''),
('营收用户导出', @revenue_menu_id, 5, '', '', 1, 0, 'F', '0', '0', 'water-basic:revenue:export', '#', 'admin', NOW(), ''),
('营收用户导入', @revenue_menu_id, 6, '', '', 1, 0, 'F', '0', '0', 'water-basic:revenue:import', '#', 'admin', NOW(), '');

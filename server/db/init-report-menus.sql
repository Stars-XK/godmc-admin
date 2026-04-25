-- 插入日报表和月报表的菜单
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) VALUES
(3020, 'DMA业务', 0, 1, 'dma', '', 1, 0, 'M', '0', '0', '', 'data-analysis', 'admin', NOW(), '', NULL, 'DMA业务目录'),
(3021, '产销差日报表', 3020, 1, 'daily', 'dma/report/daily', 1, 0, 'C', '0', '0', 'dma:report:daily', 'calendar', 'admin', NOW(), '', NULL, '分区产销差日报表'),
(3022, '产销差月报表', 3020, 2, 'monthly', 'dma/report/monthly', 1, 0, 'C', '0', '0', 'dma:report:monthly', 'date', 'admin', NOW(), '', NULL, '分区产销差月报表');

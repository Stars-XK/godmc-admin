-- 站点类型
INSERT INTO sys_dict_type (dict_name, dict_type, status, create_by, create_time, update_by, update_time, remark)
VALUES ('站点类型', 'water_station_type', '0', 'admin', NOW(), '', NULL, '智慧水务-站点类型');

INSERT INTO sys_dict_data (dict_sort, dict_label, dict_value, dict_type, css_class, list_class, is_default, status, create_by, create_time, update_by, update_time, remark)
VALUES 
(1, '水厂', '1', 'water_station_type', '', 'primary', 'Y', '0', 'admin', NOW(), '', NULL, '水厂站点'),
(2, '泵站', '2', 'water_station_type', '', 'success', 'N', '0', 'admin', NOW(), '', NULL, '泵站站点'),
(3, '水库', '3', 'water_station_type', '', 'info', 'N', '0', 'admin', NOW(), '', NULL, '水库站点'),
(4, '污水处理厂', '4', 'water_station_type', '', 'warning', 'N', '0', 'admin', NOW(), '', NULL, '污水处理厂'),
(5, '管网监测点', '5', 'water_station_type', '', 'danger', 'N', '0', 'admin', NOW(), '', NULL, '管网监测点');

-- 设备类型
INSERT INTO sys_dict_type (dict_name, dict_type, status, create_by, create_time, update_by, update_time, remark)
VALUES ('设备类型', 'water_device_type', '0', 'admin', NOW(), '', NULL, '智慧水务-设备类型');

INSERT INTO sys_dict_data (dict_sort, dict_label, dict_value, dict_type, css_class, list_class, is_default, status, create_by, create_time, update_by, update_time, remark)
VALUES 
(1, '水泵', '1', 'water_device_type', '', 'primary', 'Y', '0', 'admin', NOW(), '', NULL, '水泵设备'),
(2, '阀门', '2', 'water_device_type', '', 'success', 'N', '0', 'admin', NOW(), '', NULL, '阀门设备'),
(3, '流量计', '3', 'water_device_type', '', 'info', 'N', '0', 'admin', NOW(), '', NULL, '流量计'),
(4, '压力计', '4', 'water_device_type', '', 'warning', 'N', '0', 'admin', NOW(), '', NULL, '压力计'),
(5, '水质分析仪', '5', 'water_device_type', '', 'danger', 'N', '0', 'admin', NOW(), '', NULL, '水质分析仪');

-- 测点类型
INSERT INTO sys_dict_type (dict_name, dict_type, status, create_by, create_time, update_by, update_time, remark)
VALUES ('测点类型', 'water_point_type', '0', 'admin', NOW(), '', NULL, '智慧水务-测点类型');

INSERT INTO sys_dict_data (dict_sort, dict_label, dict_value, dict_type, css_class, list_class, is_default, status, create_by, create_time, update_by, update_time, remark)
VALUES 
(1, '流量', '1', 'water_point_type', '', 'primary', 'Y', '0', 'admin', NOW(), '', NULL, '流量测点'),
(2, '压力', '2', 'water_point_type', '', 'success', 'N', '0', 'admin', NOW(), '', NULL, '压力测点'),
(3, '液位', '3', 'water_point_type', '', 'info', 'N', '0', 'admin', NOW(), '', NULL, '液位测点'),
(4, '余氯', '4', 'water_point_type', '', 'warning', 'N', '0', 'admin', NOW(), '', NULL, '余氯测点'),
(5, '浊度', '5', 'water_point_type', '', 'danger', 'N', '0', 'admin', NOW(), '', NULL, '浊度测点'),
(6, 'PH值', '6', 'water_point_type', '', 'default', 'N', '0', 'admin', NOW(), '', NULL, 'PH值测点');

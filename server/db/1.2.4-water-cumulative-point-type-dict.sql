-- 新增一组用于判断“累计型”测点类型的字典
-- dict_type: water_cumulative_point_type
-- dict_name: 累计型测点类型
-- 作用：微服务（如数据集成服务 micro-data-integration）可以通过查询该字典，来确定哪些类型的测点属于累计型（例如累计流量、电量等），从而在 TDengine 聚合时采用 LAST(val) 替代 AVG(val)。

-- 1. 创建字典类型
INSERT INTO sys_dict_type (dict_name, dict_type, status, create_by, create_time, remark)
VALUES ('累计型测点类型', 'water_cumulative_point_type', '0', 'admin', NOW(), '定义哪些测点类型属于累计型（如流量、电量等）');

-- 2. 插入初始字典数据
-- 注意：dict_value 必须与 water_point_type 中的 dict_value 保持一致，才能起到过滤的作用。
INSERT INTO sys_dict_data (dict_sort, dict_label, dict_value, dict_type, css_class, list_class, is_default, status, create_by, create_time, remark)
VALUES 
(1, '流量参数', 'FLOW', 'water_cumulative_point_type', '', 'default', 'Y', '0', 'admin', NOW(), '累计型：流量'),
(2, '电量参数', 'ELECTRIC', 'water_cumulative_point_type', '', 'default', 'N', '0', 'admin', NOW(), '累计型：电量');

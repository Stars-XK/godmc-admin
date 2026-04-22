-- 新增一组用于判断“增量型（增长量）”测点类型的字典
-- dict_type: water_incremental_point_type
-- dict_name: 增长量测点类型
-- 作用：微服务（如数据集成服务 micro-data-integration）可以通过查询该字典，来确定哪些类型的测点属于增量型（例如5分钟降雨量、脉冲数等），从而在 TDengine 聚合时采用 SUM(val) 替代 AVG(val)。

-- 1. 创建字典类型
INSERT INTO sys_dict_type (dict_name, dict_type, status, create_by, create_time, remark)
VALUES ('增长量测点类型', 'water_incremental_point_type', '0', 'admin', NOW(), '定义哪些测点类型属于增长量型（如降雨量、脉冲增量等）');

-- 2. 插入初始字典数据
-- 注意：dict_value 必须与 water_point_type 中的 dict_value 保持一致，才能起到过滤的作用。
INSERT INTO sys_dict_data (dict_sort, dict_label, dict_value, dict_type, css_class, list_class, is_default, status, create_by, create_time, remark)
VALUES 
(1, '降雨量', 'RAINFALL', 'water_incremental_point_type', '', 'default', 'Y', '0', 'admin', NOW(), '增长量型：降雨量');

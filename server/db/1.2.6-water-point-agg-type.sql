-- 1. 清理之前错误的“累计型”和“增量型”字典类型和数据
DELETE FROM sys_dict_data WHERE dict_type IN ('water_cumulative_point_type', 'water_incremental_point_type');
DELETE FROM sys_dict_type WHERE dict_type IN ('water_cumulative_point_type', 'water_incremental_point_type');

-- 2. 新增全新的“测点聚合模式”字典（water_point_agg_type）
INSERT INTO sys_dict_type (dict_name, dict_type, status, create_by, create_time, remark)
VALUES ('测点聚合模式', 'water_point_agg_type', '0', 'admin', NOW(), '测点在流计算中使用的聚合和插值模式');

INSERT INTO sys_dict_data (dict_sort, dict_label, dict_value, dict_type, css_class, list_class, is_default, status, create_by, create_time, remark)
VALUES 
(1, '瞬时', 'instantaneous', 'water_point_agg_type', '', 'default', 'Y', '0', 'admin', NOW(), '瞬时值，聚合取平均(AVG)，插值按线性(LINEAR)'),
(2, '累计', 'cumulative', 'water_point_agg_type', '', 'default', 'N', '0', 'admin', NOW(), '累计值，聚合取最新(LAST)，插值继承上一条(PREV)'),
(3, '增长量', 'incremental', 'water_point_agg_type', '', 'default', 'N', '0', 'admin', NOW(), '增长量，聚合取总和(SUM)，插值补0(VALUE,0)');

-- 3. 给 water_point 表新增 aggType 字段
ALTER TABLE water_point ADD COLUMN aggType VARCHAR(32) DEFAULT 'instantaneous' COMMENT '聚合模式: instantaneous/cumulative/incremental';

-- 4. 根据已有业务分类(type)回填聚合模式(aggType)
-- 默认全部设为 instantaneous（已经在新增字段时设了 DEFAULT 'instantaneous'，不过这里为求安全再 Update 一次）
UPDATE water_point SET aggType = 'instantaneous';

-- 提取出所有流量相关的为累计(cumulative)
UPDATE water_point SET aggType = 'cumulative' 
WHERE type IN ('FLOW', 'FLOW_INLET', 'FLOW_OUTLET', 'FLOW_TOTAL');

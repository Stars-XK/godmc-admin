-- 1. 清理之前错误的“累计型”和“增量型”字典类型和数据
DELETE FROM sys_dict_data WHERE dict_type IN ('water_cumulative_point_type', 'water_incremental_point_type');
DELETE FROM sys_dict_type WHERE dict_type IN ('water_cumulative_point_type', 'water_incremental_point_type');

-- 2. 新增全新的“测点聚合模式”字典（water_point_agg_type）
-- 为了支持多次执行不出错，先删除如果已经插入的这部分数据
DELETE FROM sys_dict_data WHERE dict_type = 'water_point_agg_type';
DELETE FROM sys_dict_type WHERE dict_type = 'water_point_agg_type';

INSERT INTO sys_dict_type (dict_name, dict_type, status, create_by, create_time, remark)
VALUES ('测点聚合模式', 'water_point_agg_type', '0', 'admin', NOW(), '测点在流计算中使用的聚合和插值模式');

INSERT INTO sys_dict_data (dict_sort, dict_label, dict_value, dict_type, css_class, list_class, is_default, status, create_by, create_time, remark)
VALUES 
(1, '瞬时', 'instantaneous', 'water_point_agg_type', '', 'default', 'Y', '0', 'admin', NOW(), '瞬时值，聚合取平均(AVG)，插值按线性(LINEAR)'),
(2, '累计', 'cumulative', 'water_point_agg_type', '', 'default', 'N', '0', 'admin', NOW(), '累计值，聚合取最新(LAST)，插值继承上一条(PREV)'),
(3, '增长量', 'incremental', 'water_point_agg_type', '', 'default', 'N', '0', 'admin', NOW(), '增长量，聚合取总和(SUM)，插值补0(VALUE,0)');

-- 3. 给 water_point 表新增 aggType 字段
-- 注意：因为 TypeORM multipleStatements 在跑多个 SQL 语句时不支持 DELIMITER，这里我们通过动态 SQL（PREPARE 语句）来判断并添加字段，避免报错。
SET @dbname = DATABASE();
SET @tablename = 'water_point';
SET @columnname = 'aggType';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  'ALTER TABLE water_point ADD COLUMN aggType VARCHAR(32) DEFAULT ''instantaneous'' COMMENT ''聚合模式: instantaneous/cumulative/incremental'';'
));
PREPARE addColumnStmt FROM @preparedStatement;
EXECUTE addColumnStmt;
DEALLOCATE PREPARE addColumnStmt;

-- 4. 根据已有业务分类(type)回填聚合模式(aggType)
UPDATE water_point SET aggType = 'instantaneous';
UPDATE water_point SET aggType = 'cumulative' WHERE type IN ('FLOW', 'FLOW_INLET', 'FLOW_OUTLET', 'FLOW_TOTAL');

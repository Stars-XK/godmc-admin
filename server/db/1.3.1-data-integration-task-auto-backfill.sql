SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'data_integration_task'
    AND COLUMN_NAME = 'auto_backfill'
);

SET @ddl := IF(
  @col_exists = 0,
  "ALTER TABLE data_integration_task ADD COLUMN auto_backfill TINYINT DEFAULT 0 COMMENT '是否自动触发历史补录 (0-否 1-是)' AFTER query_sql_or_topic",
  "SELECT 1"
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

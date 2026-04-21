SET @dbname = DATABASE();
SET @tablename = 'scada_revenue_user';
SET @columnname = 'zone_code';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE `scada_revenue_user` ADD COLUMN `zone_code` varchar(50) DEFAULT NULL COMMENT '所属分区编码' AFTER `user_type`;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
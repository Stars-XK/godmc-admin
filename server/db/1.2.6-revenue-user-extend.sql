-- 扩展营收基础用户信息表字段
SET @dbname = DATABASE();
SET @tablename = 'scada_revenue_user';
SET @columnname = 'contract_no';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE `scada_revenue_user` 
   ADD COLUMN `contract_no` varchar(50) DEFAULT NULL COMMENT '合同编号' AFTER `user_name`,
   ADD COLUMN `id_card` varchar(50) DEFAULT NULL COMMENT '证件号码/统一社会信用代码' AFTER `contract_no`,
   ADD COLUMN `balance` decimal(10,2) DEFAULT '0.00' COMMENT '账户余额' AFTER `arrears_amount`,
   ADD COLUMN `install_date` datetime DEFAULT NULL COMMENT '立户日期/安装日期' AFTER `status`;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
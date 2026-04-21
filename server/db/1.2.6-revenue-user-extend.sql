-- 扩展营收基础用户信息表字段
DELIMITER $$
CREATE PROCEDURE AddColumnsIfNotExist_1_2_6()
BEGIN
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'scada_revenue_user' AND COLUMN_NAME = 'contract_no') THEN
        ALTER TABLE `scada_revenue_user`
        ADD COLUMN `contract_no` varchar(50) DEFAULT NULL COMMENT '合同编号' AFTER `user_name`,
        ADD COLUMN `id_card` varchar(50) DEFAULT NULL COMMENT '证件号码/统一社会信用代码' AFTER `contract_no`,
        ADD COLUMN `balance` decimal(10,2) DEFAULT '0.00' COMMENT '账户余额' AFTER `arrears_amount`,
        ADD COLUMN `install_date` datetime DEFAULT NULL COMMENT '立户日期/安装日期' AFTER `status`;
    END IF;
END $$
DELIMITER ;

CALL AddColumnsIfNotExist_1_2_6();
DROP PROCEDURE AddColumnsIfNotExist_1_2_6;
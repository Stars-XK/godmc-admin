DELIMITER $$
CREATE PROCEDURE AddColumnsIfNotExist_1_2_7()
BEGIN
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'scada_revenue_user' AND COLUMN_NAME = 'zone_code') THEN
        ALTER TABLE `scada_revenue_user`
        ADD COLUMN `zone_code` varchar(50) DEFAULT NULL COMMENT '所属分区编码' AFTER `user_type`;
    END IF;
END $$
DELIMITER ;

CALL AddColumnsIfNotExist_1_2_7();
DROP PROCEDURE AddColumnsIfNotExist_1_2_7;
ALTER TABLE `scada_revenue_user`
ADD COLUMN `zone_code` varchar(50) DEFAULT NULL COMMENT '所属分区编码' AFTER `user_type`;
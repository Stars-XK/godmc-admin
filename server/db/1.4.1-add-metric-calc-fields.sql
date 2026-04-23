-- 1. 为 water_zone_metric_calc 补充缺失的 status 和 remark 字段
ALTER TABLE `water_zone_metric_calc` 
ADD COLUMN `status` char(1) DEFAULT '0' COMMENT '状态' AFTER `del_flag`,
ADD COLUMN `remark` varchar(500) DEFAULT NULL COMMENT '备注' AFTER `update_time`;

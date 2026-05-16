-- ============================================
-- 爆管分析专题 - 数据库迁移脚本
-- ============================================

CREATE TABLE IF NOT EXISTS `water_burst_event` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '事件ID',
  `zone_code` varchar(50) NOT NULL COMMENT '所属分区编码',
  `pipe_code` varchar(50) DEFAULT NULL COMMENT '可疑爆管管线编码',
  `burst_type` varchar(30) NOT NULL COMMENT '爆管类型(FLOW_DROP/PRESSURE_DROP/SUPPLY_DIFF)',
  `confidence` int DEFAULT 0 COMMENT '置信度(0-100)',
  `severity` tinyint DEFAULT 1 COMMENT '严重等级(1-4)',
  `flow_before` decimal(12,3) DEFAULT NULL COMMENT '异常前流量值',
  `flow_after` decimal(12,3) DEFAULT NULL COMMENT '异常后流量值',
  `pressure_before` decimal(10,3) DEFAULT NULL COMMENT '异常前压力值',
  `pressure_after` decimal(10,3) DEFAULT NULL COMMENT '异常后压力值',
  `anomaly_time` datetime DEFAULT NULL COMMENT '异常发生时间',
  `description` text COMMENT '分析描述',
  `affected_area_geojson` longtext COMMENT '影响面GeoJSON',
  `affected_pipes` text COMMENT '受影响管线JSON',
  `affected_users` int DEFAULT 0 COMMENT '受影响用户数估计',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志(0存在 1删除)',
  `status` char(1) DEFAULT '0' COMMENT '状态(0待确认 1已确认 2误报 3已修复)',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`),
  KEY `idx_burst_zone` (`zone_code`),
  KEY `idx_burst_status` (`status`),
  KEY `idx_burst_time` (`anomaly_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='【水务基础】爆管事件记录表';

CREATE TABLE IF NOT EXISTS `water_burst_area` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '影响面ID',
  `burst_event_id` bigint NOT NULL COMMENT '关联爆管事件ID',
  `zone_code` varchar(50) NOT NULL COMMENT '所属分区编码',
  `pipe_code` varchar(50) DEFAULT NULL COMMENT '爆管管线编码',
  `area_geojson` longtext COMMENT '影响面GeoJSON多边形',
  `area_size` decimal(12,2) DEFAULT 0 COMMENT '影响面积(m²)',
  `affected_pipe_count` int DEFAULT 0 COMMENT '受影响管线数',
  `affected_device_count` int DEFAULT 0 COMMENT '受影响设备数',
  `estimated_water_loss` decimal(10,2) DEFAULT 0 COMMENT '预估水损失(m³/h)',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志(0存在 1删除)',
  `status` char(1) DEFAULT '0' COMMENT '状态(0正常 1停用)',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`),
  KEY `idx_ba_burst_event` (`burst_event_id`),
  KEY `idx_ba_zone` (`zone_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='【水务基础】爆管影响面记录表';

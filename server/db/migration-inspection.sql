-- ============================================
-- 巡检上报管理系统 — 11张核心表
-- 创建时间: 2026-05-17
-- ============================================

-- 1. 巡检计划模板表
DROP TABLE IF EXISTS `inspection_plan`;
CREATE TABLE `inspection_plan` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `plan_name` varchar(100) NOT NULL COMMENT '计划名称',
  `plan_code` varchar(50) DEFAULT '' COMMENT '计划编码',
  `plan_type` varchar(20) DEFAULT 'daily' COMMENT '巡检类型（daily/weekly/monthly/quarterly/yearly/custom）',
  `schedule_cron` varchar(50) DEFAULT '' COMMENT '调度Cron表达式',
  `route_id` bigint DEFAULT NULL COMMENT '关联路线ID',
  `assigned_user_ids` json DEFAULT NULL COMMENT '指派的巡检员ID列表',
  `plan_status` varchar(20) DEFAULT 'draft' COMMENT '计划状态（draft/active/paused/archived）',
  `start_date` date DEFAULT NULL COMMENT '开始日期',
  `end_date` date DEFAULT NULL COMMENT '结束日期',
  `description` varchar(500) DEFAULT '' COMMENT '计划描述',
  `advance_days` int DEFAULT 7 COMMENT '提前生成天数',
  `overdue_hours` int DEFAULT 2 COMMENT '任务超时小时数',
  `dept_id` int DEFAULT NULL COMMENT '所属部门ID',
  `sort` int DEFAULT 0 COMMENT '排序号',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志',
  `status` char(1) DEFAULT '0' COMMENT '状态（0正常 1停用）',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`),
  KEY `idx_plan_code` (`plan_code`),
  KEY `idx_plan_status` (`plan_status`),
  KEY `idx_route_id` (`route_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【巡检管理】巡检计划模板表';


-- 2. 巡检任务实例表
DROP TABLE IF EXISTS `inspection_task`;
CREATE TABLE `inspection_task` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `task_code` varchar(30) NOT NULL COMMENT '任务编号（IT-YYYYMMDD-XXXXX）',
  `task_name` varchar(200) NOT NULL COMMENT '任务名称',
  `plan_id` bigint DEFAULT NULL COMMENT '关联计划ID',
  `route_id` bigint DEFAULT NULL COMMENT '关联路线ID',
  `assigned_user_id` int NOT NULL COMMENT '指派的巡检员ID',
  `assigned_user_name` varchar(50) DEFAULT '' COMMENT '巡检员姓名',
  `task_status` varchar(20) DEFAULT 'pending' COMMENT '任务状态（pending/accepted/in_progress/submitted/reviewed/closed/overdue）',
  `completion_ratio` int DEFAULT 0 COMMENT '完成比例（0-100）',
  `deadline` datetime NOT NULL COMMENT '截止时间',
  `overdue_escalated` char(1) DEFAULT '0' COMMENT '是否已超时升级（0否 1是）',
  `actual_start_time` datetime DEFAULT NULL COMMENT '实际开始时间',
  `actual_end_time` datetime DEFAULT NULL COMMENT '实际结束时间',
  `submitted_at` datetime DEFAULT NULL COMMENT '提交时间',
  `total_checkpoints` int DEFAULT 0 COMMENT '检查点总数',
  `completed_checkpoints` int DEFAULT 0 COMMENT '已完成检查点数',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志',
  `status` char(1) DEFAULT '0' COMMENT '状态（0正常 1停用）',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_task_code` (`task_code`),
  KEY `idx_task_status` (`task_status`),
  KEY `idx_assigned_user_id` (`assigned_user_id`),
  KEY `idx_plan_id` (`plan_id`),
  KEY `idx_deadline` (`deadline`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【巡检管理】巡检任务实例表';


-- 3. 巡检路线表
DROP TABLE IF EXISTS `inspection_route`;
CREATE TABLE `inspection_route` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `route_name` varchar(100) NOT NULL COMMENT '路线名称',
  `route_code` varchar(50) DEFAULT '' COMMENT '路线编码',
  `route_geom` longtext COMMENT '路线几何信息(GeoJSON LineString)',
  `checkpoint_order` json DEFAULT NULL COMMENT '检查点排序',
  `estimated_duration` int DEFAULT 0 COMMENT '预计耗时(分钟)',
  `total_distance` decimal(10,2) DEFAULT 0.00 COMMENT '总距离(米)',
  `geofence_radius` int DEFAULT 50 COMMENT '电子围栏缓冲半径(米)',
  `description` varchar(500) DEFAULT '' COMMENT '路线描述',
  `checkpoint_count` int DEFAULT 0 COMMENT '检查点数量',
  `dept_id` int DEFAULT NULL COMMENT '所属部门ID',
  `sort` int DEFAULT 0 COMMENT '排序号',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志',
  `status` char(1) DEFAULT '0' COMMENT '状态（0正常 1停用）',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`),
  KEY `idx_route_code` (`route_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【巡检管理】巡检路线表';


-- 4. 检查点表
DROP TABLE IF EXISTS `inspection_checkpoint`;
CREATE TABLE `inspection_checkpoint` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `checkpoint_name` varchar(100) NOT NULL COMMENT '检查点名称',
  `checkpoint_code` varchar(50) DEFAULT '' COMMENT '检查点编码',
  `checkpoint_type` varchar(30) DEFAULT 'visual' COMMENT '检查点类型（visual/meter_reading/equipment/env/safety/other）',
  `ref_type` varchar(30) DEFAULT NULL COMMENT '关联水务实体的类型（zone/station/device/pipe/point）',
  `ref_code` varchar(50) DEFAULT NULL COMMENT '关联水务实体的编码',
  `ref_name` varchar(100) DEFAULT '' COMMENT '关联水务实体的名称',
  `lng` varchar(30) DEFAULT '' COMMENT '经度',
  `lat` varchar(30) DEFAULT '' COMMENT '纬度',
  `address` varchar(255) DEFAULT '' COMMENT '位置描述',
  `sort_order` int DEFAULT 0 COMMENT '在路线中的排序号',
  `check_item_count` int DEFAULT 0 COMMENT '检查项数量',
  `dept_id` int DEFAULT NULL COMMENT '所属部门ID',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志',
  `status` char(1) DEFAULT '0' COMMENT '状态（0正常 1停用）',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`),
  KEY `idx_checkpoint_type` (`checkpoint_type`),
  KEY `idx_ref_type_code` (`ref_type`, `ref_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【巡检管理】检查点表';


-- 5. 检查项模板表
DROP TABLE IF EXISTS `inspection_check_item`;
CREATE TABLE `inspection_check_item` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `checkpoint_id` bigint NOT NULL COMMENT '所属检查点ID',
  `item_name` varchar(100) NOT NULL COMMENT '检查项名称',
  `item_type` varchar(20) DEFAULT 'normal' COMMENT '检查项类型（normal/threshold/select/photo/measurement/signature）',
  `require_photo` char(1) DEFAULT '0' COMMENT '是否要求拍照（0否 1是）',
  `threshold_min` decimal(12,4) DEFAULT NULL COMMENT '阈值下限',
  `threshold_max` decimal(12,4) DEFAULT NULL COMMENT '阈值上限',
  `threshold_unit` varchar(20) DEFAULT '' COMMENT '阈值单位',
  `select_options` json DEFAULT NULL COMMENT '选择项列表',
  `default_value` varchar(255) DEFAULT '' COMMENT '默认值',
  `is_required` char(1) DEFAULT '1' COMMENT '是否必填（0否 1是）',
  `sort_order` int DEFAULT 0 COMMENT '排序号',
  `description` varchar(500) DEFAULT '' COMMENT '检查项说明',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志',
  `status` char(1) DEFAULT '0' COMMENT '状态（0正常 1停用）',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`),
  KEY `idx_checkpoint_id` (`checkpoint_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【巡检管理】检查项模板表';


-- 6. 巡检记录表（核心上报数据）
DROP TABLE IF EXISTS `inspection_record`;
CREATE TABLE `inspection_record` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `task_id` bigint NOT NULL COMMENT '所属任务ID',
  `checkpoint_id` bigint NOT NULL COMMENT '所属检查点ID',
  `check_item_id` bigint NOT NULL COMMENT '所属检查项ID',
  `check_result` varchar(20) NOT NULL COMMENT '检查结果（normal/abnormal/skipped）',
  `item_value` text COMMENT '检查值（文本/数值）',
  `photo_urls` json DEFAULT NULL COMMENT '照片URL列表',
  `lng` varchar(30) DEFAULT '' COMMENT '拍照时经度',
  `lat` varchar(30) DEFAULT '' COMMENT '拍照时纬度',
  `altitude` decimal(8,2) DEFAULT NULL COMMENT '海拔高度(米)',
  `signature_url` varchar(255) DEFAULT '' COMMENT '电子签名图片URL',
  `sync_status` char(1) DEFAULT '0' COMMENT '同步状态（0已同步 1待同步）',
  `abnormal_desc` text COMMENT '异常描述',
  `submit_user_id` int NOT NULL COMMENT '提交人ID',
  `submitted_at` datetime DEFAULT NULL COMMENT '提交时间',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志',
  `status` char(1) DEFAULT '0' COMMENT '状态（0正常 1停用）',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`),
  KEY `idx_task_id` (`task_id`),
  KEY `idx_checkpoint_id` (`checkpoint_id`),
  KEY `idx_sync_status` (`sync_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【巡检管理】巡检记录表（核心上报数据）';


-- 7. 巡检问题表
DROP TABLE IF EXISTS `inspection_issue`;
CREATE TABLE `inspection_issue` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `task_id` bigint DEFAULT NULL COMMENT '所属任务ID',
  `record_id` bigint DEFAULT NULL COMMENT '关联巡检记录ID',
  `checkpoint_id` bigint DEFAULT NULL COMMENT '关联检查点ID',
  `issue_code` varchar(30) DEFAULT '' COMMENT '问题编号',
  `issue_title` varchar(200) NOT NULL COMMENT '问题标题',
  `issue_description` text COMMENT '问题描述',
  `severity` char(1) DEFAULT '3' COMMENT '严重程度（1严重 2重要 3一般 4观察）',
  `issue_status` varchar(20) DEFAULT 'open' COMMENT '问题状态（open/acknowledged/in_progress/resolved/closed/verified）',
  `linked_alarm_id` bigint DEFAULT NULL COMMENT '关联报警记录ID',
  `linked_work_order_id` varchar(50) DEFAULT NULL COMMENT '关联工单编号',
  `photo_urls` json DEFAULT NULL COMMENT '问题照片URL列表',
  `lng` varchar(30) DEFAULT '' COMMENT '经度',
  `lat` varchar(30) DEFAULT '' COMMENT '纬度',
  `reporter_id` int NOT NULL COMMENT '上报人ID',
  `reporter_name` varchar(50) DEFAULT '' COMMENT '上报人姓名',
  `assignee_id` int DEFAULT NULL COMMENT '处理人ID',
  `assignee_name` varchar(50) DEFAULT '' COMMENT '处理人姓名',
  `resolved_at` datetime DEFAULT NULL COMMENT '解决时间',
  `verified_at` datetime DEFAULT NULL COMMENT '验证时间',
  `resolution` text COMMENT '处理备注',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志',
  `status` char(1) DEFAULT '0' COMMENT '状态（0正常 1停用）',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`),
  KEY `idx_issue_status` (`issue_status`),
  KEY `idx_severity` (`severity`),
  KEY `idx_task_id` (`task_id`),
  KEY `idx_reporter_id` (`reporter_id`),
  KEY `idx_assignee_id` (`assignee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【巡检管理】巡检问题表';


-- 8. 巡检照片管理表
DROP TABLE IF EXISTS `inspection_photo`;
CREATE TABLE `inspection_photo` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `record_id` bigint DEFAULT NULL COMMENT '关联巡检记录ID',
  `task_id` bigint DEFAULT NULL COMMENT '关联任务ID',
  `upload_id` bigint DEFAULT NULL COMMENT '关联上传记录ID',
  `photo_url` varchar(500) NOT NULL COMMENT '照片URL',
  `thumbnail_url` varchar(500) DEFAULT '' COMMENT '缩略图URL',
  `photo_type` varchar(20) DEFAULT 'checkpoint' COMMENT '照片类型（checkpoint/issue/signature/other）',
  `annotation` json DEFAULT NULL COMMENT '照片标注信息',
  `lng` varchar(30) DEFAULT '' COMMENT '经度',
  `lat` varchar(30) DEFAULT '' COMMENT '纬度',
  `file_size` int DEFAULT 0 COMMENT '照片大小(字节)',
  `sort_order` int DEFAULT 0 COMMENT '排序号',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志',
  `status` char(1) DEFAULT '0' COMMENT '状态（0正常 1停用）',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`),
  KEY `idx_record_id` (`record_id`),
  KEY `idx_task_id` (`task_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【巡检管理】巡检照片管理表';


-- 9. GPS轨迹记录表
DROP TABLE IF EXISTS `inspection_location_track`;
CREATE TABLE `inspection_location_track` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `task_id` bigint NOT NULL COMMENT '关联任务ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `lng` varchar(30) NOT NULL COMMENT '经度',
  `lat` varchar(30) NOT NULL COMMENT '纬度',
  `altitude` decimal(8,2) DEFAULT NULL COMMENT '海拔高度(米)',
  `speed` decimal(6,2) DEFAULT 0.00 COMMENT '速度(km/h)',
  `heading` decimal(6,2) DEFAULT 0.00 COMMENT '方向角(度)',
  `accuracy` decimal(6,2) DEFAULT 0.00 COMMENT '定位精度(米)',
  `battery_level` int DEFAULT NULL COMMENT '电池电量百分比',
  `network_type` varchar(10) DEFAULT '' COMMENT '网络类型（wifi/4g/5g/offline）',
  `is_geofence_breach` char(1) DEFAULT '0' COMMENT '是否偏离电子围栏（0否 1是）',
  `recorded_at` datetime NOT NULL COMMENT '记录时间',
  `sync_status` char(1) DEFAULT '0' COMMENT '同步状态（0已同步 1待同步）',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志',
  `status` char(1) DEFAULT '0' COMMENT '状态（0正常 1停用）',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`),
  KEY `idx_task_user` (`task_id`, `user_id`),
  KEY `idx_recorded_at` (`recorded_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【巡检管理】GPS轨迹记录表';


-- 10. 审核记录表
DROP TABLE IF EXISTS `inspection_review`;
CREATE TABLE `inspection_review` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `task_id` bigint NOT NULL COMMENT '关联任务ID',
  `reviewer_id` int NOT NULL COMMENT '审核人ID',
  `reviewer_name` varchar(50) DEFAULT '' COMMENT '审核人姓名',
  `review_result` varchar(20) NOT NULL COMMENT '审核结果（approved/rejected/returned）',
  `review_comment` text COMMENT '审核意见',
  `reviewed_at` datetime NOT NULL COMMENT '审核时间',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志',
  `status` char(1) DEFAULT '0' COMMENT '状态（0正常 1停用）',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`),
  KEY `idx_task_id` (`task_id`),
  KEY `idx_reviewer_id` (`reviewer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【巡检管理】审核记录表';


-- 11. 巡检统计汇总表
DROP TABLE IF EXISTS `inspection_statistics`;
CREATE TABLE `inspection_statistics` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `stat_period` varchar(10) NOT NULL COMMENT '统计周期（day/week/month/quarter/year）',
  `stat_date` varchar(20) NOT NULL COMMENT '统计日期（YYYY-MM-DD / YYYY-WW / YYYY-MM）',
  `stat_type` varchar(20) NOT NULL COMMENT '统计类型（personal/dept/overall）',
  `user_id` int DEFAULT NULL COMMENT '用户ID',
  `user_name` varchar(50) DEFAULT '' COMMENT '用户姓名',
  `dept_id` int DEFAULT NULL COMMENT '部门ID',
  `dept_name` varchar(100) DEFAULT '' COMMENT '部门名称',
  `total_tasks` int DEFAULT 0 COMMENT '任务总数',
  `completed_tasks` int DEFAULT 0 COMMENT '已完成任务数',
  `overdue_tasks` int DEFAULT 0 COMMENT '超时任务数',
  `total_issues` int DEFAULT 0 COMMENT '发现的问题总数',
  `critical_issues` int DEFAULT 0 COMMENT '严重问题数',
  `resolved_issues` int DEFAULT 0 COMMENT '已解决问题数',
  `avg_completion_time` decimal(8,2) DEFAULT 0.00 COMMENT '平均完成时间(分钟)',
  `total_distance` decimal(10,2) DEFAULT 0.00 COMMENT '巡检总里程(公里)',
  `total_photos` int DEFAULT 0 COMMENT '照片总数',
  `completion_rate` decimal(5,2) DEFAULT 0.00 COMMENT '完成率(%)',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志',
  `status` char(1) DEFAULT '0' COMMENT '状态（0正常 1停用）',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`),
  KEY `idx_stat_period_date` (`stat_period`, `stat_date`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_dept_id` (`dept_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【巡检管理】巡检统计汇总表';

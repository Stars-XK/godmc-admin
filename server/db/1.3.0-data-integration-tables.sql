CREATE TABLE IF NOT EXISTS water_data_source (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '数据源ID',
  name VARCHAR(100) NOT NULL COMMENT '数据源名称',
  type VARCHAR(50) NOT NULL COMMENT '数据源类型',
  connection_str VARCHAR(500) NULL COMMENT '连接字符串或路径',
  username VARCHAR(100) NULL COMMENT '用户名/认证信息',
  password VARCHAR(100) NULL COMMENT '密码/凭证',
  status CHAR(1) NOT NULL DEFAULT '0' COMMENT '状态',
  del_flag CHAR(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  create_by VARCHAR(64) NOT NULL DEFAULT '' COMMENT '创建者',
  create_time DATETIME NULL COMMENT '创建时间',
  update_by VARCHAR(64) NOT NULL DEFAULT '' COMMENT '更新者',
  update_time DATETIME NULL COMMENT '更新时间',
  remark VARCHAR(500) NULL COMMENT '备注',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='【数据接入】数据源配置表';

CREATE TABLE IF NOT EXISTS water_data_task (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '任务ID',
  name VARCHAR(100) NOT NULL COMMENT '任务名称',
  source_id BIGINT NOT NULL COMMENT '绑定的数据源ID',
  cron_expression VARCHAR(100) NULL COMMENT '执行频率 (Cron表达式)',
  query_sql_or_topic TEXT NULL COMMENT '提取指令 (SQL/Topic/FilePath)',
  auto_backfill TINYINT NOT NULL DEFAULT 0 COMMENT '是否自动触发历史补录 (0-否 1-是)',
  status CHAR(1) NOT NULL DEFAULT '0' COMMENT '任务状态 (0正常 1停用)',
  del_flag CHAR(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  create_by VARCHAR(64) NOT NULL DEFAULT '' COMMENT '创建者',
  create_time DATETIME NULL COMMENT '创建时间',
  update_by VARCHAR(64) NOT NULL DEFAULT '' COMMENT '更新者',
  update_time DATETIME NULL COMMENT '更新时间',
  remark VARCHAR(500) NULL COMMENT '备注',
  PRIMARY KEY (id),
  KEY idx_water_data_task_source_id (source_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='【数据接入】数据接入任务配置表';

CREATE TABLE IF NOT EXISTS water_data_mapping (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '映射ID',
  task_id BIGINT NOT NULL COMMENT '所属任务ID',
  source_field VARCHAR(100) NOT NULL COMMENT '源数据字段名',
  target_field VARCHAR(50) NOT NULL COMMENT '目标TDengine字段',
  status CHAR(1) NOT NULL DEFAULT '0' COMMENT '状态',
  del_flag CHAR(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  create_by VARCHAR(64) NOT NULL DEFAULT '' COMMENT '创建者',
  create_time DATETIME NULL COMMENT '创建时间',
  update_by VARCHAR(64) NOT NULL DEFAULT '' COMMENT '更新者',
  update_time DATETIME NULL COMMENT '更新时间',
  remark VARCHAR(500) NULL COMMENT '备注',
  PRIMARY KEY (id),
  KEY idx_water_data_mapping_task_id (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='【数据接入】字段映射规则表';

-- 1.1.0-backup-config.sql
INSERT INTO sys_config (config_name, config_key, config_value, config_type, remark, create_time)
VALUES
('数据库备份周期', 'sys.backup.cron', '0 0 2 * * *', 'Y', '备份任务的Cron表达式，默认每天凌晨2点', NOW()),
('数据库备份最大保留数量', 'sys.backup.limit', '30', 'Y', '超出该数量后自动删除最旧的备份文件', NOW()),
('数据库备份存储路径', 'sys.backup.path', '../upload/backups', 'Y', '备份文件存放的相对目录', NOW());

CREATE TABLE IF NOT EXISTS sys_db_updates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL UNIQUE COMMENT 'SQL文件名',
  status VARCHAR(20) NOT NULL COMMENT '执行状态: SUCCESS/FAILED',
  error_msg TEXT COMMENT '失败时的错误信息',
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '执行时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据库自动更新记录表';

-- Insert Backup Menu
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
VALUES
('备份管理', 1, 9, 'backup', 'system/backup/index', 1, 0, 'C', '0', '0', 'system:backup:list', 'server', 'admin', NOW(), '', NULL, '数据库备份管理菜单');

-- Add specific permissions
SET @parentId = LAST_INSERT_ID();
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
VALUES
('创建备份', @parentId, 1, '', '', 1, 0, 'F', '0', '0', 'system:backup:create', '#', 'admin', NOW(), '', NULL, ''),
('恢复备份', @parentId, 2, '', '', 1, 0, 'F', '0', '0', 'system:backup:restore', '#', 'admin', NOW(), '', NULL, ''),
('删除备份', @parentId, 3, '', '', 1, 0, 'F', '0', '0', 'system:backup:remove', '#', 'admin', NOW(), '', NULL, '');
